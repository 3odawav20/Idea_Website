import { useRef, useState, useCallback, useEffect } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useI18n } from "../i18n/i18n";
import type { Locale } from "../data/types";

// ─── Catalog data ────────────────────────────────────────────────────────────

export const MATERIAL_LOOKS = [
  {
    id: "marble",
    label: { en: "Marble Look", ar: "تأثير الرخام", fr: "Aspect Marbre" } as Record<Locale, string>,
    sub: { en: "Natural veining & luxury surfaces", ar: "عروق طبيعية وأسطح فاخرة", fr: "Veines naturelles et surfaces de luxe" } as Record<Locale, string>,
    image: "https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400",
    tileImage: "https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    featured: ["Calacatta Oro", "Carrara White"],
  },
  {
    id: "wood",
    label: { en: "Wood Look", ar: "تأثير الخشب", fr: "Aspect Bois" } as Record<Locale, string>,
    sub: { en: "Warm grain & natural timber finishes", ar: "حبوب دافئة ولمسات خشبية", fr: "Grain chaud et finitions bois" } as Record<Locale, string>,
    image: "https://images.unsplash.com/photo-1603323978104-4c1c0d1bfc72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400",
    tileImage: "https://images.unsplash.com/photo-1603323978104-4c1c0d1bfc72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    featured: ["Oak Natural", "Walnut Dark"],
  },
  {
    id: "stone",
    label: { en: "Stone Look", ar: "تأثير الحجر", fr: "Aspect Pierre" } as Record<Locale, string>,
    sub: { en: "Granite, slate & raw earth tones", ar: "جرانيت وأردواز وألوان ترابية", fr: "Granit, ardoise et tons terres" } as Record<Locale, string>,
    image: "https://images.unsplash.com/photo-1566305977571-5666677c6e98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400",
    tileImage: "https://images.unsplash.com/photo-1566305977571-5666677c6e98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    featured: ["Grigio Cemento", "Antracite"],
  },
  {
    id: "pattern",
    label: { en: "Pattern Look", ar: "تأثير النقشة", fr: "Aspect Motif" } as Record<Locale, string>,
    sub: { en: "Mosaic, geometric & decorative art", ar: "فسيفساء وهندسي وزخرفي", fr: "Mosaïque, géométrique et décoratif" } as Record<Locale, string>,
    image: "https://images.unsplash.com/photo-1584354273341-3eb96574e5be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400",
    tileImage: "https://images.unsplash.com/photo-1584354273341-3eb96574e5be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    featured: ["Geometric Art", "Arabesque"],
  },
  {
    id: "colour",
    label: { en: "Colour Look", ar: "تأثير الألوان", fr: "Aspect Couleur" } as Record<Locale, string>,
    sub: { en: "Bold hues & expressive palettes", ar: "ألوان جريئة ولوحات معبّرة", fr: "Teintes vives et palettes expressives" } as Record<Locale, string>,
    image: "https://images.unsplash.com/photo-1458682625221-3a45f8a844c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400",
    tileImage: "https://images.unsplash.com/photo-1458682625221-3a45f8a844c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    featured: ["Teal Gloss", "Terracotta"],
  },
];

// ─── Per-look signature palette ──────────────────────────────────────────────
// Material-category-specific accent colors — not design system tokens.
const LOOK_PALETTE: Record<string, {
  accent: string;
  glow: string;
  overlayTop: string;
  overlayBot: string;
  n: string;
}> = {
  marble: {
    accent: "#e2d4b4",
    glow: "rgba(226,212,180,0.40)",
    overlayTop: "linear-gradient(148deg, rgba(230,218,190,0.22) 0%, rgba(200,185,155,0.10) 45%, transparent 70%)",
    overlayBot: "linear-gradient(0deg, rgba(226,212,180,0.28) 0%, transparent 100%)",
    n: "01",
  },
  wood: {
    accent: "#c07830",
    glow: "rgba(192,120,48,0.48)",
    overlayTop: "linear-gradient(148deg, rgba(140,80,20,0.30) 0%, rgba(100,55,10,0.14) 45%, transparent 70%)",
    overlayBot: "linear-gradient(0deg, rgba(192,120,48,0.30) 0%, transparent 100%)",
    n: "02",
  },
  stone: {
    accent: "#6a94ae",
    glow: "rgba(106,148,174,0.42)",
    overlayTop: "linear-gradient(148deg, rgba(60,90,115,0.28) 0%, rgba(40,65,85,0.12) 45%, transparent 70%)",
    overlayBot: "linear-gradient(0deg, rgba(106,148,174,0.28) 0%, transparent 100%)",
    n: "03",
  },
  pattern: {
    accent: "#a8527c",
    glow: "rgba(168,82,124,0.44)",
    overlayTop: "linear-gradient(148deg, rgba(120,40,80,0.32) 0%, rgba(80,25,55,0.14) 45%, transparent 70%)",
    overlayBot: "linear-gradient(0deg, rgba(168,82,124,0.30) 0%, transparent 100%)",
    n: "04",
  },
  colour: {
    accent: "#2aaa88",
    glow: "rgba(42,170,136,0.42)",
    overlayTop: "linear-gradient(148deg, rgba(20,110,85,0.30) 0%, rgba(10,75,58,0.12) 45%, transparent 70%)",
    overlayBot: "linear-gradient(0deg, rgba(42,170,136,0.28) 0%, transparent 100%)",
    n: "05",
  },
};

