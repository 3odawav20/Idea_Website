import type { CSSProperties } from "react";
import { Link } from "react-router";
import { ArrowRight, Layers, FileText, Users } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { COLLECTIONS } from "../data/catalog";
import type { Product } from "../data/types";
import { HeroBrandFilm } from "../components/HeroBrandFilm";
import { HeroSearchPanel } from "../components/HeroSearchPanel";
import { distinctStorefrontProducts } from "../data/storefrontDistinct";
import { SurfaceMaterialStrip } from "../components/SurfaceMaterialStrip";
import { FeaturedCollectionStrip } from "../components/FeaturedCollectionStrip";
import { Material3DProductCard, FEATURED_PRODUCT_IDS } from "./Products";
import "./Products.css";
import "./Home.css";
import "../components/Discovery.css";
import { DESTINATIONS } from "../data/discovery";
import { GUIDES } from "./Resources";
import { useCollectionDestinations } from "../components/useCollectionDestinations";
import SocialCards from "@/components/ui/card-fan-carousel";
import CollapsingCards from "@/components/ui/cue-collapsing-cards-accordion";
import CardGrid, { type CardGridItem } from "@/components/CardGrid";
import CircularGallery, { type GalleryItem } from "@/components/ui/circular-gallery";

const EDITORIALS = [
  { image: "porcelain", href: "/collections/porcelain", title: { en: "Porcelain. A new perspective on space.", ar: "بورسلين. منظور جديد للمساحة.", fr: "Porcelaine. Une nouvelle perspective." }, body: { en: "Explore luminous surfaces, subtle veining and generous formats for considered interiors.", ar: "اكتشف أسطح مضيئة وعروق ناعمة ومقاسات واسعة لمساحات متناسقة.", fr: "Des surfaces lumineuses et de grands formats pour des intérieurs raffinés." } },
  { image: "ceramics", href: "/collections/ceramics", title: { en: "Ceramics. Colour with character.", ar: "سيراميك. ألوان لها شخصية.", fr: "Céramique. Des couleurs de caractère." }, body: { en: "From rich glazed walls to elegant floors, find the finish that makes a room yours.", ar: "من الحوائط اللامعة للأرضيات الأنيقة، اختار اللمسة اللي تعبّر عنك.", fr: "Des murs émaillés aux sols élégants, trouvez la finition qui vous ressemble." } },
  { image: "marble", href: "/products?material=marble", title: { en: "Marble surfaces. Naturally expressive.", ar: "أسطح رخامية. جمال بتفاصيل طبيعية.", fr: "Surfaces marbrées. Une beauté expressive." }, body: { en: "Explore marble textures and envision a distinctive finish for your space.", ar: "استكشف نقوش الرخام وتخيّل اللمسة المناسبة لمساحتك.", fr: "Explorez les textures marbrées pour imaginer votre espace." } },
];
const BATH_SLUGS = ["sanitary-ware", "bathroom-sets", "bathroom-units", "faucets", "shower-units", "bathtubs", "bathroom-accessories"];

const HOME_FEATURED_IDS = ["93", "59", "58", "67"];

