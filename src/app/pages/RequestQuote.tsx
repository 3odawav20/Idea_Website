import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Trash2, Minus, Plus, Clock } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { useBackend } from "../backend/db";
import { Button, Container, Section, SectionHeader } from "../components/ui";
import { Field, inputStyle } from "../components/dash";

const GOVS = ["Cairo", "Giza", "Alexandria", "Qalyubia", "Dakahlia", "Sharqia", "Port Said", "Suez"];

export function RequestQuote() {
  const { t, locale } = useI18n();
  const { quote, products, updateQuoteQty, removeFromQuote, clearQuote } = useStore();
  const { api, session } = useBackend();
  const nav = useNavigate();
  const [d, setD] = useState({ governorate: "Cairo", destination: "", deliveryDate: "", projectType: "Residential", phased: false, notes: "", hours: 24 });

  const rows = quote.map((q) => ({ item: q, product: products.find((p) => p.id === q.productId)! })).filter((r) => r.product);

  const submit = () => {
    if (!session) { nav("/login"); return; }
    rows.forEach(({ item, product }) => {
      api.createRequest({
        productId: product.id, variantLabel: product.sizes[0]?.label || product.variant || "",
        quantity: item.quantity, unit: item.unit,
        governorate: d.governorate, destination: d.destination, deliveryDate: d.deliveryDate,
        projectType: d.projectType, phased: d.phased, notes: d.notes,
      }, d.hours);
    });
    clearQuote();
    nav("/account/requests");
  };

  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container style={{ maxWidth: 900 }}>
        <SectionHeader eyebrow={t("rfq.window")} title={t("quote.title")} sub={t("quote.note24")} />
        {rows.length === 0 ? (
          <div style={{ padding: "var(--idea-space-8)", textAlign: "center", border: "1px dashed var(--idea-border)", borderRadius: "var(--idea-radius-lg)", color: "var(--idea-text-muted)" }}>
            <p>{t("quote.empty")}</p>
            <Link to="/products"><Button variant="outline" style={{ marginTop: "var(--idea-space-4)" }}>{t("action.browseAll")}</Button></Link>
          </div>
        ) : (
          <>
            {/* Step 1 — items & quantity */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--idea-space-3)", marginBottom: "var(--idea-space-6)" }}>
              {rows.map(({ item, product }) => (
                <div key={item.productId} style={{ display: "flex", gap: "var(--idea-space-4)", alignItems: "center", background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-3)" }}>
                  <img src={product.image} alt={product.name[locale]} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "var(--idea-radius-sm)" }} />
                  <div style={{ flex: 1 }}>
                    <div className="idea-display" style={{ fontSize: "var(--idea-text-base)", color: "var(--idea-text)" }}>{product.name[locale]}</div>
                    <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{product.model} · {product.sizes[0]?.label}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => updateQuoteQty(item.productId, item.quantity - (item.unit === "sqm" ? 10 : 1))} style={qtyBtn}><Minus size={14} /></button>
                    <input value={item.quantity} onChange={(e) => updateQuoteQty(item.productId, Number(e.target.value.replace(/\D/g, "")) || 1)}
                      style={{ width: 70, textAlign: "center", background: "var(--idea-surface-2)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-sm)", color: "var(--idea-text)", padding: "6px" }} />
                    <span style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", minWidth: 30 }}>{item.unit === "sqm" ? t("quote.sqm") : t("quote.pieces")}</span>
                    <button onClick={() => updateQuoteQty(item.productId, item.quantity + (item.unit === "sqm" ? 10 : 1))} style={qtyBtn}><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromQuote(item.productId)} aria-label="Remove" style={{ ...qtyBtn, color: "var(--idea-danger)" }}><Trash2 size={15} /></button>
                </div>
              ))}
              <p style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>Large professional quantities (e.g. 10,000 m²) are supported — type any value.</p>
            </div>

            {/* Step 2 — delivery details */}
            <div style={{ background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-5)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--idea-space-4)" }}>
                <Field label={t("rfq.deliveryGov")}>
                  <select style={inputStyle} value={d.governorate} onChange={(e) => setD({ ...d, governorate: e.target.value })}>{GOVS.map((g) => <option key={g}>{g}</option>)}</select>
                </Field>
                <Field label={t("rfq.date")}><input type="date" style={inputStyle} value={d.deliveryDate} onChange={(e) => setD({ ...d, deliveryDate: e.target.value })} /></Field>
                <Field label={t("rfq.destination")}><input style={inputStyle} value={d.destination} onChange={(e) => setD({ ...d, destination: e.target.value })} placeholder="Street, building, area…" /></Field>
                <Field label={t("rfq.projectType")}>
                  <select style={inputStyle} value={d.projectType} onChange={(e) => setD({ ...d, projectType: e.target.value })}>{["Residential", "Commercial", "Hospitality", "Contracting / Tender"].map((g) => <option key={g}>{g}</option>)}</select>
                </Field>
              </div>
              <Field label={t("rfq.notes")}><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} /></Field>
              <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: "var(--idea-space-5)", flexWrap: "wrap" }}>
                <label style={{ display: "flex", gap: 8, color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>
                  <input type="checkbox" checked={d.phased} onChange={(e) => setD({ ...d, phased: e.target.checked })} /> {t("rfq.phased")}
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>
                  <Clock size={15} color="var(--idea-gold)" />
                  <select style={{ ...inputStyle, width: "auto", padding: "6px 10px" }} value={d.hours} onChange={(e) => setD({ ...d, hours: Number(e.target.value) })}>
                    <option value={24}>Offers within 24 hours</option><option value={48}>48 hours (large projects)</option>
                  </select>
                </label>
              </div>
              <div style={{ display: "flex", gap: "var(--idea-space-3)", flexWrap: "wrap" }}>
                <Button size="lg" onClick={submit}>{t("quote.submit")}</Button>
                <Button variant="ghost" onClick={clearQuote}>{t("filters.clear")}</Button>
              </div>
              {!session && <p style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", marginTop: 10 }}>You'll be asked to sign in to submit and receive private offers.</p>}
            </div>
          </>
        )}
      </Container>
    </Section>
  );
}

const qtyBtn: React.CSSProperties = {
  width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: "var(--idea-radius-sm)",
  border: "1px solid var(--idea-border-neutral)", background: "var(--idea-surface-2)", color: "var(--idea-text)", cursor: "pointer",
};
