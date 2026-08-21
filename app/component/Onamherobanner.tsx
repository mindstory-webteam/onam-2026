"use client";

/**
 * OnamHero.tsx — pot-only edition (uriyadi stick update)
 * ------------------------------------------------------------------
 * HANGING POT (slow swing) → click → STICK HITS → CRACK + BURST
 * (flowers spill out) → FULL-SCREEN REVEAL VIDEO → POSTER
 * (with falling petals over the poster).
 *
 * NEW IN THIS VERSION
 *  • Pot swings slowly on its ropes (pendulum) while it waits.
 *  • "Happy Onam" wish text (bottom-left).
 *  • Right-side pill that loops between a label and an arrow; clicking
 *    scrolls smoothly to the OnamProgramme section (#programme).
 *  • Desktop: the cursor becomes an uriyadi stick; clicking the pot swings
 *    the stick and breaks the pot.
 *  • Mobile: tapping the pot makes a stick fly in from the right and hit it.
 *  • Flowers sit inside the pot (peeking from the mouth) and spill out on
 *    the break.
 *  • Bottom-left wish hides the moment the pot is struck; a centred
 *    "Happy Onam!" greeting flashes over the burst; the reveal video plays
 *    WITHOUT sound; a background song plays with a mute/unmute button.
 *
 *  • Background song is shared with the preloader (see onamMusic.ts) so it
 *    starts under the loader and the mute button here controls it.
 *  • The stick cursor only appears when the pointer is near the pot; away
 *    from it the normal cursor is shown.
 *  • Colour theme now matches OnamPreloader: pookalam green ground, deep
 *    red, marigold orange, turmeric yellow, jasmine white.
 *
 * Dependencies: react, gsap, tailwindcss
 * ------------------------------------------------------------------
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { onamMusic } from "../component/Onammusic";

/* ================================================================== */
/*  CONFIG — desktop and mobile are fully separate                    */
/* ================================================================== */

export interface OnamDeviceConfig {
  /** Looping, muted background video behind the hanging pot. */
  video: string;
  /** Full-screen video revealed when the pot is cracked. */
  revealVideo: string;
  /** Full-screen poster image shown after the reveal video finishes. */
  finalPoster: string;
}

export const ONAM_DEVICE: Record<"desktop" | "mobile", OnamDeviceConfig> = {
  desktop: {
    video: "/videos/desk.mp4",
    revealVideo: "/videos/revaling-desk.mp4",
    finalPoster: "/img/poster-dask.jpeg",
  },
  mobile: {
    video: "/videos/mobile.mp4",
    revealVideo: "/videos/revaling-mob.mp4",
    finalPoster: "/img/mob.png",
  },
};

/** Where the pot hangs: "left" | "right" | "center". */
export const ONAM_POT_POSITION: Record<"desktop" | "mobile", "left" | "right" | "center"> = {
  desktop: "center",
  mobile: "center",
};

export const ONAM_SHARED = {
  crackButtonLabel: "Crack the pot",
  potReadyLabel: "The moment has arrived",
  ariaLabel: "Onam Festival Kerala 2026",
  /** Wish text shown at the bottom-left. */
  wishTitle: "Happy Onam!",
  wishSub: "Wishing you joy, colour and a table full of sadhya",
  /** Label that loops with the arrow inside the right-side pill. */
  navLabel: "See the programme",
  /** id of the OnamProgramme section to scroll to. */
  programmeId: "programme",
  /** Background song (mp3). Starts on first tap/click if autoplay is blocked. */
  bgMusic: "/song/onam.mp4",
  bgMusicVolume: 0.55,
  /** Centred greeting shown right after the pot breaks. */
  greetTitle: "Happy Onam!",
  greetSub: "Onashamsakal",
  muteLabel: "Mute music",
  unmuteLabel: "Unmute music",
} as const;

/* ================================================================== */
/*  TYPES                                                             */
/* ================================================================== */

export interface OnamHeroProps {
  /** Landscape background video behind the pot (≥ 768px). */
  desktopVideo?: string;
  /** Portrait background video behind the pot (< 768px). */
  mobileVideo?: string;
  /** Optional poster frame shown before the background video can play. */
  poster?: string;
  /** Landscape reveal video, played full-screen after the pot is cracked (≥ 768px). */
  desktopRevealVideo?: string;
  /** Portrait reveal video, played full-screen after the pot is cracked (< 768px). */
  mobileRevealVideo?: string;
  /** Play the reveal video with sound (allowed because it follows a click). Falls back to muted if blocked. */
  revealVideoMuted?: boolean;
  /** Loop the reveal video. When true the final poster never shows (the video never ends). */
  revealVideoLoop?: boolean;
  /** Landscape poster shown full-screen after the reveal video ends (≥ 768px). */
  desktopFinalPoster?: string;
  /** Portrait poster shown full-screen after the reveal video ends (< 768px). */
  mobileFinalPoster?: string;
  /** Optional callback when the final poster is shown. */
  onPosterShown?: () => void;
  /** Optional callback once the full-video reveal has completed. */
  onRevealComplete?: () => void;
  /** Supporting sans-serif font family (button + label). */
  bodyFont?: string;
  /** Script face for the "Happy Onam!" wish. */
  scriptFont?: string;
  /** Wish text. */
  wishTitle?: string;
  wishSub?: string;
  /** Label for the right-side navigation pill. */
  navLabel?: string;
  /** id of the section the nav pill scrolls to. */
  programmeId?: string;
  /** Background song. Pass "" to disable music + the mute button. */
  bgMusic?: string;
  /** 0–1 */
  bgMusicVolume?: number;
  /** Centred greeting shown right after the pot breaks. */
  greetTitle?: string;
  greetSub?: string;
  /** Extra classes for the outer <section>. */
  className?: string;
}

interface Petal {
  id: number;
  x: number; // vw
  size: number; // px
  rotation: number; // deg
  opacity: number;
  duration: number; // s
  delay: number; // s
  drift: number; // px
  color: string;
  shape: number; // 0..2
}

/* ================================================================== */
/*  TOKENS                                                            */
/* ================================================================== */

/** Shared with OnamPreloader so the loader dissolves into a matching hero. */
const PALETTE = {
  jasmine: "#FBF7EE", // white petals
  cream: "#F4E9CC",
  marigold: "#F7C21A", // turmeric-yellow centre
  saffron: "#F26A1B", // orange petals
  vermilion: "#A3192E", // deep-red outer disc
  vermilionDeep: "#7C0F22",
  lotus: "#FF8A3C",
  green: "#6FB93C",
  greenDeep: "#4E9A2A",
  clay: "#8B4A2B",
  clayDark: "#4A2414",
  ink: "#1A2A12", // leaf-dark green (replaces the old near-black)
} as const;

/** "rgba(26,42,18,a)" — PALETTE.ink with alpha, for glassy pills/overlays. */
const inkA = (a: number) => `rgba(26,42,18,${a})`;

const PETAL_COLORS = [
  PALETTE.jasmine,
  PALETTE.cream,
  PALETTE.marigold,
  PALETTE.saffron,
  PALETTE.lotus,
  PALETTE.vermilion,
  "#FFFFFF",
];

const MOBILE_QUERY = "(max-width: 767px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/* ================================================================== */
/*  HOOKS                                                             */
/* ================================================================== */

/** Subscribes to a media query; SSR-safe (returns `fallback` on the server). */
export function useMediaQuery(query: string, fallback = false): boolean {
  const [matches, setMatches] = useState<boolean>(fallback);

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, [query]);

  return matches;
}

