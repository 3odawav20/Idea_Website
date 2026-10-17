import { useUiText as useLocaleText } from "../i18n/useUiText";
import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams, Link } from "react-router";
import { useI18n } from "../i18n/i18n";
import { useBackend } from "../backend/db";
import { useStore } from "../store/store";
import { Container, Section, SectionHeader, Button } from "../components/ui";
import { DashLayout, Panel, StatusBadge, EmptyState, Field, inputStyle } from "../components/dash";
import { BusinessSubscription } from "./Subscriptions";
import { SupplierCatalogue } from "./SupplierCatalogue";
import { accountRequest } from "../backend/accountsApi";
import { useMembershipText } from "./Membership";

function useBiz() {
  const { session, db } = useBackend();
  return db.businesses.find((b) => b.ownerId === session?.id) || null;
}

export function BusinessLayout() {
  const uiText = useLocaleText();

  const { t, locale } = useI18n();
  const { session, db } = useBackend();
  const nav = useNavigate();
  useEffect(() => { if (!session) nav("/login"); }, [session, nav]);
  if (!session) return null;
  const biz = db.businesses.find((b) => b.ownerId === session.id);
  const unread = biz ? db.messages.filter((m) => m.to === biz.id && !m.read).length : 0;
  const links = [
    { to: "/business", label: t("biz.title") },
    { to: "/business/verification", label: t("biz.verification") },
    { to: "/business/inbox", label: t("acct.inbox"), badge: unread },
    { to: "/business/outbox", label: locale === "ar" ? "الصادر" : "Sent" },
    { to: "/business/requests", label: t("acct.requests") },
    { to: "/business/offers", label: t("acct.offers") },
    { to: "/business/orders", label: t("acct.orders") },
    { to: "/business/products", label: t("biz.products") },
    { to: "/business/subscription", label: t("acct.subscription") },
    { to: "/business/reports", label: t("biz.reports") },
    { to: "/business/settings", label: t("acct.settings") },
  ];
  return <DashLayout title={uiText(t("biz.title"))} links={links}><div lang={locale}><Outlet /></div></DashLayout>;
}

export function BusinessOnboarding() {
  const text=useMembershipText(),biz=useBiz();
  return <Section><Container style={{maxWidth:720}}><Panel><h1>{text('Company registration','تسجيل الشركة')}</h1><p>{biz?text('Your company profile is ready. Continue to your catalogue or update your details.','ملف شركتك جاهز. أضف منتجاتك أو حدّث بيانات الشركة.'):text('Create a company account to submit your business for verification.','أنشئ حساب شركة لإرسال بياناتها للمراجعة.')}</p><Link to={biz?'/business/products':'/register/business'}><Button>{biz?text('Manage products','إدارة المنتجات'):text('Create company account','إنشاء حساب شركة')}</Button></Link></Panel></Container></Section>;
}

