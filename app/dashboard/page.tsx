
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bodoni_Moda, Manrope } from "next/font/google";
import {
  Hotel, LogOut, BedDouble, Users, Heart, Utensils,
  Sparkles, Headphones, ArrowRight, ArrowUpRight, Gem, Minus, Plus, X, Loader2, Tag,
  Eye, Pencil, Trash2, RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { clearTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";

const serif = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const sans = Manrope({ subsets: ["latin"] });

type View = "home" | "hotels" | "bookings";

const NAV: { label: string; key: View }[] = [
  { label: "Home", key: "home" },
  { label: "Rooms", key: "hotels" },
  { label: "My Bookings", key: "bookings" },
];

type RoomType = {
  roomTypeId: number;
  typeName: string;
  description: string;
  capacity: number;
  nightlyRate: number;
  availableRooms?: number;
};

type Booking = {
  reservationId: number;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  status: string;
  specialRequest?: string;
  totalAmount?: number;
  paymentStatus?: string;
  rooms: {
    roomNumber: string;
    typeName: string;
    assignedRate: number;
  }[];
};

const SAMPLE_ROOMS: RoomType[] = [
  {
    roomTypeId: 1,
    typeName: "Standard Room",
    description: "Comfortable room with city views and everything you need.",
    capacity: 2,
    nightlyRate: 3500,
  },
  {
    roomTypeId: 2,
    typeName: "Deluxe Room",
    description: "Spacious room with a king bed and a private balcony.",
    capacity: 3,
    nightlyRate: 5800,
  },
  {
    roomTypeId: 3,
    typeName: "Executive Suite",
    description: "Separate living area, premium amenities and lounge access.",
    capacity: 4,
    nightlyRate: 9800,
  },
];



const isAuthError = (m: string) =>
  /unauthor|401|jwt|token|forbidden/i.test(m || "");

const PHOTOS = ["/hotel.jpg", "/hotel2.jpg", "/hotel3.jpg"];

const peso = (n: number) =>
  "₱" + Number(n || 0).toLocaleString("en-PH");

const fmt = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

const inp =
  "h-11 w-full rounded-xl border border-[#e6dcc8] bg-white px-3 text-sm outline-none transition focus:border-[#b8975f] focus:ring-2 focus:ring-[#d4b483]/30";

const modalInp =
  "h-14 w-full rounded-2xl border border-[#e6dcc8] bg-white px-4 text-base outline-none transition placeholder:text-stone-400 focus:border-[#b8975f] focus:ring-2 focus:ring-[#d4b483]/30";

const statusStyle = (st: string) =>
  ({
    CONFIRMED: "bg-emerald-100 text-emerald-800",
    PENDING: "bg-amber-100 text-amber-800",
    CANCELLED: "bg-stone-200 text-stone-600",
    COMPLETED: "bg-sky-100 text-sky-800",
  } as Record<string, string>)[st?.toUpperCase()] ||
  "bg-stone-100 text-stone-700";



const PERKS = [
  {
    icon: BedDouble,
    title: "Luxurious Rooms",
    text: "Beautifully designed rooms with everything you need.",
  },
  {
    icon: Utensils,
    title: "Fine Dining",
    text: "Fresh, local ingredients crafted with care.",
  },
  {
    icon: Sparkles,
    title: "Spa & Wellness",
    text: "Rejuvenating treatments for mind and body.",
  },
  {
    icon: Headphones,
    title: "24/7 Concierge",
    text: "Personal assistance whenever you need it.",
  },
];

const gold = "text-[#8a6a2f]";

const goldBtn =
  "bg-gradient-to-r from-[#ecdcb4] via-[#d4b483] to-[#b8975f] text-stone-900 shadow-md transition hover:brightness-110";

const tile =
  "rounded-2xl border border-[#e6dcc8] bg-[#fbf8f2]";

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");

  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(new Date().toISOString().split("T")[0]);
  }, []);

  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.round(
            (+new Date(checkOut) - +new Date(checkIn)) / 86400000
          )
        )
      : 0;

  const canSearch = nights > 0;

  const [view, setView] = useState<View>("home");
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [usingSample, setUsingSample] = useState(false);
  const [roomsError, setRoomsError] = useState("");

  const filteredRoomTypes =
    roomTypeFilter === "all"
      ? roomTypes
      : roomTypes.filter(
          (rt) => String(rt.roomTypeId) === roomTypeFilter
        );

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({ checkInDate: "", checkOutDate: "", numberOfGuests: 2, specialRequest: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const [selected, setSelected] = useState<RoomType | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    idNumber: "",
    specialRequest: "",
  });

  const [promo, setPromo] = useState<{
    code: string;
    pct: number;
    minNights: number;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (view !== "hotels") return;

    let cancelled = false;

    (async () => {
      setRoomsLoading(true);

      try {
        const path = canSearch
          ? `/reservation/room-types/available?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
          : "/reservation/room-types";

        const data = await apiClient<RoomType[]>(path, {
          requiresAuth: true,
        });

        if (!cancelled) {
          setRoomTypes(data);
          setUsingSample(false);
          setRoomsError("");
        }
      } catch (err: any) {
        if (!cancelled) {
          setRoomTypes(SAMPLE_ROOMS);
          setUsingSample(true);
          setRoomsError(err?.message || "");
        }
      } finally {
        if (!cancelled) setRoomsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [view, canSearch, checkIn, checkOut, guests]);

  useEffect(() => {
    if (view !== "bookings") return;

    let cancelled = false;

    (async () => {
      setBookingsLoading(true);
      setBookingsError("");

      try {
        const data = await apiClient<Booking[]>("/reservation/me", {
          requiresAuth: true,
        });

        if (!cancelled) {
          setBookings(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setBookingsError(
            err.message || "Could not load your bookings."
          );
        }
      } finally {
        if (!cancelled) setBookingsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [view]);

  if (isChecking) {
    return (
      <div
        className={`${sans.className} flex min-h-screen items-center justify-center bg-[#f3ece0]`}
      >
        <p className={`text-xs uppercase tracking-[0.3em] ${gold}`}>
          Verifying session...
        </p>
      </div>
    );
  }

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  const rate = selected?.nightlyRate ?? 0;
  const subtotal = nights * rate;

  const discount =
    promo && nights >= promo.minNights
      ? Math.round((subtotal * promo.pct) / 100)
      : 0;

  const total = subtotal - discount;

  const openBooking = (rt: RoomType) => {
    setFormError("");
    setSelected(rt);
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!canSearch) {
      return setFormError(
        "Please choose valid check-in and check-out dates."
      );
    }

    if (selected && guests > selected.capacity) {
      return setFormError(
        `This room fits up to ${selected.capacity} guests.`
      );
    }

    setSubmitting(true);

    try {
      await apiClient("/reservation/book", {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({
          ...form,
          roomTypeId: selected?.roomTypeId,
          checkIn,
          checkOut,
          numberOfGuests: guests,
          promoCode: discount > 0 ? promo?.code : undefined,
        }),
      });

      setSelected(null);

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        idNumber: "",
        specialRequest: "",
      });

      setNotice(
        "Your reservation was submitted. You can track it here."
      );

      setView("bookings");
    } catch (err: any) {
      setFormError(
        err.message || "Could not create the reservation."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cancelBooking = async (id: number) => {
    if (!window.confirm("Cancel this reservation?")) return;

    try {
      await apiClient(`/reservation/${id}/cancel`, {
        method: "PATCH",
        requiresAuth: true,
      });

      setBookings((list) =>
        list.map((b) =>
          b.reservationId === id
            ? { ...b, status: "CANCELLED" }
            : b
        )
      );

      setNotice("Reservation cancelled.");
    } catch (err: any) {
      setNotice(err.message || "Could not cancel this reservation.");
    }
  };

  const refreshBookings = async () => {
    setBookingsLoading(true);
    setBookingsError("");
    try {
      const data = await apiClient<Booking[]>("/reservation/me", { requiresAuth: true });
      setBookings(data);
    } catch (err: any) {
      setBookingsError(err.message || "Could not load your bookings.");
    } finally {
      setBookingsLoading(false);
    }
  };

  const openBookingEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({
      checkInDate: booking.checkInDate?.slice(0, 10) || "",
      checkOutDate: booking.checkOutDate?.slice(0, 10) || "",
      numberOfGuests: Number(booking.numberOfGuests) || 1,
      specialRequest: booking.specialRequest || "",
    });
  };

  const saveBookingEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    const editNights = Math.round((new Date(editForm.checkOutDate).getTime() - new Date(editForm.checkInDate).getTime()) / 86400000);
    if (!editForm.checkInDate || !editForm.checkOutDate || editNights <= 0) {
      setNotice("Check-out must be after check-in.");
      return;
    }
    setSavingEdit(true);
    try {
      await apiClient(`/reservation/${editingBooking.reservationId}`, {
        method: "PUT",
        requiresAuth: true,
        body: JSON.stringify({
          check_in_date: editForm.checkInDate,
          check_out_date: editForm.checkOutDate,
          number_of_guests: editForm.numberOfGuests,
          special_request: editForm.specialRequest,
        }),
      });
      setEditingBooking(null);
      setNotice("Reservation updated successfully.");
      await refreshBookings();
    } catch (err: any) {
      setNotice(err.message || "Could not update this reservation.");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteBooking = async (id: number) => {
    if (!window.confirm(`Delete reservation #${id}? This action cannot be undone.`)) return;
    try {
      await apiClient(`/reservation/${id}`, { method: "DELETE", requiresAuth: true });
      setBookings((list) => list.filter((b) => b.reservationId !== id));
      setNotice("Reservation deleted successfully.");
    } catch (err: any) {
      setNotice(err.message || "Could not delete this reservation. Check whether related reservation_room or payment records must be deleted first.");
    }
  };




const renderHeader = (onPhoto: boolean) => (
  <>
    <header
      className={`relative z-10 flex items-center justify-between px-6 py-5 sm:px-8 ${
        onPhoto ? "text-white" : "border-b border-[#e6dcc8]"
      }`}
    >
      <button
        onClick={() => setView("home")}
        className="flex items-center gap-3"
      >
        <Hotel
          className={`h-6 w-6 ${
            onPhoto ? "text-[#ecdcb4]" : gold
          }`}
        />
        <span className={`${serif.className} text-xl tracking-[0.35em]`}>
          ÉLORIA
        </span>
      </button>

      <nav className="hidden items-center gap-2 text-xs uppercase tracking-[0.15em] lg:flex">
        {NAV.map((n) => (
          <button
            key={n.key}
            onClick={() => setView(n.key)}
            className={`flex h-10 items-center rounded-full px-5 text-[11px] font-semibold uppercase tracking-[0.15em] transition ${
              view === n.key
                ? goldBtn
                : onPhoto
                  ? "text-white/90 hover:bg-white/10 hover:text-[#ecdcb4]"
                  : "text-stone-700 hover:bg-[#f3ece0] hover:text-[#8a6a2f]"
            }`}
          >
            {n.label}
          </button>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className={`flex h-10 items-center gap-2 rounded-full px-5 text-[11px] font-semibold uppercase tracking-[0.2em] ${goldBtn}`}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </header>

    <nav
      className={`relative z-10 flex gap-2 overflow-x-auto px-6 pb-3 text-[11px] uppercase tracking-[0.15em] lg:hidden ${
        onPhoto ? "text-white" : ""
      }`}
    >
      {NAV.map((n) => (
        <button
          key={n.key}
          onClick={() => setView(n.key)}
          className={`flex h-9 shrink-0 items-center rounded-full px-4 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
            view === n.key
              ? goldBtn
              : onPhoto
                ? "text-white/90 hover:bg-white/10"
                : "text-stone-700 hover:bg-[#f3ece0]"
          }`}
        >
          {n.label}
        </button>
      ))}
    </nav>
  </>
);


  const pageTitle = (
    eyebrow: string,
    a: string,
    b: string,
    sub?: string
  ) => (
    <div className="mb-8">
      <p
        className={`text-xs font-medium uppercase tracking-[0.3em] ${gold}`}
      >
        {eyebrow}
      </p>

      <h1 className={`${serif.className} mt-3 text-4xl sm:text-5xl`}>
        {a} <em className={gold}>{b}</em>
      </h1>

      {sub && (
        <p className="mt-3 max-w-xl text-sm text-stone-600">
          {sub}
        </p>
      )}
    </div>
  );

  return (
    <div
      className={`${sans.className} min-h-screen w-full bg-[#f3ece0] p-3 sm:p-6 text-stone-900`}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: none; }
        }
        .reveal {
          opacity: 0;
          animation: fadeUp .9s cubic-bezier(.2,.7,.2,1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal {
            animation: none !important;
            opacity: 1;
          }
        }
      `}</style>

      <div className="min-h-screen w-full rounded-[24px] bg-white p-0 shadow-2xl shadow-[#8a6a2f]/10">
        {view === "home" ? (
          <>
            <section className="relative flex min-h-[650px] w-full flex-col overflow-hidden rounded-[24px] lg:min-h-[750px]">
              <Image
                src="/hotel4.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-black/10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25" />

              {renderHeader(true)}

              <div className="reveal relative z-10 flex flex-1 items-center px-6 pb-24 text-white sm:px-10">
                <div>
                  <h1 className={`${serif.className} text-6xl leading-[1.02] sm:text-7xl`}>
                    Elegance.
                    <br />
                    Comfort.
                    <br />
                    <em className="text-[#ecdcb4]">You.</em>
                  </h1>

                  <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/85">
                    A sanctuary where every stay feels effortless and beautifully yours.
                  </p>

                  <button
                    onClick={() => setView("hotels")}
                    className={`mt-7 flex h-11 items-center gap-2 rounded-full px-7 text-[11px] font-semibold uppercase tracking-[0.2em] ${goldBtn}`}
                  >
                    Explore Stay
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="relative z-10 hidden items-center gap-6 px-10 pb-24 text-xs text-white/90 lg:absolute lg:bottom-0 lg:right-0 lg:flex">
                {[
                  [Gem, "Refined"],
                  [Heart, "Authentic"],
                  [Sparkles, "Restful"],
                ].map(([Icon, l]: any) => (
                  <span
                    key={l}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4 text-[#ecdcb4]" />
                    {l}
                  </span>
                ))}
              </div>
            </section>

            <div className="space-y-16 px-3 py-14 sm:px-8">
              <section className="grid items-center gap-6 lg:grid-cols-[0.8fr_270px_1.7fr] lg:gap-0">
                <div className="lg:pr-8">
                  <h2 className={`${serif.className} text-4xl leading-tight sm:text-5xl`}>
                    Discover <em className={gold}>True</em>
                    <br />
                    Relaxation
                  </h2>

                  <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-600">
                    From cozy stays and nourishing cuisine to wellness and outdoor adventures, everything you need to unwind.
                  </p>

                  <button className="mt-6 h-10 rounded-full border border-stone-900/25 px-6 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:border-[#b8975f]">
                    Our Story
                  </button>
                </div>

                <div className="relative z-10 rounded-2xl border border-[#e6dcc8] bg-[#f6f0e6] p-4 shadow-xl shadow-[#8a6a2f]/15">
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src="/hotel3.jpg"
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </div>

                    <h3 className={`${serif.className} text-lg leading-tight`}>
                      Plan Your <em className={gold}>Escape</em>
                    </h3>
                  </div>

                  <div className="mt-3 space-y-2">
                    <label className="flex items-center justify-between gap-2 rounded-xl border border-[#e6dcc8] bg-white px-3 py-2">
                      <span className="w-full">
                        <span className="block text-[9px] uppercase tracking-[0.2em] text-stone-500">
                          Check-in
                        </span>

                        <input
                          type="date"
                          min={today || undefined}
                          value={checkIn}
                          onChange={(e) => {
                            setCheckIn(e.target.value);
                            if (checkOut && e.target.value >= checkOut) {
                              setCheckOut("");
                            }
                          }}
                          className="w-full bg-transparent text-sm font-semibold outline-none"
                        />
                      </span>
                    </label>

                    <label className="flex items-center justify-between gap-2 rounded-xl border border-[#e6dcc8] bg-white px-3 py-2">
                      <span className="w-full">
                        <span className="block text-[9px] uppercase tracking-[0.2em] text-stone-500">
                          Check-out
                        </span>

                        <input
                          type="date"
                          min={checkIn || today || undefined}
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="w-full bg-transparent text-sm font-semibold outline-none"
                        />
                      </span>
                    </label>

                    <div className="flex items-center justify-between gap-2 rounded-xl border border-[#e6dcc8] bg-white px-3 py-2">
                      <span>
                        <span className="block text-[9px] uppercase tracking-[0.2em] text-stone-500">
                          Guests
                        </span>
                        <span className="text-sm font-semibold">
                          {guests} {guests === 1 ? "Guest" : "Guests"}
                        </span>
                      </span>

                      <span className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label="Fewer guests"
                          onClick={() => setGuests((g) => Math.max(1, g - 1))}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#d4b483] transition hover:bg-[#d4b483]/20"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          aria-label="More guests"
                          onClick={() => setGuests((g) => Math.min(10, g + 1))}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#d4b483] transition hover:bg-[#d4b483]/20"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </div>
                  </div>

                  <p className={`mt-3 text-center text-[11px] font-medium ${canSearch ? gold : "text-stone-400"}`}>
                    {canSearch
                      ? `${nights} ${nights === 1 ? "night" : "nights"} · ${guests} ${guests === 1 ? "guest" : "guests"}`
                      : "Select your dates"}
                  </p>

                  <button
                    disabled={!canSearch}
                    onClick={() => setView("hotels")}
                    className={`mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.2em] ${goldBtn} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100`}
                  >
                    Check Availability
                  </button>
                </div>

                <div className="relative z-0 h-72 overflow-hidden rounded-3xl shadow-xl shadow-black/10 lg:-ml-10 lg:h-[400px]">
                  <Image
                    src="/hotel2.jpg"
                    alt=""
                    fill
                    sizes="55vw"
                    className="object-cover"
                  />
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {PERKS.map(({ icon: Icon, title, text }) => (
                  <div
                    key={title}
                    className={`${tile} flex gap-4 p-5`}
                  >
                    <Icon className={`h-6 w-6 shrink-0 ${gold}`} />

                    <div className="flex-1">
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-stone-600">
                        {text}
                      </p>
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-stone-400" />
                  </div>
                ))}
              </section>

            </div>
          </>
        ) : (
          <>
            {renderHeader(false)}

            <div className="px-4 py-10 sm:px-10">
              {notice && (
                <div className="mb-6 flex items-center justify-between rounded-2xl border border-[#d4b483] bg-[#d4b483]/15 px-4 py-3 text-sm">
                  <span>{notice}</span>
                  <button
                    onClick={() => setNotice("")}
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {view === "hotels" && (
                <div>
                  {pageTitle(
                    "Rooms & Suites",
                    "Find Your",
                    "Perfect Room",
                    "Pick your dates to see what is available."
                  )}

                  <div className="mb-8 grid gap-3 rounded-2xl border border-[#e6dcc8] bg-[#fbf8f2] p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.7fr_1fr_auto]">
                    <label>
                      <span className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-stone-500">
                        Check-in
                      </span>
                      <input
                        type="date"
                        min={today || undefined}
                        value={checkIn}
                        className={inp}
                        onChange={(e) => {
                          setCheckIn(e.target.value);
                          if (checkOut && e.target.value >= checkOut) {
                            setCheckOut("");
                          }
                        }}
                      />
                    </label>

                    <label>
                      <span className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-stone-500">
                        Check-out
                      </span>
                      <input
                        type="date"
                        min={checkIn || today || undefined}
                        value={checkOut}
                        className={inp}
                        onChange={(e) => setCheckOut(e.target.value)}
                      />
                    </label>

                    <label>
                      <span className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-stone-500">
                        Guests
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={guests}
                        className={inp}
                        onChange={(e) =>
                          setGuests(Math.max(1, Number(e.target.value) || 1))
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-stone-500">
                        Room Options
                      </span>

                      <select
                        value={roomTypeFilter}
                        onChange={(e) => setRoomTypeFilter(e.target.value)}
                        className={`${inp} cursor-pointer`}
                      >
                        <option value="all">All Room Types</option>

                        {roomTypes.map((rt) => (
                          <option
                            key={rt.roomTypeId}
                            value={String(rt.roomTypeId)}
                          >
                            {rt.typeName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        if (!canSearch) {
                          setNotice("Please select valid check-in and check-out dates.");
                          return;
                        }
                        setNotice("");
                      }}
                      className={`h-11 self-end rounded-full px-6 text-[11px] font-semibold uppercase tracking-[0.12em] ${goldBtn}`}
                    >
                      Check Availability
                    </button>
                  </div>

                  {promo && (
                    <p className="mb-4 flex items-center gap-2 text-sm">
                      <Tag className={`h-4 w-4 ${gold}`} />
                      Offer <b>{promo.code}</b> ({promo.pct}% off, {promo.minNights}+ nights)
                      <button
                        onClick={() => setPromo(null)}
                        className="text-xs text-stone-500 underline"
                      >
                        remove
                      </button>
                    </p>
                  )}

                  {usingSample && (
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
                      <span>
                        {isAuthError(roomsError)
                          ? "Your session is not valid or has expired, so sample rooms are shown. Please log in again."
                          : `Could not load rooms${roomsError ? ` (${roomsError})` : ""}. Sample rooms are shown, so booking will not work.`}
                      </span>

                      {isAuthError(roomsError) && (
                        <button
                          onClick={handleLogout}
                          className="rounded-full border border-amber-400 px-3 py-1 font-semibold"
                        >
                          Log in again
                        </button>
                      )}
                    </div>
                  )}

                  {roomsLoading ? (
                    <p className="flex items-center gap-2 text-sm text-stone-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading rooms...
                    </p>
                  ) : filteredRoomTypes.length === 0 ? (
                    <p className="text-sm text-stone-500">
                      {roomTypes.length === 0
                        ? "No rooms available for these dates."
                        : "No rooms found for the selected room type."}
                    </p>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredRoomTypes.map((rt, i) => (
                        <article
                          key={rt.roomTypeId}
                          className="overflow-hidden rounded-2xl border border-[#e6dcc8] bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#8a6a2f]/15"
                        >
                          <div className="relative h-48">
                            <Image
                                src={
                                 rt.typeName === "Standard Room"
                                   ? "/standard.jpg"
                                   : rt.typeName === "Deluxe Room"
                                     ? "/deluxe.jpg"
                                     : rt.typeName === "Executive Suite"
                                       ? "/executive.jpg"
                                       : "/hotel.jpg"
                                }
                                alt={rt.typeName}
                                fill
                                sizes="33vw"
                                className="object-cover"
                                />
                            </div>
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className={`${serif.className} text-xl`}>
                                {rt.typeName}
                              </h3>

                              <span className={`${serif.className} text-lg ${gold}`}>
                                {peso(rt.nightlyRate)}
                                <span className="text-[10px] text-stone-500">
                                  {" "}/night
                                </span>
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-stone-600">
                              {rt.description}
                            </p>

                            <div className="mt-3 flex gap-4 text-xs text-stone-600">
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                Up to {rt.capacity}
                              </span>

                              {rt.availableRooms !== undefined && (
                                <span className="flex items-center gap-1">
                                  <BedDouble className="h-3.5 w-3.5" />
                                  {rt.availableRooms} left
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => openBooking(rt)}
                              disabled={rt.availableRooms === 0}
                              className={`mt-4 h-11 w-full rounded-full text-[11px] font-semibold uppercase tracking-[0.2em] ${goldBtn} disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {rt.availableRooms === 0
                                ? "Sold out"
                                : "Book this room"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {view === "bookings" && (
                <div>
                  <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className={`text-xs font-medium uppercase tracking-[0.3em] ${gold}`}>Reservation Management</p>
                      <h1 className={`${serif.className} mt-2 text-4xl sm:text-5xl`}>My <em className={gold}>Bookings</em></h1>
                      <p className="mt-2 text-sm text-stone-600">View, update, and manage your reservations.</p>
                    </div>
                    <button onClick={refreshBookings} disabled={bookingsLoading} className="flex h-10 items-center gap-2 rounded-full border border-[#e6dcc8] px-4 text-xs text-stone-600 transition hover:bg-[#fbf8f2] disabled:opacity-50">
                      <RefreshCw className={`h-3.5 w-3.5 ${bookingsLoading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                  </div>

                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#eee7db] bg-[#fdfbf7] px-5 py-4">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500">Total Reservations</p>
                      <p className={`${serif.className} mt-1 text-3xl ${gold}`}>{bookings.length}</p>
                    </div>
                    <button onClick={() => setView("hotels")} className={`flex h-10 items-center gap-2 rounded-full px-5 text-[10px] font-semibold uppercase tracking-[0.15em] ${goldBtn}`}>
                      <Plus className="h-3.5 w-3.5" /> New Booking
                    </button>
                  </div>

                  {bookingsError ? (
                    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{isAuthError(bookingsError) ? "Your session has expired. Please log in again." : bookingsError}</div>
                  ) : bookingsLoading && bookings.length === 0 ? (
                    <p className="flex items-center gap-2 py-6 text-sm text-stone-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading your bookings...</p>
                  ) : bookings.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#d4b483] p-10 text-center">
                      <p className={`${serif.className} text-2xl`}>No bookings yet</p>
                      <p className="mt-2 text-sm text-stone-600">Your reservations will appear here.</p>
                      <button onClick={() => setView("hotels")} className={`mt-5 h-10 rounded-full px-6 text-[10px] font-semibold uppercase tracking-[0.15em] ${goldBtn}`}>Browse rooms</button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-[#eee7db] bg-white">
                      <table className="w-full min-w-[850px] border-collapse text-left text-xs">
                        <thead className="bg-[#fbf9f4] text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                          <tr>
                            <th className="px-4 py-4">ID</th><th className="px-4 py-4">Room</th><th className="px-4 py-4">Check-in</th><th className="px-4 py-4">Check-out</th><th className="px-4 py-4">Guests</th><th className="px-4 py-4">Status</th><th className="px-4 py-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((b) => (
                            <tr key={b.reservationId} className="border-t border-[#f0eadf] text-stone-600 hover:bg-[#fdfbf7]">
                              <td className="px-4 py-4 font-medium text-stone-700">#{b.reservationId}</td>
                              <td className="px-4 py-4">{b.rooms?.[0]?.typeName || "Room"}</td>
                              <td className="px-4 py-4">{fmt(b.checkInDate)}</td>
                              <td className="px-4 py-4">{fmt(b.checkOutDate)}</td>
                              <td className="px-4 py-4">{b.numberOfGuests}</td>
                              <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide ${statusStyle(b.status)}`}>{b.status}</span></td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button title="View reservation" aria-label="View reservation" onClick={() => setViewingBooking(b)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e6dcc8] text-stone-600 hover:bg-[#f5efe4]"><Eye className="h-3.5 w-3.5" /></button>
                                  <button title="Edit reservation" aria-label="Edit reservation" onClick={() => openBookingEdit(b)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e6dcc8] text-stone-600 hover:bg-[#f5efe4]"><Pencil className="h-3.5 w-3.5" /></button>
                                  <button title="Delete reservation" aria-label="Delete reservation" onClick={() => deleteBooking(b.reservationId)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e6dcc8] text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="border-t border-[#f0eadf] px-4 py-3 text-[10px] text-stone-500">Use View to view a reservation, Update to edit its details, and Delete to permanently remove it.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {viewingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setViewingBooking(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div><p className={`text-[10px] uppercase tracking-[0.25em] ${gold}`}>Reservation Details</p><h2 className={`${serif.className} mt-1 text-3xl`}>Booking #{viewingBooking.reservationId}</h2></div>
              <button onClick={() => setViewingBooking(null)} aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-stone-500">Room</span><b>{viewingBooking.rooms?.[0]?.typeName || "Room"}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">Check-in</span><b>{fmt(viewingBooking.checkInDate)}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">Check-out</span><b>{fmt(viewingBooking.checkOutDate)}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">Guests</span><b>{viewingBooking.numberOfGuests}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">Status</span><b>{viewingBooking.status}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">Payment</span><b>{viewingBooking.paymentStatus || "UNPAID"}</b></div>
              <div><p className="text-stone-500">Special request</p><p className="mt-1">{viewingBooking.specialRequest || "None"}</p></div>
              <div className="flex justify-between border-t border-[#eee7db] pt-3"><span className="text-stone-500">Total</span><b className={gold}>{peso(viewingBooking.totalAmount || 0)}</b></div>
            </div>
          </div>
        </div>
      )}

      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => !savingEdit && setEditingBooking(null)}>
          <form onSubmit={saveBookingEdit} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><p className={`text-[10px] uppercase tracking-[0.25em] ${gold}`}>Reservation Management</p><h2 className={`${serif.className} mt-1 text-3xl`}>Edit Booking</h2></div><button type="button" onClick={() => setEditingBooking(null)} aria-label="Close"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label><span className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-stone-500">Check-in</span><input required type="date" min={today || undefined} value={editForm.checkInDate} onChange={(e) => setEditForm({ ...editForm, checkInDate: e.target.value })} className={modalInp} /></label>
              <label><span className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-stone-500">Check-out</span><input required type="date" min={editForm.checkInDate || today || undefined} value={editForm.checkOutDate} onChange={(e) => setEditForm({ ...editForm, checkOutDate: e.target.value })} className={modalInp} /></label>
              <label className="sm:col-span-2"><span className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-stone-500">Guests</span><input required type="number" min={1} max={10} value={editForm.numberOfGuests} onChange={(e) => setEditForm({ ...editForm, numberOfGuests: Math.max(1, Number(e.target.value) || 1) })} className={modalInp} /></label>
              <label className="sm:col-span-2"><span className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-stone-500">Special request</span><textarea value={editForm.specialRequest} onChange={(e) => setEditForm({ ...editForm, specialRequest: e.target.value })} className={`${modalInp} h-24 py-3`} placeholder="Optional request" /></label>
            </div>
            <button type="submit" disabled={savingEdit} className={`mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full text-xs font-semibold uppercase tracking-[0.15em] ${goldBtn}`}>{savingEdit ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}</button>
          </form>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <form
            onSubmit={submitBooking}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-7 shadow-2xl sm:p-10"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${gold}`}>
                  Reserve
                </p>

                <h2 className={`${serif.className} mt-1 text-4xl`}>
                  {selected.typeName}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <label className="col-span-1">
                <span className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-stone-500">
                  Check-in
                </span>

                <input
                  type="date"
                  required
                  min={today || undefined}
                  value={checkIn}
                  className={modalInp}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (checkOut && e.target.value >= checkOut) {
                      setCheckOut("");
                    }
                  }}
                />
              </label>

              <label className="col-span-1">
                <span className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-stone-500">
                  Check-out
                </span>

                <input
                  type="date"
                  required
                  min={checkIn || today || undefined}
                  value={checkOut}
                  className={modalInp}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </label>

              <label className="col-span-1">
                <span className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-stone-500">
                  Guests
                </span>

                <input
                  type="number"
                  required
                  min={1}
                  max={selected.capacity}
                  value={guests}
                  className={modalInp}
                  onChange={(e) =>
                    setGuests(Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="First name"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                className={modalInp}
              />

              <input
                required
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
                className={modalInp}
              />

              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className={modalInp}
              />

              <input
                required
                placeholder="Phone"
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                className={modalInp}
              />

              <input
                placeholder="Address (optional)"
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
                className={`${modalInp} sm:col-span-2`}
              />

              <input
                placeholder="ID number (optional)"
                value={form.idNumber}
                onChange={(e) =>
                  setForm({ ...form, idNumber: e.target.value })
                }
                className={`${modalInp} sm:col-span-2`}
              />

              <textarea
                placeholder="Special request (optional)"
                value={form.specialRequest}
                onChange={(e) =>
                  setForm({ ...form, specialRequest: e.target.value })
                }
                className={`${inp} h-20 py-2 sm:col-span-2`}
              />
            </div>

            <div className="mt-6 space-y-2 rounded-3xl bg-[#fbf8f2] p-5 text-sm">
              <div className="flex justify-between">
                <span>
                  {peso(rate)} × {nights}{" "}
                  {nights === 1 ? "night" : "nights"}
                </span>
                <span>{peso(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Offer {promo?.code}</span>
                  <span>−{peso(discount)}</span>
                </div>
              )}

              <div className={`flex justify-between border-t border-[#e6dcc8] pt-3 ${serif.className} text-2xl ${gold}`}>
                <span>Total</span>
                <span>{peso(total)}</span>
              </div>
            </div>

            {formError && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !canSearch}
              className={`mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full text-xs font-semibold uppercase tracking-[0.2em] ${goldBtn} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Confirm reservation"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
