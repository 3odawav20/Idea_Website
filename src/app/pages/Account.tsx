import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate, useParams, Link } from "react-router";
import {
  CheckCircle2,
  CreditCard,
  FileText,
  GitCompare,
  Heart,
  Home as HomeIcon,
  Inbox,
  LockKeyhole,
  LogOut,
  Package,
  RefreshCw,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useBackend } from "../backend/db";
import { useStore } from "../store/store";
import { Button } from "../components/ui";
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
import { ProductCard } from "../components/ProductCard";
import {
  acceptLiveQuote,
  describeDashboardError,
  fetchLiveAiQuota,
  fetchLiveMailbox,
  formatEgp,
  rejectLiveQuote,
  type LiveAiQuota,
  type LiveMailbox,
  type LiveQuote,
} from "../backend/dashboardApi";

function useTr() {
  const { locale } = useI18n();
  return {
    locale,
    tr: (ar: string, en: string, fr = en) => (locale === "ar" ? ar : locale === "fr" ? fr : en),
  };
}

function statusTone(status: string): "gold" | "green" | "red" | "muted" {
  const s = status.toLowerCase();
  if (["accepted", "paid", "delivered", "offer selected", "completed"].includes(s)) return "green";
  if (["rejected", "cancelled", "expired", "failed", "no offers received"].includes(s)) return "red";
  if (["not-selected", "unpaid"].includes(s)) return "muted";
  return "gold";
}

function useGuard() {
  const { session, loading } = useBackend();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !session) nav("/login");
  }, [loading, session, nav]);
  return { session, loading };
}

function useLiveCustomerData() {
  const { session } = useBackend();
  const [mailbox, setMailbox] = useState<LiveMailbox | null>(null);
  const [aiQuota, setAiQuota] = useState<LiveAiQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    const [mbRes, aiRes] = await Promise.allSettled([fetchLiveMailbox(), fetchLiveAiQuota()]);
    if (mbRes.status === "fulfilled") {
      setMailbox(mbRes.value);
    } else {
      setError(mbRes.reason instanceof Error ? mbRes.reason.message : String(mbRes.reason));
    }
    if (aiRes.status === "fulfilled") {
      setAiQuota(aiRes.value);
    }
    setLoading(false);
  }, [session?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { mailbox, aiQuota, loading, error, refresh };
}

export function AccountLayout() {
  const { t, locale } = useI18n();
  const { tr } = useTr();
  const { session, loading } = useGuard();
  const { mailbox } = useLiveCustomerData();

  if (loading || !session) return null;

  const unread = mailbox?.notifications.filter((n) => !n.read).length || 0;
  const links = [
    { to: "/account", label: tr("نظرة عامة", "Overview") },
    { to: "/account/requests", label: tr("طلبات عروض الأسعار", "My RFQs") },
    { to: "/account/orders", label: t("acct.orders") },
    { to: "/account/invoices", label: t("acct.invoices") },
    { to: "/account/favorites", label: tr("المنتجات المحفوظة", "Saved Products") },
    { to: "/account/compare", label: t("acct.compare") },
    { to: "/account/room-projects", label: t("acct.roomProjects") },
    { to: "/account/inbox", label: tr("الإشعارات", "Notifications"), badge: unread },
    { to: "/account/subscription", label: t("acct.subscription") },
    { to: "/account/settings", label: tr("ملفي والإعدادات", "Profile & Settings") },
  ];

  return (
    <DashLayout title={tr("حساب العميل", "Customer Dashboard")} links={links}>
      <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
        <Outlet />
      </div>
    </DashLayout>
  );
}

