import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { Heart, GitCompare, Sparkles, FileText } from "lucide-react";
import type { CollectionSlug, Product } from "../data/types";
import { COLLECTIONS } from "../data/catalog";
import { isColourLabel, matchesApplication } from "../data/discovery";
import { ideaInternalCode, productMaker } from "../data/ideaProductIdentity";
import { distinctStorefrontProducts } from "../data/storefrontDistinct";
import { localMaterialFace } from "../data/localMaterialFace";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { Container, Section } from "../components/ui";
import "./MaterialCatalogue.css";

const PAGE_SIZE = 20;
const SURFACE_TABS: { key: "all" | "tiles" | CollectionSlug; label: Record<"en" | "ar" | "fr", string> }[] = [
  { key: "all", label: { en: "All materials", ar: "كل الخامات", fr: "Tous les matériaux" } },
  { key: "tiles", label: { en: "Tiles", ar: "بلاط", fr: "Carrelage" } },
  { key: "ceramics", label: { en: "Ceramics", ar: "سيراميك", fr: "Céramiques" } },
  { key: "porcelain", label: { en: "Porcelain", ar: "بورسلين", fr: "Porcelaine" } },
  { key: "marble", label: { en: "Marble", ar: "رخام", fr: "Marbre" } },
];

function unique(values: (string | undefined)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export function MaterialCatalogue() {
  const { products, isFavorite, toggleFavorite, toggleCompare, compare, addToQuote } = useStore();
  const { locale, t } = useI18n();
  const [params, setParams] = useSearchParams();
  const query = (params.get("q") ?? "").trim().toLowerCase();
  const category = params.get("category");
  const material = params.get("material");
  const finish = params.get("finish");
  const size = params.get("size");
  const color = params.get("color");
  const application = params.get("application");
  const type = params.get("type");
  const sort = params.get("sort") ?? "source";

  const baseProducts = useMemo(() => products.filter((product) => {
    if (category && product.collection !== category) return false;
    if (material === "tiles" && !["ceramics", "porcelain"].includes(product.collection)) return false;
    if (material === "marble" && product.texture?.toLowerCase() !== "marble" && product.type?.toLowerCase() !== "marble") return false;
    return true;
  }), [products, category, material]);

  const facets = useMemo(() => ({
    finishes: unique(baseProducts.map((product) => product.finish)),
    sizes: unique(baseProducts.flatMap((product) => product.sizes.map((item) => item.label))),
    colors: unique(baseProducts.flatMap((product) => product.colors ?? []).filter(isColourLabel)),
    applications: unique(baseProducts.map((product) => product.application)),
    types: unique(baseProducts.map((product) => product.type)),
  }), [baseProducts]);

  const results = useMemo(() => {
    const filtered = baseProducts.filter((product) => {
      if (application && !matchesApplication(product, application)) return false;
      if (finish && product.finish !== finish) return false;
      if (size && !product.sizes.some((item) => item.label === size)) return false;
      if (color && !(product.colors ?? []).includes(color)) return false;
      if (type && product.type !== type) return false;
      if (query) {
        const searchable = [product.name[locale], product.name.en, product.brand, product.manufacturer, product.model, product.code, product.collection, product.origin, ...(product.colors ?? []), ...product.sizes.map((item) => item.label)].join(" ").toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      return true;
    });
    const distinct = distinctStorefrontProducts(filtered);
    return sort === "az"
      ? [...distinct].sort((a, b) => a.name[locale].localeCompare(b.name[locale]))
      : sort === "za"
        ? [...distinct].sort((a, b) => b.name[locale].localeCompare(a.name[locale]))
        : distinct;
  }, [baseProducts, application, finish, size, color, type, query, locale, sort]);

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const rawPage = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Math.min(Math.max(Number.isFinite(rawPage) ? rawPage : 1, 1), pageCount);
  const visibleProducts = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeTab = material === "tiles" ? "tiles" : category ?? (material === "marble" ? "marble" : "all");
  const availableTabs = SURFACE_TABS.filter(({ key }) => {
    if (key === "all") return true;
    if (key === "tiles") return products.some((product) => ["ceramics", "porcelain"].includes(product.collection));
    if (key === "marble") return products.some((product) => product.texture?.toLowerCase() === "marble" || product.type?.toLowerCase() === "marble");
    return products.some((product) => product.collection === key);
  });
  const title = category
    ? COLLECTIONS.find((item) => item.slug === category)?.title[locale]
    : material === "tiles"
      ? SURFACE_TABS[1].label[locale]
      : material === "marble"
        ? SURFACE_TABS[4].label[locale]
        : t("nav.products");

  const updateFilter = (key: string, value: string | null) => setParams((current) => {
    const next = new URLSearchParams(current);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    return next;
  });

  const changeTab = (key: string) => setParams((current) => {
    const next = new URLSearchParams(current);
    ["category", "material", "finish", "size", "color", "application", "type", "page"].forEach((filter) => next.delete(filter));
    if (key === "tiles") next.set("material", "tiles");
    else if (key === "marble") next.set("material", "marble");
    else if (key !== "all") next.set("category", key);
    return next;
  });

  const clearFilters = () => setParams((current) => {
    const next = new URLSearchParams(current);
    ["category", "material", "finish", "size", "color", "application", "type", "q", "page"].forEach((key) => next.delete(key));
    return next;
  });

  const filterSelect = (label: string, key: string, value: string | null, values: string[]) => values.length > 1 && (
    <label className="idea-material-filter" key={key}>
      <span>{value ?? label}</span>
      <select aria-label={label} value={value ?? ""} onChange={(event) => updateFilter(key, event.target.value || null)}>
        <option value="">{label}</option>
        {values.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  );

  return (
    <Section style={{ paddingTop: "var(--idea-space-7)", background: "var(--idea-bg)" }}>
      <Container className="idea-material-catalogue">
        <header className="idea-material-heading">
          <div className="idea-material-breadcrumb">
            <Link to="/">IDEA</Link><span aria-hidden="true">/</span><span>{locale === "ar" ? "المواد" : locale === "fr" ? "MATÉRIAUX" : "MATERIALS"}</span>
          </div>
          <div className="idea-material-title-row">
            <div>
              <p className="idea-eyebrow">{locale === "ar" ? "اكتشف خاماتنا" : locale === "fr" ? "DÉCOUVREZ NOS MATÉRIAUX" : "EXPLORE OUR MATERIALS"}</p>
              <h1 className="idea-display">{title}</h1>
              <p className="idea-material-subtitle">
                {locale === "ar" ? "تصفّح خامات موثقة من كتالوج IDEA واختر الأنسب لمساحتك." : locale === "fr" ? "Parcourez les matériaux du catalogue IDEA et trouvez la finition idéale." : "Browse materials from the IDEA catalogue and find the right finish for your space."}
              </p>
            </div>
            <span className="idea-material-count">{results.length.toLocaleString(locale)} {locale === "ar" ? "خامة" : locale === "fr" ? "matériaux" : "materials"}</span>
          </div>
        </header>

        <nav className="idea-material-tabs" aria-label={locale === "ar" ? "فئات الخامات" : locale === "fr" ? "Catégories de matériaux" : "Material categories"}>
          {availableTabs.map((tab) => (
            <button key={tab.key} type="button" className={activeTab === tab.key ? "is-active" : ""} aria-pressed={activeTab === tab.key} onClick={() => changeTab(tab.key)}>
              {tab.label[locale]}
            </button>
          ))}
        </nav>

        <div className="idea-material-toolbar">
          <div className="idea-material-filter-row">
            {filterSelect(locale === "ar" ? "الخامة" : locale === "fr" ? "Matériau" : "Material", "type", type, facets.types)}
            {filterSelect(t("filters.finish"), "finish", finish, facets.finishes)}
            {filterSelect(locale === "ar" ? "الاستخدام" : locale === "fr" ? "Application" : "Application", "application", application, facets.applications)}
            {filterSelect(t("filters.size"), "size", size, facets.sizes)}
            {filterSelect(locale === "ar" ? "اللون" : locale === "fr" ? "Couleur" : "Colour", "color", color, facets.colors)}
            <button type="button" className="idea-material-reset" onClick={clearFilters}>{locale === "ar" ? "مسح الفلاتر" : locale === "fr" ? "Réinitialiser" : "Reset filters"}</button>
          </div>
          <form className="idea-material-search" onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            updateFilter("q", String(formData.get("q") ?? "").trim() || null);
          }}>
            <input key={query} type="search" name="q" defaultValue={query} aria-label={locale === "ar" ? "ابحث عن خامة" : locale === "fr" ? "Rechercher un matériau" : "Search materials"} placeholder={locale === "ar" ? "ابحث بالاسم أو البراند أو الكود" : locale === "fr" ? "Nom, marque ou référence" : "Search by name, brand or code"} />
            <button type="submit">{locale === "ar" ? "بحث" : locale === "fr" ? "Rechercher" : "Search"}</button>
            <label className="idea-material-sort"><span className="sr-only">{locale === "ar" ? "ترتيب المنتجات" : locale === "fr" ? "Trier les produits" : "Sort materials"}</span>
              <select value={sort} onChange={(event) => updateFilter("sort", event.target.value)}>
                <option value="source">{locale === "ar" ? "ترتيب الكتالوج" : locale === "fr" ? "Ordre du catalogue" : "Catalogue order"}</option>
                <option value="az">A–Z</option><option value="za">Z–A</option>
              </select>
            </label>
          </form>
        </div>

        {query && <p className="idea-material-query">{locale === "ar" ? "نتائج البحث عن" : locale === "fr" ? "Résultats pour" : "Results for"} “{query}”</p>}
        {results.length === 0 ? (
          <div className="idea-material-empty">
            <h2>{locale === "ar" ? "لم نعثر على خامات مطابقة" : locale === "fr" ? "Aucun matériau correspondant" : "No matching materials"}</h2>
            <p>{locale === "ar" ? "جرّب تغيير البحث أو مسح بعض الفلاتر." : locale === "fr" ? "Essayez une autre recherche ou réinitialisez vos filtres." : "Try another search or reset your filters."}</p>
            <button type="button" onClick={clearFilters}>{t("filters.clear")}</button>
          </div>
        ) : (
          <>
            <div className="idea-material-resultline" aria-live="polite">
              <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, results.length)} {locale === "ar" ? `من ${results.length}` : locale === "fr" ? `sur ${results.length}` : `of ${results.length}`}</span>
            </div>
            <div className="idea-material-grid">
              {visibleProducts.map((product) => <MaterialCard key={product.id} product={product} locale={locale} t={t} isFavorite={isFavorite} toggleFavorite={toggleFavorite} toggleCompare={toggleCompare} compare={compare} addToQuote={addToQuote} />)}
            </div>
            {pageCount > 1 && (
              <nav className="idea-material-pagination" aria-label={locale === "ar" ? "صفحات الخامات" : locale === "fr" ? "Pages des matériaux" : "Material pages"}>
                <button type="button" disabled={page <= 1} onClick={() => updateFilter("page", String(page - 1))}>{locale === "ar" ? "السابق" : locale === "fr" ? "Précédent" : "Previous"}</button>
                <span>{locale === "ar" ? `صفحة ${page} من ${pageCount}` : locale === "fr" ? `Page ${page} sur ${pageCount}` : `Page ${page} of ${pageCount}`}</span>
                <button type="button" disabled={page >= pageCount} onClick={() => updateFilter("page", String(page + 1))}>{locale === "ar" ? "التالي" : locale === "fr" ? "Suivant" : "Next"}</button>
              </nav>
            )}
          </>
        )}
      </Container>
    </Section>
  );
}

