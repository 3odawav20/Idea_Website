import { getPhpSession, PHP_ACCOUNT_API, PHP_PLATFORM_API, type PhpSession } from "./phpAccounts";

export const PHP_MARKETPLACE_API = "/api/marketplace.php";

export class DashboardApiError extends Error {
  status: number;
  code: string;

  constructor(code: string, status = 500, detail?: string) {
    super(detail || code);
    this.name = "DashboardApiError";
    this.status = status;
    this.code = code;
  }
}

export interface LiveRfq {
  id: string;
  reference: string;
  customerId: string;
  customerName?: string;
  productId: string;
  productTitle: string;
  category?: string;
  variantLabel: string;
  quantity: number;
  unit: string;
  governorate: string;
  destination: string;
  deliveryDate: string;
  projectType: string;
  phased: boolean;
  notes: string;
  status: string;
  createdAt: number;
  deadlineAt: number;
  offersCount: number;
  acceptedQuoteId: string | null;
  supplierResponseStatus?: string;
}

export interface LiveQuote {
  id: string;
  requestId: string;
  companyId: string;
  supplierName: string;
  supplierVerified: boolean;
  exactProduct: boolean;
  proposedEquivalent?: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  shipping: number;
  total: number;
  currency: string;
  prepDays: number;
  deliveryDays: number;
  validityDays: number;
  expiresAt: number | null;
  paymentTerms: string;
  availability: string;
  notes: string;
  status: "submitted" | "accepted" | "rejected" | "not-selected" | "expired" | "revised";
  revision: number;
  createdAt: number;
  updatedAt: number;
}

export interface LiveOrder {
  id: string;
  requestId: string;
  quoteId: string;
  customerId: string;
  companyId: string;
  supplierName?: string;
  customerName?: string;
  total: number;
  currency: string;
  status: string;
  paymentStatus: string;
  shippingStatus?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface LiveNotification {
  id: string;
  title: string;
  body: string;
  kind: string;
  requestId?: string;
  orderId?: string;
  read: boolean;
  createdAt: number;
}

export interface LiveMailbox {
  role: "buyer" | "supplier" | "admin" | string;
  requests: LiveRfq[];
  quotes: LiveQuote[];
  orders: LiveOrder[];
  notifications: LiveNotification[];
}

export interface LiveAiQuota {
  role: string;
  eligible: boolean;
  unlimited: boolean;
  used: number | null;
  limit: number | null;
  remaining: number | null;
  provider?: string;
  configured?: boolean;
  status?: string;
}

export interface VerificationDocument {
  id: string;
  kind: string;
  filename: string;
  uploadedAt: number | null;
  status: string;
  reviewNote?: string;
}

export interface CompanyVerificationRecord {
  companyId: string;
  legalName: string;
  publicName: string;
  representative: string;
  email: string;
  phone: string;
  governorate: string;
  companyType: string;
  crNumber: string;
  taxNumber: string;
  categories: string[];
  serviceAreas: string[];
  status: string;
  reviewNotes: string;
  submittedAt: number | null;
  reviewedAt: number | null;
  documents: VerificationDocument[];
}

export interface MarketplaceCompany {
  id: string;
  public_name: string;
  legal_name: string;
  email: string;
  status: string;
  owner_id: string;
  owner_name?: string;
  created_at: number | string;
  my_role?: string;
  products?: number;
}

export interface MarketplaceProduct {
  id: string;
  company_id: string;
  sku: string;
  title: string;
  active: boolean;
  catalog_product_id?: string | null;
  product_key?: string | null;
  company_name?: string;
  company_status?: string;
  brand?: string | null;
  manufacturer?: string | null;
  category?: string | null;
  size_label?: string | null;
  width_mm?: number | null;
  height_mm?: number | null;
  finish?: string | null;
  color?: string | null;
  image_url?: string | null;
  private_price_cents?: number | null;
  currency?: string | null;
  approved_for_storefront: boolean;
  admin_notes?: string | null;
}

export interface MarketplaceStaffMember {
  user_id: string;
  role: string;
  active: boolean | number;
  name: string;
  email: string;
}

export interface MarketplaceAnnouncement {
  id: string;
  text_ar: string;
  text_en: string;
  link_path: string | null;
  state: "draft" | "published" | "archived";
  start_at?: number | null;
  end_at?: number | null;
  updated_at?: number | null;
}

export interface MarketplaceAdPackage {
  id: string;
  title_ar?: string;
  title_en?: string;
  placement?: string;
  price_cents: number;
  duration_days: number;
  is_published: boolean | number;
}

export interface MarketplaceAdRequest {
  id: string;
  company_id: string;
  public_name?: string;
  package_id: string;
  title: string;
  message: string;
  media_kind: "image" | "video";
  state: "pending" | "needs_revision" | "approved" | "rejected";
  admin_notes?: string | null;
  created_at: number | string;
}

export interface MarketplaceSalesReport {
  month: string;
  timezone: string;
  basis: string;
  caveat: string;
  rows: Array<{
    company_id: string;
    public_name: string;
    orders_count: number;
    gross_cents: number;
    net_confirmed_cents: number;
    refund_accounting?: string;
  }>;
}

export interface MarketplaceBootstrap {
  user: { id: string; name: string; role: string };
  csrf: string;
  role: string;
  companies: MarketplaceCompany[];
  announcements: MarketplaceAnnouncement[];
  packages: MarketplaceAdPackage[];
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: number;
}

export interface AdminAuditItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: number;
}

