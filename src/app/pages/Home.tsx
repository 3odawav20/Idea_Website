import { Link } from "react-router";
import { ArrowRight, Clock, Sparkles, Shield, Zap, Truck, HeadphonesIcon } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { COLLECTIONS } from "../data/catalog";
import { HeroCarousel } from "../components/HeroCarousel";
import { HeroSearchPanel } from "../components/HeroSearchPanel";
import { ProductCard } from "../components/ProductCard";
import { Button, Container, Section, SectionHeader } from "../components/ui";
import { Reveal, Stagger, StaggerItem, ShimmerText, AnimatedWords } from "../components/motion";
import { MaterialLookStrip } from "../components/MaterialLookStrip";
import visualizerImage from "../../imports/Modern_luxury_living_room_ambiance.png";

const USP_ITEMS = [
  { icon: Shield, label: { en: "Premium Quality", ar: "جودة فاخرة", fr: "Qualité Premium" }, sub: { en: "World-class materials", ar: "مواد عالمية الجودة", fr: "Matériaux de classe mondiale" } },
  { icon: Zap, label: { en: "Best Price in 24h", ar: "أفضل سعر خلال 24 ساعة", fr: "Meilleur prix en 24h" }, sub: { en: "Free price comparison", ar: "مقارنة أسعار مجانية", fr: "Comparaison de prix gratuite" } },
  { icon: Truck, label: { en: "Nationwide Delivery", ar: "توصيل لجميع أنحاء مصر", fr: "Livraison nationale" }, sub: { en: "Egypt & MENA", ar: "مصر والشرق الأوسط", fr: "Égypte & MENA" } },
  { icon: HeadphonesIcon, label: { en: "Expert Support", ar: "دعم متخصص", fr: "Support expert" }, sub: { en: "7 days a week", ar: "7 أيام في الأسبوع", fr: "7 jours sur 7" } },
];

