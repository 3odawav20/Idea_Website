import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams, Link } from "react-router";
import { useI18n } from "../i18n/i18n";
import { useBackend } from "../backend/db";
import { useStore } from "../store/store";
import { Container, Section, SectionHeader, Button } from "../components/ui";
import { DashLayout, Panel, StatusBadge, EmptyState, Field, inputStyle } from "../components/dash";
import { BusinessSubscription } from "./Subscriptions";

function useBiz() {
  const { session, db } = useBackend();
  return db.businesses.find((b) => b.ownerId === session?.id) || null;
}

export function BusinessLayout() {
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
    { to: "/business/requests", label: t("acct.requests") },
    { to: "/business/offers", label: t("acct.offers") },
    { to: "/business/orders", label: t("acct.orders") },
    { to: "/business/products", label: t("biz.products") },
    { to: "/business/subscription", label: t("acct.subscription") },
    { to: "/business/reports", label: t("biz.reports") },
    { to: "/business/settings", label: t("acct.settings") },
  ];
  return <DashLayout title={t("biz.title")} links={links}><div lang={locale}><Outlet /></div></DashLayout>;
}

export function BusinessOnboarding() {
  const { session, api } = useBackend();
  const { t } = useI18n();
  const nav = useNavigate();
  const [f, setF] = useState({ legalName: "", publicName: "", representative: "", email: session?.email || "", phone: session?.phone || "", governorate: "Cairo", companyType: "Supplier", crNumber: "", taxNumber: "" });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const govs = ["Cairo", "Giza", "Alexandria", "Qalyubia", "Dakahlia", "Sharqia"];
  const submit = () => {
    api.createBusiness({ ...f, ownerId: session?.id, serviceAreas: govs, brands: ["Ceramica Art"], categories: ["Ceramic", "Porcelain"] });
    api.setRole("business");
    nav("/business/verification");
  };
  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container style={{ maxWidth: 720 }}>
        <SectionHeader eyebrow={t("auth.forBusiness")} title={t("biz.onboarding")} sub="Provide your company details for verification. Legal documents are never shown publicly." />
        <Panel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--idea-space-4)" }}>
            <Field label="Legal company name"><input style={inputStyle} value={f.legalName} onChange={(e) => set("legalName", e.target.value)} /></Field>
            <Field label="Public business name"><input style={inputStyle} value={f.publicName} onChange={(e) => set("publicName", e.target.value)} /></Field>
            <Field label="Authorized representative"><input style={inputStyle} value={f.representative} onChange={(e) => set("representative", e.target.value)} /></Field>
            <Field label="Business email"><input style={inputStyle} value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Egyptian phone number"><input style={inputStyle} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+20…" /></Field>
            <Field label="Governorate">
              <select style={inputStyle} value={f.governorate} onChange={(e) => set("governorate", e.target.value)}>{govs.map((g) => <option key={g}>{g}</option>)}</select>
            </Field>
            <Field label="Company type">
              <select style={inputStyle} value={f.companyType} onChange={(e) => set("companyType", e.target.value)}>{["Ceramic shop", "Porcelain supplier", "Sanitary-ware company", "Manufacturer", "Importer", "Distributor"].map((g) => <option key={g}>{g}</option>)}</select>
            </Field>
            <Field label="Commercial registration"><input style={inputStyle} value={f.crNumber} onChange={(e) => set("crNumber", e.target.value)} /></Field>
            <Field label="Tax registration"><input style={inputStyle} value={f.taxNumber} onChange={(e) => set("taxNumber", e.target.value)} /></Field>
          </div>
          <Field label="Business documents (CR / tax card)">
            <input type="file" multiple style={{ ...inputStyle, padding: 8 }} />
          </Field>
          <Button onClick={submit} disabled={!f.legalName || !f.publicName}>Submit for verification</Button>
        </Panel>
      </Container>
    </Section>
  );
}