export interface AdminOverviewData {
  counts: {
    users: number;
    companies: number;
    verifiedCompanies: number;
    pendingCompanies: number;
    requests: number;
    quotes: number;
    orders: number;
    products: number;
  };
  users: AdminUserSummary[];
  companies: MarketplaceCompany[];
  requests: LiveRfq[];
  quotes: LiveQuote[];
  orders: LiveOrder[];
  audit: AdminAuditItem[];
}

export interface SupplierQuoteDraft {
  unitPrice: string;
  quantity: string;
  shipping: string;
  taxPercent: string;
  prepDays: string;
  deliveryDays: string;
  validityDays: string;
  paymentTerms: string;
  exactProduct: boolean;
  proposedEquivalent: string;
  availability: string;
  notes: string;
  signerName: string;
}

export const EMPTY_SUPPLIER_QUOTE_DRAFT: SupplierQuoteDraft = {
  unitPrice: "",
  quantity: "",
  shipping: "",
  taxPercent: "",
  prepDays: "",
  deliveryDays: "",
  validityDays: "",
  paymentTerms: "",
  exactProduct: true,
  proposedEquivalent: "",
  availability: "",
  notes: "",
  signerName: "",
};

/* --------------------------------------------------------------------------
 * Pure calculation, validation & normalization helpers (unit-testable)
 * -------------------------------------------------------------------------- */

