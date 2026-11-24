import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { BadgeCheck, CalendarDays, CircleAlert, Film, Megaphone, Plus, ShieldCheck, TrendingUp } from "lucide-react";
import { useBackend } from "../backend/db";
import { useI18n } from "../i18n/i18n";
import {
  describeDashboardError,
  fetchConfirmedSales,
  fetchMarketplaceAdRequests,
  fetchMarketplaceBootstrap,
  formatEgp,
  reviewMarketplaceAdRequest,
  saveMarketplaceAdPackage,
  saveMarketplaceTicker,
  submitMarketplaceAdRequest,
  type MarketplaceAdPackage,
  type MarketplaceAdRequest,
  type MarketplaceAnnouncement,
  type MarketplaceCompany,
  type MarketplaceSalesReport,
} from "../backend/dashboardApi";
import "./BusinessGrowth.css";

const PLACEMENT_META: Record<string, { title: string; descAr: string; descEn: string; image: string; spec: string }> = {
  home_topline: {
    title: "Top line",
    descAr: "إعلان خفيف في الشريط العلوي بجانب عنوان الموقع",
    descEn: "Subtle announcement in the top header strip",
    image: "/images/featured/tiles.webp",
    spec: "Banner image: 1600×240 px, WebP/JPEG, up to 3 MB",
  },
  new_collections: {
    title: "New Collections",
    descAr: "كارت مميز للبراند أو المجموعة الجديدة داخل صفحة المنتجات",
    descEn: "Featured brand/collection card inside the products catalog",
    image: "/images/featured/porcelain.webp",
    spec: "Product tile image: 1200×1200 px, WebP/JPEG, up to 5 MB",
  },
  home_hero_video: {
    title: "Home video hero",
    descAr: "فيديو أفقي كبير في الصفحة الرئيسية، ويُنشر فقط بعد موافقة IDEA",
    descEn: "Full-width homepage hero video published only after IDEA review",
    image: "/images/featured/marble.webp",
    spec: "Video: MP4 H.264, 1920×1080 (16:9), 6–20 sec, up to 40 MB",
  },
  google_ads: {
    title: "Google Ads",
    descAr: "حملة Google Search/Display بميزانية مزاد منفصلة يحددها صاحب الشركة",
    descEn: "Managed Google Search/Display campaign with supplier-defined media budget",
    image: "/images/featured/ceramics.webp",
    spec: "Campaign brief + landing page; reviewed before launch",
  },
  meta_ads: {
    title: "Facebook & Instagram",
    descAr: "حملة Meta Ads بميزانية مزاد منفصلة يحددها صاحب الشركة",
    descEn: "Managed Meta Ads campaign with supplier-defined media budget",
    image: "/images/featured/stone.webp",
    spec: "Creative 1080×1080 or 1080×1920; reviewed before publishing",
  },
};

