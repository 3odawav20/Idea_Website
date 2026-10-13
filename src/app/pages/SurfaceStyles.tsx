import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Layers } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { MATERIAL_LOOKS, MaterialLookStrip } from "../components/MaterialLookStrip";
import type { Locale } from "../data/types";

// Per-look color accent — kept in sync with MaterialLookStrip palette
const LOOK_COLOR: Record<string, string> = {
  marble:  "#e2d4b4",
  wood:    "#c07830",
  stone:   "#6a94ae",
  pattern: "#a8527c",
  colour:  "#2aaa88",
};

// ─── Look thumbnail grid ──────────────────────────────────────────────────────

function LookThumb({ look, idx }: { look: typeof MATERIAL_LOOKS[0]; idx: number }) {
  const { locale } = useI18n();
  const accent = LOOK_COLOR[look.id] ?? "#e2d4b4";

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: idx * 0.07 }}
    >
      <Link
        to={`/tile-showroom/${look.id}`}
        style={{ display: "block", textDecoration: "none", position: "relative" }}
        className="idea-sf-thumb"
      >
        {/* Image */}
        <div style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "var(--idea-radius-lg)",
          aspectRatio: "3/4",
          background: "var(--idea-surface)",
        }}>
          <img
            src={look.image}
            alt={look.label[locale as Locale]}
            loading="lazy"
            className="idea-sf-thumb-img"
            style={{
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center",
              transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
          {/* Gradient */}
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)`,
            pointerEvents: "none",
          }} />
          {/* Accent wash */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "35%",
            background: `linear-gradient(0deg, ${accent}22 0%, transparent 100%)`,
            pointerEvents: "none",
          }} />

          {/* Bottom label */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "var(--idea-space-4)",
          }}>
            <div style={{
              width: 20, height: 2, borderRadius: 1,
              background: accent,
              marginBottom: "var(--idea-space-2)",
            }} />
            <div style={{
              fontFamily: "var(--idea-font-display)",
              fontSize: "var(--idea-text-base)",
              color: "white",
              letterSpacing: "0.04em",
              fontWeight: 500,
            }}>{look.label[locale as Locale]}</div>
            <div style={{
              fontFamily: "var(--idea-font-body)",
              fontSize: "var(--idea-text-xs)",
              color: "rgba(255,255,255,0.52)",
              marginTop: 4,
              letterSpacing: "0.01em",
            }}>{look.sub[locale as Locale]}</div>
          </div>

          {/* Explore pill */}
          <div style={{
            position: "absolute", top: "var(--idea-space-4)", right: "var(--idea-space-4)",
            background: "rgba(0,0,0,0.52)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: `1px solid ${accent}44`,
            borderRadius: "var(--idea-radius-full)",
            padding: "5px 12px",
            fontFamily: "var(--idea-font-display)",
            fontSize: 10,
            letterSpacing: "0.12em",
            color: accent,
            textTransform: "uppercase",
          }}>
            {look.id === "marble" ? "01" : look.id === "wood" ? "02" : look.id === "stone" ? "03" : look.id === "pattern" ? "04" : "05"}
          </div>
        </div>

        {/* Featured products */}
        <div style={{
          display: "flex", gap: "var(--idea-space-2)",
          flexWrap: "wrap", padding: "var(--idea-space-3) 0 0",
        }}>
          {look.featured.map(name => (
            <span key={name} style={{
              fontFamily: "var(--idea-font-display)",
              fontSize: "var(--idea-text-xs)",
              letterSpacing: "0.08em",
              color: "var(--idea-text-faint)",
              textTransform: "uppercase",
            }}>{name}</span>
          ))}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SurfaceStyles() {
  const { locale } = useI18n();

  const heading = locale === "ar"
    ? "فن الأسطح"
    : locale === "fr"
    ? "L'art des surfaces"
    : "The Art of Surface";

  const sub = locale === "ar"
    ? "اكتشف 475 منتجاً من السيراميك والبورسلين والرخام — مصنّفةً حسب الملمس والأسلوب."
    : locale === "fr"
    ? "Découvrez 475 produits en céramique, porcelaine et marbre — classés par texture et style."
    : "Browse 475 ceramics, porcelain & marble products — curated by texture and surface character.";

  return (
    <>
      {/* ── Hero intro ──────────────────────────────────────────────────── */}
      <div style={{
        background: "var(--idea-bg)",
        borderBottom: "var(--idea-hairline)",
        padding: "var(--idea-space-9) var(--idea-space-7) var(--idea-space-8)",
        maxWidth: "var(--idea-content-max)",
        margin: "0 auto",
      }}>
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", alignItems: "center", gap: "var(--idea-space-2)", marginBottom: "var(--idea-space-4)" }}
        >
          <Layers size={14} color="var(--idea-gold-bright)" />
          <span style={{
            fontFamily: "var(--idea-font-display)",
            fontSize: "var(--idea-text-xs)",
            letterSpacing: "var(--idea-tracking-wide)",
            color: "var(--idea-gold-bright)",
            textTransform: "uppercase",
          }}>
            {locale === "ar" ? "الأسطح والمواد" : locale === "fr" ? "Surfaces & Matériaux" : "Surface Styles & Materials"}
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
          style={{
            fontFamily: "var(--idea-font-display)",
            fontSize: "clamp(36px, 6vw, 72px)",
            color: "var(--idea-text)",
            margin: "0 0 var(--idea-space-4)",
            fontWeight: 600,
            letterSpacing: "0.02em",
            lineHeight: 1.08,
            maxWidth: 820,
          }}
        >
          {heading}
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.14 }}
          style={{
            fontFamily: "var(--idea-font-body)",
            fontSize: "var(--idea-text-base)",
            color: "var(--idea-text-muted)",
            margin: "0 0 var(--idea-space-6)",
            maxWidth: 560,
            lineHeight: 1.7,
          }}
        >
          {sub}
        </motion.p>

        {/* Colour swatches — visual preview of look accents */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
          style={{ display: "flex", gap: "var(--idea-space-2)", alignItems: "center", flexWrap: "wrap" }}
        >
          {MATERIAL_LOOKS.map(look => (
            <Link
              key={look.id}
              to={`/tile-showroom/${look.id}`}
              title={look.label[locale as Locale]}
              style={{
                display: "flex", alignItems: "center", gap: "var(--idea-space-2)",
                padding: "6px 14px 6px 8px",
                borderRadius: "var(--idea-radius-full)",
                border: "var(--idea-hairline)",
                background: "var(--idea-surface)",
                textDecoration: "none",
                transition: "border-color 0.22s, background 0.22s",
              }}
              className="idea-sf-swatch"
            >
              <div style={{
                width: 16, height: 16,
                borderRadius: "50%",
                background: LOOK_COLOR[look.id],
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "var(--idea-font-display)",
                fontSize: "var(--idea-text-xs)",
                color: "var(--idea-text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>{look.label[locale as Locale]}</span>
            </Link>
          ))}
        </motion.div>
      </div>

      {/* ── Main drag strip ─────────────────────────────────────────────── */}
      <MaterialLookStrip />

      {/* ── Thumbnail grid ──────────────────────────────────────────────── */}
      <div style={{
        maxWidth: "var(--idea-content-max)",
        margin: "0 auto",
        padding: "var(--idea-space-8) var(--idea-space-7)",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: "var(--idea-space-6)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--idea-space-2)", marginBottom: "var(--idea-space-2)" }}>
            <div style={{ width: 20, height: 2, background: "var(--idea-gold-bright)", borderRadius: 1 }} />
            <span style={{
              fontFamily: "var(--idea-font-display)",
              fontSize: "var(--idea-text-xs)",
              letterSpacing: "var(--idea-tracking-wide)",
              color: "var(--idea-gold-bright)",
              textTransform: "uppercase",
            }}>
              {locale === "ar" ? "جميع الأسطح" : locale === "fr" ? "Tous les styles" : "All Surface Styles"}
            </span>
          </div>
          <h2 style={{
            fontFamily: "var(--idea-font-display)",
            fontSize: "var(--idea-text-2xl)",
            color: "var(--idea-text)",
            margin: 0, fontWeight: 500,
            letterSpacing: "0.03em",
          }}>
            {locale === "ar" ? "تصفّح حسب نوع السطح" : locale === "fr" ? "Parcourir par surface" : "Browse by Surface Type"}
          </h2>
        </motion.div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "var(--idea-space-5)",
        }}>
          {MATERIAL_LOOKS.map((look, idx) => (
            <LookThumb key={look.id} look={look} idx={idx} />
          ))}
        </div>
      </div>

      {/* ── Bottom CTA ──────────────────────────────────────────────────── */}
      <div style={{
        background: "var(--idea-surface)",
        borderTop: "var(--idea-hairline)",
        borderBottom: "var(--idea-hairline)",
        padding: "var(--idea-space-7) var(--idea-space-7)",
        textAlign: "center",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{
            fontFamily: "var(--idea-font-display)",
            fontSize: "var(--idea-text-xs)",
            letterSpacing: "var(--idea-tracking-wide)",
            color: "var(--idea-gold-bright)",
            textTransform: "uppercase",
            marginBottom: "var(--idea-space-3)",
          }}>
            {locale === "ar" ? "غرفتك ستبدو مختلفة" : locale === "fr" ? "Visualisez votre espace" : "See It In Your Space"}
          </div>

          <h3 style={{
            fontFamily: "var(--idea-font-display)",
            fontSize: "var(--idea-text-2xl)",
            color: "var(--idea-text)",
            margin: "0 0 var(--idea-space-3)",
            fontWeight: 500,
          }}>
            {locale === "ar"
              ? "جرّب أي سطح في غرفتك الحقيقية"
              : locale === "fr"
              ? "Essayez n'importe quelle surface dans votre pièce"
              : "Try Any Surface in Your Real Room"}
          </h3>

          <p style={{
            fontFamily: "var(--idea-font-body)",
            fontSize: "var(--idea-text-sm)",
            color: "var(--idea-text-muted)",
            margin: "0 auto var(--idea-space-6)",
            maxWidth: 480,
            lineHeight: 1.7,
          }}>
            {locale === "ar"
              ? "افتح المرئي ثلاثي الأبعاد، ضع البلاط على جدران وأرضية حمامك أو صالتك."
              : locale === "fr"
              ? "Ouvrez le visualiseur 3D et appliquez le carrelage sur vos murs et sols."
              : "Open the 3D room visualizer and apply any tile to your bathroom or living room walls and floors."}
          </p>

          <div style={{ display: "flex", gap: "var(--idea-space-4)", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/tile-showroom"
              style={{
                display: "inline-flex", alignItems: "center", gap: "var(--idea-space-2)",
                background: "var(--idea-gold)",
                color: "var(--idea-on-gold)",
                fontFamily: "var(--idea-font-display)",
                fontSize: "var(--idea-text-sm)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                textDecoration: "none",
                padding: "14px 28px",
                borderRadius: "var(--idea-radius-full)",
                border: "none",
                cursor: "pointer",
                transition: "background 0.22s, box-shadow 0.22s",
                boxShadow: "var(--idea-shadow-gold)",
              }}
            >
              {locale === "ar" ? "افتح المرئي" : locale === "fr" ? "Ouvrir le visualiseur" : "Open Room Visualizer"}
              <ArrowRight size={15} />
            </Link>

            <Link
              to="/products"
              style={{
                display: "inline-flex", alignItems: "center", gap: "var(--idea-space-2)",
                background: "transparent",
                color: "var(--idea-text)",
                fontFamily: "var(--idea-font-display)",
                fontSize: "var(--idea-text-sm)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                textDecoration: "none",
                padding: "14px 28px",
                borderRadius: "var(--idea-radius-full)",
                border: "var(--idea-hairline)",
                cursor: "pointer",
                transition: "border-color 0.22s, color 0.22s",
              }}
            >
              {locale === "ar" ? "تصفّح المنتجات" : locale === "fr" ? "Parcourir les produits" : "Browse All Products"}
            </Link>
          </div>
        </motion.div>
      </div>

      <style>{`
        .idea-sf-thumb:hover .idea-sf-thumb-img { transform: scale(1.06); }
        .idea-sf-swatch:hover {
          border-color: var(--idea-gold-bright) !important;
          background: var(--idea-gold-soft) !important;
        }
      `}</style>
    </>
  );
}
