import { useRef } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import type { Locale } from "../data/types";

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

export function MaterialLookStrip() {
  const { locale } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -480 : 480, behavior: "smooth" });
  };

  return (
    <section style={{ background: "var(--idea-bg-2)" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        padding: "var(--idea-space-7) var(--idea-space-7) var(--idea-space-4)",
      }}>
        <div>
          <div style={{
            fontFamily: "var(--idea-font-display)",
            fontSize: "var(--idea-text-xs)",
            letterSpacing: "var(--idea-tracking-wide)",
            color: "var(--idea-gold-bright)",
            marginBottom: "var(--idea-space-2)",
            textTransform: "uppercase",
          }}>Shop by Surface</div>
          <h2 style={{
            fontFamily: "var(--idea-font-display)",
            fontSize: "var(--idea-text-2xl)",
            color: "var(--idea-text)",
            margin: 0,
            fontWeight: 500,
            letterSpacing: "0.03em",
          }}>Find Your Surface Style</h2>
        </div>
        <div style={{ display: "flex", gap: "var(--idea-space-2)" }}>
          <button onClick={() => scroll("left")} aria-label="Scroll left" style={{
            width: 44, height: 44, borderRadius: "var(--idea-radius-full)",
            border: "var(--idea-hairline)", background: "var(--idea-surface)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "var(--idea-text)", transition: "background 0.2s",
          }}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => scroll("right")} aria-label="Scroll right" style={{
            width: 44, height: 44, borderRadius: "var(--idea-radius-full)",
            border: "var(--idea-hairline)", background: "var(--idea-surface)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "var(--idea-text)", transition: "background 0.2s",
          }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Scrollable strip */}
      <div
        ref={scrollRef}
        className="idea-material-strip"
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          gap: 4,
          paddingInline: "var(--idea-space-7)",
          paddingBottom: "var(--idea-space-7)",
          height: "clamp(360px, 58vh, 640px)",
          scrollbarWidth: "none",
        }}
      >
        {MATERIAL_LOOKS.map((look) => (
          <Link
            key={look.id}
            to={`/tile-showroom/${look.id}`}
            className="idea-look-card"
            style={{
              flex: "0 0 38vw",
              minWidth: 260,
              maxWidth: 500,
              scrollSnapAlign: "start",
              position: "relative",
              overflow: "hidden",
              borderRadius: "var(--idea-radius-lg)",
              display: "block",
              textDecoration: "none",
            }}
          >
            {/* Featured product names at top */}
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              padding: "var(--idea-space-4) var(--idea-space-5)",
              background: "linear-gradient(180deg, rgba(0,0,0,0.52) 0%, transparent 100%)",
              display: "flex",
              gap: "var(--idea-space-5)",
              zIndex: 2,
            }}>
              {look.featured.map((name) => (
                <span key={name} style={{
                  fontFamily: "var(--idea-font-display)",
                  fontSize: "var(--idea-text-sm)",
                  color: "rgba(255,255,255,0.82)",
                  letterSpacing: "0.12em",
                }}>{name}</span>
              ))}
            </div>

            {/* Background image */}
            <img
              src={look.image}
              alt={look.label[locale as Locale]}
              className="idea-look-img"
              loading="lazy"
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
            />

            {/* Bottom gradient */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.1) 52%, transparent 100%)",
              pointerEvents: "none",
            }} />

            {/* Label badge + description */}
            <div style={{
              position: "absolute",
              bottom: 0, left: 0, right: 0,
              padding: "var(--idea-space-5)",
            }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                background: "black",
                padding: "10px 18px",
                marginBottom: "var(--idea-space-2)",
              }}>
                <span style={{
                  fontFamily: "var(--idea-font-display)",
                  fontSize: "var(--idea-text-base)",
                  color: "white",
                  letterSpacing: "var(--idea-tracking-wide)",
                  fontWeight: 500,
                  textTransform: "uppercase",
                }}>{look.label[locale as Locale]}</span>
                <ArrowUpRight size={16} color="white" />
              </div>
              <p style={{
                color: "rgba(255,255,255,0.58)",
                fontSize: "var(--idea-text-sm)",
                margin: 0,
                lineHeight: 1.5,
              }}>{look.sub[locale as Locale]}</p>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        .idea-material-strip::-webkit-scrollbar { display: none; }
        .idea-look-card:hover .idea-look-img { transform: scale(1.07); }
        @media (max-width: 900px) { .idea-look-card { flex: 0 0 72vw !important; } }
        @media (max-width: 560px) { .idea-look-card { flex: 0 0 88vw !important; } }
      `}</style>
    </section>
  );
}