export function CompanyRevenueReport({ mode }: { mode: "admin" | "supplier" }) {
  const { session } = useBackend();
  const { locale } = useI18n();
  const ar = locale === "ar";
  const isAdmin = mode === "admin" && session?.role === "admin";

  const [report, setReport] = useState<MarketplaceSalesReport | null>(null);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchConfirmedSales(period);
      setReport(data);
    } catch (e) {
      setError(describeDashboardError(e, locale));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [period, session?.id, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = report?.rows || [];
  const totalNet = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.net_confirmed_cents || 0) / 100, 0),
    [rows]
  );
  const totalOrders = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.orders_count || 0), 0),
    [rows]
  );

  if (!session) return null;

  return (
    <section className="ibg-root" dir={ar ? "rtl" : "ltr"}>
      <header className="ibg-head">
        <span className="ibg-kicker">
          <TrendingUp size={18} /> VERIFIED SALES ONLY · PHP/MYSQL
        </span>
        <h1>{isAdmin ? (ar ? "تحليل مبيعات الشركات المؤكدة" : "Verified Company Sales") : ar ? "مبيعات شركتك الشهرية" : "Monthly Confirmed Sales"}</h1>
        <p>
          {ar
            ? "التقرير مبني على المدفوعات المؤكدة والمحصّلة فعليًا فقط في قاعدة بيانات MySQL. عروض الأسعار وطلبات الـRFQ لا تُحتسب كمبيعات."
            : "Figures reflect captured, server-confirmed payments in MySQL only. RFQs and quotations are never counted as revenue."}
        </p>
      </header>

      <div className="ibg-period">
        <label>
          <CalendarDays size={17} /> {ar ? "الشهر" : "Month"}
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
        </label>
        <strong>
          {ar ? "صافي المبيعات المؤكدة:" : "Net confirmed sales:"} {formatEgp(totalNet, locale)}
        </strong>
        <span>
          {ar ? `عدد العمليات المدفوعة: ${totalOrders}` : `Paid orders: ${totalOrders}`}
        </span>
        <button type="button" onClick={() => void load()} disabled={loading}>
          {loading ? (ar ? "جاري التحديث…" : "Loading…") : ar ? "تحديث المبيعات" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="ibg-error" role="alert">
          <CircleAlert size={16} /> {error}
        </div>
      )}

      <div className="ibg-sale-list">
        <div className="ibg-sale-row ibg-sale-label">
          <span>{ar ? "الشركة" : "Company"}</span>
          <span>{ar ? "طلبات مدفوعة" : "Paid orders"}</span>
          <span>{ar ? "إجمالي" : "Gross"}</span>
          <span>{ar ? "المرتجعات" : "Refunds"}</span>
          <span>{ar ? "الصافي" : "Net"}</span>
        </div>
        {rows.map((item) => {
          const gross = Number(item.gross_cents || 0) / 100;
          const net = Number(item.net_confirmed_cents || 0) / 100;
          return (
            <div className="ibg-sale-row" key={item.company_id}>
              <strong>{item.public_name}</strong>
              <span>{item.orders_count}</span>
              <span>{formatEgp(gross, locale)}</span>
              <span>{item.refund_accounting || (ar ? "تُراجع محاسبيًا" : "Reviewed separately")}</span>
              <b>{formatEgp(net, locale)}</b>
            </div>
          );
        })}
        {!rows.length && !loading && (
          <p className="ibg-no-data">
            {ar
              ? "لا توجد سجلات مبيعات مدفوعة مؤكدة في الشهر المحدد. لا يتم اختلاق أرقام من عروض الأسعار."
              : "No confirmed paid sales recorded for this month. Quotations are never fabricated into revenue."}
          </p>
        )}
      </div>

      <p className="ibg-note">
        <ShieldCheck size={16} />{" "}
        {report?.caveat ||
          (ar
            ? "مصدر الأرقام: /api/marketplace.php?action=sales (مدفوعات محصّلة فقط بتوقيت القاهرة)."
            : "Source: /api/marketplace.php?action=sales (captured payments only, Africa/Cairo).")}
      </p>
    </section>
  );
}

