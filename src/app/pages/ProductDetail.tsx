import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ChevronRight,
  FileText,
  GitCompare,
  Heart,
  Images,
  Search,
  Sparkles,
} from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { useBackend } from "../backend/db";
import { supabase } from "../backend/supabaseClient";
import type { Product } from "../data/types";
import { Button, Container } from "../components/ui";
import { ProductCard } from "../components/ProductCard";
import "./ProductDetail.css";

type Copy = { en: string; ar: string; fr: string };

const COLLECTION_LABELS: Record<string, Copy> = {
  ceramics: { en: "Ceramic tiles", ar: "بلاط سيراميك", fr: "Carrelage céramique" },
  porcelain: { en: "Porcelain tiles", ar: "بلاط بورسلين", fr: "Carrelage en porcelaine" },
  marble: { en: "Natural marble", ar: "رخام طبيعي", fr: "Marbre naturel" },
  "sanitary-ware": { en: "Sanitary ware", ar: "أدوات صحية", fr: "Sanitaires" },
  faucets: { en: "Faucets", ar: "خلاطات", fr: "Robinetterie" },
  "bathroom-sets": { en: "Bathroom sets", ar: "أطقم حمامات", fr: "Ensembles de salle de bain" },
  "bathroom-units": { en: "Bathroom units", ar: "وحدات حمام", fr: "Meubles de salle de bain" },
  bathtubs: { en: "Bathtubs", ar: "بانيوهات", fr: "Baignoires" },
  "shower-units": { en: "Shower units", ar: "وحدات دش", fr: "Cabines de douche" },
  "bathroom-accessories": { en: "Bathroom accessories", ar: "إكسسوارات حمام", fr: "Accessoires de salle de bain" },
};