// SVG noise grain — tactile luxury signature
const GRAIN_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

// ─── Single look card with 3D hover tilt + parallax ─────────────────────────

function LookCard({ look, idx }: { look: typeof MATERIAL_LOOKS[0]; idx: number }) {
  const { locale } = useI18n();
  const pal = LOOK_PALETTE[look.id] ?? LOOK_PALETTE.marble;

  const wrapRef  = useRef<HTMLDivElement>(null);
  const imgRef   = useRef<HTMLImageElement>(null);
  const glossRef = useRef<HTMLDivElement>(null);
  const ruleRef  = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  // All transforms written directly to DOM — no re-renders in hot path
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top)  / r.height;
    const rx = (ny - 0.5) * -12;
    const ry = (nx - 0.5) *  18;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(18px)`;
    if (imgRef.current)
      imgRef.current.style.transform = `scale(1.14) translate(${(0.5 - nx) * 24}px, ${(0.5 - ny) * 16}px)`;
    if (glossRef.current)
      glossRef.current.style.background = `radial-gradient(circle 340px at ${nx * 100}% ${ny * 100}%, rgba(255,255,255,0.20), transparent 60%)`;
    if (ruleRef.current)
      ruleRef.current.style.width = "56px";
    if (arrowRef.current)
      arrowRef.current.style.transform = "translateX(6px)";
  }, []);

  const onLeave = useCallback(() => {
    if (wrapRef.current)
      wrapRef.current.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
    if (imgRef.current)
      imgRef.current.style.transform = "scale(1.07) translate(0,0)";
    if (glossRef.current)
      glossRef.current.style.background = "transparent";
    if (ruleRef.current)
      ruleRef.current.style.width = "28px";
    if (arrowRef.current)
      arrowRef.current.style.transform = "translateX(0)";
    setHovered(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 52, scale: 0.93 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.78, ease: [0.22, 1, 0.36, 1], delay: idx * 0.07 }}
      style={{ height: "100%", userSelect: "none" }}
    >
      <div
        ref={wrapRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onMouseEnter={() => setHovered(true)}
        style={{
          position: "relative",
          height: "100%",
          borderRadius: "var(--idea-radius-lg)",
          overflow: "hidden",
          transformStyle: "preserve-3d",
          willChange: "transform",
          transition: "transform 0.32s cubic-bezier(0.22,1,0.36,1), box-shadow 0.44s ease",
          boxShadow: hovered
            ? `0 44px 96px rgba(0,0,0,0.68), 0 0 72px ${pal.glow}, inset 0 1px 0 rgba(255,255,255,0.16)`
            : `0 12px 48px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.07)`,
          cursor: "pointer",
        }}
      >
        <Link
          to={`/tile-showroom/${look.id}`}
          draggable={false}
          style={{ display: "block", height: "100%", textDecoration: "none", color: "inherit" }}
          onClick={(e) => {
            // Block link navigation when the strip is being dragged
            if ((e.currentTarget.closest(".idea-ls-strip") as HTMLElement)?.dataset.dragged === "1") {
              e.preventDefault();
            }
          }}
        >
          {/* ① Parallax hero image */}
          <img
            ref={imgRef}
            src={look.image}
            alt={look.label[locale as Locale]}
            draggable={false}
            loading="lazy"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center",
              transform: "scale(1.07) translate(0,0)",
              transition: "transform 0.46s cubic-bezier(0.22,1,0.36,1)",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />

          {/* ② Colour-grade overlay — unique mood per look */}
          <div style={{
            position: "absolute", inset: 0,
            background: pal.overlayTop,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }} />

          {/* ③ Dark vignette */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.20) 48%, rgba(0,0,0,0.06) 100%)",
            pointerEvents: "none",
          }} />

          {/* ④ Accent warm wash — bottom */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "52%",
            background: pal.overlayBot,
            pointerEvents: "none",
          }} />

          {/* ⑤ Grain texture — tactile signature */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: GRAIN_URL,
            backgroundSize: "220px 220px",
            opacity: 0.05,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }} />

          {/* ⑥ Cursor-follow gloss */}
          <div ref={glossRef} style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            transition: "background 0.07s linear",
          }} />

          {/* ⑦ Shimmer sweep */}
          <div
            className={`idea-ls-sweep idea-ls-sweep--${look.id}`}
            style={{
              position: "absolute", top: 0, bottom: 0, left: 0,
              width: "38%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 45%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0.07) 55%, transparent)",
              transform: "skewX(-14deg)",
              pointerEvents: "none",
            }}
          />

          {/* ── TOP: serial + pill ──────────────────────────────────────────── */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            padding: "20px 20px 0",
            pointerEvents: "none",
          }}>
            <div style={{
              fontFamily: "var(--idea-font-display)",
              fontSize: 82, fontWeight: 700, lineHeight: 1,
              letterSpacing: "-0.03em",
              color: hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)",
              transition: "color 0.42s ease",
              userSelect: "none",
            }}>
              {pal.n}
            </div>

            <div style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: `1px solid ${pal.accent}60`,
              borderRadius: "var(--idea-radius-full)",
              padding: "7px 16px",
              fontFamily: "var(--idea-font-display)",
              fontSize: "var(--idea-text-xs)",
              letterSpacing: "0.14em",
              color: pal.accent,
              textTransform: "uppercase",
              marginTop: 8, flexShrink: 0,
            }}>
              {look.label[locale as Locale]}
            </div>
          </div>

          {/* ── MID: featured names ─────────────────────────────────────────── */}
          <div style={{
            position: "absolute", top: 106, left: 20,
            display: "flex", flexDirection: "column", gap: 3,
            pointerEvents: "none",
          }}>
            {look.featured.map(name => (
              <span key={name} style={{
                fontFamily: "var(--idea-font-display)",
                fontSize: "var(--idea-text-xs)",
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.30)",
                textTransform: "uppercase",
              }}>{name}</span>
            ))}
          </div>

          {/* ── BOTTOM: rule + label + desc ─────────────────────────────────── */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "20px 20px 26px",
            pointerEvents: "none",
          }}>
            {/* Expanding accent rule */}
            <div
              ref={ruleRef}
              style={{
                height: 2, borderRadius: 1,
                background: pal.accent,
                marginBottom: "var(--idea-space-3)",
                width: 28,
                transition: "width 0.46s cubic-bezier(0.22,1,0.36,1)",
              }}
            />

            {/* Name + arrow */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: "var(--idea-space-3)",
              marginBottom: "var(--idea-space-2)",
            }}>
              <div style={{
                fontFamily: "var(--idea-font-display)",
                fontSize: "var(--idea-text-xl)",
                fontWeight: 500, color: "white",
                letterSpacing: "0.04em", lineHeight: 1.1,
              }}>
                {look.label[locale as Locale]}
              </div>

              <div
                ref={arrowRef}
                style={{
                  width: 44, height: 44,
                  borderRadius: "var(--idea-radius-full)",
                  border: `1.5px solid ${pal.accent}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: pal.accent, flexShrink: 0,
                  transition: "transform 0.38s cubic-bezier(0.22,1,0.36,1)",
                }}
              >
                <ArrowRight size={15} />
              </div>
            </div>

            <p style={{
              margin: 0,
              fontFamily: "var(--idea-font-body)",
              fontSize: "var(--idea-text-sm)",
              color: "rgba(255,255,255,0.46)",
              lineHeight: 1.65, letterSpacing: "0.01em",
            }}>
              {look.sub[locale as Locale]}
            </p>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Main strip component ────────────────────────────────────────────────────

