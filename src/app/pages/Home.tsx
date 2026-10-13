import { Link } from "react-router";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { COLLECTIONS } from "../data/catalog";
import { MARKET_FOCUS_COLLECTIONS } from "../data/curatedMarket";
import { categoryArtwork } from "../data/categoryArtwork";
import { dedupeProductsForLocale, productMatchesLocale, marketplaceProductQuality } from "../data/catalogPresentation";
import { HeroCarousel } from "../components/HeroCarousel";
import { HeroSearchPanel } from "../components/HeroSearchPanel";
import { ProductCard } from "../components/ProductCard";
import { Button, Container, Section, SectionHeader } from "../components/ui";
import { Reveal } from "../components/motion";
import imgBath from "../../imports/idea-hero-spa-bath-4k.webp";
import type { Product, CollectionSlug } from "../data/types";

type EditorialTile = {
  collection: CollectionSlug; to?: string;
  title?: {en:string;ar:string;fr:string};
  subtitle?: {en:string;ar:string;fr:string};
  scope?: (product:Product)=>boolean;
};

const EDITORIAL_TILES: EditorialTile[] = [
  {collection:"ceramics"},
  {collection:"porcelain"},
  {collection:"tiles"},
  {collection:"basins"},
  {collection:"bathtubs"},
  {
    collection:"ceramics",to:"/collections/ceramics?application=Wall",
    title:{en:"Wall Ceramics",ar:"سيراميك الحوائط",fr:"Céramique murale"},
    subtitle:{en:"Architectural wall finishes",ar:"تشطيبات حوائط فاخرة",fr:"Revêtements muraux"},
    scope:p=>/wall/i.test(p.application||""),
  },
  {
    collection:"porcelain",to:"/collections/porcelain?application=Floor",
    title:{en:"Floor Porcelain",ar:"بورسلين الأرضيات",fr:"Porcelaine au sol"},
    subtitle:{en:"Premium porcelain flooring",ar:"أرضيات بورسلين راقية",fr:"Sols en porcelaine"},
    scope:p=>/floor/i.test(p.application||""),
  },
  {
    collection:"ceramics",to:"/collections/ceramics?application=Floor",
    title:{en:"Floor Ceramics",ar:"سيراميك الأرضيات",fr:"Céramique au sol"},
    subtitle:{en:"Refined floor ceramic surfaces",ar:"أرضيات سيراميك بتشطيبات راقية",fr:"Sols céramiques haut de gamme"},
    scope:p=>/floor/i.test(p.application||""),
  },
  {
    collection:"basins",to:"/collections/basins?brand=Duravit",
    title:{en:"Duravit Basins",ar:"أحواض دورافيت",fr:"Vasques Duravit"},
    subtitle:{en:"A manufacturer-led basin edit",ar:"مختارات أحواض من الشركة المصنعة",fr:"Une sélection de vasques fabricant"},
    scope:p=>p.brand==="Duravit",
  },
];

function EditorialCard({tile, image}: {tile:EditorialTile;image:string}) {
  const {locale}=useI18n();
  const category=COLLECTIONS.find(c=>c.slug===tile.collection)!;
  const title=tile.title?.[locale] || category.title[locale];
  const blurb=tile.subtitle?.[locale] || category.blurb[locale];
  return (
    <Link to={tile.to || `/collections/${tile.collection}`} className="idea-home-collection-tile idea-premium-category">
      <img src={image} alt={title} loading="lazy" decoding="async" className="idea-vivid-image idea-home-collection-tile__image" />
      <div className="idea-home-collection-tile__wash" aria-hidden="true"/>
      <div className="idea-home-collection-tile__content">
        <div className="idea-eyebrow" style={{color:"#f5bb80",marginBottom:10}}>IDEA / MATERIALS</div>
        <h2 className="idea-display idea-home-collection-tile__title">{title}</h2>
        <div className="idea-home-collection-tile__description"><span>{blurb}</span><ArrowUpRight size={17}/></div>
      </div>
    </Link>
  );
}