export function BusinessVerification() {
  const biz = useBiz();
  const { api } = useBackend();
  if (!biz) return <EmptyState title="No business profile" sub="Complete onboarding first." />;
  const steps: { s: string; done: boolean }[] = [
    { s: "Company details submitted", done: true },
    { s: "Documents uploaded", done: true },
    { s: "Admin review", done: ["Verified", "Rejected"].includes(biz.status) },
    { s: "Verified & active", done: biz.status === "Verified" },
  ];
  return (
    <>
      <Panel style={{ marginBottom: "var(--idea-space-4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="idea-display" style={{ fontSize: "var(--idea-text-lg)", color: "var(--idea-text)" }}>{biz.publicName}</div>
          <StatusBadge text={biz.status} tone={biz.status === "Verified" ? "green" : biz.status === "Rejected" ? "red" : "gold"} />
        </div>
        <div style={{ marginTop: "var(--idea-space-4)", display: "flex", flexDirection: "column", gap: 10 }}>
          {steps.map((st) => (
            <div key={st.s} style={{ display: "flex", gap: 10, color: st.done ? "var(--idea-text)" : "var(--idea-text-faint)" }}>
              <span style={{ width: 18, height: 18, borderRadius: 999, border: "1px solid var(--idea-gold)", background: st.done ? "var(--idea-gold)" : "transparent" }} /> {st.s}
            </div>
          ))}
        </div>
        {biz.status !== "Verified" && <Button size="sm" variant="outline" style={{ marginTop: 14 }} onClick={() => api.updateBusinessStatus(biz.id, "Verified")}>Simulate admin approval (dev)</Button>}
      </Panel>
      <p style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>Only verified active businesses may submit real offers. Verification decisions are made by IDEA administrators.</p>
    </>
  );
}

export function BusinessInbox() {
  const biz = useBiz();
  const { db, api } = useBackend();
  if (!biz) return <EmptyState title="Complete verification first" />;
  const msgs = db.messages.filter((m) => m.to === biz.id);
  if (!msgs.length) return <EmptyState title="No messages" sub="Matching customer requests appear here." />;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {msgs.map((m) => (
        <Panel key={m.id} style={{ borderInlineStart: m.read ? undefined : "2px solid var(--idea-gold)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div className="idea-display" style={{ color: "var(--idea-text)" }}>{m.title}</div>
            {!m.read && <button onClick={() => api.markRead(m.id)} style={{ background: "none", border: "none", color: "var(--idea-gold-bright)", cursor: "pointer", fontSize: "var(--idea-text-xs)" }}>Mark read</button>}
          </div>
          <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginTop: 4 }}>{m.body}</div>
          {m.requestId && <Link to={`/business/requests/${m.requestId}`} style={{ color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-sm)" }}>Open request →</Link>}
        </Panel>
      ))}
    </div>
  );
}

export function BusinessRequests() {
  const biz = useBiz();
  const { db } = useBackend();
  if (!biz) return <EmptyState title="Complete verification first" />;
  const reqs = db.requests.filter((r) => r.matchedBusinessIds.includes(biz.id));
  if (!reqs.length) return <EmptyState title="No matching requests" sub="You are matched to requests in your service area." />;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {reqs.map((r) => {
        const mine = db.offers.find((o) => o.requestId === r.id && o.businessId === biz.id);
        return (
          <Panel key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div className="idea-display" style={{ color: "var(--idea-text)" }}>{r.quantity} {r.unit} · {r.governorate}</div>
              <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>Deadline {new Date(r.deadlineAt).toLocaleString()}</div>
            </div>
            {mine ? <StatusBadge text={mine.status === "accepted" ? "Won" : mine.status === "not-selected" ? "Not selected" : "Offer sent"} tone={mine.status === "accepted" ? "green" : mine.status === "not-selected" ? "muted" : "gold"} />
              : <Link to={`/business/requests/${r.id}`}><Button size="sm">Submit offer</Button></Link>}
          </Panel>
        );
      })}
    </div>
  );
}

export function BusinessRequestDetail() {
  const { requestId } = useParams();
  const biz = useBiz();
  const { db, api } = useBackend();
  const { products } = useStore();
  const { locale } = useI18n();
  const nav = useNavigate();
  const req = db.requests.find((r) => r.id === requestId);
  const [o, setO] = useState({ unitPrice: 180, shipping: 4000, prepDays: 3, deliveryDays: 7, quantity: req?.quantity || 0, exact: true, paymentTerms: "50% deposit", notes: "" });
  if (!biz || !req) return <EmptyState title="Request not available" />;
  const product = products.find((p) => p.id === req.productId);
  const submit = () => {
    api.submitOffer({ requestId: req.id, businessId: biz.id, exactProduct: o.exact, quantity: o.quantity, unit: req.unit, unitPrice: o.unitPrice, shipping: o.shipping, taxRate: 0.14, availability: "In stock", prepDays: o.prepDays, deliveryDays: o.deliveryDays, paymentTerms: o.paymentTerms, notes: o.notes, expiresAt: Date.now() + 72 * 3600_000 });
    nav("/business/offers");
  };
  const num = (k: keyof typeof o) => (e: React.ChangeEvent<HTMLInputElement>) => setO((s) => ({ ...s, [k]: Number(e.target.value) }));
  return (
    <>
      <Panel style={{ marginBottom: "var(--idea-space-4)" }}>
        <div className="idea-eyebrow">Request {req.id}</div>
        <div className="idea-display" style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-lg)", marginTop: 4 }}>{product?.name[locale]} · {req.quantity} {req.unit}</div>
        <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>{req.governorate} · {req.destination} · needed {req.deliveryDate || "flexible"}</div>
        <p style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", marginTop: 8 }}>You cannot see other suppliers' offers. Your price is private to this customer.</p>
      </Panel>
      <Panel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--idea-space-4)" }}>
          <Field label={`Unit price (EGP / ${req.unit})`}><input type="number" style={inputStyle} value={o.unitPrice} onChange={num("unitPrice")} /></Field>
          <Field label={`Quantity offered (${req.unit})`}><input type="number" style={inputStyle} value={o.quantity} onChange={num("quantity")} /></Field>
          <Field label="Shipping (EGP)"><input type="number" style={inputStyle} value={o.shipping} onChange={num("shipping")} /></Field>
          <Field label="Preparation (days)"><input type="number" style={inputStyle} value={o.prepDays} onChange={num("prepDays")} /></Field>
          <Field label="Delivery (days)"><input type="number" style={inputStyle} value={o.deliveryDays} onChange={num("deliveryDays")} /></Field>
          <Field label="Payment terms"><input style={inputStyle} value={o.paymentTerms} onChange={(e) => setO((s) => ({ ...s, paymentTerms: e.target.value }))} /></Field>
        </div>
        <label style={{ display: "flex", gap: 8, color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginBottom: 12 }}>
          <input type="checkbox" checked={o.exact} onChange={(e) => setO((s) => ({ ...s, exact: e.target.checked }))} /> Exact product (uncheck for approved equivalent)
        </label>
        <Button onClick={submit}>Submit private offer</Button>
      </Panel>
    </>
  );
}

