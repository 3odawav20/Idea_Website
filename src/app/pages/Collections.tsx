import { Link, useParams } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { COLLECTIONS } from "../data/catalog";
import { dedupeProductsForLocale } from "../data/catalogPresentation";
import type { CollectionSlug } from "../data/types";
import { Container, Section } from "../components/ui";
import { Products } from "./Products";

const ORDER: CollectionSlug[] = [
  "ceramics",
  "porcelain",
  "marble",
  "sanitary-ware",
  "faucets",
  "bathtubs",
  "shower-units",
  "bathroom-units",
  "bathroom-accessories",
  "plumbing-products",
  "furniture",
  "lighting",
  "home-decor",
];

export function Collections() {
  const { locale, t } = useI18n();
  const { products } = useStore();

  const available = ORDER
    .map((slug) => {
      const collection = COLLECTIONS.find((item) => item.slug === slug);
      if (!collection) return null;
      const count = dedupeProductsForLocale(products.filter((product) => product.collection === slug), locale).length;
      return count > 0 ? { collection, count } : null;
    })
    .filter(Boolean) as Array<{ collection: (typeof COLLECTIONS)[number]; count: number }>;

  return (
    <Section style={{ paddingTop: "var(--idea-space-8)" }}>
      <div className="idea-collections-page">
      <Container>
        <header className="idea-collections-intro">
          <div>
            <div className="idea-eyebrow">{t("common.browse")}</div>
            <h1 className="idea-display idea-collections-title">{t("nav.collections")}</h1>
          </div>
          <p>{t("tagline")}</p>
        </header>

        <div className="idea-collections-grid">
          {available.map(({ collection: c, count }) => (
            <Link key={c.slug} to={`/collections/${c.slug}`} className="idea-collection-card">
              <img
                className="idea-vivid-image"
                src={c.image}
                alt={c.title[locale]}
                loading="lazy"
              />
              <div className="idea-collection-card__wash" aria-hidden="true" />
              <div className="idea-collection-card__content">
                <div className="idea-collection-card__meta">
                  <span>{String(count).padStart(2, "0")}</span>
                  <ArrowUpRight size={15} />
                </div>
                <h2 className="idea-display">{c.title[locale]}</h2>
                <p>{c.blurb[locale]}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
      </div>
    </Section>
  );
}

export function CollectionDetail() {
  const { slug } = useParams();
  return <Products fixedCollection={slug as CollectionSlug} />;
}