/* ================================================================== */
/*  HELPERS                                                           */
/* ================================================================== */

/** Round to 2 dp — floating-point output can differ between server and client. */
const r2 = (n: number) => Math.round(n * 100) / 100;

function generatePetals(count: number, seed = 1): Petal[] {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: r2(rand() * 100),
    size: r2(8 + rand() * 14),
    rotation: r2(rand() * 360),
    opacity: r2(0.45 + rand() * 0.45),
    duration: r2(11 + rand() * 11),
    delay: r2(rand() * 14),
    drift: r2((rand() - 0.5) * 160),
    color: PETAL_COLORS[Math.floor(rand() * PETAL_COLORS.length)],
    shape: Math.floor(rand() * 3),
  }));
}

/** Organic petal outlines via asymmetric border-radius. */
const PETAL_SHAPES: React.CSSProperties[] = [
  { borderRadius: "100% 0 100% 0" },
  { borderRadius: "70% 30% 70% 30% / 50% 60% 40% 50%" },
  { borderRadius: "50% 50% 50% 50% / 70% 70% 30% 30%" },
];

/* ================================================================== */
/*  SUB-COMPONENTS                                                    */
/* ================================================================== */

const POT_CENTER = { x: 150, y: 318 };

/** Jagged wedge regions covering the body; edges double as crack lines. */
const POT_SHARDS: { id: string; points: string; cx: number; cy: number }[] = [
  { id: "w1", points: "150,318 125,295 100,230 215,230 190,290", cx: 160, cy: 272 },
  { id: "w2", points: "150,318 190,290 215,230 262,230 262,370 205,350", cx: 222, cy: 300 },
  { id: "w3", points: "150,318 205,350 262,370 262,440 170,440 165,380", cx: 218, cy: 385 },
  { id: "w4", points: "150,318 165,380 170,440 95,440 110,380", cx: 138, cy: 400 },
  { id: "w5", points: "150,318 110,380 95,440 38,440 38,330 115,335", cx: 84, cy: 388 },
  { id: "w6", points: "150,318 115,335 38,330 38,230 100,230 125,295", cx: 84, cy: 288 },
];

const POT_CRACKS = [
  "M150 318 L125 295 L100 230",
  "M150 318 L190 290 L215 230",
  "M150 318 L205 350 L260 370",
  "M150 318 L165 380 L170 430",
  "M150 318 L110 380 L95 430",
  "M150 318 L115 335 L42 330",
];

const GARLAND_COLORS = [PALETTE.saffron, PALETTE.marigold, PALETTE.vermilion, PALETTE.saffron, PALETTE.jasmine];

/** Flowers packed inside the pot — peek out of the mouth, spill out on the break. */
const INNER_FLOWERS = [
  { x: 128, y: 226, r: 9, c: "#F6A21B" },
  { x: 150, y: 220, r: 11, c: "#E8611F" },
  { x: 172, y: 226, r: 9, c: "#FFD23A" },
  { x: 139, y: 212, r: 7, c: "#C8412B" },
  { x: 161, y: 211, r: 7, c: "#E89BB2" },
  { x: 116, y: 222, r: 6, c: "#FFFDF5" },
  { x: 184, y: 222, r: 6, c: "#FFFDF5" },
  { x: 150, y: 206, r: 5, c: "#FFFDF5" },
  // hidden deeper inside — only seen when they fly out
  { x: 130, y: 300, r: 12, c: "#F6A21B" },
  { x: 170, y: 300, r: 12, c: "#FFD23A" },
  { x: 150, y: 330, r: 13, c: "#E8611F" },
  { x: 120, y: 340, r: 9, c: "#E89BB2" },
  { x: 180, y: 340, r: 9, c: "#C8412B" },
  { x: 150, y: 365, r: 10, c: "#FFFDF5" },
  { x: 105, y: 312, r: 8, c: "#FFFDF5" },
  { x: 195, y: 312, r: 8, c: "#FFD23A" },
];

