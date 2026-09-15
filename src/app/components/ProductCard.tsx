import { Link } from "react-router";
import { Heart, GitCompare, FileText } from "lucide-react";
import type { Product } from "../data/types";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { Tag } from "./ui";

export function ProductCard({ product }: { product: Product }) {
  const { t, locale } = useI18n();
  const { isFavorite, toggleFavorite, toggleCompare, compare, addToQuote } = useStore();
  const fav = isFavorite(product.id);
  const inCompare = compare.includes(product.id);
  const unit = product.collection === "ceramics" || product.collection === "porcelain" ? "sqm" : "pieces";

  return (
    <div className="idea-product-card" style={{
      background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-lg)",
      overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform .3s, box-shadow .3s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--idea-shadow-md)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <Link to={`/product/${product.slug}`} style={{ position: "relative", display: "block", aspectRatio: "4/3", overflow: "hidden" }}>
        <img className="idea-product-img idea-vivid-image" src={product.image} alt={product.name[locale]} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .6s cubic-bezier(.22,1,.36,1)" }} />
        <div style={{ position: "absolute", top: 12, insetInlineStart: 12, display: "flex", gap: 6 }}>
          {product.type && <span style={badgeStyle}>{product.type}</span>}
        </div>
        <div style={{ position: "absolute", top: 12, insetInlineEnd: 12, display: "flex", gap: 6 }}>
          <button aria-label={t("action.favorite")} onClick={(e) => { e.preventDefault(); toggleFavorite(product.id); }} style={roundBtn(fav)}>
            <Heart size={16} fill={fav ? "var(--idea-gold-bright)" : "none"} />
          </button>
          <button aria-label={t("action.compare")} onClick={(e) => { e.preventDefault(); toggleCompare(product.id); }} style={roundBtn(inCompare)}>
            <GitCompare size={16} />
          </button>
        </div>
      </Link>

      <div style={{ padding: "var(--idea-space-4)", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div className="idea-eyebrow" style={{ color: "var(--idea-text-muted)" }}>{product.brand}</div>
        <Link to={`/product/${product.slug}`} className="idea-display" style={{ fontSize: "var(--idea-text-lg)", color: "var(--idea-text)", textDecoration: "none" }}>
          {product.name[locale]}
        </Link>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
          {product.sizes[0] && <Tag>{product.sizes[0].label}</Tag>}
          {product.finish && <Tag>{product.finish}</Tag>}
          {product.variant && <Tag>{product.variant}</Tag>}
        </div>
        <div style={{ marginTop: "auto", paddingTop: "var(--idea-space-3)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", fontStyle: "italic" }}>{t("price.hidden")}</span>
          <button onClick={() => addToQuote(product.id, unit)} style={{
            display: "inline-flex", alignItems: "center", gap: 6, background: "var(--idea-gold-soft)", border: "1px solid var(--idea-gold)",
            color: "var(--idea-gold-bright)", borderRadius: "var(--idea-radius-full)", padding: "6px 14px", cursor: "pointer", fontSize: "var(--idea-text-xs)", textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            <FileText size={13} /> {t("action.requestPrice")}
          </button>
        </div>
      </div>
      <style>{`
        .idea-product-card:hover .idea-product-img { transform: scale(1.06); }
        @media (prefers-reduced-motion: reduce) { .idea-product-img { transition: none !important; } }
      `}</style>
    </div>
  );
}

const badgeStyle: React.CSSProperties = {
  background: "var(--idea-overlay)", color: "var(--idea-gold-bright)", fontSize: 10, padding: "4px 10px",
  borderRadius: "var(--idea-radius-full)", textTransform: "uppercase", letterSpacing: "0.08em", border: "var(--idea-hairline)",
};

function roundBtn(active: boolean): React.CSSProperties {
  return {
    width: 34, height: 34, borderRadius: 999, display: "grid", placeItems: "center", cursor: "pointer",
    background: active ? "var(--idea-gold-soft)" : "var(--idea-overlay)",
    border: `1px solid ${active ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`,
    color: active ? "var(--idea-gold-bright)" : "var(--idea-text)", backdropFilter: "blur(6px)",
  };
}
