import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router";
import {
  Activity, ArrowRight, ArrowUpRight, BadgeCheck, BarChart3, Boxes, Building2, Check,
  ChevronRight, CircleAlert, ClipboardCheck, CreditCard, Database, Download, ExternalLink,
  FileCheck2, FileText, Filter, Globe2, Image as ImageIcon, Layers3, LayoutDashboard,
  LockKeyhole, Menu, Megaphone, Package, RefreshCw, Search, Settings2, ShieldCheck,
  Sparkles, Store, TrendingUp, Truck, Users, X,
} from "lucide-react";
import { useBackend } from "../backend/db";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import type { Product } from "../data/types";
import { isValidProductImage } from "../data/catalogueOverrides";
import {
  canApproveCompanyVerification,
  decideAdminVerification,
  describeDashboardError,
  fetchAdminOverview,
  fetchAdminVerifications,
  fetchLiveAiQuota,
  fetchMarketplaceBootstrap,
  formatEgp,
  type AdminOverviewData,
  type CompanyVerificationRecord,
  type LiveAiQuota,
  type MarketplaceBootstrap,
} from "../backend/dashboardApi";
import "./AdminStudio.css";

type Material = "ceramics" | "porcelain" | "tiles" | "marble";
const MATERIALS: Material[] = ["ceramics", "porcelain", "tiles", "marble"];
const TARGET_PER_MATERIAL=2000;
const MIN_PER_MATERIAL = TARGET_PER_MATERIAL;
const format = (n: number) => new Intl.NumberFormat("en-US").format(n);
const materialName = (s: string) => (s === "marble" ? "Natural marble" : s.charAt(0).toUpperCase() + s.slice(1));

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows
    .map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(","))
    .join("\r\n");
  const u = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = u;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(u);
}

function sourceLink(p: Product) {
  return p.source?.productPageUrl || p.source?.originalUrl || "";
}

function qualityFlags(p: Product) {
  const a: string[] = [];
  if (!p.name.en.trim()) a.push("Missing title");
  if (!p.approved) a.push("Not approved for storefront");
  if (!p.brand.trim()) a.push("Missing brand");
  if (!p.manufacturer?.trim()) a.push("Manufacturer not verified");
  if (!p.sizes.some((s) => s.widthMm && s.heightMm)) a.push("Dimensions unverified");
  if (!isValidProductImage(p.image)) a.push("Missing / invalid image");
  if (!p.source?.productPageUrl) a.push("Supplier product link missing");
  if (!MATERIALS.includes(p.collection as Material)) a.push("Material outside core categories");
  return a;
}

function Stat({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: typeof Package;
  accent?: boolean;
}) {
  return (
    <div className={"ids-stat" + (accent ? " ids-stat-accent" : "")}>
      <span className="ids-stat-icon">
        <Icon size={20} />
      </span>
      <span className="ids-stat-label">{title}</span>
      <strong>{typeof value === "number" ? format(value) : value}</strong>
      <small>{sub}</small>
    </div>
  );
}

function Heading({
  kicker,
  title,
  sub,
  action,
}: {
  kicker: string;
  title: string;
  sub: string;
  action?: ReactNode;
}) {
  return (
    <div className="ids-heading">
      <div>
        <span className="ids-kicker">{kicker}</span>
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
      {action && <div className="ids-heading-action">{action}</div>}
    </div>
  );
}

function Pill({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span className={"ids-pill " + (ok ? "ids-pill-ok" : "ids-pill-warn")}>
      {ok ? <Check size={12} /> : <CircleAlert size={12} />} {children}
    </span>
  );
}

