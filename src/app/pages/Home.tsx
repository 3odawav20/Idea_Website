import { DestinationFan } from "../components/ui/card-fan-carousel";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight, Layers, FileText, Sparkles, Users, MapPin, Play, FolderOpen, Download } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { COLLECTIONS } from "../data/catalog";
import { HeroBrandFilm } from "../components/HeroBrandFilm";
import { HeroSearchPanel } from "../components/HeroSearchPanel";
import { distinctStorefrontProducts } from "../data/storefrontDistinct";
import { ideaInternalCode, productMaker } from "../data/ideaProductIdentity";
import { localMaterialFace } from "../data/localMaterialFace";
import { MaterialSphere } from "../components/MaterialSphere";
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


function GuideFlipCard({ guide, locale }: { guide: (typeof GUIDES)[number]; locale: keyof (typeof GUIDES)[number]["title"] }) {
  const [flipped, setFlipped] = useState(false);
  const reduced = useReducedMotion();
  const transition = { duration: reduced ? 0 : 0.7, ease: [0.4, 0.2, 0.2, 1] as const };
  const face = { backfaceVisibility: "hidden" as const, WebkitBackfaceVisibility: "hidden" as const };
  return (
    <Link to={`/journal/${guide.id}`} aria-label={guide.title[locale]}
      onPointerEnter={e => { if (e.pointerType === "mouse") setFlipped(true); }}
      onPointerLeave={() => setFlipped(false)}
      onFocus={() => setFlipped(true)} onBlur={() => setFlipped(false)}
      style={{ perspective: 1000 }}>
      <div style={{ display: "grid", transformStyle: "preserve-3d" }}>
        <motion.div aria-hidden={flipped} initial={false}
          animate={{ rotateY: flipped ? -180 : 0 }} transition={transition}
          style={{ ...face, gridArea: "1 / 1" }}>
          <img src={`/images/featured/${guide.image}.webp`} alt="" loading="lazy" width={600} height={450}/>
          <h3>{guide.title[locale]}</h3>
        </motion.div>
        <motion.div aria-hidden={!flipped} initial={false}
          animate={{ rotateY: flipped ? 0 : 180 }} transition={transition}
          style={{ ...face, gridArea: "1 / 1", minHeight: 0, overflow: "hidden", borderRadius: 10, background: "var(--idea-surface)", color: "var(--idea-text)", padding: "clamp(12px, 2vw, 24px)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
          <h3>{guide.title[locale]}</h3>
          <p className="text-sm leading-relaxed line-clamp-5">{guide.body[locale]}</p>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>{({ en: "Read guide", ar: "اقرأ الدليل", fr: "Lire le guide" })[locale]} <ArrowRight size={16}/></span>
        </motion.div>
      </div>
    </Link>
  );
}

export function Home() {
  const { locale, t } = useI18n();
  const { products, addToQuote } = useStore();
  // Public home cards show one design per source maker, never repetitive variants.
  const featuredProducts = distinctStorefrontProducts(products).slice(0, 8);
  const destinations = useCollectionDestinations();
  const text = (en: string, ar: string, fr: string) => ({ en, ar, fr })[locale];
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
      {featuredProducts.length > 0 && <section className="idea-home-section idea-home-product-section" aria-labelledby="featured-surfaces-title">
        <div className="idea-home-featured-heading">
          <div>
            <p className="idea-home-featured-eyebrow">{text("IDEA MATERIAL LIBRARY", "مكتبة خامات IDEA", "MATÉRIAUX IDEA")}</p>
            <h2 id="featured-surfaces-title">{t("home.featured")}</h2>
            <p>{text("Explore distinctive tiles and surfaces from our curated catalogue.", "اكتشف بلاطات وخامات مميزة من كتالوجنا المختار.", "Explorez des carreaux et surfaces sélectionnés dans notre catalogue.")}</p>
          </div>
          <Link className="idea-home-featured-all" to="/products">{t("action.browseAll")} <ArrowRight size={16} /></Link>
        </div>
        <nav className="idea-home-surface-filters" aria-label={text("Browse surface types", "تصفح أنواع الخامات", "Parcourir les matériaux")}>
          {[
            { label: text("All surfaces", "كل الخامات", "Toutes les surfaces"), to: "/products" },
            { label: text("Tiles", "بلاط", "Carrelage"), to: "/products?material=tiles" },
            { label: text("Ceramics", "سيراميك", "Céramiques"), to: "/collections/ceramics" },
            { label: text("Porcelain", "بورسلين", "Porcelaine"), to: "/collections/porcelain" },
            { label: text("Marble", "رخام", "Marbre"), to: "/products?material=marble" },
          ].map((item, index) => <Link key={item.label} className={index === 0 ? "is-active" : ""} to={item.to}>{item.label}</Link>)}
        </nav>
        <div className="idea-home-featured-grid">{featuredProducts.map((product) => {
          const maker = productMaker(product, locale);
          const isSurface = ["ceramics", "porcelain", "marble"].includes(product.collection);
          const image = localMaterialFace(product.id) || (isSurface ? product.source?.original?.tiles?.[0] : product.image) || product.image;
          const unit = isSurface ? "sqm" : "pieces";
          return <article className="idea-home-featured-card" key={product.id}>
            <Link className="idea-home-featured-photo" to={`/product/${product.slug}`} aria-label={product.name[locale]}>
              <MaterialSphere
                className="idea-home-material-sphere"
                src={image}
                alt=""
                loading="lazy"
              />
              <span className="sr-only">{product.name[locale]}</span>
            </Link>
            <div className="idea-home-featured-card-copy">
              {product.finish && <span className="idea-home-featured-finish">{product.finish}</span>}
              <div className="idea-home-featured-maker">
                <strong>{maker.verified ? maker.value : product.brand}</strong>
                <small>{maker.verified ? maker.label : text("Brand", "العلامة التجارية", "Marque")}</small>
              </div>
              <Link className="idea-home-featured-name" to={`/product/${product.slug}`} title={product.name[locale]}>
                {product.name[locale]}
              </Link>
              <div className="idea-home-featured-meta">
                {product.sizes[0] && <span>{product.sizes[0].label}</span>}
                <code dir="ltr">{ideaInternalCode(product)}</code>
              </div>
              <div className="idea-home-featured-actions">
                <button type="button" onClick={() => addToQuote(product.id, unit)}>
                  <FileText size={14} /> {t("action.requestPrice")}
                </button>
                <Link to={`/ai-room-visualizer?product=${encodeURIComponent(product.id)}`}>
                  <Sparkles size={15} /> {text("Try in AI", "جرّب بالذكاء الاصطناعي", "Essayer avec l’IA")}
                </Link>
              </div>
            </div>
          </article>;
        })}</div>
        <div className="idea-home-center"><Link className="idea-home-text-link" to="/products">{t("action.browseAll")} <ArrowRight size={16} /></Link></div>
      </section>}
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
      <section className="idea-home-section"><h2 className="idea-home-centered-title">{text("Search your destination", "اختار مساحتك", "Choisissez votre espace")}</h2><DestinationFan locale={locale} cards={[...DESTINATIONS.map(d => ({ id: d.id, imgUrl: `/images/featured/${d.image}.webp`, label: d.label[locale], linkUrl: `/inspiration/${d.id}` })), { id: "all-surfaces", imgUrl: "/images/featured/ceramics.webp", label: text("All surfaces", "كل الخامات", "Toutes les surfaces"), linkUrl: "/products", ariaLabel: text("Browse all materials", "تصفح كل الخامات", "Voir tous les matériaux") }]} /></section>
      <section className="idea-home-section"><article className="idea-home-story"><Link className="idea-home-story-image" to="/showrooms"><img src="/images/featured/stone.webp" alt={text("Online surface showroom", "معرض الخامات الإلكتروني", "Showroom virtuel")} loading="lazy" width={1600} height={900}/></Link><div className="idea-home-story-copy"><h2>{text("Your showroom experience.", "تجربة المعرض بطريقتك.", "Votre expérience showroom.")}</h2><p>{text("Discover surfaces in the interactive showroom and explore showroom information.", "اكتشف الخامات في المعرض التفاعلي وتصفح معلومات المعارض.", "Découvrez les surfaces dans notre showroom interactif.")}</p><Link className="idea-home-text-link" to="/showrooms">{text("Explore showrooms", "استكشف المعارض", "Explorer les showrooms")} <ArrowRight size={16}/></Link></div></article></section>
      <section className="idea-home-section"><h2 className="idea-home-centered-title">{text("Explore the world of IDEA", "استكشف عالم IDEA", "Explorer l’univers IDEA")}</h2><div className="idea-home-resource-grid">{[
        {icon:Play,to:"/videos",title:text("Video inspiration","إلهام بالفيديو","Inspiration vidéo"),body:text("Explore our media library status and interactive inspiration.","تصفح حالة مكتبة الفيديو والإلهام التفاعلي.","Médias et inspiration interactive.")},
        {icon:FolderOpen,to:"/projects",title:text("Projects","المشروعات","Projets"),body:text("Discover project concepts and published work when available.","اكتشف أفكار المشروعات والأعمال المنشورة عند توفرها.","Concepts et réalisations disponibles.")},
        {icon:Download,to:"/downloads",title:text("Downloads","التنزيلات","Téléchargements"),body:text("Take the current product index with you.","حمّل فهرس المنتجات الحالي.","Téléchargez l’index produits actuel.")},
        {icon:MapPin,to:"/contact",title:text("Contact & appointments","التواصل والمواعيد","Contact & rendez-vous"),body:text("Find enquiry options and appointment availability.","اعرف طرق الاستفسار وحالة حجز المواعيد.","Renseignements et disponibilité des rendez-vous.")},
      ].map(item=><Link to={item.to} key={item.to}><item.icon size={24}/><h3>{item.title}</h3><p>{item.body}</p><ArrowRight size={16}/></Link>)}</div></section>
      <section className="idea-home-section"><h2 className="idea-home-centered-title">{text("Design notes & guides", "أفكار وأدلة التصميم", "Conseils & guides")}</h2><div className="idea-home-journal">{GUIDES.map(g=><GuideFlipCard key={g.id} guide={g} locale={locale} />)}</div><div className="idea-home-center"><Link className="idea-home-text-link" to="/journal">{text("All news & guides", "كل الأخبار والأدلة", "Actualités & guides")} <ArrowRight size={16}/></Link></div></section>
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
      <section className="idea-home-section idea-home-quote"><h2>{text("Request a private quote", "اطلب عرض سعر خاص", "Demandez un devis privé")}</h2><p>{t("home.bestPriceBody")}</p>
        <Link className="idea-home-text-link" to="/request-quote/new">{t("action.requestPrice")} <ArrowRight size={16} /></Link>
      </section>
    </div>
  );
}
