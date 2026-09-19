import { Link, useParams } from "react-router";
import { useI18n } from "../i18n/i18n";
import { COLLECTIONS } from "../data/catalog";
import type { CollectionSlug } from "../data/types";
import { Container, Section, SectionHeader } from "../components/ui";
import { Products } from "./Products";

export function Collections() {
  const { locale, t } = useI18n();

  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container>
        <SectionHeader eyebrow="Browse" title={t("nav.collections")} sub={t("tagline")} />

        <div className="idea-collection-selector-grid">
          {COLLECTIONS.map((c) => (
            <Link key={c.slug} to={`/collections/${c.slug}`} className="idea-collection-selector-card">
              <img className="idea-vivid-image" src={c.image} alt={c.title[locale]} loading="lazy" />
              <div className="idea-collection-selector-wash" aria-hidden="true" />
              <div className="idea-collection-selector-copy">
                <div className="idea-eyebrow idea-collection-selector-group">{c.group}</div>
                <div className="idea-display idea-collection-selector-title">{c.title[locale]}</div>
                <div className="idea-collection-selector-blurb">{c.blurb[locale]}</div>
              </div>
            </Link>
          ))}
        </div>
      </Container>

      <style>{`
        .idea-collection-selector-grid{
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:20px;
          align-items:stretch;
        }
        .idea-collection-selector-card{
          position:relative;
          display:block;
          aspect-ratio:4/3;
          overflow:hidden;
          border:var(--idea-hairline);
          border-radius:var(--idea-radius-lg);
          background:#111;
          text-decoration:none;
          box-shadow:var(--idea-shadow-sm);
        }
        .idea-collection-selector-card > img{
          position:absolute;
          inset:0;
          width:100%;
          height:100%;
          object-fit:cover;
          transition:transform .5s ease;
        }
        .idea-collection-selector-card:hover > img{ transform:scale(1.045); }
        .idea-collection-selector-wash{
          position:absolute;
          inset:0;
          background:var(--idea-image-overlay-soft);
        }
        .idea-collection-selector-copy{
          position:absolute;
          inset-inline:0;
          bottom:0;
          padding:18px;
        }
        .idea-collection-selector-group{ color:#ff9a4d; margin-bottom:7px; text-shadow:0 3px 12px rgba(0,0,0,.95); }
        .idea-collection-selector-title{ color:#fff; font-size:22px; font-weight:600; text-shadow:0 4px 18px rgba(0,0,0,.95); }
        .idea-collection-selector-blurb{
          margin-top:6px;
          color:rgba(255,255,255,.94);
          font-size:12px;
          line-height:1.45;
          text-shadow:0 3px 12px rgba(0,0,0,.95);
        }
        @media (max-width: 1040px){
          .idea-collection-selector-grid{ grid-template-columns:repeat(3,minmax(0,1fr)); }
        }
        @media (max-width: 760px){
          .idea-collection-selector-grid{ grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
        }
        @media (max-width: 520px){
          .idea-collection-selector-grid{ grid-template-columns:1fr; }
          .idea-collection-selector-card{ aspect-ratio:4/3.1; }
        }
      `}</style>
    </Section>
  );
}

export function CollectionDetail() {
  const { slug } = useParams();
  return <Products fixedCollection={slug as CollectionSlug} />;
}
