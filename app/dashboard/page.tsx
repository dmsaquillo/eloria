"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bodoni_Moda, Manrope } from "next/font/google";
import {
  Hotel, LogOut, MapPin, BedDouble, Users, Calendar, Heart, Star, Utensils,
  Sparkles, Headphones, ArrowRight, ArrowUpRight, Minus, Plus, X, Tag,
} from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { clearTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";

const serif = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const sans = Manrope({ subsets: ["latin"] });

type View = "home" | "hotels" | "destinations" | "offers" | "bookings";

const NAV: { label: string; key: View }[] = [
  { label: "Home", key: "home" },
  { label: "Hotels", key: "hotels" },
  { label: "Destinations", key: "destinations" },
  { label: "Offers", key: "offers" },
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

/* Sample rooms (design preview only, no server needed) */
const SAMPLE_ROOMS: RoomType[] = [
  { roomTypeId: 1, typeName: "Standard Room", description: "Comfortable room with city views and everything you need.", capacity: 2, nightlyRate: 3500 },
  { roomTypeId: 2, typeName: "Deluxe Room", description: "Spacious room with a king bed and a private balcony.", capacity: 3, nightlyRate: 5800 },
  { roomTypeId: 3, typeName: "Executive Suite", description: "Separate living area, premium amenities and lounge access.", capacity: 4, nightlyRate: 9800 },
];

const OFFERS = [
  { code: "STAY3", title: "Stay Longer, Save More", text: "20% off when you stay 3 nights or more.", pct: 20, minNights: 3, img: "/hotel3.jpg" },
  { code: "WELCOME10", title: "Member Welcome", text: "10% off your next reservation.", pct: 10, minNights: 1, img: "/hotel.jpg" },
  { code: "GETAWAY15", title: "Weekend Getaway", text: "15% off stays of 2 nights or more.", pct: 15, minNights: 2, img: "/hotel2.jpg" },
];

const peso = (n: number) => "₱" + Number(n || 0).toLocaleString("en-PH");

const inp =
  "h-11 w-full rounded-xl border border-[#e6dcc8] bg-white px-3 text-sm outline-none transition focus:border-[#b8975f] focus:ring-2 focus:ring-[#d4b483]/30";

const DESTINATIONS = [
  { name: "Naga", sub: "Heritage & Culture", img: "/naga.jpg" },
  { name: "Manila", sub: "City Elegance", img: "/Manila.jpg" },
  { name: "Palawan", sub: "Island Serenity", img: "/palawan.jpg" },
  { name: "Boracay", sub: "Beachfront Bliss", img: "/boracay.jpg" },
];

const HOTELS = [
  { name: "Heritage Grand Hotel", place: "Naga City, Camarines Sur", price: "₱6,800", img: "/hotel.jpg", beds: 2, guests: 4 },
  { name: "Skyline Hotel", place: "Makati, Manila", price: "₱12,500", img: "/hotel2.jpg", beds: 2, guests: 3 },
  { name: "Bayview Hotel", place: "Puerto Princesa, Palawan", price: "₱9,800", img: "/hotel3.jpg", beds: 2, guests: 4 },
  { name: "Oceanfront Hotel", place: "Boracay, Aklan", price: "₱14,300", img: "/hotel.jpg", beds: 2, guests: 4 },
];

const PERKS = [
  { icon: BedDouble, title: "Luxurious Rooms", text: "Beautifully designed rooms with everything you need." },
  { icon: Utensils, title: "Fine Dining", text: "Fresh, local ingredients crafted with care." },
  { icon: Sparkles, title: "Spa & Wellness", text: "Rejuvenating treatments for mind and body." },
  { icon: Headphones, title: "24/7 Concierge", text: "Personal assistance whenever you need it." },
];

const gold = "text-[#8a6a2f]";

const goldBtn =
  "bg-gradient-to-r from-[#ecdcb4] via-[#d4b483] to-[#b8975f] text-stone-900 shadow-md transition hover:brightness-110";

const tile = "rounded-2xl border border-[#e6dcc8] bg-[#fbf8f2]";

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  const [location, setLocation] = useState("Naga");
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
      ? Math.max(0, Math.round((+new Date(checkOut) - +new Date(checkIn)) / 86400000))
      : 0;

  const canSearch = nights > 0;

  const [view, setView] = useState<View>("home");
  const [heroOk, setHeroOk] = useState(true);

  const roomTypes = SAMPLE_ROOMS;
  const filteredRoomTypes =
    roomTypeFilter === "all"
      ? roomTypes
      : roomTypes.filter((rt) => String(rt.roomTypeId) === roomTypeFilter);

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

  const [promo, setPromo] = useState<{ code: string; pct: number; minNights: number } | null>(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  if (isChecking) {
    return (
      <div className={`${sans.className} flex min-h-screen items-center justify-center bg-[#f3ece0]`}>
        <p className={`text-xs uppercase tracking-[0.3em] ${gold}`}>Verifying session...</p>
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
    promo && nights >= promo.minNights ? Math.round((subtotal * promo.pct) / 100) : 0;

  const total = subtotal - discount;

  const openBooking = (rt: RoomType) => {
    setFormError("");
    setSelected(rt);
  };

  // Design preview: the form does not send anything to the server
  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!canSearch) {
      return setFormError("Please choose valid check-in and check-out dates.");
    }
    if (selected && guests > selected.capacity) {
      return setFormError(`This room fits up to ${selected.capacity} guests.`);
    }

    setSelected(null);
    setNotice("Booking is turned off for now. This is a design preview.");
  };

  const claimOffer = (o: (typeof OFFERS)[number]) => {
    setPromo({ code: o.code, pct: o.pct, minNights: o.minNights });
    setNotice(`Offer ${o.code} applied. Choose a room to use it.`);
    setView("hotels");
  };

  const renderHeader = (onPhoto: boolean) => (
    <>
      <header
        className={`relative z-10 flex items-center justify-between px-6 py-5 sm:px-8 ${
          onPhoto ? "text-white" : "border-b border-[#e6dcc8]"
        }`}
      >
        <button onClick={() => setView("home")} className="flex items-center gap-3">
          <Hotel className={`h-6 w-6 ${onPhoto ? "text-[#ecdcb4]" : gold}`} />
          <span className={`${serif.className} text-xl tracking-[0.35em]`}>ÉLORIA</span>
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

  const pageTitle = (eyebrow: string, a: string, b: string, sub?: string) => (
    <div className="mb-8">
      <p className={`text-xs font-medium uppercase tracking-[0.3em] ${gold}`}>{eyebrow}</p>

      <h1 className={`${serif.className} mt-3 text-4xl sm:text-5xl`}>
        {a} <em className={gold}>{b}</em>
      </h1>

      {sub && <p className="mt-3 max-w-xl text-sm text-stone-600">{sub}</p>}
    </div>
  );

  return (
    <div className={`${sans.className} min-h-screen w-full bg-[#f3ece0] p-3 sm:p-6 text-stone-900`}>
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
              {/* Fallback background: shows if the photo is missing */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1f1812] via-[#3a2d1e] to-[#6b5230]" />

              {heroOk && (
                <Image
                  src="/main-picture.jpg"
                  alt=""
                  fill
                  priority
                  quality={90}
                  sizes="100vw"
                  className="object-cover"
                  onError={() => setHeroOk(false)}
                />
              )}

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
            </section>

            <section className="relative z-20 -mt-16 grid grid-cols-2 gap-3 px-3 sm:px-6 lg:grid-cols-4">
              {DESTINATIONS.map((d, i) => (
                <div
                  key={d.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => setView("hotels")}
                  className="group relative h-44 cursor-pointer overflow-hidden rounded-2xl border-[3px] border-white shadow-xl shadow-black/10"
                >
                  <Image src={d.img} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" quality={90} loading="eager" className="object-cover transition duration-700 group-hover:scale-110" />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  <div className="absolute inset-x-4 bottom-3 flex items-end justify-between text-white">
                    <div>
                      <p className={`${serif.className} text-lg leading-tight`}>{d.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-white/80">{d.sub}</p>
                    </div>

                    <span className={`${serif.className} text-sm text-[#ecdcb4]`}>0{i + 1}</span>
                  </div>
                </div>
              ))}
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
                      <Image src="/hotel3.jpg" alt="" fill sizes="44px" className="object-cover" />
                    </div>

                    <h3 className={`${serif.className} text-lg leading-tight`}>
                      Plan Your <em className={gold}>Escape</em>
                    </h3>
                  </div>

                  <div className="mt-3 space-y-2">
                    <label className="flex items-center justify-between gap-2 rounded-xl border border-[#e6dcc8] bg-white px-3 py-2">
                      <span>
                        <span className="block text-[9px] uppercase tracking-[0.2em] text-stone-500">Location</span>

                        <select
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full bg-transparent text-sm font-semibold outline-none"
                        >
                          {["Naga", "Manila", "Palawan", "Boracay"].map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </span>
                    </label>

                    <label className="flex items-center justify-between gap-2 rounded-xl border border-[#e6dcc8] bg-white px-3 py-2">
                      <span className="w-full">
                        <span className="block text-[9px] uppercase tracking-[0.2em] text-stone-500">Check-in</span>

                        <input
                          type="date"
                          min={today || undefined}
                          value={checkIn}
                          onChange={(e) => {
                            setCheckIn(e.target.value);
                            if (checkOut && e.target.value >= checkOut) setCheckOut("");
                          }}
                          className="w-full bg-transparent text-sm font-semibold outline-none"
                        />
                      </span>
                    </label>

                    <label className="flex items-center justify-between gap-2 rounded-xl border border-[#e6dcc8] bg-white px-3 py-2">
                      <span className="w-full">
                        <span className="block text-[9px] uppercase tracking-[0.2em] text-stone-500">Check-out</span>

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
                        <span className="block text-[9px] uppercase tracking-[0.2em] text-stone-500">Guests</span>
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
                      ? `${nights} ${nights === 1 ? "night" : "nights"} · ${guests} ${guests === 1 ? "guest" : "guests"} · ${location}`
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
                  <Image src="/frontdesk.jpg" alt="" fill sizes="(min-width: 1024px) 55vw, 100vw" quality={90} className="object-cover" />
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {PERKS.map(({ icon: Icon, title, text }) => (
                  <div key={title} className={`${tile} flex gap-4 p-5`}>
                    <Icon className={`h-6 w-6 shrink-0 ${gold}`} />

                    <div className="flex-1">
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-stone-600">{text}</p>
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-stone-400" />
                  </div>
                ))}
              </section>

              <section>
                <div className="mb-6 flex items-end justify-between">
                  <h2 className={`${serif.className} text-3xl`}>
                    Featured <em className={gold}>Stays</em>
                  </h2>

                  <button onClick={() => setView("hotels")} className={`flex items-center gap-1 text-sm ${gold}`}>
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {HOTELS.map((h) => (
                    <article
                      key={h.name}
                      className="group overflow-hidden rounded-2xl border border-[#e6dcc8] bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#8a6a2f]/15"
                    >
                      <div className="relative h-44">
                        <Image src={h.img} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" quality={90} className="object-cover transition duration-700 group-hover:scale-105" />

                        <button
                          aria-label="Save"
                          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90"
                        >
                          <Heart className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold">{h.name}</h3>
                          <span className={`${serif.className} text-lg ${gold}`}>{h.price}</span>
                        </div>

                        <p className="mt-1 flex items-center gap-1 text-xs text-stone-500">
                          <MapPin className="h-3 w-3" />
                          {h.place}
                        </p>

                        <div className="mt-3 flex items-center justify-between border-t border-[#efe6d4] pt-3 text-xs text-stone-600">
                          <span className="flex items-center gap-1">
                            <BedDouble className="h-3.5 w-3.5" />
                            {h.beds} Beds
                          </span>

                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {h.guests} Guests
                          </span>

                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-[#d4b483] text-[#d4b483]" />
                            4.9
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="grid overflow-hidden rounded-3xl bg-[#f6f0e6] ring-1 ring-[#d4b483]/50 md:grid-cols-[1.1fr_1fr]">
                <div className="relative h-56 md:h-auto">
                  <Image src="/hotel3.jpg" alt="" fill sizes="(min-width: 768px) 50vw, 100vw" quality={90} className="object-cover" />
                </div>

                <div className="p-8 sm:p-10">
                  <p className={`text-[11px] font-medium uppercase tracking-[0.3em] ${gold}`}>Special Offer</p>

                  <h2 className={`${serif.className} mt-3 text-4xl leading-tight`}>
                    Stay Longer,
                    <br />
                    <em className={gold}>Save More</em>
                  </h2>

                  <p className="mt-3 text-sm text-stone-600">
                    Enjoy up to 20% off when you stay 3 nights or more.
                  </p>

                  <button
                    onClick={() => setView("offers")}
                    className={`mt-6 h-11 rounded-full px-7 text-[11px] font-semibold uppercase tracking-[0.2em] ${goldBtn}`}
                  >
                    View Offers
                  </button>
                </div>
              </section>

              <footer className="flex flex-col justify-between gap-2 border-t border-[#e6dcc8] pt-6 text-xs text-stone-500 sm:flex-row">
                <span>© 2026 ÉLORIA. All rights reserved.</span>
                <span>The Art of Exceptional Stays</span>
              </footer>
            </div>
          </>
        ) : (
          <>
            {renderHeader(false)}

            <div className="px-4 py-10 sm:px-10">
              {notice && (
                <div className="mb-6 flex items-center justify-between rounded-2xl border border-[#d4b483] bg-[#d4b483]/15 px-4 py-3 text-sm">
                  <span>{notice}</span>
                  <button onClick={() => setNotice("")} aria-label="Dismiss">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {view === "hotels" && (
                <div>
                  {pageTitle("Rooms & Suites", "Find Your", "Perfect Room", "Pick your dates to see what is available.")}

                  <div className="mb-8 grid gap-3 rounded-2xl border border-[#e6dcc8] bg-[#fbf8f2] p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.7fr_1fr_auto]">
                    <label>
                      <span className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-stone-500">Check-in</span>
                      <input
                        type="date"
                        min={today || undefined}
                        value={checkIn}
                        className={inp}
                        onChange={(e) => {
                          setCheckIn(e.target.value);
                          if (checkOut && e.target.value >= checkOut) setCheckOut("");
                        }}
                      />
                    </label>

                    <label>
                      <span className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-stone-500">Check-out</span>
                      <input
                        type="date"
                        min={checkIn || today || undefined}
                        value={checkOut}
                        className={inp}
                        onChange={(e) => setCheckOut(e.target.value)}
                      />
                    </label>

                    <label>
                      <span className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-stone-500">Guests</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={guests}
                        className={inp}
                        onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                      />
                    </label>

                    <label>
                      <span className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-stone-500">Room Options</span>

                      <select
                        value={roomTypeFilter}
                        onChange={(e) => setRoomTypeFilter(e.target.value)}
                        className={`${inp} cursor-pointer`}
                      >
                        <option value="all">All Room Types</option>

                        {roomTypes.map((rt) => (
                          <option key={rt.roomTypeId} value={String(rt.roomTypeId)}>
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
                      <button onClick={() => setPromo(null)} className="text-xs text-stone-500 underline">
                        remove
                      </button>
                    </p>
                  )}

                  {filteredRoomTypes.length === 0 ? (
                    <p className="text-sm text-stone-500">No rooms found for the selected room type.</p>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredRoomTypes.map((rt) => (
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
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              quality={90}
                              className="object-cover"
                            />
                          </div>

                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className={`${serif.className} text-xl`}>{rt.typeName}</h3>

                              <span className={`${serif.className} text-lg ${gold}`}>
                                {peso(rt.nightlyRate)}
                                <span className="text-[10px] text-stone-500"> /night</span>
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-stone-600">{rt.description}</p>

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
                              {rt.availableRooms === 0 ? "Sold out" : "Book this room"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {view === "destinations" && (
                <div>
                  {pageTitle("Where to next", "Our", "Destinations", "Choose a destination to start planning your stay.")}

                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {DESTINATIONS.map((d) => (
                      <button
                        key={d.name}
                        onClick={() => setView("hotels")}
                        className="group relative h-72 overflow-hidden rounded-2xl text-left"
                      >
                        <Image src={d.img} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" quality={90} className="object-cover transition duration-700 group-hover:scale-110" />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                        <div className="absolute inset-x-4 bottom-4 text-white">
                          <p className={`${serif.className} text-2xl`}>{d.name}</p>
                          <p className="text-[10px] uppercase tracking-[0.15em] text-white/80">{d.sub}</p>
                          <span className="mt-3 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-[#ecdcb4]">
                            Book a stay
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {view === "offers" && (
                <div>
                  {pageTitle(
                    "Member perks",
                    "Special",
                    "Offers",
                    "Claim an offer, then choose your room. Discounts apply automatically at booking."
                  )}

                  <div className="grid gap-5 md:grid-cols-3">
                    {OFFERS.map((o) => (
                      <article key={o.code} className="overflow-hidden rounded-2xl border border-[#e6dcc8] bg-[#fbf8f2]">
                        <div className="relative h-40">
                          <Image src={o.img} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" quality={90} className="object-cover" />
                        </div>

                        <div className="p-5">
                          <p className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${gold}`}>Code {o.code}</p>

                          <h3 className={`${serif.className} mt-2 text-2xl`}>{o.title}</h3>

                          <p className="mt-2 text-sm text-stone-600">{o.text}</p>

                          <button
                            onClick={() => claimOffer(o)}
                            className={`mt-5 h-11 w-full rounded-full text-[11px] font-semibold uppercase tracking-[0.2em] ${goldBtn}`}
                          >
                            Claim offer
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {view === "bookings" && (
                <div>
                  {pageTitle("Your reservations", "My", "Bookings")}

                  <div className="rounded-2xl border border-dashed border-[#d4b483] p-10 text-center">
                    <p className={`${serif.className} text-2xl`}>No bookings yet</p>

                    <p className="mt-2 text-sm text-stone-600">Your reservations will appear here.</p>

                    <button
                      onClick={() => setView("hotels")}
                      className={`mt-5 h-11 rounded-full px-7 text-[11px] font-semibold uppercase tracking-[0.2em] ${goldBtn}`}
                    >
                      Browse rooms
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <form
            onSubmit={submitBooking}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${gold}`}>Reserve</p>

                <h2 className={`${serif.className} mt-1 text-3xl`}>{selected.typeName}</h2>
              </div>

              <button type="button" onClick={() => setSelected(null)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <label className="col-span-1">
                <span className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-stone-500">Check-in</span>

                <input
                  type="date"
                  required
                  min={today || undefined}
                  value={checkIn}
                  className={inp}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (checkOut && e.target.value >= checkOut) setCheckOut("");
                  }}
                />
              </label>

              <label className="col-span-1">
                <span className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-stone-500">Check-out</span>

                <input
                  type="date"
                  required
                  min={checkIn || today || undefined}
                  value={checkOut}
                  className={inp}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </label>

              <label className="col-span-1">
                <span className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-stone-500">Guests</span>

                <input
                  type="number"
                  required
                  min={1}
                  max={selected.capacity}
                  value={guests}
                  className={inp}
                  onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className={inp}
              />

              <input
                required
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className={inp}
              />

              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inp}
              />

              <input
                required
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inp}
              />

              <input
                placeholder="Address (optional)"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={`${inp} sm:col-span-2`}
              />

              <input
                placeholder="ID number (optional)"
                value={form.idNumber}
                onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                className={`${inp} sm:col-span-2`}
              />

              <textarea
                placeholder="Special request (optional)"
                value={form.specialRequest}
                onChange={(e) => setForm({ ...form, specialRequest: e.target.value })}
                className={`${inp} h-20 py-2 sm:col-span-2`}
              />
            </div>

            <div className="mt-5 space-y-1 rounded-2xl bg-[#fbf8f2] p-4 text-sm">
              <div className="flex justify-between">
                <span>
                  {peso(rate)} × {nights} {nights === 1 ? "night" : "nights"}
                </span>
                <span>{peso(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Offer {promo?.code}</span>
                  <span>−{peso(discount)}</span>
                </div>
              )}

              <div className={`flex justify-between border-t border-[#e6dcc8] pt-2 ${serif.className} text-xl ${gold}`}>
                <span>Total</span>
                <span>{peso(total)}</span>
              </div>
            </div>

            {formError && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
            )}

            <button
              type="submit"
              disabled={!canSearch}
              className={`mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full text-xs font-semibold uppercase tracking-[0.2em] ${goldBtn} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Confirm reservation
            </button>
          </form>
        </div>
      )}
    </div>
  );
}