function toNum(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toTimestamp(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1e11 ? value : value * 1000;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const asNum = Number(value);
    if (Number.isFinite(asNum)) return asNum > 1e11 ? asNum : asNum * 1000;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toStr(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : value == null ? fallback : String(value).trim();
}

export function computeQuoteBreakdown(input: {
  unitPrice: number;
  quantity: number;
  taxPercent: number;
  shipping: number;
}): { subtotal: number; taxAmount: number; shipping: number; total: number } {
  const unitPrice = Math.max(0, Number.isFinite(input.unitPrice) ? input.unitPrice : 0);
  const quantity = Math.max(0, Number.isFinite(input.quantity) ? input.quantity : 0);
  const taxPercent = Math.max(0, Number.isFinite(input.taxPercent) ? input.taxPercent : 0);
  const shipping = Math.max(0, Number.isFinite(input.shipping) ? input.shipping : 0);
  const subtotal = Math.round(unitPrice * quantity * 100) / 100;
  const taxAmount = Math.round(subtotal * (taxPercent / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount + shipping) * 100) / 100;
  return { subtotal, taxAmount, shipping, total };
}

export function validateSupplierQuoteInput(
  draft: SupplierQuoteDraft,
  locale: "ar" | "en" | "fr" = "en"
): string | null {
  const tr = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const unitPrice = Number(draft.unitPrice);
  const quantity = Number(draft.quantity);
  const shipping = Number(draft.shipping);
  const taxPercent = Number(draft.taxPercent);
  const deliveryDays = Number(draft.deliveryDays);
  const validityDays = Number(draft.validityDays);

  if (draft.unitPrice.trim() === "" || !Number.isFinite(unitPrice) || unitPrice <= 0) {
    return tr("أدخل سعر الوحدة الفعلي (أكبر من صفر).", "Enter an actual positive unit price.");
  }
  if (draft.quantity.trim() === "" || !Number.isFinite(quantity) || quantity <= 0) {
    return tr("أدخل الكمية الفعلية المعروضة (أكبر من صفر).", "Enter a valid offered quantity greater than zero.");
  }
  if (draft.shipping.trim() === "" || !Number.isFinite(shipping) || shipping < 0) {
    return tr("أدخل تكلفة الشحن الفعلية (0 إذا كان الشحن مجانيًا).", "Enter the actual shipping cost (enter 0 if included).");
  }
  if (draft.taxPercent.trim() === "" || !Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
    return tr("أدخل نسبة الضريبة الفعلية بين 0% و 100%.", "Enter the actual tax percentage between 0% and 100%.");
  }
  if (draft.deliveryDays.trim() === "" || !Number.isInteger(deliveryDays) || deliveryDays < 1 || deliveryDays > 365) {
    return tr("أدخل مدة التوصيل بالأيام (من 1 إلى 365 يومًا).", "Enter estimated delivery days (1 to 365).");
  }
  if (draft.validityDays.trim() === "" || !Number.isInteger(validityDays) || validityDays < 1 || validityDays > 90) {
    return tr("أدخل مدة صلاحية العرض بالأيام (من 1 إلى 90 يومًا).", "Enter quote validity in days (1 to 90).");
  }
  if (!draft.paymentTerms.trim() || draft.paymentTerms.trim().length < 3) {
    return tr("أدخل شروط الدفع بوضوح.", "Specify the actual payment terms.");
  }
  if (!draft.exactProduct && !draft.proposedEquivalent.trim()) {
    return tr("اذكر اسم أو كود البديل المقترح عند عدم مطابقة نفس المنتج.", "Specify the proposed equivalent product.");
  }
  return null;
}

export function canApproveCompanyVerification(record: CompanyVerificationRecord): boolean {
  const hasLegal = record.legalName.trim().length >= 2 && record.publicName.trim().length >= 2;
  const hasUploadedDoc = record.documents.length > 0;
  return hasLegal && hasUploadedDoc;
}

export function normalizeQuoteStatus(raw: unknown): LiveQuote["status"] {
  const s = toStr(raw).toLowerCase();
  if (s === "accepted" || s === "won") return "accepted";
  if (s === "rejected" || s === "declined") return "rejected";
  if (s === "not-selected" || s === "not_selected") return "not-selected";
  if (s === "expired") return "expired";
  if (s === "revised") return "revised";
  return "submitted";
}

export function normalizeLiveRfq(raw: Record<string, unknown>): LiveRfq {
  const id = toStr(raw.id || raw.request_id);
  const createdAt = toTimestamp(raw.created_at ?? raw.createdAt);
  const deadlineAt = toTimestamp(raw.deadline_at ?? raw.deadlineAt ?? raw.expires_at);
  return {
    id,
    reference: toStr(raw.reference || raw.ref_code || (id ? `RFQ-${id.slice(0, 8).toUpperCase()}` : "")),
    customerId: toStr(raw.customer_id ?? raw.buyer_id ?? raw.user_id ?? raw.customerId),
    customerName: toStr(raw.customer_name ?? raw.buyer_name) || undefined,
    productId: toStr(raw.product_id ?? raw.catalog_product_id ?? raw.productId),
    productTitle: toStr(raw.product_title ?? raw.product_name ?? raw.title ?? raw.product_id ?? "Catalogue Item"),
    category: toStr(raw.category ?? raw.material) || undefined,
    variantLabel: toStr(raw.variant_label ?? raw.size_label ?? raw.variantLabel),
    quantity: toNum(raw.quantity ?? raw.qty, 0),
    unit: toStr(raw.unit, "sqm"),
    governorate: toStr(raw.governorate ?? raw.region ?? raw.city),
    destination: toStr(raw.destination ?? raw.delivery_address ?? raw.address),
    deliveryDate: toStr(raw.delivery_date ?? raw.deliveryDate),
    projectType: toStr(raw.project_type ?? raw.projectType),
    phased: Boolean(raw.phased),
    notes: toStr(raw.notes),
    status: toStr(raw.status, "submitted"),
    createdAt,
    deadlineAt,
    offersCount: toNum(raw.offers_count ?? raw.quotes_count ?? raw.offersCount, 0),
    acceptedQuoteId: toStr(raw.accepted_quote_id ?? raw.accepted_offer_id ?? raw.acceptedOfferId) || null,
    supplierResponseStatus: toStr(raw.supplier_response_status ?? raw.my_quote_status) || undefined,
  };
}

export function normalizeLiveQuote(raw: Record<string, unknown>): LiveQuote {
  const unitPrice =
    raw.unit_price_cents != null
      ? toNum(raw.unit_price_cents) / 100
      : toNum(raw.unit_price ?? raw.unitPrice, 0);
  const quantity = toNum(raw.quantity ?? raw.qty, 0);
  const shipping =
    raw.shipping_cents != null
      ? toNum(raw.shipping_cents) / 100
      : toNum(raw.shipping ?? raw.shipping_egp, 0);
  const rawTaxRate = raw.tax_percent ?? raw.taxPercent ?? (raw.tax_rate != null ? toNum(raw.tax_rate) * 100 : 0);
  const taxPercent = toNum(rawTaxRate, 0);
  const calc = computeQuoteBreakdown({ unitPrice, quantity, taxPercent, shipping });
  const subtotal =
    raw.subtotal_cents != null ? toNum(raw.subtotal_cents) / 100 : toNum(raw.subtotal, calc.subtotal);
  const taxAmount =
    raw.tax_cents != null ? toNum(raw.tax_cents) / 100 : toNum(raw.tax_amount, calc.taxAmount);
  const total =
    raw.total_cents != null ? toNum(raw.total_cents) / 100 : toNum(raw.total ?? raw.total_egp, calc.total);

  return {
    id: toStr(raw.id || raw.quote_id),
    requestId: toStr(raw.request_id ?? raw.rfq_id ?? raw.requestId),
    companyId: toStr(raw.company_id ?? raw.supplier_id ?? raw.businessId),
    supplierName: toStr(raw.supplier_name ?? raw.company_name ?? raw.public_name ?? "Verified Supplier"),
    supplierVerified: raw.supplier_verified !== false && toStr(raw.company_status, "verified").toLowerCase() === "verified",
    exactProduct: raw.exact_product !== false && raw.exactProduct !== false,
    proposedEquivalent: toStr(raw.proposed_equivalent ?? raw.equivalent_name) || undefined,
    unitPrice,
    quantity,
    unit: toStr(raw.unit, "sqm"),
    subtotal,
    taxPercent,
    taxAmount,
    shipping,
    total,
    currency: toStr(raw.currency, "EGP"),
    prepDays: toNum(raw.prep_days ?? raw.prepDays, 0),
    deliveryDays: toNum(raw.delivery_days ?? raw.deliveryDays, 0),
    validityDays: toNum(raw.validity_days ?? raw.validityDays, 0),
    expiresAt: raw.expires_at || raw.expiresAt ? toTimestamp(raw.expires_at ?? raw.expiresAt) : null,
    paymentTerms: toStr(raw.payment_terms ?? raw.paymentTerms),
    availability: toStr(raw.availability),
    notes: toStr(raw.notes),
    status: normalizeQuoteStatus(raw.status),
    revision: Math.max(1, Math.trunc(toNum(raw.revision ?? raw.version, 1))),
    createdAt: toTimestamp(raw.created_at ?? raw.createdAt),
    updatedAt: toTimestamp(raw.updated_at ?? raw.updatedAt ?? raw.created_at),
  };
}

export function normalizeLiveOrder(raw: Record<string, unknown>): LiveOrder {
  const total =
    raw.total_cents != null ? toNum(raw.total_cents) / 100 : toNum(raw.total ?? raw.total_egp, 0);
  return {
    id: toStr(raw.id || raw.order_id),
    requestId: toStr(raw.request_id ?? raw.rfq_id ?? raw.requestId),
    quoteId: toStr(raw.quote_id ?? raw.offer_id ?? raw.offerId),
    customerId: toStr(raw.customer_id ?? raw.buyer_id ?? raw.customerId),
    companyId: toStr(raw.company_id ?? raw.supplier_id ?? raw.businessId),
    supplierName: toStr(raw.supplier_name ?? raw.company_name ?? raw.public_name) || undefined,
    customerName: toStr(raw.customer_name ?? raw.buyer_name) || undefined,
    total,
    currency: toStr(raw.currency, "EGP"),
    status: toStr(raw.status, "pending"),
    paymentStatus: toStr(raw.payment_status ?? raw.paymentStatus, "unpaid"),
    shippingStatus: toStr(raw.shipping_status ?? raw.delivery_status) || undefined,
    createdAt: toTimestamp(raw.created_at ?? raw.createdAt),
    updatedAt: raw.updated_at ? toTimestamp(raw.updated_at) : undefined,
  };
}

export function normalizeLiveNotification(raw: Record<string, unknown>): LiveNotification {
  return {
    id: toStr(raw.id),
    title: toStr(raw.title ?? raw.subject ?? "Notification"),
    body: toStr(raw.body ?? raw.message),
    kind: toStr(raw.kind ?? raw.type, "system"),
    requestId: toStr(raw.request_id ?? raw.requestId) || undefined,
    orderId: toStr(raw.order_id ?? raw.orderId) || undefined,
    read: Boolean(raw.read ?? raw.is_read ?? raw.read_at),
    createdAt: toTimestamp(raw.created_at ?? raw.createdAt),
  };
}

export function normalizeMailboxPayload(raw: Record<string, unknown>): LiveMailbox {
  const rawRequests = Array.isArray(raw.requests)
    ? raw.requests
    : Array.isArray(raw.rfqs)
    ? raw.rfqs
    : [];
  const rawQuotes = Array.isArray(raw.quotes)
    ? raw.quotes
    : Array.isArray(raw.offers)
    ? raw.offers
    : [];
  const rawOrders = Array.isArray(raw.orders) ? raw.orders : [];
  const rawNotifications = Array.isArray(raw.notifications)
    ? raw.notifications
    : Array.isArray(raw.messages)
    ? raw.messages
    : [];

  return {
    role: toStr(raw.role, "buyer"),
    requests: rawRequests
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
      .map(normalizeLiveRfq),
    quotes: rawQuotes
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
      .map(normalizeLiveQuote),
    orders: rawOrders
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
      .map(normalizeLiveOrder),
    notifications: rawNotifications
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
      .map(normalizeLiveNotification),
  };
}

export function normalizeVerificationRecord(raw: Record<string, unknown>): CompanyVerificationRecord {
  const details =
    raw.business_details && typeof raw.business_details === "object"
      ? (raw.business_details as Record<string, unknown>)
      : {};
  const docsRaw = Array.isArray(raw.documents) ? raw.documents : [];
  const documents: VerificationDocument[] = docsRaw
    .filter((d): d is Record<string, unknown> => Boolean(d && typeof d === "object"))
    .map((d) => ({
      id: toStr(d.id || d.document_id || d.kind),
      kind: toStr(d.kind || d.document_type || "document"),
      filename: toStr(d.filename || d.original_name || d.name || d.kind),
      uploadedAt: d.uploaded_at || d.created_at ? toTimestamp(d.uploaded_at ?? d.created_at) : null,
      status: toStr(d.status, "uploaded"),
      reviewNote: toStr(d.review_note ?? d.notes) || undefined,
    }));

  const categories = Array.isArray(raw.categories)
    ? raw.categories.map((c) => toStr(c)).filter(Boolean)
    : Array.isArray(details.categories)
    ? details.categories.map((c) => toStr(c)).filter(Boolean)
    : [];

  const serviceAreas = Array.isArray(raw.service_areas)
    ? raw.service_areas.map((c) => toStr(c)).filter(Boolean)
    : Array.isArray(details.service_areas)
    ? details.service_areas.map((c) => toStr(c)).filter(Boolean)
    : [];

  return {
    companyId: toStr(raw.company_id ?? raw.id),
    legalName: toStr(raw.legal_name ?? details.legal_name),
    publicName: toStr(raw.public_name ?? details.public_name),
    representative: toStr(raw.representative ?? details.representative),
    email: toStr(raw.email ?? details.email),
    phone: toStr(raw.phone ?? details.phone),
    governorate: toStr(raw.governorate ?? details.governorate),
    companyType: toStr(raw.company_type ?? details.company_type),
    crNumber: toStr(raw.cr_number ?? details.cr_number),
    taxNumber: toStr(raw.tax_number ?? details.tax_number),
    categories,
    serviceAreas,
    status: toStr(raw.status, "draft").toLowerCase(),
    reviewNotes: toStr(raw.review_notes ?? raw.admin_notes ?? raw.decision_notes),
    submittedAt: raw.submitted_at ? toTimestamp(raw.submitted_at) : null,
    reviewedAt: raw.reviewed_at ? toTimestamp(raw.reviewed_at) : null,
    documents,
  };
}

export function normalizeAdminOverview(raw: Record<string, unknown>): AdminOverviewData {
  const countsRaw = (raw.counts && typeof raw.counts === "object" ? raw.counts : raw) as Record<string, unknown>;
  const usersRaw = Array.isArray(raw.users) ? raw.users : [];
  const companiesRaw = Array.isArray(raw.companies) ? raw.companies : [];
  const requestsRaw = Array.isArray(raw.requests) ? raw.requests : Array.isArray(raw.rfqs) ? raw.rfqs : [];
  const quotesRaw = Array.isArray(raw.quotes) ? raw.quotes : Array.isArray(raw.offers) ? raw.offers : [];
  const ordersRaw = Array.isArray(raw.orders) ? raw.orders : [];
  const auditRaw = Array.isArray(raw.audit) ? raw.audit : Array.isArray(raw.audit_log) ? raw.audit_log : [];

  const companies: MarketplaceCompany[] = companiesRaw
    .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
    .map((c) => ({
      id: toStr(c.id),
      public_name: toStr(c.public_name),
      legal_name: toStr(c.legal_name),
      email: toStr(c.email),
      status: toStr(c.status, "submitted"),
      owner_id: toStr(c.owner_id),
      owner_name: toStr(c.owner_name) || undefined,
      created_at: (c.created_at as number | string) ?? 0,
      products: c.products != null ? toNum(c.products) : undefined,
    }));

  const users: AdminUserSummary[] = usersRaw
    .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
    .map((u) => ({
      id: toStr(u.id),
      name: toStr(u.name || u.email || "User"),
      email: toStr(u.email),
      phone: toStr(u.phone) || undefined,
      role: toStr(u.role, "buyer"),
      status: toStr(u.status, "active"),
      createdAt: toTimestamp(u.created_at ?? u.createdAt),
    }));

  const audit: AdminAuditItem[] = auditRaw
    .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
    .map((a, index) => ({
      id: toStr(a.id || `audit-${index}`),
      actor: toStr(a.actor ?? a.actor_name ?? a.actor_id ?? "system"),
      action: toStr(a.action ?? a.event),
      target: toStr(a.target ?? a.target_id ?? a.detail),
      createdAt: toTimestamp(a.created_at ?? a.at),
    }));

  const verifiedCount =
    countsRaw.verified_companies != null
      ? toNum(countsRaw.verified_companies)
      : companies.filter((c) => c.status.toLowerCase() === "verified").length;
  const pendingCount =
    countsRaw.pending_companies != null
      ? toNum(countsRaw.pending_companies)
      : companies.filter((c) => ["submitted", "under_review", "pending"].includes(c.status.toLowerCase())).length;

  return {
    counts: {
      users: toNum(countsRaw.users_count ?? countsRaw.users, users.length),
      companies: toNum(countsRaw.companies_count ?? countsRaw.companies, companies.length),
      verifiedCompanies: verifiedCount,
      pendingCompanies: pendingCount,
      requests: toNum(countsRaw.requests_count ?? countsRaw.rfqs_count ?? countsRaw.requests, requestsRaw.length),
      quotes: toNum(countsRaw.quotes_count ?? countsRaw.offers_count ?? countsRaw.quotes, quotesRaw.length),
      orders: toNum(countsRaw.orders_count ?? countsRaw.orders, ordersRaw.length),
      products: toNum(countsRaw.products_count ?? countsRaw.supplier_products_count ?? countsRaw.products, 0),
    },
    users,
    companies,
    requests: requestsRaw
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
      .map(normalizeLiveRfq),
    quotes: quotesRaw
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
      .map(normalizeLiveQuote),
    orders: ordersRaw
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
      .map(normalizeLiveOrder),
    audit,
  };
}

export function normalizeAiQuota(raw: Record<string, unknown>): LiveAiQuota {
  const quotaObj = (raw.quota && typeof raw.quota === "object" ? raw.quota : raw) as Record<string, unknown>;
  const role = toStr(raw.role ?? quotaObj.role, "buyer");
  const unlimited = Boolean(quotaObj.unlimited || role === "admin");
  const limit = unlimited ? null : quotaObj.limit != null ? toNum(quotaObj.limit) : null;
  const remaining = unlimited ? null : quotaObj.remaining != null ? toNum(quotaObj.remaining) : null;
  const used =
    quotaObj.used != null
      ? toNum(quotaObj.used)
      : limit != null && remaining != null
      ? Math.max(0, limit - remaining)
      : null;

  return {
    role,
    eligible: raw.eligible !== false && role !== "supplier",
    unlimited,
    used,
    limit,
    remaining,
    provider: toStr(raw.provider, "Runpod") || undefined,
    configured: typeof raw.configured === "boolean" ? raw.configured : undefined,
    status: toStr(raw.status ?? raw.integration) || undefined,
  };
}

export function formatEgp(amount: number, locale: "ar" | "en" | "fr" = "en"): string {
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "fr" ? "fr-FR" : "en-EG", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
  return locale === "ar" ? `${formatted} ج.م` : `${formatted} EGP`;
}

export function describeDashboardError(error: unknown, locale: "ar" | "en" | "fr" = "en"): string {
  const tr = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const code = error instanceof DashboardApiError ? error.code : error instanceof Error ? error.message : String(error);
  const map: Record<string, [string, string]> = {
    PHP_API_NON_JSON: [
      "خدمة PHP/MySQL غير متصلة على هذا النطاق (معاينة ثابتة). البيانات الحقيقية تظهر على الخادم الإنتاجي idea-dh.com.",
      "The PHP/MySQL backend is not mounted on this preview host. Live records load on the production cPanel server.",
    ],
    ACCOUNT_API_NON_JSON: [
      "خدمة الحسابات PHP/MySQL غير متصلة على هذا النطاق.",
      "The PHP/MySQL account service is not reachable on this host.",
    ],
    ADMIN_REQUIRED: ["هذه العملية مخصصة لمسؤولي IDEA المعتمدين فقط.", "Administrator authorization is required."],
    COMPANY_ACCESS_DENIED: ["ليست لديك صلاحية الوصول إلى هذه الشركة.", "You are not authorized for this company workspace."],
    COMPANY_NOT_VERIFIED: [
      "يجب اعتماد الشركة من إدارة IDEA قبل تفعيل هذه الصلاحية.",
      "Company verification by IDEA administrators is required first.",
    ],
    ADMIN_APPROVAL_REQUIRED: [
      "يجب اعتماد المنتج من الإدارة أولاً قبل تفعيله في المتجر.",
      "Admin storefront approval is required before activating this product.",
    ],
    PRODUCT_DIMENSIONS_CONFLICT: [
      "مقاسات البلاطة بالملليمتر لا تطابق وصف المقاس المكتوب.",
      "Tile dimensions in mm do not match the entered size label.",
    ],
    DUPLICATE_COMPANY_CODE: ["كود المنتج (SKU) مستخدم بالفعل داخل نفس الشركة.", "This SKU already exists for this company."],
    STAFF_ACCOUNT_NOT_FOUND: [
      "لم يتم العثور على حساب IDEA مسجّل بهذا البريد الإلكتروني.",
      "No registered IDEA user account matches this email address.",
    ],
    CANNOT_REVOKE_OWNER: ["لا يمكن إلغاء صلاحية المالك الأساسي للشركة.", "The primary company owner cannot be revoked."],
    COMPANY_REVIEW_REQUIRED: [
      "يجب تأكيد مراجعة المستندات قبل اعتماد الشركة.",
      "Document review confirmation is required before approving a company.",
    ],
  };
  const found = map[code];
  if (found) return tr(found[0], found[1]);
  return code || tr("تعذّر إتمام الطلب على الخادم.", "Server request failed.");
}

/* --------------------------------------------------------------------------
 * Low-level authenticated PHP fetch helpers (same-origin + CSRF)
 * -------------------------------------------------------------------------- */

async function parsePhpJson(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new DashboardApiError("PHP_API_NON_JSON", response.status);
  }
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") {
    throw new DashboardApiError("PHP_API_INVALID_JSON", response.status);
  }
  if (!response.ok || typeof payload.error === "string") {
    throw new DashboardApiError(
      typeof payload.error === "string" ? payload.error : `HTTP_${response.status}`,
      response.status
    );
  }
  return payload;
}