export function BusinessVerification() {
  const uiText = useLocaleText();

  const biz = useBiz();
  const { api } = useBackend();
  if (!biz) return <EmptyState title={uiText("No business profile")} sub={uiText("Complete onboarding first.")} />;
  const steps: { s: string; done: boolean }[] = [
    { s: "Company details submitted", done: true },
    { s: "Admin review", done: ["Verified", "Rejected"].includes(biz.status) },
    { s: "Verified & active", done: biz.status === "Verified" },
  ];
  return (
    <>
      <Panel style={{ marginBottom: "var(--idea-space-4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="idea-display" style={{ fontSize: "var(--idea-text-lg)", color: "var(--idea-text)" }}>{uiText(biz.publicName)}</div>
          <StatusBadge text={uiText(biz.status)} tone={biz.status === "Verified" ? "green" : biz.status === "Rejected" ? "red" : "gold"} />
        </div>
        <div style={{ marginTop: "var(--idea-space-4)", display: "flex", flexDirection: "column", gap: 10 }}>
          {uiText(steps.map((st) => (
            <div key={st.s} style={{ display: "flex", gap: 10, color: st.done ? "var(--idea-text)" : "var(--idea-text-faint)" }}>
              <span style={{ width: 18, height: 18, borderRadius: 999, border: "1px solid var(--idea-gold)", background: st.done ? "var(--idea-gold)" : "transparent" }} /> {uiText(st.s)}
            </div>
          )))}
        </div>
      </Panel>
      <p style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>{uiText("Only verified active businesses may submit real offers. Verification decisions are made by IDEA administrators.")}</p>
    </>
  );
}

export function BusinessInbox() {
  const uiText = useLocaleText();

  const biz = useBiz();
  const { db, api } = useBackend();
  if (!biz) return <EmptyState title={uiText("Complete verification first")} />;
  const msgs = db.messages.filter((m) => m.to === biz.id);
  if (!msgs.length) return <EmptyState title={uiText("No messages")} sub={uiText("Matching customer requests appear here.")} />;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {uiText(msgs.map((m) => (
        <Panel key={m.id} style={{ borderInlineStart: m.read ? undefined : "2px solid var(--idea-gold)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div className="idea-display" style={{ color: "var(--idea-text)" }}>{uiText(m.title)}</div>
            {uiText(!m.read && <button onClick={() => api.markRead(m.id)} style={{ background: "none", border: "none", color: "var(--idea-gold-bright)", cursor: "pointer", fontSize: "var(--idea-text-xs)" }}>{uiText("Mark read")}</button>)}
          </div>
          <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginTop: 4 }}>{uiText(m.body)}</div>
          {uiText(m.requestId && <Link to={`/business/requests/${m.requestId}`} style={{ color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-sm)" }}>{uiText("Open request →")}</Link>)}
        </Panel>
      )))}
    </div>
  );
}

export function BusinessRequests() {
  const uiText = useLocaleText();

  const biz = useBiz();
  const { db } = useBackend();
  if (!biz) return <EmptyState title={uiText("Complete verification first")} />;
  const reqs = db.requests.filter((r) => r.matchedBusinessIds.includes(biz.id));
  if (!reqs.length) return <EmptyState title={uiText("No matching requests")} sub={uiText("You are matched to requests in your service area.")} />;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {uiText(reqs.map((r) => {
        const mine = db.offers.find((o) => o.requestId === r.id && o.businessId === biz.id);
        return (
          <Panel key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div className="idea-display" style={{ color: "var(--idea-text)" }}>{uiText(r.quantity)} {uiText(r.unit)}{uiText(" · ")}{uiText(r.governorate)}</div>
              <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{uiText("Deadline ")}{uiText(new Date(r.deadlineAt).toLocaleString())}</div>
            </div>
            {uiText(mine ? <StatusBadge text={uiText(mine.status === "accepted" ? "Won" : mine.status === "not-selected" ? "Not selected" : "Offer sent")} tone={mine.status === "accepted" ? "green" : mine.status === "not-selected" ? "muted" : "gold"} />
              : <Link to={`/business/requests/${r.id}`}><Button size="sm">{uiText("Submit offer")}</Button></Link>)}
          </Panel>
        );
      }))}
    </div>
  );
}

export function BusinessRequestDetail() {
  const uiText = useLocaleText();

  const { requestId } = useParams();
  const biz = useBiz();
  const { db, api } = useBackend();
  const { products } = useStore();
  const { locale } = useI18n();
  const nav = useNavigate();
  const req = db.requests.find((r) => r.id === requestId);
  const [o, setO] = useState({ unitPrice: 180, shipping: 4000, prepDays: 3, deliveryDays: 7, quantity: req?.quantity || 0, exact: true, paymentTerms: "50% deposit", notes: "" });
  if (!biz || !req) return <EmptyState title={uiText("Request not available")} />;
  const product = products.find((p) => p.id === req.productId);
  const submit = () => {
    api.submitOffer({ requestId: req.id, businessId: biz.id, exactProduct: o.exact, quantity: o.quantity, unit: req.unit, unitPrice: o.unitPrice, shipping: o.shipping, taxRate: 0.14, availability: "In stock", prepDays: o.prepDays, deliveryDays: o.deliveryDays, paymentTerms: o.paymentTerms, notes: o.notes, expiresAt: Date.now() + 72 * 3600_000 });
    nav("/business/offers");
  };
  const num = (k: keyof typeof o) => (e: React.ChangeEvent<HTMLInputElement>) => setO((s) => ({ ...s, [k]: Number(e.target.value) }));
  return (
    <>
      <Panel style={{ marginBottom: "var(--idea-space-4)" }}>
        <div className="idea-eyebrow">{uiText("Request ")}{uiText(req.id)}</div>
        <div className="idea-display" style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-lg)", marginTop: 4 }}>{uiText(product?.name[locale])}{uiText(" · ")}{uiText(req.quantity)} {uiText(req.unit)}</div>
        <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>{uiText(req.governorate)}{uiText(" · ")}{uiText(req.destination)}{uiText(" · needed ")}{uiText(req.deliveryDate || "flexible")}</div>
        <p style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", marginTop: 8 }}>{uiText("You cannot see other suppliers' offers. Your price is private to this customer.")}</p>
      </Panel>
      <Panel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--idea-space-4)" }}>
          <Field label={uiText(`Unit price (EGP / ${req.unit})`)}><input type="number" style={inputStyle} value={o.unitPrice} onChange={num("unitPrice")} /></Field>
          <Field label={uiText(`Quantity offered (${req.unit})`)}><input type="number" style={inputStyle} value={o.quantity} onChange={num("quantity")} /></Field>
          <Field label={uiText("Shipping (EGP)")}><input type="number" style={inputStyle} value={o.shipping} onChange={num("shipping")} /></Field>
          <Field label={uiText("Preparation (days)")}><input type="number" style={inputStyle} value={o.prepDays} onChange={num("prepDays")} /></Field>
          <Field label={uiText("Delivery (days)")}><input type="number" style={inputStyle} value={o.deliveryDays} onChange={num("deliveryDays")} /></Field>
          <Field label={uiText("Payment terms")}><input style={inputStyle} value={o.paymentTerms} onChange={(e) => setO((s) => ({ ...s, paymentTerms: e.target.value }))} /></Field>
        </div>
        <label style={{ display: "flex", gap: 8, color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginBottom: 12 }}>
          <input type="checkbox" checked={o.exact} onChange={(e) => setO((s) => ({ ...s, exact: e.target.checked }))} />{uiText(" Exact product (uncheck for approved equivalent)")}</label>
        <Button onClick={submit}>{uiText("Submit private offer")}</Button>
      </Panel>
    </>
  );
}

export function BusinessOffers() {
  const uiText = useLocaleText();

  const biz = useBiz();
  const { db } = useBackend();
  if (!biz) return <EmptyState title={uiText("Complete verification first")} />;
  const offers = db.offers.filter((o) => o.businessId === biz.id);
  if (!offers.length) return <EmptyState title={uiText("No offers submitted yet")} />;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {uiText(offers.map((o) => (
        <Panel key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div className="idea-display" style={{ color: "var(--idea-text)" }}>{uiText(o.quantity)} {uiText(o.unit)}{uiText(" @ ")}{uiText(o.unitPrice)}{uiText(" EGP")}</div>
            <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{uiText(o.id)}{uiText(" · req ")}{uiText(o.requestId)}</div></div>
          <StatusBadge text={uiText(o.status)} tone={o.status === "accepted" ? "green" : o.status === "not-selected" ? "muted" : "gold"} />
        </Panel>
      )))}
    </div>
  );
}