function UspBar() {
  const { locale } = useI18n();
  return (
    <div style={{
      background: "#0d0b08",
      borderBottom: "1px solid rgba(255,114,0,0.12)",
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 0,
    }}>
      {USP_ITEMS.map((item, i) => (
        <div key={i} style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--idea-space-3)",
          padding: "var(--idea-space-5) var(--idea-space-6)",
          flex: "1 1 200px",
          maxWidth: 320,
          borderInlineEnd: i < USP_ITEMS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : undefined,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "var(--idea-radius-md)",
            background: "rgba(255,114,0,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <item.icon size={19} color="var(--idea-gold-bright)" />
          </div>
          <div>
            <div style={{
              fontFamily: "var(--idea-font-display)",
              fontSize: "var(--idea-text-sm)",
              color: "white",
              letterSpacing: "0.04em",
              lineHeight: 1.3,
            }}>{item.label[locale as "en" | "ar" | "fr"]}</div>
            <div style={{
              fontSize: "var(--idea-text-xs)",
              color: "rgba(255,255,255,0.42)",
              marginTop: 3,
            }}>{item.sub[locale as "en" | "ar" | "fr"]}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CollectionTile({ slug }: { slug: string }) {
  const { locale } = useI18n();
  const c = COLLECTIONS.find((x) => x.slug === slug)!;
  return (
    <Link to={`/collections/${c.slug}`} style={{ position: "relative", display: "block", aspectRatio: "3/4", borderRadius: "var(--idea-radius-lg)", overflow: "hidden", border: "var(--idea-hairline)" }}>
      <img className="idea-vivid-image" src={c.image} alt={c.title[locale]} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s" }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "")} />
      <div className="idea-main-collection-scrim" aria-hidden="true" />
      <div className="idea-main-collection-nameplate">
        <span className="idea-main-collection-eyebrow">{locale === "ar" ? "تصفح القسم" : locale === "fr" ? "COLLECTION" : "SHOP COLLECTION"}</span>
        <h2 className="idea-display idea-main-collection-title">{c.title[locale]}</h2>
      </div>
      <div className="idea-main-collection-footer">
        <span>{c.blurb[locale]}</span>
        <ArrowRight size={18} aria-hidden="true" />
      </div>
    </Link>
  );
}

export function Home() {
  const { t, locale } = useI18n();
  const { products } = useStore();
  const ceramicPorcelain = ["ceramics", "porcelain", "sanitary-ware", "bathtubs"];
  const sanitary = ["bathroom-sets", "bathroom-units", "faucets", "shower-units"];
  const featured = products.slice(0, 4);

  return (
    <>
      <HeroCarousel />

      {/* USP trust bar — the "different color strip in the middle" */}
      <UspBar />

      <HeroSearchPanel />

      {/* Ceramic & Porcelain categories */}
      <Section>
        <Container>
          <SectionHeader eyebrow={t("home.shopByCategory")} title={locale === "ar" ? "اكتشف أقسام الماركت" : locale === "fr" ? "Toutes nos collections" : "Explore All Collections"} />
          <div className="idea-ceramic-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "var(--idea-space-4)" }}>
            {ceramicPorcelain.map((s) => <CollectionTile key={s} slug={s} />)}
          </div>
        </Container>
      </Section>

      {/* Featured products */}
      <Section alt>
        <Container>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <SectionHeader eyebrow="Curated" title={t("home.featured")} />
            <Link to="/products" style={{ marginBottom: "var(--idea-space-7)" }}><Button variant="outline">{t("action.browseAll")}</Button></Link>
          </div>
          <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--idea-space-5)" }}>
            {featured.map((p) => <StaggerItem key={p.id}><ProductCard product={p} /></StaggerItem>)}
          </Stagger>
        </Container>
      </Section>

      {/* AI Visualizer band */}
      <Section>
        <Container>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "var(--idea-space-7)", alignItems: "center", background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-lg)", overflow: "hidden" }} className="idea-split">
            <div style={{ padding: "var(--idea-space-7)" }}>
              <div className="idea-eyebrow" style={{ display: "flex", alignItems: "center", gap: 8 }}><Sparkles size={14} /> {t("nav.visualizer")}</div>
              <h2 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)", margin: "var(--idea-space-3) 0 var(--idea-space-4)" }}>
                <AnimatedWords text="See It Inside Your Space Before You Buy" />
              </h2>
              <p style={{ color: "var(--idea-text-muted)", lineHeight: 1.7, marginBottom: "var(--idea-space-5)" }}>
                Upload your room, select a real IDEA surface, and preview the finished result with accurate scale and lighting.
              </p>
              <Link to="/room-designer/new"><Button size="lg">{t("action.startAi")}</Button></Link>
            </div>
            <div style={{ aspectRatio: "4/3", height: "100%" }}>
              <img className="idea-vivid-image" src={visualizerImage} alt="AI Room Visualizer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Material Look Strip */}
      <MaterialLookStrip />

      {/* Sanitary categories */}
      <Section alt>
        <Container>
          <SectionHeader eyebrow={t("home.shopByCategory")} title={t("home.sanitary")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--idea-space-4)" }}>
            {sanitary.map((s) => <CollectionTile key={s} slug={s} />)}
          </div>
        </Container>
      </Section>

      {/* Best price within 24h */}
      <Section>
        <Container>
          <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
            <div className="idea-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Clock size={14} /> IDEA</div>
            <Reveal as="header"><h2 className="idea-display" style={{ fontSize: "var(--idea-text-3xl)", margin: "var(--idea-space-4) 0" }}><ShimmerText>{t("home.bestPrice")}</ShimmerText></h2></Reveal>
            <Reveal delay={0.08}><p style={{ color: "var(--idea-text-muted)", lineHeight: 1.7, marginBottom: "var(--idea-space-6)" }}>{t("home.bestPriceBody")}</p></Reveal>
            <div style={{ display: "flex", gap: "var(--idea-space-4)", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/request-quote/new"><Button size="lg">{t("action.requestPrice")}</Button></Link>
              <Link to="/how-it-works"><Button variant="outline" size="lg">{t("action.howItWorks")}</Button></Link>
            </div>
          </div>
        </Container>
      </Section>

      <style>{`
        @media (max-width: 1000px){ .idea-ceramic-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } }
        @media (max-width: 820px){ .idea-split{ grid-template-columns: 1fr !important; } }
        @media (max-width: 560px){ .idea-ceramic-grid{ grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
