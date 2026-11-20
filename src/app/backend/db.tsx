import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth, firebaseSignOut, onAuthStateChanged } from "../../lib/firebase";
import { apiFetch } from "./apiClient";

export type Role = "customer" | "business" | "designer" | "contractor" | "admin";
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

interface SessionResponse {
  user: User;
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
  favorites: string[];
}

interface BackendCtx {
  db: DB;
  session: User | null;
  loading: boolean;
  refresh: (opts?: { name?: string; phone?: string; authMethod?: string; requestedRole?: string }) => Promise<User | null>;
  api: Api;
}

const Ctx = createContext<BackendCtx | null>(null);

export interface Api {
  signIn: (provider: string, role: Role, info?: { name?: string; email?: string; phone?: string }) => User;
  signOut: () => void;
  setRole: (role: Role) => void;
  createBusiness: (b: Partial<Business>) => Business;
  updateBusinessStatus: (id: string, status: BusinessStatus) => void;
  connectProduct: (bizId: string, productId: string) => void;
  createRequest: (r: Omit<QuoteRequest, "id" | "createdAt" | "status" | "deadlineAt" | "matchedBusinessIds" | "customerId">, hours: number) => Promise<void>;
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
  const [loading, setLoading] = useState<boolean>(true);

  const loadPublicRef = useCallback(async () => {
    try {
      const [plansData, paymentsData] = await Promise.all([
        apiFetch<Plan[]>("/api/plans"),
        apiFetch<PaymentMethodConfig[]>("/api/payments/public"),
      ]);
      setDb((old) => ({
        ...old,
        plans: Array.isArray(plansData) ? plansData : old.plans,
        payments: Array.isArray(paymentsData) ? paymentsData : old.payments,
      }));
    } catch {
      // Keep UI functional even if backend reference fetch fails momentarily
    }
  }, []);

  const refresh = useCallback(
    async (opts?: { name?: string; phone?: string; authMethod?: string; requestedRole?: string }): Promise<User | null> => {
      if (!auth.currentUser) {
        setSession(null);
        await loadPublicRef();
        return null;
      }
      try {
        const data = await apiFetch<SessionResponse>("/api/auth/session", {
          method: "POST",
          body: opts || {},
          authRequired: true,
        });
        setSession(data.user);
        setDb({
          users: [data.user],
          businesses: data.businesses || [],
          requests: data.requests || [],
          offers: data.offers || [],
          orders: data.orders || [],
          messages: data.messages || [],
          plans: data.plans || [],
          subscriptions: data.subscriptions || [],
          payments: data.payments || [],
          roomProjects: data.roomProjects || [],
          audit: data.audit || [],
          sessionUserId: data.user.id,
        });
        return data.user;
      } catch (error) {
        console.error("IDEA session sync failed:", error);
        return null;
      }
    },
    [loadPublicRef]
  );