function uniqueProducts(items: Product[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

export function ProductDetail() {
  const { slug } = useParams();
  const { t, locale } = useI18n();
  const { session } = useBackend();
  const { products, isFavorite, toggleFavorite, toggleCompare, addToQuote } = useStore();
  const product = products.find((item) => item.slug === slug);
  const [activeImg, setActiveImg] = useState(0);
  const [failedImages, setFailedImages] = useState<number[]>([]);
  const [adminPrice, setAdminPrice] = useState<{ price: number; currency: string } | null>(null);

  useEffect(() => {
    setActiveImg(0);
    setFailedImages([]);
  }, [slug]);

  useEffect(() => {
    setAdminPrice(null);
    if (!product || session?.role !== "admin" || !supabase) return;
    let active = true;
    void supabase
      .from("catalogue_admin_prices")
      .select("price,currency")
      .eq("product_id", product.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active || error || !data) return;
        setAdminPrice({ price: Number(data.price), currency: data.currency });
      });
    return () => { active = false; };
  }, [product?.id, session?.role]);

  const copy = (value: Copy) => value[locale];

  const family = useMemo(() => {
    if (!product) return [];
    const candidates = products.filter((item) => {
      if (item.id === product.id) return false;
      if (product.family) return Boolean(item.family && item.family === product.family);
      return item.brand === product.brand
        && item.collection === product.collection
        && item.finish === product.finish
        && item.sizes.some((size) => product.sizes.some((own) => own.label === size.label));
    });
    return uniqueProducts([product, ...candidates]).slice(0, 10);
  }, [product, products]);

  if (!product) {
    return (
      <main className="idea-catalogue-detail">
        <Container>
          <div className="idea-product-not-found">
            <p>{copy({ en: "Product not found.", ar: "المنتج غير موجود.", fr: "Produit introuvable." })}</p>
            <Link to="/products">{copy({ en: "Back to catalogue", ar: "العودة للكتالوج", fr: "Retour au catalogue" })}</Link>
          </div>
        </Container>
      </main>
    );
  }

  const isTile = product.collection === "ceramics" || product.collection === "porcelain" || product.collection === "marble";
  // Supplier-authored tile faces are the only valid material product photographs.
  // Room renders remain elsewhere in source records, never substituted as a swatch.
  const sourceTileFaces = [...new Set((product.source?.original?.tiles || [])
    .filter((url) => /^https:\/\/[^\s]+\.(?:jpe?g|png|webp)(?:\?[^\s]*)?$/i.test(url)))];
  const gallery = isTile ? sourceTileFaces : [...new Set(product.gallery?.length ? product.gallery : [product.image])];
  const heroImage = gallery[0] || null;
  const visibleImage = gallery[activeImg] || heroImage || "";
  const activeImageFailed = failedImages.includes(activeImg);
  const unit = isTile ? "sqm" : "pieces";
  const fav = isFavorite(product.id);
  const collectionLabel = COLLECTION_LABELS[product.collection]?.[locale] ?? product.collection.replaceAll("-", " ");

  const applicationGroups = (() => {
    if (!isTile) {
      return [{
        key: "models",
        title: copy({ en: "Available models", ar: "الموديلات المتاحة", fr: "Modèles disponibles" }),
        items: family,
      }];
    }
    const floor = family.filter((item) => (item.application ?? "").toLowerCase().includes("floor"));
    const wall = family.filter((item) => (item.application ?? "").toLowerCase().includes("wall"));
    const groups = [
      floor.length && {
        key: "floor",
        title: copy({ en: "Floor tiles", ar: "بلاط الأرضيات", fr: "Carrelage de sol" }),
        items: floor,
      },
      wall.length && {
        key: "wall",
        title: copy({ en: "Wall tiles", ar: "بلاط الحوائط", fr: "Carrelage mural" }),
        items: wall,
      },
    ].filter(Boolean) as { key: string; title: string; items: Product[] }[];
    return groups.length ? groups : [{
      key: "surfaces",
      title: copy({ en: "Available surfaces", ar: "الأسطح المتاحة", fr: "Surfaces disponibles" }),
      items: family,
    }];
  })();

  const sourceFallback = t("value.notProvided");
  const identitySpecs: [string, string][] = [
    [t("label.model"), product.model || sourceFallback],
    [t("label.code"), product.code || sourceFallback],
    [t("label.brand"), product.brand || sourceFallback],
    [t("label.manufacturer"), product.manufacturer || sourceFallback],
  ];
  const specs = [
    ...identitySpecs,
    [t("label.type"), product.type],
    [t("label.finish"), product.finish],
    [t("label.texture"), product.texture],
    [t("label.origin"), product.origin],
    [copy({ en: "Application", ar: "الاستخدام", fr: "Application" }), product.application],
    [t("label.sizes"), product.sizes.map((size) => size.label).join(" · ")],
    [copy({ en: "Thickness", ar: "السُمك", fr: "Épaisseur" }), product.sizes.find((size) => size.thicknessMm)?.thicknessMm ? `${product.sizes.find((size) => size.thicknessMm)?.thicknessMm} mm` : undefined],
    [copy({ en: "Colours", ar: "الألوان", fr: "Couleurs" }), product.colors?.join(" · ")],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const related = products.filter((item) => (
    item.id !== product.id
    && item.collection === product.collection
    && !family.some((member) => member.id === item.id)
  )).slice(0, 4);

  return (
    <main className={isTile ? "idea-catalogue-detail idea-material-catalogue-detail" : "idea-catalogue-detail"}>
      {isTile ? (
        <section className="idea-product-hero idea-product-material-hero" aria-labelledby="product-title">
          <Container className="idea-material-hero-layout">
            <div className="idea-material-hero-visual">
              {heroImage ? (
                <img src={heroImage} alt={`${product.name[locale]} — ${copy({ en: "original tile face", ar: "وجه البلاطة الأصلي", fr: "face de carreau originale" })}`} decoding="async" />
              ) : (
                <div className="idea-material-hero-missing">{copy({
                  en: "An isolated tile-face photograph is not yet available for this product.",
                  ar: "صورة البلاطة المنفصلة غير متاحة لهذا المنتج حتى الآن.",
                  fr: "La photo du carreau isolé n'est pas encore disponible.",
                })}</div>
              )}
              <span className="idea-material-photo-label">{copy({ en: "PRODUCT SURFACE · NO ROOM RENDER", ar: "الخامة الأصلية · بدون صورة غرفة", fr: "SURFACE DU PRODUIT · SANS MISE EN SCÈNE" })}</span>
            </div>
            <div className="idea-material-hero-summary">
              <div className="idea-material-eyebrow">{collectionLabel}</div>
              <h1 id="product-title" className="idea-display">{product.name[locale]}</h1>
              <p className="idea-material-subtitle">{[product.texture, product.finish, product.application].filter(Boolean).join(" · ")}</p>
              <dl className="idea-material-hero-facts">
                <div><dt>{t("label.manufacturer")}</dt><dd>{product.manufacturer || sourceFallback}</dd></div>
                <div><dt>{t("label.brand")}</dt><dd>{product.brand || sourceFallback}</dd></div>
                <div><dt>{t("label.sizes")}</dt><dd>{product.sizes.map((size) => size.label).join(" · ") || sourceFallback}</dd></div>
                <div><dt>{t("label.finish")}</dt><dd>{product.finish || sourceFallback}</dd></div>
                <div><dt>{t("label.code")}</dt><dd>{product.code || sourceFallback}</dd></div>
              </dl>
              {session?.role === "admin" && adminPrice && (
                <div className="idea-admin-price">
                  <span>{t("price.admin")}</span>
                  <strong>{new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "fr" ? "fr-FR" : "en-EG", {
                    style: "currency",
                    currency: adminPrice.currency,
                  }).format(adminPrice.price)}</strong>
                </div>
              )}
              <Link className="idea-material-try-link" to={`/ai-room-visualizer?product=${encodeURIComponent(product.id)}`}>
                <Sparkles size={18} /> {copy({ en: "Try this tile in my room", ar: "جرّب البلاطة دي في غرفتك", fr: "Essayer ce carreau dans ma pièce" })}
              </Link>
              <p className="idea-material-authenticity-note">{copy({
                en: "Individual material photography only. Missing specifications are not estimated.",
                ar: "صورة الخامة فقط، والمواصفات غير المتاحة لا يتم تخمينها.",
                fr: "Photographie du matériau uniquement. Les caractéristiques manquantes ne sont pas estimées.",
              })}</p>
            </div>
          </Container>
        </section>
      ) : (
      <section className="idea-product-hero" aria-labelledby="product-title">
        <img
          src={heroImage}
          alt=""
          onError={() => setFailedImages((current) => current.includes(0) ? current : [...current, 0])}
        />
        <div className="idea-product-hero-shade" />
        <Container className="idea-product-hero-copy">
          <div className="idea-eyebrow">{product.manufacturer || sourceFallback} · {collectionLabel}</div>
          <h1 id="product-title" className="idea-display">{product.name[locale]}</h1>
          <p>{product.description || [product.texture, product.finish, product.application].filter(Boolean).join(" · ")}</p>
          <dl className="idea-product-identity">
            {identitySpecs.map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
          {session?.role === "admin" && adminPrice && (
            <div className="idea-admin-price">
              <span>{t("price.admin")}</span>
              <strong>{new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "fr" ? "fr-FR" : "en-EG", {
                style: "currency",
                currency: adminPrice.currency,
              }).format(adminPrice.price)}</strong>
            </div>
          )}
        </Container>
      </section>
      )}
      <nav className="idea-product-section-nav" aria-label={copy({ en: "Product sections", ar: "أقسام المنتج", fr: "Sections du produit" })}>
        <Container>
          <Link to={`/collections/${product.collection}`}>{collectionLabel}</Link>
          <a href="#formats">{copy({ en: "Models & sizes", ar: "الموديلات والمقاسات", fr: "Modèles et formats" })}</a>
          <a href="#specifications">{copy({ en: "Technical details", ar: "المواصفات الفنية", fr: "Détails techniques" })}</a>
          <a href="#gallery">{copy({ en: "Photo gallery", ar: "معرض الصور", fr: "Galerie photos" })}</a>
          <Link className="idea-product-nav-visualizer" to={`/ai-room-visualizer?product=${encodeURIComponent(product.id)}`}>
            <Sparkles size={15} />
            {copy({ en: "Visualize in your room", ar: "شاهده في غرفتك", fr: "Visualiser dans votre pièce" })}
          </Link>
        </Container>
      </nav>

      <Container className="idea-product-catalogue-sheet">
        <div className="idea-product-breadcrumb">
          <Link to="/collections">{t("nav.collections")}</Link>
          <ChevronRight size={13} />
          <Link to={`/collections/${product.collection}`}>{collectionLabel}</Link>
          <ChevronRight size={13} />
          <span>{product.name[locale]}</span>
        </div>

        <section id="specifications" className="idea-technical-panel">
          <div className="idea-catalogue-section-heading">
            <div>
              <span>{copy({ en: "Verified product data", ar: "بيانات المنتج الموثقة", fr: "Données produit vérifiées" })}</span>
              <h2 className="idea-display">{copy({ en: "Technical features", ar: "المواصفات الفنية", fr: "Caractéristiques techniques" })}</h2>
            </div>
          </div>
          <dl className="idea-technical-grid">
            {specs.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="idea-source-note">
            {copy({
              en: "Specifications shown are limited to supplied catalogue records. Unverified manufacturer fields remain unspecified.",
              ar: "المواصفات المعروضة تقتصر على بيانات الكتالوج الموثقة من الشركة المصنّعة.",
              fr: "Les caractéristiques affichées sont limitées aux données vérifiées du catalogue fabricant.",
            })}
          </p>
        </section>

        <div className="idea-product-actions">
          <Button size="lg" onClick={() => addToQuote(product.id, unit)}>
            <FileText size={17} /> {t("action.requestPrice")}
          </Button>
          <Button variant="ghost" onClick={() => toggleFavorite(product.id)}>
            <Heart size={17} fill={fav ? "var(--idea-gold-bright)" : "none"} /> {t("action.favorite")}
          </Button>
          <Button variant="ghost" onClick={() => toggleCompare(product.id)}>
            <GitCompare size={17} /> {t("action.compare")}
          </Button>
        </div>
      </Container>

      <section id="gallery" className="idea-product-photo-gallery">
        <Container>
          <div className="idea-catalogue-section-heading">
            <div>
              <span>{product.manufacturer || sourceFallback}</span>
              <h2 className="idea-display"><Images size={22} /> {copy({ en: "Photo gallery", ar: "معرض الصور", fr: "Galerie photos" })}</h2>
            </div>
          </div>
          <div className="idea-product-gallery-stage">
            {(!gallery.length || activeImageFailed) ? (
              <div className="idea-image-unavailable">{copy({ en: "Image unavailable from the documented source.", ar: "الصورة غير متاحة من المصدر الموثق.", fr: "Image indisponible depuis la source documentée." })}</div>
            ) : (
              <img
                className="idea-vivid-image"
                src={visibleImage}
                alt={`${product.name[locale]} ${activeImg + 1}`}
                decoding="async"
                onError={() => setFailedImages((current) => current.includes(activeImg) ? current : [...current, activeImg])}
              />
            )}
          </div>
          {gallery.length > 1 && (
            <div className="idea-product-gallery-thumbs">
              {gallery.map((image, index) => (
                <Button
                  variant="ghost"
                  className={index === activeImg ? "is-active" : ""}
                  key={`${image}-${index}`}
                  onClick={() => setActiveImg(index)}
                  aria-label={`${copy({ en: "Show image", ar: "عرض الصورة", fr: "Afficher l’image" })} ${index + 1}`}
                >
                  <img src={image} alt="" loading="lazy" />
                </Button>
              ))}
            </div>
          )}
        </Container>
      </section>

      <section id="formats" className="idea-product-formats-section">
        <Container className="idea-product-formats">
          {applicationGroups.map((group) => {
            const sizes = [...new Set(group.items.flatMap((item) => item.sizes.map((size) => size.label)))];
            return (
              <div className="idea-format-group" key={group.key}>
                <header className="idea-catalogue-section-heading">
                  <div>
                    <span>{copy({ en: "Other options from this collection", ar: "خيارات أخرى من نفس المجموعة", fr: "Autres options de cette collection" })}</span>
                    <h2 className="idea-display">{group.title}</h2>
                  </div>
                  <p>{sizes.join(" · ")}</p>
                </header>
                <div className="idea-product-swatches">
                  {group.items.map((item) => (
                    <Link
                      className={`idea-product-swatch${item.id === product.id ? " is-current" : ""}`}
                      to={`/product/${item.slug}`}
                      key={`${group.key}-${item.id}`}
                      aria-current={item.id === product.id ? "page" : undefined}
                    >
                      <div className="idea-product-swatch-image">
                        {(!isTile || item.source?.original?.tiles?.[0]) ? (
                          <img src={isTile ? item.source!.original!.tiles[0] : item.image} alt={item.name[locale]} loading="lazy" />
                        ) : (
                          <span className="idea-material-swatch-unavailable">{copy({
                            en: "Tile photograph pending", ar: "صورة البلاطة غير متاحة", fr: "Photo du carreau indisponible",
                          })}</span>
                        )}
                      </div>
                      <strong>{item.name[locale]}</strong>
                      <span>{item.variant || item.finish || item.model}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </Container>
      </section>

      <section className="idea-product-discovery">
        <Container>
          <div className="idea-product-discovery-copy">
            <span className="idea-eyebrow">{copy({ en: "Find the right surface", ar: "اعثر على السطح المناسب", fr: "Trouvez la surface idéale" })}</span>
            <h2 className="idea-display">{copy({ en: "Explore more products", ar: "استكشف المزيد من المنتجات", fr: "Explorer plus de produits" })}</h2>
          </div>
          <Link to={`/products?category=${product.collection}`} className="idea-product-search-link">
            <Search size={18} />
            {copy({ en: `Search ${collectionLabel}`, ar: `ابحث في ${collectionLabel}`, fr: `Rechercher dans ${collectionLabel}` })}
          </Link>
        </Container>
      </section>

      {related.length > 0 && (
        <section className="idea-related-products">
          <Container>
            <div className="idea-catalogue-section-heading">
              <div>
                <span>{collectionLabel}</span>
                <h2 className="idea-display">{copy({ en: "Related products", ar: "منتجات مرتبطة", fr: "Produits associés" })}</h2>
              </div>
            </div>
            <div className="idea-related-products-grid">
              {related.map((item) => <ProductCard key={item.id} product={item} />)}
            </div>
          </Container>
        </section>
      )}

      <section className="idea-visualizer-banner">
        <Container>
          <div>
            <span className="idea-eyebrow">IDEA Visualizer</span>
            <h2 className="idea-display">{copy({ en: "Visualize this product in your own space", ar: "شاهد المنتج داخل مساحتك", fr: "Visualisez ce produit dans votre espace" })}</h2>
            <p>{copy({
              en: "Upload a room photo and preview the selected surface before requesting a quote.",
              ar: "ارفع صورة غرفتك وعاين الخامة المختارة قبل طلب عرض السعر.",
              fr: "Importez une photo de votre pièce et prévisualisez la surface avant de demander un devis.",
            })}</p>
          </div>
          <Link to={`/ai-room-visualizer?product=${encodeURIComponent(product.id)}`}>
            <Sparkles size={18} />
            {copy({ en: "Open room visualizer", ar: "افتح مصمم الغرفة", fr: "Ouvrir le visualiseur" })}
          </Link>
        </Container>
      </section>
    </main>
  );
}
