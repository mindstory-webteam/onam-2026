"use client";



import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { onamMusic } from "../component/Onammusic";

/* ================================================================== */
/*  CONFIG                                                            */
/* ================================================================== */

export const PRELOADER_CONTENT = {
  /** Medallion title (Malayalam/any script) — same as OnamProgramme. */
  eventTitle: "ആരവം",
  /** Edition number under the title. */
  edition: "11",
  label: "Laying the pookalam",
  tagline: "Onam 2026",
} as const;

export interface OnamPreloaderProps {
  /** Set true when your page assets are ready. Defaults to true (time-based only). */
  ready?: boolean;
  /** Minimum time on screen, ms. */
  minDuration?: number;
  /** Hard cap — dismiss after this many ms even if `ready` is still false. */
  maxDuration?: number;
  /** Background song — starts the moment the loader mounts (or on first gesture). Pass "" to skip. */
  bgMusic?: string;
  bgMusicVolume?: number;
  /** Called after the exit animation completes (component unmounts itself). */
  onDone?: () => void;
  /** Medallion text. */
  eventTitle?: string;
  edition?: string;
  label?: string;
  tagline?: string;
  scriptFont?: string;
  /** Malayalam-capable display face for the medallion title. */
  titleFont?: string;
  bodyFont?: string;
  className?: string;
}

/* ================================================================== */
/*  TOKENS                                                            */
/* ================================================================== */

const P = {
  green: "#6FB93C",
  greenDeep: "#4E9A2A",
  red: "#A3192E",
  redDeep: "#7C0F22",
  orange: "#F26A1B",
  orangeLight: "#FF8A3C",
  white: "#FBF7EE",
  yellow: "#F7C21A",
  yellowDeep: "#E0960A",
  ink: "#1A2A12",
  // medallion (same as OnamProgramme so the badge is identical)
  gold: "#F2B53A",
  goldDeep: "#C98B18",
  goldPale: "#FFE08A",
  magenta: "#B8136E",
  magentaDeep: "#7D0C4B",
} as const;

/* ================================================================== */
/*  HELPERS                                                           */
/* ================================================================== */

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Packed "petal" dots for the red outer disc, on concentric rings. */
function ringDots(rInner: number, rOuter: number, step: number) {
  const out: { x: number; y: number; r: number }[] = [];
  for (let r = rInner; r <= rOuter; r += step) {
    const n = Math.round((2 * Math.PI * r) / (step * 1.05));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (r / step) * 0.35;
      out.push({ x: r2(Math.cos(a) * r), y: r2(Math.sin(a) * r), r: r2(step * 0.42) });
    }
  }
  return out;
}

/* ================================================================== */
/*  MEDALLION (ആരവം 11) — identical artwork to OnamProgramme          */
/* ================================================================== */

const Medallion: React.FC = () => {
  const scrolls = Array.from({ length: 8 }, (_, i) => i * 45);
  const beads = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    return { x: r2(200 + Math.cos(a) * 158), y: r2(200 + Math.sin(a) * 158) };
  });
  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="plm-disc" cx="45%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#D81E84" />
          <stop offset="60%" stopColor={P.magenta} />
          <stop offset="100%" stopColor={P.magentaDeep} />
        </radialGradient>
        <linearGradient id="plm-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={P.goldPale} />
          <stop offset="45%" stopColor={P.gold} />
          <stop offset="100%" stopColor={P.goldDeep} />
        </linearGradient>
        <filter id="plm-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      <g data-med-filigree fill="none" stroke="url(#plm-gold)" strokeWidth="3" strokeLinecap="round" opacity="0.9">
        {scrolls.map((deg) => (
          <g key={deg} transform={`rotate(${deg} 200 200)`}>
            <path d="M200 26 C 214 34, 226 30, 232 18 C 238 8, 228 2, 222 8 C 216 14, 224 22, 232 18" />
            <path d="M200 26 C 186 34, 174 30, 168 18 C 162 8, 172 2, 178 8 C 184 14, 176 22, 168 18" />
            <circle cx="200" cy="20" r="3.5" fill="url(#plm-gold)" stroke="none" />
          </g>
        ))}
      </g>

      <g data-med-rings>
        <circle cx="200" cy="200" r="170" fill="none" stroke="url(#plm-gold)" strokeWidth="6" filter="url(#plm-shadow)" />
        <circle cx="200" cy="200" r="162" fill="none" stroke={P.goldDeep} strokeWidth="1.2" opacity="0.7" />
        {beads.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r="2.2" fill={P.goldPale} opacity="0.9" />
        ))}
        <circle cx="200" cy="200" r="150" fill="none" stroke="url(#plm-gold)" strokeWidth="3" />
      </g>

      <g data-med-disc>
        <circle cx="200" cy="200" r="140" fill="url(#plm-disc)" filter="url(#plm-shadow)" />
        <circle cx="200" cy="200" r="140" fill="none" stroke={P.goldPale} strokeWidth="1.5" opacity="0.6" />
        <ellipse cx="170" cy="150" rx="70" ry="40" fill="#fff" opacity="0.06" />
      </g>

      {[-1, 1].map((s) => (
        <g key={s} data-med-star transform={`translate(${200 + s * 196} 200)`} fill="url(#plm-gold)">
          <path d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3 Z" />
          <circle cx={s * -16} cy="0" r="2" />
          <circle cx={s * -24} cy="0" r="1.4" opacity="0.7" />
        </g>
      ))}
    </svg>
  );
};

