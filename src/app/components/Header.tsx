import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { Search, Heart, FileText, Globe, Menu, X, Sun, Moon, User } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useTheme } from "../theme/theme";
import { useStore } from "../store/store";
import { useBackend } from "../backend/db";
import { IdeaLogo } from "./IdeaLogo";
import { DiscoveryNavigation } from "./DiscoveryNavigation";
import "./Header.css";

export function Header() {
  const { t, locale, setLocale } = useI18n();
  const { mode, toggle } = useTheme();
  const { products, favorites, quote } = useStore();
  const { session } = useBackend();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  useEffect(() => {
    const onScroll = () => setScrolled(current => {
      const next = window.scrollY > 28;
      return next === current ? current : next;
    });
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const text = (en: string, ar: string, fr: string) => ({ en, ar, fr })[locale];
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    else if (!open && node.open) node.close();
  }, [open]);
  // Navigation via browser history also closes the menu, including on iOS Safari.
  useEffect(() => { setOpen(false); }, [pathname]);
  const account = session ? session.role === "business" ? "/business" : session.role === "admin" ? "/admin" : "/account" : "/login";
  const controls = <>
    <span className="idea-header-languages"><Globe size={15} aria-hidden="true" />
      {(["en", "ar", "fr"] as const).map(code => <button key={code} aria-label={{en:"English",ar:"العربية",fr:"Français"}[code]} aria-pressed={locale === code} onClick={() => setLocale(code)}>{code.toUpperCase()}</button>)}
    </span>
    <button onClick={toggle} aria-label={text("Toggle theme", "تغيير المظهر", "Changer le thème")} title={text("Toggle theme", "تغيير المظهر", "Changer le thème")}>{mode === "dark" ? <Sun size={21} /> : <Moon size={21} />}</button>
    <Link className="idea-header-favorites" to="/favorites" aria-label={t("fav.title")} onClick={() => setOpen(false)}><Heart size={20} />{favorites.length > 0 && <small>{favorites.length}</small>}</Link>
    <Link to="/request-quote/new" aria-label={t("quote.title")} onClick={() => setOpen(false)}><FileText size={19} />{quote.length > 0 && <small>{quote.length}</small>}</Link>
    <Link to={account} aria-label={session ? t("nav.account") : t("nav.signIn")} onClick={() => setOpen(false)}><User size={20} /></Link>
  </>;
  return <>
    <header className={`idea-reference-header${isHome ? " idea-reference-header--home" : ""}${scrolled ? " is-scrolled" : ""}${open ? " is-menu-open" : ""}`}>
      <div className="idea-reference-header-row" dir="ltr">
        <Link className="idea-reference-logo" to="/" aria-label={text("IDEA — Home", "الرئيسية — IDEA", "IDEA — Accueil")}><IdeaLogo compact /></Link>
        <div className="idea-reference-ticker">
          {/* Static, truthful catalogue fallback until the existing PHP/MySQL
              platform exposes a verified admin-published announcement contract.
              No external account-service request or fabricated live sales in the header. */}
          <div className="idea-catalogue-announcement" dir={locale === "ar" ? "rtl" : "ltr"}>
            <span aria-hidden="true">✦</span><span>{text(`${products.length} products in the catalogue · Explore surfaces & plan your space`, `${products.length} منتج في الكتالوج · اكتشف الخامات وصمّم مساحتك`, `${products.length} produits au catalogue · Découvrez les surfaces`)}</span>
            <span aria-hidden="true">✦</span><Link to="/products">{text("Learn more", "اعرف المزيد", "En savoir plus")}</Link>
          </div>
        </div>
        <div className="idea-reference-actions">{controls}</div>
        <button className="idea-menu-btn" aria-label={text("Menu", "القائمة", "Menu")} aria-haspopup="dialog" aria-expanded={open} aria-controls="idea-navigation-drawer" onClick={() => setOpen(true)}><Menu size={21} /></button>
      </div>
    </header>
    <dialog ref={dialog} id="idea-navigation-drawer" className="idea-navigation-drawer" dir={locale === "ar" ? "rtl" : "ltr"} aria-label={text("Site menu", "قائمة الموقع", "Menu du site")} onClose={() => setOpen(false)} onCancel={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="idea-navigation-content">
        <div className="idea-navigation-top"><strong>{text("Menu", "القائمة", "Menu")}</strong><button onClick={() => setOpen(false)} aria-label={text("Close menu", "إغلاق القائمة", "Fermer le menu")}><X size={22} /></button></div>
        <div className="idea-navigation-controls">{controls}</div>
        <form onSubmit={event => { event.preventDefault(); navigate(`/products?q=${encodeURIComponent(q)}`); setOpen(false); }}>
          <input aria-label={t("search.placeholder")} placeholder={t("search.placeholder")} value={q} onChange={event => setQ(event.target.value)} />
          <button type="submit" aria-label={text("Search", "بحث", "Rechercher")}><Search size={20} /></button>
        </form>
        <DiscoveryNavigation onNavigate={() => setOpen(false)} />
        <nav className="idea-navigation-tools">
          <Link to="/room-designer/3d" onClick={() => setOpen(false)}>{text("3D Studio", "استوديو ثلاثي الأبعاد", "Studio 3D")}</Link>
          <Link to="/ai-room-visualizer" onClick={() => setOpen(false)}>{t("nav.visualizer")}</Link>
          <Link to={account} onClick={() => setOpen(false)}>{session ? t("nav.account") : t("nav.signIn")}</Link>
        </nav>
      </div>
    </dialog>
  </>;
}
