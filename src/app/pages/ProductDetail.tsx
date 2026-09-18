import { Link, useParams } from "react-router";
import { Heart, GitCompare, Sparkles, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "../data/types";
import { loadMazloumDetail, applyMazloumDetail } from "../data/mazloumDetails";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { Button, Container, Section, Tag } from "../components/ui";
import { ProductCard } from "../components/ProductCard";

export function ProductDetail() {
  const { slug } = useParams();
  const { t, locale } = useI18n();
  const { products, isFavorite, toggleFavorite, toggleCompare, addToQuote } = useStore();
  const baseProduct = products.find((p) => p.slug === slug);
  const [resolvedProduct, setResolvedProduct] = useState<Product | undefined>(baseProduct);
  const [activeImg, setActiveImg] = useState(0);
  const [failedImages, setFailedImages] = useState<number[]>([]);

  useEffect(() => {
    setResolvedProduct(baseProduct);
    setActiveImg(0);
    setFailedImages([]);

    if (baseProduct?.source?.sourceId !== "source-13" || !baseProduct.source.productPageUrl) return;
    let cancelled = false;

    void loadMazloumDetail(baseProduct.source.productPageUrl).then((detail) => {
      if (!cancelled && detail) {
        setResolvedProduct(applyMazloumDetail(baseProduct, detail));
        setActiveImg(0);
        setFailedImages([]);
      }
    });

    return () => { cancelled = true; };
  }, [baseProduct]);

  const product = resolvedProduct || baseProduct;

  if (!product) {
    return (
      <Section><Container><p style={{ color: "var(--idea-text-muted)" }}>Product not found. <Link to="/products" style={{ color: "var(--idea-gold)" }}>Back to gallery</Link></p></Container></Section>
    );
  }

  const gallery = product.gallery?.length ? [...new Set([product.image, ...product.gallery])] : [product.image];
  const unit = product.collection === "ceramics" || product.collection === "porcelain" ? "sqm" : "pieces";
  const fav = isFavorite(product.id);
  const activeImageFailed = failedImages.includes(activeImg);

  const related = (() => {
    const score = (candidate: typeof product) => {
      let value = 0;
      if (candidate.family && candidate.family === product.family) value += 5;
      if (candidate.series && candidate.series === product.series) value += 4;
      if (candidate.brand && candidate.brand === product.brand) value += 3;
      if (candidate.collection === product.collection) value += 2;
      if (candidate.material && candidate.material === product.material) value += 1;
      return value;
    };
    return products
      .filter((candidate) => candidate.id !== product.id)
      .map((candidate) => ({ candidate, score: score(candidate) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.candidate.name.en.localeCompare(b.candidate.name.en))
      .slice(0, 4)
      .map((item) => item.candidate);
  })();

  const primarySpecs = [
    ["Model", product.model],
    ["SKU", product.code],
    ["Origin", product.origin],
    ["Type", product.type],
    ["Material", product.material],
    ["Surface", product.surface],
    ["Texture", product.texture],
    ["Pattern", product.pattern],
    ["Finish", product.finish],
    ["Application", product.application],
    ["Weight", product.weight],
    ["Availability", product.availability],
    ["Packaging", product.packaging],
    ["Pieces / box", product.piecesPerBox ? String(product.piecesPerBox) : undefined],
    ["m² / box", product.squareMetersPerBox ? String(product.squareMetersPerBox) : undefined],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const spec = (label: string, value: string) => (
    <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 20, padding: "10px 0", borderBottom: "1px solid var(--idea-border-neutral)" }}>
      <span style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>{label}</span>
      <span style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-sm)", textAlign: "end" }}>{value}</span>
    </div>
  );

  return (
    <Section style={{ paddingTop: "var(--idea-space-6)" }}>
      <Container>
        <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", marginBottom: "var(--idea-space-5)", flexWrap: "wrap" }}>
          <Link to="/collections" style={{ color: "inherit", textDecoration: "none" }}>{t("nav.collections")}</Link>
          <ChevronRight size={12} />
          <Link to={`/collections/${product.collection}`} style={{ color: "inherit", textDecoration: "none", textTransform: "capitalize" }}>{product.collection.replaceAll("-", " ")}</Link>
          {product.subcategory && <><ChevronRight size={12} /><span>{product.subcategory}</span></>}
          {product.series && <><ChevronRight size={12} /><span>{product.series}</span></>}
          <ChevronRight size={12} />
          <span style={{ color: "var(--idea-gold)" }}>{product.name[locale]}</span>
        </nav>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "var(--idea-space-7)" }} className="idea-pd-grid">
          <div>
            <div style={{ aspectRatio: "4/3", borderRadius: "var(--idea-radius-lg)", overflow: "hidden", border: "var(--idea-hairline)", background: "var(--idea-surface)" }}>
              {activeImageFailed ? (
                <div className="idea-image-unavailable">Image unavailable from the documented source.</div>
              ) : (
                <img className="idea-vivid-image" src={gallery[activeImg]} alt={product.name[locale]} onError={() => setFailedImages((current) => current.includes(activeImg) ? current : [...current, activeImg])} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
            {gallery.length > 1 && (
              <div style={{ display: "flex", gap: 10, marginTop: 12, overflowX: "auto", paddingBottom: 4 }}>
                {gallery.map((g, i) => (
                  <button key={g} onClick={() => setActiveImg(i)} aria-label={`Show image ${i + 1}`} style={{ width: 80, height: 60, flex: "0 0 auto", borderRadius: "var(--idea-radius-sm)", overflow: "hidden", border: `1px solid ${i === activeImg ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`, padding: 0, cursor: "pointer" }}>
                    {failedImages.includes(i) ? <span className="idea-image-unavailable idea-image-unavailable--thumb">Unavailable</span> : <img className="idea-vivid-image" src={g} alt="" onError={() => setFailedImages((current) => current.includes(i) ? current : [...current, i])} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.brand && <div className="idea-eyebrow">{product.brand}</div>}
            <h1 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)", margin: "var(--idea-space-2) 0 var(--idea-space-3)" }}>{product.name[locale]}</h1>
            {(product.series || product.family) && <div style={{ color: "var(--idea-text-muted)", marginBottom: 10 }}>{product.series || product.family}</div>}
            {(product.priceText || product.compareAtPriceText) && (
              <div style={{ marginBottom: "var(--idea-space-4)" }}>
                {product.compareAtPriceText && (
                  <div style={{ color: "var(--idea-text-faint)", textDecoration: "line-through", fontSize: "var(--idea-text-sm)" }}>
                    {product.compareAtPriceText}
                  </div>
                )}
                {product.priceText && (
                  <div style={{ color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-xl)", fontWeight: 700 }}>
                    {product.priceText}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "var(--idea-space-4)" }}>
              {(product.badges ?? []).map((badge) => <Tag key={badge}>{badge}</Tag>)}
              {product.variant && <Tag>{product.variant}</Tag>}
              {product.application && <Tag>{product.application}</Tag>}
              {(product.usage ?? []).map((u) => <Tag key={u}>{u}</Tag>)}
            </div>

            {product.description && (
              <p style={{ color: "var(--idea-text-muted)", lineHeight: 1.8, marginBottom: "var(--idea-space-5)", whiteSpace: "pre-line" }}>
                {product.description}
              </p>
            )}

            {primarySpecs.length > 0 && (
              <div style={{ background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-4) var(--idea-space-5)", marginBottom: "var(--idea-space-5)" }}>
                {primarySpecs.map(([label, value]) => spec(label, value))}
              </div>
            )}

            {product.sizes.length > 0 && <>
              <div className="idea-eyebrow" style={{ marginBottom: 10 }}>{t("label.sizes")}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "var(--idea-space-5)" }}>
                {product.sizes.map((s) => <Tag key={s.id}>{s.normalizedDisplayValue || s.label}</Tag>)}
              </div>
            </>}

            {(product.colors?.length ?? 0) > 0 && <>
              <div className="idea-eyebrow" style={{ marginBottom: 10 }}>Colors / finishes</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "var(--idea-space-5)" }}>
                {product.colors!.map((color) => <Tag key={color}>{color}</Tag>)}
                {product.finish && !product.colors!.includes(product.finish) && <Tag>{product.finish}</Tag>}
              </div>
            </>}

            {(product.variants?.length ?? 0) > 0 && <>
              <div className="idea-eyebrow" style={{ marginBottom: 10 }}>Available variants</div>
              <div style={{ display: "grid", gap: 8, marginBottom: "var(--idea-space-5)" }}>
                {product.variants!.map((variant) => (
                  <div key={variant.id} style={{ border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-sm)", padding: "10px 12px", display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ color: "var(--idea-text)" }}>{variant.label}</span>
                    <span style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>{variant.sku || (variant.available === false ? "Unavailable" : "")}</span>
                  </div>
                ))}
              </div>
            </>}

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

        {(product.specificationGroups?.length ?? 0) > 0 && (
          <div style={{ marginTop: "var(--idea-space-8)" }}>
            <div className="idea-eyebrow" style={{ marginBottom: "var(--idea-space-4)" }}>Technical specifications</div>
            <div style={{ display: "grid", gap: "var(--idea-space-4)", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
              {product.specificationGroups!.map((group) => (
                <section key={group.title} style={{ background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-4) var(--idea-space-5)" }}>
                  <h2 className="idea-display" style={{ fontSize: "var(--idea-text-md)", margin: "0 0 8px", color: "var(--idea-text)" }}>{group.title}</h2>
                  {group.items.map((item) => spec(item.label, item.normalizedValue || item.value))}
                </section>
              ))}
            </div>
          </div>
        )}

        {related.length > 0 && (
          <div style={{ marginTop: "var(--idea-space-8)" }}>
            <div className="idea-eyebrow" style={{ marginBottom: "var(--idea-space-4)" }}>Related products</div>
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