async function phpGet(endpoint: string, action: string, params?: Record<string, string | undefined>): Promise<Record<string, unknown>> {
  const qs = new URLSearchParams({ action });
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") qs.set(key, value);
    }
  }
  const response = await fetch(`${endpoint}?${qs.toString()}`, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  return parsePhpJson(response);
}

async function getFreshCsrf(): Promise<{ session: PhpSession; csrf: string }> {
  const session = await getPhpSession();
  if (!session.csrf || session.csrf.length < 20) {
    throw new DashboardApiError("CSRF_MISSING", 401);
  }
  return { session, csrf: session.csrf };
}

async function phpPostJson(
  endpoint: string,
  action: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { csrf } = await getFreshCsrf();
  const response = await fetch(`${endpoint}?action=${encodeURIComponent(action)}`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrf,
    },
    body: JSON.stringify(body),
  });
  return parsePhpJson(response);
}

/* --------------------------------------------------------------------------
 * Customer, Supplier & RFQ endpoints (/api/accounts.php & /api/platform.php)
 * -------------------------------------------------------------------------- */

export async function fetchLiveMailbox(): Promise<LiveMailbox> {
  const raw = await phpGet(PHP_ACCOUNT_API, "mailbox");
  return normalizeMailboxPayload(raw);
}

