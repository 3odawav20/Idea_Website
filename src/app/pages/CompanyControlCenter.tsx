import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  Building2, Check, CircleAlert, Layers3, LockKeyhole, Package, PauseCircle,
  Play, Plus, RefreshCw, Search, ShieldCheck, Tag, UserMinus, UserPlus, Users, Wallet,
} from "lucide-react";
import { useBackend } from "../backend/db";
import { useI18n } from "../i18n/i18n";
import {
  describeDashboardError,
  fetchCompanyProducts,
  fetchCompanyStaff,
  fetchMarketplaceBootstrap,
  formatEgp,
  saveCompanyProduct,
  saveCompanyStaff,
  setAdminCompanyStatus,
  setAdminProductApproval,
  setCompanyProductActive,
  submitCompanyVerification,
  type MarketplaceCompany,
  type MarketplaceProduct,
  type MarketplaceStaffMember,
} from "../backend/dashboardApi";
import "./CompanyControlCenter.css";

const brandLabel = (s: string | null | undefined, ar: boolean) =>
  s?.trim() || (ar ? "براند غير محدد" : "Unspecified brand");

const CATEGORIES = [
  { id: "ceramic", ar: "سيراميك", en: "Ceramic" },
  { id: "porcelain", ar: "بورسلين", en: "Porcelain" },
  { id: "marble", ar: "رخام", en: "Marble" },
  { id: "granite", ar: "جرانيت", en: "Granite" },
  { id: "tile", ar: "بلاط", en: "Tile" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

export function CompanyControlCenter({ mode }: { mode: "admin" | "supplier" }) {
  const { session } = useBackend();
  const { locale } = useI18n();
  const ar = locale === "ar";
  const isAdmin = mode === "admin" && session?.role === "admin";

  const [companies, setCompanies] = useState<MarketplaceCompany[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [listings, setListings] = useState<MarketplaceProduct[]>([]);
  const [members, setMembers] = useState<MarketplaceStaffMember[]>([]);
  const [brand, setBrand] = useState("");
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Add product form (exact contract of server/cpanel/api/marketplace.php?action=product-save)
  const [productName, setProductName] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [productMaker, setProductMaker] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productCategory, setProductCategory] = useState<CategoryId>("porcelain");
  const [widthMm, setWidthMm] = useState("");
  const [heightMm, setHeightMm] = useState("");
  const [sizeLabel, setSizeLabel] = useState("");
  const [finish, setFinish] = useState("");
  const [color, setColor] = useState("");
  const [privatePriceEgp, setPrivatePriceEgp] = useState("");

  // Inline price editing & confirmation states (no window.confirm)
  const [editingPriceId, setEditingPriceId] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [confirmCompanyAction, setConfirmCompanyAction] = useState<"verified" | "suspended" | null>(null);

  const company = companies.find((x) => x.id === companyId);
  const canEdit = Boolean(
    isAdmin ||
      (company?.status === "verified" &&
        ["owner", "manager", "admin"].includes((company?.my_role || "owner").toLowerCase()))
  );
  const canTeam = Boolean(isAdmin || (company?.my_role || "owner").toLowerCase() === "owner");

  const loadCompanies = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const boot = await fetchMarketplaceBootstrap();
      const visible = boot.companies || [];
      setCompanies(visible);
      setCompanyId((prev) => (visible.some((x) => x.id === prev) ? prev : visible[0]?.id || ""));
    } catch (e) {
      setError(describeDashboardError(e, locale));
    } finally {
      setLoading(false);
    }
  }, [session?.id, isAdmin, locale]);

  const loadListings = useCallback(async () => {
    if (!companyId) {
      setListings([]);
      setMembers([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [products, staff] = await Promise.all([
        fetchCompanyProducts(companyId),
        fetchCompanyStaff(companyId).catch(() => [] as MarketplaceStaffMember[]),
      ]);
      setListings(products);
      setMembers(staff);
    } catch (e) {
      setError(describeDashboardError(e, locale));
    } finally {
      setLoading(false);
    }
  }, [companyId, locale]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  useEffect(() => {
    setBrand("");
    setFilter("");
    setConfirmCompanyAction(null);
  }, [companyId]);

  const brands = useMemo(
    () => [...new Set(listings.map((x) => brandLabel(x.brand, ar)))].sort(),
    [listings, ar]
  );

  const shown = useMemo(
    () =>
      listings.filter(
        (x) =>
          (!brand || brandLabel(x.brand, ar) === brand) &&
          (!filter ||
            [x.title, x.sku || "", x.brand || "", x.manufacturer || ""]
              .some((s) => s.toLowerCase().includes(filter.trim().toLowerCase())))
      ),
    [listings, brand, filter, ar]
  );

  const pricedCount = useMemo(
    () => listings.filter((x) => typeof x.private_price_cents === "number" && x.private_price_cents >= 0).length,
    [listings]
  );

  const run = async (work: () => Promise<void>, successMsg: string) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
      await loadListings();
      setNotice(successMsg);
    } catch (e) {
      setError(describeDashboardError(e, locale));
    } finally {
      setBusy(false);
    }
  };

  const updateCompanyStatus = async (status: "verified" | "suspended") => {
    if (!isAdmin || !company) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await setAdminCompanyStatus(company.id, status, true);
      setConfirmCompanyAction(null);
      await loadCompanies();
      setNotice(
        ar
          ? `تم تحديث حالة الشركة إلى ${status === "verified" ? "موثقة" : "موقوفة"} في MySQL.`
          : `Company status updated to ${status} in MySQL.`
      );
    } catch (e) {
      setError(describeDashboardError(e, locale));
    } finally {
      setBusy(false);
    }
  };

  const addProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!canEdit || !companyId) return;
    const w = Number(widthMm);
    const h = Number(heightMm);
    if (!Number.isInteger(w) || w < 50 || w > 3200 || !Number.isInteger(h) || h < 50 || h > 3200) {
      setError(
        ar
          ? "أدخل العرض والارتفاع بالملليمتر (أرقام صحيحة بين 50 و 3200 مم)."
          : "Enter width and height in millimeters (integers between 50 and 3200 mm)."
      );
      return;
    }
    const label = sizeLabel.trim() || `${Math.round(w / 10)}x${Math.round(h / 10)} cm`;
    const priceNum = privatePriceEgp.trim() === "" ? null : Number(privatePriceEgp);
    if (priceNum !== null && (!Number.isFinite(priceNum) || priceNum < 0)) {
      setError(ar ? "أدخل سعرًا خاصًا صحيحًا أو اتركه فارغًا." : "Enter a valid non-negative private price or leave blank.");
      return;
    }

    await run(async () => {
      await saveCompanyProduct({
        company_id: companyId,
        sku: productSku.trim(),
        title: productName.trim(),
        brand: productBrand.trim(),
        manufacturer: productMaker.trim() || productBrand.trim(),
        category: productCategory,
        width_mm: w,
        height_mm: h,
        size_label: label,
        finish: finish.trim() || undefined,
        color: color.trim() || undefined,
        price_cents: priceNum === null ? null : Math.round(priceNum * 100),
      });
      setProductName("");
      setProductBrand("");
      setProductMaker("");
      setProductSku("");
      setWidthMm("");
      setHeightMm("");
      setSizeLabel("");
      setFinish("");
      setColor("");
      setPrivatePriceEgp("");
    }, ar ? "تم حفظ المنتج في MySQL كمسودة بانتظار اعتماد الإدارة للعرض." : "Product saved in MySQL as a draft awaiting admin storefront approval.");
  };

  const toggleProduct = async (p: MarketplaceProduct) =>
    run(
      async () => {
        await setCompanyProductActive(companyId, p.id, !p.active);
      },
      ar ? "تم تحديث حالة تفعيل المنتج على الخادم." : "Product active state updated on server."
    );

  const approveListing = async (p: MarketplaceProduct) => {
    if (!isAdmin) return;
    await run(
      async () => {
        await setAdminProductApproval(p.id, !p.approved_for_storefront, "");
      },
      ar
        ? "تم تحديث قرار اعتماد العرض للكتالوج في MySQL."
        : "Storefront approval decision updated in MySQL."
    );
  };

  const savePrice = async (p: MarketplaceProduct) => {
    const value = Number(priceValue);
    if (priceValue.trim() === "" || !Number.isFinite(value) || value < 0) {
      setError(ar ? "أدخل سعرًا صحيحًا." : "Enter a valid non-negative price.");
      return;
    }
    const w = p.width_mm ?? 600;
    const h = p.height_mm ?? 600;
    const label = p.size_label || `${Math.round(w / 10)}x${Math.round(h / 10)} cm`;
    const category = (CATEGORIES.some((c) => c.id === p.category) ? p.category : "porcelain") as CategoryId;

    await run(async () => {
      await saveCompanyProduct({
        company_id: companyId,
        id: p.id,
        sku: p.sku || p.id.slice(0, 8),
        title: p.title,
        brand: p.brand || "Unbranded",
        manufacturer: p.manufacturer || p.brand || "Unbranded",
        category,
        width_mm: w,
        height_mm: h,
        size_label: label,
        finish: p.finish || undefined,
        color: p.color || undefined,
        image_url: p.image_url || undefined,
        price_cents: Math.round(value * 100),
      });
      setEditingPriceId("");
      setPriceValue("");
    }, ar ? "تم حفظ السعر الخاص بالشركة في MySQL؛ لا يظهر للزوار." : "Private company price saved in MySQL; hidden from storefront visitors.");
  };

  const invite = async (e: FormEvent) => {
    e.preventDefault();
    if (!canTeam || !inviteEmail.trim()) return;
    await run(async () => {
      await saveCompanyStaff(companyId, inviteEmail.trim(), true);
      setInviteEmail("");
    }, ar ? "تم تفويض مدير الشركة بنجاح." : "Company manager authorized.");
  };

  const toggleStaff = async (m: MarketplaceStaffMember, enable: boolean) =>
    run(
      async () => {
        await saveCompanyStaff(companyId, m.email, enable);
      },
      enable
        ? ar
          ? "تمت استعادة صلاحية العضو."
          : "Member access restored."
        : ar
        ? "تم سحب صلاحية العضو فورًا."
        : "Member access revoked."
    );

  if (!session || (mode === "supplier" && session.role !== "business") || (mode === "admin" && !isAdmin)) {
    return (
      <div role="alert" style={{ padding: 24 }}>
        {ar ? "هذه الصفحة تتطلب صلاحية الشركة أو مسؤول IDEA." : "This workspace requires a verified supplier or IDEA administrator session."}
      </div>
    );
  }

  return (
    <section className="icc-root" dir={ar ? "rtl" : "ltr"}>
      <header className="icc-top">
        <div>
          <span className="icc-eyebrow">
            <ShieldCheck size={16} /> IDEA · PHP/MYSQL COMPANY CONTROL
          </span>
          <h1>{isAdmin ? (ar ? "الشركات والبراندات والمنتجات" : "Companies, Brands & Products") : ar ? "إدارة منتجات شركتك" : "Company Product Catalogue"}</h1>
          <p>
            {ar
              ? "لكل شركة مساحتها الخاصة على قاعدة بيانات MySQL. الأسعار الخاصة محمية بصلاحيات الشركة والإدارة ولا تظهر لعملاء المتجر."
              : "Each company manages its own products, dimensions, and private pricing in MySQL. Private prices are never exposed to storefront visitors."}
          </p>
        </div>
        <button type="button" onClick={() => void loadCompanies()} disabled={loading || busy}>
          <RefreshCw size={16} /> {ar ? "تحديث" : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="icc-error" role="alert">
          <CircleAlert size={18} /> {error}
        </div>
      )}
      {notice && (
        <div className="icc-notice" role="status">
          <Check size={18} /> {notice}
        </div>
      )}

      <div className="icc-body">
        <aside className="icc-side">
          <div className="icc-side-heading">
            <Building2 size={17} /> {ar ? "الشركات" : "Companies"} <b>{companies.length}</b>
          </div>
          {companies.map((c) => (
            <button
              type="button"
              className={"icc-company" + (c.id === companyId ? " selected" : "")}
              key={c.id}
              onClick={() => setCompanyId(c.id)}
            >
              <span className="icc-logo">{(c.public_name || "C").slice(0, 1).toUpperCase()}</span>
              <span>
                <strong>{c.public_name}</strong>
                <small>
                  {c.status === "verified"
                    ? ar
                      ? "موثقة"
                      : "Verified"
                    : c.status === "suspended"
                    ? ar
                      ? "موقوفة"
                      : "Suspended"
                    : ar
                    ? "بانتظار الموافقة"
                    : c.status}
                </small>
              </span>
            </button>
          ))}
          {!companies.length && !loading && (
            <p>{ar ? "لم يتم العثور على شركات مسجلة بعد." : "No registered companies found."}</p>
          )}
          {!isAdmin && (
            <Link to="/business/verification">
              <Plus size={14} /> {ar ? "التحقق وتسجيل الشركة" : "Company verification"}
            </Link>
          )}
          <div className="icc-secret">
            <LockKeyhole size={16} />{" "}
            {ar
              ? "الأسعار محفوظة على خادم PHP/MySQL بصلاحيات الشركة والإدارة فقط."
              : "Prices are stored in PHP/MySQL and visible only to the company and IDEA administrators."}
          </div>
        </aside>

        <main className="icc-main">
          {!company ? (
            <div className="icc-empty">
              <Building2 size={28} />
              <b>{loading ? (ar ? "جاري تحميل الشركات…" : "Loading companies…") : ar ? "لا توجد شركة مختارة" : "No company selected"}</b>
              {!isAdmin && <Link to="/business/verification">{ar ? "إكمال ملف التوثيق" : "Complete verification"}</Link>}
            </div>
          ) : (
            <>
              <div className="icc-company-title">
                <span className="icc-logo large">{(company.public_name || "C").slice(0, 1)}</span>
                <div>
                  <span className="icc-eyebrow">COMPANY WORKSPACE</span>
                  <h2>{company.public_name}</h2>
                  <p>
                    {company.legal_name} ·{" "}
                    {company.status === "verified"
                      ? ar
                        ? "نشطة وموثقة"
                        : "Verified & active"
                      : company.status === "suspended"
                      ? ar
                        ? "موقوفة"
                        : "Suspended"
                      : ar
                      ? "تنتظر المراجعة"
                      : "Pending review"}
                  </p>
                </div>
                {isAdmin && (
                  <div className="icc-actions">
                    {company.status !== "verified" && (
                      <button type="button" disabled={busy} onClick={() => setConfirmCompanyAction("verified")}>
                        {ar ? "اعتماد الشركة" : "Approve company"}
                      </button>
                    )}
                    {company.status !== "suspended" && (
                      <button
                        type="button"
                        className="danger"
                        disabled={busy}
                        onClick={() => setConfirmCompanyAction("suspended")}
                      >
                        <PauseCircle size={15} /> {ar ? "إيقاف" : "Suspend"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isAdmin && confirmCompanyAction && (
                <div className="icc-warning" role="alert" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <span>
                    {confirmCompanyAction === "verified"
                      ? ar
                        ? `تأكيد اعتماد الشركة «${company.public_name}» بعد التحقق من مستنداتها؟`
                        : `Confirm approving "${company.public_name}" after verifying its submitted documents?`
                      : ar
                      ? `تأكيد إيقاف الشركة «${company.public_name}» ومنع ظهور منتجاتها مؤقتًا؟`
                      : `Confirm suspending "${company.public_name}"?`}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" disabled={busy} onClick={() => void updateCompanyStatus(confirmCompanyAction)}>
                      {ar ? "تأكيد التنفيذ" : "Confirm"}
                    </button>
                    <button type="button" disabled={busy} onClick={() => setConfirmCompanyAction(null)}>
                      {ar ? "إلغاء" : "Cancel"}
                    </button>
                  </div>
                </div>
              )}

              <div className="icc-stats">
                <div>
                  <Package />
                  <strong>{listings.length}</strong>
                  <small>{ar ? "منتجات" : "Products"}</small>
                </div>
                <div>
                  <Layers3 />
                  <strong>{brands.length}</strong>
                  <small>{ar ? "براندات" : "Brands"}</small>
                </div>
                <div>
                  <Wallet />
                  <strong>{pricedCount}</strong>
                  <small>{ar ? "أسعار خاصة" : "Private prices"}</small>
                </div>
                <div>
                  <Users />
                  <strong>{members.filter((x) => Boolean(x.active)).length}</strong>
                  <small>{ar ? "أعضاء نشطون" : "Active staff"}</small>
                </div>
              </div>

              {!canEdit && !isAdmin && (
                <div className="icc-warning">
                  {ar
                    ? "الشركة الموقوفة أو غير المعتمدة يمكنها عرض بياناتها، لكن لا يمكنها إضافة أو تعديل المنتجات إلا بعد اعتماد الإدارة."
                    : "Unverified or suspended companies can view records, but cannot publish or edit products until verified by IDEA."}
                </div>
              )}

              <div className="icc-section-title">
                <Tag size={17} />
                <h3>{ar ? "براندات الشركة" : "Company Brands"}</h3>
              </div>
              <div className="icc-brands">
                <button type="button" className={!brand ? "selected" : ""} onClick={() => setBrand("")}>
                  {ar ? "الكل" : "All"} <b>{listings.length}</b>
                </button>
                {brands.map((x) => (
                  <button type="button" className={brand === x ? "selected" : ""} key={x} onClick={() => setBrand(x)}>
                    {x} <b>{listings.filter((p) => brandLabel(p.brand, ar) === x).length}</b>
                  </button>
                ))}
                {!brands.length && (
                  <span>{ar ? "ستظهر البراندات تلقائيًا عند إضافة منتجات الشركة." : "Brands appear automatically once products are added."}</span>
                )}
              </div>

              <div className="icc-section-title icc-filter">
                <div>
                  <Package size={17} />
                  <h3>{ar ? "منتجات الشركة وأسعارها الخاصة" : "Company Products & Private Prices"}</h3>
                </div>
                <label>
                  <Search size={17} />
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder={ar ? "اسم البلاطة، الماركة أو كود المورد" : "Product title, brand, or SKU"}
                  />
                </label>
              </div>

              {canEdit && (
                <form className="icc-add" onSubmit={(e) => void addProduct(e)}>
                  <h4>
                    <Plus size={16} /> {ar ? "إضافة منتج إلى سجل الشركة" : "Add Product to Company"}
                  </h4>
                  <div className="icc-fields">
                    <label>
                      {ar ? "اسم المنتج *" : "Product title *"}
                      <input required minLength={2} value={productName} onChange={(e) => setProductName(e.target.value)} />
                    </label>
                    <label>
                      {ar ? "البراند *" : "Brand *"}
                      <input required minLength={2} value={productBrand} onChange={(e) => setProductBrand(e.target.value)} />
                    </label>
                    <label>
                      {ar ? "المصنع *" : "Manufacturer *"}
                      <input required minLength={2} value={productMaker} onChange={(e) => setProductMaker(e.target.value)} />
                    </label>
                    <label>
                      {ar ? "كود المورد (SKU) *" : "Supplier SKU *"}
                      <input required minLength={2} value={productSku} onChange={(e) => setProductSku(e.target.value)} />
                    </label>
                    <label>
                      {ar ? "الفئة *" : "Category *"}
                      <select value={productCategory} onChange={(e) => setProductCategory(e.target.value as CategoryId)}>
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {ar ? c.ar : c.en}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {ar ? "العرض (مم) *" : "Width (mm) *"}
                      <input
                        type="number"
                        min={50}
                        max={3200}
                        step={1}
                        required
                        value={widthMm}
                        onChange={(e) => setWidthMm(e.target.value)}
                        placeholder="600"
                      />
                    </label>
                    <label>
                      {ar ? "الارتفاع (مم) *" : "Height (mm) *"}
                      <input
                        type="number"
                        min={50}
                        max={3200}
                        step={1}
                        required
                        value={heightMm}
                        onChange={(e) => setHeightMm(e.target.value)}
                        placeholder="1200"
                      />
                    </label>
                    <label>
                      {ar ? "وصف المقاس *" : "Size label *"}
                      <input
                        required
                        value={sizeLabel}
                        onChange={(e) => setSizeLabel(e.target.value)}
                        placeholder="60x120 cm"
                      />
                    </label>
                    <label>
                      {ar ? "التشطيب (اختياري)" : "Finish (optional)"}
                      <input value={finish} onChange={(e) => setFinish(e.target.value)} placeholder="Matte / Glossy" />
                    </label>
                    <label>
                      {ar ? "اللون (اختياري)" : "Color (optional)"}
                      <input value={color} onChange={(e) => setColor(e.target.value)} />
                    </label>
                    <label>
                      {ar ? "السعر الخاص ج.م (اختياري)" : "Private price EGP (optional)"}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={privatePriceEgp}
                        onChange={(e) => setPrivatePriceEgp(e.target.value)}
                      />
                    </label>
                    <button type="submit" disabled={busy}>
                      {ar ? "حفظ المنتج كمسودة" : "Save draft product"}
                    </button>
                  </div>
                  <small>
                    {ar
                      ? "يتحقق الخادم من تطابق المقاسات بالملليمتر مع وصف المقاس. إضافة المنتج لا تنشره في المتجر العام قبل اعتماد إدارة IDEA."
                      : "Server verifies that millimeter dimensions match the size label. New products require admin approval before appearing publicly."}
                  </small>
                </form>
              )}

              <div className="icc-list">
                {shown.map((p) => {
                  const hasPrice = typeof p.private_price_cents === "number" && p.private_price_cents >= 0;
                  const priceEgp = hasPrice ? p.private_price_cents! / 100 : null;
                  return (
                    <article key={p.id} className="icc-product">
                      <div className="icc-product-head">
                        <div className="icc-product-icon">
                          <Layers3 size={23} />
                        </div>
                        <div className="icc-product-copy">
                          <small>
                            {brandLabel(p.brand, ar)}
                            {p.category ? ` · ${p.category}` : ""}
                            {p.size_label ? ` · ${p.size_label}` : ""}
                          </small>
                          <h4>{p.title}</h4>
                          <p>
                            {ar ? "كود المورد:" : "SKU:"} <code dir="ltr">{p.sku || "—"}</code> ·{" "}
                            {ar ? "مرجع IDEA:" : "Ref:"} <code dir="ltr">{p.id.slice(0, 8)}</code>
                          </p>
                          {p.manufacturer && (
                            <p>
                              {ar ? "المصنع:" : "Manufacturer:"} {p.manufacturer}
                            </p>
                          )}
                        </div>
                        <span className={"icc-badge " + (p.active ? "active" : "")}>
                          {p.active
                            ? p.approved_for_storefront
                              ? ar
                                ? "معتمد ونشط"
                                : "Approved & active"
                              : ar
                              ? "مفعّل داخليًا / بانتظار الجودة"
                              : "Pending QA"
                            : ar
                            ? "متوقف"
                            : "Inactive"}
                        </span>
                      </div>

                      <div className="icc-product-tools">
                        <span>
                          <LockKeyhole size={14} /> {ar ? "السعر الخاص:" : "Private price:"}{" "}
                          <b>{priceEgp === null ? (ar ? "لم يُحدد" : "Not set") : formatEgp(priceEgp, locale)}</b>
                        </span>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPriceId(p.id);
                              setPriceValue(priceEgp === null ? "" : String(priceEgp));
                            }}
                          >
                            {ar ? "تعديل السعر الخاص" : "Edit private price"}
                          </button>
                        )}
                        {canEdit && (
                          <button type="button" disabled={busy} onClick={() => void toggleProduct(p)}>
                            {p.active ? <PauseCircle size={15} /> : <Play size={15} />}{" "}
                            {p.active ? (ar ? "إيقاف المنتج" : "Deactivate") : ar ? "تفعيل المنتج" : "Activate"}
                          </button>
                        )}
                        {isAdmin && (
                          <button type="button" disabled={busy} onClick={() => void approveListing(p)}>
                            <ShieldCheck size={15} />{" "}
                            {p.approved_for_storefront
                              ? ar
                                ? "إلغاء اعتماد العرض"
                                : "Revoke approval"
                              : ar
                              ? "اعتماد للعرض في المتجر"
                              : "Approve for storefront"}
                          </button>
                        )}
                      </div>

                      {canEdit && editingPriceId === p.id && (
                        <form
                          className="icc-inline"
                          onSubmit={(e) => {
                            e.preventDefault();
                            void savePrice(p);
                          }}
                        >
                          <label>
                            {ar ? "السعر الخاص (EGP)" : "Private Price (EGP)"}
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              value={priceValue}
                              onChange={(e) => setPriceValue(e.target.value)}
                            />
                          </label>
                          <button type="submit" disabled={busy}>
                            {ar ? "حفظ" : "Save"}
                          </button>
                          <button type="button" onClick={() => setEditingPriceId("")}>
                            {ar ? "إلغاء" : "Cancel"}
                          </button>
                        </form>
                      )}
                    </article>
                  );
                })}
                {!shown.length && (
                  <div className="icc-empty">
                    <Package size={25} />
                    <b>{ar ? "لا توجد منتجات مطابقة حاليًا" : "No matching products yet"}</b>
                  </div>
                )}
              </div>

              <div className="icc-section-title">
                <Users size={17} />
                <h3>{ar ? "مديرو الشركة والمفوّضون" : "Company Managers & Staff"}</h3>
              </div>
              <section className="icc-team">
                {canTeam && company.status === "verified" && (
                  <form className="icc-inline" onSubmit={(e) => void invite(e)}>
                    <label>
                      {ar ? "بريد مدير لديه حساب IDEA" : "Email of existing IDEA user"}
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="manager@company.com"
                      />
                    </label>
                    <button type="submit" disabled={busy}>
                      <UserPlus size={15} /> {ar ? "تفويض مدير" : "Authorize manager"}
                    </button>
                  </form>
                )}
                {members.map((m) => {
                  const isActive = Boolean(m.active);
                  return (
                    <div className="icc-member" key={m.user_id}>
                      <Users size={17} />
                      <span>
                        <strong>
                          {m.name || m.email} ·{" "}
                          {m.role === "owner"
                            ? ar
                              ? "صاحب الشركة"
                              : "Owner"
                            : ar
                            ? "مدير مفوّض"
                            : "Manager"}
                        </strong>
                        <small dir="ltr">{m.email}</small>
                      </span>
                      <i>{isActive ? (ar ? "نشط" : "Active") : ar ? "موقوف" : "Revoked"}</i>
                      {canTeam && m.role !== "owner" && (
                        <button type="button" disabled={busy} onClick={() => void toggleStaff(m, !isActive)}>
                          {isActive ? <UserMinus size={15} /> : <UserPlus size={15} />}{" "}
                          {isActive ? (ar ? "إلغاء الصلاحية" : "Revoke") : ar ? "استعادة الصلاحية" : "Restore"}
                        </button>
                      )}
                    </div>
                  );
                })}
                {!members.length && (
                  <p style={{ color: "var(--idea-text-muted)", fontSize: 13 }}>
                    {ar ? "لا يوجد مفوضون إضافيون مسجلون بعد." : "No additional staff members registered."}
                  </p>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </section>
  );
}

export function CompanyApplication() {
  const { session } = useBackend();
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [legal, setLegal] = useState("");
  const [name, setName] = useState("");
  const [representative, setRepresentative] = useState("");
  const [email, setEmail] = useState(session?.email || "");
  const [phone, setPhone] = useState(session?.phone || "");
  const [governorate, setGovernorate] = useState("Cairo");
  const [companyType, setCompanyType] = useState("Distributor");
  const [crNumber, setCrNumber] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const record = await submitCompanyVerification({
        legalName: legal.trim(),
        publicName: name.trim(),
        representative: representative.trim(),
        email: email.trim(),
        phone: phone.trim(),
        governorate,
        companyType,
        crNumber: crNumber.trim(),
        taxNumber: taxNumber.trim(),
        categories: ["Porcelain", "Ceramics"],
        serviceAreas: [governorate],
      });
      setMessage(
        ar
          ? `تم تسجيل بيانات الشركة (${record.publicName || name}). يرجى رفع السجل التجاري والبطاقة الضريبية في صفحة التوثيق ليتمكن الأدمن من الاعتماد.`
          : `Company application recorded (${record.publicName || name}). Upload your Commercial Register and Tax Card in the Verification page for admin review.`
      );
    } catch (x) {
      setError(describeDashboardError(x, locale));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="icc-apply" dir={ar ? "rtl" : "ltr"}>
      <div className="icc-apply-card">
        <span className="icc-eyebrow">
          <ShieldCheck size={16} /> COMPANY ONBOARDING · PHP/MYSQL
        </span>
        <h1>{ar ? "إضافة شركتك إلى IDEA" : "Register Your Company on IDEA"}</h1>
        <p>
          {ar
            ? "تقديم طلب الشركة لا يمنح صلاحيات أدمن أو ينشر منتجات تلقائيًا؛ يتطلب رفع المستندات الرسمية واعتماد إدارة IDEA."
            : "Submitting a company application does not auto-verify your account or publish products. Supporting legal documents and admin approval are required."}
        </p>
        {!session ? (
          <p>
            {ar ? "سجّل دخولك أولًا: " : "Sign in first: "}
            <Link to="/register/business">{ar ? "إنشاء حساب شركة" : "Create business account"}</Link>{" "}
            {ar ? "أو " : "or "}
            <Link to="/business/login">{ar ? "تسجيل الدخول" : "Sign in"}</Link>.
          </p>
        ) : (
          <form onSubmit={(e) => void submit(e)}>
            <label>
              {ar ? "الاسم القانوني المسجل *" : "Registered Legal Name *"}
              <input required minLength={2} maxLength={160} value={legal} onChange={(e) => setLegal(e.target.value)} />
            </label>
            <label>
              {ar ? "الاسم التجاري الظاهر *" : "Public Trade Name *"}
              <input required minLength={2} maxLength={160} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              {ar ? "المفوّض بالتوقيع *" : "Authorized Representative *"}
              <input required minLength={2} value={representative} onChange={(e) => setRepresentative(e.target.value)} />
            </label>
            <label>
              {ar ? "بريد الشركة الرسمي *" : "Official Company Email *"}
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              {ar ? "هاتف الشركة *" : "Business Phone *"}
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label>
              {ar ? "المحافظة" : "Governorate"}
              <input value={governorate} onChange={(e) => setGovernorate(e.target.value)} />
            </label>
            <label>
              {ar ? "نوع النشاط" : "Business Type"}
              <select value={companyType} onChange={(e) => setCompanyType(e.target.value)}>
                <option value="Manufacturer">{ar ? "مصنع" : "Manufacturer"}</option>
                <option value="Distributor">{ar ? "موزع معتمد" : "Authorized Distributor"}</option>
                <option value="Showroom">{ar ? "معرض" : "Showroom"}</option>
                <option value="Importer">{ar ? "مستورد" : "Importer"}</option>
              </select>
            </label>
            <label>
              {ar ? "رقم السجل التجاري *" : "Commercial Register # *"}
              <input required value={crNumber} onChange={(e) => setCrNumber(e.target.value)} />
            </label>
            <label>
              {ar ? "رقم البطاقة الضريبية *" : "Tax Registration # *"}
              <input required value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? (ar ? "جاري الإرسال…" : "Submitting…") : ar ? "تقديم طلب الانضمام" : "Submit Company Application"}
            </button>
          </form>
        )}
        {error && (
          <div className="icc-error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="icc-notice" role="status">
            {message}{" "}
            <Link to="/business/verification" style={{ textDecoration: "underline", marginInlineStart: 6 }}>
              {ar ? "انتقل لرفع المستندات" : "Upload verification documents"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
