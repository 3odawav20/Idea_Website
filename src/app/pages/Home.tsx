import { Link } from "react-router";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { COLLECTIONS } from "../data/catalog";
import { HeroCarousel } from "../components/HeroCarousel";
import { HeroSearchPanel } from "../components/HeroSearchPanel";
import { ProductCard } from "../components/ProductCard";
import { Button, Container, Section, SectionHeader } from "../components/ui";
import { Reveal, Stagger, StaggerItem, ShimmerText, AnimatedWords } from "../components/motion";
import visualizerImage from "../../imports/Modern_luxury_living_room_ambiance.png";

function CollectionTile({ slug }: { slug: string }) {
  const { locale } = useI18n();
  const c = COLLECTIONS.find((x) => x.slug === slug)!;
  return (
    <Link to={`/collections/${c.slug}`} style={{ position: "relative", display: "block", aspectRatio: "3/4", borderRadius: "var(--idea-radius-lg)", overflow: "hidden", border: "var(--idea-hairline)" }}>
      <img className="idea-vivid-image" src={c.image} alt={c.title[locale]} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s" }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "")} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(6,6,8,.9), transparent 60%)" }} />
      <div style={{ position: "absolute", insetInline: 0, bottom: 0, padding: "var(--idea-space-4)", display: "grid", gridTemplateRows: "2.3em minmax(2.8em, auto)", alignItems: "end" }}>
        <div className="idea-display" style={{ fontSize: "var(--idea-text-lg)", color: "var(--idea-text)", display: "flex", alignItems: "end" }}>{c.title[locale]}</div>
        <div style={{ color: "var(--idea-gold)", fontSize: "var(--idea-text-xs)", display: "flex", alignItems: "flex-start", gap: 6, marginTop: 4, lineHeight: 1.45 }}>
          <ArrowRight size={13} /> {c.blurb[locale]}
        </div>
      </div>
    </Link>
  );
}

export function Home() {
  const { t } = useI18n();
  const { products } = useStore();
  const ceramicPorcelain = ["ceramics", "porcelain", "sanitary-ware", "faucets"];
  const sanitary = ["bathroom-sets", "bathroom-units", "bathtubs", "shower-units", "bathroom-accessories"];
  const featured = products.slice(0, 4);

  return (
    <>
      <HeroCarousel />
      <HeroSearchPanel />

      {/* Ceramic & Porcelain categories */}
      <Section>
        <Container>
          <SectionHeader eyebrow={t("home.shopByCategory")} title={t("home.ceramicPorcelain")} />
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