export function AdminStudioLayout() {
  const { session } = useBackend();
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [menu, setMenu] = useState(false);

  if (!session || session.role !== "admin") {
    return (
      <div className="ids-denied" dir={ar ? "rtl" : "ltr"}>
        <LockKeyhole size={30} />
        <h2>{ar ? "مساحة مقيدة للمسؤولين" : "Restricted workspace"}</h2>
        <p>
          {ar
            ? "هذه اللوحة تتطلب جلسة مسؤول معتمدة من خادم PHP/MySQL."
            : "This area requires an administrator role verified by the PHP/MySQL authentication server."}
        </p>
        <Link to="/admin/login">
          {ar ? "تسجيل دخول الإدارة" : "Sign in"} <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const links = [
    { to: "/admin", label: ar ? "نظرة عامة" : "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/users", label: ar ? "الحسابات والمستخدمون" : "Users & Roles", icon: Users, end: false },
    { to: "/admin/verifications", label: ar ? "توثيق الشركات" : "Company Verifications", icon: FileCheck2, end: false },
    { to: "/admin/companies", label: ar ? "الشركات والمنتجات" : "Companies & Products", icon: Building2, end: false },
    { to: "/admin/rfqs", label: ar ? "طلبات التسعير (RFQs)" : "RFQs & Tenders", icon: FileText, end: false },
    { to: "/admin/operations", label: ar ? "العمليات والطلبات" : "Operations & Orders", icon: Truck, end: false },
    { to: "/admin/sales", label: ar ? "المبيعات المؤكدة" : "Confirmed Sales", icon: BarChart3, end: false },
    { to: "/admin/catalogue", label: ar ? "كتالوج المتجر" : "Catalogue Audit", icon: Package, end: false },
    { to: "/admin/search", label: ar ? "البحث بالكود" : "Code Lookup", icon: Search, end: false },
    { to: "/admin/promotions", label: ar ? "الأسعار الخاصة" : "Private Pricing", icon: LockKeyhole, end: false },
    { to: "/admin/quality", label: ar ? "مراقبة الجودة" : "Quality Control", icon: ShieldCheck, end: false },
    { to: "/admin/announcements", label: ar ? "الشريط الإعلاني" : "Announcements", icon: Megaphone, end: false },
    { to: "/admin/advertising", label: ar ? "طلبات الإعلانات" : "Ad Requests", icon: TrendingUp, end: false },
    { to: "/admin/visualizer", label: ar ? "الذكاء الاصطناعي (AI)" : "AI Visualizer", icon: Sparkles, end: false },
    { to: "/admin/subscriptions", label: ar ? "خطط الاشتراك" : "Subscriptions", icon: CreditCard, end: false },
    { to: "/admin/settings/payments", label: ar ? "إعدادات الدفع" : "Payments", icon: CreditCard, end: false },
    { to: "/admin/settings", label: ar ? "إعدادات الأمان والتدقيق" : "Audit & Settings", icon: Settings2, end: false },
  ];

  return (
    <div className="ids-root" dir={ar ? "rtl" : "ltr"}>
      <div className="ids-ambient one" aria-hidden="true" />
      <div className="ids-ambient two" aria-hidden="true" />
      <div className="ids-layout">
        <aside className={"ids-sidebar" + (menu ? " is-open" : "")}>
          <div className="ids-brand">
            <Link to="/admin" onClick={() => setMenu(false)}>
              <span className="ids-brand-mark">
                <Layers3 size={22} />
              </span>
              <span>
                <b>
                  IDEA<span>.</span>
                </b>
                <small>COMMAND CENTER</small>
              </span>
            </Link>
            <button className="ids-sidebar-close" aria-label="Close menu" onClick={() => setMenu(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="ids-workspace">
            <span className="ids-workspace-icon">
              <Store size={17} />
            </span>
            <span>
              <b>IDEA Egypt</b>
              <small>PHP / MySQL Console</small>
            </span>
            <ChevronRight size={16} />
          </div>
          <div className="ids-nav-label">{ar ? "الإدارة المركزية" : "MANAGEMENT"}</div>
          <nav className="ids-nav" aria-label="Admin sections">
            {links.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                onClick={() => setMenu(false)}
                className={({ isActive }) => "ids-navlink" + (isActive ? " active" : "")}
              >
                <n.icon size={18} />
                <span>{n.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="ids-sidebar-foot">
            <div className="ids-quality-promo">
              <span>
                <Sparkles size={16} /> {ar ? "معيار الجودة" : "QUALITY STANDARD"}
              </span>
              <strong>{ar ? "تحقق صارم قبل النشر" : "Verified before live."}</strong>
              <p>
                {ar
                  ? "لا يُعتمد مورد بدون مستندات رسمية مرفوعة ومراجعة إدارية صريحة."
                  : "No supplier or product is published without server-verified records."}
              </p>
              <Link to="/admin/verifications" onClick={() => setMenu(false)}>
                {ar ? "مراجعة طلبات التوثيق" : "Review verifications"} <ArrowRight size={14} />
              </Link>
            </div>
            <Link to="/" className="ids-back-store">
              <ExternalLink size={16} /> {ar ? "عرض المتجر" : "View storefront"}
            </Link>
            <div className="ids-user">
              <span className="ids-avatar">{(session.name || "A")[0].toUpperCase()}</span>
              <span>
                <b>{session.name}</b>
                <small>{ar ? "مسؤول النظام" : "Administrator"}</small>
              </span>
              <BadgeCheck size={18} />
            </div>
          </div>
        </aside>
        {menu && <button className="ids-backdrop" aria-label="Close navigation" onClick={() => setMenu(false)} />}
        <div className="ids-main">
          <header className="ids-topbar">
            <div>
              <button className="ids-hamburger" aria-label="Open admin navigation" onClick={() => setMenu(true)}>
                <Menu size={21} />
              </button>
              <span className="ids-breadcrumb">
                WORKSPACE <ChevronRight size={14} /> <strong>{ar ? "لوحة الإدارة الموحدة" : "Administrator"}</strong>
              </span>
            </div>
            <div className="ids-topright">
              <span className="ids-secure">
                <i /> {ar ? "جلسة PHP/MySQL موثقة" : "Authorized PHP/MySQL session"}
              </span>
              <Link to="/" title="Open store" aria-label="Open store">
                <Globe2 size={19} />
              </Link>
            </div>
          </header>
          <div className="ids-page">
            <Outlet />
          </div>
          <div className="ids-footer">
            <span>© IDEA EGYPT — ADMIN WORKSPACE</span>
            <span>{ar ? "جميع الإجراءات محمية بصلاحيات خادم PHP/MySQL" : "All mutations enforced server-side via PHP/MySQL + CSRF"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminStudioHome() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const { products } = useStore();
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminOverview();
      setOverview(data);
    } catch (e) {
      setError(describeDashboardError(e, locale));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const flags = useMemo(() => products.reduce((n, p) => n + (qualityFlags(p).length ? 1 : 0), 0), [products]);
  const counts = useMemo(
    () =>
      Object.fromEntries(MATERIALS.map((m) => [m, products.filter((p) => p.collection === m).length])) as Record<
        Material,
        number
      >,
    [products]
  );

  return (
    <>
      <div className="ids-hero">
        <div>
          <div className="ids-hero-kicker">
            <span className="ids-pulse" /> IDEA EGYPT / UNIFIED ADMIN CONSOLE
          </div>
          <h1>
            {ar ? (
              <>
                كل تفاصيل السوق.
                <br />
                <em>تحت سيطرتك المباشرة.</em>
              </>
            ) : (
              <>
                Every detail.
                <br />
                <em>Under server control.</em>
              </>
            )}
          </h1>
          <p>
            {ar
              ? "إدارة الحسابات، توثيق الشركات، مراقبة طلبات التسعير، المبيعات المؤكدة، وجودة الكتالوج عبر خادم PHP/MySQL الإنتاجي."
              : "Unified command center for accounts, company verifications, RFQs, orders, catalogue QA, and AI quotas backed by PHP/MySQL."}
          </p>
          <div className="ids-hero-actions">
            <Link to="/admin/verifications" className="ids-primary">
              {ar ? "طابور توثيق الشركات" : "Verification queue"} <ArrowUpRight size={17} />
            </Link>
            <Link to="/admin/rfqs" className="ids-secondary">
              {ar ? "مراقبة طلبات التسعير" : "Monitor RFQs"} <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div className="ids-orbit" aria-hidden="true">
          <div className="ids-orbit-ring ring-one" />
          <div className="ids-orbit-ring ring-two" />
          <div className="ids-orbit-core">
            <Layers3 size={44} />
          </div>
          <div className="ids-orbit-node n1" />
          <div className="ids-orbit-node n2" />
        </div>
      </div>

      <Heading
        kicker="LIVE MYSQL OVERVIEW"
        title={ar ? "مؤشرات المنصة الحية" : "Live marketplace intelligence"}
        sub={
          ar
            ? "الأرقام التالية قادمة مباشرة من قاعدة بيانات MySQL (/api/accounts.php?action=admin-overview) ولا يتم اختلاق أي أرقام عند تعذر الاتصال."
            : "Live totals loaded from MySQL (/api/accounts.php?action=admin-overview). No placeholder metrics are fabricated on failure."
        }
        action={
          <button className="ids-action-outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={15} /> {ar ? "تحديث" : "Refresh"}
          </button>
        }
      />

      {error && (
        <div className="ids-notice" role="alert">
          <CircleAlert size={17} /> <span>{error}</span>
        </div>
      )}

      <div className="ids-stats">
        <Stat
          title={ar ? "الحسابات المسجلة" : "Registered users"}
          value={loading ? "…" : overview ? overview.counts.users : "—"}
          sub={overview ? "MySQL accounts" : "Awaiting server"}
          icon={Users}
          accent
        />
        <Stat
          title={ar ? "الشركات (موثق / معلق)" : "Companies (verified / pending)"}
          value={loading ? "…" : overview ? `${overview.counts.verifiedCompanies} / ${overview.counts.pendingCompanies}` : "—"}
          sub={overview ? `${overview.counts.companies} total companies` : "Awaiting server"}
          icon={Building2}
        />
        <Stat
          title={ar ? "طلبات التسعير والعروض" : "RFQs / Quotations"}
          value={loading ? "…" : overview ? `${overview.counts.requests} / ${overview.counts.quotes}` : "—"}
          sub={overview ? `${overview.counts.orders} confirmed orders` : "Awaiting server"}
          icon={Activity}
        />
        <Stat
          title={ar ? "كتالوج المتجر" : "Storefront catalogue"}
          value={products.length}
          sub={`${flags} static QA flags`}
          icon={Package}
        />
      </div>

      <div className="ids-dashboard-grid">
        <div className="ids-panel">
          <div className="ids-panel-head">
            <div>
              <span className="ids-kicker">CATALOGUE STATUS</span>
              <h3>{ar ? "توزيع الخامات في الكتالوج" : "Material distribution"}</h3>
            </div>
            <Link to="/admin/catalogue" className="ids-text-link">
              {ar ? "استكشاف" : "Explore"} <ArrowRight size={15} />
            </Link>
          </div>
          <div className="ids-material-list">
            {MATERIALS.map((m, i) => (
              <div className="ids-material" key={m}>
                <span className={"ids-material-icon m" + i}>
                  <Layers3 size={17} />
                </span>
                <div className="ids-material-info">
                  <div>
                    <b>{materialName(m)}</b>
                    <span>
                      {format(counts[m])} / {format(MIN_PER_MATERIAL)}
                    </span>
                  </div>
                  <div className="ids-progress">
                    <span style={{ width: Math.min(100, (counts[m] / MIN_PER_MATERIAL) * 100) + "%" }} />
                  </div>
                </div>
                <span className="ids-material-percent">{Math.floor((counts[m] / MIN_PER_MATERIAL) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ids-panel ids-standards">
          <div className="ids-panel-head">
            <div>
              <span className="ids-kicker">WORKFLOW QUICK LINKS</span>
              <h3>{ar ? "العمليات الحرجة" : "Critical workflows"}</h3>
            </div>
            <ShieldCheck size={20} />
          </div>
          <div className="ids-standard-lines">
            <div>
              <span>
                <FileCheck2 size={16} /> {ar ? "شركات بانتظار التوثيق" : "Companies pending review"}
              </span>
              <b>{overview ? overview.counts.pendingCompanies : "—"}</b>
            </div>
            <div>
              <span>
                <FileText size={16} /> {ar ? "طلبات تسعير مفتوحة" : "Active RFQs"}
              </span>
              <b>{overview ? overview.counts.requests : "—"}</b>
            </div>
            <div>
              <span>
                <Truck size={16} /> {ar ? "الطلبات المسجلة" : "Orders tracked"}
              </span>
              <b>{overview ? overview.counts.orders : "—"}</b>
            </div>
            <div>
              <span>
                <ShieldCheck size={16} /> {ar ? "الاعتماد اليدوي الإلزامي" : "Manual document gating"}
              </span>
              <b>{ar ? "مفعّل" : "Enforced"}</b>
            </div>
          </div>
          <Link to="/admin/verifications" className="ids-action-outline">
            {ar ? "فتح طابور التوثيق" : "Open verification queue"} <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="ids-panel ids-quick">
        <div>
          <span className="ids-kicker">WORKFLOW</span>
          <h3>{ar ? "تنقل سريع" : "Quick navigation"}</h3>
        </div>
        <div className="ids-quick-grid">
          <Link to="/admin/users">
            <Users size={20} />
            <b>{ar ? "دليل المستخدمين" : "User directory"}</b>
            <small>{ar ? "العملاء، الموردون، والإدارة" : "Buyers, suppliers & admins"}</small>
            <ArrowUpRight size={17} />
          </Link>
          <Link to="/admin/verifications">
            <FileCheck2 size={20} />
            <b>{ar ? "توثيق الشركات" : "Company verifications"}</b>
            <small>{ar ? "فحص المستندات والاعتماد" : "Inspect docs & approve"}</small>
            <ArrowUpRight size={17} />
          </Link>
          <Link to="/admin/rfqs">
            <FileText size={20} />
            <b>{ar ? "مراقبة الـRFQs" : "RFQ & tender monitor"}</b>
            <small>{ar ? "تتبع العروض الخاصة" : "Track private quotations"}</small>
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </>
  );
}

export function AdminUsers() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOverview(await fetchAdminOverview());
    } catch (e) {
      setError(describeDashboardError(e, locale));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const users = useMemo(() => {
    const list = overview?.users || [];
    const q = query.trim().toLowerCase();
    return list.filter((u) => {
      if (roleFilter !== "all" && u.role.toLowerCase() !== roleFilter) return false;
      if (!q) return true;
      return [u.name, u.email, u.phone || "", u.id].some((s) => s.toLowerCase().includes(q));
    });
  }, [overview, query, roleFilter]);

  return (
    <>
      <Heading
        kicker="MYSQL IDENTITY DIRECTORY"
        title={ar ? "المستخدمون والأدوار" : "Users & Role Directory"}
        sub={
          ar
            ? "قراءة مباشرة من جدول حسابات PHP/MySQL. لا يمكن ترقية الصلاحيات من المتصفح."
            : "Read directly from PHP/MySQL account records. Role escalation is blocked client-side."
        }
        action={
          <button className="ids-action-outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={15} /> {ar ? "تحديث" : "Refresh"}
          </button>
        }
      />
      {error && (
        <div className="ids-notice" role="alert">
          <CircleAlert size={17} /> <span>{error}</span>
        </div>
      )}
      <div className="ids-panel ids-table-panel">
        <div className="ids-filterbar">
          <label className="ids-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ar ? "ابحث بالاسم، البريد، الهاتف..." : "Search name, email, phone..."}
            />
          </label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter role">
            <option value="all">{ar ? "كل الأدوار" : "All roles"}</option>
            <option value="buyer">{ar ? "عملاء (buyer)" : "Buyers"}</option>
            <option value="supplier">{ar ? "شركات وموردون (supplier)" : "Suppliers"}</option>
            <option value="admin">{ar ? "إدارة (admin)" : "Administrators"}</option>
          </select>
        </div>
        <div className="ids-table-scroll">
          <table className="ids-table">
            <thead>
              <tr>
                <th>{ar ? "المستخدم" : "USER"}</th>
                <th>{ar ? "الدور" : "ROLE"}</th>
                <th>{ar ? "الحالة" : "STATUS"}</th>
                <th>{ar ? "تاريخ التسجيل" : "CREATED"}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    <div style={{ fontSize: 12, opacity: 0.72 }} dir="ltr">
                      {u.email} {u.phone ? `· ${u.phone}` : ""}
                    </div>
                  </td>
                  <td>
                    <span className="ids-table-tag">{u.role}</span>
                  </td>
                  <td>
                    <Pill ok={u.status.toLowerCase() === "active"}>{u.status}</Pill>
                  </td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && !loading && (
            <div className="ids-empty">
              {ar ? "لا توجد حسابات مطابقة في الاستجابة الحالية." : "No user accounts returned for the current filter."}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function AdminVerifications() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [items, setItems] = useState<CompanyVerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [notesByCompany, setNotesByCompany] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await fetchAdminVerifications());
    } catch (e) {
      setError(describeDashboardError(e, locale));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (
    record: CompanyVerificationRecord,
    decision: "verified" | "more_info_required" | "rejected" | "suspended"
  ) => {
    if (decision === "verified" && !canApproveCompanyVerification(record)) {
      setError(
        ar
          ? "لا يمكن اعتماد الشركة قبل التحقق من الاسم القانوني ووجود مستند رسمي مرفوع على الأقل."
          : "Cannot approve company until legal/public names and at least one uploaded document are confirmed."
      );
      return;
    }
    setBusyId(record.companyId);
    setError("");
    setNotice("");
    try {
      await decideAdminVerification({
        companyId: record.companyId,
        decision,
        notes: (notesByCompany[record.companyId] || "").trim(),
      });
      await load();
      setNotice(
        ar
          ? `تم تسجيل قرار المراجعة (${decision}) للشركة ${record.publicName} في MySQL.`
          : `Verification decision (${decision}) saved for ${record.publicName} in MySQL.`
      );
    } catch (e) {
      setError(describeDashboardError(e, locale));
    } finally {
      setBusyId("");
    }
  };

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        statusFilter === "all" ? true : item.status.toLowerCase() === statusFilter
      ),
    [items, statusFilter]
  );

  return (
    <>
      <Heading
        kicker="COMPLIANCE & KYB QUEUE"
        title={ar ? "مراجعة وتوثيق الشركات" : "Company Verification Queue"}
        sub={
          ar
            ? "اعتماد الشركات يتطلب وجود بيانات قانونية ومستندات رسمية مرفوعة ومؤكدة من خادم PHP/MySQL."
            : "Approve, request more info, reject, or suspend supplier applications. Approval is blocked without uploaded supporting documents."
        }
        action={
          <button className="ids-action-outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={15} /> {ar ? "تحديث الطابور" : "Refresh queue"}
          </button>
        }
      />

      {error && (
        <div className="ids-notice" role="alert">
          <CircleAlert size={17} /> <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="ids-oknotice" role="status">
          <ShieldCheck size={17} /> <span>{notice}</span>
        </div>
      )}

      <div className="ids-panel">
        <div className="ids-filterbar" style={{ marginBottom: 14 }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter verification status">
            <option value="all">{ar ? "كل الحالات" : "All statuses"}</option>
            <option value="submitted">{ar ? "مقدّم للمراجعة" : "Submitted"}</option>
            <option value="under_review">{ar ? "قيد المراجعة" : "Under review"}</option>
            <option value="more_info_required">{ar ? "مطلوب استكمال" : "More info required"}</option>
            <option value="verified">{ar ? "موثّق" : "Verified"}</option>
            <option value="rejected">{ar ? "مرفوض" : "Rejected"}</option>
            <option value="suspended">{ar ? "موقوف" : "Suspended"}</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          {filtered.map((rec) => {
            const approvable = canApproveCompanyVerification(rec);
            const busy = busyId === rec.companyId;
            return (
              <article
                key={rec.companyId}
                style={{
                  border: "1px solid var(--ids-line)",
                  borderRadius: 14,
                  padding: 16,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{rec.publicName || rec.legalName}</h3>
                    <div style={{ fontSize: 13, opacity: 0.78, marginTop: 4 }}>
                      {rec.legalName} · {rec.companyType || "Supplier"} · {rec.governorate || "—"}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }} dir="ltr">
                      CR: {rec.crNumber || "—"} · Tax: {rec.taxNumber || "—"} · {rec.email || "—"} · {rec.phone || "—"}
                    </div>
                  </div>
                  <Pill ok={rec.status === "verified"}>{rec.status}</Pill>
                </div>

                <div>
                  <strong style={{ fontSize: 12, opacity: 0.8 }}>
                    {ar ? `المستندات المؤكدة على الخادم (${rec.documents.length}):` : `Server-confirmed documents (${rec.documents.length}):`}
                  </strong>
                  {rec.documents.length > 0 ? (
                    <ul style={{ margin: "6px 0 0", paddingInlineStart: 18, fontSize: 13 }}>
                      {rec.documents.map((doc) => (
                        <li key={doc.id}>
                          <strong>{doc.kind}</strong> — {doc.filename} ({doc.status})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: "6px 0 0", fontSize: 13, color: "#b45309", fontWeight: 500 }}>
                      {ar
                        ? "لم يتم رفع أي مستندات رسمية بعد — زر الاعتماد معطل تلقائيًا."
                        : "No supporting documents uploaded yet — approval is disabled until documents are confirmed."}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    style={{
                      flex: "1 1 240px",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--ids-line)",
                      background: "transparent",
                      color: "inherit",
                    }}
                    value={notesByCompany[rec.companyId] ?? rec.reviewNotes ?? ""}
                    onChange={(e) => setNotesByCompany((old) => ({ ...old, [rec.companyId]: e.target.value }))}
                    placeholder={ar ? "ملاحظات المراجعة للمورد..." : "Reviewer notes for supplier..."}
                  />
                  <button
                    type="button"
                    className="ids-primary"
                    disabled={busy || !approvable}
                    title={!approvable ? (ar ? "يتطلب مستندات مرفوعة أولاً" : "Requires uploaded supporting documents") : ""}
                    onClick={() => void decide(rec, "verified")}
                  >
                    <Check size={15} /> {ar ? "اعتماد الشركة" : "Approve"}
                  </button>
                  <button
                    type="button"
                    className="ids-action-outline"
                    disabled={busy}
                    onClick={() => void decide(rec, "more_info_required")}
                  >
                    {ar ? "طلب استكمال" : "Request info"}
                  </button>
                  <button
                    type="button"
                    className="ids-action-outline"
                    disabled={busy}
                    onClick={() => void decide(rec, "rejected")}
                  >
                    {ar ? "رفض" : "Reject"}
                  </button>
                  {rec.status === "verified" && (
                    <button
                      type="button"
                      className="ids-action-outline"
                      disabled={busy}
                      onClick={() => void decide(rec, "suspended")}
                    >
                      {ar ? "إيقاف" : "Suspend"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}

          {!filtered.length && !loading && (
            <div className="ids-empty">
              {ar ? "لا توجد طلبات توثيق شركات مطابقة حاليًا." : "No company verification records in this queue."}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function AdminRfqs() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOverview(await fetchAdminOverview());
    } catch (e) {
      setError(describeDashboardError(e, locale));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const rfqs = useMemo(() => {
    const list = overview?.requests || [];
    const q = query.trim().toLowerCase();
    return list.filter((r) => {
      if (statusFilter !== "all" && r.status.toLowerCase() !== statusFilter) return false;
      if (!q) return true;
      return [r.reference, r.productTitle, r.governorate, r.customerName || ""].some((s) =>
        s.toLowerCase().includes(q)
      );
    });
  }, [overview, query, statusFilter]);

  const quotesByRequest = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of overview?.quotes || []) {
      map.set(q.requestId, (map.get(q.requestId) || 0) + 1);
    }
    return map;
  }, [overview]);

  return (
    <>
      <Heading
        kicker="PRIVATE TENDER MONITOR"
        title={ar ? "مراقبة طلبات التسعير والعروض" : "RFQ & Quotation Monitor"}
        sub={
          ar
            ? "متابعة حية لجميع طلبات التسعير في MySQL. تظل الأسعار خاصة بين العميل والمورد والإدارة فقط."
            : "Live monitoring of marketplace RFQs and supplier quotations from MySQL. Pricing remains confidential to authorized parties."
        }
        action={
          <button className="ids-action-outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={15} /> {ar ? "تحديث" : "Refresh"}
          </button>
        }
      />

      {error && (
        <div className="ids-notice" role="alert">
          <CircleAlert size={17} /> <span>{error}</span>
        </div>
      )}

      <div className="ids-stats ids-stats-three">
        <Stat title={ar ? "إجمالي الطلبات" : "Total RFQs"} value={overview?.counts.requests ?? "—"} sub="MySQL live" icon={FileText} accent />
        <Stat title={ar ? "عروض الموردين" : "Supplier Quotes"} value={overview?.counts.quotes ?? "—"} sub="Confidential bids" icon={TrendingUp} />
        <Stat title={ar ? "الطلبات المؤكدة" : "Accepted Orders"} value={overview?.counts.orders ?? "—"} sub="Converted RFQs" icon={Truck} />
      </div>

      <div className="ids-panel ids-table-panel">
        <div className="ids-filterbar">
          <label className="ids-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ar ? "ابحث بالمرجع، المنتج، المحافظة..." : "Search reference, product, governorate..."}
            />
          </label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter RFQ status">
            <option value="all">{ar ? "كل الحالات" : "All statuses"}</option>
            <option value="submitted">{ar ? "مفتوح" : "Submitted"}</option>
            <option value="quoted">{ar ? "تم التسعير" : "Quoted"}</option>
            <option value="accepted">{ar ? "مقبول" : "Accepted"}</option>
            <option value="closed">{ar ? "مغلق" : "Closed"}</option>
          </select>
        </div>
        <div className="ids-table-scroll">
          <table className="ids-table">
            <thead>
              <tr>
                <th>{ar ? "المرجع" : "REF"}</th>
                <th>{ar ? "المنتج والمقاس" : "PRODUCT & VARIANT"}</th>
                <th>{ar ? "الكمية" : "QTY"}</th>
                <th>{ar ? "المحافظة" : "GOVERNORATE"}</th>
                <th>{ar ? "العروض" : "QUOTES"}</th>
                <th>{ar ? "الحالة" : "STATUS"}</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map((r) => (
                <tr key={r.id}>
                  <td dir="ltr">
                    <strong>{r.reference}</strong>
                  </td>
                  <td>
                    <strong>{r.productTitle}</strong>
                    <div style={{ fontSize: 12, opacity: 0.72 }}>{r.variantLabel || "—"}</div>
                  </td>
                  <td>
                    {r.quantity} {r.unit}
                  </td>
                  <td>{r.governorate || "—"}</td>
                  <td>{quotesByRequest.get(r.id) ?? r.offersCount}</td>
                  <td>
                    <Pill ok={r.status === "accepted" || r.status === "quoted"}>{r.status}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rfqs.length && !loading && (
            <div className="ids-empty">
              {ar ? "لا توجد طلبات تسعير مطابقة حاليًا." : "No RFQs matching the current filter."}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function AdminDataHeader({ product }: { product: Product }) {
  return (
    <div className="ids-product-name">
      <span className="ids-product-thumb">
        {isValidProductImage(product.image) ? <img src={product.image} alt="" loading="lazy" /> : <ImageIcon size={19} />}
      </span>
      <span>
        <b>{product.name.en}</b>
        <small>{product.slug}</small>
      </span>
    </div>
  );
}

export function AdminProducts() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const { adminProducts: products } = useStore();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [quality, setQuality] = useState("all");
  const [page, setPage] = useState(1);

  const list = useMemo(
    () =>
      products.filter((p) => {
        if (category !== "all" && p.collection !== category) return false;
        if (quality === "issues" && !qualityFlags(p).length) return false;
        if (quality === "clear" && qualityFlags(p).length) return false;
        const needle = q.trim().toLowerCase();
        return (
          !needle ||
          [p.name.en, p.name.ar, p.brand, p.manufacturer, p.model, p.code, p.slug].some((x) =>
            String(x || "")
              .toLowerCase()
              .includes(needle)
          )
        );
      }),
    [products, q, category, quality]
  );

  const items = list.slice((page - 1) * 12, page * 12);
  const exportData = () =>
    downloadCSV(
      [
        ["ID", "Title", "Category", "Brand", "Manufacturer", "Model", "Code", "Size", "URL", "Source URL", "Issues"],
        ...list.map((p) => [
          p.id,
          p.name.en,
          p.collection,
          p.brand,
          p.manufacturer || "",
          p.model || "",
          p.code || "",
          p.sizes.map((s) => s.label).join(" | "),
          location.origin + "/product/" + p.slug,
          sourceLink(p),
          qualityFlags(p).join("; "),
        ]),
      ],
      "idea-products-audit.csv"
    );

  return (
    <>
      <Heading
        kicker="CATALOGUE AUDIT"
        title={ar ? "فحص وتدقيق كتالوج المتجر" : "Storefront Catalogue Audit"}
        sub={
          ar
            ? "استعرض وصدّر بيانات الكتالوج العام. لإدارة منتجات الشركات والأسعار الخاصة في MySQL انتقل إلى «الشركات والمنتجات»."
            : "Inspect, filter, and export storefront catalogue records. To manage MySQL supplier products & storefront approvals, use Companies & Products."
        }
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link to="/admin/companies" className="ids-action-outline">
              <Building2 size={15} /> {ar ? "منتجات الشركات (MySQL)" : "Supplier products (MySQL)"}
            </Link>
            <button className="ids-action-outline" onClick={exportData}>
              <Download size={16} /> {ar ? "تصدير CSV" : "Export CSV"}
            </button>
          </div>
        }
      />
      <div className="ids-stats ids-stats-three">
        <Stat title={ar ? "منتجات الكتالوج" : "Products loaded"} value={products.length} sub="Storefront inventory" icon={Boxes} accent />
        <Stat title={ar ? "نتائج التصفية" : "Filtered results"} value={list.length} sub="Matching current filters" icon={Filter} />
        <Stat
          title={ar ? "ملاحظات الجودة" : "Quality flags"}
          value={products.filter((p) => qualityFlags(p).length).length}
          sub="Fields needing review"
          icon={ClipboardCheck}
        />
      </div>
      <div className="ids-panel ids-table-panel">
        <div className="ids-filterbar">
          <label className="ids-search">
            <Search size={18} />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={ar ? "ابحث بالاسم، البراند، الكود..." : "Search name, brand, SKU, slug..."}
              aria-label="Search products"
            />
          </label>
          <select
            aria-label="Filter material"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">{ar ? "كل الخامات" : "All materials"}</option>
            {MATERIALS.map((m) => (
              <option value={m} key={m}>
                {materialName(m)}
              </option>
            ))}
          </select>
          <select
            aria-label="Quality filter"
            value={quality}
            onChange={(e) => {
              setQuality(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">{ar ? "كل حالات الجودة" : "All quality states"}</option>
            <option value="issues">{ar ? "تحتاج مراجعة" : "Needs review"}</option>
            <option value="clear">{ar ? "مكتملة الحقول" : "No static flags"}</option>
          </select>
        </div>
        <div className="ids-table-scroll">
          <table className="ids-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>MATERIAL</th>
                <th>MANUFACTURER</th>
                <th>QUALITY</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>
                    <AdminDataHeader product={p} />
                  </td>
                  <td>
                    <span className="ids-table-tag">{materialName(p.collection)}</span>
                  </td>
                  <td>{p.manufacturer || "Not verified"}</td>
                  <td>
                    <Pill ok={!qualityFlags(p).length}>
                      {qualityFlags(p).length ? qualityFlags(p).length + " flag(s)" : "Fields present"}
                    </Pill>
                  </td>
                  <td>
                    <div className="ids-row-actions">
                      <a
                        href={"/product/" + p.slug}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open product page"
                        aria-label={"Open " + p.name.en}
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <div className="ids-empty">No products match your filters.</div>}
        </div>
        <div className="ids-pagination">
          <span>
            Showing {list.length ? (page - 1) * 12 + 1 : 0}–{Math.min(page * 12, list.length)} of {format(list.length)}
          </span>
          <div>
            <button disabled={page === 1} onClick={() => setPage((x) => x - 1)}>
              Previous
            </button>
            <span>
              Page {page} of {Math.max(1, Math.ceil(list.length / 12))}
            </span>
            <button disabled={page >= Math.ceil(list.length / 12)} onClick={() => setPage((x) => x + 1)}>
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function AdminQuality() {
  const { adminProducts: products } = useStore();
  const counts = useMemo(
    () =>
      Object.fromEntries(MATERIALS.map((m) => [m, products.filter((p) => p.collection === m).length])) as Record<
        Material,
        number
      >,
    [products]
  );
  const flagged = useMemo(() => products.flatMap((p) => qualityFlags(p).map((issue) => ({ p, issue }))), [products]);
  const [needle, setNeedle] = useState("");
  const filtered = flagged.filter(
    (x) =>
      !needle ||
      x.issue.toLowerCase().includes(needle.toLowerCase()) ||
      x.p.name.en.toLowerCase().includes(needle.toLowerCase())
  );

  return (
    <>
      <Heading
        kicker="DATA INTEGRITY"
        title="Quality command"
        sub="Measured from loaded product records. This screen does not claim a completed visual inspection or supplier-website validation."
        action={
          <button
            className="ids-action-outline"
            onClick={() =>
              downloadCSV(
                [["ID", "Product", "Category", "Issue", "Source"], ...filtered.map((x) => [x.p.id, x.p.name.en, x.p.collection, x.issue, sourceLink(x.p)])],
                "idea-qa-findings.csv"
              )
            }
          >
            <Download size={15} /> Export issues
          </button>
        }
      />
      <div className="ids-notice">
        <ShieldCheck size={18} />
        <span>
          Release policy: 2,000 <b>individually verified</b> unique products per category, 8,000 total target. The numbers below are storefront counts, <b>not</b> verified approvals.
        </span>
      </div>
      <div className="ids-stats ids-stats-three">
        <Stat icon={Package} title="Loaded products" value={products.length} sub="Storefront records" accent />
        <Stat icon={CircleAlert} title="Flagged fields" value={flagged.length} sub="Automatic schema checks" />
        <Stat icon={BadgeCheck} title="Approved target" value="8,000" sub="4 × 2,000 verified products" />
      </div>
      <div className="ids-dashboard-grid">
        <div className="ids-panel">
          <div className="ids-panel-head">
            <div>
              <span className="ids-kicker">THRESHOLD TRACKER</span>
              <h3>Four material gates</h3>
            </div>
          </div>
          {MATERIALS.map((m, i) => (
            <div className="ids-quality-row" key={m}>
              <span className={"ids-material-icon m" + i}>
                <Layers3 size={18} />
              </span>
              <div>
                <div>
                  <strong>{materialName(m)}</strong>
                  <small>
                    {counts[m]} loaded / {MIN_PER_MATERIAL} required
                  </small>
                </div>
                <div className="ids-progress">
                  <span style={{ width: Math.min(100, (counts[m] * 100) / MIN_PER_MATERIAL) + "%" }} />
                </div>
              </div>
              <Pill ok={false}>
                {counts[m] >= MIN_PER_MATERIAL ? "Verify records" : "Short " + format(MIN_PER_MATERIAL - counts[m])}
              </Pill>
            </div>
          ))}
        </div>
        <div className="ids-panel">
          <div className="ids-panel-head">
            <div>
              <span className="ids-kicker">INSPECTION SCOPE</span>
              <h3>Validation layers</h3>
            </div>
          </div>
          <div className="ids-checklist">
            {[
              ["Category and material", "Cross-check source type"],
              ["Image relevance", "Visual review pending"],
              ["Measurements", "Require original documentation"],
              ["Internal site link", "Validate route and SKU"],
              ["Supplier URL", "Inspect provenance"],
              ["Duplicates", "Confirm variants and IDs"],
              ["Usage rights", "Confirm reproduction permission"],
            ].map(([a, b]) => (
              <div key={a}>
                <span>
                  <CircleAlert size={16} />
                </span>
                <span>
                  <b>{a}</b>
                  <small>{b}</small>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="ids-panel ids-table-panel">
        <div className="ids-panel-head ids-flags-head">
          <div>
            <span className="ids-kicker">AUTOMATED FINDINGS</span>
            <h3>Products needing attention</h3>
          </div>
          <label className="ids-search">
            <Search size={17} />
            <input
              value={needle}
              onChange={(e) => setNeedle(e.target.value)}
              placeholder="Search products / issues..."
              aria-label="Search quality findings"
            />
          </label>
        </div>
        <div className="ids-table-scroll">
          <table className="ids-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>FLAG</th>
                <th>LINK</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 80).map(({ p, issue }, i) => (
                <tr key={p.id + "-" + i}>
                  <td>
                    <AdminDataHeader product={p} />
                  </td>
                  <td>{materialName(p.collection)}</td>
                  <td>
                    <Pill ok={false}>{issue}</Pill>
                  </td>
                  <td>
                    <Link to={"/product/" + p.slug} target="_blank" aria-label={"View " + p.name.en}>
                      <ExternalLink size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <p className="ids-empty">No matching static-field issues. Manual visual and sourcing QA remain required.</p>}
        </div>
        <div className="ids-pagination">
          {Math.min(80, filtered.length)} shown of {format(filtered.length)} issues. Export CSV for the complete result.
        </div>
      </div>
    </>
  );
}

export function AdminOperations() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOverview(await fetchAdminOverview());
    } catch (e) {
      setOverview(null);
      setError(describeDashboardError(e, locale));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <>
      <Heading
        kicker="PHP/MYSQL OPERATIONS DESK"
        title={ar ? "مكتب العمليات والطلبات" : "Operations & Orders Desk"}
        sub={
          ar
            ? "أرقام حقيقية من قاعدة بيانات MySQL. عند تعذر الاتصال بالخادم لا يتم اختلاق أي إحصائيات."
            : "Live totals and orders from authenticated PHP/MySQL queries. No figures are invented when the server is unreachable."
        }
        action={
          <button className="ids-action-outline" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw size={16} /> {ar ? "تحديث" : "Refresh"}
          </button>
        }
      />
      {error && (
        <div className="ids-notice" role="alert">
          <CircleAlert size={17} /> <span>{error}</span>
        </div>
      )}
      <div className="ids-stats">
        <Stat title={ar ? "الشركات" : "Suppliers"} value={loading ? "…" : overview ? overview.counts.companies : "—"} sub="MySQL companies" icon={Store} />
        <Stat title={ar ? "طلبات التسعير" : "Quote requests"} value={loading ? "…" : overview ? overview.counts.requests : "—"} sub="MySQL RFQs" icon={Activity} />
        <Stat title={ar ? "عروض الأسعار" : "Offers"} value={loading ? "…" : overview ? overview.counts.quotes : "—"} sub="Confidential bids" icon={TrendingUp} />
        <Stat title={ar ? "الطلبات" : "Orders"} value={loading ? "…" : overview ? overview.counts.orders : "—"} sub="Accepted quotes" icon={Truck} />
      </div>

      <div className="ids-panel ids-table-panel">
        <div className="ids-panel-head">
          <div>
            <span className="ids-kicker">ORDER LIFECYCLE</span>
            <h3>{ar ? "أحدث الطلبات المسجلة في MySQL" : "Recent MySQL Orders"}</h3>
          </div>
        </div>
        <div className="ids-table-scroll">
          <table className="ids-table">
            <thead>
              <tr>
                <th>{ar ? "رقم الطلب" : "ORDER ID"}</th>
                <th>{ar ? "المورد" : "SUPPLIER"}</th>
                <th>{ar ? "الإجمالي" : "TOTAL"}</th>
                <th>{ar ? "الحالة" : "STATUS"}</th>
                <th>{ar ? "حالة الدفع" : "PAYMENT"}</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.orders || []).map((o) => (
                <tr key={o.id}>
                  <td dir="ltr">
                    <strong>{o.id.slice(0, 12)}</strong>
                  </td>
                  <td>{o.supplierName || o.companyId.slice(0, 8)}</td>
                  <td>
                    <strong>{formatEgp(o.total, locale)}</strong>
                  </td>
                  <td>
                    <span className="ids-table-tag">{o.status}</span>
                  </td>
                  <td>
                    <Pill ok={o.paymentStatus === "paid" || o.paymentStatus === "captured"}>{o.paymentStatus}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!(overview?.orders || []).length && !loading && (
            <div className="ids-empty">
              {ar ? "لا توجد طلبات مؤكدة مسجلة في MySQL بعد." : "No orders recorded in MySQL yet."}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function AdminSettings() {
  const { session } = useBackend();
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [boot, setBoot] = useState<MarketplaceBootstrap | null>(null);
  const [audit, setAudit] = useState<AdminOverviewData["audit"]>([]);
  const [statusMsg, setStatusMsg] = useState(ar ? "جاري فحص اتصال PHP/MySQL..." : "Checking PHP/MySQL endpoints...");

  useEffect(() => {
    void (async () => {
      try {
        const [b, ov] = await Promise.all([
          fetchMarketplaceBootstrap(),
          fetchAdminOverview().catch(() => null),
        ]);
        setBoot(b);
        setAudit(ov?.audit || []);
        setStatusMsg(
          ar
            ? `متصل بخادم PHP/MySQL (/api/marketplace.php) — ${b.companies.length} شركة مسجلة.`
            : `Connected to PHP/MySQL (/api/marketplace.php) — ${b.companies.length} companies visible.`
        );
      } catch (e) {
        setStatusMsg(describeDashboardError(e, locale));
      }
    })();
  }, [ar, locale]);

  return (
    <>
      <Heading
        kicker="SECURITY & AUDIT"
        title={ar ? "إعدادات النظام وسجل التدقيق" : "Workspace Security & Audit"}
        sub={
          ar
            ? "التحقق من اتصال PHP/MySQL، جلسة الأدمن، وسجل الأحداث الإدارية."
            : "Live PHP/MySQL integration diagnostics, administrator session status, and server audit log."
        }
      />
      <div className="ids-dashboard-grid">
        <div className="ids-panel ids-operations-card">
          <ShieldCheck size={25} />
          <h3>{ar ? "هوية المسؤول" : "Administrator identity"}</h3>
          <p>{session?.email || session?.name || "Authenticated user"}</p>
          <Pill ok={session?.role === "admin"}>Server role: {session?.role || "unknown"}</Pill>
          <small style={{ opacity: 0.72, marginTop: 6 }}>
            {ar
              ? "حماية CSRF وملفات تعريف الارتباط Same-Origin مفعّلة لجميع عمليات الكتابة."
              : "Same-origin session cookies and X-CSRF-Token headers are enforced on all write endpoints."}
          </small>
        </div>
        <div className="ids-panel ids-operations-card">
          <Database size={25} />
          <h3>{ar ? "حالة خادم PHP/MySQL" : "PHP/MySQL Backend"}</h3>
          <p>{statusMsg}</p>
          <Pill ok={Boolean(boot)}>{boot ? "MySQL API Reachable" : "Preview / Unreachable"}</Pill>
        </div>
      </div>

      <div className="ids-panel ids-table-panel" style={{ marginTop: 18 }}>
        <div className="ids-panel-head">
          <div>
            <span className="ids-kicker">AUDIT TRAIL</span>
            <h3>{ar ? "أحدث الأحداث الإدارية" : "Recent Audit Events"}</h3>
          </div>
        </div>
        <div className="ids-table-scroll">
          <table className="ids-table">
            <thead>
              <tr>
                <th>{ar ? "الوقت" : "TIME"}</th>
                <th>{ar ? "المنفذ" : "ACTOR"}</th>
                <th>{ar ? "الإجراء" : "ACTION"}</th>
                <th>{ar ? "الهدف" : "TARGET"}</th>
              </tr>
            </thead>
            <tbody>
              {audit.slice(0, 30).map((a) => (
                <tr key={a.id}>
                  <td>{a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}</td>
                  <td>{a.actor}</td>
                  <td>
                    <span className="ids-table-tag">{a.action}</span>
                  </td>
                  <td>{a.target || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!audit.length && (
            <div className="ids-empty">
              {ar ? "لا توجد سجلات تدقيق معادة من الخادم حاليًا." : "No audit events returned from server yet."}
            </div>
          )}
        </div>
      </div>

      <div className="ids-panel ids-settings-links" style={{ marginTop: 18 }}>
        <div className="ids-panel-head">
          <div>
            <span className="ids-kicker">BILLING & CONFIGURATION</span>
            <h3>{ar ? "إعدادات الفوترة والاشتراكات" : "Billing & Subscriptions"}</h3>
          </div>
        </div>
        <Link to="/admin/subscriptions">
          {ar ? "خطط الاشتراك" : "Subscription plans"} <ArrowRight size={17} />
        </Link>
        <Link to="/admin/settings/payments">
          {ar ? "بوابات الدفع" : "Payment gateways"} <ArrowRight size={17} />
        </Link>
      </div>
    </>
  );
}

export function AdminVisualizer() {
  const { session } = useBackend();
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [state, setState] = useState<"loading" | "configured" | "unavailable">("loading");
  const [quotaInfo, setQuotaInfo] = useState<LiveAiQuota | null>(null);
  const [detail, setDetail] = useState(
    ar ? "جاري فحص حصة الذكاء الاصطناعي عبر خادم PHP/MySQL..." : "Checking AI quota via PHP/MySQL platform endpoint…"
  );

  const check = useCallback(async () => {
    setState("loading");
    setDetail(ar ? "جاري فحص حصة الذكاء الاصطناعي عبر /api/platform.php..." : "Checking /api/platform.php?action=ai-quota…");
    try {
      const q = await fetchLiveAiQuota();
      setQuotaInfo(q);
      setState("configured");
      setDetail(
        q.configured === false
          ? ar
            ? "نقطة النهاية متصلة، لكن إعدادات مزود Runpod على الخادم غير مفعّلة بعد."
            : "Platform endpoint responded, but Runpod worker credentials are not yet configured server-side."
          : ar
          ? "نقطة نهاية الحصة (/api/platform.php?action=ai-quota) تستجيب بنجاح عبر جلسة PHP. يتطلب التحقق الكامل اختبار توليد حقيقي على الخادم الإنتاجي."
          : "PHP/MySQL quota endpoint responded. Full Runpod worker health still requires a live production generation check."
      );
    } catch (error) {
      setState("unavailable");
      setQuotaInfo(null);
      setDetail(describeDashboardError(error, locale));
    }
  }, [ar, locale]);

  useEffect(() => {
    void check();
  }, [check]);

  const quotaLabel = quotaInfo
    ? quotaInfo.unlimited
      ? ar
        ? "غير محدود (مسؤول)"
        : "Unlimited administrator quota"
      : `${quotaInfo.remaining ?? "—"} / ${quotaInfo.limit ?? "—"}`
    : "—";

  return (
    <>
      <Heading
        kicker="IMMUTABLE SCENE ENGINE · PHP/MYSQL"
        title={ar ? "غرفة تحكم الذكاء الاصطناعي (AI Visualizer)" : "AI Visualizer Control Room"}
        sub={
          ar
            ? "فحص حالة التكامل والحصص عبر جلسة PHP/MySQL دون كشف مفاتيح API أو معرفات Runpod."
            : "Inspect AI quota & adapter status via same-origin PHP/MySQL without exposing API keys or Runpod endpoint IDs."
        }
        action={
          <button className="ids-action-outline" onClick={() => void check()} disabled={state === "loading"}>
            <RefreshCw size={16} /> {ar ? "إعادة الفحص" : "Recheck"}
          </button>
        }
      />
      <div className="ids-stats ids-stats-three">
        <Stat title="Provider" value={quotaInfo?.provider || "Runpod"} sub="Server-side adapter" icon={Sparkles} accent />
        <Stat title="Admin quota" value={quotaLabel} sub="Verified via /api/platform.php" icon={ShieldCheck} />
        <Stat title="Auth boundary" value="PHP Session" sub="Zero client secrets" icon={Database} />
      </div>
      <div className="ids-dashboard-grid">
        <div className="ids-panel ids-operations-card">
          <Activity size={29} />
          <span className="ids-kicker">INTEGRATION STATUS</span>
          <h3>
            {state === "configured"
              ? ar
                ? "الخادم يستجيب — يتطلب تحقق Runpod حي"
                : "Adapter reachable — live Runpod check required"
              : state === "loading"
              ? ar
                ? "جاري الفحص..."
                : "Checking adapter..."
              : ar
              ? "خدمة PHP غير متصلة هنا"
              : "PHP/MySQL adapter unreachable"}
          </h3>
          <p>{detail}</p>
          <Pill ok={state === "configured"}>
            {state === "configured" ? "Quota endpoint verified" : "Unavailable on this host"}
          </Pill>
        </div>
        <div className="ids-panel ids-operations-card">
          <ShieldCheck size={29} />
          <span className="ids-kicker">ADMIN ACCESS</span>
          <h3>{quotaLabel}</h3>
          <p>
            {session?.email || session?.name || "Authenticated administrator"} —{" "}
            {ar
              ? "تُدار الحصص من خادم PHP/MySQL وتخضع لسياسات إساءة الاستخدام."
              : "Quotas are enforced strictly server-side by PHP/MySQL."}
          </p>
          <Link to="/ai-room-visualizer" className="ids-action-outline">
            {ar ? "فتح استوديو التخيّل" : "Open test studio"} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      <div className="ids-notice">
        <CircleAlert size={17} />
        <span>
          {ar
            ? "لا تعرض هذه الشاشة حالة «متصل بالكامل» إلا بعد التحقق الفعلي من طلب توليد حقيقي عبر Runpod على الخادم الإنتاجي."
            : "Do not treat the visualizer as production-verified until a live Runpod generation succeeds on idea-dh.com."}
        </span>
      </div>
    </>
  );
}