export function AdminAnnouncementEditor() {
  const { session } = useBackend();
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [rows, setRows] = useState<MarketplaceAnnouncement[]>([]);
  const [textAr, setTextAr] = useState("");
  const [textEn, setTextEn] = useState("");
  const [linkPath, setLinkPath] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (session?.role !== "admin") return;
    setError("");
    try {
      const boot = await fetchMarketplaceBootstrap();
      setRows(boot.announcements || []);
    } catch (e) {
      setError(describeDashboardError(e, locale));
    }
  }, [session?.role, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (session?.role !== "admin") return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await saveMarketplaceTicker({
        text_ar: textAr.trim(),
        text_en: textEn.trim(),
        link_path: linkPath.trim() || undefined,
        state: "draft",
      });
      setTextAr("");
      setTextEn("");
      setLinkPath("");
      await load();
      setMessage(ar ? "تم حفظ الإعلان كمسودة في MySQL. لا يظهر للزوار قبل النشر." : "Announcement saved as draft in MySQL. Visitors do not see it until published.");
    } catch (x) {
      setError(describeDashboardError(x, locale));
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (row: MarketplaceAnnouncement) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const nextState = row.state === "published" ? "draft" : "published";
      await saveMarketplaceTicker({
        id: row.id,
        text_ar: row.text_ar,
        text_en: row.text_en,
        link_path: row.link_path || undefined,
        state: nextState,
      });
      await load();
      setMessage(
        nextState === "published"
          ? ar
            ? "تم نشر الإعلان في شريط الموقع."
            : "Announcement published to the site ticker."
          : ar
          ? "تم إيقاف نشر الإعلان."
          : "Announcement unpublished."
      );
    } catch (x) {
      setError(describeDashboardError(x, locale));
    } finally {
      setBusy(false);
    }
  };

  if (session?.role !== "admin") return null;

  return (
    <section className="ibg-root" dir={ar ? "rtl" : "ltr"}>
      <header className="ibg-head">
        <span className="ibg-kicker">
          <Megaphone size={18} /> IDEA HEADER TICKER · PHP/MYSQL
        </span>
        <h1>{ar ? "الشريط الإعلاني الثابت" : "Site Announcement Ticker"}</h1>
        <p>
          {ar
            ? "الشريط مثبت داخل الهيدر، يدعم الموبايل، ويغيّر اللغة تلقائيًا حسب اختيار الزائر. كل إعلان يُحفظ عبر PHP/MySQL كمسودة قبل النشر."
            : "Header ticker supporting desktop and mobile in Arabic and English. Announcements save to MySQL as drafts until explicitly published."}
        </p>
      </header>

      <form className="ibg-form" onSubmit={(e) => void add(e)}>
        <label>
          {ar ? "الرسالة بالعربي" : "Arabic text"}
          <input
            required
            minLength={3}
            maxLength={180}
            value={textAr}
            onChange={(e) => setTextAr(e.target.value)}
            placeholder="مجموعة جديدة وصلت IDEA…"
          />
        </label>
        <label>
          English text
          <input
            required
            minLength={3}
            maxLength={180}
            value={textEn}
            onChange={(e) => setTextEn(e.target.value)}
            placeholder="New collection now available…"
          />
        </label>
        <label>
          {ar ? "رابط داخلي (اختياري)" : "Internal path (optional)"}
          <input
            value={linkPath}
            onChange={(e) => setLinkPath(e.target.value)}
            placeholder="/products?category=porcelain"
          />
        </label>
        <button disabled={busy} type="submit">
          <Plus size={15} /> {ar ? "حفظ مسودة" : "Save draft"}
        </button>
      </form>

      {error && (
        <div className="ibg-error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="ibg-success" role="status">
          {message}
        </div>
      )}

      <div className="ibg-list">
        {rows.map((row) => (
          <div className="ibg-row" key={row.id}>
            <span>
              <strong>{row.text_ar}</strong>
              <small>{row.text_en}</small>
              {row.link_path && <small dir="ltr">{row.link_path}</small>}
            </span>
            <span>
              {row.state === "published"
                ? ar
                  ? "منشور في الهيدر"
                  : "Published"
                : row.state === "archived"
                ? ar
                  ? "مؤرشف"
                  : "Archived"
                : ar
                ? "مسودة"
                : "Draft"}
            </span>
            <button type="button" disabled={busy} onClick={() => void togglePublish(row)}>
              {row.state === "published"
                ? ar
                  ? "إيقاف النشر"
                  : "Unpublish"
                : ar
                ? "انشر في الهيدر"
                : "Publish"}
            </button>
          </div>
        ))}
        {!rows.length && <p>{ar ? "لم تضف أي إعلانات بعد." : "No announcements created yet."}</p>}
      </div>
    </section>
  );
}

