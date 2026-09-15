import { Link } from "react-router";
import { useI18n } from "../i18n/i18n";
import { COLLECTIONS } from "../data/catalog";
import { Container } from "./ui";
import { VisaMark, MastercardMark, MeezaMark, FawryMark } from "./BrandIcons";
import { IdeaLogo } from "./IdeaLogo";
import { Facebook, Globe2, Instagram, Linkedin, MapPin, Twitter } from "lucide-react";

const payChip: React.CSSProperties = { background: "#fff", borderRadius: 6, padding: "4px 7px", display: "inline-flex", alignItems: "center" };

export function Footer() {
  const { t, locale } = useI18n();
  return (
    <footer style={{ borderTop: "var(--idea-hairline)", background: "var(--idea-bg-2)", paddingTop: "var(--idea-space-8)", marginTop: "var(--idea-space-8)" }}>
      <Container style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--idea-space-6)", paddingBottom: "var(--idea-space-7)" }}>
        <div>
          <IdeaLogo />
          <p style={{ color: "var(--idea-text-muted)", marginTop: "var(--idea-space-3)", fontStyle: "italic", maxWidth: 260 }}>“{t("tagline")}”</p>
          <div style={{ display: "grid", gap: 10, marginTop: "var(--idea-space-4)", color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", lineHeight: 1.5 }}>
            <span style={{ display: "flex", alignItems: "flex-start", gap: 8 }}><MapPin size={16} color="var(--idea-gold)" style={{ marginTop: 2, flexShrink: 0 }} />الحي العائلي، العبور، القليوبية</span>
            <a href="https://www.idea.com" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--idea-gold-bright)", textDecoration: "none", width: "fit-content" }}><Globe2 size={16} />www.idea.com</a>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }} aria-label="IDEA social accounts">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Facebook size={16} color="var(--idea-gold)" />idea-egy</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Instagram size={16} color="var(--idea-gold)" />idea-egy</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Twitter size={16} color="var(--idea-gold)" />idea-egy</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Linkedin size={16} color="var(--idea-gold)" />idea-egy</span>
            </div>
          </div>
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
          <p style={{ color: "var(--idea-text-faint)", marginTop: 10, fontSize: "var(--idea-text-xs)", lineHeight: 1.7 }}>
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
