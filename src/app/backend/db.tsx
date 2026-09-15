import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   IDEA mock backend
   ---------------------------------------------------------------------------
   A fully-typed, localStorage-persisted simulation of the IDEA marketplace
   server. It is NOT a real production backend: there is no server-side
   verification, no real payment capture, no real OTP delivery. Every write is
   a client-side simulation so the end-to-end flows (RFQ → offers → order →
   sandbox payment, subscriptions, inbox, verification, audit) are genuinely
   functional and inspectable in development.

   When Supabase (or another backend) is connected, the `api` surface here is
   the seam to replace: each method maps 1:1 to a server call.
────────────────────────────────────────────────────────────────────────── */

export type Role = "customer" | "business" | "designer" | "contractor" | "admin";
export type Unit = "sqm" | "pieces";

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  provider: string; // google | microsoft | apple | facebook | x | phone | email
  createdAt: number;
}

export type BusinessStatus =
  | "Draft" | "Submitted" | "Under Review" | "More Information Required"
  | "Verified" | "Rejected" | "Suspended";

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
  productIds: string[]; // catalogue products this supplier connects to
  deliveryCapacityM2: number;
  minOrderM2: number;
  status: BusinessStatus;
  rating: number;
  createdAt: number;
}

export type RequestStatus =
  | "Request Submitted" | "Matching Suppliers" | "Awaiting Offers"
  | "Offers Received" | "Offer Selected" | "Deadline Reached"
  | "No Offers Received" | "Admin Assistance Required";

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
  deadlineAt: number; // configurable 24/48h
  matchedBusinessIds: string[];
  acceptedOfferId?: string;
}

export interface Offer {
  id: string;
  requestId: string;
  businessId: string;
  exactProduct: boolean;
  quantity: number; // full or partial
  unit: Unit;
  unitPrice: number; // EGP — PRIVATE, only visible to the requesting customer
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
  to: string; // userId or businessId
  scope: "customer" | "business" | "admin";
  kind: string;
  title: string;
  body: string;
  requestId?: string;
  orderId?: string;
  read: boolean;
  createdAt: number;
}

