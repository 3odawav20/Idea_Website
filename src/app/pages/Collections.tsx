import { useParams } from "react-router";
import { Link } from "react-router";
import { useI18n } from "../i18n/i18n";
import { COLLECTIONS } from "../data/catalog";
import type { CollectionSlug } from "../data/types";
import { Container, Section, SectionHeader } from "../components/ui";
import { Products } from "./Products";

export function Collections() {
  const { locale, t } = useI18n();
  const groups: { key: string; label: string }[] = [
    { key: "ceramics", label: locale === "ar" ? "السيراميك" : "Ceramics" },
    { key: "porcelain", label: locale === "ar" ? "البورسلين" : "Porcelain" },
    { key: "tiles", label: locale === "ar" ? "البلاط" : "Tiles" },
    { key: "marble", label: locale === "ar" ? "الرخام" : "Marble" },
  ];
  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container>
        <SectionHeader eyebrow="Browse" title={t("nav.collections")} sub={t("tagline")} />
        {groups.map((g) => {
          const items = COLLECTIONS.filter((c) => c.group === g.key);
          if (!items.length) return null;
          return (
            <div key={g.key} style={{ marginBottom: "var(--idea-space-7)" }}>
              <div className="idea-eyebrow" style={{ marginBottom: "var(--idea-space-4)" }}>{g.label}</div>
              <div className="idea-collection-grid" style={{ display: "grid", gap: "var(--idea-space-4)" }}>
                {items.map((c) => (
                  <Link className="idea-collection-card" key={c.slug} to={`/collections/${c.slug}`} style={{ position: "relative", aspectRatio: "4/3", borderRadius: "var(--idea-radius-lg)", overflow: "hidden", border: "var(--idea-hairline)", display: "block" }}>
                    <img className="idea-vivid-image" src={c.image} alt={c.title[locale]} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div className="idea-collection-shade" aria-hidden="true" />
                    <div className="idea-collection-caption">
                      <div className="idea-display idea-collection-title">{c.title[locale]}</div>
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
  return <Products fixedCollection={slug as CollectionSlug} />;
}
