import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Search, Heart, FileText, Globe, Menu, X, Sun, Moon, User, House } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useTheme } from "../theme/theme";
import { useStore } from "../store/store";
import { useBackend } from "../backend/db";
import type { Locale } from "../data/types";
import { Container } from "./ui";
import { IdeaLogo } from "./IdeaLogo";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "ar", label: "AR" },
  { code: "fr", label: "FR" },
];

function IconLink({ to, label, count, children }: { to: string; label: string; count?: number; children: React.ReactNode }) {
  return (
    <Link className="idea-header-icon-link" to={to} aria-label={label} style={{ position: "relative", color: "var(--idea-text)", display: "inline-flex" }}>
      {children}
      {count ? (
        <span style={{
          position: "absolute", top: -8, insetInlineEnd: -8, background: "var(--idea-gold)", color: "var(--idea-on-gold)",
          fontSize: 10, minWidth: 16, height: 16, borderRadius: 999, display: "grid", placeItems: "center", padding: "0 3px", fontWeight: 600,
        }}>{count}</span>
      ) : null}
    </Link>
  );
}

export function Header() {
  const { t, locale, setLocale } = useI18n();
  const { mode, toggle } = useTheme();
  const { favorites, quote } = useStore();
  const { session } = useBackend();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    nav(`/products?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  const links = [
    { to: "/collections", label: t("nav.collections") },
    { to: "/products", label: t("nav.products") },
    { to: "/room-designer", label: t("nav.roomDesigner") },
    { to: "/subscriptions", label: t("nav.subscriptions") },
    { to: "/how-it-works", label: t("nav.how") },
  ];

  return (
    <header className="idea-site-header" style={{
      position: "sticky", top: 0, zIndex: 50, background: "var(--idea-overlay)",
      backdropFilter: "blur(14px)", borderBottom: "var(--idea-hairline)",
    }}>
      <Container className="idea-header-shell" style={{ display: "flex", alignItems: "center", gap: "var(--idea-space-4)", height: 78 }}>
        {/* Logo */}
        <Link to="/" aria-label="IDEA Business Administration — Home" style={{ display: "inline-flex", lineHeight: 1, textDecoration: "none", flexShrink: 0 }}>
          <IdeaLogo compact />
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: "flex", gap: "var(--idea-space-4)", marginInlineStart: "var(--idea-space-3)" }} className="idea-desktop-nav">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="idea-nav-link" style={{
              color: "var(--idea-text-muted)", textDecoration: "none", fontSize: "var(--idea-text-xs)",
              letterSpacing: "0.04em", textTransform: "uppercase", transition: "color .2s", position: "relative", whiteSpace: "nowrap",
            }}>{l.label}</Link>
          ))}
        </nav>

        <div className="idea-header-actions" style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: "var(--idea-space-4)" }}>
          {/* Search (desktop) */}
          <form onSubmit={submit} className="idea-desktop-search" style={{
            display: "flex", alignItems: "center", gap: 8, background: "var(--idea-surface-2)",
            border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-full)", padding: "8px 16px", minWidth: 220,
          }}>
            <Search size={16} color="var(--idea-gold)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search.placeholder")}
              style={{ background: "transparent", border: "none", outline: "none", color: "var(--idea-text)", width: "100%", fontFamily: "var(--idea-font-body)", fontSize: "var(--idea-text-sm)" }} />
          </form>

          {/* Language */}
          <div className="idea-language-switcher" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Globe size={16} color="var(--idea-text-muted)" />
            {LOCALES.map((l) => (
              <button className="idea-language-btn" key={l.code} onClick={() => setLocale(l.code)} style={{
                background: "none", border: "none", cursor: "pointer", fontSize: "var(--idea-text-xs)", fontWeight: 600, padding: 2,
                color: locale === l.code ? "var(--idea-gold-bright)" : "var(--idea-text-faint)",
              }}>{l.label}</button>
            ))}
          </div>

          <span className="idea-mobile-home"><IconLink to="/" label={t("nav.home")}><House size={20} /></IconLink></span>

          <button className="idea-theme-btn" onClick={toggle} aria-label="Toggle theme" style={{
            background: "none", border: "none", cursor: "pointer", color: "var(--idea-gold-bright)", display: "inline-flex",
          }}>
            {mode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <span className="idea-mobile-optional"><IconLink to="/favorites" label={t("fav.title")} count={favorites.length}><Heart size={20} /></IconLink></span>
          <span className="idea-mobile-optional"><IconLink to="/request-quote/new" label={t("quote.title")} count={quote.length}><FileText size={20} /></IconLink></span>
          <IconLink to={session ? (session.role === "business" ? "/business" : session.role === "admin" ? "/admin" : "/account") : "/login"} label={session ? t("nav.account") : t("nav.signIn")}><User size={20} /></IconLink>

          <button className="idea-menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Menu"
            style={{ background: "none", border: "none", color: "var(--idea-text)", cursor: "pointer", display: "none" }}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </Container>

      {/* Mobile drawer */}
      {open && (
        <div style={{ borderTop: "var(--idea-hairline)", background: "var(--idea-bg-2)", padding: "var(--idea-space-4) 0" }}>
          <Container style={{ display: "flex", flexDirection: "column", gap: "var(--idea-space-3)" }}>
            <form onSubmit={submit} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--idea-surface-2)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-full)", padding: "10px 16px" }}>
              <Search size={16} color="var(--idea-gold)" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search.placeholder")}
                style={{ background: "transparent", border: "none", outline: "none", color: "var(--idea-text)", width: "100%", fontFamily: "var(--idea-font-body)" }} />
            </form>
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} style={{ color: "var(--idea-text)", textDecoration: "none", padding: "8px 0", textTransform: "uppercase", fontSize: "var(--idea-text-sm)", letterSpacing: "0.06em" }}>{l.label}</Link>
            ))}
          </Container>
        </div>
      )}

      <style>{`
        .idea-nav-link::after {
          content: ""; position: absolute; left: 0; bottom: -6px; height: 1px; width: 0;
          background: var(--idea-gold-bright); transition: width .28s cubic-bezier(.22,1,.36,1);
        }
        .idea-nav-link:hover { color: var(--idea-gold-bright); }
        .idea-nav-link:hover::after { width: 100%; }
        [dir="rtl"] .idea-nav-link::after { left: auto; right: 0; }
        @media (prefers-reduced-motion: reduce) {
          .idea-nav-link::after { transition: none; }
        }
        @media (max-width: 960px) {
          .idea-desktop-nav, .idea-desktop-search { display: none !important; }
          .idea-menu-btn { display: inline-flex !important; }
        }
        @media (max-width: 640px) {
          .idea-site-header { background: var(--idea-bg) !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: 0 6px 20px rgba(0,0,0,.10); }
          .idea-header-shell { height: 68px !important; gap: 6px !important; padding-inline: 10px !important; }
          .idea-official-logo--compact { width: 116px !important; }
          .idea-header-actions { gap: 2px !important; flex: 1 1 auto; min-width: 0; justify-content: flex-end; }
          .idea-mobile-optional, .idea-mobile-home { display: none !important; }
          .idea-language-switcher { gap: 1px !important; white-space: nowrap; flex: 0 0 auto; }
          .idea-language-switcher > svg { width: 15px; height: 15px; margin-inline-end: 2px; }
          .idea-language-btn { min-width: 0 !important; min-height: 44px !important; padding: 4px 3px !important; font-size: 11px !important; }
          .idea-header-icon-link, .idea-theme-btn, .idea-menu-btn { width: 44px; height: 44px; min-width: 44px; min-height: 44px; align-items: center; justify-content: center; flex: 0 0 44px; padding: 0 !important; }
        }
        @media (max-width: 390px) {
          .idea-header-shell { gap: 3px !important; padding-inline: 8px !important; }
          .idea-official-logo--compact { width: 104px !important; }
          .idea-language-switcher > svg { display: none; }
          .idea-language-btn { padding-inline: 2px !important; font-size: 10.5px !important; }
        }
        @media (max-width: 350px) {
          .idea-official-logo--compact { width: 94px !important; }
          .idea-theme-btn { display: none !important; }
        }
      `}</style>
    </header>
  );
}