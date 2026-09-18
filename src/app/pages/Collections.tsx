import { useStore } from "../store/store";
import { useParams } from "react-router";
import { Link } from "react-router";
import { useI18n } from "../i18n/i18n";
import { COLLECTIONS } from "../data/catalog";
import type { CollectionSlug } from "../data/types";
import { Container, Section, SectionHeader } from "../components/ui";
import { Products } from "./Products";

export function Collections() {
  const { locale, t } = useI18n();
  const { products } = useStore();
  const groups: { key: string; label: string }[] = [
    { key: "ceramics", label: t("home.ceramicPorcelain") },
    { key: "porcelain", label: locale === "ar" ? "بورسلين" : locale === "fr" ? "Porcelaine" : "Porcelain" },
    { key: "sanitary", label: t("home.sanitary") },
  ];
  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container>
        <SectionHeader eyebrow="Browse" title={t("nav.collections")} sub={t("tagline")} />
        {groups.map((g) => {
          const items = COLLECTIONS.filter((c) => c.group === g.key).map((c) => ({ ...c, products: products.filter((product) => product.collection === c.slug) })).filter((c) => c.products.length > 0);
          if (!items.length) return null;
          return (
            <div key={g.key} style={{ marginBottom: "var(--idea-space-7)" }}>
              <div className="idea-eyebrow" style={{ marginBottom: "var(--idea-space-4)" }}>{g.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--idea-space-4)" }}>
                {items.map((c) => (
                  <Link key={c.slug} to={`/collections/${c.slug}`} style={{ position: "relative", aspectRatio: "4/3", borderRadius: "var(--idea-radius-lg)", overflow: "hidden", border: "var(--idea-hairline)", display: "block" }}>
                    <img className="idea-vivid-image" src={c.products[0].image} alt={c.title[locale]} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "var(--idea-image-overlay-soft)" }} />
                    <div style={{ position: "absolute", bottom: 0, padding: "var(--idea-space-4)" }}>
                      <div className="idea-display" style={{ fontSize: "var(--idea-text-lg)", color: "var(--idea-text)" }}>{c.title[locale]}</div>
                      <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)", marginTop: 4 }}>{c.products.length} {locale === "ar" ? "منتج" : locale === "fr" ? "produits" : "products"}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </Container>
    </Section>
  );
}

export function CollectionDetail() {
  const { slug } = useParams();
  return <Products key={slug} fixedCollection={slug as CollectionSlug} />;
}