export function BusinessOrders() {
  const uiText = useLocaleText();

  const biz = useBiz();
  const { db } = useBackend();
  if (!biz) return <EmptyState title={uiText("Complete verification first")} />;
  const orders = db.orders.filter((o) => o.businessId === biz.id);
  if (!orders.length) return <EmptyState title={uiText("No orders yet")} />;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {uiText(orders.map((o) => (
        <Panel key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div className="idea-display" style={{ color: "var(--idea-text)" }}>{uiText(o.id)}</div>
            <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{uiText(o.total.toLocaleString())}{uiText(" EGP")}</div></div>
          <StatusBadge text={uiText(o.status)} tone={o.status === "Delivered" ? "green" : "gold"} />
        </Panel>
      )))}
    </div>
  );
}

export function BusinessProducts() {
  return <SupplierCatalogue />;
}
export function BusinessReports() {
  const uiText = useLocaleText();

  const biz = useBiz();
  const { db } = useBackend();
  if (!biz) return <EmptyState title={uiText("Complete verification first")} />;
  const offers = db.offers.filter((o) => o.businessId === biz.id);
  const won = offers.filter((o) => o.status === "accepted").length;
  const stats = [
    { label: "Offers submitted", value: offers.length },
    { label: "Offers won", value: won },
    { label: "Win rate", value: offers.length ? Math.round((won / offers.length) * 100) + "%" : "—" },
    { label: "Products connected", value: biz.productIds.length },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "var(--idea-space-3)" }}>
      {uiText(stats.map((s) => <Panel key={s.label} style={{ textAlign: "center" }}><div className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-gold-bright)" }}>{uiText(s.value)}</div><div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{uiText(s.label)}</div></Panel>))}
    </div>
  );
}

