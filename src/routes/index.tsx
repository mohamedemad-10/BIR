import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AYAT SAMY🎂" },
      { name: "description", content: "بطاقة تهنئة فاخرة بعيد ميلاد آيات — من صديقك محمد" },
      { property: "og:title", content: "كل عام وأنتِ بخير يا آيات" },
      { property: "og:description", content: "احتفال خاص بعيد ميلاد آيات" },
      { property: "og:image", content: "🎂" },
      { property: "twitter:image", content: "🎂" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@300;400;600;700;900&display=swap",
      },
    ],
  }),
  component: BirthdayPage,
});

/* ---------- Small sound helper (WebAudio, no assets) ---------- */
function useSfx() {
  const ctxRef = useRef<AudioContext | null>(null);
  const get = () => {
    if (!ctxRef.current) {
      const AC = (window.AudioContext || (window as any).webkitAudioContext);
      if (AC) ctxRef.current = new AC();
    }
    return ctxRef.current;
  };
  const beep = (freq: number, dur = 0.15, type: OscillatorType = "sine", vol = 0.15) => {
    const ctx = get();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  };
  return {
    pop: () => beep(800, 0.08, "triangle", 0.12),
    sparkle: () => { beep(1200, 0.1, "sine"); setTimeout(() => beep(1800, 0.1, "sine"), 80); },
    whoosh: () => beep(200, 0.3, "sawtooth", 0.08),
    chime: () => { [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 0.25, "sine", 0.1), i * 90)); },
  };
}

/* ---------- Background layers ---------- */
function Stars() {
  const stars = useMemo(
    () => Array.from({ length: 22 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: Math.random() * 2 + 1,
      d: Math.random() * 3,
      dur: 2.5 + Math.random() * 3,
    })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      {stars.map((st, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.s,
            height: st.s,
            boxShadow: `0 0 ${st.s * 3}px rgba(255, 220, 180, 0.9)`,
            animation: `twinkle ${st.dur}s ease-in-out ${st.d}s infinite`,
            willChange: "opacity, transform",
          }}
        />
      ))}
    </div>
  );
}

function FloatingBalloons({ onPop }: { onPop: (x: number, y: number) => void }) {
  const balloons = useMemo(
    () => Array.from({ length: 5 }, (_, i) => ({
      id: i,
      left: 8 + Math.random() * 84,
      delay: Math.random() * 15,
      dur: 22 + Math.random() * 10,
      color: ["#f9a8c4", "#f7d488", "#ffb3c6", "#ffd6a5", "#e8b4d4"][i % 5],
      size: 42 + Math.random() * 18,
    })),
    []
  );
  const [popped, setPopped] = useState<Set<number>>(new Set());
  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden" aria-hidden>
      {balloons.map((b) => (
        popped.has(b.id) ? null : (
          <button
            key={b.id}
            onClick={(e) => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              onPop(r.left + r.width / 2, r.top + r.height / 2);
              setPopped((p) => new Set(p).add(b.id));
            }}
            className="pointer-events-auto absolute cursor-pointer"
            style={{
              left: `${b.left}%`,
              bottom: 0,
              width: b.size,
              height: b.size * 1.2,
              animation: `balloon-float ${b.dur}s linear ${b.delay}s infinite`,
              willChange: "transform",
            }}
            aria-label="بالونة"
          >
            <svg viewBox="0 0 40 60" className="h-full w-full drop-shadow-lg">
              <ellipse cx="20" cy="22" rx="16" ry="20" fill={b.color} opacity="0.9" />
              <ellipse cx="14" cy="15" rx="4" ry="6" fill="#fff" opacity="0.5" />
              <path d="M20 42 L18 46 L22 46 Z" fill={b.color} />
              <path d="M20 46 Q22 52 19 58 Q17 55 20 46" stroke="#c9a86b" strokeWidth="0.6" fill="none" />
            </svg>
          </button>
        )
      ))}
    </div>
  );
}