const ClayPot: React.FC<{ sizeClass: string }> = ({ sizeClass }) => {
  const garland = Array.from({ length: 13 }, (_, i) => {
    const t = Math.PI * (i / 12);
    return {
      x: r2(150 - Math.cos(t) * 100),
      y: r2(238 + Math.sin(t) * 16),
      r: 11 + (i % 2) * 2,
      color: GARLAND_COLORS[i % GARLAND_COLORS.length],
    };
  });
  const jasmineStrands = [62, 100, 150, 200, 238];

  return (
    <div className={`relative ${sizeClass}`} data-pot-body>
      <svg
        viewBox="0 0 300 520"
        className="absolute inset-0 h-full w-full overflow-visible"
        style={{ filter: "drop-shadow(0 24px 36px rgba(0,0,0,0.55))" }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="onam-brass" cx="36%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#FFF0B8" />
            <stop offset="22%" stopColor="#F4CD5E" />
            <stop offset="55%" stopColor="#D9A030" />
            <stop offset="85%" stopColor="#8F5C12" />
            <stop offset="100%" stopColor="#5E3A08" />
          </radialGradient>
          <linearGradient id="onam-brass-lip" x1="0" x2="1">
            <stop offset="0%" stopColor="#8F5C12" />
            <stop offset="45%" stopColor="#FFE69A" />
            <stop offset="100%" stopColor="#8F5C12" />
          </linearGradient>
          <linearGradient id="onam-kasavu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBF4E2" />
            <stop offset="100%" stopColor="#E9DCC0" />
          </linearGradient>
          <linearGradient id="onam-rope" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8A6433" />
            <stop offset="50%" stopColor="#C79A5B" />
            <stop offset="100%" stopColor="#8A6433" />
          </linearGradient>
          <radialGradient id="onam-pot-light" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={PALETTE.jasmine} />
            <stop offset="35%" stopColor={PALETTE.marigold} />
            <stop offset="70%" stopColor={PALETTE.saffron} stopOpacity="0.6" />
            <stop offset="100%" stopColor={PALETTE.saffron} stopOpacity="0" />
          </radialGradient>
          <filter id="onam-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
          <filter id="onam-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>

          <g id="onam-body-art">
            <ellipse cx="150" cy="330" rx="112" ry="102" fill="url(#onam-brass)" />
            <path d="M40 332 Q150 350 260 332 L256 384 Q150 406 44 384 Z" fill="url(#onam-kasavu)" />
            <path d="M42 346 Q150 364 258 346" stroke="#D9A441" strokeWidth="4" fill="none" />
            <path d="M44 374 Q150 392 256 374" stroke="#D9A441" strokeWidth="6" fill="none" />
            <path d="M46 362 Q150 380 254 362" stroke="#D9A441" strokeWidth="1.5" fill="none" opacity="0.7" />
            <ellipse cx="98" cy="292" rx="16" ry="40" fill="#FFF6D6" opacity="0.35" transform="rotate(-18 98 292)" />
          </g>

          {POT_SHARDS.map((s) => (
            <clipPath key={s.id} id={`onam-clip-${s.id}`}>
              <polygon points={s.points} />
            </clipPath>
          ))}
        </defs>

        {/* ---------- Ropes ---------- */}
        <g data-rope strokeLinecap="round" fill="none">
          {[
            "M150 0 C150 60 70 150 64 236",
            "M150 0 C150 70 150 150 150 230",
            "M150 0 C150 60 230 150 236 236",
          ].map((d, i) => (
            <g key={i}>
              <path d={d} stroke="url(#onam-rope)" strokeWidth="6" />
              <path d={d} stroke="#6A4820" strokeWidth="6" strokeDasharray="3 6" opacity="0.5" />
            </g>
          ))}
          <path d="M150 92 Q118 96 104 118 Q132 120 150 100 Z" fill="#2F7A2B" stroke="none" />
          <path d="M150 92 Q182 96 196 118 Q168 120 150 100 Z" fill="#3F9A37" stroke="none" />
          <circle cx="150" cy="68" r="17" fill="#F6A21B" stroke="none" />
          <circle cx="150" cy="68" r="10" fill="#FFC83A" stroke="none" opacity="0.8" />
          <circle cx="150" cy="96" r="15" fill="#E8611F" stroke="none" />
          <circle cx="150" cy="96" r="8" fill="#F6A21B" stroke="none" opacity="0.8" />
        </g>

        {/* ---------- Inner golden light ---------- */}
        <ellipse
          data-pot-light
          cx={POT_CENTER.x}
          cy={POT_CENTER.y}
          rx="90"
          ry="95"
          fill="url(#onam-pot-light)"
          filter="url(#onam-soft)"
          opacity="0"
        />

        {/* ---------- Flowers hidden deep inside (fly out on the break) ---------- */}
        <g data-inner-group>
          {INNER_FLOWERS.slice(8).map((f, i) => (
            <g key={`in-${i}`} data-inner data-cx={f.x} data-cy={f.y} opacity="0">
              <circle cx={f.x} cy={f.y} r={f.r} fill={f.c} />
              <circle cx={f.x} cy={f.y} r={r2(f.r * 0.5)} fill="#fff" opacity="0.25" />
            </g>
          ))}
        </g>

        {/* ---------- Solid body ---------- */}
        <use href="#onam-body-art" data-pot-base />

        {/* ---------- Shards ---------- */}
        {POT_SHARDS.map((s) => (
          <g key={s.id} data-shard data-cx={s.cx} data-cy={s.cy} clipPath={`url(#onam-clip-${s.id})`}>
            <use href="#onam-body-art" />
          </g>
        ))}

        {/* ---------- Mouth + lip ---------- */}
        <g data-shard data-cx="150" data-cy="232">
          <ellipse cx="150" cy="236" rx="54" ry="14" fill="url(#onam-brass-lip)" />
          <ellipse cx="150" cy="232" rx="46" ry="10" fill="#3A2006" />
          <ellipse cx="150" cy="231" rx="40" ry="7" fill="#6E4410" />
        </g>

        {/* ---------- Flowers peeking out of the mouth ---------- */}
        <g data-inner-group>
          {INNER_FLOWERS.slice(0, 8).map((f, i) => (
            <g key={`peek-${i}`} data-inner data-cx={f.x} data-cy={f.y}>
              <circle cx={f.x} cy={f.y} r={f.r} fill={f.c} />
              <circle cx={f.x} cy={f.y} r={r2(f.r * 0.5)} fill="#fff" opacity="0.25" />
            </g>
          ))}
          {/* a couple of leaves between the flowers */}
          <path data-inner data-cx="125" data-cy="218" d="M122 228 Q108 218 114 204 Q126 212 122 228 Z" fill="#3F9A37" />
          <path data-inner data-cx="176" data-cy="218" d="M178 228 Q192 218 186 204 Q174 212 178 228 Z" fill="#2F7A2B" />
        </g>

        {/* ---------- Marigold garland around the neck ---------- */}
        {garland.map((f, i) => (
          <g key={i} data-shard data-cx={f.x} data-cy={f.y}>
            <circle cx={f.x} cy={f.y} r={f.r} fill={f.color} />
            <circle cx={f.x} cy={f.y} r={r2(f.r * 0.55)} fill="#FFFFFF" opacity="0.22" />
          </g>
        ))}
        {[70, 150, 230].map((x, i) => (
          <path
            key={i}
            data-shard
            data-cx={x}
            data-cy={262}
            d={`M${x} 250 Q${x - 18} 262 ${x - 10} 280 Q${x + 2} 268 ${x} 250 Z`}
            fill={i % 2 ? "#2F7A2B" : "#3F9A37"}
          />
        ))}
        {jasmineStrands.map((x, i) => (
          <g key={i} data-shard data-cx={x} data-cy={290}>
            {Array.from({ length: 6 }, (_, j) => (
              <circle key={j} cx={r2(x + Math.sin(j) * 2)} cy={262 + j * 9} r="3.6" fill="#FFFDF5" />
            ))}
          </g>
        ))}

        {/* ---------- Bottom tassel ---------- */}
        <g data-shard data-cx="150" data-cy="470">
          <path d="M150 436 L134 520 L150 506 L166 520 Z" fill="url(#onam-kasavu)" />
          <path d="M140 486 L160 486" stroke="#D9A441" strokeWidth="3" />
          <path d="M138 498 L162 498" stroke="#D9A441" strokeWidth="2" />
          <path d="M150 440 Q120 444 110 466 Q140 466 150 450 Z" fill="#2F7A2B" />
          <path d="M150 440 Q180 444 190 466 Q160 466 150 450 Z" fill="#3F9A37" />
          <circle cx="150" cy="438" r="13" fill="#F6A21B" />
          <circle cx="150" cy="438" r="7" fill="#FFC83A" opacity="0.8" />
        </g>

        {/* ---------- Cracks ---------- */}
        <g data-cracks stroke={PALETTE.jasmine} strokeLinecap="round" fill="none" filter="url(#onam-glow)">
          {POT_CRACKS.map((d, i) => (
            <path key={i} data-crack d={d} strokeWidth={i < 3 ? 2.4 : 1.8} />
          ))}
        </g>
      </svg>
    </div>
  );
};

/**
 * Uriyadi stick — a wooden rod with a kasavu grip.
 * Drawn with the hitting tip at (0,0) and the handle running down-right, so
 * that the cursor hotspot / the point of impact is the tip.
 */
const Stick: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg viewBox="0 0 90 230" className={className} aria-hidden="true">
    <defs>
      {/* lacquered deep-red shaft — same red as the pookalam's outer ring */}
      <linearGradient id="onam-stick-wood" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={PALETTE.vermilionDeep} />
        <stop offset="45%" stopColor="#C72A44" />
        <stop offset="100%" stopColor={PALETTE.vermilionDeep} />
      </linearGradient>
    </defs>
    <g transform="rotate(22 45 0)">
      <rect x="36" y="0" width="18" height="230" rx="9" fill="url(#onam-stick-wood)" />
      {/* highlight */}
      <path d="M41 18 Q43 80 40 140 Q39 190 42 222" stroke={PALETTE.jasmine} strokeWidth="1.2" fill="none" opacity="0.35" />
      {/* orange bands along the shaft */}
      {[60, 100].map((y) => (
        <rect key={y} x="36" y={y} width="18" height="5" fill={PALETTE.saffron} />
      ))}
      {/* jasmine grip with turmeric-yellow stripes */}
      <rect x="34" y="150" width="22" height="58" rx="4" fill={PALETTE.jasmine} />
      {[158, 170, 182, 194].map((y) => (
        <rect key={y} x="34" y={y} width="22" height="4" fill={PALETTE.marigold} />
      ))}
      {/* marigold head on the tip */}
      <circle cx="45" cy="8" r="11" fill={PALETTE.marigold} />
      <circle cx="45" cy="8" r="6" fill={PALETTE.saffron} />
      <circle cx="45" cy="8" r="2.5" fill={PALETTE.jasmine} />
    </g>
  </svg>
);

/* ================================================================== */
/*  MAIN COMPONENT                                                    */
/* ================================================================== */

