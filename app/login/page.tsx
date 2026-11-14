"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Bodoni_Moda, Cormorant_Garamond, Manrope } from "next/font/google";
import { Hotel, Eye, EyeOff, User, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});
const sans = Manrope({ subsets: ["latin"] });

interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
}

const SLIDES = [
  {
    image: "/hotel.jpg",
    origin: "20% 50%",
    eyebrow: "Luxury Stays",
    title: "Because Stays Should Feel Like Destinations",
    text: "Find the perfect stay for your much awaited vacation.",
  },
  {
    image: "/hotel2.jpg",
    origin: "80% 40%",
    eyebrow: "Handpicked Suites",
    title: "Wake Up to Moments Worth Remembering",
    text: "Refined suites and residences, ready the moment you arrive.",
  },
  {
    image: "/hotel3.jpg",
    origin: "50% 80%",
    eyebrow: "Seamless Booking",
    title: "Your Escape, Effortlessly Arranged",
    text: "Reserve in minutes and let us take care of everything else.",
  },
];

const SLIDE_MS = 7000;

export default function LoginPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: false });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setActive((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [active]);

  if (isChecking) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiClient<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      setTokens(data.accessToken, data.refreshToken);
      router.push(CONFIG.ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-12 rounded-xl border-stone-900/15 bg-white/70 pl-11 text-stone-900 placeholder:text-stone-500 backdrop-blur-sm transition focus-visible:border-[#b8975f] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#d4b483]/40";

  const slide = SLIDES[active];

  return (
    <div className={`${sans.className} relative min-h-screen overflow-hidden bg-[#3a3126] text-white`}>
      <style>{`
        @keyframes kenburns {
          from { transform: scale(1.04) translate3d(0, 0, 0); }
          to   { transform: scale(1.2) translate3d(-2.5%, -2%, 0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50%      { transform: translate3d(60px, -40px, 0) scale(1.15); }
        }
        .kb      { animation: kenburns 26s ease-in-out infinite alternate; }
        .reveal  { opacity: 0; animation: fadeUp .9s cubic-bezier(.2,.7,.2,1) forwards; }
        .drift   { animation: drift 16s ease-in-out infinite; }
        .progress-fill { transform-origin: left; animation: progress ${SLIDE_MS}ms linear forwards; }
        input::-ms-reveal, input::-ms-clear { display: none; }
        @media (prefers-reduced-motion: reduce) {
          .kb, .reveal, .drift, .progress-fill { animation: none !important; opacity: 1; }
        }
      `}</style>


      {SLIDES.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-[1800ms] ease-in-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={s.image}
            alt=""
            fill
            sizes="100vw"
            priority={i === 0}
            className="kb object-cover"
            style={{ transformOrigin: s.origin }}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-[#3a3126]/80 via-[#3a3126]/35 to-[#3a3126]/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#3a3126]/70 via-transparent to-[#3a3126]/25" />
      <div className="drift pointer-events-none absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-[#d4b483]/15 blur-3xl" />
      <div className="relative z-10 flex min-h-screen">
        {/* LEFT: brand + rotating story (desktop only) */}
        <div className="hidden flex-1 flex-col justify-between p-12 lg:flex xl:p-16">
          <div className="reveal flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md">
              <Hotel className="h-5 w-5" />
            </div>
            <div>
              <span className={`${serif.className} block text-2xl font-medium leading-none tracking-[0.35em]`}>
                ÉLORIA
              </span>
              <span className="mt-1.5 block text-[10px] uppercase tracking-[0.25em] text-zinc-300/80">
                The Art of Exceptional Stays
              </span>
            </div>
          </div>

          <div className="max-w-xl">
            <div key={active} className="min-h-[250px]">
              <div className="reveal flex items-center gap-3" style={{ animationDelay: "0ms" }}>
                <span className="h-px w-10 bg-[#d4b483]" />
                <span className="text-xs font-medium uppercase tracking-[0.3em] text-[#d9bf8f]">
                  {slide.eyebrow}
                </span>
              </div>
              <h2
                className={`${serif.className} reveal mt-5 text-5xl font-normal leading-[1.1] xl:text-6xl`}
                style={{ animationDelay: "150ms" }}
              >
                {slide.title}
              </h2>
              <p
                className="reveal mt-5 max-w-md text-base leading-relaxed text-zinc-300"
                style={{ animationDelay: "300ms" }}
              >
                {slide.text}
              </p>
            </div>

            <div className="mt-8 flex gap-3">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="h-6 w-16 py-2.5"
                >
                  <span className="relative block h-[2px] w-full overflow-hidden rounded-full bg-white/25">
                    {i < active && <span className="absolute inset-0 bg-white/80" />}
                    {i === active && <span key={active} className="progress-fill absolute inset-0 bg-[#d4b483]" />}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-8 text-xs uppercase tracking-[0.2em] text-zinc-300/80">
            <span>Best Rate Guarantee</span>
            <span>24/7 Concierge</span>
            <span>Free Cancellation</span>
          </div>
        </div>

        {/* RIGHT: glass login card */}
        <div className="flex w-full items-center justify-center p-4 sm:p-8 lg:w-[560px] lg:shrink-0 lg:p-10">
          <div className="reveal relative w-full max-w-md rounded-t-[180px] rounded-b-[32px] border border-white/70 bg-[#f6f0e6]/80 px-8 pb-10 pt-24 text-stone-900 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:px-10">
            <div className="pointer-events-none absolute inset-2 rounded-t-[172px] rounded-b-[24px] border border-[#d4b483]/60" />

            <div className="reveal mb-8 text-center" style={{ animationDelay: "150ms" }}>
              {/* Mobile brand (left side is hidden on small screens) */}
              <div className="mb-5 flex flex-col items-center lg:hidden">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#d4b483]/50 bg-[#d4b483]/10">
                  <Hotel className="h-6 w-6 text-[#8a6a2f]" />
                </div>
                <span className={`${serif.className} mt-3 text-xl tracking-[0.35em]`}>ÉLORIA</span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.25em] text-stone-600">
                  The Art of Exceptional Stays
                </span>
              </div>

              <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#8a6a2f]">
                Exclusive Member Access
              </p>
              <h1 className={`${serif.className} mt-3 text-4xl font-normal leading-tight`}>
                Welcome Back, <em className="italic text-[#8a6a2f]">Traveler.</em>
              </h1>
              <p className="mt-2 text-sm text-stone-600">
                Your next extraordinary escape awaits. Sign in to continue.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="reveal space-y-2" style={{ animationDelay: "300ms" }}>
                <Label htmlFor="username" className="text-xs font-medium uppercase tracking-wider text-stone-700">
                  Username
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -transtone-y-1/2 text-stone-600" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="reveal space-y-2" style={{ animationDelay: "420ms" }}>
                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-stone-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -transtone-y-1/2 text-stone-600" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 z-10 -transtone-y-1/2 text-stone-600 transition hover:text-stone-900"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div
                className="reveal flex items-center justify-between text-xs text-stone-700"
                style={{ animationDelay: "520ms" }}
              >
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" className="h-3.5 w-3.5 accent-[#d4b483]" />
                  Keep me signed in
                </label>
                <Link href="#" className="text-[#8a6a2f] transition hover:text-stone-900">
                  Forgot your password?
                </Link>
              </div>

              <div className="reveal" style={{ animationDelay: "620ms" }}>
                <Button
                  type="submit"
                  disabled={loading}
                  className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#ecdcb4] via-[#d4b483] to-[#b8975f] text-sm font-semibold uppercase tracking-[0.2em] text-stone-900 shadow-lg shadow-[#d4b483]/20 transition hover:brightness-110 disabled:opacity-70"
                >
                  <span className="pointer-events-none absolute inset-0 -transtone-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 group-hover:transtone-x-full" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in to Éloria
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:transtone-x-1" />
                      </>
                    )}
                  </span>
                </Button>
              </div>

              <div className="reveal" style={{ animationDelay: "720ms" }}>
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-stone-900/15" />
                  <span className="text-[11px] uppercase tracking-[0.25em] text-stone-600">
                    Or continue with
                  </span>
                  <div className="h-px flex-1 bg-stone-900/15" />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-stone-900/15 bg-white text-sm font-medium text-stone-900 backdrop-blur-sm transition hover:border-stone-900/30 hover:bg-white/90"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
                      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
                      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-stone-900/15 bg-white text-sm font-medium text-stone-900 backdrop-blur-sm transition hover:border-stone-900/30 hover:bg-white/90"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                    </svg>
                    Apple
                  </button>
                </div>
              </div>

              <p
                className="reveal pt-2 text-center text-sm text-stone-600"
                style={{ animationDelay: "820ms" }}
              >
                New to ÉLORIA?{" "}
                <Link
                  href={CONFIG.ROUTES.REGISTER}
                  className="font-medium text-[#8a6a2f] underline-offset-4 transition hover:text-stone-900 hover:underline"
                >
                  Create an account.
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}