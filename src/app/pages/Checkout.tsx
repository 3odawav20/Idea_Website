import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { ShieldCheck, Lock } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useBackend, type PaymentMethodKey } from "../backend/db";
import { Container, Section, SectionHeader, Button } from "../components/ui";
import { Panel, EmptyState } from "../components/dash";
import { VisaMark, MastercardMark, MeezaMark, FawryMark, ApplePayMark } from "../components/BrandIcons";

const METHODS: { key: PaymentMethodKey; tKey: string; marks: () => React.ReactNode }[] = [
  { key: "card", tKey: "pay.card", marks: () => <><span style={chip}><VisaMark /></span><span style={chip}><MastercardMark /></span><span style={chip}><MeezaMark /></span></> },
  { key: "fawry", tKey: "pay.fawry", marks: () => <span style={chip}><FawryMark /></span> },
  { key: "wallet", tKey: "pay.wallet", marks: () => <span style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>Vodafone · Orange · e& cash</span> },
  { key: "applepay", tKey: "pay.applepay", marks: () => <span style={{ ...chip, background: "#000" }}><ApplePayMark /></span> },
  { key: "bank", tKey: "pay.bank", marks: () => <span style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>Instant transfer</span> },
];
const chip: React.CSSProperties = { background: "#fff", borderRadius: 6, padding: "3px 6px", display: "inline-flex", alignItems: "center" };

export function Checkout() {
  const [sp] = useSearchParams();
  const { t } = useI18n();
  const { db, api, session } = useBackend();
  const nav = useNavigate();
  const [method, setMethod] = useState<PaymentMethodKey>("card");
  const [done, setDone] = useState<"ok" | "fail" | null>(null);

  const orderId = sp.get("order");
  const planId = sp.get("plan");
  const interval = (sp.get("interval") as "monthly" | "annual") || "monthly";
  const order = orderId ? db.orders.find((o) => o.id === orderId) : null;
  const plan = planId ? db.plans.find((p) => p.id === planId) : null;
  const amount = order ? order.total : plan ? (interval === "annual" ? plan.annual : plan.monthly) : 0;
  const cfg = db.payments.find((p) => p.key === method);

  if (!session) { nav("/login"); return null; }
  if (!order && !plan) return <Section style={{ paddingTop: "var(--idea-space-8)" }}><Container style={{ maxWidth: 560 }}><EmptyState title="Nothing to pay" sub="Accept an offer or choose a subscription plan." /></Container></Section>;

  const pay = () => {
    // Sandbox only: a method must be enabled with configured merchant creds to "authorize".
    const ok = !!cfg?.merchantConfigured;
    if (order) api.sandboxPay(order.id, ok);
    if (plan) api.subscribe(plan.id, interval, ok);
    setDone(ok ? "ok" : "fail");
  };

  if (done) {
    return (
      <Section style={{ paddingTop: "var(--idea-space-8)" }}>
        <Container style={{ maxWidth: 520, textAlign: "center" }}>
          <Panel>
            <div className="idea-display" style={{ fontSize: "var(--idea-text-xl)", color: done === "ok" ? "var(--idea-gold-bright)" : "var(--idea-danger)" }}>
              {done === "ok" ? "Sandbox payment authorized" : "Payment could not be completed"}
            </div>
            <p style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", margin: "10px 0 16px" }}>
              {done === "ok"
                ? (order ? "Your order is now preparing and an invoice was generated." : "Your subscription is now active.")
                : "This payment method has no configured merchant credentials, so it cannot authorize. An administrator must configure and test it in Admin → Payment Settings before it can be used in production."}
            </p>
            <Button onClick={() => nav(order ? "/account/orders" : "/account/subscription")}>{order ? "View orders" : "View subscription"}</Button>
          </Panel>
        </Container>
      </Section>
    );
  }

  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container style={{ maxWidth: 620 }}>
        <SectionHeader eyebrow="Secure checkout" title={order ? "Confirm & Pay" : `Subscribe — ${plan?.name}`} />
        <Panel style={{ marginBottom: "var(--idea-space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--idea-text)" }}>
            <span>{order ? `Order ${order.id}` : `${plan?.name} (${interval})`}</span>
            <span className="idea-display" style={{ color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-xl)" }}>{amount.toLocaleString()} {t("common.egp")}</span>
          </div>
        </Panel>
        <Panel>
          <div className="idea-eyebrow" style={{ marginBottom: 12 }}>Payment method</div>
          <div style={{ display: "grid", gap: 8 }}>
            {METHODS.map((m) => {
              const mc = db.payments.find((p) => p.key === m.key);
              const active = method === m.key;
              return (
                <button key={m.key} onClick={() => setMethod(m.key)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, cursor: "pointer",
                  padding: "12px 14px", borderRadius: "var(--idea-radius-md)", textAlign: "start",
                  border: `1px solid ${active ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`,
                  background: active ? "var(--idea-gold-soft)" : "var(--idea-surface-2)",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 999, border: `4px solid ${active ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`, background: active ? "var(--idea-gold-bright)" : "transparent" }} />
                    <span style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-sm)" }}>{t(m.tKey)}</span>
                  </span>
                  <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {m.marks()}
                    {!mc?.merchantConfigured && <span style={{ color: "var(--idea-text-faint)", fontSize: 10 }}>not configured</span>}
                  </span>
                </button>
              );
            })}
          </div>
          <Button style={{ width: "100%", marginTop: "var(--idea-space-5)" }} onClick={pay}><Lock size={15} /> Pay {amount.toLocaleString()} EGP (sandbox)</Button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 12, color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>
            <ShieldCheck size={13} color="var(--idea-gold)" /> Sandbox environment · no real charge · card data is never stored
          </div>
        </Panel>
      </Container>
    </Section>
  );
}