export function Home() {
  const {t,locale}=useI18n();
  const {products}=useStore();
  const approved = dedupeProductsForLocale(
    products.filter(p=>MARKET_FOCUS_COLLECTIONS.includes(p.collection) && productMatchesLocale(p,locale)),
    locale
  ).filter(p=>p.image);
  const tiles = EDITORIAL_TILES.map(tile=>{
    const matches=approved.filter(p=>p.collection===tile.collection && (!tile.scope || tile.scope(p)));
    const cover=matches.sort((a,b)=>marketplaceProductQuality(b,locale)-marketplaceProductQuality(a,locale))[0];
    return cover ? {tile,image:categoryArtwork(tile.collection,cover.image)} : null;
  }).filter((entry):entry is {tile:EditorialTile;image:string}=>Boolean(entry)).slice(0,8);

  // Mix verified manufacturers and material families, avoiding identical products in the same row.
  const byCollection = MARKET_FOCUS_COLLECTIONS.map(category=>
    approved.filter(p=>p.collection===category)
      .sort((a,b)=>marketplaceProductQuality(b,locale)-marketplaceProductQuality(a,locale)));
  const chosen:Product[]=[];
  const seen=new Set<string>();
  for(let i=0;chosen.length<8 && i<30;i++){
    for(const family of byCollection){
      const next=family[i];
      if(next && !seen.has(next.image) && !seen.has(next.id)){
        chosen.push(next);
        seen.add(next.image); seen.add(next.id);
      }
      if(chosen.length>=8) break;
    }
  }
  const heroShortcuts = MARKET_FOCUS_COLLECTIONS
    .filter(slug=>approved.some(p=>p.collection===slug))
    .map(slug=>COLLECTIONS.find(c=>c.slug===slug)!)
    .filter(Boolean);

  return (
    <>
      <HeroCarousel />
      <HeroSearchPanel />

      <Section className="idea-premium-home-section">
        <Container>
          <div className="idea-premium-header">
            <div>
              <div className="idea-eyebrow" style={{color:"var(--idea-gold-bright)"}}>THE MATERIALS EDIT / IDEA</div>
              <h2 className="idea-display idea-premium-headline">
                {locale==="ar"?"خامات تصنع الفرق":locale==="fr"?"La matière sublime l’espace":"Designed to be extraordinary"}
              </h2>
              <p className="idea-premium-subtitle">
                {locale==="ar"?"سيراميك وبورسلين وبلاط وأحواض وبانيوهات مختارة بعناية، بمواصفات موثّقة وشكل يليق بكل مساحة.":locale==="fr"?"Céramique, porcelaine, carrelage, vasques et baignoires — une sélection authentique.":"Beautiful surfaces. Verified details. Remarkable spaces."}
              </p>
            </div>
            <Link to="/collections" className="idea-premium-text-link">{locale==="ar"?"كل الأقسام":"VIEW COLLECTIONS"} <ArrowUpRight size={17}/></Link>
          </div>
          <nav className="idea-premium-quick-links" aria-label="Browse key collections">
            {heroShortcuts.map(c=><Link key={c.slug} to={`/collections/${c.slug}`}>{c.title[locale]} <ArrowRight size={14}/></Link>)}
          </nav>
          <div className="idea-premium-categories-grid">
            {tiles.map(({tile,image},i)=><EditorialCard key={tile.to||tile.collection} tile={tile} image={image}/>)}
          </div>
        </Container>
      </Section>

      {chosen.length>0 && (
        <Section alt className="idea-premium-home-section">
          <Container>
            <div className="idea-premium-header">
              <div>
                <div className="idea-eyebrow" style={{color:"var(--idea-gold-bright)"}}>THE CURATED MARKET</div>
                <h2 className="idea-display idea-premium-headline">
                  {locale==="ar"?"مختارات من أفضل الخامات":locale==="fr"?"Sélection du moment":"The signature selection"}
                </h2>
                <p className="idea-premium-subtitle">
                  {locale==="ar"?"منتجات أصلية من الشركات المصنعة، بصورها الحقيقية ومواصفاتها المتاحة.":"Real manufacturers. Authentic product images. Actual specifications."}
                </p>
              </div>
              <Link to="/products" className="idea-premium-text-link">{locale==="ar"?"افتح الماركت":"EXPLORE MARKET"} <ArrowUpRight size={17}/></Link>
            </div>
            <div className="idea-premium-products-grid">
              {chosen.map(p=><ProductCard key={p.id} product={p}/>)}
            </div>
          </Container>
        </Section>
      )}

      <Section className="idea-premium-home-section">
        <Container>
          <div className="idea-premium-bath-feature">
            <img src={imgBath} alt="Architectural bathroom with premium stone surfaces" loading="lazy" />
            <div className="idea-premium-bath-feature__shade"/>
            <div className="idea-premium-bath-feature__copy">
              <div className="idea-eyebrow" style={{color:"#ffa86f"}}>IDEA / THE ART OF BATHING</div>
              <h2 className="idea-display">{locale==="ar"?"حمّام بتفاصيل استثنائية":locale==="fr"?"L’art de la salle de bain":"Spaces that feel extraordinary"}</h2>
              <p>{locale==="ar"?"بورسلين وسيراميك وأحواض وبانيوهات في مجموعات منفصلة ومختارة بذوق معماري.":"Ceramic and porcelain surfaces, washbasins and bathtubs. Each in its own verified collection."}</p>
              <div className="idea-premium-bath-actions">
                {heroShortcuts.filter(c=>c.slug==="basins"||c.slug==="bathtubs"||c.slug==="porcelain").slice(0,3).map(c=>
                  <Link key={c.slug} to={`/collections/${c.slug}`}>{c.title[locale]} <ArrowUpRight size={15}/></Link>
                )}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section alt>
        <Container>
          <div className="idea-premium-cta">
            <Sparkles size={22} color="var(--idea-gold)"/>
            <Reveal><h2 className="idea-display">{t("home.bestPrice")}</h2></Reveal>
            <p>{t("home.bestPriceBody")}</p>
            <Link to="/request-quote/new"><Button size="lg">{t("action.requestPrice")}</Button></Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
