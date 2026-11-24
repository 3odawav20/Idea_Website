import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Outlet, useNavigate, useParams, Link } from "react-router";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  FileText,
  Filter,
  Inbox,
  LockKeyhole,
  Package,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useBackend } from "../backend/db";
import { useStore } from "../store/store";
import { Container, Section, SectionHeader, Button } from "../components/ui";
import {
  DashBanner,
  DashLayout,
  DashLoading,
  EmptyState,
  Field,
  Panel,
  StatusBadge,
  inputStyle,
} from "../components/dash";
import {
  computeQuoteBreakdown,
  describeDashboardError,
  EMPTY_SUPPLIER_QUOTE_DRAFT,
  fetchCompanyVerification,
  fetchLiveMailbox,
  fetchMarketplaceBootstrap,
  fetchSupplierRfqsFromQuotesApi,
  filterSupplierRfqs,
  formatEgp,
  submitCompanyVerification,
  submitLiveSupplierQuote,
  uploadVerificationDocument,
  validateSupplierQuoteInput,
  type CompanyVerificationRecord,
  type LiveMailbox,
  type LiveQuote,
  type LiveRfq,
  type MarketplaceCompany,
  type RfqDeadlineFilter,
  type SupplierQuoteDraft,
} from "../backend/dashboardApi";
import { BusinessSubscription } from "./Subscriptions";

const GOVERNORATES = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Qalyubia",
  "Dakahlia",
  "Sharqia",
  "Port Said",
  "Suez",
  "Red Sea",
  "New Valley",
];

const COMPANY_TYPES = [
  "Manufacturer",
  "Importer",
  "Distributor",
  "Ceramic & Porcelain Supplier",
  "Marble & Stone Company",
  "Sanitary-Ware Supplier",
];

function useTr() {
  const { locale } = useI18n();
  return {
    locale,
    tr: (ar: string, en: string, fr = en) => (locale === "ar" ? ar : locale === "fr" ? fr : en),
  };
}

function statusTone(status: string): "gold" | "green" | "red" | "muted" {
  const s = status.toLowerCase();
  if (["verified", "accepted", "won", "paid", "delivered", "active"].includes(s)) return "green";
  if (["rejected", "suspended", "cancelled", "expired"].includes(s)) return "red";
  if (["not-selected", "draft"].includes(s)) return "muted";
  return "gold";
}

function useLiveBusinessData() {
  const { session } = useBackend();
  const [mailbox, setMailbox] = useState<LiveMailbox | null>(null);
  const [verification, setVerification] = useState<CompanyVerificationRecord | null>(null);
  const [companies, setCompanies] = useState<MarketplaceCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    const [mbRes, verRes, mpRes] = await Promise.allSettled([
      fetchLiveMailbox(),
      fetchCompanyVerification(),
      fetchMarketplaceBootstrap(),
    ]);

    if (mbRes.status === "fulfilled") setMailbox(mbRes.value);
    if (verRes.status === "fulfilled") setVerification(verRes.value);
    if (mpRes.status === "fulfilled") setCompanies(mpRes.value.companies || []);

    if (mbRes.status === "rejected" && verRes.status === "rejected" && mpRes.status === "rejected") {
      setError(mbRes.reason instanceof Error ? mbRes.reason.message : String(mbRes.reason));
    }
    setLoading(false);
  }, [session?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const primaryCompany = companies[0] || null;
  const companyStatus = (verification?.status || primaryCompany?.status || "pending").toLowerCase();
  const isVerified = companyStatus === "verified";

  return { mailbox, verification, companies, primaryCompany, companyStatus, isVerified, loading, error, refresh };
}

export function BusinessLayout() {
  const { t, locale } = useI18n();
  const { tr } = useTr();
  const { session, loading } = useBackend();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !session) nav("/business/login");
  }, [loading, session, nav]);

  if (loading || !session) return null;

  const links = [
    { to: "/business", label: tr("نظرة عامة", "Overview") },
    { to: "/business/verification", label: tr("توثيق الشركة والمستندات", "Company Verification") },
    { to: "/business/requests", label: tr("طلبات التسعير الواردة (RFQs)", "Incoming RFQs") },
    { to: "/business/offers", label: tr("عروضي المقدّمة", "My Quotations") },
    { to: "/business/orders", label: tr("الطلبات", "Orders") },
    { to: "/business/products", label: tr("البراندات والمنتجات والفريق", "Products & Team") },
    { to: "/business/sales", label: tr("المبيعات المؤكدة", "Confirmed Sales") },
    { to: "/business/ads", label: tr("باكيجات الدعاية", "Advertising") },
    { to: "/business/inbox", label: tr("الإشعارات", "Notifications") },
    { to: "/business/subscription", label: t("acct.subscription") },
    { to: "/business/reports", label: t("biz.reports") },
    { to: "/business/settings", label: t("acct.settings") },
  ];

  return (
    <DashLayout title={tr("بوابة الشركات والموردين", "Business Portal")} links={links}>
      <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
        <Outlet />
      </div>
    </DashLayout>
  );
}

/* ==========================================================================
 * Responsive Supplier RFQ Data Grid (/api/quotes-api.php + mailbox fallback)
 * ========================================================================== */