export async function fetchLiveAiQuota(): Promise<LiveAiQuota> {
  const raw = await phpGet(PHP_PLATFORM_API, "ai-quota");
  return normalizeAiQuota(raw);
}

export async function createLiveRfq(payload: {
  productId: string;
  productTitle: string;
  variantLabel: string;
  quantity: number;
  unit: string;
  governorate: string;
  destination: string;
  deliveryDate: string;
  projectType: string;
  phased: boolean;
  notes: string;
  deadlineHours: number;
}): Promise<LiveRfq> {
  const raw = await phpPostJson(PHP_ACCOUNT_API, "request-quotes", {
    product_id: payload.productId,
    product_title: payload.productTitle,
    variant_label: payload.variantLabel,
    quantity: payload.quantity,
    unit: payload.unit,
    governorate: payload.governorate,
    destination: payload.destination,
    delivery_date: payload.deliveryDate,
    project_type: payload.projectType,
    phased: payload.phased,
    notes: payload.notes,
    deadline_hours: payload.deadlineHours,
  });
  const record = (raw.request && typeof raw.request === "object" ? raw.request : raw) as Record<string, unknown>;
  const normalized = normalizeLiveRfq(record);
  if (!normalized.id) {
    throw new DashboardApiError("RFQ_NOT_PERSISTED", 500);
  }
  return normalized;
}

