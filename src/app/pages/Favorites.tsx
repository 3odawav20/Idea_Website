import { Link } from "react-router";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { ProductCard } from "../components/ProductCard";
import { Button, Container, Section, SectionHeader } from "../components/ui";

export function Favorites() {
  const { t } = useI18n();
  const { favorites, products } = useStore();
  const items = products.filter((p) => favorites.includes(p.id));
  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container>
        <SectionHeader eyebrow="Saved" title={t("fav.title")} />
        {items.length === 0 ? (
          <div style={{ padding: "var(--idea-space-8)", textAlign: "center", border: "1px dashed var(--idea-border)", borderRadius: "var(--idea-radius-lg)", color: "var(--idea-text-muted)" }}>
            <p>{t("fav.empty")}</p>
            <Link to="/products"><Button variant="outline" style={{ marginTop: "var(--idea-space-4)" }}>{t("action.browseAll")}</Button></Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--idea-space-5)" }}>
            {items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </Container>
    </Section>
  );
}
