import { Link } from "react-router";
import { useI18n } from "../i18n/i18n";
import { COLLECTIONS } from "../data/catalog";
import { Container } from "./ui";
import { VisaMark, MastercardMark, MeezaMark, FawryMark } from "./BrandIcons";
import { IdeaLogo } from "./IdeaLogo";

const payChip: React.CSSProperties = { background: "var(--idea-surface)", borderRadius: "var(--idea-radius-sm)", padding: "var(--idea-space-1) var(--idea-space-2)", display: "inline-flex", alignItems: "center" };

export function Footer() {
  const { t, locale } = useI18n();
  return (
    <footer style={{ borderTop: "var(--idea-hairline)", background: "var(--idea-bg-2)", paddingTop: "var(--idea-space-8)", marginTop: "var(--idea-space-8)" }}>
      <Container style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--idea-space-6)", paddingBottom: "var(--idea-space-7)" }}>
        <div>
          <IdeaLogo />
          <p style={{ color: "var(--idea-text-muted)", marginTop: "var(--idea-space-3)", fontStyle: "italic", maxWidth: 260 }}>“{t("tagline")}”</p>
        </div>
        <div>
          <div className="idea-eyebrow">{t("nav.collections")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "var(--idea-space-4)" }}>
            {COLLECTIONS.slice(0, 5).map((c) => (
              <Link key={c.slug} to={`/collections/${c.slug}`} style={{ color: "var(--idea-text-muted)", textDecoration: "none", fontSize: "var(--idea-text-sm)" }}>{c.title[locale]}</Link>
            ))}
          </div>
        </div>
        <div>
          <div className="idea-eyebrow">Company</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "var(--idea-space-4)" }}>
            <Link to="/how-it-works" style={{ color: "var(--idea-text-muted)", textDecoration: "none", fontSize: "var(--idea-text-sm)" }}>{t("nav.how")}</Link>
            <Link to="/room-designer" style={{ color: "var(--idea-text-muted)", textDecoration: "none", fontSize: "var(--idea-text-sm)" }}>{t("nav.roomDesigner")}</Link>
            <Link to="/subscriptions" style={{ color: "var(--idea-text-muted)", textDecoration: "none", fontSize: "var(--idea-text-sm)" }}>{t("nav.subscriptions")}</Link>
            <Link to="/register/business" style={{ color: "var(--idea-text-muted)", textDecoration: "none", fontSize: "var(--idea-text-sm)" }}>{t("auth.forBusiness")}</Link>
          </div>
        </div>
        <div>
          <div className="idea-eyebrow">Secure Payment</div>
          <div style={{ display: "flex", gap: 8, marginTop: "var(--idea-space-4)", flexWrap: "wrap" }}>
            <span style={payChip}><VisaMark /></span><span style={payChip}><MastercardMark /></span>
            <span style={payChip}><MeezaMark /></span><span style={payChip}><FawryMark /></span>
          </div>
          <p style={{ color: "var(--idea-text-faint)", marginTop: "var(--idea-space-2)", fontSize: "var(--idea-text-xs)", lineHeight: 1.7 }}>
            EGP · Enabled only with configured & tested merchant credentials.
          </p>
        </div>
      </Container>
      <div className="idea-rule" />
      <Container style={{ padding: "var(--idea-space-4) var(--idea-space-5)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>© {new Date().getFullYear()} IDEA. All rights reserved.</span>
        <span style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>Public prices are never shown — request private offers.</span>
      </Container>
    </footer>
  );
}