export function BusinessOffers() {
  const biz = useBiz();
  const { db } = useBackend();
  if (!biz) return <EmptyState title="Complete verification first" />;
  const offers = db.offers.filter((o) => o.businessId === biz.id);
  if (!offers.length) return <EmptyState title="No offers submitted yet" />;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {offers.map((o) => (
        <Panel key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div className="idea-display" style={{ color: "var(--idea-text)" }}>{o.quantity} {o.unit} @ {o.unitPrice} EGP</div>
            <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{o.id} · req {o.requestId}</div></div>
          <StatusBadge text={o.status} tone={o.status === "accepted" ? "green" : o.status === "not-selected" ? "muted" : "gold"} />
        </Panel>
      ))}
    </div>
  );
}

export function BusinessOrders() {
  const biz = useBiz();
  const { db } = useBackend();
  if (!biz) return <EmptyState title="Complete verification first" />;
  const orders = db.orders.filter((o) => o.businessId === biz.id);
  if (!orders.length) return <EmptyState title="No orders yet" />;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {orders.map((o) => (
        <Panel key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div className="idea-display" style={{ color: "var(--idea-text)" }}>{o.id}</div>
            <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{o.total.toLocaleString()} EGP</div></div>
          <StatusBadge text={o.status} tone={o.status === "Delivered" ? "green" : "gold"} />
        </Panel>
      ))}
    </div>
  );
}