export async function submitLiveSupplierQuote(payload: {
  requestId: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  shipping: number;
  taxPercent: number;
  prepDays: number;
  deliveryDays: number;
  validityDays: number;
  paymentTerms: string;
  exactProduct: boolean;
  proposedEquivalent?: string;
  availability?: string;
  notes?: string;
  signerName?: string;
}): Promise<LiveQuote> {
  const breakdown = computeQuoteBreakdown({
    unitPrice: payload.unitPrice,
    quantity: payload.quantity,
    taxPercent: payload.taxPercent,
    shipping: payload.shipping,
  });
  const raw = await phpPostJson(PHP_ACCOUNT_API, "price-quote", {
    request_id: payload.requestId,
    unit_price: payload.unitPrice,
    unit_price_cents: Math.round(payload.unitPrice * 100),
    quantity: payload.quantity,
    unit: payload.unit,
    shipping: payload.shipping,
    shipping_cents: Math.round(payload.shipping * 100),
    tax_percent: payload.taxPercent,
    tax_rate: payload.taxPercent / 100,
    subtotal_cents: Math.round(breakdown.subtotal * 100),
    tax_cents: Math.round(breakdown.taxAmount * 100),
    total_cents: Math.round(breakdown.total * 100),
    prep_days: payload.prepDays,
    delivery_days: payload.deliveryDays,
    validity_days: payload.validityDays,
    payment_terms: payload.paymentTerms,
    exact_product: payload.exactProduct,
    proposed_equivalent: payload.proposedEquivalent || "",
    availability: payload.availability || "",
    notes: payload.notes || "",
    signer_name: payload.signerName || "",
  });
  const record = (raw.quote && typeof raw.quote === "object" ? raw.quote : raw) as Record<string, unknown>;
  return normalizeLiveQuote(record);
}