export interface PlanFeature { [k: string]: string | number | boolean; }
export interface Plan {
  id: string;
  audience: "customer" | "business";
  name: string;
  monthly: number; // EGP — admin-editable
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

export interface AuditEntry { id: string; at: number; actor: string; action: string; detail: string; }

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

const KEY = "idea.db.v1";
const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

/* ── Seed ─────────────────────────────────────────────────────────────── */
function seed(): DB {
  const admin: User = { id: "admin_root", name: "IDEA Admin", email: "admin@idea.test", role: "admin", provider: "email", createdAt: Date.now() };
  const supplierUsers: User[] = ["Cairo Ceramics Co.", "Nile Surfaces", "Delta Porcelain"].map((n, i) => ({
    id: `bizuser_${i + 1}`, name: n, email: `supplier${i + 1}@idea.test`, role: "business", provider: "email", createdAt: Date.now(),
  }));
  const govs = ["Cairo", "Giza", "Alexandria", "Qalyubia"];
  const businesses: Business[] = supplierUsers.map((u, i) => ({
    id: `biz_${i + 1}`, ownerId: u.id, legalName: `${u.name} LLC`, publicName: u.name,
    representative: "Sales Dept.", email: u.email!, phone: `+2010000000${i + 1}`,
    governorate: govs[i], serviceAreas: govs, companyType: "Supplier",
    crNumber: `CR-100${i + 1}`, taxNumber: `TAX-200${i + 1}`,
    brands: ["Ceramica Art"], categories: ["Ceramic", "Porcelain"],
    productIds: [], // filled after products known; matching also falls back to all
    deliveryCapacityM2: 50000, minOrderM2: 20 + i * 10,
    status: "Verified", rating: 4.9 - i * 0.2, createdAt: Date.now(),
  }));
  const plans: Plan[] = [
    { id: "c_free", audience: "customer", name: "Free", monthly: 0, annual: 0, trialDays: 0, features: ["Browse & favorites", "1 active request", "Basic room previews"], activeRequests: 1, offerLimit: 0, hdRenders: 1, teamMembers: 1, featuredEligible: false },
    { id: "c_premium", audience: "customer", name: "Premium", monthly: 199, annual: 1990, trialDays: 7, features: ["5 active requests", "HD renders", "Priority notifications"], activeRequests: 5, offerLimit: 0, hdRenders: 20, teamMembers: 1, featuredEligible: false },
    { id: "c_pro", audience: "customer", name: "Professional", monthly: 499, annual: 4990, trialDays: 14, features: ["Unlimited requests", "Analytics", "Downloadable reports"], activeRequests: 999, offerLimit: 0, hdRenders: 100, teamMembers: 3, featuredEligible: false },
    { id: "c_contractor", audience: "customer", name: "Contractor", monthly: 899, annual: 8990, trialDays: 14, features: ["Bulk projects", "Phased delivery", "Dedicated support"], activeRequests: 999, offerLimit: 0, hdRenders: 200, teamMembers: 8, featuredEligible: false },
    { id: "c_designer", audience: "customer", name: "Interior Designer", monthly: 699, annual: 6990, trialDays: 14, features: ["Room designer pro", "Client sharing", "Moodboards"], activeRequests: 999, offerLimit: 0, hdRenders: 300, teamMembers: 5, featuredEligible: false },
    { id: "b_starter", audience: "business", name: "Starter Supplier", monthly: 499, annual: 4990, trialDays: 0, features: ["20 offers / month", "1 team member"], activeRequests: 0, offerLimit: 20, hdRenders: 0, teamMembers: 1, featuredEligible: false },
    { id: "b_pro", audience: "business", name: "Professional Supplier", monthly: 1499, annual: 14990, trialDays: 7, features: ["Unlimited offers", "Analytics", "3 team members"], activeRequests: 0, offerLimit: 999, hdRenders: 0, teamMembers: 3, featuredEligible: true },
    { id: "b_enterprise", audience: "business", name: "Enterprise Supplier", monthly: 3999, annual: 39990, trialDays: 7, features: ["Featured supplier", "Priority matching", "10 team members"], activeRequests: 0, offerLimit: 9999, hdRenders: 0, teamMembers: 10, featuredEligible: true },
    { id: "b_manufacturer", audience: "business", name: "Manufacturer", monthly: 2999, annual: 29990, trialDays: 7, features: ["Factory catalogue", "Bulk tenders"], activeRequests: 0, offerLimit: 9999, hdRenders: 0, teamMembers: 8, featuredEligible: true },
    { id: "b_importer", audience: "business", name: "Importer", monthly: 2499, annual: 24990, trialDays: 7, features: ["Import brands", "Customs docs"], activeRequests: 0, offerLimit: 9999, hdRenders: 0, teamMembers: 6, featuredEligible: true },
  ];
  const payments: PaymentMethodConfig[] = [
    { key: "card", provider: "Visa · Mastercard · Meeza", enabled: false, mode: "sandbox", merchantConfigured: false, webhookOk: false, lastTest: null, lastFailure: null, currency: "EGP" },
    { key: "fawry", provider: "Fawry Pay", enabled: false, mode: "sandbox", merchantConfigured: false, webhookOk: false, lastTest: null, lastFailure: null, currency: "EGP" },
    { key: "wallet", provider: "Vodafone Cash · Orange Cash · e& cash", enabled: false, mode: "sandbox", merchantConfigured: false, webhookOk: false, lastTest: null, lastFailure: null, currency: "EGP" },
    { key: "applepay", provider: "Apple Pay", enabled: false, mode: "sandbox", merchantConfigured: false, webhookOk: false, lastTest: null, lastFailure: null, currency: "EGP" },
    { key: "bank", provider: "Bank / Instant Transfer", enabled: false, mode: "sandbox", merchantConfigured: false, webhookOk: false, lastTest: null, lastFailure: null, currency: "EGP" },
  ];
  return {
    users: [admin, ...supplierUsers], businesses, requests: [], offers: [], orders: [],
    messages: [], plans, subscriptions: [], payments, roomProjects: [], audit: [], sessionUserId: null,
  };
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      // shallow migration guard
      if (parsed.plans && parsed.payments) return parsed;
    }
  } catch { /* ignore */ }
  return seed();
}

