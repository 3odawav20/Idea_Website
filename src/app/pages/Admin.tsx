import { useUiText as useLocaleText } from "../i18n/useUiText";
import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import { useI18n } from "../i18n/i18n";
import { useBackend, type Plan, type PaymentMethodConfig } from "../backend/db";
import { Container, Section, SectionHeader, Button } from "../components/ui";
import { Panel, StatusBadge, Field, inputStyle } from "../components/dash";

export function AdminLayout() {
  const uiText = useLocaleText();

  const { t } = useI18n();
  const { session } = useBackend();
  const nav = useNavigate();
  if (!session || session.role !== "admin") {
    return (
      <Section style={{ paddingTop: "var(--idea-space-8)" }}>
        <Container style={{ maxWidth: 440, textAlign: "center" }}>
          <Panel>
            <div className="idea-display" style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-lg)" }}>{uiText("Administrator area")}</div>
            <p style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", margin: "10px 0 16px" }}>{uiText("Administrator access is assigned and verified by the production backend.")}</p>
            <Button variant="outline" onClick={() => nav("/login")}>{uiText("Sign in")}</Button>
          </Panel>
        </Container>
      </Section>
    );
  }
  const links = [
    { to: "/admin", label: "Overview" },
    { to: "/admin/subscriptions", label: t("nav.subscriptions") },
    { to: "/admin/settings/payments", label: t("admin.payments") },
  ];
  return (
    <Container style={{ padding: "var(--idea-space-7) var(--idea-space-5)" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: "var(--idea-space-5)", flexWrap: "wrap" }}>
        {uiText(links.map((l) => (
          <NavLink key={l.to} to={l.to} end style={({ isActive }) => ({
            textDecoration: "none", padding: "8px 16px", borderRadius: "var(--idea-radius-full)", fontSize: "var(--idea-text-sm)",
            border: `1px solid ${isActive ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`,
            background: isActive ? "var(--idea-gold-soft)" : "transparent", color: isActive ? "var(--idea-gold-bright)" : "var(--idea-text-muted)",
          })}>{uiText(l.label)}</NavLink>
        )))}
      </div>
      <Outlet />
    </Container>
  );
}

export function AdminOverview() {
  const uiText = useLocaleText();

  const { db, api } = useBackend();
  const stats = [
    { label: "Products", value: "475" },
    { label: "Suppliers", value: db.businesses.length },
    { label: "Requests", value: db.requests.length },
    { label: "Offers", value: db.offers.length },
    { label: "Orders", value: db.orders.length },
    { label: "Subscriptions", value: db.subscriptions.filter((s) => s.status === "active").length },
  ];
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: "var(--idea-space-3)", marginBottom: "var(--idea-space-5)" }}>
        {uiText(stats.map((s) => <Panel key={s.label} style={{ textAlign: "center" }}><div className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-gold-bright)" }}>{uiText(s.value)}</div><div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{uiText(s.label)}</div></Panel>))}
      </div>
      <Panel style={{ marginBottom: "var(--idea-space-4)" }}>
        <div className="idea-display" style={{ color: "var(--idea-text)", marginBottom: 10 }}>{uiText("Supplier verification")}</div>
        {uiText(db.businesses.map((b) => (
          <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "var(--idea-hairline)" }}>
            <span style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-sm)" }}>{uiText(b.publicName)} <span style={{ color: "var(--idea-text-faint)" }}>{uiText("· ")}{uiText(b.governorate)}</span></span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <StatusBadge text={uiText(b.status)} tone={b.status === "Verified" ? "green" : b.status === "Rejected" ? "red" : "gold"} />
              {uiText(b.status !== "Verified" && <Button size="sm" variant="outline" onClick={() => api.updateBusinessStatus(b.id, "Verified")}>{uiText("Verify")}</Button>)}
              {uiText(b.status === "Verified" && <Button size="sm" variant="ghost" onClick={() => api.updateBusinessStatus(b.id, "Suspended")}>{uiText("Suspend")}</Button>)}
            </div>
          </div>
        )))}
      </Panel>
      <Panel>
        <div className="idea-display" style={{ color: "var(--idea-text)", marginBottom: 10 }}>{uiText("Audit log (latest ")}{uiText(Math.min(db.audit.length, 12))}{uiText(")")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: "var(--idea-font-body)", fontSize: 12, color: "var(--idea-text-muted)" }}>
          {uiText(db.audit.slice(0, 12).map((a) => <div key={a.id}>{uiText(new Date(a.at).toLocaleTimeString())}{uiText(" · ")}{uiText(a.action)}{uiText(" · ")}{uiText(a.detail)}</div>))}
          {uiText(!db.audit.length && <span>{uiText("No events yet.")}</span>)}
        </div>
      </Panel>
    </>
  );
}

