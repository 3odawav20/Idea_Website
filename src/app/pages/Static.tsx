import { Link } from "react-router";
import { MousePointerClick, ClipboardList, BadgeCheck, CreditCard, Truck } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { Button, Container, Section, SectionHeader } from "../components/ui";

export function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    { icon: MousePointerClick, title: "Select Products", body: "Choose surfaces and quantity — square metres for ceramic & porcelain, pieces for sanitary ware." },
    { icon: ClipboardList, title: "Submit One Request", body: "Send a single Best-Price request; no public prices are shown." },
    { icon: BadgeCheck, title: "Receive Private Offers", body: "Verified matching suppliers submit offers within 24 hours." },
    { icon: CreditCard, title: "Confirm & Pay", body: "Confirm your preferred offer and pay securely (Credit Card · Fawry · Vodafone Cash)." },
    { icon: Truck, title: "Delivery", body: "Prepared and delivered, typically within 3–7 business days where applicable." },
  ];
  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container>
        <SectionHeader eyebrow="Process" title={t("nav.how")} sub={t("home.bestPriceBody")} />
        <div style={{ display: "grid", gap: "var(--idea-space-4)" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "var(--idea-space-4)", alignItems: "flex-start", background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-5)" }}>
              <div style={{ width: 46, height: 46, borderRadius: 999, display: "grid", placeItems: "center", background: "var(--idea-gold-soft)", border: "1px solid var(--idea-gold)", color: "var(--idea-gold-bright)", flexShrink: 0 }}>
                <s.icon size={20} />
              </div>
              <div>
                <div style={{ color: "var(--idea-gold)", fontSize: "var(--idea-text-xs)" }}>Step {i + 1}</div>
                <div className="idea-display" style={{ fontSize: "var(--idea-text-lg)", color: "var(--idea-text)", margin: "2px 0 6px" }}>{s.title}</div>
                <p style={{ color: "var(--idea-text-muted)", lineHeight: 1.6, margin: 0 }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "var(--idea-space-6)" }}>
          <Link to="/request-quote/new"><Button size="lg">{t("action.requestPrice")}</Button></Link>
        </div>
      </Container>
    </Section>
  );
}
