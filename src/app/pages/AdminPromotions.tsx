import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { CircleAlert, ExternalLink, LockKeyhole, RefreshCw } from "lucide-react";
import { useBackend } from "../backend/db";
import { useI18n } from "../i18n/i18n";
import {
  describeDashboardError,
  fetchCompanyProducts,
  fetchMarketplaceBootstrap,
  formatEgp,
  type MarketplaceCompany,
  type MarketplaceProduct,
} from "../backend/dashboardApi";
import "./AdminStudio.css";
import "./AdminPromotions.css";

interface PrivatePriceRow {
  companyName: string;
  product: MarketplaceProduct;
}

export function AdminPromotions() {
  const { session } = useBackend();
  const { locale } = useI18n();
  const ar = locale === "ar";

  const [companies, setCompanies] = useState<MarketplaceCompany[]>([]);
  const [rows, setRows] = useState<PrivatePriceRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const boot = await fetchMarketplaceBootstrap();
      const cos = boot.companies || [];
      setCompanies(cos);
      const sampled = cos.slice(0, 15);
      const productLists = await Promise.all(
        sampled.map(async (c) => {
          const items = await fetchCompanyProducts(c.id).catch(() => [] as MarketplaceProduct[]);
          return items
            .filter((p) => typeof p.private_price_cents === "number" && p.private_price_cents >= 0)
            .map((product) => ({ companyName: c.public_name, product }));
        })
      );
      setRows(productLists.flat());
      setState("ready");
    } catch (e) {
      setState("unavailable");
      setError(describeDashboardError(e, locale));
    }
  }, [locale]);

  useEffect(() => {
    if (session?.role === "admin") void refresh();
  }, [session?.role, refresh]);

  if (session?.role !== "admin") {
    return (
      <div className="ids-denied">
        <LockKeyhole size={28} />
        <h2>{ar ? "للمسؤولين فقط" : "Administrator access only"}</h2>
        <p>
          {ar
            ? "الأسعار الخاصة بالموردين محمية بصلاحيات الخادم ولا يمكن قراءتها بدون جلسة أدمن معتمدة."
            : "Private supplier prices cannot be read without an authenticated administrator session."}
        </p>
      </div>
    );
  }

  return (
    <section className="idea-admin-promos" dir={ar ? "rtl" : "ltr"}>
      <div className="ids-heading">
        <div>
          <span className="ids-kicker">PRIVATE FINANCIAL REVIEW · PHP/MYSQL</span>
          <h2>{ar ? "أسعار الموردين الخاصة والعروض" : "Private Supplier Prices & Offers"}</h2>
          <p>
            {ar
              ? "مراجعة الأسعار الخاصة المخزّنة في قاعدة بيانات MySQL (/api/marketplace.php). هذه الأسعار لا تظهر أبدًا على واجهة المتجر العامة."
              : "Inspect private supplier pricing stored in MySQL (/api/marketplace.php). These figures are never exposed on the public storefront."}
          </p>
        </div>
        <button
          type="button"
          className="ids-action-outline"
          onClick={() => void refresh()}
          disabled={state === "loading"}
        >
          <RefreshCw size={15} /> {ar ? "تحديث" : "Refresh"}
        </button>
      </div>

      <div className="ids-notice">
        <LockKeyhole size={18} />
        <span>
          {ar
            ? "حماية الأسعار تتم على خادم PHP/MySQL عبر صلاحيات الجلسة و CSRF. لإضافة أو تعديل سعر منتج خاص بشركة، استخدم شاشة الشركات والمنتجات."
            : "Pricing privacy is enforced server-side in PHP/MySQL. To update a company's private product price, use Companies & Products."}
        </span>
      </div>

      {state === "unavailable" && (
        <div className="ids-notice" role="alert">
          <CircleAlert size={18} /> {error}
        </div>
      )}

      {state === "loading" && (
        <p aria-live="polite">{ar ? "جاري فحص الأسعار الخاصة من MySQL…" : "Loading protected supplier prices from MySQL…"}</p>
      )}

      <div className="ids-panel ids-table-panel">
        <div className="ids-panel-head ids-flags-head">
          <div>
            <span className="ids-kicker">ADMIN-ONLY REGISTER</span>
            <h3>
              {ar ? `الأسعار الخاصة المسجلة (${rows.length})` : `Private Supplier Prices (${rows.length})`}
            </h3>
          </div>
          <Link to="/admin/companies" className="ids-action-outline">
            {ar ? `إدارة الشركات (${companies.length})` : `Manage Companies (${companies.length})`} <ExternalLink size={14} />
          </Link>
        </div>
        <div className="ids-table-scroll">
          <table className="ids-table">
            <thead>
              <tr>
                <th>{ar ? "الشركة" : "COMPANY"}</th>
                <th>{ar ? "المنتج / SKU" : "PRODUCT / SKU"}</th>
                <th>{ar ? "المقاس" : "SIZE"}</th>
                <th>{ar ? "السعر الخاص" : "PRIVATE PRICE"}</th>
                <th>{ar ? "حالة العرض" : "STOREFRONT"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ companyName, product }) => (
                <tr key={product.id}>
                  <td>
                    <strong>{companyName}</strong>
                  </td>
                  <td>
                    <strong>{product.title}</strong>
                    <div style={{ fontSize: 12, opacity: 0.7 }} dir="ltr">
                      {product.sku}
                    </div>
                  </td>
                  <td>{product.size_label || "—"}</td>
                  <td>
                    <strong>
                      {formatEgp((product.private_price_cents || 0) / 100, locale)}
                    </strong>
                  </td>
                  <td>
                    <span className="ids-table-tag">
                      {product.approved_for_storefront
                        ? ar
                          ? "معتمد"
                          : "Approved"
                        : ar
                        ? "مسودة"
                        : "Draft"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && state === "ready" && (
            <p className="ids-empty">
              {ar
                ? "لا توجد أسعار خاصة مسجلة حاليًا في MySQL. لا يتم اختلاق أسعار من سجلات غير موثقة."
                : "No private supplier prices stored in MySQL yet. Prices are never fabricated from unverified records."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
