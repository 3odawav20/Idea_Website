import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { Check } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useBackend, type Plan } from "../backend/db";
import { Container, Section, SectionHeader, Button } from "../components/ui";
import { Panel, StatusBadge } from "../components/dash";

function PlanCard({ plan, interval, current, onChoose }: { plan: Plan; interval: "monthly" | "annual"; current: boolean; onChoose: () => void }) {
  const price = interval === "annual" ? plan.annual : plan.monthly;
  return (
    <div style={{
      background: "var(--idea-surface)", border: `1px solid ${current ? "var(--idea-gold)" : "var(--idea-border)"}`,
      borderRadius: "var(--idea-radius-lg)", padding: "var(--idea-space-5)", display: "flex", flexDirection: "column",
      boxShadow: current ? "var(--idea-shadow-gold)" : undefined,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="idea-display" style={{ fontSize: "var(--idea-text-lg)", color: "var(--idea-text)" }}>{plan.name}</div>
        {current && <StatusBadge text="Current" tone="gold" />}
      </div>
      <div style={{ margin: "var(--idea-space-3) 0" }}>
        <span className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-gold-bright)" }}>{price === 0 ? "Free" : price.toLocaleString()}</span>
        {price > 0 && <span style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}> EGP / {interval === "annual" ? "yr" : "mo"}</span>}
      </div>
      {plan.trialDays > 0 && <div style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", marginBottom: 10 }}>{plan.trialDays}-day free trial</div>}
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 var(--idea-space-5)", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {plan.features.map((f) => (
          <li key={f} style={{ display: "flex", gap: 8, color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>
            <Check size={15} color="var(--idea-gold)" style={{ flexShrink: 0, marginTop: 2 }} /> {f}
          </li>
        ))}
      </ul>
      <Button variant={current ? "ghost" : "gold"} onClick={onChoose} disabled={current}>{current ? "Active plan" : price === 0 ? "Select" : "Subscribe"}</Button>
    </div>
  );
}

function PlanGrid({ audience }: { audience: "customer" | "business" }) {
  const { db, session, api } = useBackend();
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const nav = useNavigate();
  const plans = db.plans.filter((p) => p.audience === audience);
  const sub = db.subscriptions.find((s) => s.userId === session?.id && s.status === "active");
  const choose = (plan: Plan) => {
    if (!session) { nav("/login"); return; }
    if (plan.monthly === 0 && plan.annual === 0) { api.subscribe(plan.id, interval, true); nav(audience === "business" ? "/business/subscription" : "/account/subscription"); return; }
    nav(`/checkout?plan=${plan.id}&interval=${interval}`);
  };
  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: "var(--idea-space-6)" }}>
        {(["monthly", "annual"] as const).map((x) => (
          <button key={x} onClick={() => setInterval(x)} style={{
            padding: "8px 20px", borderRadius: "var(--idea-radius-full)", cursor: "pointer", textTransform: "capitalize",
            border: `1px solid ${interval === x ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`,
            background: interval === x ? "var(--idea-gold-soft)" : "transparent", color: interval === x ? "var(--idea-gold-bright)" : "var(--idea-text-muted)",
          }}>{x}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "var(--idea-space-4)" }}>
        {plans.map((p) => <PlanCard key={p.id} plan={p} interval={interval} current={sub?.planId === p.id} onChoose={() => choose(p)} />)}
      </div>
    </>
  );
}

export function SubscriptionsHome() {
  const { t } = useI18n();
  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container>
        <SectionHeader eyebrow="Plans" title={t("nav.subscriptions")} sub="Choose a plan for customers or businesses. All prices in EGP are configured by the administrator." />
        <div style={{ display: "flex", gap: 12, marginBottom: "var(--idea-space-6)" }}>
          <Link to="/subscriptions/customers"><Button variant="outline">For Customers</Button></Link>
          <Link to="/subscriptions/businesses"><Button variant="outline">For Businesses</Button></Link>
        </div>
        <div className="idea-eyebrow" style={{ marginBottom: 12 }}>Customer plans</div>
        <PlanGrid audience="customer" />
      </Container>
    </Section>
  );
}
export function SubscriptionsCustomers() {
  return <Section style={{ paddingTop: "var(--idea-space-7)" }}><Container><SectionHeader eyebrow="Plans" title="Customer Plans" /><PlanGrid audience="customer" /></Container></Section>;
}
export function SubscriptionsBusinesses() {
  return <Section style={{ paddingTop: "var(--idea-space-7)" }}><Container><SectionHeader eyebrow="Plans" title="Business Plans" /><PlanGrid audience="business" /></Container></Section>;
}

export function SubscriptionPanel({ audience }: { audience: "customer" | "business" }) {
  const { db, session, api } = useBackend();
  const sub = db.subscriptions.find((s) => s.userId === session?.id);
  const plan = db.plans.find((p) => p.id === sub?.planId);
  return (
    <>
      <Panel style={{ marginBottom: "var(--idea-space-4)" }}>
        <div className="idea-eyebrow">Current subscription</div>
        {sub && plan ? (
          <>
            <div className="idea-display" style={{ fontSize: "var(--idea-text-xl)", color: "var(--idea-text)", marginTop: 6 }}>{plan.name} <StatusBadge text={sub.status} tone={sub.status === "active" ? "green" : sub.status === "payment-failed" ? "red" : "muted"} /></div>
            <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginTop: 4 }}>{sub.interval} · renews {new Date(sub.renewsAt).toLocaleDateString()}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {sub.status === "active" && <Button size="sm" variant="ghost" onClick={() => api.cancelSubscription(session!.id)}>Cancel renewal</Button>}
            </div>
          </>
        ) : (
          <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginTop: 6 }}>No active subscription.</div>
        )}
      </Panel>
      <PlanGrid audience={audience} />
    </>
  );
}
export function AccountSubscription() { return <SubscriptionPanel audience="customer" />; }
export function BusinessSubscription() { return <SubscriptionPanel audience="business" />; }