export function AccountProfile() {
  const { session, api } = useBackend();
  const { favorites, products } = useStore();
  const { locale, tr } = useTr();
  const nav = useNavigate();
  const { mailbox, aiQuota, loading, error, refresh } = useLiveCustomerData();

  const reqs = mailbox?.requests || [];
  const quotes = mailbox?.quotes || [];
  const orders = mailbox?.orders || [];
  const unread = mailbox?.notifications.filter((n) => !n.read).length || 0;
  const savedItems = useMemo(() => products.filter((p) => favorites.includes(p.id)).slice(0, 4), [products, favorites]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Panel style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {session?.photoURL ? (
            <img
              src={session.photoURL}
              alt={session.name}
              referrerPolicy="no-referrer"
              style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--idea-gold)" }}
            />
          ) : null}
          <div>
            <div className="idea-display" style={{ fontSize: "var(--idea-text-xl)", color: "var(--idea-text)" }}>
              {session?.name}
            </div>
            <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginTop: 4 }}>
              {[session?.email, session?.phone].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>
        <div className="idea-dash-actions">
          <Button size="sm" variant="outline" disabled={loading} onClick={() => void refresh()}>
            <RefreshCw size={14} /> {tr("تحديث", "Refresh")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              api.signOut();
              nav("/login");
            }}
          >
            <LogOut size={14} />
            {tr("تسجيل الخروج", "Sign out", "Déconnexion")}
          </Button>
        </div>
      </Panel>

      {error && <DashBanner tone="error">{describeDashboardError(error, locale)}</DashBanner>}

      {loading ? (
        <DashLoading count={2} />
      ) : (
        <div className="idea-dash-kpi-grid">
          <div className="idea-dash-kpi">
            <span className="idea-dash-kpi-label">{tr("طلبات التسعير", "Active RFQs")} <FileText size={15} /></span>
            <span className="idea-dash-kpi-value">{reqs.length}</span>
            <Link to="/account/requests" style={{ fontSize: 12, color: "var(--idea-gold-bright)" }}>{tr("إدارة الطلبات", "View RFQs")}</Link>
          </div>
          <div className="idea-dash-kpi">
            <span className="idea-dash-kpi-label">{tr("عروض الموردين", "Supplier Offers")} <LockKeyhole size={15} /></span>
            <span className="idea-dash-kpi-value">{quotes.length}</span>
            <span className="idea-dash-kpi-sub">{tr("عروض خاصة بحسابك فقط", "Private to your account")}</span>
          </div>
          <div className="idea-dash-kpi">
            <span className="idea-dash-kpi-label">{tr("الطلبات", "Orders")} <Package size={15} /></span>
            <span className="idea-dash-kpi-value">{orders.length}</span>
            <Link to="/account/orders" style={{ fontSize: 12, color: "var(--idea-gold-bright)" }}>{tr("سجل الطلبات", "Order history")}</Link>
          </div>
          <div className="idea-dash-kpi">
            <span className="idea-dash-kpi-label">{tr("إشعارات غير مقروءة", "Unread Alerts")} <Inbox size={15} /></span>
            <span className="idea-dash-kpi-value">{unread}</span>
            <Link to="/account/inbox" style={{ fontSize: 12, color: "var(--idea-gold-bright)" }}>{tr("فتح الصندوق", "Open inbox")}</Link>
          </div>
        </div>
      )}

      {/* AI Visualizer Quota Card (server-verified only) */}
      <Panel style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span className="idea-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={13} /> {tr("مُعاين الغرف بالذكاء الاصطناعي", "AI ROOM VISUALIZER QUOTA")}
          </span>
          <div className="idea-display" style={{ fontSize: 18, marginTop: 6 }}>
            {aiQuota
              ? aiQuota.unlimited
                ? tr("حصّة غير محدودة (حساب إداري)", "Unlimited quota")
                : aiQuota.remaining != null && aiQuota.limit != null
                ? tr(`المتبقي ${aiQuota.remaining} من ${aiQuota.limit} محاولات`, `${aiQuota.remaining} of ${aiQuota.limit} generations remaining`)
                : tr("متاح للتحقق داخل المُعاين", "Verified inside AI Visualizer")
              : tr("رصيد المُعاين يُقرأ مباشرة من الخادم", "AI quota is enforced server-side")}
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--idea-text-muted)" }}>
            {tr("جرّب خامات الكتالوج المعتمدة على صورة غرفتك مع الحفاظ على الأثاث والإضاءة.", "Preview verified catalogue materials on your room photo while preserving furniture and lighting.")}
          </p>
        </div>
        <Link to="/ai-room-visualizer">
          <Button size="sm">
            <Sparkles size={14} /> {tr("فتح مُعاين الغرف", "Open AI Visualizer")}
          </Button>
        </Link>
      </Panel>

      {/* Recently Saved Catalogue Materials */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 className="idea-display" style={{ margin: 0, fontSize: 17 }}>
            {tr("الخامات المحفوظة مؤخرًا", "Recently Saved Materials")} ({favorites.length})
          </h2>
          <Link to="/account/favorites" style={{ fontSize: 13, color: "var(--idea-gold-bright)" }}>
            {tr("عرض الكل", "View all")}
          </Link>
        </div>
        {savedItems.length === 0 ? (
          <EmptyState
            title={tr("لا توجد خامات محفوظة بعد", "No saved materials yet")}
            sub={tr("احفظ خاماتك المفضلة من الكتالوج لطلب عروض أسعار أو تجربتها لاحقًا.", "Save materials from the catalogue to request quotes or compare finishes.")}
            action={<Link to="/products"><Button size="sm" variant="outline">{tr("تصفح الكتالوج", "Browse catalogue")}</Button></Link>}
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14 }}>
            {savedItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AccountRequests() {
  const { locale, tr } = useTr();
  const { products } = useStore();
  const { mailbox, loading, error, refresh } = useLiveCustomerData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const requests = mailbox?.requests || [];
  const quotes = mailbox?.quotes || [];

  const filtered = useMemo(
    () =>
      requests.filter((r) => {
        if (statusFilter !== "all" && r.status.toLowerCase() !== statusFilter) return false;
        const q = query.trim().toLowerCase();
        if (!q) return true;
        const cat = products.find((p) => p.id === r.productId);
        return [r.reference, r.id, r.productTitle, cat?.name.ar || "", cat?.name.en || "", r.governorate]
          .join(" ")
          .toLowerCase()
          .includes(q);
      }),
    [requests, statusFilter, query, products]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="idea-dash-header">
        <div>
          <span className="idea-eyebrow">{tr("طلبات عروض الأسعار الخاصة", "PRIVATE QUOTATION REQUESTS")}</span>
          <h1>{tr("طلباتي وعروض الموردين", "My Quotations & RFQs")}</h1>
          <p>{tr("تابع طلباتك الفعلية وقارن عروض الموردين الموثقين بحرية كاملة.", "Track your submitted RFQs and compare confidential quotations from verified suppliers.")}</p>
        </div>
        <div className="idea-dash-actions">
          <Link to="/request-quote/new"><Button size="sm">{tr("طلب عرض سعر جديد", "New RFQ")}</Button></Link>
          <Button size="sm" variant="outline" disabled={loading} onClick={() => void refresh()}>
            <RefreshCw size={14} /> {tr("تحديث", "Refresh")}
          </Button>
        </div>
      </div>

      {error && <DashBanner tone="error">{describeDashboardError(error, locale)}</DashBanner>}

      <Panel>
        <div className="idea-dash-toolbar">
          <div style={{ position: "relative", flex: "1 1 220px" }}>
            <Search size={15} aria-hidden="true" style={{ position: "absolute", insetInlineStart: 12, top: "50%", transform: "translateY(-50%)", color: "var(--idea-text-muted)" }} />
            <input
              type="search"
              style={{ width: "100%", paddingInlineStart: 36 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr("بحث برقم الطلب أو المنتج أو المحافظة...", "Search reference, product, governorate...")}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label={tr("الحالة", "Status")}>
            <option value="all">{tr("كل الحالات", "All statuses")}</option>
            <option value="submitted">{tr("مُقدَّم", "Submitted")}</option>
            <option value="awaiting offers">{tr("بانتظار العروض", "Awaiting offers")}</option>
            <option value="offers received">{tr("وردت عروض", "Offers received")}</option>
            <option value="offer selected">{tr("تم اختيار عرض", "Offer selected")}</option>
          </select>
        </div>
      </Panel>

      {loading ? (
        <DashLoading count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={tr("لا توجد طلبات عروض أسعار بعد", "No quotation requests yet")}
          sub={tr("اختر أي منتج من الكتالوج وأرسل طلب عرض سعر خاص ليصلك من الموردين المعتمدين.", "Select any catalogue product and submit a private quotation request.")}
          action={<Link to="/products"><Button size="sm">{tr("تصفح المنتجات", "Browse products")}</Button></Link>}
        />
      ) : (
        <div className="idea-dash-table-wrap">
          <table className="idea-dash-table">
            <thead>
              <tr>
                <th>{tr("رقم الطلب", "Reference")}</th>
                <th>{tr("المنتج والمقاس", "Product & Variant")}</th>
                <th>{tr("الكمية والتسليم", "Qty & Region")}</th>
                <th>{tr("الموعد النهائي", "Deadline")}</th>
                <th>{tr("الحالة", "Status")}</th>
                <th>{tr("العروض", "Offers")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const product = products.find((p) => p.id === r.productId);
                const count = quotes.filter((q) => q.requestId === r.id).length || r.offersCount;
                return (
                  <tr key={r.id}>
                    <td style={{ fontFamily: "monospace" }}>{r.reference}</td>
                    <td>
                      <strong>{product?.name[locale] || r.productTitle}</strong>
                      <div style={{ fontSize: 12, color: "var(--idea-text-muted)" }}>{r.variantLabel || "—"}</div>
                    </td>
                    <td>
                      <div>{r.quantity.toLocaleString()} {r.unit}</div>
                      <div style={{ fontSize: 12, color: "var(--idea-text-muted)" }}>{r.governorate || "—"}</div>
                    </td>
                    <td>{r.deadlineAt ? new Date(r.deadlineAt).toLocaleDateString() : "—"}</td>
                    <td><StatusBadge text={r.status} tone={statusTone(r.status)} /></td>
                    <td>
                      <Link to={`/account/requests/${r.id}/offers`}>
                        <Button size="sm" variant={count > 0 ? "gold" : "outline"}>
                          {tr(`مقارنة (${count})`, `Compare (${count})`)}
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

export function AccountRequestOffers() {
  const { requestId } = useParams();
  const { locale, tr } = useTr();
  const { products } = useStore();
  const nav = useNavigate();
  const { mailbox, loading, error, refresh } = useLiveCustomerData();
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionOk, setActionOk] = useState("");

  const req = mailbox?.requests.find((r) => r.id === requestId) || null;
  const offers = useMemo(
    () => (mailbox?.quotes || []).filter((q) => q.requestId === requestId),
    [mailbox?.quotes, requestId]
  );

  const handleAccept = async (offer: LiveQuote) => {
    if (busyId) return;
    setBusyId(offer.id);
    setActionError("");
    setActionOk("");
    try {
      const result = await acceptLiveQuote(offer.id);
      setActionOk(tr("تم قبول عرض المورد وتثبيت اختيارك على الخادم.", "Supplier quotation accepted and confirmed on the server."));
      await refresh();
      if (result.order?.id) {
        nav(`/account/orders/${result.order.id}`);
      }
    } catch (err) {
      setActionError(describeDashboardError(err, locale));
    } finally {
      setBusyId("");
    }
  };

  const handleReject = async (offer: LiveQuote) => {
    if (busyId) return;
    setBusyId(offer.id);
    setActionError("");
    setActionOk("");
    try {
      await rejectLiveQuote(offer.id);
      setActionOk(tr("تم رفض العرض وتحديث حالته على الخادم.", "Quotation declined and updated on the server."));
      await refresh();
    } catch (err) {
      setActionError(describeDashboardError(err, locale));
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <DashLoading count={3} />;
  if (error) return <DashBanner tone="error">{describeDashboardError(error, locale)}</DashBanner>;
  if (!req) {
    return (
      <EmptyState
        title={tr("لم يتم العثور على طلب التسعير", "Quotation request not found")}
        action={<Link to="/account/requests"><Button size="sm" variant="outline">{tr("العودة لطلباتي", "Back to My RFQs")}</Button></Link>}
      />
    );
  }

  const product = products.find((p) => p.id === req.productId);
  const alreadyAccepted = Boolean(req.acceptedQuoteId || offers.some((o) => o.status === "accepted"));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <span className="idea-eyebrow">{req.reference}</span>
            <h1 className="idea-display" style={{ margin: "6px 0 4px", fontSize: 22 }}>
              {product?.name[locale] || req.productTitle} — {req.quantity.toLocaleString()} {req.unit}
            </h1>
            <div style={{ fontSize: 13.5, color: "var(--idea-text-muted)" }}>
              {[req.variantLabel, req.governorate, req.destination].filter(Boolean).join(" · ")}
            </div>
          </div>
          <StatusBadge text={req.status} tone={statusTone(req.status)} />
        </div>
      </Panel>

      <DashBanner tone="info">
        {tr(
          "لا يتم اختيار أرخص عرض تلقائيًا أبدًا. قارن بين السعر والضريبة والشحن ومدة التوصيل وشروط الدفع، واختر المورد الأنسب لك بحرية. جميع الأسعار سرية.",
          "IDEA never auto-selects the lowest price. Compare unit pricing, tax, shipping, delivery schedule, and payment terms to pick your preferred verified supplier. All quotations are private."
        )}
      </DashBanner>

      {actionError && <DashBanner tone="error">{actionError}</DashBanner>}
      {actionOk && <DashBanner tone="ok">{actionOk}</DashBanner>}

      {offers.length === 0 ? (
        <EmptyState
          title={tr("بانتظار عروض الموردين المعتمدين", "Awaiting verified supplier offers")}
          sub={tr("بمجرد تقديم أي مورد مطابق لعرض سعر خاص، سيظهر هنا للمقارنة التفصيلية.", "As soon as matched verified suppliers submit private quotations, they will appear here for comparison.")}
        />
      ) : (
        <div className="idea-dash-table-wrap" data-testid="customer-offer-comparison">
          <table className="idea-dash-table">
            <thead>
              <tr>
                <th>{tr("المورد", "Supplier")}</th>
                <th>{tr("المطابقة", "Product Match")}</th>
                <th>{tr("سعر الوحدة", "Unit Price")}</th>
                <th>{tr("الإجمالي الفرعي", "Subtotal")}</th>
                <th>{tr("الضريبة", "Tax")}</th>
                <th>{tr("الشحن", "Shipping")}</th>
                <th>{tr("الإجمالي النهائي", "Final Total")}</th>
                <th>{tr("التوصيل والدفع والصلاحية", "Delivery & Terms")}</th>
                <th>{tr("الحالة / القرار", "Decision")}</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => {
                const isAccepted = o.status === "accepted" || req.acceptedQuoteId === o.id;
                const canDecide = !alreadyAccepted && (o.status === "submitted" || o.status === "revised");
                return (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.supplierName}</strong>
                      <div style={{ marginTop: 4 }}>
                        <StatusBadge text={o.supplierVerified ? tr("موثّق", "Verified") : tr("قيد المراجعة", "Pending")} tone={o.supplierVerified ? "green" : "muted"} />
                      </div>
                    </td>
                    <td>
                      {o.exactProduct
                        ? tr("نفس المنتج", "Exact product")
                        : o.proposedEquivalent || tr("بديل مقترح", "Proposed equivalent")}
                    </td>
                    <td>
                      {formatEgp(o.unitPrice, locale)} / {o.unit}
                      <div style={{ fontSize: 11.5, color: "var(--idea-text-muted)" }}>× {o.quantity}</div>
                    </td>
                    <td>{formatEgp(o.subtotal, locale)}</td>
                    <td>
                      {formatEgp(o.taxAmount, locale)}
                      <div style={{ fontSize: 11, color: "var(--idea-text-muted)" }}>({o.taxPercent}%)</div>
                    </td>
                    <td>{formatEgp(o.shipping, locale)}</td>
                    <td>
                      <strong style={{ color: "var(--idea-gold-bright)", fontSize: 15 }}>
                        {formatEgp(o.total, locale)}
                      </strong>
                    </td>
                    <td>
                      <div>{o.deliveryDays} {tr("أيام توصيل", "delivery days")}</div>
                      <div style={{ fontSize: 11.5, color: "var(--idea-text-muted)" }}>{o.paymentTerms || "—"}</div>
                      <div style={{ fontSize: 11, color: "var(--idea-text-faint)" }}>
                        {o.expiresAt
                          ? `${tr("صالح حتى", "Valid until")} ${new Date(o.expiresAt).toLocaleDateString()}`
                          : o.validityDays
                          ? `${tr("صلاحية", "Valid")} ${o.validityDays}d`
                          : ""}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                        <StatusBadge text={o.status} tone={statusTone(o.status)} />
                        {canDecide && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <Button size="sm" disabled={Boolean(busyId)} onClick={() => void handleAccept(o)}>
                              <CheckCircle2 size={14} /> {tr("قبول", "Accept")}
                            </Button>
                            <Button size="sm" variant="ghost" disabled={Boolean(busyId)} onClick={() => void handleReject(o)}>
                              <XCircle size={14} /> {tr("رفض", "Reject")}
                            </Button>
                          </div>
                        )}
                        {isAccepted && (
                          <span style={{ fontSize: 11.5, color: "var(--idea-success)", fontWeight: 600 }}>
                            {tr("العرض المختار", "Selected offer")}
                          </span>
                        )}
                      </div>
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

export function AccountOrders() {
  const { locale, tr } = useTr();
  const { mailbox, loading, error, refresh } = useLiveCustomerData();
  const orders = mailbox?.orders || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="idea-dash-header">
        <div>
          <span className="idea-eyebrow">{tr("سجل الطلبات الرسمي", "SERVER-VERIFIED ORDERS")}</span>
          <h1>{tr("طلباتي", "My Orders")}</h1>
          <p>{tr("تُعرض حالة الطلب والدفع والشحن كما هي مؤكدة من خادم MySQL فقط.", "Order, payment, and delivery statuses reflect confirmed backend records only.")}</p>
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
          sub={tr("بعد قبول أحد عروض الموردين، سيظهر الطلب هنا بجميع تفاصيله.", "Once you accept a supplier quotation, your resulting order appears here.")}
        />
      ) : (
        <div className="idea-dash-table-wrap">
          <table className="idea-dash-table">
            <thead>
              <tr>
                <th>{tr("رقم الطلب", "Order ID")}</th>
                <th>{tr("المورد", "Supplier")}</th>
                <th>{tr("الإجمالي", "Total")}</th>
                <th>{tr("حالة الطلب", "Order Status")}</th>
                <th>{tr("حالة الدفع", "Payment Status")}</th>
                <th>{tr("التاريخ", "Date")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontFamily: "monospace" }}>{o.id}</td>
                  <td>{o.supplierName || "—"}</td>
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

export function AccountInvoices() {
  const { locale, tr } = useTr();
  const { mailbox, loading, error } = useLiveCustomerData();
  const paidOrders = (mailbox?.orders || []).filter((o) => o.paymentStatus.toLowerCase() === "paid");

  if (loading) return <DashLoading count={2} />;
  if (error) return <DashBanner tone="error">{describeDashboardError(error, locale)}</DashBanner>;
  if (paidOrders.length === 0) {
    return (
      <EmptyState
        title={tr("لا توجد فواتير مدفوعة بعد", "No confirmed invoices yet")}
        sub={tr("تصدر الفواتير فقط بعد تأكيد الدفع الفعلي على الخادم.", "Invoices are generated only after verified payment confirmation on the server.")}
      />
    );
  }
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {paidOrders.map((o) => (
        <Panel key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="idea-display" style={{ color: "var(--idea-text)" }}>INV-{o.id.slice(-8).toUpperCase()}</div>
            <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>
              {formatEgp(o.total, locale)} · {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <CreditCard size={14} /> {tr("طباعة", "Print")}
          </Button>
        </Panel>
      ))}
    </div>
  );
}

export function AccountInbox() {
  const { locale, tr } = useTr();
  const { mailbox, loading, error, refresh } = useLiveCustomerData();
  const msgs = mailbox?.notifications || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="idea-dash-header">
        <div>
          <span className="idea-eyebrow">{tr("التنبيهات والرسائل", "NOTIFICATIONS")}</span>
          <h1>{tr("صندوق الإشعارات", "Inbox & Notifications")}</h1>
        </div>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => void refresh()}>
          <RefreshCw size={14} /> {tr("تحديث", "Refresh")}
        </Button>
      </div>
      {error && <DashBanner tone="error">{describeDashboardError(error, locale)}</DashBanner>}
      {loading ? (
        <DashLoading count={2} />
      ) : msgs.length === 0 ? (
        <EmptyState
          title={tr("لا توجد إشعارات بعد", "No notifications yet")}
          sub={tr("تظهر هنا إشعارات عروض الأسعار وتحديثات الطلبات.", "Quotation alerts and server-confirmed order updates appear here.")}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m) => (
            <Panel key={m.id} style={{ borderInlineStart: m.read ? undefined : "3px solid var(--idea-gold)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div className="idea-display" style={{ color: "var(--idea-text)" }}>{m.title}</div>
                <span style={{ fontSize: 11.5, color: "var(--idea-text-faint)" }}>
                  {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
              <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginTop: 4 }}>{m.body}</div>
              {m.requestId && (
                <Link to={`/account/requests/${m.requestId}/offers`} style={{ color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-sm)", display: "inline-block", marginTop: 8 }}>
                  {tr("عرض ومقارنة العروض", "View & compare offers")} →
                </Link>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

export function AccountFavorites() {
  const { favorites, products } = useStore();
  const { tr } = useTr();
  const items = products.filter((p) => favorites.includes(p.id));
  if (!items.length) {
    return (
      <EmptyState
        title={tr("لا توجد منتجات محفوظة بعد", "No saved products yet")}
        sub={tr("استخدم زر الحفظ في بطاقة أي منتج للرجوع إليه سريعًا.", "Save materials from the catalogue to access them here.")}
        action={<Link to="/products"><Button size="sm" variant="outline">{tr("استكشف الكتالوج", "Explore catalogue")}</Button></Link>}
      />
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "var(--idea-space-4)" }}>
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function AccountCompare() {
  const { compare, products } = useStore();
  const { locale, tr } = useTr();
  const items = products.filter((p) => compare.includes(p.id));
  if (!items.length) {
    return (
      <EmptyState
        title={tr("لا توجد منتجات في المقارنة", "Nothing to compare")}
        sub={tr("أضف حتى 4 منتجات من الكتالوج للمقارنة الفنية.", "Add up to 4 catalogue products to compare specifications.")}
      />
    );
  }
  const rows: { label: string; get: (p: (typeof items)[number]) => string }[] = [
    { label: tr("الموديل", "Model"), get: (p) => p.model },
    { label: tr("المقاس", "Size"), get: (p) => p.sizes[0]?.label || "—" },
    { label: tr("التشطيب", "Finish"), get: (p) => p.finish || "—" },
    { label: tr("الألوان", "Color"), get: (p) => (p.colors || []).join(", ") || "—" },
    { label: tr("الاستخدام", "Usage"), get: (p) => (p.usage || []).join(", ") || "—" },
  ];
  return (
    <div className="idea-dash-table-wrap">
      <table className="idea-dash-table">
        <thead>
          <tr>
            <th />
            {items.map((p) => (
              <th key={p.id} style={{ color: "var(--idea-gold-bright)" }}>{p.name[locale]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td style={{ color: "var(--idea-text-muted)" }}>{r.label}</td>
              {items.map((p) => (
                <td key={p.id}>{r.get(p)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AccountRoomProjects() {
  const { session, db, api } = useBackend();
  const { tr } = useTr();
  const projects = db.roomProjects.filter((p) => p.userId === session?.id);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div className="idea-display" style={{ color: "var(--idea-text)" }}>{tr("مشاريع الغرف المحفوظة", "Saved room projects")}</div>
        <Link to="/room-designer/3d"><Button size="sm"><HomeIcon size={14} /> {tr("استوديو 3D", "3D Studio")}</Button></Link>
      </div>
      {!projects.length ? (
        <EmptyState
          title={tr("لا توجد مشاريع محفوظة", "No saved projects")}
          sub={tr("صمّم غرفتك في استوديو 3D بدون إنترنت أو جرّب مُعاين الذكاء الاصطناعي.", "Design a space in the 3D Room Studio or preview surfaces in AI Visualizer.")}
        />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {projects.map((p) => (
            <Panel key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="idea-display" style={{ color: "var(--idea-text)" }}>{p.name}</div>
                <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>
                  {p.surfaces.length} surfaces · {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => api.deleteRoomProject(p.id)}>{tr("حذف", "Delete")}</Button>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}

export function AccountNotifications() {
  return <AccountInbox />;
}

export function AccountSettings() {
  const { session, api } = useBackend();
  const { t } = useI18n();
  const { locale, tr } = useTr();
  const [name, setName] = useState(session?.name || "");
  const [phone, setPhone] = useState(session?.phone || "");
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setName(session?.name || "");
    setPhone(session?.phone || "");
  }, [session?.name, session?.phone]);

  const handleSave = async () => {
    if (saving) return;
    if (!name.trim()) {
      setIsError(true);
      setStatusMsg(tr("الاسم مطلوب.", "Name is required."));
      return;
    }
    setSaving(true);
    setStatusMsg("");
    setIsError(false);
    try {
      await api.updateProfile({ name: name.trim(), phone: phone.trim() });
      setStatusMsg(tr("تم حفظ بيانات حسابك على الخادم بنجاح.", "Account profile saved to the server."));
    } catch (err) {
      setIsError(true);
      setStatusMsg(describeDashboardError(err, locale));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="idea-dash-header">
        <div>
          <span className="idea-eyebrow">{tr("بيانات الحساب", "ACCOUNT PROFILE")}</span>
          <h1>{tr("الملف الشخصي والإعدادات", "Profile & Settings")}</h1>
        </div>
      </div>
      <Panel>
        <div className="idea-dash-form-grid">
          <Field label={t("acct.profile")}>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.currentTarget.value)} maxLength={120} />
          </Field>
          <Field label={t("auth.email")}>
            <input style={inputStyle} value={session?.email || ""} readOnly disabled />
          </Field>
          <Field label={t("auth.phone")}>
            <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.currentTarget.value)} maxLength={32} />
          </Field>
        </div>
        {statusMsg && (
          <div style={{ marginBottom: 12 }}>
            <DashBanner tone={isError ? "error" : "ok"}>{statusMsg}</DashBanner>
          </div>
        )}
        <Button size="sm" disabled={saving} onClick={() => void handleSave()}>
          {saving ? tr("جاري الحفظ...", "Saving...") : t("common.save")}
        </Button>
      </Panel>
      <DashBanner tone="info">
        {tr(
          "لطلبات حذف الحساب أو تصدير البيانات وفق قانون حماية البيانات، تواصل عبر صفحة التواصل أو راجع سياسة الخصوصية.",
          "For account deletion or data export requests, contact support or review our Privacy Policy."
        )}{" "}
        <Link to="/privacy" style={{ color: "var(--idea-gold-bright)", fontWeight: 600 }}>
          {tr("سياسة الخصوصية", "Privacy Policy")}
        </Link>
      </DashBanner>
    </div>
  );
}

export const _icons = { Inbox, Package, Heart, GitCompare, FileText };