/* ================================================================== */
/*  POOKALAM SVG                                                      */
/* ================================================================== */

const PETALS = 12;
const WHITE_PETAL = "M0 -46 C 14 -62, 24 -92, 0 -124 C -24 -92, -14 -62, 0 -46 Z";
const ORANGE_PETAL = "M0 -44 C 16 -58, 22 -84, 0 -108 C -22 -84, -16 -58, 0 -44 Z";

const Pookalam: React.FC<{ className?: string }> = ({ className }) => {
  const redDots = ringDots(132, 176, 9);
  const yellowDots = ringDots(14, 38, 7);
  return (
    <svg viewBox="-200 -200 400 400" className={className} aria-hidden="true" data-pookalam>
      <defs>
        <radialGradient id="pl-red" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={P.red} />
          <stop offset="100%" stopColor={P.redDeep} />
        </radialGradient>
        <radialGradient id="pl-yellow" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFE27A" />
          <stop offset="60%" stopColor={P.yellow} />
          <stop offset="100%" stopColor={P.yellowDeep} />
        </radialGradient>
        <linearGradient id="pl-orange" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={P.orange} />
          <stop offset="100%" stopColor={P.orangeLight} />
        </linearGradient>
        <filter id="pl-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.28" />
        </filter>
      </defs>

      <g data-carpet>
        <g data-layer="disc">
          <circle r="180" fill="url(#pl-red)" filter="url(#pl-shadow)" />
          <circle r="178" fill="none" stroke="#5E0A19" strokeWidth="1.2" opacity="0.6" />
          {redDots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#B8243A" opacity="0.55" />
          ))}
          <circle r="128" fill="none" stroke="#5E0A19" strokeWidth="1.5" opacity="0.5" />
        </g>

        <g data-layer="tips">
          {Array.from({ length: PETALS }, (_, i) => (
            <g key={i} transform={`rotate(${(i * 360) / PETALS})`}>
              <circle cx="0" cy="-150" r="4.5" fill={P.yellow} data-tip />
            </g>
          ))}
        </g>

        <g data-layer="orange">
          {Array.from({ length: PETALS }, (_, i) => (
            <path
              key={i}
              data-petal
              d={ORANGE_PETAL}
              fill="url(#pl-orange)"
              stroke="#C9500F"
              strokeWidth="1"
              transform={`rotate(${(i * 360) / PETALS + 180 / PETALS})`}
            />
          ))}
        </g>

        <g data-layer="white">
          {Array.from({ length: PETALS }, (_, i) => (
            <path
              key={i}
              data-petal
              d={WHITE_PETAL}
              fill={P.white}
              stroke="#E6DECB"
              strokeWidth="1"
              transform={`rotate(${(i * 360) / PETALS})`}
            />
          ))}
        </g>

        <g data-layer="core">
          <circle r="52" fill={P.orange} />
          <circle r="52" fill="none" stroke="#C9500F" strokeWidth="1.5" />
          <circle r="42" fill="url(#pl-yellow)" />
          {yellowDots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#FFE27A" opacity="0.7" />
          ))}
          <circle r="10" fill={P.orange} />
          <circle r="4" fill={P.white} />
        </g>
      </g>
    </svg>
  );
};

