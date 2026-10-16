import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type { CollectionSlug, Product } from "../data/types";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { COLLECTIONS } from "../data/catalog";
import { ART_CERAMIC_CATALOGUE } from "../data/artceramicImport";
import { ProductCard } from "../components/ProductCard";
import { Chip, Container, Section } from "../components/ui";
import "../components/Discovery.css";
import { isLargeFormat, isOutdoor20mm, matchesApplication, isColourLabel, isUsageLabel } from "../data/discovery";
import { SlidersHorizontal, X } from "lucide-react";

function uniq<T>(arr: (T | undefined)[]): T[] {
  return [...new Set(arr.filter(Boolean) as T[])];
}

export function Products({ fixedCollection }: { fixedCollection?: CollectionSlug }) {
  const { t, locale } = useI18n();
  const { products } = useStore();
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();

  const material = params.get("material");
  const category = fixedCollection ?? params.get("category");
  const format = params.get("format");
  const scope = useMemo(
    () => products.filter((p) => {
      if (category && p.collection !== category) return false;
      if (format === "large" && !isLargeFormat(p)) return false;
      if (format === "outdoor20" && !isOutdoor20mm(p)) return false;
      if (material === "marble") return p.texture?.toLowerCase() === "marble" || p.type?.toLowerCase() === "marble";
      if (material === "tiles") return p.collection === "ceramics" || p.collection === "porcelain";
      return true;
    }),
    [products, category, material, format]
  );

  const finish = params.get("finish");
  const size = params.get("size");
  const usage = params.get("usage");
  const color = params.get("color");
  const application = params.get("application");
  const setFilter = (key: string, value: string | null) => setParams(old => { const next = new URLSearchParams(old); if(value) next.set(key,value); else next.delete(key); return next; });
  const setFinish = (v:string|null) => setFilter("finish",v);
  const setSize = (v:string|null) => setFilter("size",v);
  const setUsage = (v:string|null) => setFilter("usage",v);
  const setColor = (v:string|null) => setFilter("color",v);

  // Only build filter groups from values that actually exist (no empty filters).
  const facets = useMemo(() => ({
    application: uniq(scope.map(p => p.application)),
    finish: uniq(scope.map((p) => p.finish)),
    size: uniq(scope.flatMap((p) => p.sizes.map((s) => s.label))),
    usage: uniq(scope.flatMap((p) => p.usage ?? []).filter(isUsageLabel)),
    color: uniq(scope.flatMap((p) => p.colors ?? []).filter(isColourLabel)),
  }), [scope]);

  const matches = (p: Product) => {
    if (application && !matchesApplication(p, application)) return false;
    if (finish && p.finish !== finish) return false;
    if (size && !p.sizes.some((s) => s.label === size)) return false;
    if (usage && !(p.usage ?? []).includes(usage)) return false;
    if (color && !(p.colors ?? []).includes(color)) return false;
    if (q) {
      const hay = [p.name[locale], p.name.en, p.brand, p.model, p.code, p.collection, p.origin, ...(p.colors ?? []), ...p.sizes.map((s) => s.label)]
        .join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  };

  const sort = params.get("sort") ?? "source";
  const results = scope.filter(matches);
  if (sort !== "source") results.sort((a,b) => sort === "za" ? b.name[locale].localeCompare(a.name[locale]) : a.name[locale].localeCompare(b.name[locale]));
  const activeCount = [application, finish, size, usage, color].filter(Boolean).length;
  const [mobileOpen, setMobileOpen] = useState(false);
  const clear = () => setParams(old => {const next = new URLSearchParams(old); ["finish","size","usage","color","application","q"].forEach(k=>next.delete(k)); return next;});

  const meta = category ? COLLECTIONS.find((c) => c.slug === category) : null;
  const formatTitle = format === "large" ? { en:"Large-format tiles", ar:"بلاط بمقاسات كبيرة", fr:"Carrelage grand format" }[locale] : format === "outdoor20" ? {en:"20 mm outdoor tiles",ar:"بلاط خارجي 20 مم",fr:"Carrelage extérieur 20 mm"}[locale] : null;
  const materialTitle = material === "marble"
    ? { en: "Marble surfaces", ar: "أسطح رخامية", fr: "Surfaces marbrées" }[locale]
    : material === "tiles" ? { en: "Tiles", ar: "بلاط", fr: "Carrelage" }[locale] : null;
  const catalogueSummary = locale === "ar"
    ? `${products.length} منتجًا في الكتالوج الحالي · ${ART_CERAMIC_CATALOGUE.totalImages} مرجع صورة لـ Art Ceramic`
    : locale === "fr"
      ? `${products.length} produits dans le catalogue actuel · ${ART_CERAMIC_CATALOGUE.totalImages} références d’images Art Ceramic`
      : `${products.length} products in the current catalogue · ${ART_CERAMIC_CATALOGUE.totalImages} Art Ceramic gallery image references`;

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
          <div className="idea-eyebrow">{locale === "ar" ? "كتالوج المنتجات" : locale === "fr" ? "Catalogue produits" : "Product catalogue"}</div>
          <h1 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)", margin: "var(--idea-space-2) 0 0" }}>
            {formatTitle ?? (meta ? meta.title[locale] : materialTitle ?? t("nav.products"))}
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
            {group(locale === "ar" ? "الاستخدام" : locale === "fr" ? "Application" : "Application", facets.application, application, v => setFilter("application",v))}
            {group(t("filters.finish"), facets.finish, finish, setFinish)}
            {group(t("filters.size"), facets.size, size, setSize)}
            {group(t("label.usage"), facets.usage, usage, setUsage)}
            {group(locale === "ar" ? "اللون" : locale === "fr" ? "Couleur" : "Colour", facets.color, color, setColor)}
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
          <div style={{minWidth:0}}>
            <form onSubmit={e=>{e.preventDefault(); const data = new FormData(e.currentTarget); setFilter("q", String(data.get("q")??"").trim());}} style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:24}}>
              <input key={q} name="q" defaultValue={q} aria-label={locale === "ar" ? "البحث بالاسم" : locale === "fr" ? "Recherche par nom" : "Search by name"} placeholder={locale === "ar" ? "اسم المنتج أو الكود" : locale === "fr" ? "Nom ou référence" : "Product name or code"} style={{flex:"1 1 180px",minWidth:0,padding:"10px 12px",background:"var(--idea-surface)",border:"var(--idea-hairline)",color:"var(--idea-text)",borderRadius:6}}/>
              <button type="submit" className="idea-discovery-submit">{locale === "ar" ? "ابحث" : locale === "fr" ? "Rechercher" : "Search"}</button>
              <select aria-label={locale === "ar" ? "ترتيب المنتجات" : locale === "fr" ? "Trier les produits" : "Sort products"} value={sort} onChange={e=>setFilter("sort",e.target.value)} style={{padding:"10px 12px",background:"var(--idea-surface)",border:"var(--idea-hairline)",color:"var(--idea-text)",borderRadius:6}}><option value="source">{locale === "ar" ? "ترتيب الكتالوج" : locale === "fr" ? "Ordre du catalogue" : "Catalogue order"}</option><option value="az">A → Z</option><option value="za">Z → A</option></select>
            </form>
            <div style={{ color: "var(--idea-text-muted)", marginBottom: "var(--idea-space-4)", fontSize: "var(--idea-text-sm)" }}>
              {results.length} {t("label.results")}
            </div>
            {results.length === 0 ? (
              <div style={{ padding: "var(--idea-space-8)", textAlign: "center", border: "1px dashed var(--idea-border)", borderRadius: "var(--idea-radius-lg)", color: "var(--idea-text-muted)", lineHeight: 1.7 }}>
                {t("empty.products")}
                {(category === "porcelain" || material === "marble" || format) && <p>{locale === "ar" ? "لا توجد منتجات موثقة بهذه المواصفات في البيانات الحالية. لا يعني ذلك تأكيد عدم توفرها لدى الموردين." : locale === "fr" ? "Aucun produit documenté avec ces spécifications. Cela ne confirme pas l’absence de stock chez les fournisseurs." : "No products are documented with these specifications in the current data. Supplier stock has not been confirmed."}</p>}
                <button onClick={clear} style={{color:"var(--idea-gold-bright)",background:"none",border:0,cursor:"pointer",marginTop:16}}>{t("filters.clear")}</button>
              </div>
            ) : (
              <div className="idea-product-results" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "var(--idea-space-5)" }}>
                {results.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </Container>
      <style>{`
        @media (max-width: 1200px){ .idea-product-results {grid-template-columns:repeat(2,minmax(0,1fr)) !important;} }
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