/* ── Context ──────────────────────────────────────────────────────────── */
interface BackendCtx {
  db: DB;
  session: User | null;
  api: Api;
}
const Ctx = createContext<BackendCtx | null>(null);

export interface Api {
  // auth
  signIn: (provider: string, role: Role, info?: { name?: string; email?: string; phone?: string }) => User;
  signOut: () => void;
  setRole: (role: Role) => void;
  // business
  createBusiness: (b: Partial<Business>) => Business;
  updateBusinessStatus: (id: string, status: BusinessStatus) => void;
  connectProduct: (bizId: string, productId: string) => void;
  // rfq
  createRequest: (r: Omit<QuoteRequest, "id" | "createdAt" | "status" | "deadlineAt" | "matchedBusinessIds" | "customerId">, hours: number) => QuoteRequest;
  submitOffer: (o: Omit<Offer, "id" | "createdAt" | "status">) => Offer;
  acceptOffer: (offerId: string) => Order | null;
  // orders / payment
  sandboxPay: (orderId: string, ok: boolean) => void;
  // subscriptions
  subscribe: (planId: string, interval: "monthly" | "annual", paid: boolean) => Subscription | null;
  cancelSubscription: (userId: string) => void;
  updatePlan: (plan: Plan) => void;
  // payments admin
  updatePayment: (cfg: PaymentMethodConfig) => void;
  testPayment: (key: PaymentMethodKey) => void;
  // messages
  markRead: (id: string) => void;
  // room
  saveRoomProject: (p: RoomProject) => void;
  deleteRoomProject: (id: string) => void;
  // dev
  reset: () => void;
  seedOffersFor: (requestId: string) => void;
}