export function BusinessAdvertising({ mode }: { mode: "admin" | "supplier" }) {
  const { session } = useBackend();
  const { locale } = useI18n();
  const ar = locale === "ar";
  const isAdmin = mode === "admin" && session?.role === "admin";

  const [companies, setCompanies] = useState<MarketplaceCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [packages, setPackages] = useState<MarketplaceAdPackage[]>([]);
  const [campaigns, setCampaigns] = useState<MarketplaceAdRequest[]>([]);
  const [rateDrafts, setRateDrafts] = useState<Record<string, { price: string; days: string }>>({});
  const [packageId, setPackageId] = useState("");
  const [title, setTitle] = useState("");
  const [mediaKind, setMediaKind] = useState<"image" | "video">("image");
  const [brief, setBrief] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    setError("");
    try {
      const [boot, adReqs] = await Promise.all([
        fetchMarketplaceBootstrap(),
        fetchMarketplaceAdRequests(),
      ]);
      const cos = boot.companies || [];
      const pkgs = boot.packages || [];
      setCompanies(cos);
      setPackages(pkgs);
      setCampaigns(adReqs);
      setSelectedCompany((old) => (cos.some((c) => c.id === old) ? old : cos[0]?.id || ""));
      setPackageId((old) => (pkgs.some((p) => p.id === old) ? old : pkgs[0]?.id || ""));
    } catch (e) {
      setError(describeDashboardError(e, locale));
    }
  }, [session?.id, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const updatePackage = async (pkg: MarketplaceAdPackage, nextPublished?: boolean) => {
    if (!isAdmin) return;
    const draft = rateDrafts[pkg.id];
    const priceEgp = draft ? Number(draft.price) : Number(pkg.price_cents || 0) / 100;
    const days = draft ? Number(draft.days) : Number(pkg.duration_days || 7);
    if (!Number.isFinite(priceEgp) || priceEgp < 0 || !Number.isInteger(days) || days < 1 || days > 365) {
      setError(ar ? "سعر الباقة أو عدد الأيام غير صحيح." : "Invalid package price or duration days.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await saveMarketplaceAdPackage({
        id: pkg.id,
        price_cents: Math.round(priceEgp * 100),
        duration_days: days,
        is_published: nextPublished !== undefined ? nextPublished : Boolean(pkg.is_published),
      });
      await load();
      setMessage(ar ? "تم حفظ تسعير باقة الإعلان في MySQL." : "Ad package pricing saved in MySQL.");
    } catch (e) {
      setError(describeDashboardError(e, locale));
    } finally {
      setBusy(false);
    }
  };

  const submitRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || !selectedCompany || !packageId) return;
    if (title.trim().length < 3 || brief.trim().length < 5) {
      setError(ar ? "أدخل عنوان الإعلان وتفاصيل الرسالة بشكل واضح." : "Enter both an ad headline and brief details.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await submitMarketplaceAdRequest({
        company_id: selectedCompany,
        package_id: packageId,
        title: title.trim(),
        message: brief.trim(),
        media_kind: mediaKind,
      });
      setTitle("");
      setBrief("");
      await load();
      setMessage(
        ar
          ? "تم تسجيل طلب الإعلان للمراجعة في MySQL. لا يبدأ أي نشر أو صرف قبل اعتماد إدارة IDEA."
          : "Advertising request submitted to MySQL for admin review. No spend or publication starts automatically."
      );
    } catch (e) {
      setError(describeDashboardError(e, locale));
    } finally {
      setBusy(false);
    }
  };

  const reviewRequest = async (
    item: MarketplaceAdRequest,
    state: "approved" | "needs_revision" | "rejected"
  ) => {
    if (!isAdmin) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await reviewMarketplaceAdRequest({
        id: item.id,
        state,
        notes: (reviewNotes[item.id] || "").trim(),
      });
      await load();
      setMessage(ar ? "تم تحديث قرار مراجعة الطلب الإعلاني." : "Ad request review decision saved.");
    } catch (e) {
      setError(describeDashboardError(e, locale));
    } finally {
      setBusy(false);
    }
  };

  if (!session) return null;

  return (
    <section className="ibg-root" dir={ar ? "rtl" : "ltr"}>
      <header className="ibg-head">
        <span className="ibg-kicker">
          <Megaphone size={18} /> IDEA ADVERTISING STUDIO · PHP/MYSQL
        </span>
        <h1>{isAdmin ? (ar ? "إعلانات الشركات وموافقات النشر" : "Company Ad Requests & Approvals") : ar ? "الباكيجات والدعاية لشركتك" : "Advertising Packages"}</h1>
        <p>
          {ar
            ? "اختر الباقة المناسبة وسجّل تفاصيل الحملة للمراجعة الإدارية. كل حملة تخضع لموافقة إدارة IDEA قبل التشغيل."
            : "Select an available package and submit your campaign brief for IDEA editorial and policy review."}
        </p>
      </header>

      <div className="ibg-packages">
        {packages.map((pkg) => {
          const meta = PLACEMENT_META[pkg.placement || pkg.id] || {
            title: pkg.title_en || pkg.title_ar || pkg.id,
            descAr: pkg.title_ar || "",
            descEn: pkg.title_en || "",
            image: "/images/featured/porcelain.webp",
            spec: `${pkg.duration_days} days`,
          };
          const priceEgp = Number(pkg.price_cents || 0) / 100;
          return (
            <button
              key={pkg.id}
              type="button"
              className={"ibg-package " + (packageId === pkg.id ? "chosen" : "")}
              onClick={() => setPackageId(pkg.id)}
            >
              <img src={meta.image} alt="" loading="lazy" />
              <div>
                <b>{ar ? pkg.title_ar || meta.title : pkg.title_en || meta.title}</b>
                <p>{ar ? meta.descAr : meta.descEn}</p>
                <small>{meta.spec}</small>
                <strong className="ibg-package-price">
                  {priceEgp > 0
                    ? `${formatEgp(priceEgp, locale)} / ${pkg.duration_days} ${ar ? "أيام" : "days"}`
                    : ar
                    ? "السعر بعد مراجعة الإدارة"
                    : "Priced upon admin review"}
                  {isAdmin && !pkg.is_published ? (ar ? " (مسودة)" : " (Draft)") : ""}
                </strong>
              </div>
            </button>
          );
        })}
        {!packages.length && !error && (
          <p className="ibg-no-data">
            {ar ? "لا توجد باقات إعلانية منشورة حاليًا من الخادم." : "No advertising packages returned by the server yet."}
          </p>
        )}
      </div>

      {isAdmin && packages.length > 0 && (
        <section className="ibg-rates">
          <h3>{ar ? "تسعير IDEA الداخلي — تحكم المدير فقط" : "Internal Package Pricing (Admin Only)"}</h3>
          <p>
            {ar
              ? "الأسعار أدناه خاصة بالمساحات الداخلية داخل IDEA وتُحفظ مباشرة في MySQL. لا يراها الموردون إلا بعد النشر."
              : "These rates control internal IDEA placements in MySQL and are visible to suppliers only when published."}
          </p>
          <div className="ibg-rates-list">
            {packages.map((pkg) => {
              const currentEgp = Number(pkg.price_cents || 0) / 100;
              return (
                <div className="ibg-rate-item" key={pkg.id}>
                  <strong>{ar ? pkg.title_ar || pkg.id : pkg.title_en || pkg.id}</strong>
                  <label>
                    {ar ? "السعر (جنيه)" : "Price (EGP)"}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={rateDrafts[pkg.id]?.price ?? String(currentEgp)}
                      onChange={(e) =>
                        setRateDrafts((old) => ({
                          ...old,
                          [pkg.id]: {
                            price: e.target.value,
                            days: old[pkg.id]?.days ?? String(pkg.duration_days),
                          },
                        }))
                      }
                    />
                  </label>
                  <label>
                    {ar ? "عدد أيام العرض" : "Duration (days)"}
                    <input
                      type="number"
                      min="1"
                      max="365"
                      step="1"
                      value={rateDrafts[pkg.id]?.days ?? String(pkg.duration_days)}
                      onChange={(e) =>
                        setRateDrafts((old) => ({
                          ...old,
                          [pkg.id]: {
                            days: e.target.value,
                            price: old[pkg.id]?.price ?? String(currentEgp),
                          },
                        }))
                      }
                    />
                  </label>
                  <button type="button" disabled={busy} onClick={() => void updatePackage(pkg)}>
                    {ar ? "حفظ" : "Save"}
                  </button>
                  <button type="button" disabled={busy} onClick={() => void updatePackage(pkg, !Boolean(pkg.is_published))}>
                    {pkg.is_published ? (ar ? "إخفاء السعر" : "Unpublish") : ar ? "نشر السعر" : "Publish"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="ibg-note">
        <BadgeCheck size={17} />{" "}
        {ar
          ? "تتم مراجعة جميع الطلبات الإعلانية يدويًا من إدارة IDEA قبل التشغيل. لا يتم خصم أي مبالغ تلقائيًا عند تقديم الطلب."
          : "All ad submissions are manually reviewed by IDEA administrators before launch. Submitting a request incurs no automatic charges."}
      </div>
      {!isAdmin && (
        <div className="ibg-note">
          <Film size={17} />{" "}
          {ar
            ? "قبل تصوير فيديو الهيرو أو تجهيز المواد الإعلانية، اكتب المواصفات والرابط أو التواصل المطلوب في الرسالة لتأكيد الجودة وحقوق الاستخدام."
            : "Coordinate video or banner specs with IDEA before final production to confirm resolution, duration, and usage rights."}
        </div>
      )}

      {companies.length > 0 && packages.length > 0 && (
        <form className="ibg-form" onSubmit={(e) => void submitRequest(e)}>
          <label>
            {ar ? "الشركة" : "Company"}
            <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.public_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {ar ? "الباقة الإعلانية" : "Ad package"}
            <select value={packageId} onChange={(e) => setPackageId(e.target.value)}>
              {packages.map((p) => (
                <option value={p.id} key={p.id}>
                  {ar ? p.title_ar || p.id : p.title_en || p.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            {ar ? "نوع المادة الإعلانية" : "Media type"}
            <select value={mediaKind} onChange={(e) => setMediaKind(e.target.value as "image" | "video")}>
              <option value="image">{ar ? "صورة / بانر" : "Image / Banner"}</option>
              <option value="video">{ar ? "فيديو (MP4)" : "Video (MP4)"}</option>
            </select>
          </label>
          <label>
            {ar ? "عنوان الإعلان" : "Campaign headline"}
            <input required minLength={3} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="ibg-wide">
            {ar ? "تفاصيل الإعلان / رسالة للإدارة" : "Campaign brief & message for IDEA review"}
            <textarea
              required
              minLength={5}
              rows={3}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder={ar ? "الماركة، المجموعة، التاريخ المقترح، وأي مواصفات فنية…" : "Brand, collection, target dates, creative specs…"}
            />
          </label>
          <button type="submit" disabled={!selectedCompany || !packageId || busy}>
            <Plus size={16} /> {ar ? "تسجيل طلب الإعلان للمراجعة" : "Submit Ad Request"}
          </button>
        </form>
      )}

      {error && (
        <div className="ibg-error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="ibg-success" role="status">
          {message}
        </div>
      )}

      <div className="ibg-list">
        <h3>{ar ? "طلبات إعلانات الشركات" : "Submitted Company Ad Requests"}</h3>
        {campaigns.map((item) => (
          <div className="ibg-row" key={item.id}>
            <span>
              <strong>{item.title}</strong>
              <small>
                {item.package_id} · {item.media_kind} ·{" "}
                {item.public_name || companies.find((c) => c.id === item.company_id)?.public_name || item.company_id.slice(0, 8)}
              </small>
              <small>{item.message}</small>
              {item.admin_notes && <small>{ar ? "ملاحظة الإدارة:" : "Admin note:"} {item.admin_notes}</small>}
            </span>
            <b>{item.state}</b>
            {isAdmin && (
              <div className="ibg-publish-url">
                <input
                  type="text"
                  placeholder={ar ? "ملاحظات المراجعة (اختياري)" : "Review notes (optional)"}
                  value={reviewNotes[item.id] || ""}
                  onChange={(e) => setReviewNotes((old) => ({ ...old, [item.id]: e.target.value }))}
                />
                <span className="ibg-row-actions">
                  {item.state !== "approved" && (
                    <button type="button" disabled={busy} onClick={() => void reviewRequest(item, "approved")}>
                      {ar ? "اعتماد" : "Approve"}
                    </button>
                  )}
                  {item.state !== "needs_revision" && (
                    <button type="button" disabled={busy} onClick={() => void reviewRequest(item, "needs_revision")}>
                      {ar ? "طلب تعديل" : "Needs revision"}
                    </button>
                  )}
                  {item.state !== "rejected" && (
                    <button type="button" disabled={busy} onClick={() => void reviewRequest(item, "rejected")}>
                      {ar ? "رفض" : "Reject"}
                    </button>
                  )}
                </span>
              </div>
            )}
          </div>
        ))}
        {!campaigns.length && <p>{ar ? "لا توجد طلبات إعلانية محفوظة بعد." : "No advertising requests submitted yet."}</p>}
      </div>
    </section>
  );
}
