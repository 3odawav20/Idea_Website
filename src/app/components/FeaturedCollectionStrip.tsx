import { useMemo } from "react";
import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import CurvedLensCarousel, { type LensSlide } from "@/components/ui/3d-curved-carousel";
import { useI18n } from "../i18n/i18n";
import "./FeaturedCollectionStrip.css";
import { useCollectionDestinations } from "./useCollectionDestinations";

type Locale = "en" | "ar" | "fr";
type Text = Record<Locale, string>;
type Look = { image: string; href: string | "marble" | "ceramics" | "porcelain" | "tiles"; title: Text; kicker: Text; caption: Text };

const LOOKS: Look[] = [
  { image: "/images/featured/marble.webp", href: "marble", title: { en: "Marble", ar: "رخام", fr: "Marbre" }, kicker: { en: "Natural stone", ar: "حجر طبيعي", fr: "Pierre naturelle" }, caption: { en: "Deep veining and a quiet sheen for statement walls and floors.", ar: "عروق عميقة ولمعة هادئة لحوائط وأرضيات لافتة.", fr: "Veines profondes et éclat discret pour murs et sols." } },
  { image: "/images/featured/porcelain.webp", href: "porcelain", title: { en: "Porcelain", ar: "بورسلين", fr: "Porcelaine" }, kicker: { en: "Large format", ar: "مقاسات كبيرة", fr: "Grand format" }, caption: { en: "Seamless slabs that stay sharp in busy, everyday spaces.", ar: "ألواح متصلة تحافظ على شكلها في المساحات اليومية.", fr: "Des dalles continues qui restent nettes au quotidien." } },
  { image: "/images/featured/wood.webp", href: "/products", title: { en: "Wood Effect", ar: "تأثير الخشب", fr: "Effet bois" }, kicker: { en: "Warm textures", ar: "ملمس دافئ", fr: "Textures chaudes" }, caption: { en: "The grain of timber with the strength of tile.", ar: "شكل الخشب الطبيعي بقوة البلاط.", fr: "Le grain du bois avec la résistance du carrelage." } },
  { image: "/images/featured/ceramics.webp", href: "ceramics", title: { en: "Ceramics", ar: "سيراميك", fr: "Céramiques" }, kicker: { en: "Everyday classics", ar: "كلاسيكيات يومية", fr: "Classiques" }, caption: { en: "Glazes and finishes for kitchens, baths and beyond.", ar: "طلاءات وتشطيبات للمطابخ والحمامات وأكثر.", fr: "Émaux et finitions pour cuisines et salles de bains." } },
  { image: "/images/featured/pattern.webp", href: "/products", title: { en: "Pattern", ar: "نقوش", fr: "Motifs" }, kicker: { en: "Graphic surfaces", ar: "أسطح جرافيك", fr: "Surfaces graphiques" }, caption: { en: "Encaustic looks and geometry that set the tone of a room.", ar: "نقوش وأشكال هندسية تحدد طابع المكان.", fr: "Des motifs et géométries qui donnent le ton." } },
  { image: "/images/featured/tiles.webp", href: "tiles", title: { en: "Tiles", ar: "بلاط", fr: "Carrelage" }, kicker: { en: "Every size", ar: "كل المقاسات", fr: "Toutes tailles" }, caption: { en: "From mosaics to metre-wide formats, laid your way.", ar: "من الموزاييك للمقاسات الكبيرة، بالطريقة اللي تحبها.", fr: "De la mosaïque au grand format, posé à votre façon." } },
  { image: "/images/featured/stone.webp", href: "/products", title: { en: "Stone", ar: "حجر", fr: "Pierre" }, kicker: { en: "Raw and honed", ar: "خام ومصقول", fr: "Brute et adoucie" }, caption: { en: "Earthy tones and natural relief for calm interiors.", ar: "ألوان ترابية وملمس طبيعي لمساحات هادئة.", fr: "Tons terreux et relief naturel pour des intérieurs calmes." } },
  { image: "/images/featured/colour.webp", href: "/products", title: { en: "Colour", ar: "ألوان", fr: "Couleur" }, kicker: { en: "Bold palettes", ar: "ألوان جريئة", fr: "Palettes audacieuses" }, caption: { en: "Saturated glazes for spaces with personality.", ar: "ألوان مشبعة لمساحات ليها شخصية.", fr: "Des émaux saturés pour des espaces de caractère." } },
  { image: "/images/category-covers/marble-v2.webp", href: "marble", title: { en: "Marble Living", ar: "معيشة بالرخام", fr: "Salon marbre" }, kicker: { en: "Living rooms", ar: "غرف المعيشة", fr: "Séjours" }, caption: { en: "Book-matched slabs framing the heart of the home.", ar: "ألواح متطابقة تحيط بقلب البيت.", fr: "Des dalles appareillées au cœur de la maison." } },
  { image: "/images/category-covers/ceramics-v2.webp", href: "ceramics", title: { en: "Ceramic Kitchens", ar: "مطابخ سيراميك", fr: "Cuisines céramique" }, kicker: { en: "Kitchens", ar: "المطابخ", fr: "Cuisines" }, caption: { en: "Easy-clean surfaces that age beautifully.", ar: "أسطح سهلة التنظيف وتعيش طويلًا.", fr: "Des surfaces faciles à entretenir qui vieillissent bien." } },
  { image: "/images/category-covers/porcelain-v2.webp", href: "porcelain", title: { en: "Porcelain Suites", ar: "أجنحة بورسلين", fr: "Suites porcelaine" }, kicker: { en: "Bathrooms", ar: "الحمامات", fr: "Salles de bains" }, caption: { en: "Spa-calm bathrooms in a single continuous surface.", ar: "حمامات هادئة بسطح واحد متصل.", fr: "Des salles de bains apaisées en surface continue." } },
  { image: "/images/category-covers/tiles-v2.webp", href: "tiles", title: { en: "Tiled Spaces", ar: "مساحات بالبلاط", fr: "Espaces carrelés" }, kicker: { en: "Open plan", ar: "مساحات مفتوحة", fr: "Espaces ouverts" }, caption: { en: "Rhythm and texture across floors and walls.", ar: "إيقاع وملمس على الأرضيات والحوائط.", fr: "Rythme et texture sur sols et murs." } },
  { image: "/images/materials/42.webp", href: "/products", title: { en: "Onyx Glow", ar: "توهج الأونيكس", fr: "Éclat d’onyx" }, kicker: { en: "Material study", ar: "دراسة خامة", fr: "Étude matière" }, caption: { en: "Translucent bands of colour, up close.", ar: "طبقات لونية شبه شفافة عن قرب.", fr: "Des bandes de couleur translucides, de près." } },
  { image: "/images/materials/93.webp", href: "/products", title: { en: "Terrazzo", ar: "تيرازو", fr: "Terrazzo" }, kicker: { en: "Material study", ar: "دراسة خامة", fr: "Étude matière" }, caption: { en: "Chips of stone set in a soft, playful field.", ar: "قطع حجر صغيرة في خلفية ناعمة ومرحة.", fr: "Éclats de pierre dans un fond doux et ludique." } },
  { image: "/images/materials/146.webp", href: "/products", title: { en: "Travertine", ar: "ترافرتين", fr: "Travertin" }, kicker: { en: "Material study", ar: "دراسة خامة", fr: "Étude matière" }, caption: { en: "Sun-warmed layers with natural pores.", ar: "طبقات دافئة بمسام طبيعية.", fr: "Des strates chaudes aux pores naturels." } },
  { image: "/images/materials/190.webp", href: "/products", title: { en: "Dark Slate", ar: "إردواز داكن", fr: "Ardoise sombre" }, kicker: { en: "Material study", ar: "دراسة خامة", fr: "Étude matière" }, caption: { en: "Matte depth for moody, modern rooms.", ar: "عمق مطفي لمساحات عصرية بطابع خاص.", fr: "Une profondeur mate pour des pièces modernes." } },
];

