import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Trash2, Minus, Plus, Clock } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { useBackend } from "../backend/db";
import { Button, Container, Section, SectionHeader } from "../components/ui";
import { Field, inputStyle } from "../components/dash";

const GOVS = [
  { value: "Cairo", ar: "القاهرة" },
  { value: "Giza", ar: "الجيزة" },
  { value: "Alexandria", ar: "الإسكندرية" },
  { value: "Qalyubia", ar: "القليوبية" },
  { value: "Dakahlia", ar: "الدقهلية" },
  { value: "Sharqia", ar: "الشرقية" },
  { value: "Port Said", ar: "بورسعيد" },
  { value: "Suez", ar: "السويس" },
];
const PROJECT_TYPES = [
  { value: "Residential", ar: "سكني" },
  { value: "Commercial", ar: "تجاري" },
  { value: "Hospitality", ar: "ضيافة" },
  { value: "Contracting / Tender", ar: "مقاولات / مناقصة" },
];

export function RequestQuote() {
  const { t, locale } = useI18n();
  const { quote, products, updateQuoteQty, removeFromQuote, clearQuote } = useStore();
  const { api, session, refresh } = useBackend();
  const nav = useNavigate();
  const [d, setD] = useState({ governorate: "Cairo", destination: "", deliveryDate: "", projectType: "Residential", phased: false, notes: "", hours: 24 });
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const rows = quote.map((q) => ({ item: q, product: products.find((p) => p.id === q.productId)! })).filter((r) => r.product);

  const submit = async () => {
    if (busy) return;
    if (!session) { nav("/login"); return; }
    if (!["customer", "designer", "contractor"].includes(session.role)) {
      setError(locale === "ar" ? "يتطلب إرسال طلب السعر حساب عميل." : "A customer account is required to submit an RFQ.");
      return;
    }
    const invalidQuantity = rows.some(({ item }) => {
      const quantity = Number(quantityDrafts[item.productId] ?? item.quantity);
      return !Number.isFinite(quantity) || quantity <= 0 || (item.unit === "pieces" && !Number.isInteger(quantity));
    });
    if (invalidQuantity) {
      setError(locale === "ar" ? "أدخل كمية صحيحة أكبر من صفر لكل منتج." : "Enter a valid quantity greater than zero for each product.");
      return;
    }

    setBusy(true);
    setError("");
    let submitted = 0;
    try {
      for (const { item, product } of rows) {
        const quantity = Number(quantityDrafts[item.productId] ?? item.quantity);
        const sizeId = selectedSizes[product.id] ?? product.sizes[0]?.id;
        const size = product.sizes.find((entry) => entry.id === sizeId) ?? product.sizes[0];
        await api.createRequest({
          productId: product.id,
          variantLabel: size?.originalSourceValue || size?.label || product.variant || product.model || "",
          quantity, unit: item.unit,
          governorate: d.governorate, destination: d.destination, deliveryDate: d.deliveryDate,
          projectType: d.projectType, phased: d.phased, notes: d.notes,
        }, d.hours);
        removeFromQuote(product.id);
        submitted += 1;
      }
      const updatedSession = await refresh();
      if (!updatedSession) {
        setError(locale === "ar" ? "أُرسلت الطلبات، لكن تعذر تحديث الحساب. أعد تحميل لوحة الطلبات قبل إعادة الإرسال." : "The requests were sent, but the account could not refresh. Reload your requests before submitting again.");
        return;
      }
      nav("/account/requests");
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "Request submission failed.";
      setError(submitted > 0
        ? (locale === "ar" ? `أُرسل ${submitted} طلبًا؛ بقيت المنتجات الأخرى في القائمة. ${detail}` : `${submitted} request(s) were submitted; the remaining products are still in your list. ${detail}`)
        : (locale === "ar" ? `تعذر إرسال الطلب. لم تُمسح المنتجات من قائمتك. ${detail}` : `The request could not be submitted. Your products remain in the list. ${detail}`));
    } finally {
      setBusy(false);
    }
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
              {rows.map(({ item, product }) => {
                const selectedSizeId = selectedSizes[product.id] ?? product.sizes[0]?.id ?? "";
                const selectedSize = product.sizes.find((size) => size.id === selectedSizeId) ?? product.sizes[0];
                return (
                  <div key={item.productId} style={{ display: "flex", flexWrap: "wrap", gap: "var(--idea-space-4)", alignItems: "center", background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-3)" }}>
                    <img src={product.image} alt={product.name[locale]} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "var(--idea-radius-sm)" }} />
                    <div style={{ flex: "1 1 180px" }}>
                      <div className="idea-display" style={{ fontSize: "var(--idea-text-base)", color: "var(--idea-text)" }}>{product.name[locale]}</div>
                      <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{product.model} · {selectedSize?.label || product.variant || ""}</div>
                    </div>
                    {product.sizes.length > 1 && (
                      <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 150px", color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>
                        {locale === "ar" ? "المقاس المحدد" : "Selected size"}
                        <select value={selectedSizeId} onChange={(event) => setSelectedSizes((current) => ({ ...current, [product.id]: event.target.value }))} style={{ ...qtyInputStyle, width: "100%" }}>
                          {product.sizes.map((size) => <option key={size.id} value={size.id}>{size.label}{size.thicknessMm ? ` · ${size.thicknessMm} mm` : ""}</option>)}
                        </select>
                      </label>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button type="button" aria-label={locale === "ar" ? "تقليل الكمية" : "Decrease quantity"} disabled={busy} onClick={() => {
                        const current = Number(quantityDrafts[item.productId] ?? item.quantity) || item.quantity;
                        updateQuoteQty(item.productId, Math.max(1, current - (item.unit === "sqm" ? 10 : 1)));
                        setQuantityDrafts((drafts) => { const next = { ...drafts }; delete next[item.productId]; return next; });
                      }} style={qtyBtn}><Minus size={14} /></button>
                      <input type="number" min="1" step={item.unit === "sqm" ? "0.01" : "1"} required value={quantityDrafts[item.productId] ?? String(item.quantity)}
                        aria-label={locale === "ar" ? "الكمية المطلوبة" : "Required quantity"}
                        onChange={(event) => setQuantityDrafts((current) => ({ ...current, [item.productId]: event.target.value }))}
                        onBlur={() => {
                          const raw = quantityDrafts[item.productId];
                          if (raw === undefined) return;
                          const value = Number(raw);
                          if (Number.isFinite(value) && value > 0 && (item.unit === "sqm" || Number.isInteger(value))) updateQuoteQty(item.productId, value);
                          setQuantityDrafts((current) => { const next = { ...current }; delete next[item.productId]; return next; });
                        }}
                        style={{ ...qtyInputStyle, width: 82, textAlign: "center" }} />
                      <span style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", minWidth: 30 }}>{item.unit === "sqm" ? t("quote.sqm") : t("quote.pieces")}</span>
                      <button type="button" aria-label={locale === "ar" ? "زيادة الكمية" : "Increase quantity"} disabled={busy} onClick={() => {
                        const current = Number(quantityDrafts[item.productId] ?? item.quantity) || item.quantity;
                        updateQuoteQty(item.productId, current + (item.unit === "sqm" ? 10 : 1));
                        setQuantityDrafts((drafts) => { const next = { ...drafts }; delete next[item.productId]; return next; });
                      }} style={qtyBtn}><Plus size={14} /></button>
                    </div>
                    <button type="button" onClick={() => removeFromQuote(item.productId)} disabled={busy} aria-label={locale === "ar" ? "إزالة المنتج" : "Remove product"} style={{ ...qtyBtn, color: "var(--idea-danger)" }}><Trash2 size={15} /></button>
                  </div>
                );
              })}
              <p style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>{locale === "ar" ? "الكميات الكبيرة للمشروعات مدعومة، مثل 10,000 م²." : "Large project quantities are supported, including 10,000 m²."}</p>
            </div>

            {/* Step 2 — delivery details */}
            <div style={{ background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-5)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: "var(--idea-space-4)" }}>
                <Field label={t("rfq.deliveryGov")}>
                  <select style={inputStyle} value={d.governorate} onChange={(e) => setD({ ...d, governorate: e.target.value })}>{GOVS.map((governorate) => <option key={governorate.value} value={governorate.value}>{locale === "ar" ? governorate.ar : governorate.value}</option>)}</select>
                </Field>
                <Field label={t("rfq.date")}><input type="date" style={inputStyle} value={d.deliveryDate} onChange={(e) => setD({ ...d, deliveryDate: e.target.value })} /></Field>
                <Field label={t("rfq.destination")}><input style={inputStyle} value={d.destination} onChange={(e) => setD({ ...d, destination: e.target.value })} placeholder={locale === "ar" ? "الشارع، المبنى، المنطقة…" : "Street, building, area…"} /></Field>
                <Field label={t("rfq.projectType")}>
                  <select style={inputStyle} value={d.projectType} onChange={(e) => setD({ ...d, projectType: e.target.value })}>{PROJECT_TYPES.map((type) => <option key={type.value} value={type.value}>{locale === "ar" ? type.ar : type.value}</option>)}</select>
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
                    <option value={24}>{locale === "ar" ? "عروض خلال 24 ساعة" : "Offers within 24 hours"}</option><option value={48}>{locale === "ar" ? "48 ساعة (للمشروعات الكبيرة)" : "48 hours (large projects)"}</option>
                  </select>
                </label>
              </div>
              {error && <p role="alert" style={{ color: "var(--idea-danger)", fontSize: "var(--idea-text-sm)", margin: "0 0 var(--idea-space-4)" }}>{error}</p>}
              <div style={{ display: "flex", gap: "var(--idea-space-3)", flexWrap: "wrap" }}>
                <Button size="lg" onClick={() => void submit()} disabled={busy} aria-busy={busy}>{busy ? (locale === "ar" ? "جارٍ الإرسال…" : "Submitting…") : t("quote.submit")}</Button>
                <Button variant="ghost" onClick={clearQuote} disabled={busy}>{t("filters.clear")}</Button>
              </div>
              {!session && <p style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", marginTop: 10 }}>{locale === "ar" ? "سجّل الدخول لإرسال الطلب واستلام عروض الموردين الخاصة." : "Sign in to submit and receive private supplier offers."}</p>}
            </div>
          </>
        )}
      </Container>
    </Section>
  );
}

const qtyInputStyle: React.CSSProperties = {
  minHeight: 34, background: "var(--idea-surface-2)", border: "var(--idea-hairline)",
  borderRadius: "var(--idea-radius-sm)", color: "var(--idea-text)", padding: "6px 8px",
};

const qtyBtn: React.CSSProperties = {
  width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: "var(--idea-radius-sm)",
  border: "1px solid var(--idea-border-neutral)", background: "var(--idea-surface-2)", color: "var(--idea-text)", cursor: "pointer",
};
