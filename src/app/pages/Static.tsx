import { useState } from "react";
import { Link } from "react-router";
import { UploadCloud, MousePointerClick, Sparkles, Image as ImageIcon, ClipboardList, BadgeCheck, CreditCard, Truck } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { Button, Container, Section, SectionHeader } from "../components/ui";
import { HERO_IMAGES } from "../data/catalog";

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

export function AiVisualizer() {
  const { t } = useI18n();
  const [file, setFile] = useState<string | null>(null);
  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container style={{ maxWidth: 900 }}>
        <SectionHeader eyebrow={t("nav.visualizer")} title="See It Inside Your Space" sub="Upload a photo of your room, then select a real IDEA surface to preview the finished look. (Rendering engine connects in the back-end phase.)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--idea-space-5)" }} className="idea-ai-grid">
          <label style={{ aspectRatio: "4/3", border: "1px dashed var(--idea-border)", borderRadius: "var(--idea-radius-lg)", display: "grid", placeItems: "center", cursor: "pointer", overflow: "hidden", background: "var(--idea-surface)" }}>
            {file ? <img src={file} alt="Your room" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
              <div style={{ textAlign: "center", color: "var(--idea-text-muted)" }}>
                <UploadCloud size={34} color="var(--idea-gold)" />
                <div style={{ marginTop: 10 }}>Upload your room photo</div>
              </div>
            )}
            <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(URL.createObjectURL(f)); }} />
          </label>
          <div style={{ aspectRatio: "4/3", borderRadius: "var(--idea-radius-lg)", overflow: "hidden", position: "relative", border: "var(--idea-hairline)" }}>
            <img src={HERO_IMAGES.marbleWhite} alt="Preview surface" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "var(--idea-overlay)", display: "grid", placeItems: "center", textAlign: "center", color: "var(--idea-text)" }}>
              <div>
                <Sparkles size={30} color="var(--idea-gold-bright)" />
                <div className="idea-display" style={{ fontSize: "var(--idea-text-lg)", marginTop: 8 }}>Preview appears here</div>
                <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginTop: 4 }}>Select a surface from the gallery</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "var(--idea-space-6)", display: "flex", gap: "var(--idea-space-3)", flexWrap: "wrap" }}>
          <Link to="/collections/porcelain"><Button variant="outline"><ImageIcon size={16} /> {t("action.browsePorcelain")}</Button></Link>
          <Link to="/products"><Button variant="ghost">{t("action.browseAll")}</Button></Link>
        </div>
      </Container>
      <style>{`@media (max-width: 720px){ .idea-ai-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </Section>
  );
}
