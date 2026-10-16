import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { COLLECTIONS } from "../data/catalog";
import { HeroCarousel } from "../components/HeroCarousel";
import { HeroSearchPanel } from "../components/HeroSearchPanel";
import { ProductCard } from "../components/ProductCard";
import { FeaturedCollectionStrip } from "../components/FeaturedCollectionStrip";
import "./Home.css";
import { useCollectionDestinations } from "../components/useCollectionDestinations";

const EDITORIALS = [
  { image: "porcelain", href: "/collections/porcelain", title: { en: "Porcelain. A new perspective on space.", ar: "بورسلين. منظور جديد للمساحة.", fr: "Porcelaine. Une nouvelle perspective." }, body: { en: "Explore luminous surfaces, subtle veining and generous formats for considered interiors.", ar: "اكتشف أسطح مضيئة وعروق ناعمة ومقاسات واسعة لمساحات متناسقة.", fr: "Des surfaces lumineuses et de grands formats pour des intérieurs raffinés." } },
  { image: "ceramics", href: "/collections/ceramics", title: { en: "Ceramics. Colour with character.", ar: "سيراميك. ألوان لها شخصية.", fr: "Céramique. Des couleurs de caractère." }, body: { en: "From rich glazed walls to elegant floors, find the finish that makes a room yours.", ar: "من الحوائط اللامعة للأرضيات الأنيقة، اختار اللمسة اللي تعبّر عنك.", fr: "Des murs émaillés aux sols élégants, trouvez la finition qui vous ressemble." } },
  { image: "marble", href: "/products?material=marble", title: { en: "Marble surfaces. Naturally expressive.", ar: "أسطح رخامية. جمال بتفاصيل طبيعية.", fr: "Surfaces marbrées. Une beauté expressive." }, body: { en: "Explore marble textures and envision a distinctive finish for your space.", ar: "استكشف نقوش الرخام وتخيّل اللمسة المناسبة لمساحتك.", fr: "Explorez les textures marbrées pour imaginer votre espace." } },
];
const LOOKS = [
  { id: "stone", en: "Stone", ar: "حجر", fr: "Pierre" },
  { id: "wood", en: "Wood", ar: "خشب", fr: "Bois" },
  { id: "marble", en: "Marble", ar: "رخام", fr: "Marbre" },
  { id: "colour", en: "Colour", ar: "ألوان", fr: "Couleur" },
  { id: "pattern", en: "Pattern", ar: "نقوش", fr: "Motif" },
];
const BATH_SLUGS = ["bathroom-sets", "bathroom-units", "faucets", "shower-units", "bathtubs", "bathroom-accessories"];

export function Home() {
  const { locale, t } = useI18n();
  const { products } = useStore();
  const destinations = useCollectionDestinations();
  const text = (en: string, ar: string, fr: string) => ({ en, ar, fr })[locale];
  return (
    <div className="idea-home-editorial">
      <HeroCarousel />
      <FeaturedCollectionStrip />
      <section className="idea-home-section">
        <p className="idea-home-kicker">{text("Find your inspiration", "اكتشف إلهامك", "Trouvez votre inspiration")}</p>
        {EDITORIALS.map((item, index) => (
          <article className={`idea-home-story${index % 2 ? " idea-home-story-reverse" : ""}`} key={item.image}>
            <Link to={destinations[item.image as keyof typeof destinations]} className="idea-home-story-image" aria-label={item.title[locale]}>
              <img src={`/images/featured/${item.image}.webp`} alt={item.title[locale]} loading="lazy" width={1600} height={900} />
            </Link>
            <div className="idea-home-story-copy"><h2>{item.title[locale]}</h2><p>{item.body[locale]}</p>
              <Link className="idea-home-text-link" to={destinations[item.image as keyof typeof destinations]}>{t("action.explore")} <ArrowRight size={16} /></Link>
            </div>
          </article>
        ))}
      </section>
      <section className="idea-home-section idea-home-look-section">
        <h2 className="idea-home-centered-title">{text("Search by look", "اختار حسب الخامة", "Rechercher par aspect")}</h2>
        <div className="idea-home-looks">{LOOKS.map((look) => (
          <Link key={look.id} to={`/tile-showroom/${look.id}`}>
            <img src={`/images/featured/${look.id}.webp`} alt="" width={320} height={320} loading="lazy" />
            <span>{look[locale]}</span>
          </Link>
        ))}</div>
      </section>
      <section className="idea-home-room">
        <img src="/images/featured/wood.webp" alt={text("Warm wood-effect floor in a living room", "أرضية بتأثير خشبي في غرفة معيشة", "Sol effet bois dans un salon")} loading="lazy" width={1600} height={900} />
        <div><h2>{text("Imagine it in your home.", "تخيّلها في بيتك.", "Imaginez-le chez vous.")}</h2>
          <p>{text("Explore surfaces and plan your next space with our room designer.", "استكشف الخامات وخطّط مساحتك الجاية مع مصمم الغرف.", "Explorez les surfaces et préparez votre espace avec notre configurateur.")}</p>
          <Link className="idea-home-text-link" to="/room-designer/new">{t("action.visualize")} <ArrowRight size={16} /></Link>
        </div>
      </section>
      <section className="idea-home-section">
        <h2 className="idea-home-centered-title">{t("home.sanitary")}</h2>
        <div className="idea-home-bath-grid">{BATH_SLUGS.map((slug) => {
          const c = COLLECTIONS.find((item) => item.slug === slug)!;
          return <Link className="idea-home-bath-card" to={`/collections/${slug}`} key={slug}>
            <img src={c.image} alt={c.title[locale]} width={600} height={450} loading="lazy" />
            <span>{c.title[locale]}</span>
          </Link>;
        })}</div>
      </section>
      {products.length > 0 && <section className="idea-home-section">
        <h2 className="idea-home-centered-title">{t("home.featured")}</h2>
        <div className="idea-home-products">{products.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}</div>
        <div className="idea-home-center"><Link className="idea-home-text-link" to="/products">{t("action.browseAll")} <ArrowRight size={16} /></Link></div>
      </section>}
      <HeroSearchPanel />
      <section className="idea-home-section idea-home-quote"><h2>{t("home.bestPrice")}</h2><p>{t("home.bestPriceBody")}</p>
        <Link className="idea-home-text-link" to="/request-quote/new">{t("action.requestPrice")} <ArrowRight size={16} /></Link>
      </section>
    </div>
  );
}
