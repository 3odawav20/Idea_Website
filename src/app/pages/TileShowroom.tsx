import { useMemo, useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import surfaceMaterials from "../data/surfaceMaterials.json";
import type { Product, Locale } from "../data/types";
import "./TileShowroom.css";

/**
 * Material-face photos only. Never fall back to Product.image or look banners:
 * those images often depict rooms, gardens, houses, or furniture.
 * Supplier original.tiles are isolated product faces, and the local materials
 * are reviewed tile crops, not staged interiors.
 */
type MaterialCrop = { id: string; image: string; width: number; height: number };
const materialById = new Map(
  (surfaceMaterials as MaterialCrop[]).map((entry) => [entry.id, entry])
);
const allowed = new Set(["ceramics", "porcelain", "marble"]);
const sourceFace = (url: string) =>
  /^https:\/\/dashboard\.artceramic-egypt\.com\/uploads\/(?:medium_|large_|small_)?[^?#]+\.(?:jpg|jpeg|png|webp)$/i.test(url);
function faces(product: Product): string[] {
  const local = materialById.get(product.id);
  const supplier = product.source?.original?.tiles?.filter(sourceFace) ?? [];
  return [...new Set([...(local ? [import.meta.env.BASE_URL.replace(/\/$/, "") + local.image] : []), ...supplier])];
}
function dimension(product: Product) {
  const s = product.sizes.find((sz) =>
    Number.isFinite(sz.widthMm) && Number.isFinite(sz.heightMm) &&
    (sz.widthMm ?? 0) > 0 && (sz.heightMm ?? 0) > 0);
  return s ? { width: s.widthMm!, height: s.heightMm!, label: (s.widthMm! / 10) + " × " + (s.heightMm! / 10) + " cm" } : null;
}
type TileItem = { product: Product; photos: string[]; size: NonNullable<ReturnType<typeof dimension>> };

const words = {
  en: {
    home: "Home", kicker: "IDEA · MATERIAL LIBRARY", title: "The tile. Nothing else.",
    subtitle: "True tile faces only — no rooms, houses, gardens, furniture, or lifestyle renders.",
    search: "Search by tile name, brand, code or actual size", all: "All materials",
    ceramics: "Ceramic tiles", porcelain: "Porcelain", marble: "Natural marble",
    count: "material designs", chosen: "Selected tile", size: "Actual tile dimensions",
    faces: "Tile face", source: "Supplier tile-face photograph",
    details: "Product details", try: "Try in my room", more: "Show more tiles",
    empty: "No isolated tile photos with verified dimensions match your filters.",
    clear: "Clear filters", notice: "Each tile preserves its physical width-to-height ratio. The scale of installation in a room depends on measured surface geometry.",
    next: "Next face", previous: "Previous face", filter: "Filter material", raw: "MATERIAL ONLY",
    unavailable: "Image unavailable",
  },
  ar: {
    home: "الرئيسية", kicker: "IDEA · مكتبة الخامات", title: "البلاطة فقط. بدون ديكورات.",
    subtitle: "صور السيراميك والبلاط والخامة نفسها فقط — بدون بيوت أو غرف أو زرع أو أثاث.",
    search: "ابحث باسم البلاطة أو الشركة أو الكود أو المقاس", all: "كل الخامات",
    ceramics: "سيراميك وبلاط", porcelain: "بورسلين", marble: "رخام طبيعي",
    count: "تصميم بلاط", chosen: "البلاطة المختارة", size: "المقاس الحقيقي للبلاطة",
    faces: "وجه البلاطة", source: "صورة الخامة من المورد",
    details: "تفاصيل المنتج", try: "جرّبها في صورتك", more: "عرض خامات أكثر",
    empty: "لا توجد صور خامات منفصلة بمقاسات موثّقة تطابق البحث.",
    clear: "مسح الفلاتر", notice: "كل بلاطة معروضة بنسبة الطول إلى العرض الصحيحة للمقاس المسجل. حجم التركيب داخل الغرفة يحتاج قياس السطح الحقيقي.",
    next: "الوجه التالي", previous: "الوجه السابق", filter: "تصفية الخامات", raw: "الخامة فقط",
    unavailable: "الصورة غير متاحة",
  },
  fr: {
    home: "Accueil", kicker: "IDEA · MATÉRIAUX", title: "Le carreau, sans décor.",
    subtitle: "La matière seule — sans maisons, jardins, pièces ni mobilier.",
    search: "Chercher un nom, une marque, un code ou une taille", all: "Tous les matériaux",
    ceramics: "Carrelage céramique", porcelain: "Grès cérame", marble: "Marbre naturel",
    count: "matériaux", chosen: "Carreau sélectionné", size: "Dimensions réelles",
    faces: "Face du carreau", source: "Photographie du fournisseur",
    details: "Détails du produit", try: "Essayer dans ma pièce", more: "Afficher plus",
    empty: "Aucune photo de carreau avec dimensions vérifiées ne correspond.",
    clear: "Réinitialiser", notice: "Le rapport largeur/hauteur réel du carreau est conservé. La pose dans une pièce exige une mesure de la surface.",
    next: "Face suivante", previous: "Face précédente", filter: "Filtre matériaux", raw: "MATÉRIAU SEUL",
    unavailable: "Image indisponible",
  },
} as const;

function TileFace({ item, src, large = false, unavailable }: {
  item: TileItem; src: string; large?: boolean; unavailable: string;
}) {
  const local = materialById.get(item.product.id);
  const [orientation, setOrientation] = useState<"landscape" | "portrait" | null>(
    local ? (local.width >= local.height ? "landscape" : "portrait") : null
  );
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    setOrientation(local ? (local.width >= local.height ? "landscape" : "portrait") : null);
  }, [src, local?.width, local?.height]);
  const min = Math.min(item.size.width, item.size.height);
  const max = Math.max(item.size.width, item.size.height);
  const landscape = orientation === "landscape" ||
    (orientation === null && item.size.width > item.size.height);
  const ratio = landscape ? max / min : min / max;
  return (
    <div className={"idea-tile-face" + (large ? " idea-tile-face-large" : "")}
      style={{ width: Math.round(ratio * (large ? 310 : 188)) + "px", maxWidth: "100%", aspectRatio: String(ratio) }}>
      {failed
        ? <div className="idea-tile-face-error" role="status">{unavailable}</div>
        : <img src={src} alt={item.product.name.en + " — " + item.size.label}
            loading={large ? "eager" : "lazy"} decoding="async"
            onLoad={(event) => {
              const img = event.currentTarget;
              if (img.naturalWidth > 0 && img.naturalHeight > 0)
                setOrientation(img.naturalWidth >= img.naturalHeight ? "landscape" : "portrait");
            }}
            onError={() => setFailed(true)}
            style={{ objectFit: "cover" }} />}
    </div>
  );
}

