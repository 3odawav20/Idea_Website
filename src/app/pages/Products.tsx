import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type { CollectionSlug, Product } from "../data/types";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { COLLECTIONS } from "../data/catalog";
import { ART_CERAMIC_CATALOGUE } from "../data/artceramicImport";
import { hasPublicProductContent } from "../data/catalogQuality";
import { ProductCard } from "../components/ProductCard";
import { Chip, Container, Section } from "../components/ui";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";

function uniq<T>(arr: (T | undefined)[]): T[] {
  return [...new Set(arr.filter(Boolean) as T[])];
}

export function Products({ fixedCollection }: { fixedCollection?: CollectionSlug }) {
  const { t, locale } = useI18n();
  const { products } = useStore();
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();

  const publicProducts = useMemo(
    () => products.filter(hasPublicProductContent),
    [products]
  );
  const scope = useMemo(
    () => (fixedCollection ? publicProducts.filter((p) => p.collection === fixedCollection) : publicProducts),
    [publicProducts, fixedCollection]
  );

  // Seed filters from the hero search panel (?color=&size=&usage=&finish=).
  const [finish, setFinish] = useState<string | null>(params.get("finish"));
  const [size, setSize] = useState<string | null>(params.get("size"));
  const [usage, setUsage] = useState<string | null>(params.get("usage"));
  const [color, setColor] = useState<string | null>(params.get("color"));
  const [brand, setBrand] = useState<string | null>(params.get("brand"));
  const [type, setType] = useState<string | null>(params.get("type"));
  const [material, setMaterial] = useState<string | null>(params.get("material"));
  const [application, setApplication] = useState<string | null>(params.get("application"));
  const [sort, setSort] = useState<"name" | "brand" | "collection">("name");

  // Only build filter groups from values that actually exist (no empty filters).
  const facets = useMemo(() => ({
    finish: uniq(scope.map((p) => p.finish)),
    size: uniq(scope.flatMap((p) => p.sizes.map((s) => s.label))),
    usage: uniq(scope.flatMap((p) => p.usage ?? [])),
    color: uniq(scope.flatMap((p) => p.colors ?? [])),
    brand: uniq(scope.map((p) => p.brand)),
    type: uniq(scope.map((p) => p.type)),
    material: uniq(scope.map((p) => p.material)),
    application: uniq(scope.map((p) => p.application)),
  }), [scope]);

  const matches = (p: Product) => {
    if (finish && p.finish !== finish) return false;
    if (size && !p.sizes.some((s) => s.label === size)) return false;
    if (usage && !(p.usage ?? []).includes(usage)) return false;
    if (color && !(p.colors ?? []).includes(color)) return false;
    if (brand && p.brand !== brand) return false;
    if (type && p.type !== type) return false;
    if (material && p.material !== material) return false;
    if (application && p.application !== application) return false;
    if (q) {
      const hay = [p.name[locale], p.name.en, p.brand, p.model, p.code, p.collection, p.subcategory, p.series, p.origin, p.type, p.material, p.finish, p.texture, p.application, ...(p.colors ?? []), ...(p.usage ?? []), ...p.sizes.map((s) => s.normalizedDisplayValue || s.label)]
        .join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  };

  const results = scope.filter(matches).toSorted((a, b) => {
    if (sort === "brand") return (a.brand || "").localeCompare(b.brand || "") || a.name[locale].localeCompare(b.name[locale]);
    if (sort === "collection") return a.collection.localeCompare(b.collection) || a.name[locale].localeCompare(b.name[locale]);
    return a.name[locale].localeCompare(b.name[locale]);
  });
  const activeCount = [finish, size, usage, color, brand, type, material, application].filter(Boolean).length;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const visibleResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [fixedCollection, q, finish, size, usage, color, brand, type, material, application, sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const clear = () => { setFinish(null); setSize(null); setUsage(null); setColor(null); setBrand(null); setType(null); setMaterial(null); setApplication(null); };

  const meta = fixedCollection ? COLLECTIONS.find((c) => c.slug === fixedCollection) : null;
  const catalogueSummary = locale === "ar"
    ? `${publicProducts.length} منتجًا في الكتالوج الحالي · ${ART_CERAMIC_CATALOGUE.totalImages} مرجع صورة لـ Art Ceramic`
    : locale === "fr"
      ? `${publicProducts.length} produits dans le catalogue actuel · ${ART_CERAMIC_CATALOGUE.totalImages} références d’images Art Ceramic`
      : `${publicProducts.length} products in the current catalogue · ${ART_CERAMIC_CATALOGUE.totalImages} Art Ceramic gallery image references`;

  const group = (label: string, values: string[], val: string | null, set: (v: string | null) => void) =>
    values.length > 1 && (
      <div style={{ marginBottom: "var(--idea-space-4)" }}>
        <div className="idea-eyebrow" style={{ color: "var(--idea-text-muted)", marginBottom: 10 }}>{label}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {values.map((v) => <Chip key={v} active={val === v} onClick={() => set(val === v ? null : v)}>{v}</Chip>)}
        </div>
      </div>
    );

  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container>
        {/* Page heading */}
        <div style={{ marginBottom: "var(--idea-space-6)" }}>
          <div className="idea-eyebrow">{meta ? COLLECTIONS.find((c) => c.slug === fixedCollection)?.group : "Gallery"}</div>
          <h1 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)", margin: "var(--idea-space-2) 0 0" }}>
            {meta ? meta.title[locale] : t("nav.products")}
          </h1>
          {q && <p style={{ color: "var(--idea-text-muted)", marginTop: 8 }}>“{q}”</p>}
          {!q && !meta && (
            <p style={{ color: "var(--idea-text-muted)", marginTop: "var(--idea-space-2)", fontSize: "var(--idea-text-sm)" }}>
              {catalogueSummary}
            </p>
          )}
        </div>

        {/* Mobile filter toolbar */}
        <div className="idea-filter-toolbar" style={{ display: "none", justifyContent: "space-between", alignItems: "center", gap: "var(--idea-space-3)", marginBottom: "var(--idea-space-4)" }}>
          <button onClick={() => setMobileOpen(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px",
              background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-full)",
              color: "var(--idea-text)", cursor: "pointer", fontFamily: "var(--idea-font-body)", fontSize: "var(--idea-text-sm)",
            }}>
            <SlidersHorizontal size={16} color="var(--idea-gold)" />
            {t("filters.title")}
            {activeCount > 0 && (
              <span style={{ minWidth: 20, height: 20, display: "inline-grid", placeItems: "center", padding: "0 6px", borderRadius: "var(--idea-radius-full)", background: "var(--idea-gold)", color: "var(--idea-on-gold)", fontSize: "var(--idea-text-xs)", fontWeight: 600 }}>{activeCount}</span>
            )}
          </button>
          <span style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>{results.length} {t("label.results")}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "230px minmax(0, 1fr)", gap: "var(--idea-space-5)", alignItems: "start" }} className="idea-gallery-grid">
          {/* Filters */}
          {mobileOpen && <div onClick={() => setMobileOpen(false)} className="idea-filter-scrim" style={{ display: "none", position: "fixed", inset: 0, zIndex: 60, background: "var(--idea-scrim)" }} />}
          <aside className={`idea-filters-panel${mobileOpen ? " is-open" : ""}`} style={{ background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-lg)", padding: "var(--idea-space-5)", position: "sticky", top: 90 }}>
            <button className="idea-filter-close" onClick={() => setMobileOpen(false)}
              style={{ display: "none", position: "absolute", insetInlineEnd: "var(--idea-space-4)", top: "var(--idea-space-4)", background: "none", border: "none", color: "var(--idea-text-muted)", cursor: "pointer" }}>
              <X size={20} />
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--idea-space-4)" }}>
              <span className="idea-display" style={{ fontSize: "var(--idea-text-lg)", color: "var(--idea-text)" }}>{t("filters.title")}</span>
              <button onClick={clear} style={{ background: "none", border: "none", color: "var(--idea-gold)", cursor: "pointer", fontSize: "var(--idea-text-xs)" }}>{t("filters.clear")}</button>
            </div>
            {group("Brand", facets.brand, brand, setBrand)}
            {group("Product type", facets.type, type, setType)}
            {group(t("filters.finish"), facets.finish, finish, setFinish)}
            {group(t("filters.size"), facets.size, size, setSize)}
            {group(t("label.usage"), facets.usage, usage, setUsage)}
            {group("Color", facets.color, color, setColor)}
            {group("Material", facets.material, material, setMaterial)}
            {group("Application", facets.application, application, setApplication)}
            <button className="idea-filter-show" onClick={() => setMobileOpen(false)}
              style={{
                display: "none", width: "100%", marginTop: "var(--idea-space-4)", padding: "12px 20px",
                background: "linear-gradient(135deg, var(--idea-gold-bright), var(--idea-gold))", color: "var(--idea-on-gold)",
                border: "none", borderRadius: "var(--idea-radius-md)", cursor: "pointer", fontFamily: "var(--idea-font-body)",
                fontSize: "var(--idea-text-sm)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
              }}>
              {results.length} {t("label.results")}
            </button>
          </aside>

          {/* Results */}
          <div>
            <div style={{ color: "var(--idea-text-muted)", marginBottom: "var(--idea-space-4)", fontSize: "var(--idea-text-sm)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span>{results.length} {t("label.results")}</span>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span>Sort</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} style={{ background: "var(--idea-surface)", color: "var(--idea-text)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-sm)", padding: "7px 10px" }}>
                  <option value="name">Product name</option>
                  <option value="brand">Brand</option>
                  <option value="collection">Category</option>
                </select>
              </label>
            </div>
            {results.length === 0 ? (
              <div style={{ padding: "var(--idea-space-8)", textAlign: "center", border: "1px dashed var(--idea-border)", borderRadius: "var(--idea-radius-lg)", color: "var(--idea-text-muted)", lineHeight: 1.7 }}>
                {t("empty.products")}
              </div>
            ) : (
              <div className="idea-products-grid">
                {visibleResults.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {results.length > PAGE_SIZE && (
              <nav aria-label="Product pagination" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: "var(--idea-space-6)", flexWrap: "wrap" }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6, border: "var(--idea-hairline)",
                    background: "var(--idea-surface)", color: page <= 1 ? "var(--idea-text-faint)" : "var(--idea-text)",
                    borderRadius: "var(--idea-radius-full)", padding: "8px 13px", cursor: page <= 1 ? "not-allowed" : "pointer",
                    opacity: page <= 1 ? .55 : 1,
                  }}
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <span style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6, border: "var(--idea-hairline)",
                    background: "var(--idea-surface)", color: page >= totalPages ? "var(--idea-text-faint)" : "var(--idea-text)",
                    borderRadius: "var(--idea-radius-full)", padding: "8px 13px", cursor: page >= totalPages ? "not-allowed" : "pointer",
                    opacity: page >= totalPages ? .55 : 1,
                  }}
                >
                  Next <ChevronRight size={15} />
                </button>
              </nav>
            )}
          </div>
        </div>
      </Container>
      <style>{`
        .idea-products-grid{
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:20px;
          grid-auto-rows:1fr;
          align-items:stretch;
        }
        .idea-products-grid > .idea-product-card{ height:100%; min-width:0; }
        @media (max-width: 1160px){
          .idea-products-grid{ grid-template-columns:repeat(3,minmax(0,1fr)); }
        }
        @media (max-width: 860px){
          .idea-gallery-grid{ grid-template-columns: 1fr !important; }
          .idea-filter-toolbar{ display: flex !important; }
          .idea-filter-scrim{ display: block !important; }
          .idea-filters-panel{
            position: fixed !important; inset-block: 0; inset-inline-start: 0; z-index: 61;
            width: min(88vw, 360px); max-width: 360px; border-radius: 0 !important;
            overflow-y: auto; top: 0 !important; transform: translateX(-100%);
            transition: transform .28s ease; box-shadow: var(--idea-shadow-drawer);
          }
          [dir="rtl"] .idea-filters-panel{ inset-inline-start: auto; inset-inline-end: 0; transform: translateX(100%); }
          .idea-filters-panel.is-open{ transform: translateX(0); }
          .idea-filters-panel:not(.is-open){
            transform: translate3d(calc(-100% - 2px), 0, 0) !important;
            visibility: hidden; pointer-events: none;
          }
          [dir="rtl"] .idea-filters-panel:not(.is-open){ transform: translate3d(calc(100% + 2px), 0, 0) !important; }
          .idea-filters-panel.is-open{ visibility: visible; }
          .idea-filter-close, .idea-filter-show{ display: block !important; }
          .idea-products-grid{ grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
        }
        @media (max-width: 560px){
          .idea-products-grid{ grid-template-columns:1fr; }
        }
      `}</style>
    </Section>
  );
}
