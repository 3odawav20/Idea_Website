import { productGallery, relatedProducts } from "../data/merchandising";
import { COLLECTIONS } from "../data/catalog";
import { Link, useParams } from "react-router";
import { Heart, GitCompare, Sparkles, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [failedImages, setFailedImages] = useState<number[]>([]);

  useEffect(() => { setActiveImg(0); setFailedImages([]); }, [slug]);

  if (!product) {
    return (
      <Section><Container><p style={{ color: "var(--idea-text-muted)" }}>Product not found. <Link to="/products" style={{ color: "var(--idea-gold)" }}>Back to gallery</Link></p></Container></Section>
    );
  }

  const gallery = productGallery(product);
  const tr = (ar: string, en: string, fr: string) => locale === "ar" ? ar : locale === "fr" ? fr : en;
  const unit = product.collection === "ceramics" || product.collection === "porcelain" ? "sqm" : "pieces";
  const related = relatedProducts(product, products);
  const fav = isFavorite(product.id);
  const selectedImage = Math.min(activeImg, Math.max(0, gallery.length - 1));
  const activeImageFailed = !gallery.length || failedImages.includes(selectedImage);

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
          <Link to={`/collections/${product.collection}`} style={{ color: "inherit", textDecoration: "none", textTransform: "capitalize" }}>{COLLECTIONS.find((c) => c.slug === product.collection)?.title[locale] ?? product.collection}</Link>
          <ChevronRight size={12} />
          <span style={{ color: "var(--idea-gold)" }}>{product.name[locale]}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "var(--idea-space-7)" }} className="idea-pd-grid">
          {/* Gallery */}
          <div>
            <div style={{ aspectRatio: "4/3", borderRadius: "var(--idea-radius-lg)", overflow: "hidden", border: "var(--idea-hairline)" }}>
              {activeImageFailed ? (
                <div className="idea-image-unavailable">{tr("الصورة غير متاحة حاليًا", "Image currently unavailable", "Image indisponible")}</div>
              ) : (
                <img className="idea-vivid-image" src={gallery[selectedImage]} alt={product.name[locale]} onError={() => setFailedImages((current) => current.includes(activeImg) ? current : [...current, activeImg])} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
            {gallery.length > 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                {gallery.map((g, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} aria-label={`Show image ${i + 1}`} style={{ width: 80, height: 60, flexShrink: 0, borderRadius: "var(--idea-radius-sm)", overflow: "hidden", border: `1px solid ${i === activeImg ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`, padding: 0, cursor: "pointer" }}>
                    {failedImages.includes(i) ? <span className="idea-image-unavailable idea-image-unavailable--thumb">Unavailable</span> : <img className="idea-vivid-image" src={g} alt="" onError={() => setFailedImages((current) => current.includes(i) ? current : [...current, i])} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.brand && <div className="idea-eyebrow">{product.brand}</div>}
            <h1 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)", margin: "var(--idea-space-2) 0 var(--idea-space-3)" }}>{product.name[locale]}</h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "var(--idea-space-4)" }}>
              {product.variant && <Tag>{product.variant}</Tag>}
              {product.application && <Tag>{product.application}</Tag>}
              {(product.usage ?? []).map((u) => <Tag key={u}>{u}</Tag>)}
            </div>
            <p style={{ color: "var(--idea-text-faint)", fontStyle: "italic", marginBottom: "var(--idea-space-5)" }}>{t("price.hidden")}</p>

            {[product.series, product.material, product.surface, product.model, product.code, product.origin, product.type, product.finish, product.texture].some(Boolean) && <div style={{ background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-4) var(--idea-space-5)", marginBottom: "var(--idea-space-5)" }}>
              {spec(tr("المجموعة", "Collection", "Collection"), product.series)}
              {spec(tr("الخامة", "Material", "Matériau"), product.material)}
              {spec(tr("السطح", "Surface", "Surface"), product.surface)}
              {spec(t("label.model"), product.model)}
              {spec(t("label.code"), product.code)}
              {spec(t("label.origin"), product.origin)}
              {spec(t("label.type"), product.type)}
              {spec(t("label.finish"), product.finish)}
              {spec(t("label.texture"), product.texture)}
            </div>}

            {product.sizes.length > 0 && <div className="idea-eyebrow" style={{ marginBottom: 10 }}>{t("label.sizes")}</div>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "var(--idea-space-5)" }}>
              {product.sizes.map((s) => <Tag key={s.id}>{s.label}</Tag>)}
            </div>

            {(product.colors?.length ?? 0) > 0 && <section style={{ marginBottom: "var(--idea-space-5)" }}>
              <h2 className="idea-eyebrow">{tr("الألوان", "Colors", "Couleurs")}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--idea-space-2)" }}>{product.colors!.map((color) => <Tag key={color}>{color}</Tag>)}</div>
            </section>}
            {product.description && <section style={{ marginBottom: "var(--idea-space-5)" }}>
              <h2 className="idea-eyebrow">{tr("وصف المنتج", "Product description", "Description")}</h2>
              <p dir="auto" style={{ whiteSpace: "pre-line", overflowWrap: "anywhere", color: "var(--idea-text-muted)", lineHeight: 1.7 }}>{product.description}</p>
            </section>}
            {product.specificationGroups?.filter((group) => group.attributes.some((a) => a.value?.trim())).map((group, index) => <section key={index} style={{ marginBottom: "var(--idea-space-5)" }}>
              <h2 className="idea-eyebrow">{group.title}</h2>
              <dl>{group.attributes.filter((a) => a.value?.trim()).map((a, i) => <div key={i} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "var(--idea-space-3)", paddingBlock: "var(--idea-space-2)" }}><dt>{a.label}</dt><dd dir="auto" style={{ margin: 0 }}>{a.value}</dd></div>)}</dl>
            </section>)}
            {(product.variants?.length ?? 0) > 0 && <section style={{ marginBottom: "var(--idea-space-5)", overflowX: "auto" }}>
              <h2 className="idea-eyebrow">{tr("الاختيارات المتاحة", "Product options", "Options du produit")}</h2>
              <table style={{ width: "100%", textAlign: "start" }}><thead><tr><th>{tr("الاختيار", "Option", "Option")}</th><th>SKU</th><th>{tr("التوفر", "Availability", "Disponibilité")}</th></tr></thead>
                <tbody>{product.variants!.map((variant) => <tr key={variant.id}><td dir="auto">{Object.entries(variant.options).map(([name, value]) => `${name}: ${value}`).join(" · ") || variant.title}</td><td>{variant.sku}</td><td>{variant.available === undefined ? "" : variant.available ? tr("متاح", "Available", "Disponible") : tr("غير متاح", "Unavailable", "Indisponible")}</td></tr>)}</tbody>
              </table>
            </section>}

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
            <div className="idea-eyebrow" style={{ marginBottom: "var(--idea-space-4)" }}>{tr("منتجات ذات صلة", "Related products", "Produits associés")}</div>
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