export function TileShowroom() {
  const { lookId } = useParams<{ lookId: string }>();
  const [params, setParams] = useSearchParams();
  const { locale } = useI18n();
  const lang: Locale = locale === "ar" || locale === "fr" ? locale : "en";
  const t = words[lang];
  const { products } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [visible, setVisible] = useState(36);
  const [faceIndex, setFaceIndex] = useState(0);

  const tiles = useMemo<TileItem[]>(() => products
    .filter((p) => allowed.has(p.collection))
    .map((p) => ({ product: p, photos: faces(p), size: dimension(p) }))
    .filter((row): row is TileItem => row.photos.length > 0 && row.size !== null)
    .sort((a, b) => a.product.name.en.localeCompare(b.product.name.en)), [products]);

  const categoryCounts = useMemo(() => {
    const result = { ceramics: 0, porcelain: 0, marble: 0 };
    for (const item of tiles) result[item.product.collection as keyof typeof result] += 1;
    return result;
  }, [tiles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return tiles.filter(({ product, size }) => {
      if (category !== "all" && product.collection !== category) return false;
      // Retain the old look URLs without reintroducing staged-room imagery.
      if (lookId === "wood" && !/wood|oak|walnut/i.test(product.name.en + " " + (product.texture ?? ""))) return false;
      if (!q) return true;
      return [product.name.en, product.name.ar, product.brand, product.manufacturer,
        product.code, product.model, product.variant, size.label, product.collection]
        .filter(Boolean).some((value) => value!.toLocaleLowerCase().includes(q));
    });
  }, [tiles, query, category, lookId]);

  const wantedId = params.get("product");
  const chosen = tiles.find(({ product }) => product.id === wantedId || product.slug === wantedId) ??
    filtered[0] ?? null;
  const photo = chosen ? chosen.photos[Math.min(faceIndex, chosen.photos.length - 1)] : null;

  const choose = (item: TileItem) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("product", item.product.slug);
      return next;
    }, { replace: true });
    setFaceIndex(0);
  };
  const changeCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    setVisible(36);
    setFaceIndex(0);
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete("product");
      return next;
    }, { replace: true });
  };
  const faceCount = chosen?.photos.length ?? 0;

  return (
    <main className="idea-raw-showroom" dir={lang === "ar" ? "rtl" : "ltr"}>
      <header className="idea-raw-header">
        <Link to="/" className="idea-raw-back">
          {lang === "ar" ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          {t.home}
        </Link>
        <span className="idea-raw-overline">{t.kicker}</span>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      <section className="idea-raw-controls" aria-label={t.filter}>
        <div className="idea-raw-search">
          <Search size={19} aria-hidden="true" />
          <input type="search" value={query} placeholder={t.search}
            aria-label={t.search}
            onChange={(event) => { setQuery(event.target.value); setVisible(36); setFaceIndex(0); }} />
          {query && <button type="button" onClick={() => setQuery("")} aria-label={t.clear}><X size={17} /></button>}
        </div>
        <div className="idea-raw-categories" role="group" aria-label={t.filter}>
          <button type="button" className={category === "all" ? "is-active" : ""} onClick={() => changeCategory("all")}>
            {t.all} <b>{tiles.length}</b>
          </button>
          {(["ceramics", "porcelain", "marble"] as const)
            .filter((key) => categoryCounts[key] > 0)
            .map((key) => (
              <button type="button" key={key}
                className={category === key ? "is-active" : ""} onClick={() => changeCategory(key)}>
                {t[key]} <b>{categoryCounts[key]}</b>
              </button>
            ))}
        </div>
      </section>

      {chosen && photo && (
        <section className="idea-raw-spotlight" aria-label={t.chosen}>
          <div className="idea-raw-large-material">
            <span className="idea-raw-corner-mark">{t.raw}</span>
            <TileFace item={chosen} src={photo} large unavailable={t.unavailable} />
            {faceCount > 1 && (
              <div className="idea-raw-face-navigation">
                <button type="button" aria-label={t.previous} onClick={() => setFaceIndex((n) => (n - 1 + faceCount) % faceCount)}>
                  <ChevronLeft size={18} />
                </button>
                <span>{faceIndex + 1} / {faceCount}</span>
                <button type="button" aria-label={t.next} onClick={() => setFaceIndex((n) => (n + 1) % faceCount)}>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
          <div className="idea-raw-info">
            <span className="idea-raw-info-category">
              {t[chosen.product.collection as "ceramics" | "porcelain" | "marble"]} · {chosen.product.brand}
            </span>
            <h2>{chosen.product.name[lang]}</h2>
            <div className="idea-raw-size-box">
              <span>{t.size}</span>
              <strong dir="ltr">{chosen.size.label}</strong>
            </div>
            {chosen.product.model && <p className="idea-raw-model">{chosen.product.model}</p>}
            <p className="idea-raw-source">{t.source}</p>
            {faceCount > 1 && (
              <div className="idea-raw-face-thumbnails" aria-label={t.faces}>
                {chosen.photos.slice(0, 14).map((src, index) => (
                  <button type="button" className={index === faceIndex ? "selected" : ""}
                    key={src} aria-label={t.faces + " " + (index + 1)}
                    onClick={() => setFaceIndex(index)}>
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
            <div className="idea-raw-actions">
              <Link to={"/product/" + chosen.product.slug}>{t.details}</Link>
              <Link to={"/ai-room-visualizer?product=" + encodeURIComponent(chosen.product.id)}>{t.try}</Link>
            </div>
            <p className="idea-raw-scale-note">{t.notice}</p>
          </div>
        </section>
      )}

      <div className="idea-raw-results-header">
        <span><SlidersHorizontal size={16} /> {filtered.length} {t.count}</span>
      </div>

      {filtered.length ? (
        <>
          <section className="idea-raw-grid">
            {filtered.slice(0, visible).map((item) => (
              <button key={item.product.id} type="button"
                className={"idea-raw-card" + (item.product.id === chosen?.product.id ? " is-selected" : "")}
                onClick={() => choose(item)}
                aria-pressed={item.product.id === chosen?.product.id}>
                <div className="idea-raw-card-image">
                  <TileFace item={item} src={item.photos[0]} unavailable={t.unavailable} />
                  {item.product.id === chosen?.product.id && <Check className="idea-raw-selected-check" size={18} />}
                </div>
                <div className="idea-raw-card-info">
                  <strong>{item.product.name[lang]}</strong>
                  <span>{item.product.brand}</span>
                  <b dir="ltr">{item.size.label}</b>
                </div>
              </button>
            ))}
          </section>
          {visible < filtered.length &&
            <button type="button" className="idea-raw-load" onClick={() => setVisible((n) => n + 36)}>{t.more}</button>}
        </>
      ) : (
        <div className="idea-raw-empty">
          <p>{t.empty}</p>
          <button type="button" onClick={() => { setQuery(""); changeCategory("all"); }}>{t.clear}</button>
        </div>
      )}
    </main>
  );
}
