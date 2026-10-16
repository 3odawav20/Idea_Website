import { useState } from "react";
import { Link } from "react-router";
import { X } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";

const MESSAGES = [
  { en: "475 Products · Ceramics · Porcelain · Sanitary Ware · Faucets", ar: "475 منتجاً · سيراميك · بورسلين · أدوات صحية · خلاطات", fr: "475 produits · Céramique · Porcelaine · Sanitaire · Robinetterie" },
  { en: "Free Price Comparison — Best Offer Within 24 Hours", ar: "مقارنة أسعار مجانية — أفضل عرض خلال 24 ساعة", fr: "Comparaison gratuite — Meilleure offre en 24 heures" },
  { en: "Nationwide Delivery Across Egypt & MENA", ar: "التوصيل لجميع أنحاء مصر والشرق الأوسط وأفريقيا", fr: "Livraison nationale en Égypte et MENA" },
];

export function AnnouncementBar() {
  const { locale } = useI18n();
  const { products } = useStore();
  const [dismissed, setDismissed] = useState(false);
  const [msgIndex] = useState(0);

  if (dismissed) return null;

  const msg = MESSAGES[msgIndex % MESSAGES.length];

  return (
    <div
      style={{
        position: "relative",
        background: "#0d0b08",
        borderBottom: "1px solid rgba(255,114,0,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 38,
        padding: "0 48px",
        overflow: "hidden",
      }}
    >
      {/* Subtle gold shimmer line at bottom */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: 1,
        background: "linear-gradient(90deg, transparent, rgba(255,114,0,0.5) 40%, rgba(255,114,0,0.5) 60%, transparent)",
      }} />

      <p style={{
        margin: 0,
        fontFamily: "var(--idea-font-display)",
        fontSize: "var(--idea-text-xs)",
        letterSpacing: "0.1em",
        color: "rgba(255,255,255,0.72)",
        textAlign: "center",
        textTransform: "uppercase",
        lineHeight: 1,
      }}>
        <span style={{ color: "var(--idea-gold-bright)", marginInlineEnd: 10 }}>✦</span>
        {locale === "ar" ? `${products.length} منتج في الكتالوج · استكشف الخامات وخطط مساحتك` : locale === "fr" ? `${products.length} produits au catalogue · Explorez et concevez` : `${products.length} products in the catalogue · Explore surfaces & plan your space`}
        <span style={{ color: "var(--idea-gold-bright)", marginInlineStart: 10 }}>✦</span>
        {" "}
        <Link
          to="/how-it-works"
          style={{
            color: "var(--idea-gold-bright)",
            textDecoration: "underline",
            textDecorationColor: "rgba(255,114,0,0.4)",
            marginInlineStart: 8,
          }}
        >
          {locale === "ar" ? "اعرف أكثر" : locale === "fr" ? "En savoir plus" : "Learn more"}
        </Link>
      </p>

      <button
        aria-label="Dismiss announcement"
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute",
          insetInlineEnd: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.35)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: 4,
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
