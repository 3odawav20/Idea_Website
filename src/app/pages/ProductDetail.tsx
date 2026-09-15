import { Link, useParams } from "react-router";
import { Heart, GitCompare, Sparkles, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { Button, Container, Section, Tag } from "../components/ui";
import { ProductCard } from "../components/ProductCard";

export function ProductDetail() {
  const { slug } = useParams();
  const { t, locale } = useI18n();
  const { products, isFavorite, toggleFavorite, toggleCompare, addToQuote } = useStore();
  const product = products.find((p) => p.slug === slug);
  const [activeImg, setActiveImg] = useState(0);

  if (!product) {
    return (
      <Section><Container><p style={{ color: "var(--idea-text-muted)" }}>Product not found. <Link to="/products" style={{ color: "var(--idea-gold)" }}>Back to gallery</Link></p></Container></Section>
    );
  }

  const gallery = product.gallery?.length ? product.gallery : [product.image];
  const unit = product.collection === "ceramics" || product.collection === "porcelain" ? "sqm" : "pieces";
  const related = products.filter((p) => p.family === product.family && p.id !== product.id).slice(0, 4);
  const fav = isFavorite(product.id);

  const spec = (label: string, value?: string) => value && (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--idea-border-neutral)" }}>
      <span style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>{label}</span>
      <span style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-sm)" }}>{value}</span>
    </div>
  );

  return (
    <Section style={{ paddingTop: "var(--idea-space-6)" }}>
      <Container>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", marginBottom: "var(--idea-space-5)" }}>
          <Link to="/collections" style={{ color: "inherit", textDecoration: "none" }}>{t("nav.collections")}</Link>
          <ChevronRight size={12} />
          <Link to={`/collections/${product.collection}`} style={{ color: "inherit", textDecoration: "none", textTransform: "capitalize" }}>{product.collection.replace("-", " ")}</Link>
          <ChevronRight size={12} />
          <span style={{ color: "var(--idea-gold)" }}>{product.name[locale]}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "var(--idea-space-7)" }} className="idea-pd-grid">
          {/* Gallery */}
          <div>
            <div style={{ aspectRatio: "4/3", borderRadius: "var(--idea-radius-lg)", overflow: "hidden", border: "var(--idea-hairline)" }}>
              <img className="idea-vivid-image" src={gallery[activeImg]} alt={product.name[locale]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            {gallery.length > 1 && (
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                {gallery.map((g, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} style={{ width: 80, height: 60, borderRadius: "var(--idea-radius-sm)", overflow: "hidden", border: `1px solid ${i === activeImg ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`, padding: 0, cursor: "pointer" }}>
                    <img className="idea-vivid-image" src={g} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="idea-eyebrow">{product.brand}</div>
            <h1 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)", margin: "var(--idea-space-2) 0 var(--idea-space-3)" }}>{product.name[locale]}</h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "var(--idea-space-4)" }}>
              {product.variant && <Tag>{product.variant}</Tag>}
              {product.application && <Tag>{product.application}</Tag>}
              {(product.usage ?? []).map((u) => <Tag key={u}>{u}</Tag>)}
            </div>
            <p style={{ color: "var(--idea-text-faint)", fontStyle: "italic", marginBottom: "var(--idea-space-5)" }}>{t("price.hidden")}</p>

            <div style={{ background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-4) var(--idea-space-5)", marginBottom: "var(--idea-space-5)" }}>
              {spec(t("label.model"), product.model)}
              {spec(t("label.code"), product.code)}
              {spec(t("label.origin"), product.origin)}
              {spec(t("label.type"), product.type)}
              {spec(t("label.finish"), product.finish)}
              {spec(t("label.texture"), product.texture)}
            </div>

            <div className="idea-eyebrow" style={{ marginBottom: 10 }}>{t("label.sizes")}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "var(--idea-space-5)" }}>
              {product.sizes.map((s) => <Tag key={s.id}>{s.label}</Tag>)}
            </div>

            <div style={{ display: "flex", gap: "var(--idea-space-3)", flexWrap: "wrap" }}>
              <Button size="lg" onClick={() => addToQuote(product.id, unit)}>{t("action.requestPrice")}</Button>
              <Button variant="ghost" onClick={() => toggleFavorite(product.id)}><Heart size={16} fill={fav ? "var(--idea-gold-bright)" : "none"} /> {t("action.favorite")}</Button>
              <Button variant="ghost" onClick={() => toggleCompare(product.id)}><GitCompare size={16} /> {t("action.compare")}</Button>
            </div>
            <Link to="/room-designer/new" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--idea-gold)", marginTop: "var(--idea-space-4)", fontSize: "var(--idea-text-sm)" }}>
              <Sparkles size={14} /> {t("action.addVisualizer")}
            </Link>
          </div>
        </div>

        {related.length > 0 && (
          <div style={{ marginTop: "var(--idea-space-8)" }}>
            <div className="idea-eyebrow" style={{ marginBottom: "var(--idea-space-4)" }}>Product Family</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--idea-space-5)" }}>
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </Container>
      <style>{`@media (max-width: 860px){ .idea-pd-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </Section>
  );
}