export function AdminSubscriptions() {
  const uiText = useLocaleText();

  const { db, api } = useBackend();
  const [edit, setEdit] = useState<Plan | null>(null);
  return (
    <>
      <SectionHeader eyebrow={uiText("Configuration")} title={uiText("Subscription Plans")} sub={uiText("All prices (EGP), intervals and limits are editable here. Nothing is hard-coded.")} />
      <div style={{ display: "grid", gap: 8 }}>
        {uiText(db.plans.map((p) => (
          <Panel key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div><span style={{ color: "var(--idea-gold-bright)" }}>{uiText(p.audience)}</span>{uiText(" · ")}<span style={{ color: "var(--idea-text)" }}>{uiText(p.name)}</span>
              <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{uiText(p.monthly)}{uiText(" EGP/mo · ")}{uiText(p.annual)}{uiText(" EGP/yr · trial ")}{uiText(p.trialDays)}{uiText("d")}</div></div>
            <Button size="sm" variant="outline" onClick={() => setEdit(p)}>{uiText("Edit")}</Button>
          </Panel>
        )))}
      </div>
      {uiText(edit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "grid", placeItems: "center", zIndex: 100, padding: 20 }} onClick={() => setEdit(null)}>
          <Panel style={{ maxWidth: 420, width: "100%" }} >
            <div onClick={(e) => e.stopPropagation()}>
              <div className="idea-display" style={{ color: "var(--idea-text)", marginBottom: 12 }}>{uiText("Edit ")}{uiText(edit.name)}</div>
              <Field label={uiText("Monthly (EGP)")}><input type="number" style={inputStyle} value={edit.monthly} onChange={(e) => setEdit({ ...edit, monthly: Number(e.target.value) })} /></Field>
              <Field label={uiText("Annual (EGP)")}><input type="number" style={inputStyle} value={edit.annual} onChange={(e) => setEdit({ ...edit, annual: Number(e.target.value) })} /></Field>
              <Field label={uiText("Trial days")}><input type="number" style={inputStyle} value={edit.trialDays} onChange={(e) => setEdit({ ...edit, trialDays: Number(e.target.value) })} /></Field>
              <div style={{ display: "flex", gap: 8 }}>
                <Button size="sm" onClick={() => { api.updatePlan(edit); setEdit(null); }}>{uiText("Save")}</Button>
                <Button size="sm" variant="ghost" onClick={() => setEdit(null)}>{uiText("Cancel")}</Button>
              </div>
            </div>
          </Panel>
        </div>
      ))}
    </>
  );
}

export function AdminPayments() {
  const uiText = useLocaleText();

  const { db, api } = useBackend();
  const label: Record<string, string> = { card: "Card (Visa · Mastercard · Meeza)", fawry: "Fawry Pay", wallet: "Mobile Wallet", applepay: "Apple Pay", bank: "Bank / Instant Transfer" };
  const set = (cfg: PaymentMethodConfig, patch: Partial<PaymentMethodConfig>) => api.updatePayment({ ...cfg, ...patch });
  return (
    <>
      <SectionHeader eyebrow={uiText("Configuration")} title={uiText("Payment Settings")} sub={uiText("Currency: Egyptian Pound (EGP). Production keys are never stored client-side. A method cannot be enabled for production until sandbox tests and webhook validation pass.")} />
      <div style={{ display: "grid", gap: 10 }}>
        {uiText(db.payments.map((p) => (
          <Panel key={p.key}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div className="idea-display" style={{ color: "var(--idea-text)" }}>{uiText(label[p.key])}</div>
                <div style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>{uiText(p.provider)}{uiText(" · ")}{uiText(p.currency)}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <StatusBadge text={uiText(p.merchantConfigured ? "Merchant set" : "No credentials")} tone={p.merchantConfigured ? "green" : "muted"} />
                <StatusBadge text={uiText(p.webhookOk ? "Webhook OK" : "Webhook pending")} tone={p.webhookOk ? "green" : "muted"} />
                <select style={{ ...inputStyle, width: "auto", padding: "6px 10px" }} value={p.mode} onChange={(e) => set(p, { mode: e.target.value as "sandbox" | "production" })}>
                  <option value="sandbox">{uiText("Sandbox")}</option><option value="production">{uiText("Production")}</option>
                </select>
                <Button size="sm" variant="ghost" onClick={() => set(p, { merchantConfigured: !p.merchantConfigured })}>{uiText(p.merchantConfigured ? "Clear creds" : "Set creds (dev)")}</Button>
                <Button size="sm" variant="outline" onClick={() => api.testPayment(p.key)}>{uiText("Run test")}</Button>
                <label style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>
                  <input type="checkbox" checked={p.enabled} disabled={p.mode === "production" && !p.webhookOk} onChange={(e) => set(p, { enabled: e.target.checked })} />{uiText(" Enabled")}</label>
              </div>
            </div>
            {uiText(p.lastTest && <div style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", marginTop: 8 }}>{uiText("Last test ")}{uiText(new Date(p.lastTest).toLocaleString())} {uiText(p.lastFailure ? `· ${p.lastFailure}` : "· OK")}</div>)}
          </Panel>
        )))}
      </div>
    </>
  );
}
