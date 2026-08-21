"use client";

/**
 * OnamProgramme.tsx
 * ------------------------------------------------------------------
 * Event programme section — web version of the printed invitation.
 *
 *   [ brand logo image ]
 *   — PRESENTS —
 *   [ ornate medallion: event title + edition number ]
 *   Onam Celebration 2026
 *   Activities  |  Date / Time / Venue / Dress code
 *   closing lines · Happy Onam! · Team name
 *   — IN ASSOCIATION WITH —  [ partner logos ]
 *   pookalam
 *
 * CHANGES IN THIS VERSION
 *  • Brand text wordmark removed → dedicated logo image slot (`brandLogo`).
 *  • New partners strip at the bottom (`partners` array of logos).
 *  • Fonts (Great Vibes / Baloo Chettan 2 / Manrope) are loaded from Google
 *    Fonts automatically (`loadFonts` prop). Set it to false if you load
 *    them yourself via next/font.
 *  • Fixed alignment: subtitle + year wrap cleanly on mobile, the
 *    activities/details columns are balanced around the centre divider on
 *    desktop and stacked with a horizontal rule on mobile.
 *
 * Dependencies: react, gsap, tailwindcss
 * Put logo files in /public (e.g. /public/logos/mindstory.png) and
 * reference them as "/logos/mindstory.png".
 * ------------------------------------------------------------------
 */

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ================================================================== */
/*  CONFIG — edit the programme content here                          */
/* ================================================================== */

export interface PartnerLogo {
  name: string;
  /** Path to the logo (png/svg/webp). */
  logo: string;
  /** Optional link. */
  href?: string;
}

export const PROGRAMME_CONTENT = {
  /** Main brand logo shown at the very top. */
  brandLogo: "https://mindstory.in/wp-content/uploads/Model_B_LOGO_MS2-3-png.avif",
  brandName: "Mindstory",
  presentsLabel: "Presents",
  /** Main title inside the medallion (Malayalam/any script). */
  eventTitle: "ആരവം",
  /** Edition number rendered large beneath the title. */
  edition: "11",
  subtitle: "Onam Celebration",
  year: "2026",
  activitiesLabel: "Activities",
  activities: [
    "Pookkalam",
    "Onam Sadhya",
    "Games",
    "Music",
    "Celebrations",
    "Thiruvathira",
    "Uriyadi",
    "Fun Activities",
  ],
  details: [
    { label: "Date", value: "22nd August 2026" },
    { label: "Time", value: "9 AM to 5 PM" },
    { label: "Venue", value: "Urakam Ayur Village" },
    { label: "Dress Code", value: "Traditional Kerala Attire" },
  ],
  noteLine1: "Come dressed in your Onam best",
  noteLine2: "and bring your festive spirit!",
  tagline: "Let's make this Onam a celebration to remember.",
  signoff: "Happy Onam!",
  team: "Team Mindstory",
  partnersLabel: "In association with",
  partners: [
    { name: "Partner One", logo: "https://21fiftyone.com/logo/2151-logo.png", href: "https://example.com" },
    { name: "Partner Two", logo: "https://viralcatmeow.com/assets/New-images/logo/Asset-4.svg" },
    { name: "Partner Three", logo: "https://mpxcode.com/_next/static/media/myndpixel.843680e1.png" },
    { name: "Partner Four", logo: "https://seorankbird.com/wp-content/uploads/2026/03/cropped-Rankbird-Logo-10-2-scaled-3.png" },
  ] as PartnerLogo[],
} as const;

/* ================================================================== */
/*  TYPES                                                             */
/* ================================================================== */

export interface ProgrammeDetail {
  label: string;
  value: string;
}

