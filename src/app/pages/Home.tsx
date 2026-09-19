import { Link } from "react-router";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { COLLECTIONS } from "../data/catalog";
import { dedupeProductsForLocale, productMatchesLocale } from "../data/catalogPresentation";
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
    <Link to={`/collections/${c.slug}`} className="idea-home-collection-tile">
      <img className="idea-vivid-image idea-home-collection-tile__image" src={c.image} alt={c.title[locale]} loading="lazy" />
      <div className="idea-home-collection-tile__wash" aria-hidden="true" />
      <div className="idea-home-collection-tile__content">
        <div className="idea-display idea-home-collection-tile__title">{c.title[locale]}</div>
        <div className="idea-home-collection-tile__description">
          <ArrowRight size={13} />
          <span>{c.blurb[locale]}</span>
        </div>
      </div>
    </Link>
  );
}

export function Home() {
  const { t, locale } = useI18n();
  const { products } = useStore();
  const ceramicPorcelain = ["ceramics", "porcelain", "marble"];
  const sanitary = ["sanitary-ware", "faucets", "bathroom-units", "bathtubs", "shower-units", "bathroom-accessories", "plumbing-products"];
  const visibleProducts = dedupeProductsForLocale(products.filter((product) => productMatchesLocale(product, locale)), locale);
  const featured = visibleProducts.slice(0, 4);
  const visibleCollections = (slugs: string[]) => slugs.filter((slug) => visibleProducts.some((product) => product.collection === slug));

  return (
    <>
      <HeroCarousel />
      <HeroSearchPanel />

      {/* Ceramic & Porcelain categories */}
      <Section>
        <Container>
          <SectionHeader eyebrow={t("home.shopByCategory")} title={t("home.ceramicPorcelain")} />
          <div className="idea-home-category-grid idea-home-category-grid--three">
            {visibleCollections(ceramicPorcelain).map((s) => <CollectionTile key={s} slug={s} />)}
          </div>
        </Container>
      </Section>

      {/* Featured products */}
      <Section alt>
        <Container>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <SectionHeader eyebrow={t("home.curated")} title={t("home.featured")} />
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
                <AnimatedWords text={t("home.visualizerTitle")} />
              </h2>
              <p style={{ color: "var(--idea-text-muted)", lineHeight: 1.7, marginBottom: "var(--idea-space-5)" }}>
                {t("home.visualizerBody")}
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
          <div className="idea-home-category-grid idea-home-category-grid--four">
            {visibleCollections(sanitary).map((s) => <CollectionTile key={s} slug={s} />)}
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
@media (max-width: 820px){ .idea-split{ grid-template-columns: 1fr !important; } }
`}</style>
    </>
  );
}