/* ================================================================== */
/*  COMPONENT                                                         */
/* ================================================================== */

const OnamPreloader: React.FC<OnamPreloaderProps> = ({
  ready = true,
  minDuration = 2600,
  maxDuration = 6000,
  bgMusic = "/song/onam.mp4",
  bgMusicVolume = 0.55,
  onDone,
  eventTitle = PRELOADER_CONTENT.eventTitle,
  edition = PRELOADER_CONTENT.edition,
  label = PRELOADER_CONTENT.label,
  tagline = PRELOADER_CONTENT.tagline,
  scriptFont = '"Great Vibes", "Allura", "Dancing Script", cursive',
  titleFont = '"Baloo Chettan 2", "Manjari", "Noto Sans Malayalam", "Poppins", sans-serif',
  bodyFont = '"Manrope", "Inter", system-ui, sans-serif',
  className = "",
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(true);
  const [minElapsed, setMinElapsed] = useState(false);
  const [maxElapsed, setMaxElapsed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const spinRef = useRef<gsap.core.Tween | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  /* ---- start the song as early as possible ---- */
  useEffect(() => {
    if (bgMusic) onamMusic.start(bgMusic, bgMusicVolume);
  }, [bgMusic, bgMusicVolume]);

  /* ---- lock scroll while visible ---- */
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  /* ---- timers ---- */
  useEffect(() => {
    const t1 = window.setTimeout(() => setMinElapsed(true), minDuration);
    const t2 = window.setTimeout(() => setMaxElapsed(true), Math.max(maxDuration, minDuration));
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [minDuration, maxDuration]);

  /* ---- decide when to leave ---- */
  useEffect(() => {
    if (exiting) return;
    if ((ready && minElapsed) || maxElapsed) setExiting(true);
  }, [ready, minElapsed, maxElapsed, exiting]);

  /* ---- entrance: medallion drops in, petals lay themselves, idle spin ---- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce =
      "matchMedia" in window && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const medallion = root.querySelector("[data-medallion]");
      const medText = root.querySelectorAll("[data-med-text]");
      const filigree = root.querySelector("[data-med-filigree]");
      const disc = root.querySelector('[data-layer="disc"]');
      const tips = root.querySelectorAll("[data-tip]");
      const orange = root.querySelectorAll('[data-layer="orange"] [data-petal]');
      const white = root.querySelectorAll('[data-layer="white"] [data-petal]');
      const core = root.querySelector('[data-layer="core"]');
      const carpet = root.querySelector("[data-carpet]");
      const text = root.querySelectorAll("[data-text]");

      if (reduce) {
        gsap.set([medallion, medText, disc, tips, orange, white, core, text], { opacity: 1, scale: 1, y: 0 });
        return;
      }

      gsap.set(medallion, { opacity: 0, scale: 0.7, y: -30 });
      gsap.set(medText, { opacity: 0, y: 14 });
      gsap.set(disc, { scale: 0, transformOrigin: "0 0", svgOrigin: "0 0" });
      gsap.set([orange, white], { scale: 0, opacity: 0, svgOrigin: "0 0" });
      gsap.set(core, { scale: 0, svgOrigin: "0 0" });
      gsap.set(tips, { opacity: 0 });
      gsap.set(text, { opacity: 0, y: 10 });

      const tl = gsap.timeline({ defaults: { ease: "back.out(1.6)" } });
      // medallion first
      tl.to(medallion, { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: "back.out(1.4)" });
      tl.to(medText, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "power3.out" }, "-=0.45");
      // then the pookalam lays itself
      tl.to(disc, { scale: 1, duration: 0.9, ease: "power3.out" }, "-=0.5");
      tl.to(orange, { scale: 1, opacity: 1, duration: 0.55, stagger: { each: 0.05, from: "start" } }, "-=0.4");
      tl.to(white, { scale: 1, opacity: 1, duration: 0.55, stagger: { each: 0.05, from: "start" } }, "-=0.5");
      tl.to(core, { scale: 1, duration: 0.6 }, "-=0.3");
      tl.to(tips, { opacity: 1, duration: 0.3, stagger: 0.03, ease: "power1.out" }, "-=0.4");
      tl.to(text, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "power2.out" }, "-=0.5");

      // idle: pookalam spins slowly, medallion filigree counter-rotates very slowly
      tl.add(() => {
        spinRef.current = gsap.to(carpet, {
          rotation: 360,
          duration: 24,
          ease: "none",
          repeat: -1,
          svgOrigin: "0 0",
        });
        if (filigree) {
          gsap.to(filigree, { rotation: -360, duration: 60, ease: "none", repeat: -1, svgOrigin: "200 200" });
        }
      });
    }, root);

    return () => {
      ctx.revert();
      spinRef.current?.kill();
      spinRef.current = null;
    };
  }, []);

  /* ---- exit animation ---- */
  useEffect(() => {
    if (!exiting) return;
    const root = rootRef.current;
    if (!root) return;
    spinRef.current?.kill();

    const reduce =
      "matchMedia" in window && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const medallion = root.querySelector("[data-medallion]");
    const pook = root.querySelector("[data-pookalam]");
    const text = root.querySelectorAll("[data-text]");

    const tl = gsap.timeline({
      onComplete: () => {
        setMounted(false);
        onDoneRef.current?.();
      },
    });

    if (reduce) {
      tl.to(root, { autoAlpha: 0, duration: 0.5 });
      return undefined;
    }

    tl.to(text, { opacity: 0, y: -8, duration: 0.35, ease: "power2.in" });
    tl.to(medallion, { opacity: 0, y: -40, scale: 0.85, duration: 0.5, ease: "power2.in" }, "<");
    tl.to(pook, { scale: 3.2, opacity: 0, duration: 1.0, ease: "power3.in", transformOrigin: "50% 50%" }, "-=0.2");
    tl.to(root, { autoAlpha: 0, duration: 0.55, ease: "power2.inOut" }, "-=0.45");

    // Do NOT kill on cleanup — Strict Mode re-runs this effect and a killed
    // timeline would never reach onComplete, leaving the loader on screen.
    return undefined;
  }, [exiting]);

  if (!mounted) return null;

  return (
    <div
      ref={rootRef}
      className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center overflow-hidden px-6 ${className}`}
      style={{
        fontFamily: bodyFont,
        background: `radial-gradient(ellipse at 50% 45%, ${P.green} 0%, ${P.greenDeep} 100%)`,
      }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {/* subtle banana-leaf vein texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-multiply"
        style={{
          backgroundImage:
            "repeating-linear-gradient(100deg, rgba(0,0,0,0.55) 0 1px, transparent 1px 14px)",
        }}
      />

      {/* ---------- Medallion: ആരവം / 11 ---------- */}
      {/* <div data-medallion className="relative aspect-square w-[min(54vw,230px)] sm:w-[min(34vw,260px)]">
        <Medallion />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p
            data-med-text
            className="leading-[0.95] text-[clamp(2rem,9vw,3.3rem)] font-extrabold"
            style={{
              fontFamily: titleFont,
              color: P.gold,
              textShadow: `0 2px 0 ${P.goldDeep}, 0 4px 0 #8A5C0C, 0 6px 0 #5E3E06, 0 12px 24px rgba(0,0,0,0.45)`,
            }}
          >
            {eventTitle}
          </p>
          <p
            data-med-text
            className="-mt-1 leading-none text-[clamp(2.4rem,11vw,4rem)] font-extrabold"
            style={{
              fontFamily: titleFont,
              color: P.gold,
              textShadow: `0 3px 0 ${P.goldDeep}, 0 6px 0 #8A5C0C, 0 9px 0 #5E3E06, 0 16px 28px rgba(0,0,0,0.5)`,
            }}
          >
            {edition}
          </p>
        </div>
      </div> */}

      {/* ---------- Pookalam ---------- */}
      <div className="relative mt-6 w-[min(52vw,240px)] sm:mt-8 sm:w-[min(34vw,280px)]">
        <Pookalam className="h-auto w-full" />
      </div>

      {/* ---------- Text ---------- */}
      <p
        data-text
        className="mt-6 leading-none text-[clamp(2.2rem,7vw,3.4rem)] sm:mt-8"
        style={{
          fontFamily: scriptFont,
          color: P.white,
          textShadow: "0 2px 0 rgba(0,0,0,0.18), 0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        {tagline}
      </p>
      <p
        data-text
        className="mt-3 flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.42em]"
        style={{ color: P.ink }}
      >
        {label}
        <span className="inline-flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-1 w-1 rounded-full animate-bounce"
              style={{ background: P.ink, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      </p>
    </div>
  );
};

export default OnamPreloader;