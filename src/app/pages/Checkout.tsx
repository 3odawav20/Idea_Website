import { useState } from "react";
import { useSearchParams, useNavigate, Navigate } from "react-router";
import { ShieldCheck, Lock, House } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useBackend, type PaymentMethodKey } from "../backend/db";
import { Container, Section, SectionHeader, Button } from "../components/ui";
import { Panel, EmptyState } from "../components/dash";
import { VisaMark, MastercardMark, MeezaMark, FawryMark, ApplePayMark } from "../components/BrandIcons";

const METHODS: { key: PaymentMethodKey; tKey: string; marks: () => React.ReactNode }[] = [
  { key: "card", tKey: "pay.card", marks: () => <><span style={chip}><VisaMark /></span><span style={chip}><MastercardMark /></span><span style={chip}><MeezaMark /></span></> },
  { key: "fawry", tKey: "pay.fawry", marks: () => <span style={chip}><FawryMark /></span> },
  { key: "wallet", tKey: "pay.wallet", marks: () => <span style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>Vodafone · Orange · e& cash</span> },
  { key: "applepay", tKey: "pay.applepay", marks: () => <span style={{ ...chip, background: "var(--idea-text)" }}><ApplePayMark /></span> },
  { key: "bank", tKey: "pay.bank", marks: () => null },
];
const chip: React.CSSProperties = { background: "var(--idea-surface)", borderRadius: "var(--idea-radius-sm)", padding: "var(--idea-space-1) var(--idea-space-2)", display: "inline-flex", alignItems: "center" };

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

  if (!session) return <Navigate to={"/login?next=" + encodeURIComponent(window.location.pathname + window.location.search)} replace />;
  if (plan && amount < 0) return (
    <Section style={{ paddingTop: "var(--idea-space-8)" }}>
      <Container style={{ maxWidth: 560 }}>
        <EmptyState title="Custom pricing" sub="This plan is activated by the IDEA team after pricing is confirmed." />
        <div style={{ display: "flex", justifyContent: "center", marginTop: "var(--idea-space-4)" }}>
          <Button variant="outline" onClick={() => nav("/subscriptions")}>Back to subscriptions</Button>
        </div>
      </Container>
    </Section>
  );

  if (!order && !plan) return (
    <Section style={{ paddingTop: "var(--idea-space-8)" }}>
      <Container style={{ maxWidth: 560 }}>
        <EmptyState title={t("checkout.nothingTitle")} sub={t("checkout.nothingSub")} />
        <div style={{ display: "flex", justifyContent: "center", marginTop: "var(--idea-space-4)" }}>
          <Button variant="outline" onClick={() => nav("/")}><House size={15} /> {t("checkout.backHome")}</Button>
        </div>
      </Container>
    </Section>
  );

  const pay = () => {
    const ok = Boolean(cfg?.enabled && cfg?.merchantConfigured);
    if (!ok) { setDone("fail"); return; }
    if (order) api.sandboxPay(order.id, true);
    if (plan) api.subscribe(plan.id, interval, true);
    setDone("ok");
  };

  if (done) {
    return (
      <Section style={{ paddingTop: "var(--idea-space-8)" }}>
        <Container style={{ maxWidth: 520, textAlign: "center" }}>
          <Panel>
            <div className="idea-display" style={{ fontSize: "var(--idea-text-xl)", color: done === "ok" ? "var(--idea-gold-bright)" : "var(--idea-danger)" }}>
              {done === "ok" ? t("checkout.authorized") : t("checkout.failed")}
            </div>
            <p style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", margin: "10px 0 16px" }}>
              {done === "ok"
                ? (order ? t("checkout.orderReady") : t("checkout.subscriptionActive"))
                : t("checkout.merchantMissing")}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Button onClick={() => nav(order ? "/account/orders" : "/account/subscription")}>{order ? t("checkout.viewOrders") : t("checkout.viewSubscription")}</Button>
              <Button variant="outline" onClick={() => nav("/")}><House size={15} /> {t("checkout.backHome")}</Button>
            </div>
          </Panel>
        </Container>
      </Section>
    );
  }

  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container style={{ maxWidth: 620 }}>
        <SectionHeader eyebrow={t("checkout.secure")} title={order ? t("checkout.confirmPay") : `${t("checkout.subscribe")} — ${plan?.name}`} />
        <Panel style={{ marginBottom: "var(--idea-space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--idea-text)" }}>
            <span>{order ? `Order ${order.id}` : `${plan?.name} (${interval})`}</span>
            <span className="idea-display" style={{ color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-xl)" }}>{amount.toLocaleString()} {t("common.egp")}</span>
          </div>
        </Panel>
        <Panel>
          <div className="idea-eyebrow" style={{ marginBottom: 12 }}>{t("checkout.paymentMethod")}</div>
          <div style={{ display: "grid", gap: 8 }}>
            {METHODS.map((m) => {
              const mc = db.payments.find((p) => p.key === m.key);
              const active = method === m.key;
              return (
                <button key={m.key} disabled={!mc?.enabled || !mc?.merchantConfigured} onClick={() => setMethod(m.key)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, cursor: mc?.enabled && mc?.merchantConfigured ? "pointer" : "not-allowed", opacity: mc?.enabled && mc?.merchantConfigured ? 1 : .58,
                  padding: "12px 14px", borderRadius: "var(--idea-radius-md)", textAlign: "start",
                  border: `1px solid ${active ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`,
                  background: active ? "var(--idea-gold-soft)" : "var(--idea-surface-2)",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 999, border: `4px solid ${active ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`, background: active ? "var(--idea-gold-bright)" : "transparent" }} />
                    <span style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-sm)" }}>{t(m.tKey)}</span>
                  </span>
                  <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {m.key === "bank" ? <span style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{t("checkout.instantTransfer")}</span> : m.marks()}
                    {!mc?.merchantConfigured && <span style={{ color: "var(--idea-text-faint)", fontSize: 10 }}>{t("checkout.notConfigured")}</span>}
                  </span>
                </button>
              );
            })}
          </div>
          <Button style={{ width: "100%", marginTop: "var(--idea-space-5)" }} disabled={!cfg?.enabled || !cfg?.merchantConfigured} onClick={pay}><Lock size={15} /> {cfg?.enabled && cfg?.merchantConfigured ? t("checkout.pay") + " " + amount.toLocaleString() + " " + t("common.egp") : "Payment activation pending"}</Button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 12, color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>
            <ShieldCheck size={13} color="var(--idea-gold)" /> {t("checkout.sandboxNote")}
          </div>
        </Panel>
      </Container>
    </Section>
  );
}