export interface OnamProgrammeProps {
  /** Brand logo image (required for the header). */
  brandLogo?: string;
  /** Alt text for the logo. */
  brandName?: string;
  presentsLabel?: string;
  eventTitle?: string;
  edition?: string;
  subtitle?: string;
  year?: string;
  activitiesLabel?: string;
  activities?: readonly string[];
  details?: readonly ProgrammeDetail[];
  noteLine1?: string;
  noteLine2?: string;
  tagline?: string;
  signoff?: string;
  team?: string;
  partnersLabel?: string;
  /** Partner / sponsor logos shown at the bottom. Pass [] to hide. */
  partners?: readonly PartnerLogo[];
  /** Script face for "Onam Celebration", "Activities", "Happy Onam!" */
  scriptFont?: string;
  /** Malayalam-capable display face for the medallion title. */
  titleFont?: string;
  /** Body sans-serif. */
  bodyFont?: string;
  /** Inject the Google Fonts <link> for the default faces. Default true. */
  loadFonts?: boolean;
  className?: string;
  id?: string;
}

/* ================================================================== */
/*  TOKENS                                                            */
/* ================================================================== */

const C = {
  teal: "#0E6F68",
  tealDeep: "#0A554F",
  tealLight: "#178A80",
  gold: "#F2B53A",
  goldDeep: "#C98B18",
  goldPale: "#FFE08A",
  magenta: "#B8136E",
  magentaDeep: "#7D0C4B",
  cream: "#F6EFDD",
  creamDim: "rgba(246,239,221,0.72)",
  line: "rgba(246,239,221,0.28)",
} as const;

const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Baloo+Chettan+2:wght@700;800&family=Manrope:wght@300;400;500;700&display=swap";

/* ================================================================== */
/*  DECORATIVE SVGS                                                   */
/* ================================================================== */