export function RFQDataGrid({
  isVerified = true,
  companyStatus = "verified",
}: {
  isVerified?: boolean;
  companyStatus?: string;
}) {
  const { locale, tr } = useTr();
  const { products } = useStore();
  const [requests, setRequests] = useState<LiveRfq[]>([]);
  const [quotes, setQuotes] = useState<LiveQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState<RfqDeadlineFilter>("all");
  const [govFilter, setGovFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"deadline" | "newest">("deadline");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchSupplierRfqsFromQuotesApi();
      setRequests(data.requests);
      setQuotes(data.quotes);
    } catch (err) {
      setError(describeDashboardError(err, locale));
      setRequests([]);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const quoteByRfq = useMemo(() => new Map(quotes.map((q) => [q.requestId, q])), [quotes]);

  const enriched = useMemo(
    () =>
      requests.map((r) => {
        const myQuote = quoteByRfq.get(r.id);
        const catProduct = products.find((p) => p.id === r.productId);
        return {
          ...r,
          productTitle: catProduct?.name[locale] || r.productTitle,
          supplierResponseStatus: myQuote ? myQuote.status : r.supplierResponseStatus || "pending",
        };
      }),
    [requests, quoteByRfq, products, locale]
  );

  const governorates = useMemo(
    () => [...new Set(enriched.map((r) => r.governorate).filter(Boolean))].sort(),
    [enriched]
  );

  const visible = useMemo(
    () =>
      filterSupplierRfqs(enriched, {
        status: statusFilter,
        deadline: deadlineFilter,
        governorate: govFilter,
        query,
        sortBy,
      }),
    [enriched, statusFilter, deadlineFilter, govFilter, query, sortBy]
  );

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="idea-dash-header">
        <div>
          <span className="idea-eyebrow">{tr("مناقصات وطلبات تسعير B2B", "B2B TENDER WORKSPACE")}</span>
          <h1>{tr("طلبات التسعير المخصّصة لشركتك", "Incoming Assigned RFQs")}</h1>
          <p>
            {tr(
              "تظهر هنا فقط طلبات عروض الأسعار المطابقة لنطاق شركتك ومجال عملها. أسعارك وعروضك سرية تمامًا ولا يراها أي مورد آخر.",
              "Only genuine quotation requests matched to your company appear here. Submitted pricing remains strictly confidential between you, the buyer, and administrators."
            )}
          </p>
        </div>
        <div className="idea-dash-actions">
          <Button size="sm" variant="outline" disabled={loading} onClick={() => void load()}>
            <RefreshCw size={14} /> {tr("تحديث", "Refresh")}
          </Button>
        </div>
      </div>

      {!isVerified && (
        <DashBanner tone="warn">
          <strong>{tr("الشركة قيد التوثيق:", "Verification pending:")}</strong>{" "}
          {tr(
            `حالة حساب الشركة الحالية (${companyStatus}). يمكنك استعراض التفاصيل، لكن تقديم عروض الأسعار التجارية متاح فقط للشركات المعتمدة رسميًا من إدارة IDEA.`,
            `Current company status is "${companyStatus}". Commercial quotation submission is enforced server-side for verified suppliers only.`
          )}{" "}
          <Link to="/business/verification" style={{ color: "var(--idea-gold-bright)", fontWeight: 600 }}>
            {tr("استكمال التوثيق", "Complete verification")}
          </Link>
        </DashBanner>
      )}

      {error && <DashBanner tone="error">{error}</DashBanner>}

      <Panel>
        <div className="idea-dash-toolbar" role="region" aria-label={tr("تصفية طلبات التسعير", "Filter RFQs")}>
          <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
            <Search
              size={15}
              aria-hidden="true"
              style={{
                position: "absolute",
                insetInlineStart: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--idea-text-muted)",
              }}
            />
            <input
              type="search"
              className="idea-dash-search"
              style={{ width: "100%", paddingInlineStart: 36 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr("ابحث برقم الطلب أو المنتج أو المحافظة...", "Search reference, product, region...")}
              aria-label={tr("بحث في طلبات التسعير", "Search RFQs")}
            />
          </div>

          <select
            aria-label={tr("تصفية حسب الحالة", "Filter by status")}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{tr("كل الحالات", "All statuses")}</option>
            <option value="pending">{tr("بانتظار ردك", "Awaiting your quote")}</option>
            <option value="submitted">{tr("تم تقديم عرض", "Quote submitted")}</option>
            <option value="accepted">{tr("عرض مقبول", "Accepted")}</option>
            <option value="rejected">{tr("مرفوض", "Rejected")}</option>
          </select>

          <select
            aria-label={tr("تصفية حسب الموعد النهائي", "Filter by deadline")}
            value={deadlineFilter}
            onChange={(e) => setDeadlineFilter(e.target.value as RfqDeadlineFilter)}
          >
            <option value="all">{tr("كل المواعيد", "All deadlines")}</option>
            <option value="urgent24h">{tr("عاجل (خلال 24 ساعة)", "Urgent (<= 24h)")}</option>
            <option value="open">{tr("مفتوح للتسعير", "Open")}</option>
            <option value="expired">{tr("منتهي الصلاحية", "Expired")}</option>
          </select>

          {governorates.length > 0 && (
            <select
              aria-label={tr("تصفية حسب المحافظة", "Filter by region")}
              value={govFilter}
              onChange={(e) => setGovFilter(e.target.value)}
            >
              <option value="all">{tr("كل المحافظات", "All regions")}</option>
              {governorates.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}

          <select
            aria-label={tr("ترتيب النتائج", "Sort RFQs")}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "deadline" | "newest")}
          >
            <option value="deadline">{tr("الأقرب انتهاءً", "Soonest deadline")}</option>
            <option value="newest">{tr("الأحدث أولاً", "Newest first")}</option>
          </select>
        </div>
      </Panel>

      {loading ? (
        <DashLoading count={3} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={
            requests.length === 0
              ? tr("لا توجد طلبات تسعير مسندة لشركتك حاليًا", "No RFQs assigned to your company yet")
              : tr("لا توجد طلبات مطابقة لخيارات البحث", "No RFQs match your active filters")
          }
          sub={
            requests.length === 0
              ? tr(
                  "عند إنشاء عميل لطلب عرض سعر يطابق منتجات شركتك ومحافظات التغطية، سيظهر هنا تلقائيًا.",
                  "When a buyer submits a quotation request matching your verified company categories and delivery regions, it will appear here automatically."
                )
              : tr("جرّب تغيير الفلاتر أو إعادة تعيينها.", "Try adjusting or clearing your status and deadline filters.")
          }
          action={
            requests.length > 0 ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setStatusFilter("all");
                  setDeadlineFilter("all");
                  setGovFilter("all");
                  setQuery("");
                }}
              >
                <Filter size={14} /> {tr("إعادة تعيين الفلاتر", "Reset filters")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="idea-dash-table-wrap" data-testid="rfq-data-grid">
          <table className="idea-dash-table">
            <thead>
              <tr>
                <th>{tr("رقم الطلب", "Reference")}</th>
                <th>{tr("المنتج والمقاس", "Product & Variant")}</th>
                <th>{tr("الكمية", "Quantity")}</th>
                <th>{tr("التسليم", "Region")}</th>
                <th>{tr("الموعد النهائي", "Deadline")}</th>
                <th>{tr("الحالة", "Status")}</th>
                <th>{tr("الإجراء", "Action")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const mine = quoteByRfq.get(r.id);
                const expired = r.deadlineAt > 0 && r.deadlineAt < Date.now();
                return (
                  <tr key={r.id}>
                    <td>
                      <strong style={{ fontFamily: "monospace" }}>{r.reference}</strong>
                      <div style={{ fontSize: 11, color: "var(--idea-text-faint)" }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB") : "—"}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.productTitle}</div>
                      <div style={{ fontSize: 12, color: "var(--idea-text-muted)" }}>
                        {[r.category, r.variantLabel].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </td>
                    <td>
                      <strong>
                        {r.quantity.toLocaleString()} {r.unit}
                      </strong>
                    </td>
                    <td>
                      <div>{r.governorate || "—"}</div>
                      {r.destination && (
                        <div style={{ fontSize: 11.5, color: "var(--idea-text-muted)" }}>{r.destination}</div>
                      )}
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <CalendarClock size={14} aria-hidden="true" />
                        {r.deadlineAt
                          ? new Date(r.deadlineAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : tr("غير محدد", "Not specified")}
                      </span>
                    </td>
                    <td>
                      <StatusBadge
                        text={mine ? mine.status : expired ? tr("منتهي", "Expired") : r.status}
                        tone={statusTone(mine ? mine.status : expired ? "expired" : r.status)}
                      />
                    </td>
                    <td>
                      <Link to={`/business/requests/${r.id}`}>
                        <Button size="sm" variant={mine ? "outline" : "gold"} disabled={!isVerified && !mine}>
                          {mine ? tr("عرض / مراجعة", "Review quote") : tr("تقديم عرض سعر", "Submit quote")}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
 * Secure Supplier Quotation Submission Form (ZERO prefabricated defaults)
 * ========================================================================== */

export function QuotationSubmissionForm({
  rfq,
  isVerified,
  onSubmitted,
}: {
  rfq: LiveRfq;
  isVerified: boolean;
  onSubmitted?: (quote: LiveQuote) => void;
}) {
  const { locale, tr } = useTr();
  const [draft, setDraft] = useState<SupplierQuoteDraft>(EMPTY_SUPPLIER_QUOTE_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const setField = <K extends keyof SupplierQuoteDraft>(key: K, value: SupplierQuoteDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (error) setError("");
  };

  const parsedBreakdown = useMemo(() => {
    const unitPrice = Number(draft.unitPrice);
    const quantity = Number(draft.quantity);
    const taxPercent = Number(draft.taxPercent);
    const shipping = Number(draft.shipping);
    if (
      draft.unitPrice.trim() === "" ||
      draft.quantity.trim() === "" ||
      !Number.isFinite(unitPrice) ||
      !Number.isFinite(quantity) ||
      unitPrice <= 0 ||
      quantity <= 0
    ) {
      return null;
    }
    return computeQuoteBreakdown({
      unitPrice,
      quantity,
      taxPercent: Number.isFinite(taxPercent) && draft.taxPercent.trim() !== "" ? taxPercent : 0,
      shipping: Number.isFinite(shipping) && draft.shipping.trim() !== "" ? shipping : 0,
    });
  }, [draft.unitPrice, draft.quantity, draft.taxPercent, draft.shipping]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSuccess("");

    if (!isVerified) {
      setError(
        tr(
          "لا يمكن تقديم عرض سعر قبل اعتماد الشركة رسميًا من إدارة IDEA.",
          "Your company must be verified by IDEA administrators before submitting commercial quotations."
        )
      );
      return;
    }

    const validationError = validateSupplierQuoteInput(draft, locale);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const saved = await submitLiveSupplierQuote({
        requestId: rfq.id,
        unitPrice: Number(draft.unitPrice),
        quantity: Number(draft.quantity),
        unit: rfq.unit,
        shipping: Number(draft.shipping),
        taxPercent: Number(draft.taxPercent),
        prepDays: draft.prepDays.trim() === "" ? 0 : Number(draft.prepDays),
        deliveryDays: Number(draft.deliveryDays),
        validityDays: Number(draft.validityDays),
        paymentTerms: draft.paymentTerms.trim(),
        exactProduct: draft.exactProduct,
        proposedEquivalent: draft.proposedEquivalent.trim() || undefined,
        availability: draft.availability.trim() || undefined,
        notes: draft.notes.trim() || undefined,
        signerName: draft.signerName.trim() || undefined,
      });
      setSuccess(
        tr(
          "تم تسجيل عرض السعر السري على الخادم بنجاح وإشعار العميل.",
          "Your confidential quotation has been saved on the server and sent privately to the buyer."
        )
      );
      setDraft(EMPTY_SUPPLIER_QUOTE_DRAFT);
      onSubmitted?.(saved);
    } catch (err) {
      setError(describeDashboardError(err, locale));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Panel>
      <form onSubmit={(e) => void handleSubmit(e)} noValidate data-testid="quotation-submission-form">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <div>
            <h2 className="idea-display" style={{ margin: 0, fontSize: 18, color: "var(--idea-text)" }}>
              {tr("نموذج تقديم عرض السعر السري", "Confidential Quotation Submission")}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--idea-text-muted)" }}>
              {tr(
                "أدخل الأسعار والشروط التجارية الفعلية لشركتك. لا توجد قيم افتراضية مسبقة.",
                "Enter your company's actual commercial pricing and delivery terms. No placeholder defaults are prefilled."
              )}
            </p>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--idea-gold-bright)" }}>
            <LockKeyhole size={14} aria-hidden="true" />
            {tr("سري للعميل والإدارة فقط", "Private to buyer & admin")}
          </span>
        </div>

        <div className="idea-dash-form-grid">
          <Field label={tr(`سعر الوحدة الفعلي (ج.م / ${rfq.unit}) *`, `Actual unit price (EGP / ${rfq.unit}) *`)}>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              style={inputStyle}
              value={draft.unitPrice}
              onChange={(e) => setField("unitPrice", e.target.value)}
              placeholder={tr("أدخل السعر الفعلي", "Enter actual unit price")}
            />
          </Field>

          <Field label={tr(`الكمية المعروضة (${rfq.unit}) *`, `Offered quantity (${rfq.unit}) *`)}>
            <input
              type="number"
              min="1"
              step="1"
              required
              style={inputStyle}
              value={draft.quantity}
              onChange={(e) => setField("quantity", e.target.value)}
              placeholder={tr(`الكمية المطلوبة: ${rfq.quantity}`, `Requested: ${rfq.quantity}`)}
            />
          </Field>

          <Field label={tr("تكلفة الشحن (ج.م) *", "Shipping charge (EGP) *")}>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              style={inputStyle}
              value={draft.shipping}
              onChange={(e) => setField("shipping", e.target.value)}
              placeholder={tr("أدخل تكلفة الشحن (أو 0)", "Enter actual shipping (or 0)")}
            />
          </Field>

          <Field label={tr("نسبة الضريبة (%) *", "Tax percentage (%) *")}>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              required
              style={inputStyle}
              value={draft.taxPercent}
              onChange={(e) => setField("taxPercent", e.target.value)}
              placeholder={tr("مثال: 14", "e.g. 14")}
            />
          </Field>

          <Field label={tr("مدة التوصيل (بالأيام) *", "Estimated delivery (days) *")}>
            <input
              type="number"
              min="1"
              max="365"
              step="1"
              required
              style={inputStyle}
              value={draft.deliveryDays}
              onChange={(e) => setField("deliveryDays", e.target.value)}
              placeholder={tr("عدد أيام التسليم", "Delivery days")}
            />
          </Field>

          <Field label={tr("صلاحية العرض (بالأيام) *", "Quote validity (days) *")}>
            <input
              type="number"
              min="1"
              max="90"
              step="1"
              required
              style={inputStyle}
              value={draft.validityDays}
              onChange={(e) => setField("validityDays", e.target.value)}
              placeholder={tr("مثال: 7", "e.g. 7")}
            />
          </Field>

          <Field label={tr("أيام التجهيز (اختياري)", "Preparation days (optional)")}>
            <input
              type="number"
              min="0"
              max="180"
              step="1"
              style={inputStyle}
              value={draft.prepDays}
              onChange={(e) => setField("prepDays", e.target.value)}
              placeholder={tr("أيام التجهيز", "Prep days")}
            />
          </Field>

          <Field label={tr("شروط الدفع *", "Payment terms *")}>
            <input
              type="text"
              required
              maxLength={160}
              style={inputStyle}
              value={draft.paymentTerms}
              onChange={(e) => setField("paymentTerms", e.target.value)}
              placeholder={tr("مثال: 50% دفعة تعاقد و50% عند التسليم", "e.g. 50% deposit, 50% upon delivery")}
            />
          </Field>

          <Field label={tr("حالة التوفر", "Availability")}>
            <input
              type="text"
              maxLength={120}
              style={inputStyle}
              value={draft.availability}
              onChange={(e) => setField("availability", e.target.value)}
              placeholder={tr("متوفر بالمخزن / بالتوريد", "In stock / Made to order")}
            />
          </Field>

          <Field label={tr("اسم المفوّض بالتسعير", "Authorized signer name")}>
            <input
              type="text"
              maxLength={120}
              style={inputStyle}
              value={draft.signerName}
              onChange={(e) => setField("signerName", e.target.value)}
              placeholder={tr("اسم المسؤول التجاري", "Commercial representative")}
            />
          </Field>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 13.5, color: "var(--idea-text)" }}>
          <input
            type="checkbox"
            checked={draft.exactProduct}
            onChange={(e) => setField("exactProduct", e.target.checked)}
          />
          {tr("مطابق تمامًا للمنتج والمقاس المطلوب", "Exact match to requested catalogue product & variant")}
        </label>

        {!draft.exactProduct && (
          <Field label={tr("اسم / كود البديل المعتمد المقترح *", "Proposed equivalent product / SKU *")}>
            <input
              type="text"
              required
              maxLength={180}
              style={inputStyle}
              value={draft.proposedEquivalent}
              onChange={(e) => setField("proposedEquivalent", e.target.value)}
              placeholder={tr("اذكر المصنع والمقاس والدرجة", "Specify brand, size and finish")}
            />
          </Field>
        )}

        <Field label={tr("ملاحظات تجارية أو شروط توريد إضافية", "Commercial notes & delivery conditions")}>
          <textarea
            rows={3}
            maxLength={1000}
            style={{ ...inputStyle, resize: "vertical" }}
            value={draft.notes}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder={tr("تفاصيل التعتيق، الفرز، التفريغ، أو شروط الضمان...", "Shade/caliber guarantee, unloading terms, warranty...")}
          />
        </Field>

        {parsedBreakdown && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 10,
              padding: 14,
              borderRadius: 12,
              background: "rgba(128,134,144,0.08)",
              marginBottom: 14,
              fontSize: 13,
            }}
          >
            <div>
              <div style={{ color: "var(--idea-text-muted)", fontSize: 11 }}>{tr("الإجمالي الفرعي", "Subtotal")}</div>
              <strong>{formatEgp(parsedBreakdown.subtotal, locale)}</strong>
            </div>
            <div>
              <div style={{ color: "var(--idea-text-muted)", fontSize: 11 }}>{tr("الضريبة", "Tax")}</div>
              <strong>{formatEgp(parsedBreakdown.taxAmount, locale)}</strong>
            </div>
            <div>
              <div style={{ color: "var(--idea-text-muted)", fontSize: 11 }}>{tr("الشحن", "Shipping")}</div>
              <strong>{formatEgp(parsedBreakdown.shipping, locale)}</strong>
            </div>
            <div>
              <div style={{ color: "var(--idea-gold-bright)", fontSize: 11, fontWeight: 700 }}>{tr("الإجمالي النهائي", "Quoted Total")}</div>
              <strong style={{ color: "var(--idea-gold-bright)" }}>{formatEgp(parsedBreakdown.total, locale)}</strong>
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 12 }}>
            <DashBanner tone="error">{error}</DashBanner>
          </div>
        )}
        {success && (
          <div style={{ marginBottom: 12 }}>
            <DashBanner tone="ok">{success}</DashBanner>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button type="submit" disabled={submitting || !isVerified}>
            <Send size={15} />
            {submitting ? tr("جاري الإرسال والتأكيد...", "Submitting to server...") : tr("إرسال عرض السعر السري", "Submit confidential quotation")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={() => {
              setDraft(EMPTY_SUPPLIER_QUOTE_DRAFT);
              setError("");
              setSuccess("");
            }}
          >
            {tr("مسح الحقول", "Clear form")}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

/* ==========================================================================
 * Business Overview, Verification, Requests, Offers, Orders, Inbox, Settings
 * ========================================================================== */

export function BusinessOverview() {
  const { locale, tr } = useTr();
  const { mailbox, verification, primaryCompany, companyStatus, isVerified, loading, error, refresh } = useLiveBusinessData();

  const rfqsCount = mailbox?.requests.length ?? 0;
  const quotesCount = mailbox?.quotes.length ?? 0;
  const acceptedCount = mailbox?.quotes.filter((q) => q.status === "accepted").length ?? 0;
  const ordersCount = mailbox?.orders.length ?? 0;
  const activeProducts = primaryCompany?.products ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="idea-dash-header">
        <div>
          <span className="idea-eyebrow">{tr("لوحة تحكم الموردين والشركات", "B2B SUPPLIER WORKSPACE")}</span>
          <h1>{verification?.publicName || primaryCompany?.public_name || tr("مركز أعمال شركتك", "Business Control Center")}</h1>
          <p>
            {verification?.legalName || primaryCompany?.legal_name
              ? `${verification?.legalName || primaryCompany?.legal_name}`
              : tr(
                  "أدر مستندات التوثيق، طلبات التسعير الواردة، عروضك السرية، والمنتجات المعتمدة من قاعدة بيانات MySQL مباشرة.",
                  "Manage company verification, assigned RFQs, private quotations, and approved products directly from MySQL."
                )}
          </p>
        </div>
        <div className="idea-dash-actions">
          <StatusBadge text={companyStatus} tone={statusTone(companyStatus)} />
          <Button size="sm" variant="outline" disabled={loading} onClick={() => void refresh()}>
            <RefreshCw size={14} /> {tr("تحديث", "Refresh")}
          </Button>
        </div>
      </div>

      {!isVerified && !loading && (
        <DashBanner tone="warn">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span>
              {tr(
                "حساب شركتك لم يُعتمد بعد كـمورّد موثّق. ارفع السجل التجاري والبطاقة الضريبية لإتمام مراجعة الإدارة.",
                "Your company verification is not yet approved. Upload your Commercial Registration and Tax Card for administrator review."
              )}
            </span>
            <Link to="/business/verification">
              <Button size="sm">{tr("إدارة التوثيق", "Go to verification")}</Button>
            </Link>
          </div>
        </DashBanner>
      )}

      {error && <DashBanner tone="error">{describeDashboardError(error, locale)}</DashBanner>}

      {loading ? (
        <DashLoading count={2} />
      ) : (
        <div className="idea-dash-kpi-grid">
          <div className="idea-dash-kpi">
            <span className="idea-dash-kpi-label">
              {tr("المنتجات المسجلة", "Registered Products")} <Package size={15} />
            </span>
            <span className="idea-dash-kpi-value">{activeProducts}</span>
            <span className="idea-dash-kpi-sub">{tr("من قاعدة بيانات الشركات", "From MySQL catalogue")}</span>
          </div>
          <div className="idea-dash-kpi">
            <span className="idea-dash-kpi-label">
              {tr("طلبات التسعير الواردة", "RFQs Received")} <FileText size={15} />
            </span>
            <span className="idea-dash-kpi-value">{rfqsCount}</span>
            <span className="idea-dash-kpi-sub">{tr("المسندة لشركتك فقط", "Assigned to your company")}</span>
          </div>
          <div className="idea-dash-kpi">
            <span className="idea-dash-kpi-label">
              {tr("عروض الأسعار المقدمة", "Offers Submitted")} <Send size={15} />
            </span>
            <span className="idea-dash-kpi-value">{quotesCount}</span>
            <span className="idea-dash-kpi-sub">
              {tr(`مقبولة: ${acceptedCount}`, `Accepted: ${acceptedCount}`)}
            </span>
          </div>
          <div className="idea-dash-kpi">
            <span className="idea-dash-kpi-label">
              {tr("الطلبات المرتبطة", "Orders")} <CheckCircle2 size={15} />
            </span>
            <span className="idea-dash-kpi-value">{ordersCount}</span>
            <span className="idea-dash-kpi-sub">{tr("المؤكدة من الخادم فقط", "Server-recorded orders")}</span>
          </div>
        </div>
      )}

      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 className="idea-display" style={{ margin: 0, fontSize: 17 }}>
              {tr("اختصارات التشغيل اليومي", "Operational Shortcuts")}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--idea-text-muted)" }}>
              {tr("انتقل مباشرة إلى المناقصات الواردة، أو عروضك، أو إدارة منتجات شركتك.", "Jump directly into active RFQs, submitted quotations, or your company catalogue.")}
            </p>
          </div>
          <div className="idea-dash-actions">
            <Link to="/business/requests"><Button size="sm">{tr("طلبات التسعير", "Incoming RFQs")}</Button></Link>
            <Link to="/business/products"><Button size="sm" variant="outline">{tr("المنتجات والفريق", "Products & Team")}</Button></Link>
            <Link to="/business/sales"><Button size="sm" variant="outline">{tr("المبيعات المؤكدة", "Confirmed Sales")}</Button></Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function BusinessOnboarding() {
  const { session } = useBackend();
  const { locale, tr } = useTr();
  const nav = useNavigate();
  const [f, setF] = useState({
    legalName: "",
    publicName: "",
    representative: "",
    email: session?.email || "",
    phone: session?.phone || "",
    governorate: "Cairo",
    companyType: COMPANY_TYPES[0],
    crNumber: "",
    taxNumber: "",
  });
  const [crFile, setCrFile] = useState<File | null>(null);
  const [taxFile, setTaxFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setNotice("");
    if (!f.legalName.trim() || !f.publicName.trim() || !f.representative.trim() || !f.crNumber.trim() || !f.taxNumber.trim()) {
      setError(
        tr(
          "أكمل الاسم القانوني والاسم التجاري والممثل المفوّض ورقم السجل التجاري والبطاقة الضريبية.",
          "Complete legal name, public trade name, authorized representative, Commercial Registration, and Tax ID."
        )
      );
      return;
    }
    setSubmitting(true);
    try {
      if (crFile) await uploadVerificationDocument(crFile, "commercial_registration");
      if (taxFile) await uploadVerificationDocument(taxFile, "tax_card");
      await submitCompanyVerification({
        ...f,
        categories: ["ceramic", "porcelain", "marble"],
        serviceAreas: [f.governorate],
      });
      setNotice(
        tr(
          "تم إرسال بيانات الشركة للمراجعة الرسمية على الخادم بنجاح.",
          "Company details were submitted to the server for official administrator review."
        )
      );
      nav("/business/verification");
    } catch (err) {
      setError(describeDashboardError(err, locale));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container style={{ maxWidth: 760 }}>
        <SectionHeader
          eyebrow={tr("تسجيل الشركات والموردين", "BUSINESS VERIFICATION")}
          title={tr("توثيق بيانات الشركة", "Company Verification Onboarding")}
          sub={tr(
            "أدخل البيانات القانونية الفعلية وارفع المستندات الرسمية. لا تُعرض المستندات للجمهور وتُراجع فقط بواسطة مسؤولي IDEA.",
            "Provide genuine corporate registration details and supporting documents. Legal files stay private and are reviewed only by authorized IDEA administrators."
          )}
        />
        <Panel>
          <form onSubmit={(e) => void submit(e)}>
            <div className="idea-dash-form-grid">
              <Field label={tr("الاسم القانوني المسجّل *", "Registered legal company name *")}>
                <input required style={inputStyle} value={f.legalName} onChange={(e) => set("legalName", e.target.value)} />
              </Field>
              <Field label={tr("الاسم التجاري الظاهر *", "Public trade name *")}>
                <input required style={inputStyle} value={f.publicName} onChange={(e) => set("publicName", e.target.value)} />
              </Field>
              <Field label={tr("الممثل المفوّض *", "Authorized representative *")}>
                <input required style={inputStyle} value={f.representative} onChange={(e) => set("representative", e.target.value)} />
              </Field>
              <Field label={tr("بريد الشركة الرسمي *", "Business email *")}>
                <input type="email" required style={inputStyle} value={f.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label={tr("هاتف الشركة *", "Business phone *")}>
                <input required style={inputStyle} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+20..." />
              </Field>
              <Field label={tr("المحافظة", "Governorate")}>
                <select style={inputStyle} value={f.governorate} onChange={(e) => set("governorate", e.target.value)}>
                  {GOVERNORATES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </Field>
              <Field label={tr("نشاط الشركة", "Company category")}>
                <select style={inputStyle} value={f.companyType} onChange={(e) => set("companyType", e.target.value)}>
                  {COMPANY_TYPES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </Field>
              <Field label={tr("رقم السجل التجاري *", "Commercial Registration (CR) *")}>
                <input required style={inputStyle} value={f.crNumber} onChange={(e) => set("crNumber", e.target.value)} />
              </Field>
              <Field label={tr("رقم البطاقة الضريبية *", "Tax Registration ID *")}>
                <input required style={inputStyle} value={f.taxNumber} onChange={(e) => set("taxNumber", e.target.value)} />
              </Field>
            </div>
            <div className="idea-dash-form-grid">
              <Field label={tr("ملف السجل التجاري (PDF / JPG / PNG)", "Commercial Registration file")}>
                <input type="file" accept=".pdf,image/jpeg,image/png,image/webp" style={{ ...inputStyle, padding: 8 }} onChange={(e) => setCrFile(e.target.files?.[0] || null)} />
              </Field>
              <Field label={tr("ملف البطاقة الضريبية (PDF / JPG / PNG)", "Tax Card file")}>
                <input type="file" accept=".pdf,image/jpeg,image/png,image/webp" style={{ ...inputStyle, padding: 8 }} onChange={(e) => setTaxFile(e.target.files?.[0] || null)} />
              </Field>
            </div>
            {error && <div style={{ marginBottom: 12 }}><DashBanner tone="error">{error}</DashBanner></div>}
            {notice && <div style={{ marginBottom: 12 }}><DashBanner tone="ok">{notice}</DashBanner></div>}
            <Button type="submit" disabled={submitting}>
              <Upload size={15} />
              {submitting ? tr("جاري الرفع والتسجيل...", "Uploading & submitting...") : tr("إرسال للمراجعة الرسمية", "Submit for verification")}
            </Button>
          </form>
        </Panel>
      </Container>
    </Section>
  );
}

export function BusinessVerification() {
  const { locale, tr } = useTr();
  const { verification, primaryCompany, companyStatus, loading, error, refresh } = useLiveBusinessData();
  const [docKind, setDocKind] = useState("commercial_registration");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionOk, setActionOk] = useState("");

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || uploading) return;
    setUploading(true);
    setActionError("");
    setActionOk("");
    try {
      await uploadVerificationDocument(file, docKind);
      setFile(null);
      setActionOk(tr("تم تأكيد رفع المستند وحفظه على الخادم.", "Document upload confirmed by server."));
      await refresh();
    } catch (err) {
      setActionError(describeDashboardError(err, locale));
    } finally {
      setUploading(false);
    }
  };

  const docs = verification?.documents || [];
  const hasDetails = Boolean(verification?.legalName || primaryCompany?.legal_name);
  const hasDocs = docs.length > 0;
  const isReviewed = ["verified", "rejected", "more_info_required", "suspended"].includes(companyStatus);
  const isApproved = companyStatus === "verified";

  const steps = [
    { label: tr("تسجيل بيانات الشركة القانونية", "Legal company profile submitted"), done: hasDetails },
    { label: tr("تأكيد رفع المستندات الرسمية على الخادم", "Supporting documents confirmed on server"), done: hasDocs },
    { label: tr("مراجعة فريق إدارة IDEA", "IDEA administrator review"), done: isReviewed },
    { label: tr("اعتماد المورد وتفعيل صلاحيات التسعير", "Verified & authorized for quotations"), done: isApproved },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="idea-dash-header">
        <div>
          <span className="idea-eyebrow">{tr("التحقق القانوني للشركات", "SUPPLIER VERIFICATION")}</span>
          <h1>{tr("حالة توثيق الشركة والمستندات", "Company Verification & Documents")}</h1>
          <p>
            {tr(
              "لا تُعرض حالة «مرفوع» أو «موثّق» إلا بعد تأكيد خادم PHP/MySQL. قرارات الاعتماد تصدر حصرًا من مسؤولي المنصة.",
              "Documents and approval badges strictly reflect confirmed PHP/MySQL server records. Approval is granted exclusively by platform administrators."
            )}
          </p>
        </div>
        <div className="idea-dash-actions">
          <StatusBadge text={companyStatus} tone={statusTone(companyStatus)} />
          <Button size="sm" variant="outline" disabled={loading} onClick={() => void refresh()}>
            <RefreshCw size={14} /> {tr("تحديث", "Refresh")}
          </Button>
        </div>
      </div>

      {error && <DashBanner tone="error">{describeDashboardError(error, locale)}</DashBanner>}
      {verification?.reviewNotes && (
        <DashBanner tone={companyStatus === "rejected" || companyStatus === "more_info_required" ? "warn" : "info"}>
          <strong>{tr("ملاحظة المراجع الإداري:", "Administrator review note:")}</strong> {verification.reviewNotes}
        </DashBanner>
      )}

      {loading ? (
        <DashLoading count={2} />
      ) : (
        <>
          <Panel>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <strong style={{ fontSize: 17 }}>{verification?.publicName || primaryCompany?.public_name || tr("لم يكتمل ملف الشركة", "Company profile incomplete")}</strong>
                <div style={{ fontSize: 13, color: "var(--idea-text-muted)", marginTop: 3 }}>
                  {verification?.legalName || primaryCompany?.legal_name || "—"}
                  {verification?.crNumber ? ` · CR: ${verification.crNumber}` : ""}
                  {verification?.taxNumber ? ` · Tax: ${verification.taxNumber}` : ""}
                </div>
              </div>
              <Link to="/business/apply">
                <Button size="sm" variant="outline">
                  <Building2 size={14} /> {tr("تحديث بيانات التقديم", "Edit application")}
                </Button>
              </Link>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {steps.map((st) => (
                <div key={st.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: st.done ? "var(--idea-text)" : "var(--idea-text-muted)" }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      border: `1.5px solid ${st.done ? "var(--idea-success)" : "var(--idea-border)"}`,
                      background: st.done ? "var(--idea-success)" : "transparent",
                      flexShrink: 0,
                    }}
                  />
                  <span>{st.label}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="idea-display" style={{ margin: "0 0 12px", fontSize: 16 }}>
              {tr(`المستندات المؤكدة على الخادم (${docs.length})`, `Server-Confirmed Documents (${docs.length})`)}
            </h2>
            {docs.length === 0 ? (
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--idea-text-muted)" }}>
                {tr("لم يتم تأكيد رفع أي مستند بعد.", "No supporting documents confirmed on the server yet.")}
              </p>
            ) : (
              <div className="idea-dash-table-wrap" style={{ marginBottom: 16 }}>
                <table className="idea-dash-table">
                  <thead>
                    <tr>
                      <th>{tr("النوع", "Document Type")}</th>
                      <th>{tr("الملف", "File")}</th>
                      <th>{tr("الحالة", "Status")}</th>
                      <th>{tr("تاريخ الرفع", "Uploaded")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((d) => (
                      <tr key={d.id}>
                        <td>{d.kind}</td>
                        <td>{d.filename}</td>
                        <td><StatusBadge text={d.status} tone={statusTone(d.status)} /></td>
                        <td>{d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <form onSubmit={(e) => void handleUpload(e)} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 200px" }}>
                <Field label={tr("نوع المستند", "Document kind")}>
                  <select style={inputStyle} value={docKind} onChange={(e) => setDocKind(e.target.value)}>
                    <option value="commercial_registration">{tr("السجل التجاري", "Commercial Registration")}</option>
                    <option value="tax_card">{tr("البطاقة الضريبية", "Tax Card")}</option>
                    <option value="representative_id">{tr("بطاقة الممثل المفوّض", "Authorized Representative ID")}</option>
                    <option value="factory_authorization">{tr("تفويض مصنع / توكيل", "Factory / Brand Authorization")}</option>
                  </select>
                </Field>
              </div>
              <div style={{ flex: "2 1 240px" }}>
                <Field label={tr("اختر ملفًا (PDF / JPG / PNG / WebP)", "Select file (PDF / JPG / PNG / WebP)")}>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    style={{ ...inputStyle, padding: 8 }}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </Field>
              </div>
              <div style={{ marginBottom: "var(--idea-space-4)" }}>
                <Button type="submit" size="sm" disabled={!file || uploading}>
                  <Upload size={14} /> {uploading ? tr("جاري الرفع...", "Uploading...") : tr("رفع المستند", "Upload document")}
                </Button>
              </div>
            </form>
            {actionError && <DashBanner tone="error">{actionError}</DashBanner>}
            {actionOk && <DashBanner tone="ok">{actionOk}</DashBanner>}
          </Panel>
        </>
      )}
    </div>
  );
}

export function BusinessRequests() {
  const { isVerified, companyStatus } = useLiveBusinessData();
  return <RFQDataGrid isVerified={isVerified} companyStatus={companyStatus} />;
}

export function BusinessRequestDetail() {
  const { requestId } = useParams();
  const { locale, tr } = useTr();
  const { products } = useStore();
  const nav = useNavigate();
  const { mailbox, isVerified, companyStatus, loading, error } = useLiveBusinessData();

  const rfq = mailbox?.requests.find((r) => r.id === requestId) || null;
  const existingQuote = mailbox?.quotes.find((q) => q.requestId === requestId) || null;
  const product = rfq ? products.find((p) => p.id === rfq.productId) : null;

  if (loading) return <DashLoading count={2} />;
  if (error) return <DashBanner tone="error">{describeDashboardError(error, locale)}</DashBanner>;
  if (!rfq) {
    return (
      <EmptyState
        title={tr("طلب التسعير غير متاح", "Quotation request not found")}
        sub={tr(
          "قد يكون الطلب غير مسند لشركتك أو لم يعد نشطًا على الخادم.",
          "This RFQ is not assigned to your authenticated company account or is no longer active."
        )}
        action={<Link to="/business/requests"><Button size="sm" variant="outline">{tr("العودة للطلبات", "Back to RFQs")}</Button></Link>}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <span className="idea-eyebrow">{rfq.reference}</span>
            <h1 className="idea-display" style={{ margin: "6px 0 4px", fontSize: 22 }}>
              {product?.name[locale] || rfq.productTitle} — {rfq.quantity.toLocaleString()} {rfq.unit}
            </h1>
            <div style={{ fontSize: 13.5, color: "var(--idea-text-muted)" }}>
              {[rfq.variantLabel, rfq.governorate, rfq.destination, rfq.projectType].filter(Boolean).join(" · ")}
            </div>
            {rfq.notes && <p style={{ marginTop: 10, fontSize: 13, color: "var(--idea-text)" }}>{rfq.notes}</p>}
          </div>
          <StatusBadge text={rfq.status} tone={statusTone(rfq.status)} />
        </div>
      </Panel>

      {existingQuote && (
        <DashBanner tone="info">
          {tr(
            `سبق أن قدّمت عرض سعر لهذا الطلب (مراجعة رقم ${existingQuote.revision}) بقيمة إجمالية ${formatEgp(existingQuote.total, locale)} — الحالة: ${existingQuote.status}.`,
            `You previously submitted quotation rev. #${existingQuote.revision} totaling ${formatEgp(existingQuote.total, locale)} (status: ${existingQuote.status}).`
          )}
        </DashBanner>
      )}

      {!isVerified && (
        <DashBanner tone="warn">
          <AlertTriangle size={15} style={{ display: "inline", marginInlineEnd: 6 }} />
          {tr(
            `حالة الشركة (${companyStatus}): يجب اعتماد الشركة قبل إرسال عرض سعر.`,
            `Company status is "${companyStatus}": administrator verification is required before submitting quotes.`
          )}
        </DashBanner>
      )}

      <QuotationSubmissionForm
        rfq={rfq}
        isVerified={isVerified}
        onSubmitted={() => {
          nav("/business/offers");
        }}
      />
    </div>
  );
}

export function BusinessOffers() {
  const { locale, tr } = useTr();
  const { mailbox, loading, error, refresh } = useLiveBusinessData();
  const [filter, setFilter] = useState("all");

  const quotes = mailbox?.quotes || [];
  const visible = quotes.filter((q) => filter === "all" || q.status === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="idea-dash-header">
        <div>
          <span className="idea-eyebrow">{tr("سجل العروض السرية", "QUOTATION MANAGEMENT")}</span>
          <h1>{tr("عروض الأسعار المقدّمة من شركتك", "Submitted Supplier Quotations")}</h1>
          <p>
            {tr(
              "تظهر هنا عروض شركتك فقط مع رقم المراجعة وحالتها الفعلية. لا يمكن لأي مورد الاطلاع على عروض المنافسين.",
              "Only your company's submitted quotations appear here with revision numbers and live status. Competitor offers are strictly inaccessible."
            )}
          </p>
        </div>
        <div className="idea-dash-actions">
          <select
            aria-label={tr("تصفية حسب حالة العرض", "Filter quote status")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ ...inputStyle, width: "auto" }}
          >
            <option value="all">{tr("كل الحالات", "All statuses")}</option>
            <option value="submitted">{tr("مرسل", "Submitted")}</option>
            <option value="accepted">{tr("مقبول", "Accepted")}</option>
            <option value="rejected">{tr("مرفوض", "Rejected")}</option>
            <option value="not-selected">{tr("لم يُختر", "Not selected")}</option>
          </select>
          <Button size="sm" variant="outline" disabled={loading} onClick={() => void refresh()}>
            <RefreshCw size={14} /> {tr("تحديث", "Refresh")}
          </Button>
        </div>
      </div>

      {error && <DashBanner tone="error">{describeDashboardError(error, locale)}</DashBanner>}

      {loading ? (
        <DashLoading count={3} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={tr("لا توجد عروض أسعار مقدّمة بعد", "No quotations submitted yet")}
          sub={tr("افتح أي طلب تسعير وارد لتقديم عرض سعر سري للعميل.", "Open any assigned RFQ to submit a confidential quotation.")}
          action={<Link to="/business/requests"><Button size="sm">{tr("استعراض طلبات التسعير", "Browse incoming RFQs")}</Button></Link>}
        />
      ) : (
        <div className="idea-dash-table-wrap">
          <table className="idea-dash-table">
            <thead>
              <tr>
                <th>{tr("مرجع العرض", "Quote ID")}</th>
                <th>{tr("الكمية والسعر", "Qty & Unit Price")}</th>
                <th>{tr("الإجمالي شامل الضريبة والشحن", "Quoted Total")}</th>
                <th>{tr("التوصيل والدفع", "Delivery & Terms")}</th>
                <th>{tr("المراجعة", "Rev.")}</th>
                <th>{tr("الحالة", "Status")}</th>
                <th>{tr("الطلب", "RFQ")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((q) => (
                <tr key={q.id}>
                  <td style={{ fontFamily: "monospace" }}>{q.id.slice(0, 10)}</td>
                  <td>
                    <strong>{q.quantity} {q.unit}</strong>
                    <div style={{ fontSize: 12, color: "var(--idea-text-muted)" }}>{formatEgp(q.unitPrice, locale)} / {q.unit}</div>
                  </td>
                  <td>
                    <strong style={{ color: "var(--idea-gold-bright)" }}>{formatEgp(q.total, locale)}</strong>
                    <div style={{ fontSize: 11.5, color: "var(--idea-text-muted)" }}>
                      {tr(`ضريبة ${q.taxPercent}% · شحن ${formatEgp(q.shipping, locale)}`, `Tax ${q.taxPercent}% · Ship ${formatEgp(q.shipping, locale)}`)}
                    </div>
                  </td>
                  <td>
                    <div>{q.deliveryDays} {tr("أيام", "days")}</div>
                    <div style={{ fontSize: 11.5, color: "var(--idea-text-muted)" }}>{q.paymentTerms || "—"}</div>
                  </td>
                  <td>#{q.revision}</td>
                  <td><StatusBadge text={q.status} tone={statusTone(q.status)} /></td>
                  <td>
                    <Link to={`/business/requests/${q.requestId}`} style={{ color: "var(--idea-gold-bright)", fontWeight: 600 }}>
                      {tr("فتح الطلب", "Open RFQ")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function BusinessOrders() {
  const { locale, tr } = useTr();
  const { mailbox, loading, error, refresh } = useLiveBusinessData();
  const orders = mailbox?.orders || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="idea-dash-header">
        <div>
          <span className="idea-eyebrow">{tr("طلبات التوريد", "SUPPLIER ORDERS")}</span>
          <h1>{tr("طلبات العملاء المرتبطة بشركتك", "Company Orders")}</h1>
          <p>{tr("تُعرض فقط الطلبات وحالات الدفع والتوريد المؤكدة فعليًا في قاعدة البيانات.", "Only server-confirmed order, payment, and delivery records are displayed.")}</p>
        </div>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => void refresh()}>
          <RefreshCw size={14} /> {tr("تحديث", "Refresh")}
        </Button>
      </div>

      {error && <DashBanner tone="error">{describeDashboardError(error, locale)}</DashBanner>}

      {loading ? (
        <DashLoading count={2} />
      ) : orders.length === 0 ? (
        <EmptyState
          title={tr("لا توجد طلبات مسجلة بعد", "No orders yet")}
          sub={tr("عند قبول العميل لأحد عروضك السرية يظهر الطلب هنا بحالته الرسمية من الخادم.", "When a buyer accepts one of your quotations, the resulting order appears here.")}
        />
      ) : (
        <div className="idea-dash-table-wrap">
          <table className="idea-dash-table">
            <thead>
              <tr>
                <th>{tr("رقم الطلب", "Order ID")}</th>
                <th>{tr("الإجمالي", "Total")}</th>
                <th>{tr("حالة الطلب", "Order Status")}</th>
                <th>{tr("حالة الدفع", "Payment Status")}</th>
                <th>{tr("التاريخ", "Created")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontFamily: "monospace" }}>{o.id}</td>
                  <td><strong>{formatEgp(o.total, locale)}</strong></td>
                  <td><StatusBadge text={o.status} tone={statusTone(o.status)} /></td>
                  <td><StatusBadge text={o.paymentStatus} tone={statusTone(o.paymentStatus)} /></td>
                  <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function BusinessInbox() {
  const { locale, tr } = useTr();
  const { mailbox, loading, error, refresh } = useLiveBusinessData();
  const items = mailbox?.notifications || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="idea-dash-header">
        <div>
          <span className="idea-eyebrow">{tr("صندوق الإشعارات", "NOTIFICATIONS")}</span>
          <h1>{tr("إشعارات الشركة", "Business Inbox")}</h1>
        </div>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => void refresh()}>
          <RefreshCw size={14} /> {tr("تحديث", "Refresh")}
        </Button>
      </div>
      {error && <DashBanner tone="error">{describeDashboardError(error, locale)}</DashBanner>}
      {loading ? (
        <DashLoading count={2} />
      ) : items.length === 0 ? (
        <EmptyState
          title={tr("لا توجد إشعارات جديدة", "No notifications yet")}
          sub={tr("تظهر هنا تنبيهات طلبات التسعير الجديدة وقرارات التوثيق.", "New matched RFQs and verification decisions appear here.")}
        />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((m) => (
            <Panel key={m.id} style={{ borderInlineStart: m.read ? undefined : "3px solid var(--idea-gold)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <strong>{m.title}</strong>
                <span style={{ fontSize: 11.5, color: "var(--idea-text-faint)" }}>
                  {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                </span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--idea-text-muted)" }}>{m.body}</p>
              {m.requestId && (
                <Link to={`/business/requests/${m.requestId}`} style={{ display: "inline-block", marginTop: 8, color: "var(--idea-gold-bright)", fontSize: 13, fontWeight: 600 }}>
                  {tr("فتح طلب التسعير", "Open RFQ")}
                </Link>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

export function BusinessProducts() {
  const { tr } = useTr();
  return (
    <EmptyState
      title={tr("إدارة المنتجات والفريق متاحة عبر مركز التحكم بالشركة", "Manage products & team in Company Control Center")}
      action={<Link to="/business/products"><Button size="sm">{tr("فتح إدارة المنتجات", "Open products")}</Button></Link>}
    />
  );
}

export function BusinessReports() {
  const { locale, tr } = useTr();
  const { mailbox, primaryCompany, loading, error } = useLiveBusinessData();
  const offers = mailbox?.quotes || [];
  const accepted = offers.filter((o) => o.status === "accepted").length;
  const rfqs = mailbox?.requests.length || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="idea-dash-header">
        <div>
          <span className="idea-eyebrow">{tr("تقارير الأداء الفعلي", "PERFORMANCE REPORTS")}</span>
          <h1>{tr("ملخص نشاط الشركة", "Company Activity Summary")}</h1>
          <p>{tr("جميع الأرقام أدناه محسوبة مباشرة من سجلات الخادم دون أي نسب تقديرية أو أرقام مصطنعة.", "Every figure below is computed directly from authenticated server records.")}</p>
        </div>
      </div>
      {error && <DashBanner tone="error">{describeDashboardError(error, locale)}</DashBanner>}
      {loading ? (
        <DashLoading count={2} />
      ) : (
        <div className="idea-dash-kpi-grid">
          <div className="idea-dash-kpi">
            <span className="idea-dash-kpi-label">{tr("طلبات التسعير المستلمة", "RFQs Assigned")} <Inbox size={14} /></span>
            <span className="idea-dash-kpi-value">{rfqs}</span>
          </div>
          <div className="idea-dash-kpi">
            <span className="idea-dash-kpi-label">{tr("العروض المقدمة", "Quotations Submitted")} <FileCheck2 size={14} /></span>
            <span className="idea-dash-kpi-value">{offers.length}</span>
          </div>
          <div className="idea-dash-kpi">
            <span className="idea-dash-kpi-label">{tr("العروض المقبولة", "Accepted Quotations")} <ShieldCheck size={14} /></span>
            <span className="idea-dash-kpi-value">{accepted}</span>
          </div>
          <div className="idea-dash-kpi">
            <span className="idea-dash-kpi-label">{tr("المنتجات المسجلة", "Registered Products")} <Package size={14} /></span>
            <span className="idea-dash-kpi-value">{primaryCompany?.products ?? 0}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function BusinessSubscriptionPage() {
  return <BusinessSubscription />;
}

export function BusinessSettings() {
  const { locale, tr } = useTr();
  const { verification, primaryCompany, companyStatus, loading, error } = useLiveBusinessData();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="idea-dash-header">
        <div>
          <span className="idea-eyebrow">{tr("إعدادات الشركة", "COMPANY SETTINGS")}</span>
          <h1>{tr("بيانات الحساب التجاري", "Business Account Settings")}</h1>
        </div>
      </div>

      {error && <DashBanner tone="error">{describeDashboardError(error, locale)}</DashBanner>}

      {loading ? (
        <DashLoading count={2} />
      ) : (
        <Panel>
          <div className="idea-dash-form-grid">
            <Field label={tr("الاسم القانوني", "Legal company name")}>
              <input style={inputStyle} value={verification?.legalName || primaryCompany?.legal_name || "—"} readOnly disabled />
            </Field>
            <Field label={tr("الاسم التجاري", "Public trade name")}>
              <input style={inputStyle} value={verification?.publicName || primaryCompany?.public_name || "—"} readOnly disabled />
            </Field>
            <Field label={tr("البريد الإلكتروني", "Business email")}>
              <input style={inputStyle} value={verification?.email || primaryCompany?.email || "—"} readOnly disabled />
            </Field>
            <Field label={tr("حالة التوثيق", "Verification status")}>
              <input style={inputStyle} value={companyStatus} readOnly disabled />
            </Field>
          </div>
          <DashBanner tone="info">
            {tr(
              "تعديل الاسم القانوني أو السجل التجاري أو المستندات يتطلب إعادة تقديم رسمية عبر صفحة التوثيق ليتم فحصها من الإدارة.",
              "Changes to registered legal details or tax documents require formal resubmission through Company Verification so administrators can audit them."
            )}{" "}
            <Link to="/business/apply" style={{ color: "var(--idea-gold-bright)", fontWeight: 600 }}>
              {tr("فتح نموذج التوثيق", "Open verification form")}
            </Link>
          </DashBanner>
        </Panel>
      )}
    </div>
  );
}
