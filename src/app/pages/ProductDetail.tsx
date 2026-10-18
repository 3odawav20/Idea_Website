import { useUiText as useLocaleText } from "../i18n/useUiText";
import { Link, useParams, useNavigate } from "react-router";
import { Heart, GitCompare, ChevronRight } from "lucide-react";
import { TryMaterialLink, isSurfaceProduct } from '../components/TryMaterialLink';
import { useEffect, useState } from "react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { Button, Container, Section, Tag } from "../components/ui";
import { ProductCard } from "../components/ProductCard";

export function ProductDetail() {
  const uiText = useLocaleText();
  const navigate=useNavigate();

  const { slug } = useParams();
  const { t, locale } = useI18n();
  const { products, isFavorite, toggleFavorite, toggleCompare, addToQuote } = useStore();
  const product = products.find((p) => p.slug === slug);
  const [activeImg, setActiveImg] = useState(0);
  const [failedImages, setFailedImages] = useState<number[]>([]);
  // React Router reuses this component when moving between product slugs.
  // Reset the gallery so a previous item cannot leave the new image blank.
  useEffect(() => { setActiveImg(0); setFailedImages([]); }, [slug]);

  if (!product) {
    return (
      <Section><Container><p style={{ color: "var(--idea-text-muted)" }}>{uiText("Product not found. ")}<Link to="/products" style={{ color: "var(--idea-gold)" }}>{uiText("Back to gallery")}</Link></p></Container></Section>
    );
  }

  const gallery = product.gallery?.length ? product.gallery : [product.image];
  const unit = product.collection === "ceramics" || product.collection === "porcelain" ? "sqm" : "pieces";
  // Products without a source-verified family must not be shown as family variants.
  const related = products.filter((p) => p.id !== product.id && (
    product.family
      ? Boolean(p.family && p.family === product.family)
      : p.brand === product.brand && p.collection === product.collection &&
        p.finish === product.finish &&
        p.sizes.some((size) => product.sizes.some((own) => own.label === size.label))
  )).slice(0, 4);
  const fav = isFavorite(product.id);
  const visibleImage = gallery[activeImg] || gallery[0];
  const activeImageFailed = failedImages.includes(activeImg);

  const spec = (label: string, value?: string) => value && (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--idea-border-neutral)" }}>
      <span style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>{uiText(label)}</span>
      <span style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-sm)" }}>{uiText(value)}</span>
    </div>
  );

  return (
    <Section style={{ paddingTop: "var(--idea-space-6)" }}>
      <Container>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", marginBottom: "var(--idea-space-5)" }}>
          <Link to="/collections" style={{ color: "inherit", textDecoration: "none" }}>{uiText(t("nav.collections"))}</Link>
          <ChevronRight size={12} />
          <Link to={`/collections/${product.collection}`} style={{ color: "inherit", textDecoration: "none", textTransform: "capitalize" }}>{uiText(product.collection.replace("-", " "))}</Link>
          <ChevronRight size={12} />
          <span style={{ color: "var(--idea-gold)" }}>{uiText(product.name[locale])}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "var(--idea-space-7)" }} className="idea-pd-grid">
          {/* Gallery */}
          <div style={{minWidth:0}}>
            <div style={{ aspectRatio: "4/3", borderRadius: "var(--idea-radius-lg)", overflow: "hidden", border: "var(--idea-hairline)" }}>
              {uiText(activeImageFailed ? (
                <div className="idea-image-unavailable">{uiText("Image unavailable from the documented source.")}</div>
              ) : (
                <img className="idea-vivid-image" src={visibleImage} alt={uiText(product.name[locale])} onError={() => setFailedImages((current) => current.includes(activeImg) ? current : [...current, activeImg])} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ))}
            </div>
            {uiText(gallery.length > 1 && (
              <div style={{ display: "flex", gap: 10, marginTop: 12, overflowX: "auto", maxWidth: "100%", paddingBottom: 8 }}>
                {uiText(gallery.map((g, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} aria-label={uiText(`Show image ${i + 1}`)} style={{ flexShrink: 0, width: 80, height: 60, borderRadius: "var(--idea-radius-sm)", overflow: "hidden", border: `1px solid ${i === activeImg ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`, padding: 0, cursor: "pointer" }}>
                    {uiText(failedImages.includes(i) ? <span className="idea-image-unavailable idea-image-unavailable--thumb">{uiText("Unavailable")}</span> : <img className="idea-vivid-image" src={g} alt={uiText("")} onError={() => setFailedImages((current) => current.includes(i) ? current : [...current, i])} style={{ width: "100%", height: "100%", objectFit: "contain" }} />)}
                  </button>
                )))}
              </div>
            ))}
          </div>

          {/* Info */}
          <div>
            <div className="idea-eyebrow">{uiText(product.brand)}</div>
            <h1 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)", margin: "var(--idea-space-2) 0 var(--idea-space-3)" }}>{uiText(product.name[locale])}</h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "var(--idea-space-4)" }}>
              {uiText(product.variant && <Tag>{uiText(product.variant)}</Tag>)}
              {uiText(product.application && <Tag>{uiText(product.application)}</Tag>)}
              {uiText((product.usage ?? []).map((u) => <Tag key={u}>{uiText(u)}</Tag>))}
            </div>
            <p style={{ color: "var(--idea-text-faint)", fontStyle: "italic", marginBottom: "var(--idea-space-5)" }}>{uiText(t("price.hidden"))}</p>

            <div style={{ background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-4) var(--idea-space-5)", marginBottom: "var(--idea-space-5)" }}>
              {uiText(spec(t("label.model"), product.model))}
              {uiText(spec(t("label.code"), product.code))}
              {uiText(spec(t("label.origin"), product.origin))}
              {uiText(spec(t("label.type"), product.type))}
              {uiText(spec(t("label.finish"), product.finish))}
              {uiText(spec(t("label.texture"), product.texture))}
            </div>

            <div className="idea-eyebrow" style={{ marginBottom: 10 }}>{uiText(t("label.sizes"))}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "var(--idea-space-5)" }}>
              {uiText(product.sizes.map((s) => <Tag key={s.id}>{uiText(s.label)}</Tag>))}
            </div>

            <div style={{ display: "flex", gap: "var(--idea-space-3)", flexWrap: "wrap" }}>
              <Button size="lg" onClick={() => addToQuote(product.id, unit)}>{uiText(t("action.requestPrice"))}</Button>
                <Button variant="ghost" onClick={() => {try{toggleFavorite(product.id);}catch{navigate('/login');}}}><Heart size={16} fill={fav ? "var(--idea-gold-bright)" : "none"} /> {uiText(t("action.favorite"))}</Button>
              <Button variant="ghost" onClick={() => toggleCompare(product.id)}><GitCompare size={16} /> {uiText(t("action.compare"))}</Button>
            </div>
            {isSurfaceProduct(product) && product.image && <TryMaterialLink productId={product.id} />}
          </div>
        </div>

        {uiText(related.length > 0 && (
          <div style={{ marginTop: "var(--idea-space-8)" }}>
            <div className="idea-eyebrow" style={{ marginBottom: "var(--idea-space-4)" }}>{uiText("Product Family")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--idea-space-5)" }}>
              {uiText(related.map((p) => <ProductCard key={p.id} product={p} />))}
            </div>
          </div>
        ))}
      </Container>
      <style>{`@media (max-width: 860px){ .idea-pd-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </Section>
  );
}