/** Round to 2 dp — raw float output can differ between server and client and trigger hydration errors. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Ornate gold medallion with magenta disc; title + edition are HTML on top. */
const Medallion: React.FC = () => {
  const scrolls = Array.from({ length: 8 }, (_, i) => i * 45);
  const beads = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    return { x: r2(200 + Math.cos(a) * 158), y: r2(200 + Math.sin(a) * 158) };
  });
  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="prg-disc" cx="45%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#D81E84" />
          <stop offset="60%" stopColor={C.magenta} />
          <stop offset="100%" stopColor={C.magentaDeep} />
        </radialGradient>
        <linearGradient id="prg-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.goldPale} />
          <stop offset="45%" stopColor={C.gold} />
          <stop offset="100%" stopColor={C.goldDeep} />
        </linearGradient>
        <filter id="prg-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      <g fill="none" stroke="url(#prg-gold)" strokeWidth="3" strokeLinecap="round" opacity="0.9">
        {scrolls.map((deg) => (
          <g key={deg} transform={`rotate(${deg} 200 200)`}>
            <path d="M200 26 C 214 34, 226 30, 232 18 C 238 8, 228 2, 222 8 C 216 14, 224 22, 232 18" />
            <path d="M200 26 C 186 34, 174 30, 168 18 C 162 8, 172 2, 178 8 C 184 14, 176 22, 168 18" />
            <circle cx="200" cy="20" r="3.5" fill="url(#prg-gold)" stroke="none" />
          </g>
        ))}
      </g>

      <circle cx="200" cy="200" r="170" fill="none" stroke="url(#prg-gold)" strokeWidth="6" filter="url(#prg-shadow)" />
      <circle cx="200" cy="200" r="162" fill="none" stroke={C.goldDeep} strokeWidth="1.2" opacity="0.7" />
      {beads.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r="2.2" fill={C.goldPale} opacity="0.9" />
      ))}
      <circle cx="200" cy="200" r="150" fill="none" stroke="url(#prg-gold)" strokeWidth="3" />

      <circle cx="200" cy="200" r="140" fill="url(#prg-disc)" filter="url(#prg-shadow)" />
      <circle cx="200" cy="200" r="140" fill="none" stroke={C.goldPale} strokeWidth="1.5" opacity="0.6" />
      <ellipse cx="170" cy="150" rx="70" ry="40" fill="#fff" opacity="0.06" />

      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${200 + s * 196} 200)`} fill="url(#prg-gold)">
          <path d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3 Z" />
          <circle cx={s * -16} cy="0" r="2" />
          <circle cx={s * -24} cy="0" r="1.4" opacity="0.7" />
        </g>
      ))}
    </svg>
  );
};

/** Concentric pookalam (flower carpet). */
const Pookalam: React.FC<{ className?: string }> = ({ className }) => {
  const rings = [
    { r: 118, n: 28, color: "#E8611F", pr: 11 },
    { r: 96, n: 24, color: "#F6A21B", pr: 10 },
    { r: 74, n: 20, color: "#C8412B", pr: 9 },
    { r: 52, n: 14, color: "#FFD23A", pr: 8 },
    { r: 30, n: 10, color: "#F6EFDD", pr: 6 },
  ];
  return (
    <svg viewBox="0 0 260 260" className={className} aria-hidden="true">
      <circle cx="130" cy="130" r="126" fill="#3F9A37" opacity="0.9" />
      {rings.map((ring, ri) =>
        Array.from({ length: ring.n }, (_, i) => {
          const a = (i / ring.n) * Math.PI * 2;
          const cx = r2(130 + Math.cos(a) * ring.r);
          const cy = r2(130 + Math.sin(a) * ring.r);
          const deg = r2((a * 180) / Math.PI);
          return (
            <ellipse
              key={`${ri}-${i}`}
              cx={cx}
              cy={cy}
              rx={ring.pr}
              ry={r2(ring.pr * 0.62)}
              fill={ring.color}
              transform={`rotate(${deg} ${cx} ${cy})`}
            />
          );
        })
      )}
      <circle cx="130" cy="130" r="12" fill="#C8412B" />
      <circle cx="130" cy="130" r="5" fill="#FFD23A" />
    </svg>
  );
};

/** Cream line-art: palm, backwater, boat, bunting. */
const SceneLines: React.FC = () => (
  <svg
    viewBox="0 0 1200 420"
    preserveAspectRatio="xMidYMax slice"
    className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] w-full md:h-[46%]"
    aria-hidden="true"
  >
    <g fill="none" stroke={C.cream} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.42">
      <path d="M92 420 C 96 340, 104 280, 118 236" />
      <path d="M118 236 C 80 210, 40 214, 16 238 M118 236 C 90 196, 60 186, 24 196 M118 236 C 124 192, 150 166, 190 160 M118 236 C 150 200, 194 198, 228 214 M118 236 C 156 222, 200 236, 224 262" />
      <path d="M0 332 Q 120 322, 240 332 T 480 332 T 720 332 T 960 332 T 1200 332" opacity="0.7" />
      <path d="M0 364 Q 150 354, 300 364 T 600 364 T 900 364 T 1200 364" opacity="0.5" />
      <path d="M0 396 Q 100 388, 200 396 T 400 396 T 600 396 T 800 396 T 1000 396 T 1200 396" opacity="0.35" />
      <path d="M60 300 C 70 316, 140 322, 230 318 C 300 316, 350 306, 372 292 C 330 304, 260 308, 200 306 C 140 304, 90 302, 60 300 Z" />
      <path d="M60 300 C 40 290, 34 276, 44 262" />
      <path d="M372 292 C 392 280, 396 266, 386 254" />
      <path d="M440 300 L 520 252 L 600 300 M 470 300 L 470 282 M 570 300 L 570 282 M 500 300 L 500 268 L 540 268 L 540 300" />
      <path d="M760 180 Q 900 230, 1040 180 Q 1120 160, 1200 190" />
      {Array.from({ length: 12 }, (_, i) => {
        const t = i / 11;
        const x = r2(760 + t * 440);
        const y = r2(180 + Math.sin(t * Math.PI) * 44);
        return <path key={i} d={`M${r2(x - 9)} ${y} L${x} ${r2(y + 18)} L${r2(x + 9)} ${y}`} />;
      })}
      <path d="M1096 226 C 1080 200, 1060 196, 1040 220 M1068 212 L 1068 260 M1040 220 Q 1068 206, 1096 226" />
    </g>
  </svg>
);

/** Thin gold rule with a label in the middle: ── LABEL ── */
const LabelRule: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div
    className={`flex items-center justify-center gap-3 text-[0.65rem] uppercase tracking-[0.45em] ${className}`}
    style={{ color: C.creamDim }}
  >
    <span className="h-px w-10 shrink-0" style={{ background: C.line }} />
    <span className="whitespace-nowrap">{children}</span>
    <span className="h-px w-10 shrink-0" style={{ background: C.line }} />
  </div>
);

/* ================================================================== */
/*  COMPONENT                                                         */
/* ================================================================== */

const OnamProgramme: React.FC<OnamProgrammeProps> = ({
  brandLogo = PROGRAMME_CONTENT.brandLogo,
  brandName = PROGRAMME_CONTENT.brandName,
  presentsLabel = PROGRAMME_CONTENT.presentsLabel,
  eventTitle = PROGRAMME_CONTENT.eventTitle,
  edition = PROGRAMME_CONTENT.edition,
  subtitle = PROGRAMME_CONTENT.subtitle,
  year = PROGRAMME_CONTENT.year,
  activitiesLabel = PROGRAMME_CONTENT.activitiesLabel,
  activities = PROGRAMME_CONTENT.activities,
  details = PROGRAMME_CONTENT.details,
  noteLine1 = PROGRAMME_CONTENT.noteLine1,
  noteLine2 = PROGRAMME_CONTENT.noteLine2,
  tagline = PROGRAMME_CONTENT.tagline,
  signoff = PROGRAMME_CONTENT.signoff,
  team = PROGRAMME_CONTENT.team,
  partnersLabel = PROGRAMME_CONTENT.partnersLabel,
  partners = PROGRAMME_CONTENT.partners,
  scriptFont = '"Great Vibes", "Allura", "Dancing Script", cursive',
  titleFont = '"Baloo Chettan 2", "Manjari", "Noto Sans Malayalam", "Poppins", sans-serif',
  bodyFont = '"Manrope", "Inter", system-ui, sans-serif',
  loadFonts = true,
  className = "",
  id = "programme",
}) => {
  const rootRef = useRef<HTMLElement>(null);

  /* ---- Load Google Fonts once (client only) ---- */
  useEffect(() => {
    if (!loadFonts) return;
    if (document.querySelector(`link[href="${GOOGLE_FONTS_HREF}"]`)) return;
    const pre1 = document.createElement("link");
    pre1.rel = "preconnect";
    pre1.href = "https://fonts.googleapis.com";
    const pre2 = document.createElement("link");
    pre2.rel = "preconnect";
    pre2.href = "https://fonts.gstatic.com";
    pre2.crossOrigin = "anonymous";
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_HREF;
    document.head.append(pre1, pre2, link);
  }, [loadFonts]);

  /* ---- Scroll animations ---- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReducedMotion =
      "matchMedia" in window && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const blocks = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      const items = gsap.utils.toArray<HTMLElement>("[data-stagger-item]");
      const partnerTiles = gsap.utils.toArray<HTMLElement>("[data-partner]");

      if (prefersReducedMotion) {
        gsap.set([...blocks, ...items, ...partnerTiles], { opacity: 1, x: 0, y: 0, scale: 1 });
        return;
      }

      blocks.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          }
        );
      });

      const medallion = root.querySelector<HTMLElement>("[data-medallion]");
      if (medallion) {
        gsap.fromTo(
          medallion,
          { scale: 0.82, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 1.3,
            ease: "back.out(1.4)",
            scrollTrigger: { trigger: medallion, start: "top 80%", once: true },
          }
        );
      }

      if (items.length) {
        gsap.fromTo(
          items,
          { opacity: 0, x: -14 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            stagger: 0.06,
            ease: "power2.out",
            scrollTrigger: { trigger: "[data-stagger]", start: "top 80%", once: true },
          }
        );
      }

      const rule = root.querySelector<HTMLElement>("[data-divider]");
      if (rule) {
        gsap.fromTo(
          rule,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: 1.1,
            ease: "power3.inOut",
            transformOrigin: "top center",
            scrollTrigger: { trigger: rule, start: "top 80%", once: true },
          }
        );
      }

      if (partnerTiles.length) {
        gsap.fromTo(
          partnerTiles,
          { opacity: 0, y: 16, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: { trigger: "[data-partners]", start: "top 88%", once: true },
          }
        );
      }
    }, root);

    return () => ctx.revert();
  }, []);

  const hasPartners = partners && partners.length > 0;

  return (
    <section
      id={id}
      ref={rootRef}
      className={`relative isolate w-full overflow-hidden ${className}`}
      style={{
        fontFamily: bodyFont,
        color: C.cream,
        background: `radial-gradient(ellipse at 50% 0%, ${C.tealLight} 0%, ${C.teal} 45%, ${C.tealDeep} 100%)`,
      }}
      aria-labelledby={`${id}-title`}
    >
      {/* linen texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0 1px, transparent 1px 3px)",
        }}
      />
      <SceneLines />

      <div className="relative mx-auto flex w-full max-w-[720px] flex-col items-center px-5 pb-[48vw] pt-14 text-center sm:px-8 sm:pb-64 md:pt-20 lg:pb-72">
        {/* ---------- Brand logo ---------- */}
        <div data-reveal className="flex w-full flex-col items-center">
          <div className="flex h-16 w-full max-w-[260px] items-center justify-center md:h-20 md:max-w-[300px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brandLogo}
              alt={brandName}
              className="max-h-full w-auto max-w-full object-contain"
              draggable={false}
              loading="eager"
            />
          </div>
          <LabelRule className="mt-5">{presentsLabel}</LabelRule>
        </div>

        {/* ---------- Medallion ---------- */}
        <div data-medallion className="relative mt-8 aspect-square w-[min(76vw,380px)] md:mt-10">
          <Medallion />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h2
              id={`${id}-title`}
              className="leading-[0.95] text-[clamp(2.8rem,13vw,5rem)] font-extrabold"
              style={{
                fontFamily: titleFont,
                color: C.gold,
                textShadow: `0 2px 0 ${C.goldDeep}, 0 4px 0 #8A5C0C, 0 6px 0 #5E3E06, 0 12px 24px rgba(0,0,0,0.45)`,
              }}
            >
              {eventTitle}
            </h2>
            <div
              className="-mt-1 leading-none text-[clamp(3.4rem,16vw,6.2rem)] font-extrabold"
              style={{
                fontFamily: titleFont,
                color: C.gold,
                textShadow: `0 3px 0 ${C.goldDeep}, 0 6px 0 #8A5C0C, 0 9px 0 #5E3E06, 0 16px 28px rgba(0,0,0,0.5)`,
              }}
            >
              {edition}
            </div>
          </div>
        </div>

        {/* ---------- Subtitle ---------- */}
        <p data-reveal className="mt-8 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 md:mt-10">
          <span
            className="whitespace-nowrap text-[clamp(2.4rem,9vw,3.6rem)] leading-none"
            style={{ fontFamily: scriptFont }}
          >
            {subtitle}
          </span>
          <span className="text-[clamp(1.1rem,4vw,1.6rem)] font-light tracking-[0.08em]">{year}</span>
        </p>

        {/* ---------- Activities + Details ---------- */}
        <div
          data-stagger
          className="mt-12 grid w-full max-w-[560px] grid-cols-1 gap-y-8 text-left sm:grid-cols-[1fr_1px_1fr] sm:gap-x-0 md:mt-14"
        >
          {/* Activities */}
          <div className="mx-auto w-fit sm:mx-0 sm:w-auto sm:justify-self-end sm:pr-8 md:pr-10">
            <h3
              data-reveal
              className="mb-5 text-[clamp(2rem,7vw,2.7rem)] leading-none"
              style={{ fontFamily: scriptFont, color: C.gold }}
            >
              {activitiesLabel}
            </h3>
            <ul className="space-y-3">
              {activities.map((a) => (
                <li key={a} data-stagger-item className="flex items-center gap-3 text-[0.98rem] md:text-[1.05rem]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: C.gold }} />
                  {a}
                </li>
              ))}
            </ul>
          </div>

          {/* Divider — vertical on sm+, horizontal on mobile */}
          <div className="relative hidden self-stretch sm:block" aria-hidden="true">
            <span
              className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full"
              style={{ background: C.gold }}
            />
            <span data-divider className="absolute inset-y-0 left-0 w-px" style={{ background: C.gold }} />
            <span
              className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full"
              style={{ background: C.gold }}
            />
          </div>
          <div className="relative mx-auto h-px w-40 sm:hidden" aria-hidden="true" style={{ background: C.gold }}>
            <span
              className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
              style={{ background: C.gold }}
            />
            <span
              className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
              style={{ background: C.gold }}
            />
          </div>

          {/* Details */}
          <dl className="mx-auto w-fit space-y-5 sm:mx-0 sm:w-auto sm:justify-self-start sm:pl-8 sm:pt-3 md:pl-10">
            {details.map((d) => (
              <div key={d.label} data-stagger-item>
                <dt className="text-[0.95rem] tracking-wide md:text-[1rem]" style={{ color: C.gold }}>
                  {d.label}:
                </dt>
                <dd className="mt-0.5 text-[1.02rem] font-medium md:text-[1.1rem]">{d.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ---------- Closing ---------- */}
        <div data-reveal className="mt-14 max-w-[34ch] text-[0.95rem] leading-relaxed md:mt-16 md:text-[1.02rem]">
          <p>
            {noteLine1}
            <br />
            {noteLine2}
          </p>
          <p className="mt-5 italic" style={{ color: C.gold }}>
            {tagline}
          </p>
        </div>

        <div data-reveal className="mt-10 flex flex-col items-center">
          <svg viewBox="0 0 160 18" className="mb-2 h-3 w-28" aria-hidden="true">
            <path d="M4 12 Q 80 -6 156 12" fill="none" stroke={C.gold} strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="80" cy="10" r="2" fill={C.gold} />
          </svg>
          <p className="text-[clamp(2.6rem,10vw,4rem)] leading-none" style={{ fontFamily: scriptFont, color: C.gold }}>
            {signoff}
          </p>
          <p className="mt-3 text-[1.05rem] font-medium tracking-wide">{team}</p>
        </div>

        {/* ---------- Partners ---------- */}
        {hasPartners && (
          <div data-partners className="mt-16 flex w-full flex-col items-center md:mt-20">
            <LabelRule>{partnersLabel}</LabelRule>
            <ul className="mt-6 flex w-full flex-wrap items-center justify-center gap-3 sm:gap-4">
              {partners.map((p) => {
                const tile = (
                  <span
                    className="flex h-[64px] w-[128px] items-center justify-center rounded-xl px-4 py-3 transition-transform duration-300 hover:-translate-y-0.5 sm:h-[72px] sm:w-[150px]"
                    style={{
                      background: "rgba(246,239,221,0.94)",
                      boxShadow: `0 1px 0 ${C.goldPale} inset, 0 10px 24px rgba(0,0,0,0.25)`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.logo}
                      alt={p.name}
                      className="max-h-full w-auto max-w-full object-contain"
                      draggable={false}
                      loading="lazy"
                    />
                  </span>
                );
                return (
                  <li key={p.name} data-partner>
                    {p.href ? (
                      <a
                        href={p.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={p.name}
                        className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{ ["--tw-ring-color" as string]: C.gold, ["--tw-ring-offset-color" as string]: C.teal }}
                      >
                        {tile}
                      </a>
                    ) : (
                      tile
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* ---------- Pookalam at the foot ---------- */}
      <Pookalam className="pointer-events-none absolute bottom-[-8%] left-1/2 w-[min(52vw,300px)] -translate-x-1/2 opacity-95 drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]" />
    </section>
  );
};

export default OnamProgramme;