const COPY = {
  en: { title: "Featured Collections", sub: "Discover the effect, colour or space that inspires you.", hint: "Drag to explore", previous: "Previous collection", next: "Next collection", cta: "Explore collection" },
  ar: { title: "مجموعات مميزة", sub: "اكتشف الخامة واللون والمساحة اللي تلهمك.", hint: "اسحب للاستكشاف", previous: "المجموعة السابقة", next: "المجموعة التالية", cta: "استكشف المجموعة" },
  fr: { title: "Collections à la une", sub: "Découvrez l’effet, la couleur ou l’espace qui vous inspire.", hint: "Faites glisser", previous: "Collection précédente", next: "Collection suivante", cta: "Voir la collection" },
};

export function FeaturedCollectionStrip() {
  const { locale } = useI18n();
  const lang = locale as Locale;
  const copy = COPY[lang];
  const destinations = useCollectionDestinations();
  const slides = useMemo<LensSlide[]>(
    () => LOOKS.map((look) => ({ image: look.image, title: look.title[lang], kicker: look.kicker[lang], caption: look.caption[lang], alt: look.title[lang] })),
    [lang],
  );
  const hrefFor = (i: number) => {
    const href = LOOKS[i].href;
    return href in destinations ? destinations[href as keyof typeof destinations] : href;
  };

  return (
    <section className="idea-featured" aria-label={copy.title}>
      <header className="idea-featured-heading">
        <h2>{copy.title}</h2>
        <p>{copy.sub}</p>
      </header>
      <div className="idea-featured-lens">
        <CurvedLensCarousel
          slides={slides}
          label="IDEA"
          hint={copy.hint}
          dir={lang === "ar" ? "rtl" : "ltr"}
          background="transparent"
          ink="var(--idea-text)"
          accent="#fd6401"
          height="clamp(640px, 94vh, 880px)"
          previousLabel={copy.previous}
          nextLabel={copy.next}
          renderAction={(_, i) => (
            <Link className="idea-featured-cta" to={hrefFor(i)}>
              {copy.cta}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          )}
        />
      </div>
    </section>
  );
}
