import type { CSSProperties, ReactNode } from "react";
import { NavLink, useNavigate } from "react-router";
import { Container } from "./ui";
import { useBackend } from "../backend/db";
import { useI18n } from "../i18n/i18n";

export function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-5)", ...style }}>
      {children}
    </div>
  );
}

export function StatusBadge({ text, tone = "gold" }: { text: string; tone?: "gold" | "green" | "red" | "muted" }) {
  const map: Record<string, { bg: string; fg: string; bd: string }> = {
    gold: { bg: "var(--idea-gold-soft)", fg: "var(--idea-gold-bright)", bd: "var(--idea-gold)" },
    green: { bg: "rgba(46,160,90,.14)", fg: "#5fd08a", bd: "rgba(46,160,90,.5)" },
    red: { bg: "rgba(200,60,60,.14)", fg: "#e08a8a", bd: "rgba(200,60,60,.5)" },
    muted: { bg: "var(--idea-surface-2)", fg: "var(--idea-text-muted)", bd: "var(--idea-border-neutral)" },
  };
  const c = map[tone];
  return <span style={{ fontSize: "var(--idea-text-xs)", padding: "3px 10px", borderRadius: "var(--idea-radius-full)", background: c.bg, color: c.fg, border: `1px solid ${c.bd}`, whiteSpace: "nowrap" }}>{text}</span>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: "var(--idea-space-4)" }}>
      <span style={{ display: "block", fontSize: "var(--idea-text-xs)", color: "var(--idea-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}

export const inputStyle: CSSProperties = {
  width: "100%", background: "var(--idea-surface-2)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-sm)",
  padding: "10px 14px", color: "var(--idea-text)", fontFamily: "var(--idea-font-body)", fontSize: "var(--idea-text-sm)", outline: "none",
};

export function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ padding: "var(--idea-space-8)", textAlign: "center", border: "1px dashed var(--idea-border)", borderRadius: "var(--idea-radius-lg)", color: "var(--idea-text-muted)" }}>
      <div className="idea-display" style={{ color: "var(--idea-text)", marginBottom: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: "var(--idea-text-sm)" }}>{sub}</div>}
    </div>
  );
}

/* Dashboard layout with a token-driven side rail (collapses on mobile). */
export function DashLayout({ title, links, children }: { title: string; links: { to: string; label: string; badge?: number }[]; children: ReactNode }) {
  const { session, api } = useBackend();
  const { locale } = useI18n();
  const nav = useNavigate();
  return (
    <Container style={{ padding: "var(--idea-space-7) var(--idea-space-5)" }}>
      <div style={{ display: "flex", gap: "var(--idea-space-6)", alignItems: "flex-start" }} className="idea-dash-wrap">
        <aside style={{ width: 240, flexShrink: 0, position: "sticky", top: 88 }} className="idea-dash-rail">
          <div className="idea-display" style={{ fontSize: "var(--idea-text-lg)", color: "var(--idea-text)", marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: "var(--idea-text-xs)", color: "var(--idea-text-muted)", marginBottom: "var(--idea-space-4)" }}>{session?.name} · {session?.role}</div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end style={({ isActive }) => ({
                display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none",
                padding: "9px 12px", borderRadius: "var(--idea-radius-sm)", fontSize: "var(--idea-text-sm)",
                color: isActive ? "var(--idea-gold-bright)" : "var(--idea-text-muted)",
                background: isActive ? "var(--idea-gold-soft)" : "transparent",
                borderInlineStart: `2px solid ${isActive ? "var(--idea-gold)" : "transparent"}`,
              })}>
                <span>{l.label}</span>
                {l.badge ? <span style={{ background: "var(--idea-gold)", color: "var(--idea-on-gold)", borderRadius: 999, fontSize: 10, minWidth: 16, height: 16, display: "grid", placeItems: "center", padding: "0 4px" }}>{l.badge}</span> : null}
              </NavLink>
            ))}
            <button onClick={() => { api.signOut(); nav("/"); }} style={{ marginTop: "var(--idea-space-3)", textAlign: locale === "ar" ? "right" : "left", background: "none", border: "none", color: "var(--idea-text-faint)", cursor: "pointer", padding: "9px 12px", fontSize: "var(--idea-text-sm)", fontFamily: "var(--idea-font-body)" }}>
              {locale === "ar" ? "تسجيل الخروج" : locale === "fr" ? "Se déconnecter" : "Sign out"}
            </button>
          </nav>
        </aside>
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </div>
      <style>{`@media (max-width: 860px){ .idea-dash-wrap{ flex-direction: column !important; } .idea-dash-rail{ width: 100% !important; position: static !important; } }`}</style>
    </Container>
  );
}
