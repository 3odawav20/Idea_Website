import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "./apiClient";
import { getPhpSession, PHP_ACCOUNT_API, signOutPhp, type PhpUser } from "./phpAccounts";

export type Role = "customer" | "business" | "designer" | "contractor" | "admin";
export type Unit = "sqm" | "pieces";
export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  role: Role;
  provider: string;
  authMethod?: string;
  createdAt: number;
}
export type BusinessStatus = "Draft" | "Submitted" | "Under Review" | "More Information Required" | "Verified" | "Rejected" | "Suspended";
export interface Business {
  id: string;
  ownerId: string;
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
  paymentStatus: "None" | "Sandbox Authorized" | "Sandbox Failed";
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

function mapPhpRole(role: PhpUser["role"]): Role {
  if (role === "admin") return "admin";
  if (role === "supplier") return "business";
  return "customer";
}

function mapPhpUser(phpUser: PhpUser): User {
  const created =
    typeof phpUser.created_at === "number"
      ? phpUser.created_at
      : phpUser.created_at
      ? Date.parse(String(phpUser.created_at)) || Date.now()
      : Date.now();
  return {
    id: String(phpUser.id),
    name: phpUser.name || phpUser.email || "IDEA Member",
    email: phpUser.email || undefined,
    phone: phpUser.phone || undefined,
    role: mapPhpRole(phpUser.role),
    provider: "php-mysql",
    createdAt: created,
  };
}

interface BackendCtx {
  db: DB;
  session: User | null;
  loading: boolean;
  refresh: () => Promise<User | null>;
  api: Api;
}

const Ctx = createContext<BackendCtx | null>(null);

export interface Api {
  signIn: (provider: string, role: Role, info?: { name?: string; email?: string; phone?: string }) => User;
  signOut: () => void;
  setRole: (role: Role) => void;
  updateProfile: (updates: { name?: string; phone?: string }) => Promise<void>;
  createBusiness: (b: Partial<Business>) => Business;
  updateBusinessStatus: (id: string, status: BusinessStatus) => void;
  connectProduct: (bizId: string, productId: string) => void;
  createRequest: (
    r: Omit<QuoteRequest, "id" | "createdAt" | "status" | "deadlineAt" | "matchedBusinessIds" | "customerId">,
    hours: number
  ) => Promise<QuoteRequest>;
  submitOffer: (o: Omit<Offer, "id" | "createdAt" | "status">) => Offer;
  acceptOffer: (offerId: string) => Order | null;
  sandboxPay: (orderId: string, ok: boolean) => void;
  subscribe: (planId: string, interval: "monthly" | "annual", paid: boolean) => Subscription | null;
  cancelSubscription: (userId: string) => void;
  updatePlan: (plan: Plan) => void;
  updatePayment: (cfg: PaymentMethodConfig) => void;
  testPayment: (key: PaymentMethodKey) => void;
  markRead: (id: string) => void;
  saveRoomProject: (p: RoomProject) => void;
  deleteRoomProject: (id: string) => void;
  reset: () => void;
}

export function BackendProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(emptyDb);
  const [session, setSession] = useState<User | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async (): Promise<User | null> => {
    try {
      const phpSession = await getPhpSession();
      setCsrfToken(phpSession.csrf || "");
      if (!phpSession.user) {
        setSession(null);
        setDb((old) => ({ ...emptyDb(), plans: old.plans, payments: old.payments }));
        return null;
      }
      const mapped = mapPhpUser(phpSession.user);
      setSession(mapped);
      setDb((old) => ({
        ...old,
        users: [mapped],
        sessionUserId: mapped.id,
      }));
      return mapped;
    } catch {
      // Static preview host without cPanel PHP backend mounted: fail closed with no synthetic session.
      setSession(null);
      setCsrfToken("");
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const api = useMemo<Api>(
    () => ({
      signIn: (_provider, role, info) => ({
        id: session?.id || "",
        name: info?.name || session?.name || "IDEA Member",
        email: info?.email || session?.email,
        phone: info?.phone || session?.phone,
        role: session?.role || role,
        provider: "php-mysql",
        createdAt: session?.createdAt || Date.now(),
      }),
      signOut: () => {
        void signOutPhp()
          .catch(() => undefined)
          .finally(() => {
            setSession(null);
            setCsrfToken("");
            setDb((old) => ({ ...emptyDb(), plans: old.plans, payments: old.payments }));
          });
      },
      setRole: () => {
        // Roles are assigned strictly server-side in MySQL; client-side self-promotion is disabled.
      },
      updateProfile: async (updates) => {
        const current = await getPhpSession();
        await apiFetch(`${PHP_ACCOUNT_API}?action=profile`, {
          method: "POST",
          body: updates,
          csrfToken: current.csrf,
        });
        await refresh();
      },
      createBusiness: (b) => {
        const pending: Business = {
          id: "",
          ownerId: session?.id || "",
          legalName: b.legalName || "",
          publicName: b.publicName || "",
          representative: b.representative || "",
          email: b.email || "",
          phone: b.phone || "",
          governorate: b.governorate || "Cairo",
          serviceAreas: b.serviceAreas || [],
          companyType: b.companyType || "Supplier",
          crNumber: b.crNumber || "",
          taxNumber: b.taxNumber || "",
          brands: b.brands || [],
          categories: b.categories || [],
          productIds: [],
          deliveryCapacityM2: 1000,
          minOrderM2: 20,
          status: "Submitted",
          rating: 0,
          createdAt: Date.now(),
        };
        void apiFetch("/api/platform.php?action=company-apply", {
          method: "POST",
          body: b,
          csrfToken,
        }).then(() => refresh());
        return pending;
      },
      updateBusinessStatus: (id, status) => {
        void apiFetch("/api/platform.php?action=company-status", {
          method: "POST",
          body: { id, status: status.toLowerCase() },
          csrfToken,
        }).then(() => refresh());
      },
      connectProduct: (bizId, productId) => {
        void apiFetch("/api/platform.php?action=company-connect-product", {
          method: "POST",
          body: { business_id: bizId, product_id: productId },
          csrfToken,
        }).then(() => refresh());
      },
      createRequest: async (r, hours) => {
        const current = await getPhpSession();
        const saved = await apiFetch<QuoteRequest>("/api/marketplace.php?action=rfq-create", {
          method: "POST",
          body: { ...r, hours },
          csrfToken: current.csrf,
        });
        if (!saved || !saved.id) {
          throw new Error("RFQ_NOT_PERSISTED");
        }
        await refresh();
        return saved;
      },
      submitOffer: (offer) => {
        const pending: Offer = { ...offer, id: "", status: "submitted", createdAt: Date.now() };
        void apiFetch("/api/marketplace.php?action=offer-submit", {
          method: "POST",
          body: offer,
          csrfToken,
        }).then(() => refresh());
        return pending;
      },
      acceptOffer: (offerId) => {
        const offer = db.offers.find((o) => o.id === offerId);
        if (!offer) return null;
        const subtotal = offer.unitPrice * offer.quantity;
        const total = subtotal + subtotal * offer.taxRate + offer.shipping;
        const pending: Order = {
          id: "",
          requestId: offer.requestId,
          offerId,
          customerId: session?.id || "",
          businessId: offer.businessId,
          total,
          status: "Pending Payment",
          paymentStatus: "None",
          createdAt: Date.now(),
        };
        void apiFetch("/api/marketplace.php?action=offer-accept", {
          method: "POST",
          body: { offer_id: offerId },
          csrfToken,
        }).then(() => refresh());
        return pending;
      },
      sandboxPay: (orderId, ok) => {
        void apiFetch("/api/marketplace.php?action=order-pay", {
          method: "POST",
          body: { order_id: orderId, ok },
          csrfToken,
        }).then(() => refresh());
      },
      subscribe: (planId, interval, paid) => {
        const sub: Subscription = {
          userId: session?.id || "",
          planId,
          interval,
          status: paid ? "active" : "payment-failed",
          startedAt: Date.now(),
          renewsAt: Date.now() + (interval === "annual" ? 365 : 30) * 86400_000,
        };
        void apiFetch("/api/platform.php?action=subscribe", {
          method: "POST",
          body: { planId, interval, paid },
          csrfToken,
        }).then(() => refresh());
        return sub;
      },
      cancelSubscription: () => {
        void apiFetch("/api/platform.php?action=subscription-cancel", {
          method: "POST",
          csrfToken,
        }).then(() => refresh());
      },
      updatePlan: (plan) => {
        void apiFetch("/api/platform.php?action=admin-plan-update", {
          method: "POST",
          body: { id: plan.id, monthly: plan.monthly, annual: plan.annual, trialDays: plan.trialDays },
          csrfToken,
        }).then(() => refresh());
      },
      updatePayment: (cfg) => {
        void apiFetch("/api/platform.php?action=admin-payment-update", {
          method: "POST",
          body: cfg,
          csrfToken,
        }).then(() => refresh());
      },
      testPayment: (key) => {
        void apiFetch("/api/platform.php?action=admin-payment-test", {
          method: "POST",
          body: { key },
          csrfToken,
        }).then(() => refresh());
      },
      markRead: (id) => {
        void apiFetch("/api/platform.php?action=notification-read", {
          method: "POST",
          body: { id },
          csrfToken,
        }).then(() => refresh());
      },
      saveRoomProject: (p) => {
        void apiFetch("/api/platform.php?action=room-project-save", {
          method: "POST",
          body: p,
          csrfToken,
        }).then(() => refresh());
      },
      deleteRoomProject: (id) => {
        void apiFetch("/api/platform.php?action=room-project-delete", {
          method: "POST",
          body: { id },
          csrfToken,
        }).then(() => refresh());
      },
      reset: () => {
        setSession(null);
        setCsrfToken("");
        setDb(emptyDb());
      },
    }),
    [csrfToken, db.offers, refresh, session]
  );

  return <Ctx.Provider value={{ db, session, loading, refresh, api }}>{children}</Ctx.Provider>;
}

export function useBackend() {
  const context = useContext(Ctx);
  if (!context) throw new Error("useBackend must be used within BackendProvider");
  return context;
}