export function BusinessProducts() {
  const biz = useBiz();
  const { api, db } = useBackend();
  const { products } = useStore();
  const { locale } = useI18n();
  const [q, setQ] = useState("");
  if (!biz) return <EmptyState title="Complete verification first" />;
  const connected = db.businesses.find((b) => b.id === biz.id)?.productIds || [];
  const list = products.filter((p) => p.name.en.toLowerCase().includes(q.toLowerCase())).slice(0, 30);
  return (
    <>
      <Panel style={{ marginBottom: "var(--idea-space-4)" }}>
        <div className="idea-display" style={{ color: "var(--idea-text)", marginBottom: 8 }}>Connect catalogue products you supply ({connected.length} connected)</div>
        <input style={inputStyle} placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
      </Panel>
      <div style={{ display: "grid", gap: 8 }}>
        {list.map((p) => {
          const on = connected.includes(p.id);
          return (
            <Panel key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--idea-space-3) var(--idea-space-4)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <img src={p.image} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "var(--idea-radius-sm)" }} />
                <div><div style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-sm)" }}>{p.name[locale]}</div>
                  <div style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>{p.sizes[0]?.label} · {p.finish}</div></div>
              </div>
              <Button size="sm" variant={on ? "ghost" : "outline"} onClick={() => api.connectProduct(biz.id, p.id)} disabled={on}>{on ? "Connected" : "Connect"}</Button>
            </Panel>
          );
        })}
      </div>
    </>
  );
}

export function BusinessReports() {
  const biz = useBiz();
  const { db } = useBackend();
  if (!biz) return <EmptyState title="Complete verification first" />;
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
      {stats.map((s) => <Panel key={s.label} style={{ textAlign: "center" }}><div className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-gold-bright)" }}>{s.value}</div><div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{s.label}</div></Panel>)}
    </div>
  );
}

export function BusinessOverview() {
  const biz = useBiz();
  const { t } = useI18n();
  if (!biz) return (
    <Panel style={{ textAlign: "center" }}>
      <div className="idea-display" style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-lg)" }}>Welcome to the Business Center</div>
      <p style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", margin: "10px 0 16px" }}>Complete onboarding to start supplying and submitting offers.</p>
      <Link to="/business/onboarding"><Button>{t("biz.onboarding")}</Button></Link>
    </Panel>
  );
  return <BusinessReports />;
}

export function BusinessSubscriptionPage() { return <BusinessSubscription />; }
export function BusinessSettings() {
  const biz = useBiz();
  const { t } = useI18n();
  if (!biz) return <EmptyState title="Complete onboarding first" />;
  return (
    <Panel>
      <Field label="Public business name"><input style={inputStyle} defaultValue={biz.publicName} /></Field>
      <Field label="Business email"><input style={inputStyle} defaultValue={biz.email} /></Field>
      <Field label="Minimum order (m²)"><input style={inputStyle} type="number" defaultValue={biz.minOrderM2} /></Field>
      <Button size="sm">{t("common.save")}</Button>
    </Panel>
  );
}
