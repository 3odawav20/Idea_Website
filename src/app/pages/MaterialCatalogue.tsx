import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { Heart, GitCompare, Sparkles, FileText, ChevronDown, ArrowRight } from "lucide-react";
import type { CollectionSlug, Product } from "../data/types";
import { COLLECTIONS } from "../data/catalog";
import { isColourLabel, isUsageLabel, isLargeFormat, isOutdoor20mm, matchesApplication } from "../data/discovery";
import { ideaInternalCode, productMaker } from "../data/ideaProductIdentity";
import { distinctStorefrontProducts } from "../data/storefrontDistinct";
import { localMaterialFace } from "../data/localMaterialFace";
import { MaterialSphere } from "../components/MaterialSphere";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { Container, Section } from "../components/ui";
import "./MaterialCatalogue.css";

const PAGE_SIZE = 36;
const FEATURED_PRODUCT_IDS = ["484", "546", "39", "492"];
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
  const texture = params.get("texture");
  const brand = params.get("brand");
  const usage = params.get("usage");
  const format = params.get("format");
  const activeFilters = [type, texture, brand, finish, application, size, usage, color, format].filter(Boolean).length;
  const sort = params.get("sort") ?? "source";

  const baseProducts = useMemo(() => products.filter((product) => {
    if (category && product.collection !== category) return false;
    if (format === "large" && !isLargeFormat(product)) return false;
    if (format === "outdoor20" && !isOutdoor20mm(product)) return false;
    if (material === "tiles" && !["ceramics", "porcelain"].includes(product.collection)) return false;
    if (material === "marble" && product.texture?.toLowerCase() !== "marble" && product.type?.toLowerCase() !== "marble") return false;
    return true;
  }), [products, category, material, format]);

  const facets = useMemo(() => ({
    finishes: unique(baseProducts.map((product) => product.finish)),
    sizes: unique(baseProducts.flatMap((product) => product.sizes.map((item) => item.label))),
    colors: unique(baseProducts.flatMap((product) => product.colors ?? []).filter(isColourLabel)),
    applications: unique(baseProducts.map((product) => product.application)),
    types: unique(baseProducts.map((product) => product.type)),
    textures: unique(baseProducts.map((product) => product.texture)),
    brands: unique(baseProducts.map((product) => product.brand)),
    usages: unique(baseProducts.flatMap((product) => product.usage ?? []).filter(isUsageLabel)),
  }), [baseProducts]);

  const results = useMemo(() => {
    const filtered = baseProducts.filter((product) => {
      if (application && !matchesApplication(product, application)) return false;
      if (finish && product.finish !== finish) return false;
      if (size && !product.sizes.some((item) => item.label === size)) return false;
      if (color && !(product.colors ?? []).includes(color)) return false;
      if (type && product.type !== type) return false;
      if (texture && product.texture !== texture) return false;
      if (brand && product.brand !== brand) return false;
      if (usage && !(product.usage ?? []).includes(usage)) return false;
      if (query) {
        const searchable = [product.name[locale], product.name.en, product.brand, product.manufacturer, product.model, product.code, ideaInternalCode(product), product.collection, product.origin, ...(product.colors ?? []), ...product.sizes.map((item) => item.label)].join(" ").toLowerCase();
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
  }, [baseProducts, application, finish, size, color, type, texture, brand, usage, query, locale, sort]);

  const featuredProducts = useMemo(() => {
    const byId = new Map(products.map((product) => [product.id, product] as const));
    const curated = FEATURED_PRODUCT_IDS
      .map((id) => byId.get(id))
      .filter((product): product is Product => product !== undefined);
    return curated.length === FEATURED_PRODUCT_IDS.length
      ? curated
      : distinctStorefrontProducts(products).slice(0, 4);
  }, [products]);

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
  const title = format === "large" ? (locale === "ar" ? "بلاط كبير المقاس" : locale === "fr" ? "Grand format" : "Large-format tiles") : format === "outdoor20" ? (locale === "ar" ? "بلاط خارجي 20 مم" : locale === "fr" ? "Carrelage extérieur 20 mm" : "20 mm outdoor tiles") : category
    ? COLLECTIONS.find((item) => item.slug === category)?.title[locale]
    : material === "tiles"
      ? SURFACE_TABS[1].label[locale]
      : material === "marble"
        ? SURFACE_TABS[4].label[locale]
        : t("nav.products");

  const featuredCopy = {
    en: {
      eyebrow: "FEATURED MATERIALS",
      title: "Curated Materials for Inspired Spaces",
      body: "A handpicked selection of standout surfaces from our collection.",
      cta: "Explore Featured",
      catalogueEyebrow: "PRODUCT CATALOGUE",
      catalogueTitle: "Explore Our Material Collection",
      catalogueBody: "Browse the complete range of surfaces for your next project.",
    },
    ar: {
      eyebrow: "خامات مختارة",
      title: "خامات مختارة لمساحات ملهمة",
      body: "مجموعة منتقاة من أبرز الخامات في كتالوجنا.",
      cta: "استكشف الخامات المختارة",
      catalogueEyebrow: "كتالوج المنتجات",
      catalogueTitle: "اكتشف مجموعة الخامات",
      catalogueBody: "تصفح المجموعة الكاملة من الخامات لمشروعك القادم.",
    },
    fr: {
      eyebrow: "MATÉRIAUX À LA UNE",
      title: "Des matières choisies pour des espaces inspirants",
      body: "Une sélection soignée de surfaces remarquables de notre collection.",
      cta: "Explorer la sélection",
      catalogueEyebrow: "CATALOGUE PRODUITS",
      catalogueTitle: "Explorez notre collection de matériaux",
      catalogueBody: "Parcourez toute la gamme de surfaces pour votre prochain projet.",
    },
  }[locale];

  const updateFilter = (key: string, value: string | null) => setParams((current) => {
    const next = new URLSearchParams(current);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    return next;
  });

  const changeTab = (key: string) => setParams((current) => {
    const next = new URLSearchParams(current);
    ["category", "material", "format", "finish", "size", "color", "application", "type", "texture", "brand", "usage", "page"].forEach((filter) => next.delete(filter));
    if (key === "tiles") next.set("material", "tiles");
    else if (key === "marble") next.set("material", "marble");
    else if (key !== "all") next.set("category", key);
    return next;
  });

  const clearFilters = () => setParams((current) => {
    const next = new URLSearchParams(current);
    ["finish", "size", "color", "application", "type", "texture", "brand", "usage", "format", "q", "page"].forEach((key) => next.delete(key));
    return next;
  });

  const filterGroup = (label: string, key: string, value: string | null, values: string[]) => (values.length > 0 || value) && (
    <details className="idea-material-facet" key={key}>
      <summary>{label}<ChevronDown size={15} aria-hidden="true" /></summary>
      <div className="idea-material-facet-options">
        {[...new Set([...values, ...(value ? [value] : [])])].map((item) => (
          <label key={item} className="idea-material-option">
            <input type="checkbox" checked={value === item} onChange={() => updateFilter(key, value === item ? null : item)} />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </details>
  );

  return (
    <Section style={{ paddingTop: "var(--idea-space-7)", background: "var(--idea-bg)" }}>
      <Container className="idea-material-catalogue" style={{ maxWidth: 1800 }}>
        {featuredProducts.length > 0 && <section className="idea-material-featured" aria-labelledby="idea-material-featured-title">
          <div className="idea-material-featured-copy">
            <p className="idea-material-featured-eyebrow">{featuredCopy.eyebrow}</p>
            <h2 id="idea-material-featured-title">{featuredCopy.title}</h2>
            <p className="idea-material-featured-description">{featuredCopy.body}</p>
            <a className="idea-material-featured-cta" href="#idea-material-catalogue-grid">
              {featuredCopy.cta}<ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="idea-material-featured-grid">
            {featuredProducts.map((product) => {
              const maker = productMaker(product, locale);
              const image = localMaterialFace(product.id) || product.source?.original?.tiles?.[0] || product.image;
              const unit = ["ceramics", "porcelain", "marble"].includes(product.collection) ? "sqm" : "pieces";
              const rawFinish = product.finish || product.texture || "";
              const finishLabel = rawFinish.toLowerCase() === "matt"
                ? (locale === "ar" ? "مطفي" : locale === "fr" ? "Mat" : "Matte")
                : rawFinish.toLowerCase() === "glossy"
                  ? (locale === "ar" ? "لامع" : locale === "fr" ? "Brillant" : "Glossy")
                  : rawFinish;
              return (
                <article className="idea-material-featured-card" key={product.id}>
                  <Link
                    className="idea-material-featured-visual"
                    to={"/product/" + product.slug}
                    aria-label={product.name[locale]}
                  >
                    <MaterialSphere
                      className="idea-material-featured-orb"
                      src={image}
                      alt={product.name[locale]}
                      loading="eager"
                    />
                  </Link>
                  <div className="idea-material-featured-card-body">
                    {finishLabel && <span className="idea-material-featured-finish">{finishLabel}</span>}
                    <div className="idea-material-featured-maker">
                      <strong>{maker.verified ? maker.value : product.brand}</strong>
                      <small>{locale === "ar" ? "العلامة التجارية" : locale === "fr" ? "Marque" : "Brand"}</small>
                    </div>
                    <Link className="idea-material-featured-name" to={"/product/" + product.slug}>
                      {product.name[locale]}
                    </Link>
                    <div className="idea-material-featured-meta">
                      {product.sizes[0] && <span>{product.sizes[0].label}</span>}
                      <code dir="ltr" title={ideaInternalCode(product)}>{ideaInternalCode(product)}</code>
                    </div>
                    <div className="idea-material-featured-actions">
                      <button type="button" onClick={() => addToQuote(product.id, unit)}>
                        <FileText size={14} aria-hidden="true" />{t("action.requestPrice")}
                      </button>
                      <Link to={"/ai-room-visualizer?product=" + encodeURIComponent(product.id)}>
                        <Sparkles size={14} aria-hidden="true" />{locale === "ar" ? "جرّب في AI" : locale === "fr" ? "Essayer en IA" : "Try in AI"}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>}
        <header className="idea-material-heading">
          <div className="idea-material-breadcrumb">
            <Link to="/">IDEA</Link><span aria-hidden="true">/</span><span>{locale === "ar" ? "المواد" : locale === "fr" ? "MATÉRIAUX" : "MATERIALS"}</span>
          </div>
          <div className="idea-material-title-row">
            <div>
              <p className="idea-eyebrow">{!category && !material && !format ? featuredCopy.catalogueEyebrow : (locale === "ar" ? "اكتشف خاماتنا" : locale === "fr" ? "DÉCOUVREZ NOS MATÉRIAUX" : "EXPLORE OUR MATERIALS")}</p>
              <h1 className="idea-display">{!category && !material && !format ? featuredCopy.catalogueTitle : title}</h1>
              <p className="idea-material-subtitle">
                {!category && !material && !format && !query ? featuredCopy.catalogueBody : (locale === "ar" ? "تصفّح خامات موثقة من كتالوج IDEA واختر الأنسب لمساحتك." : locale === "fr" ? "Parcourez les matériaux du catalogue IDEA et trouvez la finition idéale." : "Browse materials from the IDEA catalogue and find the right finish for your space.")}
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

        <div className="idea-material-layout">
          <div className="idea-material-results">
          <div className="idea-material-toolbar">
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
          <div className="idea-material-filter-row" aria-label={locale === "ar" ? "تصفية الخامات" : locale === "fr" ? "Filtrer les matériaux" : "Filter materials"}>
            <span className="idea-material-filter-label">{locale === "ar" ? "تصفية حسب" : locale === "fr" ? "Filtrer par" : "Filter by"}{activeFilters > 0 ? ` · ${activeFilters}` : ""}</span>
            {filterGroup(locale === "ar" ? "العلامة التجارية" : locale === "fr" ? "Marque" : "Brand", "brand", brand, facets.brands)}
            {filterGroup(locale === "ar" ? "الخامة" : locale === "fr" ? "Matériau" : "Material", "type", type, facets.types)}
            {filterGroup(locale === "ar" ? "النقشة" : locale === "fr" ? "Aspect" : "Texture", "texture", texture, facets.textures)}
            {filterGroup(t("filters.finish"), "finish", finish, facets.finishes)}
            {filterGroup(locale === "ar" ? "الاستخدام" : locale === "fr" ? "Application" : "Application", "application", application, facets.applications)}
            {filterGroup(t("filters.size"), "size", size, facets.sizes)}
            {filterGroup(t("label.usage"), "usage", usage, facets.usages)}
            {filterGroup(locale === "ar" ? "اللون" : locale === "fr" ? "Couleur" : "Colour", "color", color, facets.colors)}
            {activeFilters > 0 && <button type="button" className="idea-material-reset" onClick={clearFilters}>{t("filters.clear")}</button>}
          </div>
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
            <div className="idea-material-grid" id="idea-material-catalogue-grid">
              {visibleProducts.map((product) => <MaterialCard key={product.id} product={product} locale={locale} t={t} isFavorite={isFavorite} toggleFavorite={toggleFavorite} toggleCompare={toggleCompare} compare={compare} addToQuote={addToQuote} />)}
            </div>
            {pageCount > 1 && (
              <nav className="idea-material-pagination" aria-label={locale === "ar" ? "صفحات الخامات" : locale === "fr" ? "Pages des matériaux" : "Material pages"}>
                <button type="button" disabled={page <= 1} onClick={() => updateFilter("page", String(page - 1))}>{locale === "ar" ? "السابق" : locale === "fr" ? "Précédent" : "Previous"}</button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).filter(number => number === 1 || number === pageCount || Math.abs(number - page) <= 2).map(number => <button key={number} type="button" aria-current={number === page ? "page" : undefined} aria-label={String(number)} onClick={() => updateFilter("page", String(number))}>{number}</button>)}
                <button type="button" disabled={page >= pageCount} onClick={() => updateFilter("page", String(page + 1))}>{locale === "ar" ? "التالي" : locale === "fr" ? "Suivant" : "Next"}</button>
              </nav>
            )}
          </>
        )}
          </div>
        </div>
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
          <MaterialSphere
            className="idea-material-orb"
            src={image}
            alt={product.name[locale]}
            loading="lazy"
          />
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
          <small>{maker.verified ? maker.label : (locale === "ar" ? "علامة تجارية" : locale === "fr" ? "Marque" : "Brand")}</small>
        </div>
        <Link className="idea-material-name" to={`/product/${product.slug}`} title={product.name[locale]}>
          <span>{product.name[locale]}</span>
        </Link>
        <div className="idea-material-meta">
          {product.sizes[0] && <span>{product.sizes[0].label}</span>}
          <span dir="ltr" title={ideaInternalCode(product)}>{ideaInternalCode(product)}</span>
        </div>
        <div className="idea-material-card-footer">
          <button type="button" className="idea-material-quote" onClick={() => addToQuote(product.id, unit)}><FileText size={14} />{t("action.requestPrice")}</button>
          <Link className="idea-material-visualize" to={`/ai-room-visualizer?product=${encodeURIComponent(product.id)}`}><Sparkles size={15} />{locale === "ar" ? "جرّب الخامة" : locale === "fr" ? "Essayer" : "Try in AI"}</Link>
        </div>
      </div>
    </article>
  );
}