export function BusinessOverview() {
  const uiText = useLocaleText();

  const biz = useBiz();
  const { t } = useI18n();
  if (!biz) return (
    <Panel style={{ textAlign: "center" }}>
      <div className="idea-display" style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-lg)" }}>{uiText("Welcome to the Business Center")}</div>
      <p style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", margin: "10px 0 16px" }}>{uiText("Complete onboarding to start supplying and submitting offers.")}</p>
      <Link to="/business/onboarding"><Button>{uiText(t("biz.onboarding"))}</Button></Link>
    </Panel>
  );
  return <BusinessReports />;
}

export function BusinessSubscriptionPage() { return <BusinessSubscription />; }
export function BusinessSettings() {
  const biz = useBiz();
  const text = useMembershipText();
  const [busy,setBusy]=useState(false),[status,setStatus]=useState<'saved'|'error'|null>(null);
  if (!biz) return <EmptyState title={text("Complete company registration first","أكمل تسجيل الشركة أولًا")} />;
  return <Panel><h1 style={{fontSize:'var(--idea-text-xl)',marginBottom:24}}>{text("Company information","بيانات الشركة")}</h1>
    <form key={biz.id} onSubmit={async event=>{
      event.preventDefault();const data=new FormData(event.currentTarget);setBusy(true);setStatus(null);
      try {await accountRequest('company',{public_name:String(data.get('name')).trim(),email:String(data.get('email')).trim(),phone:String(data.get('phone')).trim(),description:String(data.get('description')).trim()});setStatus('saved');}
      catch{setStatus('error');}finally{setBusy(false);}
    }}>
      <Field label={text("Company display name","اسم الشركة المعروض")}><input name="name" style={inputStyle} defaultValue={biz.publicName} required maxLength={200}/></Field>
      <Field label={text("Business email","بريد الشركة الإلكتروني")}><input name="email" style={inputStyle} type="email" defaultValue={biz.email} required/></Field>
      <Field label={text("Phone number","رقم الهاتف")}><input name="phone" style={inputStyle} type="tel" defaultValue={biz.phone} maxLength={40}/></Field>
      <Field label={text("Company description","نبذة عن الشركة")}><textarea name="description" style={inputStyle} defaultValue={biz.description} maxLength={2000}/></Field>
      <Button type="submit" disabled={busy}>{busy?text("Saving…","جارٍ الحفظ…"):text("Save company information","حفظ بيانات الشركة")}</Button>
      {status&&<p role="status">{status==='saved'?text("Company information saved.","تم حفظ بيانات الشركة."):text("Could not save company information. Please try again.","تعذّر حفظ بيانات الشركة. حاول مرة أخرى.")}</p>}
    </form>
  </Panel>;
}