type MaterialCardProps = {
  product: Product;
  locale: "en" | "ar" | "fr";
  t: (key: string) => string;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  toggleCompare: (id: string) => void;
  compare: string[];
  addToQuote: (id: string, unit: "sqm" | "pieces") => void;
};

function MaterialCard({ product, locale, t, isFavorite, toggleFavorite, toggleCompare, compare, addToQuote }: MaterialCardProps) {
  const maker = productMaker(product, locale);
  const image = localMaterialFace(product.id) || product.source?.original?.tiles?.[0] || product.image;
  const unit = ["ceramics", "porcelain", "marble"].includes(product.collection) ? "sqm" : "pieces";
  const favorite = isFavorite(product.id);
  const inCompare = compare.includes(product.id);

  return (
    <article className="idea-material-card">
      <div className="idea-material-card-media">
        <Link to={`/product/${product.slug}`} aria-label={`${product.name[locale]} — ${t("action.viewDetails")}`}>
          <img src={image} alt={product.name[locale]} loading="lazy" decoding="async" />
        </Link>
        <div className="idea-material-card-actions">
          <button type="button" aria-label={t("action.favorite")} aria-pressed={favorite} onClick={() => toggleFavorite(product.id)}><Heart size={16} fill={favorite ? "currentColor" : "none"} /></button>
          <button type="button" aria-label={t("action.compare")} aria-pressed={inCompare} onClick={() => toggleCompare(product.id)}><GitCompare size={16} /></button>
        </div>
        {product.finish && <span className="idea-material-finish">{product.finish}</span>}
      </div>
      <div className="idea-material-card-body">
        <div className="idea-material-maker">
          <span>{maker.verified ? maker.value : product.brand}</span>
          <small>{maker.verified ? maker.label : (locale === "ar" ? "العلامة التجارية · المصنع قيد التوثيق" : locale === "fr" ? "Marque · fabricant à vérifier" : "Brand · maker unverified")}</small>
        </div>
        <Link className="idea-material-name" to={`/product/${product.slug}`}>{product.name[locale]}</Link>
        <div className="idea-material-meta">
          {product.sizes[0] && <span>{product.sizes[0].label}</span>}
          <span dir="ltr">{ideaInternalCode(product)}</span>
        </div>
        <div className="idea-material-card-footer">
          <span>{t("price.hidden")}</span>
          <button type="button" className="idea-material-quote" onClick={() => addToQuote(product.id, unit)}><FileText size={14} />{t("action.requestPrice")}</button>
        </div>
        <Link className="idea-material-visualize" to={`/ai-room-visualizer?product=${encodeURIComponent(product.id)}`}><Sparkles size={15} />{locale === "ar" ? "جرّبه في شقتك" : locale === "fr" ? "Essayez-le chez vous" : "Try it in your home"}</Link>
      </div>
    </article>
  );
}