export async function acceptLiveQuote(quoteId: string): Promise<{ order?: LiveOrder; accepted: boolean }> {
  const raw = await phpPostJson(PHP_ACCOUNT_API, "accept-quote", { quote_id: quoteId });
  const order =
    raw.order && typeof raw.order === "object"
      ? normalizeLiveOrder(raw.order as Record<string, unknown>)
      : undefined;
  return { order, accepted: true };
}

export async function rejectLiveQuote(quoteId: string, reason = ""): Promise<{ rejected: boolean }> {
  await phpPostJson(PHP_ACCOUNT_API, "reject-quote", { quote_id: quoteId, reason });
  return { rejected: true };
}

export async function fetchCompanyVerification(): Promise<CompanyVerificationRecord | null> {
  const raw = await phpGet(PHP_PLATFORM_API, "company-verification");
  const candidate =
    raw.verification && typeof raw.verification === "object"
      ? (raw.verification as Record<string, unknown>)
      : raw.company && typeof raw.company === "object"
      ? (raw.company as Record<string, unknown>)
      : raw.company_id || raw.id
      ? raw
      : null;
  return candidate ? normalizeVerificationRecord(candidate) : null;
}

export async function uploadVerificationDocument(file: File, kind: string): Promise<void> {
  const { csrf } = await getFreshCsrf();
  const form = new FormData();
  form.set("kind", kind);
  form.set("document", file, file.name);
  const response = await fetch(`${PHP_PLATFORM_API}?action=company-document-upload`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json", "X-CSRF-Token": csrf },
    body: form,
  });
  await parsePhpJson(response);
}

export async function submitCompanyVerification(payload: {
  legalName: string;
  publicName: string;
  representative: string;
  email: string;
  phone: string;
  governorate: string;
  companyType: string;
  crNumber: string;
  taxNumber: string;
  categories: string[];
  serviceAreas: string[];
}): Promise<CompanyVerificationRecord> {
  const raw = await phpPostJson(PHP_PLATFORM_API, "company-verification-submit", {
    legal_name: payload.legalName,
    public_name: payload.publicName,
    representative: payload.representative,
    email: payload.email,
    phone: payload.phone,
    governorate: payload.governorate,
    company_type: payload.companyType,
    cr_number: payload.crNumber,
    tax_number: payload.taxNumber,
    categories: payload.categories,
    service_areas: payload.serviceAreas,
  });
  const candidate = (raw.verification && typeof raw.verification === "object" ? raw.verification : raw) as Record<string, unknown>;
  return normalizeVerificationRecord(candidate);
}

/* --------------------------------------------------------------------------
 * Admin overview & verification endpoints
 * -------------------------------------------------------------------------- */

export async function fetchAdminOverview(): Promise<AdminOverviewData> {
  const raw = await phpGet(PHP_ACCOUNT_API, "admin-overview");
  return normalizeAdminOverview(raw);
}

export async function fetchAdminVerifications(): Promise<CompanyVerificationRecord[]> {
  const raw = await phpGet(PHP_PLATFORM_API, "admin-verifications");
  const list = Array.isArray(raw.verifications)
    ? raw.verifications
    : Array.isArray(raw.companies)
    ? raw.companies
    : [];
  return list
    .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
    .map(normalizeVerificationRecord);
}

export async function decideAdminVerification(payload: {
  companyId: string;
  decision: "verified" | "rejected" | "more_info_required" | "suspended";
  notes: string;
}): Promise<void> {
  await phpPostJson(PHP_PLATFORM_API, "admin-verification-decision", {
    company_id: payload.companyId,
    decision: payload.decision,
    status: payload.decision,
    notes: payload.notes,
    reviewed: true,
  });
}