const OnamHero: React.FC<OnamHeroProps> = ({
  desktopVideo = ONAM_DEVICE.desktop.video,
  mobileVideo = ONAM_DEVICE.mobile.video,
  poster,
  desktopRevealVideo = ONAM_DEVICE.desktop.revealVideo,
  mobileRevealVideo = ONAM_DEVICE.mobile.revealVideo,
  revealVideoMuted = true,
  revealVideoLoop = false,
  desktopFinalPoster = ONAM_DEVICE.desktop.finalPoster,
  mobileFinalPoster = ONAM_DEVICE.mobile.finalPoster,
  onPosterShown,
  onRevealComplete,
  bodyFont = '"Manrope", "Inter", system-ui, sans-serif',
  scriptFont = '"Great Vibes", "Allura", "Dancing Script", cursive',
  wishTitle = ONAM_SHARED.wishTitle,
  wishSub = ONAM_SHARED.wishSub,
  navLabel = ONAM_SHARED.navLabel,
  programmeId = ONAM_SHARED.programmeId,
  bgMusic = ONAM_SHARED.bgMusic,
  bgMusicVolume = ONAM_SHARED.bgMusicVolume,
  greetTitle = ONAM_SHARED.greetTitle,
  greetSub = ONAM_SHARED.greetSub,
  className = "",
}) => {
  /* -------------------------- environment -------------------------- */
  const isMobile = useMediaQuery(MOBILE_QUERY, false);
  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY, false);
  const videoSrc = isMobile ? mobileVideo : desktopVideo;
  const revealSrc = isMobile ? mobileRevealVideo : desktopRevealVideo;
  const finalPosterSrc = isMobile ? mobileFinalPoster : desktopFinalPoster;
  const potPosition = isMobile ? ONAM_POT_POSITION.mobile : ONAM_POT_POSITION.desktop;

  /* -------------------------- state -------------------------- */
  const [isPotReady, setIsPotReady] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPosterShown, setIsPosterShown] = useState(false);
  const [isHitting, setIsHitting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isNearPot, setIsNearPot] = useState(false);
  const hasCrackedRef = useRef(false);

  /* -------------------------- refs -------------------------- */
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const revealVideoRef = useRef<HTMLVideoElement>(null);
  const crackButtonRef = useRef<HTMLButtonElement>(null);
  const potGlowTweenRef = useRef<gsap.core.Tween | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const petalsRef = useRef<HTMLDivElement>(null);
  const potStageRef = useRef<HTMLDivElement>(null);
  const potRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);
  const cursorStickRef = useRef<HTMLDivElement>(null);
  const mobileStickRef = useRef<HTMLDivElement>(null);
  const wishRef = useRef<HTMLDivElement>(null);
  const navTextRef = useRef<HTMLSpanElement>(null);
  const navArrowRef = useRef<HTMLSpanElement>(null);
  const greetRef = useRef<HTMLDivElement>(null);

  /* -------------------------- derived data -------------------------- */
  const petals = useMemo(
    () => (prefersReducedMotion ? [] : generatePetals(isMobile ? 18 : 34, isMobile ? 7 : 3)),
    [isMobile, prefersReducedMotion]
  );
  const burstCount = isMobile ? 42 : 70;

  // Stick cursor only on devices with a real pointer, and only while hovering near the pot.
  const stickEnabled = !isMobile && !prefersReducedMotion && isPotReady && !isExploding;
  const useStickCursor = stickEnabled && isNearPot;

  /* ================================================================ */
  /*  BACKGROUND VIDEO                                                  */
  /* ================================================================ */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => undefined);
  }, [videoSrc]);

  /* ================================================================ */
  /*  BACKGROUND MUSIC — shared player (started by the preloader)       */
  /* ================================================================ */
  useEffect(() => {
    if (!bgMusic) return;
    // No-op if the preloader already started it; otherwise starts here.
    onamMusic.start(bgMusic, bgMusicVolume);
    return onamMusic.subscribe(({ playing, muted }) => {
      setIsMusicPlaying(playing);
      setIsMuted(muted);
    });
  }, [bgMusic, bgMusicVolume]);

  const toggleMute = useCallback(() => {
    onamMusic.toggleMuted();
  }, []);

  /* ================================================================ */
  /*  PETALS                                                            */
  /* ================================================================ */
  useEffect(() => {
    if (!petalsRef.current || petals.length === 0) return;

    const ctx = gsap.context(() => {
      const nodes = petalsRef.current!.querySelectorAll<HTMLElement>("[data-petal]");
      nodes.forEach((el, i) => {
        const p = petals[i];
        if (!p) return;
        gsap.set(el, { y: -40, x: 0, rotation: p.rotation, opacity: 0 });
        gsap.to(el, {
          y: () => window.innerHeight + 60,
          duration: p.duration,
          delay: p.delay,
          repeat: -1,
          ease: "none",
          onRepeat: () => gsap.set(el, { y: -40 }),
        });
        gsap.to(el, {
          x: p.drift,
          duration: 3 + Math.abs(p.drift) / 60,
          delay: p.delay,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        gsap.to(el, {
          rotation: `+=${p.drift > 0 ? 360 : -360}`,
          duration: p.duration * 0.8,
          delay: p.delay,
          repeat: -1,
          ease: "none",
        });
        gsap.to(el, { opacity: p.opacity, duration: 1.5, delay: p.delay, ease: "power1.out" });
      });
    }, petalsRef);

    return () => ctx.revert();
  }, [petals]);

  /* ================================================================ */
  /*  WISH TEXT + NAV PILL (label ⇄ arrow loop)                         */
  /* ================================================================ */
  useEffect(() => {
    const wish = wishRef.current;
    const text = navTextRef.current;
    const arrow = navArrowRef.current;
    if (!wish || !text || !arrow) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(wish, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.2, delay: 1.0, ease: "power3.out" });

      if (prefersReducedMotion) {
        gsap.set(text, { opacity: 1 });
        gsap.set(arrow, { opacity: 0 });
        return;
      }

      // Looping swap: label shows, slides up & out; arrow slides in, bobs, slides out; repeat.
      gsap.set(arrow, { opacity: 0, y: 10 });
      const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.2, delay: 1.8 });
      loop
        .to({}, { duration: 2.4 }) // hold label
        .to(text, { opacity: 0, y: -10, duration: 0.4, ease: "power2.in" })
        .fromTo(arrow, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, "-=0.1")
        .to(arrow, { y: 5, duration: 0.5, repeat: 3, yoyo: true, ease: "sine.inOut" })
        .to(arrow, { opacity: 0, y: -10, duration: 0.4, ease: "power2.in" })
        .fromTo(text, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, "-=0.1");
    }, wish.parentElement ?? undefined);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  const scrollToProgramme = useCallback(() => {
    const target = document.getElementById(programmeId);
    if (target) {
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  }, [programmeId, prefersReducedMotion]);

  /* ================================================================ */
  /*  STICK CURSOR (desktop) — follows the pointer, only near the pot    */
  /* ================================================================ */
  useEffect(() => {
    const section = sectionRef.current;
    const stick = cursorStickRef.current;
    const pot = potRef.current;
    if (!section || !stick || !pot || !stickEnabled) {
      setIsNearPot(false);
      return;
    }

    const REACH = 140; // px around the pot's box where the stick appears
    const xTo = gsap.quickTo(stick, "x", { duration: 0.18, ease: "power3.out" });
    const yTo = gsap.quickTo(stick, "y", { duration: 0.18, ease: "power3.out" });
    let near = false;

    const setNear = (n: boolean) => {
      if (n === near) return;
      near = n;
      setIsNearPot(n);
      gsap.to(stick, { autoAlpha: n ? 1 : 0, scale: n ? 1 : 0.8, duration: 0.25, overwrite: "auto" });
    };

    const onMove = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      const r = pot.getBoundingClientRect();
      const inside =
        e.clientX > r.left - REACH &&
        e.clientX < r.right + REACH &&
        e.clientY > r.top - REACH * 0.5 &&
        e.clientY < r.bottom + REACH;
      setNear(inside);
    };
    const onLeave = () => setNear(false);

    gsap.set(stick, { autoAlpha: 0, scale: 0.8, rotation: 0, transformOrigin: "0% 0%" });
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      gsap.to(stick, { autoAlpha: 0, duration: 0.2 });
    };
  }, [stickEnabled]);

  /* ================================================================ */
  /*  STAGE 1 — pot hangs in and waits (slow pendulum swing)            */
  /* ================================================================ */
  const runPotEntrance = useCallback(() => {
    const stage = potStageRef.current;
    const pot = potRef.current;
    const overlay = overlayRef.current;
    const button = crackButtonRef.current;
    if (!stage || !pot || !overlay) return;

    const cracks = pot.querySelectorAll<SVGPathElement>("[data-crack]");
    cracks.forEach((c) => {
      const len = c.getTotalLength();
      gsap.set(c, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
    });

    gsap.set(stage, { autoAlpha: 1 });

    if (prefersReducedMotion) {
      const tl = gsap.timeline();
      tl.to(overlay, { opacity: 1, duration: 0.5 });
      tl.set(pot, { opacity: 1, yPercent: 0, rotation: 0 });
      tl.set(button, { opacity: 1, y: 0 });
      return () => tl.kill();
    }

    gsap.set(pot, { yPercent: -110, opacity: 0, rotation: 0, transformOrigin: "50% 0%" });
    gsap.set(button, { opacity: 0, y: 16 });

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.to(overlay, { opacity: 1, duration: 0.8, ease: "power2.inOut" });
    tl.to(pot, { yPercent: 0, opacity: 1, duration: 1.4, ease: "elastic.out(1, 0.55)" }, "-=0.2");
    tl.fromTo(pot, { rotation: -6 }, { rotation: 0, duration: 1.6, ease: "elastic.out(1, 0.4)" }, "<0.1");
    tl.to(
      pot,
      {
        filter: `drop-shadow(0 0 28px ${PALETTE.marigold}CC) drop-shadow(0 0 70px ${PALETTE.saffron}88)`,
        duration: 0.9,
      },
      "-=0.5"
    );
    tl.to(button, { opacity: 1, y: 0, duration: 0.7 }, "-=0.3");

    // Idle: slow pendulum swing from the rope knot + breathing glow.
    tl.add(() => {
      const idle = gsap.timeline({ repeat: -1 });
      idle
        .to(pot, { rotation: 4.5, duration: 2.6, ease: "sine.inOut" })
        .to(pot, { rotation: -4.5, duration: 2.6, ease: "sine.inOut" })
        .to(
          pot,
          {
            filter: `drop-shadow(0 0 44px ${PALETTE.marigold}) drop-shadow(0 0 110px ${PALETTE.saffron}AA)`,
            duration: 2.6,
            ease: "sine.inOut",
            yoyo: true,
            repeat: 1,
          },
          0
        );
      potGlowTweenRef.current = idle as unknown as gsap.core.Tween;
    });

    return () => {
      tl.kill();
      potGlowTweenRef.current?.kill();
      potGlowTweenRef.current = null;
    };
  }, [prefersReducedMotion]);

  /* ================================================================ */
  /*  STAGE 1b — the stick hits the pot                                 */
  /* ================================================================ */
  const runStickHit = useCallback(
    (done: () => void) => {
      const pot = potRef.current;
      if (!pot || prefersReducedMotion) {
        done();
        return () => undefined;
      }

      const tl = gsap.timeline({ onComplete: done });

      if (isMobile) {
        const stick = mobileStickRef.current;
        if (!stick) {
          done();
          return () => undefined;
        }
        // Stick flies in from the right, swings, and strikes the pot.
        gsap.set(stick, { autoAlpha: 0, x: 260, y: -40, rotation: 70, transformOrigin: "100% 100%" });
        tl.to(stick, { autoAlpha: 1, duration: 0.15 });
        tl.to(stick, { x: 40, y: 0, rotation: 10, duration: 0.45, ease: "power3.in" }, "<");
        tl.to(stick, { rotation: -18, duration: 0.08, ease: "power1.out" });
        tl.to(pot, { x: -10, rotation: -4, duration: 0.08, ease: "power2.out" }, "<");
        tl.to(pot, { x: 0, rotation: 0, duration: 0.3, ease: "elastic.out(1, 0.4)" });
        tl.to(stick, { x: 120, rotation: 40, autoAlpha: 0, duration: 0.35, ease: "power2.in" }, "<");
      } else {
        const stick = cursorStickRef.current;
        if (!stick) {
          done();
          return () => undefined;
        }
        // Wind up, swing through, recoil.
        tl.to(stick, { rotation: -55, duration: 0.22, ease: "power2.out" });
        tl.to(stick, { rotation: 22, duration: 0.1, ease: "power3.in" });
        tl.to(pot, { x: -8, rotation: -3, duration: 0.06, ease: "power2.out" }, "<");
        tl.to(stick, { rotation: 0, duration: 0.35, ease: "elastic.out(1, 0.5)" });
        tl.to(pot, { x: 0, rotation: 0, duration: 0.25, ease: "power2.out" }, "<");
        tl.to(stick, { autoAlpha: 0, duration: 0.3 }, "<0.1");
      }

      return () => tl.kill();
    },
    [isMobile, prefersReducedMotion]
  );

  /* ================================================================ */
  /*  STAGE 2 — pot cracks, bursts, reveal video plays                  */
  /* ================================================================ */
  const runCrackSequence = useCallback(() => {
    const reveal = revealVideoRef.current;
    const stage = potStageRef.current;
    const pot = potRef.current;
    const flash = flashRef.current;
    const burst = burstRef.current;
    const overlay = overlayRef.current;
    const button = crackButtonRef.current;
    const wish = wishRef.current;
    const greet = greetRef.current;
    if (!stage || !pot || !flash || !burst || !overlay) return;

    potGlowTweenRef.current?.kill();
    potGlowTweenRef.current = null;

    // Bottom-left wish goes away the moment the pot is struck.
    if (wish) gsap.to(wish, { autoAlpha: 0, y: 12, duration: 0.4, ease: "power2.in" });

    const playReveal = () => {
      if (!reveal) return;
      reveal.currentTime = 0;
      reveal.muted = revealVideoMuted;
      reveal.play().catch(() => {
        reveal.muted = true;
        reveal.play().catch(() => undefined);
      });
    };

    const finishReveal = () => {
      videoRef.current?.pause();
      setIsRevealed(true);
      onRevealComplete?.();
    };

    if (prefersReducedMotion) {
      const tl = gsap.timeline({ onComplete: finishReveal });
      if (greet) {
        tl.to(greet, { autoAlpha: 1, duration: 0.6 });
        tl.to(greet, { autoAlpha: 0, duration: 0.6 }, "+=1.4");
      }
      tl.add(playReveal);
      tl.set(reveal, { autoAlpha: 1, clipPath: "none", scale: 1 });
      tl.to([stage, overlay], { autoAlpha: 0, duration: 0.8 });
      return () => tl.kill();
    }

    const cracks = pot.querySelectorAll<SVGPathElement>("[data-crack]");
    const shards = burst.querySelectorAll<HTMLElement>("[data-burst]");
    const potShards = pot.querySelectorAll<SVGGraphicsElement>("[data-shard]");
    const innerFlowers = pot.querySelectorAll<SVGGraphicsElement>("[data-inner]");
    const potLight = pot.querySelector<SVGElement>("[data-pot-light]");
    const potBase = pot.querySelector<SVGElement>("[data-pot-base]");
    const ropes = pot.querySelector<SVGElement>("[data-rope]");
    gsap.set(pot, { transformOrigin: "50% 0%" });

    gsap.set(flash, { opacity: 0 });
    gsap.set(shards, { x: 0, y: 0, scale: 0, opacity: 0, rotation: 0 });
    gsap.set(reveal, { autoAlpha: 0 });

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: finishReveal,
    });

    tl.to(button, { opacity: 0, y: 10, duration: 0.3 });

    // Vibration on the rope (shorter now — the stick already struck)
    tl.to(pot, { rotation: 1.2, duration: 0.05, repeat: 10, yoyo: true, ease: "sine.inOut" }, "<");
    tl.to(pot, { rotation: -2.6, duration: 0.04, repeat: 16, yoyo: true, ease: "sine.inOut" }, "-=0.15");

    tl.to(cracks, { opacity: 1, strokeDashoffset: 0, duration: 0.7, stagger: 0.1, ease: "power1.inOut" }, "-=0.7");
    tl.to(
      pot,
      {
        filter: `drop-shadow(0 0 40px ${PALETTE.marigold}) drop-shadow(0 0 90px ${PALETTE.saffron}AA)`,
        duration: 0.6,
      },
      "-=0.4"
    );
    tl.to(potLight, { opacity: 0.9, duration: 0.5, ease: "power2.in" }, "-=0.5");
    tl.to(pot, { rotation: 0, scale: 1.04, duration: 0.25, ease: "power1.in" });

    tl.addLabel("burst");
    tl.set(potBase, { opacity: 0 }, "burst");
    tl.to(ropes, { opacity: 0, y: -40, duration: 0.6, ease: "power2.in" }, "burst+=0.2");
    tl.to(
      potShards,
      {
        x: (_i, el) => (Number(el.dataset.cx) - POT_CENTER.x) * gsap.utils.random(2.2, 3.4),
        y: (_i, el) => (Number(el.dataset.cy) - POT_CENTER.y) * gsap.utils.random(2.0, 3.0) - gsap.utils.random(20, 80),
        rotation: () => gsap.utils.random(-160, 160),
        scale: () => gsap.utils.random(0.7, 1.1),
        svgOrigin: (_i, el) => `${el.dataset.cx} ${el.dataset.cy}`,
        duration: 1.1,
        ease: "expo.out",
      },
      "burst"
    );
    tl.to(potShards, { opacity: 0, duration: 0.5, ease: "power2.in" }, "burst+=0.45");

    // Flowers from inside the pot spill upward and outward
    tl.set(innerFlowers, { opacity: 1 }, "burst");
    tl.to(
      innerFlowers,
      {
        x: (_i, el) => (Number(el.dataset.cx) - POT_CENTER.x) * gsap.utils.random(1.6, 3.2) + gsap.utils.random(-60, 60),
        y: (_i, el) => (Number(el.dataset.cy) - POT_CENTER.y) * gsap.utils.random(0.8, 1.6) - gsap.utils.random(140, 320),
        rotation: () => gsap.utils.random(-300, 300),
        scale: () => gsap.utils.random(0.9, 1.6),
        svgOrigin: (_i, el) => `${el.dataset.cx} ${el.dataset.cy}`,
        duration: 0.9,
        ease: "expo.out",
      },
      "burst"
    );
    tl.to(
      innerFlowers,
      {
        y: "+=260",
        rotation: "+=120",
        duration: 1.2,
        ease: "power2.in",
      },
      "burst+=0.5"
    );
    tl.to(innerFlowers, { opacity: 0, duration: 0.5, ease: "power2.in" }, "burst+=1.0");

    tl.to(potLight, { opacity: 1, scale: 2.4, svgOrigin: `${POT_CENTER.x} ${POT_CENTER.y}`, duration: 0.5, ease: "power3.out" }, "burst");
    tl.to(potLight, { opacity: 0, duration: 0.6 }, "burst+=0.5");
    tl.to(cracks, { opacity: 0, duration: 0.15 }, "burst");
    tl.to(
      shards,
      {
        x: () => gsap.utils.random(-1, 1) * (isMobile ? 260 : 520),
        y: () => gsap.utils.random(-1, 1) * (isMobile ? 420 : 460),
        scale: () => gsap.utils.random(0.6, 1.6),
        rotation: () => gsap.utils.random(-540, 540),
        opacity: 1,
        duration: 1.3,
        stagger: { each: 0.006, from: "center" },
        ease: "expo.out",
      },
      "burst"
    );
    tl.to(shards, { opacity: 0, duration: 0.6, stagger: { each: 0.004 } }, "burst+=0.8");
    tl.fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "power1.in" }, "burst+=0.05");

    // Centred "Happy Onam!" greeting rides the golden flash
    if (greet) {
      const greetLines = greet.querySelectorAll<HTMLElement>("[data-greet-line]");
      tl.set(greet, { autoAlpha: 1 }, "burst+=0.15");
      tl.fromTo(
        greetLines,
        { opacity: 0, y: 30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.15, ease: "back.out(1.6)" },
        "burst+=0.15"
      );
      tl.to(greetLines, { opacity: 0, y: -24, scale: 1.05, duration: 0.6, stagger: 0.08, ease: "power2.in" }, "burst+=2.3");
      tl.set(greet, { autoAlpha: 0 }, "burst+=3.1");
    }

    // Reveal video (muted) scales in once the greeting has had its moment
    tl.add(playReveal, "burst+=2.2");
    tl.set(
      reveal,
      { autoAlpha: 1, clipPath: "circle(0% at 50% 50%)", scale: 1.18, transformOrigin: "50% 50%" },
      "burst+=2.2"
    );
    tl.to(flash, { opacity: 0, duration: 2.0, ease: "power2.out" }, "burst+=0.4");
    tl.to(overlay, { opacity: 0, duration: 0.8 }, "burst+=2.3");
    tl.to(reveal, { clipPath: "circle(120% at 50% 50%)", scale: 1, duration: 1.3, ease: "expo.inOut" }, "burst+=2.3");
    tl.to(stage, { autoAlpha: 0, duration: 0.3 }, "burst+=1.4");
    tl.set(reveal, { clearProps: "clipPath,transform" });

    return () => tl.kill();
  }, [isMobile, onRevealComplete, prefersReducedMotion, revealVideoMuted]);

  useEffect(() => {
    setIsPotReady(true);
  }, []);

  useEffect(() => {
    if (!isPotReady) return;
    const cleanup = runPotEntrance();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [isPotReady, runPotEntrance]);

  // User cracks the pot → stick hit → burst + reveal (once).
  const handleCrack = useCallback(() => {
    if (hasCrackedRef.current || !isPotReady) return;
    hasCrackedRef.current = true;
    potGlowTweenRef.current?.kill();
    potGlowTweenRef.current = null;
    setIsHitting(true);
  }, [isPotReady]);

  useEffect(() => {
    if (!isHitting) return;
    const cleanup = runStickHit(() => setIsExploding(true));
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [isHitting, runStickHit]);

  useEffect(() => {
    if (!isExploding) return;
    let cleanup: (() => void) | void;
    const raf = window.requestAnimationFrame(() => {
      cleanup = runCrackSequence();
    });
    return () => {
      window.cancelAnimationFrame(raf);
      if (typeof cleanup === "function") cleanup();
    };
  }, [isExploding, runCrackSequence]);

  /* ================================================================ */
  /*  STAGE 3 — reveal video ends: full-screen poster + falling petals  */
  /* ================================================================ */
  useEffect(() => {
    const reveal = revealVideoRef.current;
    if (!reveal || !isRevealed || revealVideoLoop) return;

    const showPoster = () => {
      if (isPosterShown) return;
      setIsPosterShown(true);
      onPosterShown?.();
    };
    reveal.addEventListener("ended", showPoster);
    return () => reveal.removeEventListener("ended", showPoster);
  }, [isRevealed, isPosterShown, revealVideoLoop, onPosterShown]);

  useEffect(() => {
    if (!isPosterShown) return;
    const poster = posterRef.current;
    const reveal = revealVideoRef.current;
    if (!poster) return;

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    // Wish stays hidden while the poster is up.
    if (wishRef.current) tl.set(wishRef.current, { autoAlpha: 0 });

    if (prefersReducedMotion) {
      tl.to(poster, { autoAlpha: 1, duration: 0.8 });
      tl.to(reveal, { autoAlpha: 0, duration: 0.8 }, "<");
      return () => {
        tl.kill();
      };
    }

    tl.fromTo(poster, { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: 1.6, ease: "power3.out" });
    tl.to(reveal, { autoAlpha: 0, duration: 1.0 }, "<0.4");
    tl.to(petalsRef.current, { opacity: 1, duration: 1.2 }, "-=0.8");

    return () => {
      tl.kill();
    };
  }, [isPosterShown, prefersReducedMotion]);

  useEffect(() => {
    const r = revealVideoRef.current;
    if (!r || isRevealed) return;
    r.load();
  }, [revealSrc, isRevealed]);

  /* ================================================================ */
  /*  RENDER                                                            */
  /* ================================================================ */
  const burstShapes = useMemo(
    () =>
      Array.from({ length: burstCount }, (_, i) => ({
        id: i,
        color: PETAL_COLORS[i % PETAL_COLORS.length],
        size: 6 + ((i * 7919) % 12),
        shape: i % 3,
      })),
    [burstCount]
  );

  const potInteractive = isPotReady && !isHitting && !isExploding;

  return (
    <section
      ref={sectionRef}
      className={`relative isolate h-[100svh] min-h-[560px] w-full overflow-hidden text-white ${className}`}
      style={{
        fontFamily: bodyFont,
        cursor: useStickCursor ? "none" : undefined,
        background: `radial-gradient(ellipse at 50% 40%, ${PALETTE.green} 0%, ${PALETTE.greenDeep} 60%, ${PALETTE.ink} 100%)`,
      }}
      aria-label={ONAM_SHARED.ariaLabel}
    >
      {/* 1. BACKGROUND VIDEO */}
      <video
        ref={videoRef}
        key={videoSrc}
        className="absolute inset-0 z-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={poster}
        disablePictureInPicture
        aria-hidden="true"
      >
        <source media="(max-width: 767px)" src={mobileVideo} type="video/mp4" />
        <source media="(min-width: 768px)" src={desktopVideo} type="video/mp4" />
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* 1a. CINEMATIC OVERLAY */}
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          opacity: 0,
          background: `radial-gradient(ellipse at 50% 30%, rgba(247,194,26,0.16) 0%, ${inkA(0)} 55%), linear-gradient(180deg, ${inkA(0.45)} 0%, ${inkA(0.22)} 45%, ${inkA(0.7)} 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ background: `radial-gradient(ellipse at center, ${inkA(0)} 55%, ${inkA(0.55)} 100%)` }}
      />

      {/* 1b. REVEAL VIDEO */}
      <video
        ref={revealVideoRef}
        key={revealSrc}
        className="absolute inset-0 z-[35] h-full w-full object-cover will-change-transform"
        style={{ opacity: 0, visibility: "hidden" }}
        loop={revealVideoLoop}
        muted={revealVideoMuted}
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-label="Onam reveal video"
      >
        <source src={revealSrc} type="video/mp4" />
      </video>

      {/* 1c. FINAL POSTER */}
      <div
        ref={posterRef}
        className="absolute inset-0 z-[36] will-change-transform"
        style={{ opacity: 0, visibility: "hidden" }}
        aria-hidden={!isPosterShown}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`${finalPosterSrc}-bg`}
          src={finalPosterSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover select-none"
          style={{ filter: "blur(28px) brightness(0.55) saturate(1.15)" }}
          draggable={false}
          loading="eager"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={finalPosterSrc}
          src={finalPosterSrc}
          alt="Onam 2026 poster"
          className="relative h-full w-full object-contain select-none"
          style={{ filter: "drop-shadow(0 24px 60px rgba(0,0,0,0.55))" }}
          draggable={false}
          loading="eager"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse at center, ${inkA(0)} 60%, ${inkA(0.4)} 100%)` }}
        />
      </div>

      {/* 3. FALLING PETALS */}
      <div
        ref={petalsRef}
        className={`pointer-events-none absolute inset-0 overflow-hidden ${isPosterShown ? "z-[38]" : "z-20"}`}
        aria-hidden="true"
      >
        {petals.map((p) => (
          <span
            key={p.id}
            data-petal
            className="absolute top-0 block will-change-transform"
            style={{
              left: `${p.x}vw`,
              width: p.size,
              height: p.size * 1.5,
              background: `linear-gradient(160deg, ${p.color} 0%, ${p.color}CC 60%, ${p.color}66 100%)`,
              boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
              opacity: 0,
              ...PETAL_SHAPES[p.shape],
            }}
          />
        ))}
      </div>

      {/* 11. POT STAGE */}
      <div
        ref={potStageRef}
        className={`pointer-events-none absolute inset-0 z-40 flex items-start px-6 sm:px-10 lg:px-20 ${
          potPosition === "left" ? "justify-start" : potPosition === "right" ? "justify-end" : "justify-center"
        }`}
        style={{ opacity: 0, visibility: "hidden" }}
        aria-hidden="true"
      >
        <div className="relative flex h-full flex-col items-center gap-4 md:gap-6">
          {/* Burst particles */}
          <div ref={burstRef} className="absolute left-1/2 top-[42%] h-0 w-0">
            {isExploding &&
              burstShapes.map((b) => (
                <span
                  key={b.id}
                  data-burst
                  className="absolute block will-change-transform"
                  style={{
                    left: -b.size / 2,
                    top: -b.size * 0.75,
                    width: b.size,
                    height: b.size * 1.5,
                    background: b.color,
                    opacity: 0,
                    ...PETAL_SHAPES[b.shape],
                  }}
                />
              ))}
          </div>

          {/* Mobile stick — flies in from the right on tap */}
          {isMobile && (
            <div
              ref={mobileStickRef}
              className="pointer-events-none absolute left-1/2 top-[34%] z-10 w-[72px] will-change-transform"
              style={{ opacity: 0, visibility: "hidden" }}
            >
              <Stick className="h-auto w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.5)]" />
            </div>
          )}

          <div
            ref={potRef}
            role="button"
            tabIndex={potInteractive ? 0 : -1}
            aria-label={ONAM_SHARED.crackButtonLabel}
            onClick={handleCrack}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCrack();
              }
            }}
            className={`relative will-change-transform outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent ${
              potInteractive ? "pointer-events-auto" : ""
            } ${potInteractive && !useStickCursor ? "cursor-pointer" : ""}`}
            style={{
              opacity: 0,
              cursor: useStickCursor ? "none" : undefined,
              ["--tw-ring-color" as string]: PALETTE.marigold,
            }}
          >
            <ClayPot sizeClass={isMobile ? "h-[58svh] aspect-[300/520]" : "h-[68vh] aspect-[300/520]"} />
          </div>

          <div className="flex flex-col items-center gap-3">
            <p
              className="text-[0.6rem] md:text-[0.7rem] uppercase tracking-[0.4em]"
              style={{ color: `${PALETTE.cream}B3`, opacity: isPotReady ? 1 : 0 }}
            >
              {ONAM_SHARED.potReadyLabel}
            </p>
            <button
              ref={crackButtonRef}
              type="button"
              onClick={handleCrack}
              disabled={!potInteractive}
              className={`rounded-full border px-7 py-3 text-[0.7rem] md:text-[0.75rem] uppercase tracking-[0.35em] transition-colors duration-300 outline-none focus-visible:ring-2 ${
                potInteractive ? "pointer-events-auto" : ""
              } ${potInteractive && !useStickCursor ? "cursor-pointer" : ""}`}
              style={{
                opacity: 0,
                cursor: useStickCursor ? "none" : undefined,
                borderColor: `${PALETTE.marigold}CC`,
                color: PALETTE.jasmine,
                background: inkA(0.38),
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                boxShadow: `0 0 30px ${PALETTE.marigold}40`,
                ["--tw-ring-color" as string]: PALETTE.marigold,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${PALETTE.marigold}33`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = inkA(0.38))}
            >
              {ONAM_SHARED.crackButtonLabel}
            </button>
          </div>
        </div>
      </div>

      {/* 11b. CENTRED GREETING (after the break, before the video) */}
      <div
        ref={greetRef}
        className="pointer-events-none absolute inset-0 z-[46] flex flex-col items-center justify-center px-6 text-center"
        style={{ opacity: 0, visibility: "hidden" }}
        aria-hidden="true"
      >
        <p
          data-greet-line
          className="leading-none text-[clamp(3.6rem,14vw,9rem)]"
          style={{
            fontFamily: scriptFont,
            color: PALETTE.jasmine,
            textShadow: `0 3px 0 ${PALETTE.marigold}, 0 6px 0 ${PALETTE.saffron}, 0 9px 0 ${PALETTE.vermilion}, 0 18px 50px rgba(0,0,0,0.45)`,
          }}
        >
          {greetTitle}
        </p>
        <p
          data-greet-line
          className="mt-4 text-[0.7rem] uppercase tracking-[0.5em] sm:text-[0.85rem]"
          style={{ color: PALETTE.ink }}
        >
          {greetSub}
        </p>
      </div>

      {/* 12. HAPPY ONAM WISH (bottom-left) */}
      <div
        ref={wishRef}
        className="pointer-events-none absolute bottom-6 left-5 z-[45] max-w-[62vw] sm:bottom-10 sm:left-10 lg:left-20"
        style={{ opacity: 0 }}
      >
        <p
          className="leading-none text-[clamp(2.4rem,7vw,4.6rem)]"
          style={{
            fontFamily: scriptFont,
            color: PALETTE.marigold,
            textShadow: `0 2px 0 ${PALETTE.saffron}, 0 10px 30px rgba(0,0,0,0.6)`,
          }}
        >
          {wishTitle}
        </p>
        <p
          className="mt-2 max-w-[34ch] text-[0.7rem] leading-relaxed tracking-[0.12em] sm:text-[0.8rem]"
          style={{ color: `${PALETTE.cream}D9` }}
        >
          {wishSub}
        </p>
      </div>

      {/* 13. NAV PILL (bottom-right) — label ⇄ arrow loop, scrolls to the programme */}
      <button
        type="button"
        onClick={scrollToProgramme}
        aria-label={navLabel}
        className="group absolute bottom-6 right-5 z-[45] flex h-12 min-w-[48px] items-center justify-center overflow-hidden rounded-full border px-3 outline-none transition-colors duration-300 focus-visible:ring-2 sm:bottom-10 sm:right-10 sm:h-14 sm:px-4 lg:right-20"
        style={{
          borderColor: `${PALETTE.marigold}CC`,
          background: inkA(0.42),
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: `0 0 30px ${PALETTE.marigold}40`,
          color: PALETTE.jasmine,
          cursor: "pointer",
          ["--tw-ring-color" as string]: PALETTE.marigold,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = `${PALETTE.marigold}33`)}
        onMouseLeave={(e) => (e.currentTarget.style.background = inkA(0.42))}
      >
        <span className="relative flex h-full min-w-[7.5rem] items-center justify-center sm:min-w-[9.5rem]">
          <span
            ref={navTextRef}
            className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-[0.62rem] uppercase tracking-[0.3em] sm:text-[0.7rem]"
          >
            {navLabel}
          </span>
          <span ref={navArrowRef} className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0 }}>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={PALETTE.marigold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 4v16" />
              <path d="M5 13l7 7 7-7" />
            </svg>
          </span>
        </span>
      </button>

      {/* 13b. MUTE / UNMUTE (top-right) */}
      {bgMusic && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? ONAM_SHARED.unmuteLabel : ONAM_SHARED.muteLabel}
          aria-pressed={isMuted}
          className="absolute right-5 top-5 z-[70] flex h-11 w-11 items-center justify-center rounded-full border outline-none transition-colors duration-300 focus-visible:ring-2 sm:right-10 sm:top-8 lg:right-20"
          style={{
            borderColor: `${PALETTE.marigold}CC`,
            background: inkA(0.42),
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: `0 0 24px ${PALETTE.marigold}40`,
            color: PALETTE.jasmine,
            cursor: "pointer",
            ["--tw-ring-color" as string]: PALETTE.marigold,
          }}
        >
          {isMuted ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H3v6h3l5 4V5z" />
              <path d="M22 9l-6 6M16 9l6 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H3v6h3l5 4V5z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          )}
          {/* tiny equaliser pulse when music is audible */}
          {isMusicPlaying && !isMuted && (
            <span
              className="absolute -bottom-1 -right-1 h-2.5 w-2.5 animate-pulse rounded-full"
              style={{ background: PALETTE.marigold }}
            />
          )}
        </button>
      )}

      {/* 14. STICK CURSOR (desktop) */}
      {!isMobile && (
        <div
          ref={cursorStickRef}
          className="pointer-events-none fixed left-0 top-0 z-[60] w-[70px] will-change-transform sm:w-[84px]"
          style={{ opacity: 0, visibility: "hidden" }}
          aria-hidden="true"
        >
          <Stick className="h-auto w-full drop-shadow-[0_12px_20px_rgba(0,0,0,0.55)]" />
        </div>
      )}

      {/* Golden flash */}
      <div
        ref={flashRef}
        className="pointer-events-none absolute inset-0 z-50"
        style={{
          opacity: 0,
          background: `radial-gradient(circle at 50% 50%, ${PALETTE.jasmine} 0%, ${PALETTE.marigold} 28%, ${PALETTE.saffron}DD 50%, ${PALETTE.vermilion}99 66%, ${inkA(0)} 82%)`,
        }}
        aria-hidden="true"
      />
    </section>
  );
};

export default OnamHero;