  useEffect(() => {
    void loadPublicRef();
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setSession(null);
        setDb((old) => ({ ...emptyDb(), plans: old.plans, payments: old.payments }));
        setLoading(false);
        return;
      }
      void refresh().finally(() => setLoading(false));
    });
    return () => unsub();
  }, [loadPublicRef, refresh]);

  const api = useMemo<Api>(
    () => ({
      signIn: (_provider, role, info) => {
        // Optimistic placeholder only when invoked synchronously; primary login uses Firebase + refresh()
        const user: User = {
          id: session?.id || "pending",
          name: info?.name || session?.name || "IDEA Member",
          email: info?.email || session?.email,
          phone: info?.phone || session?.phone,
          role,
          provider: "firebase",
          createdAt: Date.now(),
        };
        return user;
      },
      signOut: () => {
        void firebaseSignOut(auth).then(() => {
          setSession(null);
          setDb((old) => ({ ...emptyDb(), plans: old.plans, payments: old.payments }));
        });
      },
      setRole: (role) => {
        void apiFetch("/api/auth/profile", {
          method: "POST",
          body: { role },
          authRequired: true,
        }).then(() => refresh());
      },
      createBusiness: (b) => {
        const pending: Business = {
          id: "pending",
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
        void apiFetch("/api/companies/apply", {
          method: "POST",
          body: b,
          authRequired: true,
        }).then(() => refresh());
        return pending;
      },
      updateBusinessStatus: (id, status) => {
        const mapped = status.toLowerCase();
        void apiFetch(`/api/companies/${encodeURIComponent(id)}/status`, {
          method: "PATCH",
          body: { status: mapped },
          authRequired: true,
        }).then(() => refresh());
      },
      connectProduct: (bizId, productId) => {
        void apiFetch(`/api/companies/${encodeURIComponent(bizId)}/connect-product`, {
          method: "POST",
          body: { productId },
          authRequired: true,
        }).then(() => refresh());
      },
      createRequest: async (r, hours) => {
        await apiFetch("/api/requests", {
          method: "POST",
          body: { ...r, hours },
          authRequired: true,
        });
      },
      submitOffer: (offer) => {
        const pending: Offer = { ...offer, id: "pending", status: "submitted", createdAt: Date.now() };
        void apiFetch("/api/offers", {
          method: "POST",
          body: offer,
          authRequired: true,
        }).then(() => refresh());
        return pending;
      },
      acceptOffer: (offerId) => {
        const offer = db.offers.find((o) => o.id === offerId);
        if (!offer) return null;
        const subtotal = offer.unitPrice * offer.quantity;
        const total = subtotal + subtotal * offer.taxRate + offer.shipping;
        const pending: Order = {
          id: "pending",
          requestId: offer.requestId,
          offerId,
          customerId: session?.id || "",
          businessId: offer.businessId,
          total,
          status: "Pending Payment",
          paymentStatus: "None",
          createdAt: Date.now(),
        };
        void apiFetch(`/api/offers/${encodeURIComponent(offerId)}/accept`, {
          method: "POST",
          authRequired: true,
        }).then(() => refresh());
        return pending;
      },
      sandboxPay: (orderId, ok) => {
        void apiFetch(`/api/orders/${encodeURIComponent(orderId)}/pay`, {
          method: "POST",
          body: { ok },
          authRequired: true,
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
        void apiFetch("/api/subscriptions", {
          method: "POST",
          body: { planId, interval, paid },
          authRequired: true,
        }).then(() => refresh());
        return sub;
      },
      cancelSubscription: () => {
        void apiFetch("/api/subscriptions/cancel", {
          method: "POST",
          authRequired: true,
        }).then(() => refresh());
      },
      updatePlan: (plan) => {
        void apiFetch(`/api/admin/plans/${encodeURIComponent(plan.id)}`, {
          method: "PATCH",
          body: { monthly: plan.monthly, annual: plan.annual, trialDays: plan.trialDays },
          authRequired: true,
        }).then(() => refresh());
      },
      updatePayment: (cfg) => {
        void apiFetch(`/api/admin/payments/${encodeURIComponent(cfg.key)}`, {
          method: "PATCH",
          body: cfg,
          authRequired: true,
        }).then(() => refresh());
      },
      testPayment: (key) => {
        void apiFetch(`/api/admin/payments/${encodeURIComponent(key)}/test`, {
          method: "POST",
          authRequired: true,
        }).then(() => refresh());
      },
      markRead: (id) => {
        void apiFetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
          method: "PATCH",
          authRequired: true,
        }).then(() => refresh());
      },
      saveRoomProject: (p) => {
        void apiFetch("/api/room-projects", {
          method: "POST",
          body: p,
          authRequired: true,
        }).then(() => refresh());
      },
      deleteRoomProject: (id) => {
        void apiFetch(`/api/room-projects/${encodeURIComponent(id)}`, {
          method: "DELETE",
          authRequired: true,
        }).then(() => refresh());
      },
      reset: () => {
        setSession(null);
        setDb(emptyDb());
      },
    }),
    [db.offers, refresh, session]
  );

  return <Ctx.Provider value={{ db, session, loading, refresh, api }}>{children}</Ctx.Provider>;
}

export function useBackend() {
  const context = useContext(Ctx);
  if (!context) throw new Error("useBackend must be used within BackendProvider");
  return context;
}
