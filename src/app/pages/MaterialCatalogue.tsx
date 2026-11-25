import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Heart,
  GitCompare,
  Sparkles,
  FileText,
  ArrowRight,
  Search,
  Grid2X2,
  List,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { Product } from "../data/types";
import { COLLECTIONS } from "../data/catalog";
import { ideaInternalCode, productMaker } from "../data/ideaProductIdentity";
import { distinctStorefrontProducts } from "../data/storefrontDistinct";
import { localMaterialFace } from "../data/localMaterialFace";
import { MaterialSphere } from "../components/MaterialSphere";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { Container, Section } from "../components/ui";
import { GlareCard } from "@/components/ui/glare-card";
import {
  buildSidebarFacets,
  COLOR_FAMILY_OPTIONS,
  filterCatalogueProduct,
  localizeApplication,
  localizeSurfaceSpec,
  localizeUsage,
  MATERIAL_CATEGORY_OPTIONS,
  matchesMaterialCategory,
  resolveActiveMaterialCategory,
  SURFACE_LOOK_OPTIONS,
  type MaterialCategoryKey,
} from "@/lib/catalogue-filters";
import "./MaterialCatalogue.css";

const PAGE_SIZE = 36;
const FEATURED_PRODUCT_IDS = ["484", "546", "39", "492"];

type CatalogueLocale = "en" | "ar" | "fr";

function localizedFinish(value: string | undefined, locale: CatalogueLocale): string {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "matt" || normalized === "matte") {
    return locale === "ar" ? "مطفي" : locale === "fr" ? "Mat" : "Matte";
  }
  if (normalized === "glossy") {
    return locale === "ar" ? "لامع" : locale === "fr" ? "Brillant" : "Glossy";
  }
  return value ?? "";
}

function brandLabel(locale: CatalogueLocale): string {
  return locale === "ar" ? "العلامة التجارية" : locale === "fr" ? "Marque" : "Brand";
}

function bestPriceLabel(locale: CatalogueLocale): string {
  return locale === "ar"
    ? "اطلب أفضل سعر"
    : locale === "fr"
      ? "Demander le meilleur prix"
      : "Request Best Price";
}

function tryInAiLabel(locale: CatalogueLocale): string {
  return locale === "ar" ? "جرّب في AI" : locale === "fr" ? "Essayer en IA" : "Try in AI";
}

function productSizeLabel(value: string): string {
  return value.replace(/\s*[x×]\s*/gi, " × ").replace(/\s+/g, " ").trim();
}

