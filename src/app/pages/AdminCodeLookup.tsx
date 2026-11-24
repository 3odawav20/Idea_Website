import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { LockKeyhole, Search, Tag } from "lucide-react";
import { useBackend } from "../backend/db";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { ideaInternalCode } from "../data/ideaProductIdentity";
import { describeDashboardError, formatEgp, searchMarketplaceCatalogue } from "../backend/dashboardApi";
import type { Product } from "../data/types";
import "./BusinessGrowth.css";

type Row = {
  id: string;
  name: string;
  brand: string;
  sku: string;
  maker: string;
  company: string;
  source: string;
  price: number | null;
  url: string;
};

export function AdminCodeLookup() {
  const { session } = useBackend();
  const { locale } = useI18n();
  const ar = locale === "ar";
  const { products } = useStore();
  const [code, setCode] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (session?.role !== "admin" || !code.trim()) return;
    setBusy(true);
    setError("");
    setSearched(true);
    const q = code.trim().toLowerCase();
    try {
      const localMatches = products
        .filter(
          (p) =>
            [p.id, p.code || "", ideaInternalCode(p), p.model, p.brand, p.manufacturer || ""].some((t) =>
              t.toLowerCase().includes(q)
            ) || p.name.en.toLowerCase().includes(q)
        )
        .slice(0, 45);

      let serverRows: Row[] = [];
      try {
        const res = await searchMarketplaceCatalogue(code.trim());
        const combined = [...res.products, ...res.similar];
        serverRows = combined.map((p) => ({
          id: p.id,
          name: p.title,
          brand: p.brand || (ar ? "غير معروف" : "Unknown"),
          sku: p.sku || "—",
          maker: p.manufacturer || (ar ? "غير محدد" : "Unspecified"),
          company: p.company_name || (ar ? "شركة مسجلة" : "Registered company"),
          source: ar ? "سجل الشركات (MySQL)" : "Company listing (MySQL)",
          price: typeof p.private_price_cents === "number" ? p.private_price_cents / 100 : null,
          url: "/admin/companies",
        }));
      } catch (serverErr) {
        // Still show local storefront catalogue matches even if preview host lacks PHP/MySQL.
        setError(describeDashboardError(serverErr, locale));
      }

      setRows([
        ...localMatches.map(
          (p: Product): Row => ({
            id: p.id,
            name: p.name.en,
            brand: p.brand,
            sku: p.code || ideaInternalCode(p),
            maker: p.manufacturer || (ar ? "المصنع غير موثق" : "Unverified manufacturer"),
            company: p.source?.provider || (ar ? "مصدر الكتالوج" : "Catalogue source"),
            source: ar ? "المكتبة الرئيسية" : "Storefront catalogue",
            price: null,
            url: "/product/" + p.slug,
          })
        ),
        ...serverRows,
      ]);
    } finally {
      setBusy(false);
    }
  };

  if (session?.role !== "admin") return null;

  return (
    <section className="ibg-root" dir={ar ? "rtl" : "ltr"}>
      <header className="ibg-head">
        <span className="ibg-kicker">
          <Search size={18} /> ADMIN PRODUCT LOOKUP · PHP/MYSQL
        </span>
        <h1>{ar ? "البحث بالكود أو البراند أو اسم المنتج" : "Lookup by Code, SKU, or Brand"}</h1>
        <p>
          {ar
            ? "بحث خاص بالأدمن في الكتالوج الرئيسي وسجل شركات PHP/MySQL، يعرض الأسعار المحمية والتفاصيل الأصلية دون كشفها للزوار."
            : "Administrator-only search across the storefront catalogue and PHP/MySQL company listings, including private supplier pricing."}
        </p>
      </header>
      <form className="ibg-form" onSubmit={(e) => void search(e)}>
        <label>
          {ar ? "كود المنتج أو اسم البراند أو SKU" : "Product code, SKU, or brand"}
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="IDEA-REF-… / Supplier SKU / Brand"
          />
        </label>
        <button type="submit" disabled={busy}>
          <Search size={16} /> {busy ? (ar ? "جاري البحث…" : "Searching…") : ar ? "ابحث بالكود" : "Lookup"}
        </button>
      </form>
      {error && (
        <p className="ibg-error" role="alert">
          {error}
        </p>
      )}
      <div className="ibg-list">
        {rows.map((item, i) => (
          <div className="ibg-row" key={`${item.source}-${item.id}-${i}`}>
            <span>
              <strong>{item.name}</strong>
              <small>
                {ar ? "البراند:" : "Brand:"} {item.brand} · {ar ? "المصنع:" : "Maker:"} {item.maker}
              </small>
              <small>
                {ar ? "الشركة/المصدر:" : "Company/Source:"} {item.company} · {item.source}
              </small>
              <small dir="ltr">SKU: {item.sku}</small>
            </span>
            <b>
              <LockKeyhole size={14} />{" "}
              {ar ? "السعر الخاص:" : "Private price:"}{" "}
              {item.price === null ? (ar ? "غير مسجل" : "Not set") : formatEgp(item.price, locale)}
            </b>
            <Link to={item.url}>
              <Tag size={15} /> {ar ? "التفاصيل" : "Inspect"}
            </Link>
          </div>
        ))}
        {!rows.length && !error && (
          <p>
            {searched
              ? ar
                ? "لا توجد نتائج مطابقة لهذا الكود."
                : "No matching records found for that code."
              : ar
              ? "أدخل الكود المطلوب للبحث."
              : "Enter a product code, SKU, or brand to search."}
          </p>
        )}
      </div>
    </section>
  );
}
