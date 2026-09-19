import { Link } from "react-router";
import { Heart, GitCompare, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "../data/types";
import { loadMazloumDetail, applyMazloumDetail } from "../data/mazloumDetails";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { Tag } from "./ui";

export function ProductCard({ product }: { product: Product }) {
  const { t, locale } = useI18n();
  const { isFavorite, toggleFavorite, toggleCompare, compare, addToQuote } = useStore();
  const [resolved, setResolved] = useState(product);
  const [sourceLoading, setSourceLoading] = useState(product.source?.sourceId === "source-13" && product.source?.provider !== "IDEA catalog source");
  const [imageFailed, setImageFailed] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setResolved(product);
    setImageFailed(false);
    if (product.source?.sourceId !== "source-13" || product.source?.provider === "IDEA catalog source" || !product.source.productPageUrl) {
      setSourceLoading(false);
      return;
    }

    let cancelled = false;
    setSourceLoading(true);
    void loadMazloumDetail(product.source.productPageUrl).then((detail) => {
      if (!cancelled && detail) {
        setResolved(applyMazloumDetail(product, detail));
        setImageFailed(false);
      }
    }).finally(() => {
      if (!cancelled) setSourceLoading(false);
    });

    return () => { cancelled = true; };
  }, [product]);

  const p = resolved;
  const fav = isFavorite(p.id);
  const inCompare = compare.includes(p.id);
  const unit = p.collection === "ceramics" || p.collection === "porcelain" ? "sqm" : "pieces";

  const secondaryImage = useMemo(
    () => p.gallery?.find((image) => image && image !== p.image),
    [p.gallery, p.image]
  );
  const cardImage = hovered && secondaryImage ? secondaryImage : p.image;
  const primarySize = p.sizes[0]?.normalizedDisplayValue || p.sizes[0]?.label;
  const commercialMeta = [
    primarySize,
    p.material,
    p.colors?.[0],
  ].filter(Boolean).slice(0, 3) as string[];

  return (
    <article
      className="idea-product-card"
      style={{
        background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-lg)",
        overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform .3s, box-shadow .3s",
      }}
      onMouseEnter={(e) => { setHovered(true); e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--idea-shadow-md)"; }}
      onMouseLeave={(e) => { setHovered(false); e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <Link to={`/product/${p.slug}`} style={{ position: "relative", display: "block", aspectRatio: "4/3", overflow: "hidden", background: "var(--idea-bg)" }}>
        {!cardImage ? (
          <span className="idea-image-unavailable">{sourceLoading ? "Loading source image…" : "Image unavailable"}</span>
        ) : imageFailed ? (
          <span className="idea-image-unavailable">Image unavailable</span>
        ) : (
          <img
            className="idea-product-img idea-vivid-image"
            src={cardImage}
            alt={p.name[locale]}
            loading="lazy"
            onError={() => setImageFailed(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .6s cubic-bezier(.22,1,.36,1), opacity .2s" }}
          />
        )}
        <div style={{ position: "absolute", top: 12, insetInlineStart: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {p.type && <span style={badgeStyle}>{p.type}</span>}
          {(p.badges ?? []).slice(0, 2).map((badge) => <span key={badge} style={badgeStyle}>{badge}</span>)}
        </div>
        <div style={{ position: "absolute", top: 12, insetInlineEnd: 12, display: "flex", gap: 6 }}>
          <button aria-label={t("action.favorite")} onClick={(e) => { e.preventDefault(); toggleFavorite(p.id); }} style={roundBtn(fav)}>
            <Heart size={16} fill={fav ? "var(--idea-gold-bright)" : "none"} />
          </button>
          <button aria-label={t("action.compare")} onClick={(e) => { e.preventDefault(); toggleCompare(p.id); }} style={roundBtn(inCompare)}>
            <GitCompare size={16} />
          </button>
        </div>
      </Link>

      <div style={{ padding: "var(--idea-space-4)", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {p.brand && <div className="idea-eyebrow" style={{ color: "var(--idea-text-muted)" }}>{p.brand}</div>}
        <Link to={`/product/${p.slug}`} className="idea-display" style={{ fontSize: "var(--idea-text-lg)", color: "var(--idea-text)", textDecoration: "none" }}>
          {p.name[locale]}
        </Link>
        {(p.subcategory || p.collection) && (
          <div style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", textTransform: "capitalize" }}>
            {(p.subcategory || p.collection).replaceAll("-", " ")}
          </div>
        )}
        {commercialMeta.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
            {commercialMeta.map((value) => <Tag key={value}>{value}</Tag>)}
          </div>
        )}
        <div style={{ marginTop: "auto", paddingTop: "var(--idea-space-3)", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
          <div>
            {p.compareAtPriceText && (
              <div style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", textDecoration: "line-through" }}>
                {p.compareAtPriceText}
              </div>
            )}
            {p.priceText ? (
              <div style={{ color: "var(--idea-gold-bright)", fontWeight: 700 }}>{p.priceText}</div>
            ) : (
              <span style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", fontStyle: "italic" }}>{t("price.hidden")}</span>
            )}
          </div>
          <button onClick={() => addToQuote(p.id, unit)} style={{
            display: "inline-flex", alignItems: "center", gap: 6, background: "var(--idea-gold-soft)", border: "1px solid var(--idea-gold)",
            color: "var(--idea-gold-bright)", borderRadius: "var(--idea-radius-full)", padding: "6px 14px", cursor: "pointer", fontSize: "var(--idea-text-xs)", textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            <FileText size={13} /> {t("action.requestPrice")}
          </button>
        </div>
      </div>
      <style>{`
        .idea-product-card:hover .idea-product-img { transform: scale(1.045); }
        @media (prefers-reduced-motion: reduce) { .idea-product-img { transition: none !important; } }
      `}</style>
    </article>
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