/* --------------------------------------------------------------------------
 * Marketplace B2B & Admin endpoints (exact contract of server/cpanel/api/marketplace.php)
 * -------------------------------------------------------------------------- */

export async function fetchMarketplaceBootstrap(): Promise<MarketplaceBootstrap> {
  const raw = await phpGet(PHP_MARKETPLACE_API, "bootstrap");
  return raw as unknown as MarketplaceBootstrap;
}

export async function fetchCompanyProducts(companyId: string): Promise<MarketplaceProduct[]> {
  const raw = await phpGet(PHP_MARKETPLACE_API, "products", { company_id: companyId });
  return Array.isArray(raw.products) ? (raw.products as MarketplaceProduct[]) : [];
}

export async function saveCompanyProduct(payload: {
  company_id: string;
  id?: string;
  sku: string;
  title: string;
  brand: string;
  manufacturer: string;
  category: "ceramic" | "porcelain" | "marble" | "granite" | "tile";
  width_mm: number;
  height_mm: number;
  size_label: string;
  finish?: string;
  color?: string;
  image_url?: string;
  price_cents: number | null;
  description?: string;
}): Promise<{ id: string; approval: string }> {
  const raw = await phpPostJson(PHP_MARKETPLACE_API, "product-save", payload as unknown as Record<string, unknown>);
  return { id: toStr(raw.id), approval: toStr(raw.approval) };
}

export async function setCompanyProductActive(companyId: string, id: string, active: boolean): Promise<void> {
  await phpPostJson(PHP_MARKETPLACE_API, "product-active", { company_id: companyId, id, active });
}

export async function setAdminProductApproval(id: string, approved: boolean, notes = ""): Promise<void> {
  await phpPostJson(PHP_MARKETPLACE_API, "product-approval", { id, approved, notes });
}

export async function fetchCompanyStaff(companyId: string): Promise<MarketplaceStaffMember[]> {
  const raw = await phpGet(PHP_MARKETPLACE_API, "staff", { company_id: companyId });
  return Array.isArray(raw.staff) ? (raw.staff as MarketplaceStaffMember[]) : [];
}

export async function saveCompanyStaff(companyId: string, email: string, active: boolean): Promise<void> {
  await phpPostJson(PHP_MARKETPLACE_API, "staff-save", { company_id: companyId, email, active });
}

export async function setAdminCompanyStatus(
  companyId: string,
  status: "verified" | "suspended",
  reviewed: boolean
): Promise<void> {
  await phpPostJson(PHP_MARKETPLACE_API, "company-status", { company_id: companyId, status, reviewed });
}

export async function fetchConfirmedSales(month: string, companyId?: string): Promise<MarketplaceSalesReport> {
  const raw = await phpGet(PHP_MARKETPLACE_API, "sales", { month, company_id: companyId });
  return {
    month: toStr(raw.month, month),
    timezone: toStr(raw.timezone, "Africa/Cairo"),
    basis: toStr(raw.basis, "captured_payments_only"),
    caveat: toStr(raw.caveat),
    rows: Array.isArray(raw.rows) ? (raw.rows as MarketplaceSalesReport["rows"]) : [],
  };
}

export async function saveMarketplaceTicker(payload: {
  id?: string;
  text_ar: string;
  text_en: string;
  link_path?: string;
  state: "draft" | "published" | "archived";
}): Promise<{ id: string }> {
  const raw = await phpPostJson(PHP_MARKETPLACE_API, "ticker-save", payload as unknown as Record<string, unknown>);
  return { id: toStr(raw.id) };
}

export async function saveMarketplaceAdPackage(payload: {
  id: string;
  price_cents: number;
  duration_days: number;
  is_published: boolean;
}): Promise<void> {
  await phpPostJson(PHP_MARKETPLACE_API, "package-save", payload as unknown as Record<string, unknown>);
}

export async function fetchMarketplaceAdRequests(companyId?: string): Promise<MarketplaceAdRequest[]> {
  const raw = await phpGet(PHP_MARKETPLACE_API, "ad-requests", { company_id: companyId });
  return Array.isArray(raw.requests) ? (raw.requests as MarketplaceAdRequest[]) : [];
}

export async function submitMarketplaceAdRequest(payload: {
  company_id: string;
  package_id: string;
  title: string;
  message: string;
  media_kind: "image" | "video";
}): Promise<{ id: string; status: string }> {
  const raw = await phpPostJson(PHP_MARKETPLACE_API, "ad-request", payload as unknown as Record<string, unknown>);
  return { id: toStr(raw.id), status: toStr(raw.status, "pending") };
}

export async function reviewMarketplaceAdRequest(payload: {
  id: string;
  state: "pending" | "needs_revision" | "approved" | "rejected";
  notes: string;
}): Promise<void> {
  await phpPostJson(PHP_MARKETPLACE_API, "ad-review", payload as unknown as Record<string, unknown>);
}

export async function searchMarketplaceCatalogue(q: string): Promise<{
  products: MarketplaceProduct[];
  similar: MarketplaceProduct[];
}> {
  const raw = await phpGet(PHP_MARKETPLACE_API, "search", { q });
  return {
    products: Array.isArray(raw.products) ? (raw.products as MarketplaceProduct[]) : [],
    similar: Array.isArray(raw.similar) ? (raw.similar as MarketplaceProduct[]) : [],
  };
}