export function MaterialCatalogue() {
  const { products, isFavorite, toggleFavorite, toggleCompare, compare, addToQuote } = useStore();
  const { locale, t } = useI18n();
  const [params, setParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const query = (params.get("q") ?? "").trim().toLowerCase();
  const category = params.get("category");
  const material = params.get("material");
  const look = params.get("look");
  const surface = params.get("surface");
  const finish = params.get("finish");
  const size = params.get("size");
  const color = params.get("color");
  const application = params.get("application");
  const type = params.get("type");
  const texture = params.get("texture");
  const brand = params.get("brand");
  const usage = params.get("usage");
  const format = params.get("format");
  const sort = params.get("sort") ?? "source";

  const activeMaterial = resolveActiveMaterialCategory(category, material);
  const activeFilters = [
    category,
    material,
    look,
    surface,
    type,
    texture,
    brand,
    finish,
    application,
    size,
    usage,
    color,
    format,
  ].filter(Boolean).length;

  const distinctAllProducts = useMemo(() => distinctStorefrontProducts(products), [products]);

  const distinctScopedProducts = useMemo(
    () =>
      distinctAllProducts.filter((product) => {
        if (category && !matchesMaterialCategory(product, category)) return false;
        if (material && !matchesMaterialCategory(product, material)) return false;
        return true;
      }),
    [distinctAllProducts, category, material],
  );

  const sidebarFacets = useMemo(
    () =>
      buildSidebarFacets(
        distinctAllProducts,
        distinctScopedProducts.length > 0 ? distinctScopedProducts : distinctAllProducts,
      ),
    [distinctAllProducts, distinctScopedProducts],
  );

  const results = useMemo(() => {
    const filtered = products.filter((product) => {
      if (
        !filterCatalogueProduct(product, {
          category,
          material,
          look,
          surface,
          format,
          finish,
          application,
          size,
          usage,
          color,
          brand,
          type,
          texture,
        })
      ) {
        return false;
      }
      if (query) {
        const searchable = [
          product.name[locale],
          product.name.en,
          product.brand,
          product.manufacturer,
          product.model,
          product.code,
          ideaInternalCode(product),
          product.collection,
          product.origin,
          product.source?.originalSurface,
          ...(product.colors ?? []),
          ...product.sizes.map((item) => item.label),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
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
  }, [
    products,
    category,
    material,
    look,
    surface,
    format,
    finish,
    application,
    size,
    usage,
    color,
    brand,
    type,
    texture,
    query,
    locale,
    sort,
  ]);

  const featuredProducts = useMemo(() => {
    const byId = new Map(products.map((product) => [product.id, product] as const));
    const curated = FEATURED_PRODUCT_IDS.map((id) => byId.get(id)).filter(
      (product): product is Product => product !== undefined,
    );
    return curated.length === FEATURED_PRODUCT_IDS.length
      ? curated
      : distinctStorefrontProducts(products).slice(0, 4);
  }, [products]);

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const rawPage = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Math.min(Math.max(Number.isFinite(rawPage) ? rawPage : 1, 1), pageCount);
  const visibleProducts = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const title =
    format === "large"
      ? locale === "ar"
        ? "بلاط مقاسات كبيرة"
        : locale === "fr"
          ? "Grand format"
          : "Large-format tiles"
      : format === "outdoor20"
        ? locale === "ar"
          ? "بلاط خارجي 20 مم"
          : locale === "fr"
            ? "Carrelage extérieur 20 mm"
            : "20 mm outdoor tiles"
        : category
          ? COLLECTIONS.find((item) => item.slug === category)?.title[locale]
          : material
            ? MATERIAL_CATEGORY_OPTIONS.find((item) => item.key === material)?.label[locale]
            : t("nav.products");

  const copy = {
    en: {
      eyebrow: "FEATURED MATERIALS",
      title: "Curated Materials for Inspired Spaces",
      body: "A handpicked selection of standout surfaces from our collection.",
      cta: "Explore Featured",
      catalogueEyebrow: "PRODUCT CATALOGUE",
      catalogueTitle: "Explore Our Material Collection",
      catalogueBody: "Filter by material, surface character, finish, dimensions, and room usage.",
      filtersHeading: "Filters",
      clearAll: "Clear all",
      materialType: "MATERIAL TYPE",
      surfaceStyle: "SURFACE STYLE",
      finish: "FINISH",
      surfaceSpec: "SURFACE PROPERTIES",
      application: "APPLICATION",
      size: "SIZE",
      largeFormat: "Large Format (60×120+)",
      usage: "USAGE",
      color: "COLOR",
      brand: "BRAND",
      sortLabel: "Sort products",
      sortCatalogue: "Catalogue order",
      showing: (from: number, to: number, total: number) => `Showing ${from}–${to} of ${total} surfaces`,
      resultsBadge: (count: number) => `${count} ${count === 1 ? "surface" : "surfaces"}`,
      applyFilters: (count: number) => `Show ${count} surfaces`,
      marbleEmptyHint:
        "Natural marble slabs are sourced per project through IDEA partner suppliers. You can browse our marble-effect ceramic designs below or request a supplier quote.",
      porcelainEmptyHint:
        "Porcelain slab collections are confirmed directly with IDEA partner suppliers. Browse our large-format surfaces below or request a quote.",
      browseMarbleLook: "Browse Marble-Look Surfaces",
      browseLargeFormat: "Browse Large-Format Surfaces",
      requestSupplierQuote: "Request Supplier Quote",
    },
    ar: {
      eyebrow: "خامات مختارة",
      title: "خامات مختارة لمساحات ملهمة",
      body: "مجموعة منتقاة من أبرز الخامات في كتالوجنا.",
      cta: "استكشف الخامات المختارة",
      catalogueEyebrow: "كتالوج المنتجات",
      catalogueTitle: "اكتشف مجموعة الخامات",
      catalogueBody: "فلتر حسب نوع الخامة والطابع والتشطيب والمقاس والاستخدام بكل سهولة.",
      filtersHeading: "الفلاتر",
      clearAll: "مسح الكل",
      materialType: "نوع الخامة",
      surfaceStyle: "طابع السطح",
      finish: "التشطيب",
      surfaceSpec: "خصائص السطح",
      application: "التطبيق",
      size: "المقاس",
      largeFormat: "مقاسات كبيرة (+60×120)",
      usage: "الاستخدام",
      color: "اللون",
      brand: "العلامة التجارية",
      sortLabel: "ترتيب المنتجات",
      sortCatalogue: "ترتيب الكتالوج",
      showing: (from: number, to: number, total: number) => `عرض ${from}–${to} من ${total} خامة`,
      resultsBadge: (count: number) => `${count} خامة`,
      applyFilters: (count: number) => `عرض ${count} خامة`,
      marbleEmptyHint:
        "ألواح الرخام الطبيعي تُوفَّر حسب المشروع عبر موردين معتمدين لدى IDEA. يمكنك تصفح الخامات ذات تأثير الرخام المتاحة حالياً أو طلب عرض سعر مباشر.",
      porcelainEmptyHint:
        "تشكيلات البورسلين يتم تأكيد توفرها مباشرة عبر شركائنا من الموردين. يمكنك تصفح المقاسات الكبيرة المتاحة حالياً أو طلب عرض سعر.",
      browseMarbleLook: "تصفح خامات بتأثير الرخام",
      browseLargeFormat: "تصفح المقاسات الكبيرة",
      requestSupplierQuote: "اطلب عرض سعر من الموردين",
    },
    fr: {
      eyebrow: "MATÉRIAUX À LA UNE",
      title: "Des matières choisies pour des espaces inspirants",
      body: "Une sélection soignée de surfaces remarquables de notre collection.",
      cta: "Explorer la sélection",
      catalogueEyebrow: "CATALOGUE PRODUITS",
      catalogueTitle: "Explorez notre collection de matériaux",
      catalogueBody: "Filtrez par matériau, aspect, finition, format et usage.",
      filtersHeading: "Filtres",
      clearAll: "Tout effacer",
      materialType: "TYPE DE MATÉRIAU",
      surfaceStyle: "STYLE DE SURFACE",
      finish: "FINITION",
      surfaceSpec: "PROPRIÉTÉS",
      application: "APPLICATION",
      size: "FORMAT",
      largeFormat: "Grand format (60×120+)",
      usage: "USAGE",
      color: "COULEUR",
      brand: "MARQUE",
      sortLabel: "Trier les produits",
      sortCatalogue: "Ordre du catalogue",
      showing: (from: number, to: number, total: number) => `Affichage ${from}–${to} sur ${total} surfaces`,
      resultsBadge: (count: number) => `${count} surfaces`,
      applyFilters: (count: number) => `Afficher ${count} surfaces`,
      marbleEmptyHint:
        "Les dalles de marbre naturel sont confirmées sur demande via nos fournisseurs partenaires. Découvrez nos surfaces effet marbre ou demandez un devis.",
      porcelainEmptyHint:
        "Les collections porcelaine sont confirmées directement auprès de nos fournisseurs partenaires. Explorez nos grands formats ou demandez un devis.",
      browseMarbleLook: "Voir les surfaces effet marbre",
      browseLargeFormat: "Voir les grands formats",
      requestSupplierQuote: "Demander un devis fournisseur",
    },
  }[locale];

  const updateFilter = (key: string, value: string | null) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });

  const selectMaterialCategory = (key: MaterialCategoryKey) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("category");
      next.delete("material");
      next.delete("page");
      if (key === "tiles") next.set("material", "tiles");
      else if (key === "marble") next.set("material", "marble");
      else if (key !== "all") next.set("category", key);
      return next;
    });

  const clearFilters = () =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      [
        "category",
        "material",
        "look",
        "surface",
        "finish",
        "size",
        "color",
        "application",
        "type",
        "texture",
        "brand",
        "usage",
        "format",
        "q",
        "page",
      ].forEach((key) => next.delete(key));
      return next;
    });

  const switchToMarbleLook = () =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("category");
      next.delete("material");
      next.delete("page");
      next.set("look", "marble-look");
      return next;
    });

  const switchToLargeFormat = () =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("category");
      next.delete("material");
      next.delete("page");
      next.set("format", "large");
      return next;
    });

  const activeChips: { id: string; label: string; onRemove: () => void }[] = [];
  if (activeMaterial !== "all") {
    const label =
      MATERIAL_CATEGORY_OPTIONS.find((item) => item.key === activeMaterial)?.label[locale] ??
      activeMaterial;
    activeChips.push({
      id: "material",
      label,
      onRemove: () => selectMaterialCategory("all"),
    });
  }
  if (look) {
    const label = SURFACE_LOOK_OPTIONS.find((item) => item.key === look)?.label[locale] ?? look;
    activeChips.push({ id: "look", label, onRemove: () => updateFilter("look", null) });
  }
  if (finish) {
    activeChips.push({
      id: "finish",
      label: localizedFinish(finish, locale),
      onRemove: () => updateFilter("finish", null),
    });
  }
  if (surface) {
    activeChips.push({
      id: "surface",
      label: localizeSurfaceSpec(surface, locale),
      onRemove: () => updateFilter("surface", null),
    });
  }
  if (application) {
    activeChips.push({
      id: "application",
      label: localizeApplication(application, locale),
      onRemove: () => updateFilter("application", null),
    });
  }
  if (size) {
    activeChips.push({ id: "size", label: size, onRemove: () => updateFilter("size", null) });
  }
  if (format === "large") {
    activeChips.push({
      id: "format",
      label: copy.largeFormat,
      onRemove: () => updateFilter("format", null),
    });
  }
  if (usage) {
    activeChips.push({
      id: "usage",
      label: localizeUsage(usage, locale),
      onRemove: () => updateFilter("usage", null),
    });
  }
  if (color) {
    const colorEntry = COLOR_FAMILY_OPTIONS.find((item) => item.key === color);
    activeChips.push({
      id: "color",
      label: colorEntry ? colorEntry.label[locale] : color,
      onRemove: () => updateFilter("color", null),
    });
  }
  if (brand) {
    activeChips.push({ id: "brand", label: brand, onRemove: () => updateFilter("brand", null) });
  }

  return (
    <Section style={{ paddingTop: 0, background: "var(--idea-bg)" }}>
      <div className="idea-products-showroom-section">
        <div className="idea-products-showroom-bg" aria-hidden="true">
          <img src="/assets/aistudio/image_40847349.png" alt="" loading="eager" />
        </div>

        <Container
          className="idea-material-catalogue"
          style={{ maxWidth: 1800, position: "relative", zIndex: 1 }}
        >
          {featuredProducts.length > 0 && (
            <section
              className="idea-material-featured"
              aria-labelledby="idea-material-featured-title"
            >
              {/* Unobstructed architectural showroom framing column on desktop */}
              <div className="idea-material-featured-spacer" aria-hidden="true" />

              {/* Featured editorial header & cards placed over the calm, uncluttered dark slate backdrop */}
              <div className="idea-material-featured-stage">
                <div className="idea-material-featured-header">
                  <div className="idea-material-featured-copy">
                    <p className="idea-material-featured-eyebrow">{copy.eyebrow}</p>
                    <h2 id="idea-material-featured-title">{copy.title}</h2>
                    <p className="idea-material-featured-description">{copy.body}</p>
                  </div>
                  <a
                    className="idea-material-featured-cta"
                    href="#idea-material-catalogue-grid"
                    onClick={(event) => {
                      const target = document.getElementById("idea-material-catalogue-grid");
                      if (target) {
                        event.preventDefault();
                        target.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                  >
                    <span>{copy.cta}</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </div>

                <div className="idea-material-featured-grid">
                  {featuredProducts.map((product) => {
                    const maker = productMaker(product, locale);
                    const image =
                      localMaterialFace(product.id) ||
                      product.source?.original?.tiles?.[0] ||
                      product.image;
                    const unit = ["ceramics", "porcelain", "marble"].includes(product.collection)
                      ? "sqm"
                      : "pieces";
                    const finishLabel = localizedFinish(product.finish, locale);
                    const brandName = product.brand || (maker.verified ? maker.value : "");
                    const brandCaption = product.brand
                      ? brandLabel(locale)
                      : maker.verified
                        ? maker.label
                        : "";
                    return (
                      <article
                        className="idea-material-featured-card idea-glare-product-card"
                        key={product.id}
                      >
                        <GlareCard
                          translucent
                          radius="18px"
                          data-testid={`products-featured-glare-card-${product.id}`}
                          containerClassName="w-full h-full [aspect-ratio:auto]"
                          className="idea-glare-product-inner"
                        >
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
                            {finishLabel && (
                              <span className="idea-material-featured-finish">{finishLabel}</span>
                            )}
                            {brandName && (
                              <div className="idea-material-featured-maker">
                                <strong>{brandName}</strong>
                                {brandCaption && <small>{brandCaption}</small>}
                              </div>
                            )}
                            <Link
                              className="idea-material-featured-name"
                              to={"/product/" + product.slug}
                            >
                              {product.name[locale]}
                            </Link>
                            <div className="idea-material-featured-meta">
                              {product.sizes[0] && (
                                <span>{productSizeLabel(product.sizes[0].label)}</span>
                              )}
                              <code dir="ltr" title={ideaInternalCode(product)}>
                                {ideaInternalCode(product)}
                              </code>
                            </div>
                            <div className="idea-material-featured-actions">
                              <button
                                type="button"
                                onClick={() => addToQuote(product.id, unit)}
                              >
                                <FileText size={14} aria-hidden="true" />
                                {bestPriceLabel(locale)}
                              </button>
                              <Link
                                to={
                                  "/ai-room-visualizer?product=" + encodeURIComponent(product.id)
                                }
                              >
                                <Sparkles size={14} aria-hidden="true" />
                                {tryInAiLabel(locale)}
                              </Link>
                            </div>
                          </div>
                        </GlareCard>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <section
            className="idea-material-main-layout"
            aria-label={
              locale === "ar"
                ? "كتالوج المنتجات"
                : locale === "fr"
                  ? "Catalogue produits"
                  : "Product catalogue"
            }
          >
            {mobileFiltersOpen && (
              <div
                className="idea-sidebar-scrim"
                onClick={() => setMobileFiltersOpen(false)}
                aria-hidden="true"
              />
            )}

            <aside className="idea-material-catalogue-aside">
              <div className="idea-material-catalogue-intro">
                <p className="idea-eyebrow">
                  {!category && !material && !format
                    ? copy.catalogueEyebrow
                    : locale === "ar"
                      ? "اكتشف خاماتنا"
                      : locale === "fr"
                        ? "DÉCOUVREZ NOS MATÉRIAUX"
                        : "EXPLORE OUR MATERIALS"}
                </p>
                <h1 className="idea-display">
                  {!category && !material && !format ? copy.catalogueTitle : title}
                </h1>
                <p className="idea-material-subtitle">{copy.catalogueBody}</p>
              </div>

              <div
                id="idea-catalogue-filter-panel"
                className={`idea-filter-panel${mobileFiltersOpen ? " is-open" : ""}`}
                aria-label={copy.filtersHeading}
              >
                <div className="idea-filter-panel-header">
                  <div className="idea-filter-panel-title-wrap">
                    <h2 className="idea-filter-panel-title">{copy.filtersHeading}</h2>
                    {activeFilters > 0 && (
                      <span className="idea-filter-active-count" aria-live="polite">
                        {activeFilters}
                      </span>
                    )}
                  </div>
                  <div className="idea-filter-panel-header-actions">
                    <button
                      type="button"
                      className="idea-filter-clear-btn"
                      onClick={clearFilters}
                      disabled={activeFilters === 0 && !query}
                    >
                      {copy.clearAll}
                    </button>
                    <button
                      type="button"
                      className="idea-filter-close-btn"
                      onClick={() => setMobileFiltersOpen(false)}
                      aria-label={locale === "ar" ? "إغلاق الفلاتر" : "Close filters"}
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* 1. Material Type (All, Ceramics, Porcelain, Tiles, Marble) */}
                <div className="idea-filter-group">
                  <div className="idea-filter-group-label">{copy.materialType}</div>
                  <div
                    className="idea-filter-chips"
                    role="group"
                    aria-label={copy.materialType}
                  >
                    {sidebarFacets.materialCategories.map((item) => {
                      const isActive = activeMaterial === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          className={`idea-filter-chip${isActive ? " is-active" : ""}${item.count === 0 ? " is-empty" : ""}`}
                          aria-pressed={isActive}
                          onClick={() => selectMaterialCategory(item.key)}
                        >
                          <span>{item.label[locale]}</span>
                          <span className="idea-filter-chip-count">{item.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Surface Style (Marble Look, Wood Look, Stone & Cement, Mosaic & Decor) */}
                {sidebarFacets.surfaceLooks.length > 0 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.surfaceStyle}</div>
                    <div
                      className="idea-filter-chips"
                      role="group"
                      aria-label={copy.surfaceStyle}
                    >
                      {sidebarFacets.surfaceLooks.map((item) => {
                        const isActive = look === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            className={`idea-filter-chip${isActive ? " is-active" : ""}`}
                            aria-pressed={isActive}
                            onClick={() => updateFilter("look", isActive ? null : item.key)}
                          >
                            <span>{item.label[locale]}</span>
                            <span className="idea-filter-chip-count">{item.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Finish (Matte, Glossy) */}
                {sidebarFacets.finishes.length > 0 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.finish}</div>
                    <div className="idea-filter-chips" role="group" aria-label={copy.finish}>
                      {sidebarFacets.finishes.map(([item, count]) => {
                        const isActive = finish === item;
                        return (
                          <button
                            key={item}
                            type="button"
                            className={`idea-filter-chip${isActive ? " is-active" : ""}`}
                            aria-pressed={isActive}
                            onClick={() => updateFilter("finish", isActive ? null : item)}
                          >
                            <span>{localizedFinish(item, locale)}</span>
                            <span className="idea-filter-chip-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Surface Properties (Nature, High Resistance, Anti-Slip) */}
                {sidebarFacets.surfaceSpecs.length > 0 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.surfaceSpec}</div>
                    <div
                      className="idea-filter-chips"
                      role="group"
                      aria-label={copy.surfaceSpec}
                    >
                      {sidebarFacets.surfaceSpecs.map(([item, count]) => {
                        const isActive = surface === item;
                        return (
                          <button
                            key={item}
                            type="button"
                            className={`idea-filter-chip${isActive ? " is-active" : ""}`}
                            aria-pressed={isActive}
                            onClick={() => updateFilter("surface", isActive ? null : item)}
                          >
                            <span>{localizeSurfaceSpec(item, locale)}</span>
                            <span className="idea-filter-chip-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. Application (Wall, Floor) */}
                {sidebarFacets.applications.length > 0 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.application}</div>
                    <div
                      className="idea-filter-chips"
                      role="group"
                      aria-label={copy.application}
                    >
                      {sidebarFacets.applications.map(([item, count]) => {
                        const isActive = application === item;
                        return (
                          <button
                            key={item}
                            type="button"
                            className={`idea-filter-chip${isActive ? " is-active" : ""}`}
                            aria-pressed={isActive}
                            onClick={() => updateFilter("application", isActive ? null : item)}
                          >
                            <span>{localizeApplication(item, locale)}</span>
                            <span className="idea-filter-chip-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 6. Size (All real catalogue dimensions + Large Format) */}
                {sidebarFacets.sizes.length > 0 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.size}</div>
                    <div className="idea-filter-chips" role="group" aria-label={copy.size}>
                      {sidebarFacets.largeFormatCount > 0 && (
                        <button
                          type="button"
                          className={`idea-filter-chip${format === "large" ? " is-active" : ""}`}
                          aria-pressed={format === "large"}
                          onClick={() =>
                            updateFilter("format", format === "large" ? null : "large")
                          }
                        >
                          <span>{copy.largeFormat}</span>
                          <span className="idea-filter-chip-count">
                            {sidebarFacets.largeFormatCount}
                          </span>
                        </button>
                      )}
                      {sidebarFacets.sizes.map(([item]) => {
                        const isActive = size === item;
                        return (
                          <button
                            key={item}
                            type="button"
                            dir="ltr"
                            className={`idea-filter-chip idea-filter-chip--size${isActive ? " is-active" : ""}`}
                            aria-pressed={isActive}
                            onClick={() => updateFilter("size", isActive ? null : item)}
                          >
                            <span>{productSizeLabel(item)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 7. Usage (Bathroom, Wall, Floor, Outdoor, Kitchen) */}
                {sidebarFacets.usages.length > 0 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.usage}</div>
                    <div className="idea-filter-chips" role="group" aria-label={copy.usage}>
                      {sidebarFacets.usages.map(([item, count]) => {
                        const isActive = usage === item;
                        return (
                          <button
                            key={item}
                            type="button"
                            className={`idea-filter-chip${isActive ? " is-active" : ""}`}
                            aria-pressed={isActive}
                            onClick={() => updateFilter("usage", isActive ? null : item)}
                          >
                            <span>{localizeUsage(item, locale)}</span>
                            <span className="idea-filter-chip-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 8. Color Families */}
                {sidebarFacets.colors.length > 0 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.color}</div>
                    <div className="idea-filter-chips" role="group" aria-label={copy.color}>
                      {sidebarFacets.colors.map((item) => {
                        const isActive = color === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            className={`idea-filter-chip${isActive ? " is-active" : ""}`}
                            aria-pressed={isActive}
                            onClick={() => updateFilter("color", isActive ? null : item.key)}
                          >
                            {item.swatch && (
                              <span
                                className="idea-filter-color-swatch"
                                style={{ backgroundColor: item.swatch }}
                                aria-hidden="true"
                              />
                            )}
                            <span>{item.label[locale]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 9. Brand (auto-appears when multiple brands are approved) */}
                {sidebarFacets.brands.length > 1 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.brand}</div>
                    <div className="idea-filter-chips" role="group" aria-label={copy.brand}>
                      {sidebarFacets.brands.map(([item, count]) => {
                        const isActive = brand === item;
                        return (
                          <button
                            key={item}
                            type="button"
                            className={`idea-filter-chip${isActive ? " is-active" : ""}`}
                            aria-pressed={isActive}
                            onClick={() => updateFilter("brand", isActive ? null : item)}
                          >
                            <span>{item}</span>
                            <span className="idea-filter-chip-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="idea-filter-mobile-apply"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  {copy.applyFilters(results.length)}
                </button>
              </div>
            </aside>

            <div className="idea-material-results">
              <div className="idea-material-toolbar">
                <form
                  className="idea-material-search"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    updateFilter("q", String(formData.get("q") ?? "").trim() || null);
                  }}
                >
                  <div className="idea-material-search-field">
                    <button
                      type="submit"
                      aria-label={
                        locale === "ar" ? "بحث" : locale === "fr" ? "Rechercher" : "Search"
                      }
                    >
                      <Search size={17} aria-hidden="true" />
                    </button>
                    <input
                      key={query}
                      type="search"
                      name="q"
                      defaultValue={query}
                      aria-label={
                        locale === "ar"
                          ? "ابحث عن خامة"
                          : locale === "fr"
                            ? "Rechercher un matériau"
                            : "Search materials"
                      }
                      placeholder={
                        locale === "ar"
                          ? "ابحث بالاسم أو البراند أو المقاس أو الكود..."
                          : locale === "fr"
                            ? "Nom, marque, format ou référence..."
                            : "Search materials, names, sizes, or codes..."
                      }
                    />
                  </div>
                </form>

                <div className="idea-material-toolbar-controls">
                  <button
                    type="button"
                    className="idea-mobile-filter-trigger"
                    onClick={() => setMobileFiltersOpen(true)}
                    aria-expanded={mobileFiltersOpen}
                    aria-controls="idea-catalogue-filter-panel"
                  >
                    <SlidersHorizontal size={15} aria-hidden="true" />
                    <span>{copy.filtersHeading}</span>
                    {activeFilters > 0 && (
                      <span className="idea-filter-active-count">{activeFilters}</span>
                    )}
                  </button>

                  <label className="idea-material-sort-select">
                    <select
                      aria-label={copy.sortLabel}
                      value={sort}
                      onChange={(event) => updateFilter("sort", event.target.value)}
                    >
                      <option value="source">{copy.sortCatalogue}</option>
                      <option value="az">A–Z</option>
                      <option value="za">Z–A</option>
                    </select>
                  </label>

                  <div
                    className="idea-material-view-toggle"
                    role="group"
                    aria-label={
                      locale === "ar"
                        ? "طريقة عرض المنتجات"
                        : locale === "fr"
                          ? "Mode d’affichage"
                          : "View mode"
                    }
                  >
                    <button
                      type="button"
                      aria-label={locale === "ar" ? "شبكة" : locale === "fr" ? "Grille" : "Grid"}
                      aria-pressed={viewMode === "grid"}
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid2X2 size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={locale === "ar" ? "قائمة" : locale === "fr" ? "Liste" : "List"}
                      aria-pressed={viewMode === "list"}
                      onClick={() => setViewMode("list")}
                    >
                      <List size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              {(activeChips.length > 0 || query) && (
                <div className="idea-active-filter-bar" aria-live="polite">
                  <span className="idea-active-filter-summary">
                    {copy.resultsBadge(results.length)}
                  </span>
                  {query && (
                    <button
                      type="button"
                      className="idea-active-chip"
                      onClick={() => updateFilter("q", null)}
                    >
                      <span>“{query}”</span>
                      <X size={13} aria-hidden="true" />
                    </button>
                  )}
                  {activeChips.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      className="idea-active-chip"
                      onClick={chip.onRemove}
                    >
                      <span>{chip.label}</span>
                      <X size={13} aria-hidden="true" />
                    </button>
                  ))}
                  <button
                    type="button"
                    className="idea-active-filter-clear"
                    onClick={clearFilters}
                  >
                    {copy.clearAll}
                  </button>
                </div>
              )}

              {results.length === 0 ? (
                <div className="idea-material-empty">
                  <h2>
                    {locale === "ar"
                      ? "لم نعثر على خامات مطابقة"
                      : locale === "fr"
                        ? "Aucun matériau correspondant"
                        : "No matching materials"}
                  </h2>
                  <p>
                    {activeMaterial === "marble"
                      ? copy.marbleEmptyHint
                      : activeMaterial === "porcelain"
                        ? copy.porcelainEmptyHint
                        : locale === "ar"
                          ? "جرّب تغيير البحث أو مسح بعض الفلاتر."
                          : locale === "fr"
                            ? "Essayez une autre recherche ou réinitialisez vos filtres."
                            : "Try another search or reset your filters."}
                  </p>
                  <div className="idea-material-empty-actions">
                    {activeMaterial === "marble" && (
                      <button
                        type="button"
                        className="is-primary"
                        onClick={switchToMarbleLook}
                      >
                        {copy.browseMarbleLook}
                      </button>
                    )}
                    {activeMaterial === "porcelain" && (
                      <button
                        type="button"
                        className="is-primary"
                        onClick={switchToLargeFormat}
                      >
                        {copy.browseLargeFormat}
                      </button>
                    )}
                    {(activeMaterial === "marble" || activeMaterial === "porcelain") && (
                      <Link to="/request-quote/new" className="idea-empty-quote-link">
                        {copy.requestSupplierQuote}
                      </Link>
                    )}
                    <button type="button" onClick={clearFilters}>
                      {copy.clearAll}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="idea-material-resultline-bar" aria-live="polite">
                    <span>
                      {copy.showing(
                        (page - 1) * PAGE_SIZE + 1,
                        Math.min(page * PAGE_SIZE, results.length),
                        results.length,
                      )}
                    </span>
                  </div>
                  <div
                    className={"idea-material-grid" + (viewMode === "list" ? " is-list" : "")}
                    id="idea-material-catalogue-grid"
                  >
                    {visibleProducts.map((product) => (
                      <MaterialCard
                        key={product.id}
                        product={product}
                        locale={locale}
                        t={t}
                        isFavorite={isFavorite}
                        toggleFavorite={toggleFavorite}
                        toggleCompare={toggleCompare}
                        compare={compare}
                        addToQuote={addToQuote}
                      />
                    ))}
                  </div>
                  {pageCount > 1 && (
                    <nav
                      className="idea-material-pagination"
                      aria-label={
                        locale === "ar"
                          ? "صفحات الخامات"
                          : locale === "fr"
                            ? "Pages des matériaux"
                            : "Material pages"
                      }
                    >
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => updateFilter("page", String(page - 1))}
                      >
                        {locale === "ar" ? "السابق" : locale === "fr" ? "Précédent" : "Previous"}
                      </button>
                      {Array.from({ length: pageCount }, (_, index) => index + 1)
                        .filter(
                          (number) =>
                            number === 1 || number === pageCount || Math.abs(number - page) <= 2,
                        )
                        .map((number) => (
                          <button
                            key={number}
                            type="button"
                            aria-current={number === page ? "page" : undefined}
                            aria-label={String(number)}
                            onClick={() => updateFilter("page", String(number))}
                          >
                            {number}
                          </button>
                        ))}
                      <button
                        type="button"
                        disabled={page >= pageCount}
                        onClick={() => updateFilter("page", String(page + 1))}
                      >
                        {locale === "ar" ? "التالي" : locale === "fr" ? "Suivant" : "Next"}
                      </button>
                    </nav>
                  )}
                </>
              )}
            </div>
          </section>
        </Container>
      </div>
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

function MaterialCard({
  product,
  locale,
  t,
  isFavorite,
  toggleFavorite,
  toggleCompare,
  compare,
  addToQuote,
}: MaterialCardProps) {
  const maker = productMaker(product, locale);
  const brandName = product.brand || (maker.verified ? maker.value : "");
  const brandCaption = product.brand ? brandLabel(locale) : maker.verified ? maker.label : "";
  const finishLabel = localizedFinish(product.finish, locale);
  const image =
    localMaterialFace(product.id) || product.source?.original?.tiles?.[0] || product.image;
  const unit = ["ceramics", "porcelain", "marble"].includes(product.collection)
    ? "sqm"
    : "pieces";
  const favorite = isFavorite(product.id);
  const inCompare = compare.includes(product.id);

  return (
    <article className="idea-material-card idea-glare-product-card">
      <GlareCard
        translucent
        radius="18px"
        data-testid={`products-glare-card-${product.id}`}
        containerClassName="w-full h-full [aspect-ratio:auto]"
        className="idea-glare-product-inner"
      >
        <div className="idea-material-card-media">
          <Link
            to={"/product/" + product.slug}
            aria-label={product.name[locale] + " — " + t("action.viewDetails")}
          >
            <MaterialSphere
              className="idea-material-orb"
              src={image}
              alt={product.name[locale]}
              loading="lazy"
            />
          </Link>
          <div className="idea-material-card-actions">
            <button
              type="button"
              aria-label={t("action.favorite")}
              aria-pressed={favorite}
              onClick={() => toggleFavorite(product.id)}
            >
              <Heart size={16} fill={favorite ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              aria-label={t("action.compare")}
              aria-pressed={inCompare}
              onClick={() => toggleCompare(product.id)}
            >
              <GitCompare size={16} />
            </button>
          </div>
        </div>
        <div className="idea-material-card-body">
          {finishLabel && <span className="idea-material-finish">{finishLabel}</span>}
          {brandName && (
            <div className="idea-material-maker">
              <span>{brandName}</span>
              {brandCaption && <small>{brandCaption}</small>}
            </div>
          )}
          <Link
            className="idea-material-name"
            to={"/product/" + product.slug}
            title={product.name[locale]}
          >
            <span>{product.name[locale]}</span>
          </Link>
          <div className="idea-material-meta">
            {product.sizes[0] && <span>{productSizeLabel(product.sizes[0].label)}</span>}
            <span dir="ltr" title={ideaInternalCode(product)}>
              {ideaInternalCode(product)}
            </span>
          </div>
          <div className="idea-material-card-footer">
            <button
              type="button"
              className="idea-material-quote"
              onClick={() => addToQuote(product.id, unit)}
            >
              <FileText size={14} />
              {bestPriceLabel(locale)}
            </button>
            <Link
              className="idea-material-visualize"
              to={"/ai-room-visualizer?product=" + encodeURIComponent(product.id)}
            >
              <Sparkles size={15} />
              {tryInAiLabel(locale)}
            </Link>
          </div>
        </div>
      </GlareCard>
    </article>
  );
}