/* ---------- Confetti / hearts / fireworks ---------- */
type Particle = { id: number; x: number; y: number; color: string; kind: "confetti" | "heart" | "star"; dx: number };

function ParticleLayer({ items }: { items: Particle[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40" aria-hidden>
      {items.map((p) => {
        if (p.kind === "confetti") {
          return (
            <span
              key={p.id}
              className="absolute"
              style={{
                left: p.x,
                top: p.y,
                width: 8,
                height: 12,
                background: p.color,
                borderRadius: 2,
                ["--x" as any]: `${p.dx}px`,
                animation: "confetti-fall 3.5s ease-in forwards",
                willChange: "transform, opacity",
              }}
            />
          );
        }
        return (
          <span
            key={p.id}
            className="absolute text-2xl"
            style={{
              left: p.x,
              top: p.y,
              color: p.color,
              ["--hx" as any]: `${p.dx}px`,
              animation: "heart-rise 1.4s ease-out forwards",
              willChange: "transform, opacity",
            }}
          >
            {p.kind === "heart" ? "❤" : "★"}
          </span>
        );
      })}
    </div>
  );
}

function Firework({ x, y, color }: { x: number; y: number; color: string }) {
  const rays = 12;
  return (
    <div className="pointer-events-none absolute" style={{ left: x, top: y }} aria-hidden>
      {Array.from({ length: rays }).map((_, i) => {
        const angle = (i * 360) / rays;
        return (
          <span
            key={i}
            className="absolute block"
            style={{
              left: 0,
              top: 0,
              width: 4,
              height: 60,
              background: `linear-gradient(to top, transparent, ${color})`,
              borderRadius: 999,
              transformOrigin: "center bottom",
              transform: `rotate(${angle}deg)`,
              animation: "firework 0.9s ease-out forwards",
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------- Countdown to next birthday (July 5) ---------- */
function useCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const target = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const bday = new Date(year, 4, 7, 0, 0, 0);
    if (bday.getTime() < d.getTime()) bday.setFullYear(year + 1);
    return bday.getTime();
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

/* ---------- Main page ---------- */
// Full code of music (it’s the MusicPlayer component in src/routes/index.tsx)

function MusicPlayer() {
  const [enabled, setEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const src = "/src/assets/Albumaty.Com_mhmwd_alasyly_kl_snt_-_ealan_wady_dglt_llttwyr_alakary.mp3.mpeg";

  useEffect(() => {
    // Create/attach audio once and keep it ready.
    if (!audioRef.current) {
      const a = new Audio(src);
      a.loop = true;
      a.preload = "auto";
      audioRef.current = a;
    }

    const a = audioRef.current;
    if (!a) return;

    const tryPlay = async () => {
      if (!enabled) return;
      try {
        // Must be triggered from user gesture in many browsers; this component is mounted
        // after the gift click, but we also catch autoplay blocks.
        await a.play();
      } catch {
        // Ignore autoplay restrictions.
      }
    };

    tryPlay();
  }, [enabled]);

  const toggle = async () => {
    setEnabled((v) => !v);
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try {
        await a.play();
      } catch {
        // ignore
      }
    } else {
      a.pause();
    }
  };

  return (
    <div className="fixed left-4 top-4 z-[70]">
      <button
        onClick={toggle}
        className="glass rounded-full px-4 py-2 text-sm font-semibold text-foreground/90 backdrop-blur transition hover:scale-[1.02]"
        aria-label={enabled ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
      >
        {enabled ? "🔊 الموسيقى" : "🔇 كتم"}
      </button>
    </div>
  );
}

/* ---------- Main page ---------- */
function BirthdayPage() {
  const [opened, setOpened] = useState(false);
  const [openingGift, setOpeningGift] = useState(false);
  const [showSurprise, setShowSurprise] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [showFinalGift, setShowFinalGift] = useState(false);
  const [candlesOut, setCandlesOut] = useState<boolean[]>([false, false, false, false, false]);

  const [particles, setParticles] = useState<Particle[]>([]);
  const [fireworks, setFireworks] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [showGreeting, setShowGreeting] = useState(false);

  const sfx = useSfx();
  const cd = useCountdown();

  const emit = (x: number, y: number, count = 30, kind: Particle["kind"] = "confetti") => {
    const colors = ["#f9a8c4", "#f7d488", "#ffb3c6", "#ffd6a5", "#e8b4d4", "#ffd700", "#ff85a1"];
    const batch: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i + Math.random(),
      x,
      y,
      dx: (Math.random() - 0.5) * 400,
      color: colors[Math.floor(Math.random() * colors.length)],
      kind,
    }));
    setParticles((p) => [...p, ...batch]);
    setTimeout(() => {
      setParticles((p) => p.filter((x) => !batch.find((b) => b.id === x.id)));
    }, 3600);
  };

  const launchFireworks = () => {
    const colors = ["#ffd700", "#ff85a1", "#ffb3c6", "#f7d488", "#ffffff"];
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const x = 100 + Math.random() * (window.innerWidth - 200);
        const y = 100 + Math.random() * 300;
        const id = Date.now() + i;
        const color = colors[i % colors.length];
        setFireworks((f) => [...f, { id, x, y, color }]);
        sfx.sparkle();
        setTimeout(() => setFireworks((f) => f.filter((fw) => fw.id !== id)), 900);
      }, i * 250);
    }
  };

  const openGift = () => {
    if (opened || openingGift) return;
    setOpeningGift(true);
    sfx.whoosh();
    setTimeout(() => {
      setOpened(true);
      emit(window.innerWidth / 2, window.innerHeight / 2, 60);
      launchFireworks();
    }, 900);
  };




  const blowCandle = (i: number, e: React.MouseEvent) => {
    if (candlesOut[i]) return;
    const next = candlesOut.map((v, idx) => (idx === i ? true : v));
    setCandlesOut(next);
    sfx.pop();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    emit(r.left + r.width / 2, r.top, 8, "heart");
    if (next.every(Boolean)) {

      launchFireworks();
      setShowGreeting(true);
      setTimeout(() => setShowGreeting(false), 3800);
    }
  };

  const popBalloon = (x: number, y: number) => {
    sfx.pop();
    emit(x, y, 12, Math.random() > 0.5 ? "heart" : "star");
  };




  const celebrateAgain = () => {
    setCandlesOut([false, false, false, false, false]);
    setShowSurprise(false);
    setShowLetter(false);
    setShowFinalGift(false);
    setShowGreeting(false);
    emit(window.innerWidth / 2, window.innerHeight / 2, 80);
    launchFireworks();
    sfx.chime();
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden" dir="rtl">


      <Stars />
      {opened && <FloatingBalloons onPop={popBalloon} />}
      <ParticleLayer items={particles} />
      {fireworks.map((fw) => <Firework key={fw.id} {...fw} />)}

      {/* Greeting overlay when candles all blown */}
      {showGreeting && (
        <div
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center px-4"
          aria-hidden
          style={{ animation: "greeting-in 0.5s ease-out both, greeting-out 0.6s ease-in 3.2s both" }}
        >
          <div className="glass-rose-gold relative overflow-hidden rounded-[2.5rem] px-10 py-12 text-center">
            <div
              className="pointer-events-none absolute -inset-1 opacity-50"
              style={{
                background: "radial-gradient(circle at 30% 30%, rgba(255, 200, 215, 0.35), transparent 50%), radial-gradient(circle at 70% 70%, rgba(245, 212, 145, 0.3), transparent 55%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.6) 50%, transparent 70%)",
                backgroundSize: "200% 100%",
                animation: "shine 2.5s linear infinite",
              }}
            />
            <div className="relative mb-4 text-5xl md:text-6xl" style={{ filter: "drop-shadow(0 4px 12px rgba(200, 110, 140, 0.35))" }}>🎂✨</div>
            <p
              className="relative font-display text-4xl font-bold text-foreground md:text-6xl"
              style={{ textShadow: "0 2px 18px rgba(255, 255, 255, 0.7), 0 0 28px rgba(212, 165, 116, 0.5)", animation: "glow-pulse 2s ease-in-out infinite" }}
            >
              كل سنة وأنتِ طيبة
            </p>
            <p className="relative mt-3 font-display text-xl font-semibold text-gold md:text-2xl" style={{ textShadow: "0 1px 10px rgba(255,255,255,0.7)" }}>يا آيات ❤</p>
          </div>
        </div>
      )}


      {/* Music toggle */}
      <MusicPlayer />

      {/* ============ GIFT SCREEN ============ */}

      {!opened && (
        <section className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4">
          <p className="glass mb-8 rounded-full px-6 py-2 text-sm text-foreground/80">
            هدية خاصة بانتظارك ✨
          </p>
          <button
            onClick={openGift}
            className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95"
            style={{ animation: openingGift ? "none" : "gift-idle 3s ease-in-out infinite" }}
            aria-label="افتح الهدية"
          >
            {/* Gift box */}
            <svg width="220" height="240" viewBox="0 0 220 240" className="drop-shadow-2xl">
              <defs>
                <linearGradient id="boxGrad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f9a8c4" />
                  <stop offset="100%" stopColor="#e879a3" />
                </linearGradient>
                <linearGradient id="lidGrad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffb3c6" />
                  <stop offset="100%" stopColor="#e879a3" />
                </linearGradient>
                <linearGradient id="ribbonGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f5d491" />
                  <stop offset="100%" stopColor="#d4a574" />
                </linearGradient>
              </defs>
              {/* Box body */}
              <g style={{ animation: openingGift ? "gift-open-box 0.9s ease-in forwards" : "none", transformOrigin: "110px 200px" }}>
                <rect x="30" y="90" width="160" height="130" rx="8" fill="url(#boxGrad)" />
                <rect x="100" y="90" width="20" height="130" fill="url(#ribbonGrad)" />
              </g>
              {/* Lid */}
              <g style={{ animation: openingGift ? "gift-open-lid 0.9s ease-out forwards" : "none", transformOrigin: "110px 90px" }}>
                <rect x="20" y="70" width="180" height="30" rx="4" fill="url(#lidGrad)" />
                <rect x="100" y="70" width="20" height="30" fill="url(#ribbonGrad)" />
                {/* Bow */}
                <ellipse cx="90" cy="60" rx="22" ry="14" fill="url(#ribbonGrad)" />
                <ellipse cx="130" cy="60" rx="22" ry="14" fill="url(#ribbonGrad)" />
                <circle cx="110" cy="60" r="8" fill="#c9a86b" />
              </g>
            </svg>
          </button>
          <p className="mt-8 animate-pulse text-lg font-semibold text-shine">
            اضغطي على الهدية 🎁
          </p>
        </section>
      )}

      {/* ============ MAIN PAGE ============ */}
      {opened && (
        <div className="relative z-20 mx-auto max-w-4xl px-4 pb-20 pt-10" style={{ animation: "bounce-in 0.8s ease-out" }}>
          {/* Title */}
          <header className="mb-12 text-center">
            <div className="mb-3 text-5xl md:text-6xl">🎉</div>
            <h1
              className="font-display text-4xl font-bold leading-tight text-shine md:text-6xl"
              style={{ animation: "glow-pulse 3s ease-in-out infinite" }}
            >
              كل عام وأنتِ بخير يا آيات
            </h1>
            <div className="mt-3 text-5xl md:text-6xl">🎂</div>
          </header>

          {/* Cake */}
          <div className="glass mb-10 rounded-3xl p-6 md:p-10">
            <p className="mb-4 text-center text-sm text-foreground/70">اضغطي على الشموع لإطفائها ✨</p>
            <div className="relative mx-auto" style={{ width: 300, maxWidth: "100%" }}>
              <svg viewBox="0 0 300 260" className="w-full">
                <defs>
                  <linearGradient id="cakeTop" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ffe8ef" />
                    <stop offset="100%" stopColor="#f9a8c4" />
                  </linearGradient>
                  <linearGradient id="cakeMid" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ffd6a5" />
                    <stop offset="100%" stopColor="#f5d491" />
                  </linearGradient>
                  <linearGradient id="cakeBot" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ffb3c6" />
                    <stop offset="100%" stopColor="#e879a3" />
                  </linearGradient>
                </defs>
                {/* Plate */}
                <ellipse cx="150" cy="240" rx="130" ry="10" fill="#c9a86b" opacity="0.4" />
                {/* Bottom tier */}
                <rect x="30" y="170" width="240" height="70" rx="8" fill="url(#cakeBot)" />
                <path d="M30 180 Q60 195 90 180 T150 180 T210 180 T270 180 L270 170 L30 170 Z" fill="#fff" opacity="0.6" />
                {/* Middle tier */}
                <rect x="60" y="115" width="180" height="60" rx="8" fill="url(#cakeMid)" />
                <path d="M60 125 Q90 140 120 125 T180 125 T240 125 L240 115 L60 115 Z" fill="#fff" opacity="0.5" />
                {/* Top tier */}
                <rect x="95" y="70" width="110" height="50" rx="8" fill="url(#cakeTop)" />
                <path d="M95 80 Q115 95 135 80 T175 80 T205 80 L205 70 L95 70 Z" fill="#fff" opacity="0.6" />
                {/* Sprinkles */}
                {["#e879a3", "#d4a574", "#fff", "#f5d491"].map((c, i) => (
                  <circle key={i} cx={110 + i * 25} cy={190 + (i % 2) * 15} r="2" fill={c} />
                ))}
              </svg>

              {/* Candles */}
              <div className="absolute left-0 right-0 flex justify-center gap-3" style={{ top: "10%" }}>
                {candlesOut.map((out, i) => (
                  <button
                    key={i}
                    onClick={(e) => blowCandle(i, e)}
                    className="relative cursor-pointer"
                    aria-label={`شمعة ${i + 1}`}
                  >
                    {/* Candle stick */}
                    <div
                      className="rounded-sm"
                      style={{
                        width: 8,
                        height: 30,
                        background: `linear-gradient(to bottom, ${["#f9a8c4", "#f5d491", "#ffb3c6", "#ffd6a5", "#e879a3"][i]}, #fff)`,
                      }}
                    />
                    {/* Flame */}
                    {!out ? (
                      <div
                        className="absolute -top-4 left-1/2 -translate-x-1/2"
                        style={{ animation: "flame-flicker 0.4s ease-in-out infinite", willChange: "transform" }}
                      >
                        <div
                          className="rounded-full"
                          style={{
                            width: 10,
                            height: 16,
                            background: "radial-gradient(circle at 50% 60%, #fff5a0, #ff9b3d 70%, transparent)",
                            filter: "drop-shadow(0 0 8px rgba(255, 180, 60, 0.8))",
                          }}
                        />
                      </div>
                    ) : (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                        <div
                          className="rounded-full bg-white/60"
                          style={{
                            width: 12,
                            height: 12,
                            animation: "smoke-rise 1.2s ease-out forwards",
                          }}
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {candlesOut.every(Boolean) && (
              <p className="mt-4 text-center text-lg font-bold text-shine" style={{ animation: "bounce-in 0.6s ease-out" }}>
                🌟 تمنّي أمنية جميلة 🌟
              </p>
            )}
          </div>

          {/* Countdown */}
          <div className="glass-gold mb-10 rounded-3xl p-6 text-center">
            <h2 className="mb-4 font-display text-2xl font-bold text-foreground">
              العد التنازلي لعيد ميلادكِ القادم
            </h2>
            <div className="flex justify-center gap-3 md:gap-5">
              {[
                { v: cd.days, l: "يوم" },
                { v: cd.hours, l: "ساعة" },
                { v: cd.minutes, l: "دقيقة" },
                { v: cd.seconds, l: "ثانية" },
              ].map((u, i) => (
                <div key={i} className="glass flex min-w-[64px] flex-col items-center rounded-2xl px-3 py-3 md:min-w-[84px]">
                  <span className="font-display text-3xl font-bold text-shine md:text-4xl tabular-nums">
                    {String(u.v).padStart(2, "0")}
                  </span>
                  <span className="mt-1 text-xs text-foreground/70 md:text-sm">{u.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              onClick={(e) => {
                setShowSurprise(true);
                sfx.chime();
                const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                emit(r.left + r.width / 2, r.top, 20, "heart");
              }}
              className="btn-luxury hover:[&]:translate-y-[-2px] hover:[&]:scale-[1.03]"
              style={{ transition: "transform 0.25s ease" }}
            >
              🌹 مفاجأة
            </button>
            <button
              onClick={() => { setShowLetter(true); sfx.whoosh(); }}
              className="btn-luxury"
            >
              💌 افتحي الرسالة
            </button>
            <button
              onClick={(e) => {
                setShowFinalGift(true);
                sfx.sparkle();
                const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                emit(r.left + r.width / 2, r.top, 30, "star");
              }}
              className="btn-luxury"
            >
              🎁 افتحي الهدية
            </button>
          </div>

          {/* Balloons card */}
          <div className="glass-gold mb-10 overflow-hidden rounded-3xl p-6 md:p-8">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
              <div className="text-center md:text-right">
                <h3 className="mb-2 font-display text-2xl font-bold text-shine md:text-3xl">باقة بالونات لكِ 🎈</h3>
                <p className="text-foreground/80 leading-relaxed">
                  كل بالونة تحمل أمنية جميلة،
                  <br />اضغطي على البالونات الطائرة لتنفجر بالحب ❤
                </p>
              </div>
              <div className="relative h-32 w-40 shrink-0">
                {[
                  { c: "#f9a8c4", x: 0, d: 0 },
                  { c: "#f7d488", x: 40, d: 0.4 },
                  { c: "#ffb3c6", x: 80, d: 0.8 },
                  { c: "#e8b4d4", x: 120, d: 1.2 },
                ].map((b, i) => (
                  <svg
                    key={i}
                    viewBox="0 0 40 60"
                    className="absolute h-28 w-12"
                    style={{
                      left: b.x,
                      top: 0,
                      animation: `float-soft 4s ease-in-out ${b.d}s infinite`,
                      willChange: "transform",
                    }}
                    aria-hidden
                  >
                    <ellipse cx="20" cy="22" rx="16" ry="20" fill={b.c} opacity="0.95" />
                    <ellipse cx="14" cy="15" rx="4" ry="6" fill="#fff" opacity="0.55" />
                    <path d="M20 42 L18 46 L22 46 Z" fill={b.c} />
                    <path d="M20 46 Q22 52 19 58" stroke="#c9a86b" strokeWidth="0.7" fill="none" />
                  </svg>
                ))}
              </div>
            </div>
          </div>

          {/* Bear mascot */}
          <div className="mb-10 flex justify-center">
            <div className="glass rounded-3xl p-6" style={{ animation: "float-soft 4s ease-in-out infinite" }}>
              <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden>
                <ellipse cx="40" cy="45" rx="14" ry="16" fill="#c9967a" />
                <ellipse cx="100" cy="45" rx="14" ry="16" fill="#c9967a" />
                <circle cx="70" cy="70" r="42" fill="#d9a582" />
                <circle cx="70" cy="80" r="24" fill="#f0d0b0" />
                <circle cx="58" cy="65" r="4" fill="#3a2418" />
                <circle cx="82" cy="65" r="4" fill="#3a2418" />
                <ellipse cx="70" cy="78" rx="5" ry="4" fill="#3a2418" />
                <path d="M62 86 Q70 92 78 86" stroke="#3a2418" strokeWidth="2" fill="none" strokeLinecap="round" />
                {/* Sign */}
                <rect x="20" y="112" width="100" height="24" rx="4" fill="#fff" stroke="#d4a574" strokeWidth="2" />
              </svg>
              <p className="mt-2 text-center font-display text-sm font-bold text-shine">
                Happy Birthday Ayaat!
              </p>
            </div>
          </div>

          {/* Celebrate again */}
          <div className="text-center">
            <button onClick={celebrateAgain} className="btn-luxury">
              ✨ احتفلي مرة أخرى ✨
            </button>
          </div>

          <footer className="mt-14 space-y-2 text-center text-sm text-foreground/60">
            <p>مع كل الحب صديقك محمد</p>
          </footer>
        </div>
      )}

      {/* ============ MODALS ============ */}
      {showSurprise && (
        <Modal onClose={() => setShowSurprise(false)}>
          <div className="text-center">
            <div className="mb-4 text-7xl" style={{ animation: "bounce-in 0.8s ease-out" }}>💐</div>
            <h3 className="mb-3 font-display text-2xl font-bold text-shine">باقة ورد لكِ يا آيات</h3>
            <p className="text-foreground/80 leading-relaxed">
              وردة عن كل لحظة جميلة قضيناها معًا،
              <br />ووردة عن كل حلم أتمناه أن يتحقق لكِ.
            </p>
          </div>
        </Modal>
      )}

      {showLetter && (
        <Modal onClose={() => setShowLetter(false)}>
          <div className="text-center">
            <div className="mb-4 text-6xl">💌</div>
            <h3 className="mb-4 font-display text-2xl font-bold text-shine">رسالة من القلب</h3>
            <div className="text-right leading-loose text-foreground/85">
              <p className="mb-3"><span className="font-bold">صديقتي العزيزة آيات،</span></p>
              <p className="mb-3">
                في يوم <span className="font-bold text-shine">7 / 5</span> (السابع من مايو) وُلدت أغلى وأعز أصدقائي.
                أسأل الله أن يحقق لكِ كل ما تتمنينه، وأن يوفقكِ في كل خطوة،
                ويملأ حياتكِ بالسعادة والنجاح والصحة.
              </p>
              <p className="mb-3">
                تذكري دائمًا أنني بجانبك، أدعمكِ وأساندكِ،
                وأتمنى أن أراكِ تحققين كل أحلامكِ.
              </p>
              <p className="mb-3">
                كل عام وأنتِ بألف خير، وعقبال ١٠٠ سنة مليئة بالفرح والإنجازات. ❤
              </p>
              <p className="mt-4 text-left font-bold">صديقك: محمد</p>
            </div>
          </div>
        </Modal>
      )}

      {showFinalGift && (
        <Modal onClose={() => setShowFinalGift(false)}>
          <div className="text-center">
            <div className="mb-4 text-7xl" style={{ animation: "bounce-in 0.8s ease-out" }}>🎁</div>
            <h3 className="mb-3 font-display text-2xl font-bold text-shine">هدية خاصة</h3>
            <p className="text-foreground/85 leading-relaxed">
              أجمل هدية هي صداقتكِ الغالية،
              <br />وأتمنى أن تكون كل أيامكِ مليئة بالضحك والفرح.
              <br />
              <span className="mt-3 inline-block text-2xl">🌸 كل سنة وأنتِ طيبة 🌸</span>
            </p>
          </div>
        </Modal>
      )}
    </main>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(50, 20, 40, 0.5)", backdropFilter: "blur(6px)", animation: "bounce-in 0.35s ease-out" }}
      onClick={onClose}
    >
      <div
        className="glass max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-full border border-white/60 bg-white/40 py-2 font-semibold text-foreground/80 backdrop-blur transition hover:bg-white/60"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