export function BackendProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => load());
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } }, [db]);

  const audit = (actor: string, action: string, detail: string) =>
    ({ id: uid("aud"), at: Date.now(), actor, action, detail } as AuditEntry);

  const api: Api = {
    signIn: (provider, role, info) => {
      const user: User = {
        id: uid("user"), name: info?.name || info?.email?.split("@")[0] || info?.phone || "IDEA Member",
        email: info?.email, phone: info?.phone, role, provider, createdAt: Date.now(),
      };
      setDb((d) => ({ ...d, users: [...d.users, user], sessionUserId: user.id, audit: [audit(user.id, "sign-in", `${provider} as ${role}`), ...d.audit] }));
      return user;
    },
    signOut: () => setDb((d) => ({ ...d, sessionUserId: null })),
    setRole: (role) => setDb((d) => ({ ...d, users: d.users.map((u) => (u.id === d.sessionUserId ? { ...u, role } : u)) })),

    createBusiness: (b) => {
      const biz: Business = {
        id: uid("biz"), ownerId: b.ownerId || "", legalName: b.legalName || "", publicName: b.publicName || "",
        representative: b.representative || "", email: b.email || "", phone: b.phone || "",
        governorate: b.governorate || "Cairo", serviceAreas: b.serviceAreas || ["Cairo"], companyType: b.companyType || "Supplier",
        crNumber: b.crNumber || "", taxNumber: b.taxNumber || "", brands: b.brands || [], categories: b.categories || [],
        productIds: [], deliveryCapacityM2: b.deliveryCapacityM2 || 10000, minOrderM2: b.minOrderM2 || 20,
        status: "Submitted", rating: 0, createdAt: Date.now(),
      };
      setDb((d) => ({ ...d, businesses: [...d.businesses, biz], audit: [audit(biz.ownerId, "business-created", biz.publicName), ...d.audit] }));
      return biz;
    },
    updateBusinessStatus: (id, status) =>
      setDb((d) => ({ ...d, businesses: d.businesses.map((b) => (b.id === id ? { ...b, status } : b)), audit: [audit("admin", "business-status", `${id} → ${status}`), ...d.audit] })),
    connectProduct: (bizId, productId) =>
      setDb((d) => ({ ...d, businesses: d.businesses.map((b) => (b.id === bizId && !b.productIds.includes(productId) ? { ...b, productIds: [...b.productIds, productId] } : b)) })),

    createRequest: (r, hours) => {
      const now = Date.now();
      const req: QuoteRequest = {
        ...r, id: uid("req"), customerId: db.sessionUserId || "guest", createdAt: now,
        status: "Matching Suppliers", deadlineAt: now + hours * 3600_000, matchedBusinessIds: [],
      };
      // Matching: verified + active + covers area + capacity for quantity.
      const matched = db.businesses.filter((b) =>
        b.status === "Verified" &&
        b.serviceAreas.includes(r.governorate) &&
        (r.unit !== "sqm" || b.deliveryCapacityM2 >= r.quantity)
      );
      req.matchedBusinessIds = matched.map((b) => b.id);
      req.status = matched.length ? "Awaiting Offers" : "No Offers Received";
      const msgs: Message[] = matched.map((b) => ({
        id: uid("msg"), to: b.id, scope: "business", kind: "new-request",
        title: "New matching request", body: `Request for ${r.quantity} ${r.unit} to ${r.governorate}.`,
        requestId: req.id, read: false, createdAt: now,
      }));
      setDb((d) => ({ ...d, requests: [req, ...d.requests], messages: [...msgs, ...d.messages], audit: [audit(req.customerId, "request-created", `${req.id} matched ${matched.length}`), ...d.audit] }));
      return req;
    },

    submitOffer: (o) => {
      const offer: Offer = { ...o, id: uid("off"), createdAt: Date.now(), status: "submitted" };
      const req = db.requests.find((r) => r.id === o.requestId);
      const msg: Message | null = req ? {
        id: uid("msg"), to: req.customerId, scope: "customer", kind: "offer",
        title: "New private offer received", body: `A verified supplier submitted an offer.`,
        requestId: req.id, read: false, createdAt: Date.now(),
      } : null;
      setDb((d) => ({
        ...d, offers: [offer, ...d.offers],
        requests: d.requests.map((r) => (r.id === o.requestId ? { ...r, status: "Offers Received" } : r)),
        messages: msg ? [msg, ...d.messages] : d.messages,
        audit: [audit(o.businessId, "offer-submitted", offer.id), ...d.audit],
      }));
      return offer;
    },

    acceptOffer: (offerId) => {
      const offer = db.offers.find((o) => o.id === offerId);
      if (!offer) return null;
      const subtotal = offer.unitPrice * offer.quantity;
      const total = subtotal + subtotal * offer.taxRate + offer.shipping;
      const order: Order = {
        id: uid("ord"), requestId: offer.requestId, offerId, customerId: db.sessionUserId || "guest",
        businessId: offer.businessId, total, status: "Pending Payment", paymentStatus: "None", createdAt: Date.now(),
      };
      const notify: Message = {
        id: uid("msg"), to: offer.businessId, scope: "business", kind: "offer-accepted",
        title: "Your offer was accepted", body: "Prepare the order and await payment confirmation.",
        requestId: offer.requestId, orderId: order.id, read: false, createdAt: Date.now(),
      };
      setDb((d) => ({
        ...d,
        offers: d.offers.map((o) => o.id === offerId ? { ...o, status: "accepted" } : (o.requestId === offer.requestId ? { ...o, status: "not-selected" } : o)),
        requests: d.requests.map((r) => r.id === offer.requestId ? { ...r, status: "Offer Selected", acceptedOfferId: offerId } : r),
        orders: [order, ...d.orders],
        messages: [notify, ...d.messages],
        audit: [audit(order.customerId, "offer-accepted", `${offerId} → order ${order.id}`), ...d.audit],
      }));
      return order;
    },

    sandboxPay: (orderId, ok) =>
      setDb((d) => ({
        ...d,
        orders: d.orders.map((o) => o.id === orderId ? { ...o, paymentStatus: ok ? "Sandbox Authorized" : "Sandbox Failed", status: ok ? "Preparing" : "Pending Payment" } : o),
        audit: [audit("payment", "sandbox-pay", `${orderId} ${ok ? "authorized" : "failed"}`), ...d.audit],
      })),

    subscribe: (planId, interval, paid) => {
      if (!paid || !db.sessionUserId) return null; // never activate without verified payment
      const now = Date.now();
      const sub: Subscription = { userId: db.sessionUserId, planId, interval, status: "active", startedAt: now, renewsAt: now + (interval === "annual" ? 365 : 30) * 864e5 };
      setDb((d) => ({ ...d, subscriptions: [sub, ...d.subscriptions.filter((s) => s.userId !== db.sessionUserId)], audit: [audit(sub.userId, "subscribe", `${planId} ${interval}`), ...d.audit] }));
      return sub;
    },
    cancelSubscription: (userId) =>
      setDb((d) => ({ ...d, subscriptions: d.subscriptions.map((s) => s.userId === userId ? { ...s, status: "cancelled" } : s) })),
    updatePlan: (plan) => setDb((d) => ({ ...d, plans: d.plans.map((p) => p.id === plan.id ? plan : p), audit: [audit("admin", "plan-updated", plan.id), ...d.audit] })),

    updatePayment: (cfg) => setDb((d) => ({ ...d, payments: d.payments.map((p) => p.key === cfg.key ? cfg : p), audit: [audit("admin", "payment-config", cfg.key), ...d.audit] })),
    testPayment: (key) =>
      setDb((d) => ({ ...d, payments: d.payments.map((p) => p.key === key ? { ...p, lastTest: new Date().toISOString(), webhookOk: p.merchantConfigured, lastFailure: p.merchantConfigured ? null : "Merchant credentials missing" } : p) })),

    markRead: (id) => setDb((d) => ({ ...d, messages: d.messages.map((m) => m.id === id ? { ...m, read: true } : m) })),

    saveRoomProject: (p) => setDb((d) => ({ ...d, roomProjects: [p, ...d.roomProjects.filter((x) => x.id !== p.id)] })),
    deleteRoomProject: (id) => setDb((d) => ({ ...d, roomProjects: d.roomProjects.filter((p) => p.id !== id) })),

    reset: () => setDb(seed()),

    // Dev helper: three verified suppliers auto-submit offers to a request.
    seedOffersFor: (requestId) => {
      const req = db.requests.find((r) => r.id === requestId);
      if (!req) return;
      const suppliers = db.businesses.filter((b) => req.matchedBusinessIds.includes(b.id)).slice(0, 3);
      const now = Date.now();
      const offers: Offer[] = suppliers.map((b, i) => ({
        id: uid("off"), requestId, businessId: b.id, exactProduct: i !== 2,
        quantity: i === 2 ? Math.round(req.quantity * 0.6) : req.quantity, unit: req.unit,
        unitPrice: [185, 172, 168][i], shipping: [4200, 5000, 3800][i], taxRate: 0.14,
        availability: i === 2 ? "Partial stock" : "In stock", prepDays: [3, 5, 2][i], deliveryDays: [7, 6, 9][i],
        paymentTerms: ["50% deposit", "Full on delivery", "30-day terms"][i], notes: "",
        expiresAt: now + 72 * 3600_000, status: "submitted", createdAt: now + i,
      }));
      const msg: Message = { id: uid("msg"), to: req.customerId, scope: "customer", kind: "offer", title: "3 private offers received", body: "Compare offers in your request inbox.", requestId, read: false, createdAt: now };
      setDb((d) => ({ ...d, offers: [...offers, ...d.offers], requests: d.requests.map((r) => r.id === requestId ? { ...r, status: "Offers Received" } : r), messages: [msg, ...d.messages], audit: [audit("system", "seed-offers", `${offers.length} offers for ${requestId}`), ...d.audit] }));
    },
  };

  const session = db.users.find((u) => u.id === db.sessionUserId) || null;
  return <Ctx.Provider value={{ db, session, api }}>{children}</Ctx.Provider>;
}

export function useBackend() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBackend must be used within BackendProvider");
  return c;
}