export function Home() {
  const { locale, t } = useI18n();
  const { products } = useStore();
  // Curated diverse-color 3D material spheres (Black, Emerald Green, Ocean Blue, Warm Golden Beige).
  const byId = new Map(products.map((p) => [p.id, p]));
  const pickedFeatured = HOME_FEATURED_IDS.map((id) => byId.get(id)).filter((p): p is Product => p !== undefined);
  const featuredProducts =
    pickedFeatured.length === HOME_FEATURED_IDS.length
      ? pickedFeatured
      : FEATURED_PRODUCT_IDS.map((id) => byId.get(id)).filter((p): p is Product => p !== undefined).length > 0
        ? FEATURED_PRODUCT_IDS.map((id) => byId.get(id)).filter((p): p is Product => p !== undefined)
        : distinctStorefrontProducts(products).slice(0, 4);
  const destinations = useCollectionDestinations();
  const text = (en: string, ar: string, fr: string) => ({ en, ar, fr })[locale];
  const exploreIdeaCards: CardGridItem[] = [
    {
      id: "projects",
      title: text("Projects & architectural concepts", "المشروعات والأفكار المعمارية", "Projets & concepts architecturaux"),
      description: text(
        "Discover curated project inspirations, spatial concepts and surface applications across modern interiors.",
        "اكتشف أفكار المشروعات وتطبيقات الخامات والمساحات المعمارية الحديثة.",
        "Découvrez nos concepts d’aménagement et applications de surfaces."
      ),
      ctaText: text("Explore projects", "استكشف المشروعات", "Explorer les projets"),
      image: "/images/featured/porcelain.webp",
      href: "/projects",
    },
    {
      id: "downloads",
      title: text("Catalogues & product index", "الكتالوجات وفهرس المنتجات", "Catalogues & index produits"),
      description: text(
        "Take the current verified product index, dimensions and technical surface specifications with you.",
        "حمّل فهرس المنتجات الموثق بالمقاسات والمواصفات الفنية الكاملة للخامات.",
        "Téléchargez l’index produits actuel avec dimensions et spécifications."
      ),
      ctaText: text("View downloads", "تصفح التنزيلات", "Voir les téléchargements"),
      image: "/images/featured/marble.webp",
      href: "/downloads",
    },
    {
      id: "contact",
      title: text("Contact, quotes & appointments", "التواصل والمواعيد وعروض الأسعار", "Contact, devis & rendez-vous"),
      description: text(
        "Connect with our team for private project quotations, material enquiries and showroom availability.",
        "تواصل معنا لطلبات عروض الأسعار الخاصة والاستفسارات الفنية وحالة حجز المواعيد.",
        "Contactez-nous pour vos demandes de devis privés et rendez-vous."
      ),
      ctaText: text("Get in touch", "تواصل معنا", "Nous contacter"),
      image: "/images/featured/ceramics.webp",
      href: "/contact",
    },
  ];
  const sanitaryGalleryItems: GalleryItem[] = BATH_SLUGS.map((slug) => {
    const c = COLLECTIONS.find((item) => item.slug === slug)!;
    return {
      common: c.title[locale],
      binomial: c.blurb[locale],
      href: `/collections/${slug}`,
      photo: {
        url: c.image,
        text: c.title[locale],
        pos: "center",
        by: text("Explore collection →", "تصفح القسم ←", "Voir la collection →"),
      },
    };
  });
  const designGuideCards = [
    {
      idx: 1,
      wordmark: text("Finish", "التشطيب", "Finition"),
      title: GUIDES[0].title[locale],
      subtitle: GUIDES[0].body[locale],
      img: `/images/featured/${GUIDES[0].image}.webp`,
      href: `/journal/${GUIDES[0].id}`,
    },
    {
      idx: 2,
      wordmark: text("Format", "المقاس", "Format"),
      title: GUIDES[1].title[locale],
      subtitle: GUIDES[1].body[locale],
      img: `/images/featured/${GUIDES[1].image}.webp`,
      href: `/journal/${GUIDES[1].id}`,
    },
    {
      idx: 3,
      wordmark: text("Palette", "الألوان", "Palette"),
      title: GUIDES[2].title[locale],
      subtitle: GUIDES[2].body[locale],
      img: `/images/featured/${GUIDES[2].image}.webp`,
      href: `/journal/${GUIDES[2].id}`,
    },
    {
      idx: 4,
      wordmark: text("Marble", "الرخام", "Marbre"),
      title: text("Marble & natural light", "الرخام والإضاءة الطبيعية", "Marbre et lumière naturelle"),
      subtitle: text(
        "Explore how subtle veining and surface reflection interact with daylight across open interiors.",
        "اكتشف كيف تتفاعل عروق الرخام وانعكاسات الأسطح مع الإضاءة الطبيعية في المساحات المفتوحة.",
        "Découvrez comment le veinage et la lumière naturelle interagissent dans vos espaces."
      ),
      img: "/images/featured/marble.webp",
      href: "/glossary",
    },
    {
      idx: 5,
      wordmark: text("Stone", "الحجر", "Pierre"),
      title: text("Indoor to outdoor continuity", "انسيابية المساحات الداخلية والخارجية", "Continuité intérieur et extérieur"),
      subtitle: text(
        "Coordinate textured stone surfaces and slip-verified finishes for seamless architectural transitions.",
        "نسّق الأسطح الحجرية والتشطيبات المعتمدة لتحقيق امتداد بصري متناغم بين الداخل والخارج.",
        "Harmonisez les surfaces effet pierre pour une transition fluide entre intérieur et extérieur."
      ),
      img: "/images/featured/stone.webp",
      href: "/journal",
    },
  ];
  const destinationFanCards = [
    ...DESTINATIONS.map((d) => ({
      imgUrl: `/images/featured/${d.image}.webp`,
      alt: d.label[locale],
      kicker: d.kicker[locale],
      label: d.label[locale],
      subtitle: d.subtitle[locale],
      linkUrl: `/inspiration/${d.id}`,
    })),
    {
      imgUrl: "/images/featured/pattern.webp",
      alt: text("Coastal Veranda & Lounge", "جلسة خارجية بإطلالة مفتوحة", "Véranda & salon extérieur"),
      kicker: text("All Surfaces", "استكشف كل الخامات", "Toutes les surfaces"),
      label: text("Coastal Veranda & Lounge", "جلسة خارجية بإطلالة مفتوحة", "Véranda & salon extérieur"),
      subtitle: text(
        "Browse all porcelain, ceramic & marble collections",
        "تصفح كل مجموعات البورسلين والسيراميك والرخام",
        "Parcourir toutes les collections de surfaces"
      ),
      ariaLabel: text("Browse all materials", "تصفح كل الخامات", "Voir tous les matériaux"),
      linkUrl: "/products",
    },
  ];
  return (
    <div className="idea-home-editorial">
      <HeroBrandFilm />
      <div className="idea-usp">{[
        {icon:Layers,to:"/products",title:text("Premium surface inspiration","إلهام بخامات فاخرة","Inspiration haut de gamme"),sub:text("Explore materials & finishes","اكتشف الخامات والتشطيبات","Matières & finitions")},
        {icon:FileText,to:"/request-quote/new",title:text("Private quote requests","طلبات عروض أسعار خاصة","Devis privés"),sub:text("Specify your project needs","حدد احتياجات مشروعك","Précisez votre projet")},
        {icon:Users,to:"/register/business",title:text("For professionals","للمحترفين والشركات","Pour les professionnels"),sub:text("Explore business registration","اكتشف تسجيل الشركات","Inscription professionnelle")},
      ].map(item=><Link to={item.to} key={item.to}><item.icon size={22}/><span>{item.title}<small>{item.sub}</small></span></Link>)}</div>
      <div className="idea-home-finder-scene"><HeroSearchPanel /></div>
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
      <SurfaceMaterialStrip />
      <section className="idea-home-section">
        <h2 className="idea-home-centered-title">{text("Search your destination", "اختار مساحتك", "Choisissez votre espace")}</h2>
        <SocialCards cards={destinationFanCards} />
      </section>
      <section className="idea-home-section"><article className="idea-home-story"><Link className="idea-home-story-image" to="/showrooms"><img src="/images/featured/stone.webp" alt={text("Online surface showroom", "معرض الخامات الإلكتروني", "Showroom virtuel")} loading="lazy" width={1600} height={900}/></Link><div className="idea-home-story-copy"><h2>{text("Your showroom experience.", "تجربة المعرض بطريقتك.", "Votre expérience showroom.")}</h2><p>{text("Discover surfaces in the interactive showroom and explore showroom information.", "اكتشف الخامات في المعرض التفاعلي وتصفح معلومات المعارض.", "Découvrez les surfaces dans notre showroom interactif.")}</p><Link className="idea-home-text-link" to="/showrooms">{text("Explore showrooms", "استكشف المعارض", "Explorer les showrooms")} <ArrowRight size={16}/></Link></div></article></section>
      <section className="idea-home-section">
        <CardGrid
          heading={text("Explore the world of IDEA", "استكشف عالم IDEA", "Explorer l’univers IDEA")}
          cards={exploreIdeaCards}
        />
      </section>
      <section className="idea-home-section">
        <h2 className="idea-home-centered-title">{text("Design notes & guides", "أفكار وأدلة التصميم", "Conseils & guides")}</h2>
        <CollapsingCards cards={designGuideCards} ctaLabel={text("Read guide", "اقرأ الدليل", "Lire le guide")} />
        <div className="idea-home-center">
          <Link className="idea-home-text-link" to="/journal">
            {text("All news & guides", "كل الأخبار والأدلة", "Actualités & guides")} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="idea-home-section"><div className="idea-home-newsletter"><div><h2>{text("Stay inspired.", "خليك دايمًا مُلهم.", "Gardez l’inspiration.")}</h2><p>{text("Read the latest IDEA guides. Email subscriptions will be available once the mailing service is connected.", "تابع أحدث أدلة IDEA. الاشتراك البريدي هيتاح بعد ربط خدمة المراسلات.", "Consultez les guides IDEA. Les emails seront disponibles après connexion du service.")}</p></div><Link className="idea-home-text-link" to="/updates">{text("Updates", "التحديثات", "Actualités")} <ArrowRight size={16}/></Link></div></section>
      <section className="idea-home-section">
        <h2 className="idea-home-centered-title">{t("home.sanitary")}</h2>
        <div className="w-full h-[440px] sm:h-[500px] md:h-[560px] relative overflow-hidden">
          <CircularGallery items={sanitaryGalleryItems} radius={460} autoRotateSpeed={0.04} />
        </div>
      </section>
      {featuredProducts.length > 0 && (
        <section className="idea-home-section idea-products-showroom-section">
          <h2 className="idea-home-centered-title">{t("home.featured")}</h2>
          <div
            className="idea-material-catalogue"
            style={{ minHeight: 0, "--mc-orb": "clamp(148px, 14vw, 200px)" } as CSSProperties}
          >
            <div className="idea-material-grid">
              {featuredProducts.map((p) => (
                <Material3DProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
          <div className="idea-home-center">
            <Link className="idea-home-text-link" to="/products">
              {t("action.browseAll")} <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}
      <section className="idea-home-section idea-home-quote"><h2>{text("Request a private quote", "اطلب عرض سعر خاص", "Demandez un devis privé")}</h2><p>{t("home.bestPriceBody")}</p>
        <Link className="idea-home-text-link" to="/request-quote/new">{t("action.requestPrice")} <ArrowRight size={16} /></Link>
      </section>
    </div>
  );
}
