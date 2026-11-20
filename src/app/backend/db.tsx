import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, apiFetch } from "./apiClient";
import { getPhpSession, signOutPhp, type PhpCompany } from "./phpAccounts";

export type Role = "buyer" | "supplier" | "admin";
export type Unit = "sqm" | "pieces";
export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  provider: string;
  authMethod?: string;
  createdAt: number;
}
export type BusinessStatus = "Draft" | "Submitted" | "Under Review" | "More Information Required" | "Verified" | "Rejected" | "Suspended";
export interface Business {
  id: string;
  ownerId: string;
  membershipRole?: string;
  legalName: string;
  publicName: string;
  representative: string;
  email: string;
  phone: string;
  governorate: string;
  serviceAreas: string[];
  companyType: string;
  crNumber: string;
  taxNumber: string;
  brands: string[];
  categories: string[];
  productIds: string[];
  deliveryCapacityM2: number;
  minOrderM2: number;
  status: BusinessStatus;
  rating: number;
  createdAt: number;
}
export type RequestStatus = "Request Submitted" | "Matching Suppliers" | "Awaiting Offers" | "Offers Received" | "Offer Selected" | "Deadline Reached" | "No Offers Received" | "Admin Assistance Required";
export interface QuoteRequest {
  id: string;
  customerId: string;
  productId: string;
  variantId: string;
  variantLabel: string;
  quantity: number;
  unit: Unit;
  governorate: string;
  destination: string;
  deliveryDate: string;
  projectType: string;
  phased: boolean;
  notes: string;
  status: RequestStatus;
  createdAt: number;
  deadlineAt: number;
  matchedBusinessIds: string[];
  acceptedOfferId?: string;
  requestItemId?: string;
}
export interface Offer {
  id: string;
  requestId: string;
  businessId: string;
  exactProduct: boolean;
  quantity: number;
  unit: Unit;
  unitPrice: number;
  shipping: number;
  taxRate: number;
  availability: string;
  prepDays: number;
  deliveryDays: number;
  paymentTerms: string;
  notes: string;
  expiresAt: number;
  status: "submitted" | "accepted" | "not-selected" | "expired";
  createdAt: number;
}
export interface Order {
  id: string;
  requestId: string;
  offerId: string;
  customerId: string;
  businessId: string;
  total: number;
  status: "Pending Payment" | "Paid" | "Preparing" | "Shipped" | "Delivered" | "Cancelled";
  paymentStatus: "None" | "Paid";
  createdAt: number;
}
export interface Message {
  id: string;
  to: string;
  scope: "customer" | "business" | "admin";
  kind: string;
  title: string;
  body: string;
  requestId?: string;
  orderId?: string;
  read: boolean;
  createdAt: number;
}
export interface Plan {
  id: string;
  audience: "customer" | "business";
  name: string;
  monthly: number;
  annual: number;
  trialDays: number;
  features: string[];
  activeRequests: number;
  offerLimit: number;
  hdRenders: number;
  teamMembers: number;
  featuredEligible: boolean;
}
export interface Subscription {
  userId: string;
  planId: string;
  interval: "monthly" | "annual";
  status: "active" | "cancelled" | "payment-failed";
  startedAt: number;
  renewsAt: number;
}
export type PaymentMethodKey = "card" | "fawry" | "wallet" | "applepay" | "bank";
export interface PaymentMethodConfig {
  key: PaymentMethodKey;
  provider: string;
  enabled: boolean;
  mode: "sandbox" | "production";
  merchantConfigured: boolean;
  webhookOk: boolean;
  lastTest: string | null;
  lastFailure: string | null;
  currency: "EGP";
}
export interface RoomProject {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  photo: string | null;
  dims: { length: number; width: number; height: number; unit: "m" | "cm" | "mm" };
  surfaces: { id: string; label: string; productId: string | null; estM2: number }[];
}
export interface AuditEntry {
  id: string;
  at: number;
  actor: string;
  action: string;
  detail: string;
}
interface DB {
  users: User[];
  businesses: Business[];
  requests: QuoteRequest[];
  offers: Offer[];
  orders: Order[];
  messages: Message[];
  plans: Plan[];
  subscriptions: Subscription[];
  payments: PaymentMethodConfig[];
  roomProjects: RoomProject[];
  audit: AuditEntry[];
  sessionUserId: string | null;
}

const emptyDb = (): DB => ({
  users: [],
  businesses: [],
  requests: [],
  offers: [],
  orders: [],
  messages: [],
  plans: [],
  subscriptions: [],
  payments: [],
  roomProjects: [],
  audit: [],
  sessionUserId: null,
});

interface BackendCtx {
  db: DB;
  session: User | null;
  loading: boolean;
  capabilities: { rfq: false; offers: false; orders: false; subscriptions: false; payments: false };
  refresh: () => Promise<User | null>;
  api: Api;
}

const Ctx = createContext<BackendCtx | null>(null);

export interface Api {
  signOut: () => Promise<void>;
  createBusiness: (b: Partial<Business>) => Promise<Business>;
  updateBusinessStatus: (id: string, status: BusinessStatus) => Promise<void>;
  connectProduct: (bizId: string, productId: string) => Promise<void>;
  createRequest: (r: Omit<QuoteRequest, "id" | "createdAt" | "status" | "deadlineAt" | "matchedBusinessIds" | "customerId">, hours: number) => Promise<{ saved: true; id: string }>;
  submitOffer: (o: Omit<Offer, "id" | "createdAt" | "status">) => Promise<Offer>;
  acceptOffer: (offerId: string) => Promise<Order>;
  sandboxPay: (orderId: string) => Promise<void>;
  subscribe: (planId: string, interval: "monthly" | "annual") => Promise<Subscription>;
  cancelSubscription: (userId: string) => Promise<void>;
  updatePlan: (plan: Plan) => Promise<void>;
  updatePayment: (cfg: PaymentMethodConfig) => Promise<void>;
  testPayment: (key: PaymentMethodKey) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  saveRoomProject: (p: RoomProject) => Promise<void>;
  deleteRoomProject: (id: string) => Promise<void>;
  reset: () => void;
}

