import { useUiText as useLocaleText } from "../i18n/useUiText";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Trash2, Minus, Plus, Clock } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { useBackend } from "../backend/db";
import { Button, Container, Section, SectionHeader } from "../components/ui";
import { Field, inputStyle } from "../components/dash";
import { accountRequest } from "../backend/accountsApi";

const GOVS = ["Cairo", "Giza", "Alexandria", "Qalyubia", "Dakahlia", "Sharqia", "Port Said", "Suez"];

export function RequestQuote() {
  const uiText = useLocaleText();

  const { t, locale } = useI18n();
  const { quote, products, updateQuoteQty, removeFromQuote, clearQuote } = useStore();
  const { api, session } = useBackend();
  const nav = useNavigate();
  const [busy,setBusy]=useState(false),[error,setError]=useState(false);
  const [units,setUnits]=useState<Record<string,string>>({});
  const [d, setD] = useState({ governorate: "Cairo", destination: "", deliveryDate: "", projectType: "Residential", phased: false, notes: "", hours: 24 });

  let supplierProducts:Record<string,any>={};try{supplierProducts=JSON.parse(localStorage.getItem('idea.supplierProducts')||'{}');}catch{}
  const rows = quote.map((q) => {
    const own=q.productId.startsWith('supplier:')?supplierProducts[q.productId.slice(9)]:null;
    const product=own?{id:q.productId,name:{en:own.title,ar:own.title,fr:own.title},image:own.specifications?.image||'',model:own.sku||'',sizes:[{label:own.specifications?.dimensions||''}],variant:''}:products.find(p=>p.id===q.productId);
    return {item:q,product};
  }).filter((row)=>row.product);

  const submit = async () => {
    if (!session) { nav("/login?next=/request-quote/new"); return; }
    setBusy(true);setError(false);
    try {
      await accountRequest('request-quotes',{items:rows.map(({item,product})=>({...product.id.startsWith('supplier:')?{supplier_product_id:product.id.slice(9)}:{product_id:product.id},quantity:item.quantity,unit:units[product.id]||item.unit})),
        governorate:d.governorate,destination:d.destination,delivery_date:d.deliveryDate,notes:d.notes,hours:d.hours});
      clearQuote();nav('/account/outbox');
    }catch{setError(true);}finally{setBusy(false);}
  };

  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container style={{ maxWidth: 900 }}>
        <SectionHeader eyebrow={uiText(t("rfq.window"))} title={uiText(t("quote.title"))} sub={uiText(t("quote.note24"))} />
        {uiText(rows.length === 0 ? (
          <div style={{ padding: "var(--idea-space-8)", textAlign: "center", border: "1px dashed var(--idea-border)", borderRadius: "var(--idea-radius-lg)", color: "var(--idea-text-muted)" }}>
            <p>{uiText(t("quote.empty"))}</p>
            <Link to="/products"><Button variant="outline" style={{ marginTop: "var(--idea-space-4)" }}>{uiText(t("action.browseAll"))}</Button></Link>
          </div>
        ) : (
          <>
            {/* Step 1 — items & quantity */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--idea-space-3)", marginBottom: "var(--idea-space-6)" }}>
              {uiText(rows.map(({ item, product }) => (
                <div key={item.productId} style={{ display: "flex", flexWrap: "wrap", gap: "var(--idea-space-4)", alignItems: "center", background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-3)" }}>
                  <img src={product.image} alt={uiText(product.name[locale])} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "var(--idea-radius-sm)" }} />
                  <div style={{ flex: 1 }}>
                    <div className="idea-display" style={{ fontSize: "var(--idea-text-base)", color: "var(--idea-text)" }}>{uiText(product.name[locale])}</div>
                    <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{uiText(product.model)}{uiText(" · ")}{uiText(product.sizes[0]?.label)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => updateQuoteQty(item.productId, item.quantity - (item.unit === "sqm" ? 10 : 1))} style={qtyBtn}><Minus size={14} /></button>
                    <input aria-label={locale==='ar'?'الكمية المطلوبة':'Requested quantity'} type="number" min={0.001} step={0.001} max={1000000} value={item.quantity} onChange={(e) => updateQuoteQty(item.productId, Number(e.target.value) || 1)}
                      style={{ width: 70, textAlign: "center", background: "var(--idea-surface-2)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-sm)", color: "var(--idea-text)", padding: "6px" }} />
                    <select aria-label={locale==='ar'?'وحدة القياس':'Quantity unit'} style={{...inputStyle,width:85}} value={units[product.id]||item.unit} onChange={event=>setUnits(old=>({...old,[product.id]:event.target.value}))}><option value="sqm">{locale==='ar'?'م²':'m²'}</option><option value="pieces">{locale==='ar'?'قطعة':'pieces'}</option><option value="ton">{locale==='ar'?'طن':'tonnes'}</option><option value="kg">{locale==='ar'?'كجم':'kg'}</option></select>
                    <button onClick={() => updateQuoteQty(item.productId, item.quantity + (item.unit === "sqm" ? 10 : 1))} style={qtyBtn}><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromQuote(item.productId)} aria-label={uiText("Remove")} style={{ ...qtyBtn, color: "var(--idea-danger)" }}><Trash2 size={15} /></button>
                </div>
              )))}
              <p style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>{uiText("Large professional quantities (e.g. 10,000 m²) are supported — type any value.")}</p>
            </div>

            {/* Step 2 — delivery details */}
            <div style={{ background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-5)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--idea-space-4)" }}>
                <Field label={uiText(t("rfq.deliveryGov"))}>
                  <select style={inputStyle} value={d.governorate} onChange={(e) => setD({ ...d, governorate: e.target.value })}>{uiText(GOVS.map((g) => <option key={g} value={g}>{uiText(g)}</option>))}</select>
                </Field>
                <Field label={uiText(t("rfq.date"))}><input type="date" style={inputStyle} value={d.deliveryDate} onChange={(e) => setD({ ...d, deliveryDate: e.target.value })} /></Field>
                <Field label={uiText(t("rfq.destination"))}><input style={inputStyle} value={d.destination} onChange={(e) => setD({ ...d, destination: e.target.value })} placeholder={uiText("Street, building, area…")} /></Field>
                <Field label={uiText(t("rfq.projectType"))}>
                  <select style={inputStyle} value={d.projectType} onChange={(e) => setD({ ...d, projectType: e.target.value })}>{uiText(["Residential", "Commercial", "Hospitality", "Contracting / Tender"].map((g) => <option key={g} value={g}>{uiText(g)}</option>))}</select>
                </Field>
              </div>
              <Field label={uiText(t("rfq.notes"))}><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} /></Field>
              <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: "var(--idea-space-5)", flexWrap: "wrap" }}>
                <label style={{ display: "flex", gap: 8, color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>
                  <input type="checkbox" checked={d.phased} onChange={(e) => setD({ ...d, phased: e.target.checked })} /> {uiText(t("rfq.phased"))}
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>
                  <Clock size={15} color="var(--idea-gold)" />
                  <select style={{ ...inputStyle, width: "auto", padding: "6px 10px" }} value={d.hours} onChange={(e) => setD({ ...d, hours: Number(e.target.value) })}>
                    <option value={24}>{uiText("Offers within 24 hours")}</option><option value={48}>{uiText("48 hours (large projects)")}</option>
                  </select>
                </label>
              </div>
              <div style={{ display: "flex", gap: "var(--idea-space-3)", flexWrap: "wrap" }}>
                <Button size="lg" disabled={busy} onClick={()=>void submit()}>{busy?uiText("Sending…"):uiText(t("quote.submit"))}</Button>
                <Button variant="ghost" onClick={clearQuote}>{uiText(t("filters.clear"))}</Button>
              </div>
              {error&&<p role="alert">{locale==='ar'?'تعذّر إرسال طلب السعر. راجع حسابك والكمية وحاول مرة أخرى.':'Could not send your price request. Check your account and quantities, then try again.'}</p>}
              {uiText(!session && <p style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", marginTop: 10 }}>{uiText("You'll be asked to sign in to submit and receive private offers.")}</p>)}
            </div>
          </>
        ))}
      </Container>
    </Section>
  );
}

const qtyBtn: React.CSSProperties = {
  width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: "var(--idea-radius-sm)",
  border: "1px solid var(--idea-border-neutral)", background: "var(--idea-surface-2)", color: "var(--idea-text)", cursor: "pointer",
};
