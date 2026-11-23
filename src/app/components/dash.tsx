import { useState, type CSSProperties, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router";
import { AlertCircle, CheckCircle2, Info, Menu, X } from "lucide-react";
import { Container } from "./ui";
import { useBackend } from "../backend/db";
import { useI18n } from "../i18n/i18n";
import "./DashShell.css";

export function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="glass-card" style={{ borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-5)", ...style }}>
      {children}
    </div>
  );
}

export function StatusBadge({ text, tone = "gold" }: { text: string; tone?: "gold" | "green" | "red" | "muted" }) {
  const map: Record<string, { bg: string; fg: string; bd: string }> = {
    gold: { bg: "var(--idea-gold-soft)", fg: "var(--idea-gold-bright)", bd: "var(--idea-gold)" },
    green: { bg: "var(--idea-surface-2)", fg: "var(--idea-success)", bd: "var(--idea-success)" },
    red: { bg: "var(--idea-surface-2)", fg: "var(--idea-danger)", bd: "var(--idea-danger)" },
    muted: { bg: "var(--idea-surface-2)", fg: "var(--idea-text-muted)", bd: "var(--idea-border-neutral)" },
  };
  const c = map[tone];
  return (
    <span
      style={{
        fontSize: "var(--idea-text-xs)",
        padding: "3px 10px",
        borderRadius: "var(--idea-radius-full)",
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.bd}`,
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {text}
    </span>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: "var(--idea-space-4)" }}>
      <span
        style={{
          display: "block",
          fontSize: "var(--idea-text-xs)",
          color: "var(--idea-text-muted)",
          letterSpacing: "0.04em",
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputStyle: CSSProperties = {
  width: "100%",
  background: "var(--idea-gt-input-bg, transparent)",
  border: "1px solid var(--idea-border)",
  borderRadius: "var(--idea-radius-sm)",
  padding: "10px 14px",
  color: "var(--idea-text)",
  fontFamily: "var(--idea-font-body)",
  fontSize: "var(--idea-text-sm)",
  outline: "none",
  backdropFilter: "blur(18px) saturate(1.4)",
  WebkitBackdropFilter: "blur(18px) saturate(1.4)",
};

export function EmptyState({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div
      style={{
        padding: "var(--idea-space-8)",
        textAlign: "center",
        border: "1px dashed var(--idea-border)",
        borderRadius: "var(--idea-radius-lg)",
        color: "var(--idea-text-muted)",
      }}
    >
      <div className="idea-display" style={{ color: "var(--idea-text)", marginBottom: 6 }}>
        {title}
      </div>
      {sub && <div style={{ fontSize: "var(--idea-text-sm)", maxWidth: 460, margin: "0 auto" }}>{sub}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function DashBanner({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "error" | "ok";
  children: ReactNode;
}) {
  const Icon = tone === "error" || tone === "warn" ? AlertCircle : tone === "ok" ? CheckCircle2 : Info;
  const cls =
    tone === "error"
      ? "idea-dash-banner idea-dash-banner--error"
      : tone === "warn"
      ? "idea-dash-banner idea-dash-banner--warn"
      : tone === "ok"
      ? "idea-dash-banner idea-dash-banner--ok"
      : "idea-dash-banner";
  return (
    <div className={cls} role={tone === "error" ? "alert" : "status"}>
      <Icon size={17} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

export function DashLoading({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gap: 12 }} aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="idea-dash-skeleton" />
      ))}
    </div>
  );
}

/* Dashboard layout with responsive collapsible navigation rail (RTL/LTR safe). */
export function DashLayout({
  title,
  links,
  children,
}: {
  title: string;
  links: { to: string; label: string; badge?: number }[];
  children: ReactNode;
}) {
  const { session, api } = useBackend();
  const { locale } = useI18n();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleLabel =
    session?.role === "admin"
      ? locale === "ar"
        ? "مسؤول المنصة"
        : "Administrator"
      : session?.role === "business"
      ? locale === "ar"
        ? "حساب شركة / مورد"
        : "Business / Supplier"
      : locale === "ar"
      ? "حساب عميل"
      : "Customer";

  return (
    <Container className="idea-dash-shell">
      <div className="idea-dash-wrap">
        <aside className="idea-dash-rail">
          <div className="idea-dash-rail-head">
            <div>
              <div className="idea-display idea-dash-rail-title">{title}</div>
              <div className="idea-dash-rail-user">
                {session?.name} · {roleLabel}
              </div>
            </div>
            <button
              type="button"
              className="idea-dash-mobile-toggle"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X size={15} /> : <Menu size={15} />}
              {locale === "ar" ? "الأقسام" : "Sections"}
            </button>
          </div>
          <nav
            className={`idea-dash-nav idea-dash-rail-nav idea-glass-tablist idea-glass-tablist--vertical${
              mobileOpen ? " is-open" : ""
            }`}
            aria-label={title}
          >
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/account" || l.to === "/business"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `idea-glass-tab idea-dash-tab${isActive ? " is-active" : ""}`}
              >
                <span>{l.label}</span>
                {l.badge ? (
                  <span
                    style={{
                      background: "var(--idea-gold)",
                      color: "var(--idea-on-gold)",
                      borderRadius: 999,
                      fontSize: 10,
                      minWidth: 16,
                      height: 16,
                      display: "grid",
                      placeItems: "center",
                      padding: "0 4px",
                    }}
                  >
                    {l.badge}
                  </span>
                ) : null}
              </NavLink>
            ))}
            <button
              type="button"
              className="idea-dash-signout"
              onClick={() => {
                api.signOut();
                nav("/");
              }}
            >
              {locale === "ar" ? "تسجيل الخروج" : locale === "fr" ? "Se déconnecter" : "Sign out"}
            </button>
          </nav>
        </aside>
        <div className="idea-dash-main">{children}</div>
      </div>
    </Container>
  );
}
