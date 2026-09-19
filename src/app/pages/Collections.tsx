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
    { key: "ceramics", label: t("collection.ceramics") },
    { key: "porcelain", label: t("collection.porcelain") },
    { key: "marble", label: t("collection.marble") },
    { key: "sanitary", label: t("home.sanitary") },
    { key: "plumbing", label: t("collection.plumbing") },
    { key: "furniture", label: locale === "ar" ? "أثاث" : locale === "fr" ? "Mobilier" : "Furniture" },
    { key: "lighting", label: locale === "ar" ? "إضاءة" : locale === "fr" ? "Éclairage" : "Lighting" },
    { key: "decor", label: locale === "ar" ? "ديكور منزلي" : locale === "fr" ? "Décoration" : "Home Decor" },
  ];
  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container>
        <SectionHeader eyebrow={t("common.browse")} title={t("nav.collections")} sub={t("tagline")} />
        {groups.map((g) => {
          const items = COLLECTIONS.filter((c) => c.group === g.key);
          if (!items.length) return null;
          return (
            <div key={g.key} style={{ marginBottom: "var(--idea-space-7)" }}>
              <div className="idea-eyebrow" style={{ marginBottom: "var(--idea-space-4)" }}>{g.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--idea-space-4)" }}>
                {items.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/collections/${c.slug}`}
                    style={{
                      position: "relative",
                      aspectRatio: "4/3",
                      borderRadius: "var(--idea-radius-lg)",
                      overflow: "hidden",
                      border: "var(--idea-hairline)",
                      display: "block",
                      boxShadow: "var(--idea-shadow-sm)",
                    }}
                  >
                    <img className="idea-vivid-image" src={c.image} alt={c.title[locale]} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, rgba(6,6,8,0.02) 24%, rgba(6,6,8,0.28) 58%, rgba(6,6,8,0.88) 100%)",
                      }}
                    />
                    <div style={{ position: "absolute", insetInline: 0, bottom: 0, padding: "var(--idea-space-4)" }}>
                      <div
                        className="idea-display"
                        style={{
                          fontSize: "var(--idea-text-lg)",
                          color: "#fff",
                          textShadow: "0 2px 12px rgba(0,0,0,0.78)",
                        }}
                      >
                        {c.title[locale]}
                      </div>
                      <div
                        style={{
                          color: "rgba(255,255,255,0.9)",
                          fontSize: "var(--idea-text-xs)",
                          lineHeight: 1.5,
                          marginTop: 6,
                          textShadow: "0 2px 12px rgba(0,0,0,0.82)",
                        }}
                      >
                        {c.blurb[locale]}
                      </div>
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
