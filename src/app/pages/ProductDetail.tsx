import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ChevronRight,
  FileText,
  GitCompare,
  Heart,
  Images,
  Search,
  Sparkles,
  Maximize2, X, ZoomIn, ZoomOut,
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x:0,y:0});
  const pointer = useRef<{x:number;y:number;px:number;py:number}|null>(null);
  const lightboxButton = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [failedImages, setFailedImages] = useState<number[]>([]);
  const [adminPrice, setAdminPrice] = useState<{ price: number; currency: string } | null>(null);

  useEffect(() => {
    setActiveImg(0);
    setFailedImages([]);
    setLightboxOpen(false);
    setZoom(1);
    setPan({x:0,y:0});
  }, [slug]);
  useEffect(() => {
    if (lightboxOpen) dialogRef.current?.focus();
    else if (lightboxButton.current && document.activeElement === document.body) lightboxButton.current.focus();
  }, [lightboxOpen]);

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

  // Product material imagery always comes from supplier-labelled bare tile faces.
  const tileFaces = (product.source?.original?.tiles || []).filter((url) =>
    /^https:\/\/[^\s]+\.(?:png|jpe?g|webp)(?:\?[^\s]*)?$/i.test(url)
  );
  const gallery = [...new Set(tileFaces.length ? tileFaces : (product.gallery?.length ? product.gallery : [product.image]))];
  const heroImage = gallery[activeImg] || gallery[0] || product.image;
  const visibleImage = gallery[activeImg] || heroImage;
  const activeImageFailed = failedImages.includes(activeImg);
  const isTile = product.collection === "ceramics" || product.collection === "porcelain" || product.collection === "marble";
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
    <main className="idea-catalogue-detail">
      <section className="idea-material-hero" aria-labelledby="product-title">
        <Container className="idea-material-hero-layout">
          <div className="idea-material-hero-media">
            <button type="button" className="idea-material-hero-photo" ref={lightboxButton}
              aria-label={copy({ en: "Enlarge material image", ar: "تكبير صورة الخامة", fr: "Agrandir le matériau" })}
              onClick={() => { setZoom(1); setPan({x:0,y:0}); setLightboxOpen(true); }}>
              {failedImages.includes(activeImg)
                ? <span className="idea-image-unavailable">{copy({ en: "Source photograph unavailable", ar: "صورة المصدر غير متاحة", fr: "Photo indisponible" })}</span>
                : <img src={heroImage} alt={product.name[locale]} onError={() => setFailedImages(a=>a.includes(activeImg)?a:[...a,activeImg])} />}
              <span className="idea-material-zoom-hint"><Maximize2 size={16}/>{copy({ en: "View full size", ar: "تكبير الصورة", fr: "Agrandir" })}</span>
            </button>
            <div className="idea-material-face-selector" aria-label={copy({en:"Tile faces",ar:"أوجه البلاطة",fr:"Faces du carreau"})}>
              {gallery.slice(0,8).map((face,index)=><button type="button" key={face} aria-pressed={activeImg===index}
                className={activeImg===index?"active":""} aria-label={`Face ${index+1}`} onClick={()=>setActiveImg(index)}>
                <img src={face} alt="" loading="lazy"/>
              </button>)}
            </div>
            <p className="idea-material-image-note">{tileFaces.length
              ? copy({en:"Source tile faces — no architectural scenes",ar:"وجوه البلاطات الأصلية — بدون صور غرف",fr:"Faces du carrelage du catalogue"})
              : copy({en:"Dedicated material-face image not verified",ar:"صورة الخامة المنفصلة غير موثقة",fr:"Image autonome non vérifiée"})}</p>
          </div>
          <div className="idea-material-hero-content">
            <span className="idea-material-overline">IDEA / MATERIAL COLLECTION</span>
            <span className="idea-material-brand">{product.manufacturer || sourceFallback} · {collectionLabel}</span>
            <h1 id="product-title" className="idea-display">{product.name[locale]}</h1>
            <p>{product.description || [product.texture,product.finish,product.application].filter(Boolean).join(" · ") || collectionLabel}</p>
            <dl className="idea-material-summary">
              {identitySpecs.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              {product.sizes.length>0&&<div><dt>{t("label.sizes")}</dt><dd>{product.sizes.map(x=>x.label).join(" · ")}</dd></div>}
              {product.finish&&<div><dt>{t("label.finish")}</dt><dd>{product.finish}</dd></div>}
            </dl>
            <div className="idea-material-hero-actions">
              <Link to={`/ai-room-visualizer?product=${encodeURIComponent(product.id)}`}><Sparkles size={18}/>{copy({en:"Try in my room",ar:"جرّبها في غرفتي",fr:"Voir dans ma pièce"})}</Link>
              <button type="button" onClick={()=>addToQuote(product.id,unit)}><FileText size={17}/>{copy({en:"Request private quote",ar:"طلب عرض سعر خاص",fr:"Demander un devis privé"})}</button>
            </div>
            <small>{copy({en:"Prices stay private. Unverified technical fields are not invented.",ar:"الأسعار خاصة. لا تُضاف مواصفات غير موثقة.",fr:"Les prix sont privés; aucune spécification inventée."})}</small>
            {session?.role==="admin"&&adminPrice&&<div className="idea-admin-price"><span>{t("price.admin")}</span><strong>{new Intl.NumberFormat("en-EG",{style:"currency",currency:adminPrice.currency}).format(adminPrice.price)}</strong></div>}
          </div>
        </Container>
      </section>

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
              en: "Specifications shown are limited to the verified catalogue data supplied by the manufacturer.",
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
            {activeImageFailed ? (
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

      {lightboxOpen&&(
        <div className="idea-material-lightbox" role="dialog" aria-modal="true"
          aria-label={copy({en:"Material image viewer",ar:"عارض صورة الخامة",fr:"Visionneuse du matériau"})}
          ref={dialogRef} tabIndex={-1} onKeyDown={e=>{
            if(e.key==="Escape"){e.preventDefault();setLightboxOpen(false);lightboxButton.current?.focus()}
            if(e.key==="Tab"){const controls=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button"));const i=controls.indexOf(document.activeElement as HTMLButtonElement);if(e.shiftKey&&i<=0){e.preventDefault();controls.at(-1)?.focus()}else if(!e.shiftKey&&i===controls.length-1){e.preventDefault();controls[0]?.focus()}}
          }}>
          <div className="idea-material-lightbox-controls">
            <button type="button" onClick={()=>{setZoom(z=>Math.max(1,z-.25));setPan({x:0,y:0})}} aria-label="Zoom out"><ZoomOut/></button>
            <span>{Math.round(zoom*100)}%</span>
            <button type="button" onClick={()=>setZoom(z=>Math.min(4,z+.25))} aria-label="Zoom in"><ZoomIn/></button>
            <button type="button" onClick={()=>{setLightboxOpen(false);lightboxButton.current?.focus()}} aria-label={copy({en:"Close viewer",ar:"إغلاق",fr:"Fermer"})}><X/></button>
          </div>
          <div className="idea-material-lightbox-stage" onPointerDown={e=>{if(zoom>1){e.currentTarget.setPointerCapture(e.pointerId);pointer.current={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y}}}}
            onPointerMove={e=>{if(pointer.current&&zoom>1)setPan({x:pointer.current.px+e.clientX-pointer.current.x,y:pointer.current.py+e.clientY-pointer.current.y})}}
            onPointerUp={()=>{pointer.current=null}} onPointerCancel={()=>{pointer.current=null}}>
            <img src={heroImage} alt={product.name[locale]} draggable={false}
              style={{transform:`translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}} />
          </div>
        </div>
      )}

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
                        <img src={item.image} alt={item.name[locale]} loading="lazy" />
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