function phpCompanyToBusiness(company: PhpCompany): Business {
  const details = company.business_details || {};
  const list = (key: string) => Array.isArray(details[key]) ? (details[key] as unknown[]).filter((value): value is string => typeof value === "string") : [];
  const timestamp = typeof company.created_at === "number" ? company.created_at : Date.parse(company.created_at);
  return {
    id: company.id,
    ownerId: company.owner_id,
    membershipRole: company.my_role,
    legalName: company.legal_name,
    publicName: company.public_name,
    representative: typeof details.representative === "string" ? details.representative : "",
    email: company.email,
    phone: company.phone,
    governorate: typeof details.governorate === "string" ? details.governorate : "",
    serviceAreas: list("service_areas"),
    companyType: typeof details.company_type === "string" ? details.company_type : "",
    crNumber: typeof details.cr_number === "string" ? details.cr_number : "",
    taxNumber: typeof details.tax_number === "string" ? details.tax_number : "",
    brands: list("brands"),
    categories: list("categories"),
    productIds: [],
    deliveryCapacityM2: 0,
    minOrderM2: 0,
    status: company.status as BusinessStatus,
    rating: 0,
    createdAt: Number.isFinite(timestamp) ? timestamp : 0,
  };
}

function unavailable<T>(capability: string): Promise<T> {
  return Promise.reject(new ApiError(`${capability}_BLOCKED_PHP_MYSQL_CONTRACT_UNAVAILABLE`, 503));
}

export function BackendProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(emptyDb);
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<User | null> => {
    const phpSession = await getPhpSession();
    if (!phpSession.user) {
      setSession(null);
      setDb(emptyDb());
      return null;
    }
    const account = phpSession.user;
    const marketplace = await apiFetch<{
      user: { id: string; name: string; role: Role };
      companies: PhpCompany[];
    }>("/api/marketplace.php?action=bootstrap", { authRequired: true });
    if (marketplace.user.id !== account.id || marketplace.user.role !== account.role) {
      throw new ApiError("PHP_SESSION_ROLE_MISMATCH", 401);
    }
    const user: User = {
      id: account.id,
      name: account.name,
      email: account.email,
      phone: account.phone || undefined,
      role: account.role,
      provider: "php-mysql",
      createdAt: typeof account.created_at === "number" ? account.created_at : Date.parse(String(account.created_at || "")) || 0,
    };
    setSession(user);
    setDb({
      ...emptyDb(),
      users: [user],
      businesses: Array.isArray(marketplace.companies) ? marketplace.companies.map(phpCompanyToBusiness) : [],
      sessionUserId: user.id,
    });
    return user;
  }, []);

  useEffect(() => {
    let active = true;
    const syncSession = () => {
      void refresh()
        .catch((error) => {
          if (active) {
            console.error("IDEA PHP/MySQL session check failed:", error);
            setSession(null);
            setDb(emptyDb());
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };
    syncSession();
    window.addEventListener("idea:php-session-changed", syncSession);
    return () => {
      active = false;
      window.removeEventListener("idea:php-session-changed", syncSession);
    };
  }, [refresh]);

  const api = useMemo<Api>(() => ({
    signOut: async () => {
      await signOutPhp();
      setSession(null);
      setDb(emptyDb());
    },
    createBusiness: () => unavailable("COMPANY_APPLICATION"),
    updateBusinessStatus: async (id, status) => {
      const action = status === "Suspended" ? "company-suspend" : "company-status";
      const result = await apiFetch<{ saved?: boolean }>(`/api/marketplace.php?action=${action}`, {
        method: "POST",
        body: { company_id: id, status: status.toLowerCase(), reviewed: status === "Verified" },
        authRequired: true,
      });
      if (result.saved !== true) throw new ApiError("PERSISTENCE_NOT_CONFIRMED", 502);
      await refresh();
    },
    connectProduct: () => unavailable("SUPPLIER_PRODUCT_LINKING"),
    createRequest: () => unavailable("RFQ"),
    submitOffer: () => unavailable("SUPPLIER_OFFER"),
    acceptOffer: () => unavailable("ORDER_ACCEPTANCE"),
    sandboxPay: () => unavailable("PAYMENT"),
    subscribe: () => unavailable("SUBSCRIPTION"),
    cancelSubscription: () => unavailable("SUBSCRIPTION_CANCELLATION"),
    updatePlan: () => unavailable("SUBSCRIPTION_PLAN_ADMIN"),
    updatePayment: () => unavailable("PAYMENT_CONFIGURATION"),
    testPayment: () => unavailable("PAYMENT_TEST"),
    markRead: () => unavailable("NOTIFICATIONS"),
    saveRoomProject: () => unavailable("ROOM_PROJECTS"),
    deleteRoomProject: () => unavailable("ROOM_PROJECTS"),
    reset: () => {
      setSession(null);
      setDb(emptyDb());
    },
  }), [refresh]);

  const capabilities = useMemo(() => ({ rfq: false, offers: false, orders: false, subscriptions: false, payments: false } as const), []);
  return <Ctx.Provider value={{ db, session, loading, capabilities, refresh, api }}>{children}</Ctx.Provider>;
}

export function useBackend() {
  const context = useContext(Ctx);
  if (!context) throw new Error("useBackend must be used within BackendProvider");
  return context;
}