export function MaterialLookStrip() {
  const { locale } = useI18n();
  const stripRef   = useRef<HTMLDivElement>(null);

  // ── Drag state — all refs for the hot path, no React state ───────────────
  const dragging  = useRef(false);
  const lastX     = useRef(0);
  const velRef    = useRef(0);
  const rafRef    = useRef<number>();
  const didMove   = useRef(false);    // distinguish click vs drag
  const [cursor, setCursor] = useState<"grab" | "grabbing">("grab");

  // ── Direct DOM writes for 3D lean — no re-renders ───────────────────────
  const setLeanDOM = useCallback((deg: number) => {
    const el = stripRef.current;
    if (!el) return;
    el.style.transform = `rotateY(${deg}deg)`;
  }, []);

  const startDrag = useCallback((clientX: number) => {
    dragging.current = true;
    didMove.current  = false;
    lastX.current    = clientX;
    velRef.current   = 0;
    setCursor("grabbing");
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    // Immediately kill transition so drag is 1:1 responsive
    if (stripRef.current) stripRef.current.style.transition = "none";
  }, []);

  const moveDrag = useCallback((clientX: number) => {
    if (!dragging.current || !stripRef.current) return;
    const dx = lastX.current - clientX;
    if (Math.abs(dx) > 2) didMove.current = true;
    velRef.current = dx * 0.65 + velRef.current * 0.35;
    stripRef.current.scrollLeft += dx;
    lastX.current = clientX;
    // 3D lean into motion direction — written directly to DOM
    const lean = Math.max(-3, Math.min(3, velRef.current * -0.16));
    setLeanDOM(lean);
  }, [setLeanDOM]);

  const endDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setCursor("grab");

    // Mark strip as "dragged" briefly to block link clicks
    if (stripRef.current && didMove.current) {
      stripRef.current.dataset.dragged = "1";
      setTimeout(() => { if (stripRef.current) delete stripRef.current.dataset.dragged; }, 200);
    }

    // Re-enable spring-back transition for the settle
    if (stripRef.current) stripRef.current.style.transition = "transform 1s cubic-bezier(0.22,1,0.36,1)";

    // Momentum + lean settle via rAF
    const step = () => {
      velRef.current *= 0.92;
      if (stripRef.current) stripRef.current.scrollLeft += velRef.current;

      const currentLean = parseFloat(stripRef.current?.style.transform.replace("rotateY(", "").replace("deg)", "") || "0");
      const nextLean = currentLean * 0.86;
      setLeanDOM(nextLean);

      if (Math.abs(velRef.current) > 0.3 || Math.abs(nextLean) > 0.05) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setLeanDOM(0);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [setLeanDOM]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Mouse handlers
  const onMouseDown  = (e: React.MouseEvent) => { e.preventDefault(); startDrag(e.clientX); };
  const onMouseMove  = (e: React.MouseEvent) => moveDrag(e.clientX);
  const onMouseUp    = () => endDrag();
  const onMouseLeave = () => { if (dragging.current) endDrag(); };

  // Touch handlers — prevent native scroll from fighting the drag
  const onTouchStart = (e: React.TouchEvent) => { startDrag(e.touches[0].clientX); };
  const onTouchMove  = (e: React.TouchEvent) => {
    e.preventDefault();
    moveDrag(e.touches[0].clientX);
  };
  const onTouchEnd = () => endDrag();

  // ── Active dot tracking ──────────────────────────────────────────────────
  const [activeDot, setActiveDot] = useState(0);
  const onScroll = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    const cards = el.querySelectorAll("[data-ls-card]");
    let closest = 0, minDist = Infinity;
    cards.forEach((card, i) => {
      const c = (card as HTMLElement).offsetLeft + (card as HTMLElement).offsetWidth / 2;
      const d = Math.abs(c - center);
      if (d < minDist) { minDist = d; closest = i; }
    });
    setActiveDot(closest);
  }, []);

  const eyebrow = locale === "ar" ? "اكتشف الأسطح" : locale === "fr" ? "Explorer les surfaces" : "Shop by Surface";
  const heading  = locale === "ar" ? "اختر أسلوب سطحك" : locale === "fr" ? "Trouvez votre style" : "Find Your Surface Style";

  return (
    <section style={{ background: "var(--idea-bg-2)", paddingBottom: "var(--idea-space-7)", overflowX: "hidden" }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          padding: "var(--idea-space-8) var(--idea-space-7) var(--idea-space-5)",
          flexWrap: "wrap", gap: "var(--idea-space-4)",
        }}
      >
        <div>
          <div style={{
            display: "flex", alignItems: "center",
            gap: "var(--idea-space-2)", marginBottom: "var(--idea-space-2)",
          }}>
            <div style={{ width: 24, height: 2, background: "var(--idea-gold-bright)", borderRadius: 1 }} />
            <span style={{
              fontFamily: "var(--idea-font-display)",
              fontSize: "var(--idea-text-xs)",
              letterSpacing: "var(--idea-tracking-wide)",
              color: "var(--idea-gold-bright)",
              textTransform: "uppercase",
            }}>{eyebrow}</span>
          </div>
          <h2 style={{
            fontFamily: "var(--idea-font-display)",
            fontSize: "clamp(22px, 3vw, 32px)",
            color: "var(--idea-text)",
            margin: 0, fontWeight: 500,
            letterSpacing: "0.03em", lineHeight: 1.15,
          }}>{heading}</h2>
        </div>

        {/* Drag hint */}
        <div style={{
          display: "flex", alignItems: "center", gap: "var(--idea-space-2)",
          fontFamily: "var(--idea-font-body)",
          fontSize: "var(--idea-text-xs)",
          color: "var(--idea-text-faint)",
          letterSpacing: "0.06em",
          userSelect: "none",
        }}>
          <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
            <path d="M1 7h20M1 7l5-5M1 7l5 5M21 7l-5-5M21 7l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {locale === "ar" ? "اسحب للتصفح" : locale === "fr" ? "Glisser pour parcourir" : "Drag to explore"}
        </div>
      </motion.div>

      {/* ── 3D perspective stage ──────────────────────────────────────────── */}
      <div style={{
        perspective: "1800px",
        perspectiveOrigin: "50% 50%",
        paddingInline: "var(--idea-space-7)",
      }}>
        {/*
          The strip scrolls horizontally.
          rotateY is written directly to this element's style during drag.
          transition is toggled: "none" during active drag, spring on release.
        */}
        <div
          ref={stripRef}
          className="idea-ls-strip"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onScroll={onScroll}
          style={{
            display: "flex",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            gap: "var(--idea-space-3)",
            paddingBottom: "var(--idea-space-4)",
            height: "clamp(390px, 62vh, 680px)",
            scrollbarWidth: "none",
            cursor: cursor,
            userSelect: "none",
            WebkitUserSelect: "none",
            // Initial transform — drag overwrites this via DOM
            transform: "rotateY(0deg)",
            transformStyle: "preserve-3d",
            willChange: "transform, scroll-position",
          }}
        >
          {MATERIAL_LOOKS.map((look, idx) => (
            <div
              key={look.id}
              data-ls-card
              style={{ flex: "0 0 34vw", minWidth: 262, maxWidth: 490, height: "100%", flexShrink: 0 }}
            >
              <LookCard look={look} idx={idx} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Dot progress indicator ────────────────────────────────────────── */}
      <div style={{
        display: "flex", justifyContent: "center",
        gap: "var(--idea-space-2)",
        paddingTop: "var(--idea-space-4)",
      }}>
        {MATERIAL_LOOKS.map((look, i) => {
          const pal = LOOK_PALETTE[look.id];
          const active = i === activeDot;
          return (
            <button
              key={look.id}
              aria-label={`Go to ${look.label.en}`}
              onClick={() => {
                const strip = stripRef.current;
                if (!strip) return;
                const cards = strip.querySelectorAll("[data-ls-card]");
                (cards[i] as HTMLElement)?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
              }}
              style={{
                width: active ? 26 : 8,
                height: 8,
                borderRadius: "var(--idea-radius-full)",
                border: "none",
                background: active ? pal.accent : `${pal.accent}50`,
                cursor: "pointer",
                padding: 0,
                transition: "width 0.4s cubic-bezier(0.22,1,0.36,1), background 0.3s ease",
              }}
            />
          );
        })}
      </div>

      {/* ── Scoped CSS ────────────────────────────────────────────────────── */}
      <style>{`
        .idea-ls-strip::-webkit-scrollbar { display: none; }

        /* Shimmer — staggered per look */
        @keyframes idea-ls-pass {
          0%, 55%, 100% { left: -44%; opacity: 0; }
          10%, 45%       { opacity: 1; }
          53%            { left: 114%; opacity: 0; }
        }
        .idea-ls-sweep               { animation: idea-ls-pass 11s ease-in-out infinite; }
        .idea-ls-sweep--marble       { animation-delay: 0s; }
        .idea-ls-sweep--wood         { animation-delay: 2.2s; }
        .idea-ls-sweep--stone        { animation-delay: 4.4s; }
        .idea-ls-sweep--pattern      { animation-delay: 6.6s; }
        .idea-ls-sweep--colour       { animation-delay: 8.8s; }

        /* Responsive card widths */
        @media (max-width: 1100px) {
          .idea-ls-strip [data-ls-card] { flex: 0 0 52vw !important; }
        }
        @media (max-width: 720px) {
          .idea-ls-strip [data-ls-card] { flex: 0 0 82vw !important; }
        }
        @media (max-width: 480px) {
          .idea-ls-strip [data-ls-card] { flex: 0 0 93vw !important; }
        }

        /* Allow touch drag — prevent pull-to-refresh from fighting it */
        .idea-ls-strip { touch-action: pan-x pinch-zoom; }
      `}</style>
    </section>
  );
}
