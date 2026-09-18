import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type { CollectionSlug, Product } from "../data/types";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { COLLECTIONS } from "../data/catalog";
import { ProductCard } from "../components/ProductCard";
import { Chip, Container, Section } from "../components/ui";
import { SlidersHorizontal, X } from "lucide-react";

function uniq<T>(arr: (T | undefined)[]): T[] {
  return [...new Set(arr.filter(Boolean) as T[])];
}

export function Products({ fixedCollection }: { fixedCollection?: CollectionSlug }) {
  const { t, locale } = useI18n();
  const { products } = useStore();
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();

  const scope = useMemo(
    () => (fixedCollection ? products.filter((p) => p.collection === fixedCollection) : products),
    [products, fixedCollection]
  );

  // Seed filters from the hero search panel (?color=&size=&usage=&finish=).
  const [finish, setFinish] = useState<string | null>(params.get("finish"));
  const [size, setSize] = useState<string | null>(params.get("size"));
  const [usage, setUsage] = useState<string | null>(params.get("usage"));
  const [color, setColor] = useState<string | null>(params.get("color"));

  const [brand, setBrand] = useState<string | null>(null);
  const [material, setMaterial] = useState<string | null>(null);
  const [series, setSeries] = useState<string | null>(null);

  // Only build filter groups from values that actually exist (no empty filters).
  const facets = useMemo(() => ({
    brand: uniq(scope.map((p) => p.brand)),
    material: uniq(scope.map((p) => p.material)),
    series: uniq(scope.map((p) => p.series)),
    finish: uniq(scope.map((p) => p.finish)),
    size: uniq(scope.flatMap((p) => p.sizes.map((s) => s.label))),
    usage: uniq(scope.flatMap((p) => p.usage ?? [])),
    color: uniq(scope.flatMap((p) => p.colors ?? [])),
  }), [scope]);

  const matches = (p: Product) => {
    if (brand && p.brand !== brand) return false;
    if (material && p.material !== material) return false;
    if (series && p.series !== series) return false;
    if (finish && p.finish !== finish) return false;
    if (size && !p.sizes.some((s) => s.label === size)) return false;
    if (usage && !(p.usage ?? []).includes(usage)) return false;
    if (color && !(p.colors ?? []).includes(color)) return false;
    if (q) {
      const hay = [p.name[locale], p.name.en, p.brand, p.model, p.code, p.collection, p.origin, p.description, p.material, p.surface, p.series, p.finish, ...(p.usage ?? []), ...(p.colors ?? []), ...p.sizes.map((s) => s.label)]
        .join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  };

  const results = scope.filter(matches);
  const activeCount = [finish, size, usage, color, brand, material, series].filter(Boolean).length;
  const [mobileOpen, setMobileOpen] = useState(false);
  const clear = () => { setFinish(null); setSize(null); setUsage(null); setColor(null); setBrand(null); setMaterial(null); setSeries(null); };

  const meta = fixedCollection ? COLLECTIONS.find((c) => c.slug === fixedCollection) : null;
  const catalogueSummary = locale === "ar" ? `${scope.length} منتجًا` : locale === "fr" ? `${scope.length} produits` : `${scope.length} products`;

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

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "var(--idea-space-6)", alignItems: "start" }} className="idea-gallery-grid">
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
            {group(t("filters.finish"), facets.finish, finish, setFinish)}
            {group(t("filters.size"), facets.size, size, setSize)}
            {group(t("label.usage"), facets.usage, usage, setUsage)}
            {group(locale === "ar" ? "الألوان" : locale === "fr" ? "Couleurs" : "Colors", facets.color, color, setColor)}
            {group(locale === "ar" ? "الماركة" : "Brand", facets.brand, brand, setBrand)}
            {group(locale === "ar" ? "الخامة" : "Material", facets.material, material, setMaterial)}
            {group(locale === "ar" ? "المجموعة" : "Collection", facets.series, series, setSeries)}
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
            <div style={{ color: "var(--idea-text-muted)", marginBottom: "var(--idea-space-4)", fontSize: "var(--idea-text-sm)" }}>
              {results.length} {t("label.results")}
            </div>
            {results.length === 0 ? (
              <div style={{ padding: "var(--idea-space-8)", textAlign: "center", border: "1px dashed var(--idea-border)", borderRadius: "var(--idea-radius-lg)", color: "var(--idea-text-muted)", lineHeight: 1.7 }}>
                {t("empty.products")}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--idea-space-5)" }}>
                {results.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </Container>
      <style>{`
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
        }
      `}</style>
    </Section>
  );
}
