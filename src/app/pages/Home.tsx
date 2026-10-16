import { Link } from "react-router";
import { ArrowRight, Layers, FileText, Sparkles, Users, MapPin, Play, FolderOpen, Download } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { COLLECTIONS } from "../data/catalog";
import { HeroCarousel } from "../components/HeroCarousel";
import { HeroSearchPanel } from "../components/HeroSearchPanel";
import { ProductCard } from "../components/ProductCard";
import { SurfaceMaterialStrip } from "../components/SurfaceMaterialStrip";
import { FeaturedCollectionStrip } from "../components/FeaturedCollectionStrip";
import "./Home.css";
import "../components/Discovery.css";
import { LOOKS, DESTINATIONS } from "../data/discovery";
import { GUIDES } from "./Resources";
import { useCollectionDestinations } from "../components/useCollectionDestinations";

const EDITORIALS = [
  { image: "porcelain", href: "/collections/porcelain", title: { en: "Porcelain. A new perspective on space.", ar: "بورسلين. منظور جديد للمساحة.", fr: "Porcelaine. Une nouvelle perspective." }, body: { en: "Explore luminous surfaces, subtle veining and generous formats for considered interiors.", ar: "اكتشف أسطح مضيئة وعروق ناعمة ومقاسات واسعة لمساحات متناسقة.", fr: "Des surfaces lumineuses et de grands formats pour des intérieurs raffinés." } },
  { image: "ceramics", href: "/collections/ceramics", title: { en: "Ceramics. Colour with character.", ar: "سيراميك. ألوان لها شخصية.", fr: "Céramique. Des couleurs de caractère." }, body: { en: "From rich glazed walls to elegant floors, find the finish that makes a room yours.", ar: "من الحوائط اللامعة للأرضيات الأنيقة، اختار اللمسة اللي تعبّر عنك.", fr: "Des murs émaillés aux sols élégants, trouvez la finition qui vous ressemble." } },
  { image: "marble", href: "/products?material=marble", title: { en: "Marble surfaces. Naturally expressive.", ar: "أسطح رخامية. جمال بتفاصيل طبيعية.", fr: "Surfaces marbrées. Une beauté expressive." }, body: { en: "Explore marble textures and envision a distinctive finish for your space.", ar: "استكشف نقوش الرخام وتخيّل اللمسة المناسبة لمساحتك.", fr: "Explorez les textures marbrées pour imaginer votre espace." } },
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
      <div className="idea-usp">{[
        {icon:Layers,to:"/products",title:text("Premium surface inspiration","إلهام بخامات فاخرة","Inspiration haut de gamme"),sub:text("Explore materials & finishes","اكتشف الخامات والتشطيبات","Matières & finitions")},
        {icon:FileText,to:"/request-quote/new",title:text("Private quote requests","طلبات عروض أسعار خاصة","Devis privés"),sub:text("Specify your project needs","حدد احتياجات مشروعك","Précisez votre projet")},
        {icon:Sparkles,to:"/room-designer",title:text("Room planning","تخطيط الغرف","Conception de pièces"),sub:text("Visualize your palette","تخيّل تنسيق خاماتك","Visualisez votre palette")},
        {icon:Users,to:"/register/business",title:text("For professionals","للمحترفين والشركات","Pour les professionnels"),sub:text("Explore business registration","اكتشف تسجيل الشركات","Inscription professionnelle")},
      ].map(item=><Link to={item.to} key={item.to}><item.icon size={22}/><span>{item.title}<small>{item.sub}</small></span></Link>)}</div>
      <HeroSearchPanel />
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
      <section className="idea-home-section idea-home-look-section"><h2 className="idea-home-centered-title">{text("Search by look", "تصفح حسب شكل الخامة", "Explorer par aspect")}</h2><div className="idea-home-looks">{LOOKS.map(look=><Link key={look.id} to={`/tile-showroom/${look.id}`}><img src={`/images/featured/${look.image}.webp`} alt="" width={240} height={240} loading="lazy"/><span>{look.label[locale]}</span></Link>)}</div></section>
      <SurfaceMaterialStrip />
      <section className="idea-home-room">
        <img src="/images/featured/wood.webp" alt={text("Warm wood-effect floor in a living room", "أرضية بتأثير خشبي في غرفة معيشة", "Sol effet bois dans un salon")} loading="lazy" width={1600} height={900} />
        <div><h2>{text("Imagine it in your home.", "تخيّلها في بيتك.", "Imaginez-le chez vous.")}</h2>
          <p>{text("Explore surfaces and plan your next space with our room designer.", "استكشف الخامات وخطّط مساحتك الجاية مع مصمم الغرف.", "Explorez les surfaces et préparez votre espace avec notre configurateur.")}</p>
          <Link className="idea-home-text-link" to="/room-designer/new">{t("action.visualize")} <ArrowRight size={16} /></Link>
        </div>
      </section>
      <section className="idea-home-section"><h2 className="idea-home-centered-title">{text("Search your destination", "اختار مساحتك", "Choisissez votre espace")}</h2><div className="idea-destination-grid">{DESTINATIONS.map(d=><Link key={d.id} to={`/inspiration/${d.id}`}><img src={`/images/featured/${d.image}.webp`} alt={d.label[locale]} loading="lazy" width={600} height={450}/><span>{d.label[locale]}</span></Link>)}</div></section>
      <section className="idea-home-section"><article className="idea-home-story"><Link className="idea-home-story-image" to="/showrooms"><img src="/images/featured/stone.webp" alt={text("Online surface showroom", "معرض الخامات الإلكتروني", "Showroom virtuel")} loading="lazy" width={1600} height={900}/></Link><div className="idea-home-story-copy"><h2>{text("Your showroom experience.", "تجربة المعرض بطريقتك.", "Votre expérience showroom.")}</h2><p>{text("Discover surfaces in the interactive showroom and explore showroom information.", "اكتشف الخامات في المعرض التفاعلي وتصفح معلومات المعارض.", "Découvrez les surfaces dans notre showroom interactif.")}</p><Link className="idea-home-text-link" to="/showrooms">{text("Explore showrooms", "استكشف المعارض", "Explorer les showrooms")} <ArrowRight size={16}/></Link></div></article></section>
      <HeroSearchPanel advanced />
      <section className="idea-home-section"><h2 className="idea-home-centered-title">{text("Explore the world of IDEA", "استكشف عالم IDEA", "Explorer l’univers IDEA")}</h2><div className="idea-home-resource-grid">{[
        {icon:Play,to:"/videos",title:text("Video inspiration","إلهام بالفيديو","Inspiration vidéo"),body:text("Explore our media library status and interactive inspiration.","تصفح حالة مكتبة الفيديو والإلهام التفاعلي.","Médias et inspiration interactive.")},
        {icon:FolderOpen,to:"/projects",title:text("Projects","المشروعات","Projets"),body:text("Discover project concepts and published work when available.","اكتشف أفكار المشروعات والأعمال المنشورة عند توفرها.","Concepts et réalisations disponibles.")},
        {icon:Download,to:"/downloads",title:text("Downloads","التنزيلات","Téléchargements"),body:text("Take the current product index with you.","حمّل فهرس المنتجات الحالي.","Téléchargez l’index produits actuel.")},
        {icon:MapPin,to:"/contact",title:text("Contact & appointments","التواصل والمواعيد","Contact & rendez-vous"),body:text("Find enquiry options and appointment availability.","اعرف طرق الاستفسار وحالة حجز المواعيد.","Renseignements et disponibilité des rendez-vous.")},
      ].map(item=><Link to={item.to} key={item.to}><item.icon size={24}/><h3>{item.title}</h3><p>{item.body}</p><ArrowRight size={16}/></Link>)}</div></section>
      <section className="idea-home-section"><h2 className="idea-home-centered-title">{text("Design notes & guides", "أفكار وأدلة التصميم", "Conseils & guides")}</h2><div className="idea-home-journal">{GUIDES.map(g=><Link key={g.id} to={`/journal/${g.id}`}><img src={`/images/featured/${g.image}.webp`} alt="" loading="lazy" width={600} height={450}/><h3>{g.title[locale]}</h3></Link>)}</div><div className="idea-home-center"><Link className="idea-home-text-link" to="/journal">{text("All news & guides", "كل الأخبار والأدلة", "Actualités & guides")} <ArrowRight size={16}/></Link></div></section>
      <section className="idea-home-section"><div className="idea-home-newsletter"><div><h2>{text("Stay inspired.", "خليك دايمًا مُلهم.", "Gardez l’inspiration.")}</h2><p>{text("Read the latest IDEA guides. Email subscriptions will be available once the mailing service is connected.", "تابع أحدث أدلة IDEA. الاشتراك البريدي هيتاح بعد ربط خدمة المراسلات.", "Consultez les guides IDEA. Les emails seront disponibles après connexion du service.")}</p></div><Link className="idea-home-text-link" to="/updates">{text("Updates", "التحديثات", "Actualités")} <ArrowRight size={16}/></Link></div></section>
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
      <section className="idea-home-section idea-home-quote"><h2>{t("home.bestPrice")}</h2><p>{t("home.bestPriceBody")}</p>
        <Link className="idea-home-text-link" to="/request-quote/new">{t("action.requestPrice")} <ArrowRight size={16} /></Link>
      </section>
    </div>
  );
}
