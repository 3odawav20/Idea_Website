import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { backendConfigurationError, requireSupabase, supabase } from "./supabaseClient";

export type Role = "customer" | "business" | "designer" | "contractor" | "admin";
export type Unit = "sqm" | "pieces";
export interface User { id: string; name: string; email?: string; phone?: string; role: Role; provider: string; createdAt: number; }
export type BusinessStatus = "Draft" | "Submitted" | "Under Review" | "More Information Required" | "Verified" | "Rejected" | "Suspended";
export interface Business { id: string; ownerId: string; legalName: string; publicName: string; representative: string; email: string; phone: string; governorate: string; serviceAreas: string[]; companyType: string; crNumber: string; taxNumber: string; brands: string[]; categories: string[]; productIds: string[]; deliveryCapacityM2: number; minOrderM2: number; status: BusinessStatus; rating: number; createdAt: number; }
export type RequestStatus = "Request Submitted" | "Matching Suppliers" | "Awaiting Offers" | "Offers Received" | "Offer Selected" | "Deadline Reached" | "No Offers Received" | "Admin Assistance Required";
export interface QuoteRequest { id: string; customerId: string; productId: string; variantLabel: string; quantity: number; unit: Unit; governorate: string; destination: string; deliveryDate: string; projectType: string; phased: boolean; notes: string; status: RequestStatus; createdAt: number; deadlineAt: number; matchedBusinessIds: string[]; acceptedOfferId?: string; requestItemId?: string; }
export interface Offer { id: string; requestId: string; businessId: string; exactProduct: boolean; quantity: number; unit: Unit; unitPrice: number; shipping: number; taxRate: number; availability: string; prepDays: number; deliveryDays: number; paymentTerms: string; notes: string; expiresAt: number; status: "submitted" | "accepted" | "not-selected" | "expired"; createdAt: number; }
export interface Order { id: string; requestId: string; offerId: string; customerId: string; businessId: string; total: number; status: "Pending Payment" | "Paid" | "Preparing" | "Shipped" | "Delivered" | "Cancelled"; paymentStatus: "None" | "Sandbox Authorized" | "Sandbox Failed"; createdAt: number; }
export interface Message { id: string; to: string; scope: "customer" | "business" | "admin"; kind: string; title: string; body: string; requestId?: string; orderId?: string; read: boolean; createdAt: number; }
export interface Plan { id: string; audience: "customer" | "business"; name: string; monthly: number; annual: number; trialDays: number; features: string[]; activeRequests: number; offerLimit: number; hdRenders: number; teamMembers: number; featuredEligible: boolean; }
export interface Subscription { userId: string; planId: string; interval: "monthly" | "annual"; status: "active" | "cancelled" | "payment-failed"; startedAt: number; renewsAt: number; }
export type PaymentMethodKey = "card" | "fawry" | "wallet" | "applepay" | "bank";
export interface PaymentMethodConfig { key: PaymentMethodKey; provider: string; enabled: boolean; mode: "sandbox" | "production"; merchantConfigured: boolean; webhookOk: boolean; lastTest: string | null; lastFailure: string | null; currency: "EGP"; }
export interface RoomProject { id: string; userId: string; name: string; createdAt: number; photo: string | null; dims: { length: number; width: number; height: number; unit: "m" | "cm" | "mm" }; surfaces: { id: string; label: string; productId: string | null; estM2: number }[]; }
export interface AuditEntry { id: string; at: number; actor: string; action: string; detail: string; }
interface DB { users: User[]; businesses: Business[]; requests: QuoteRequest[]; offers: Offer[]; orders: Order[]; messages: Message[]; plans: Plan[]; subscriptions: Subscription[]; payments: PaymentMethodConfig[]; roomProjects: RoomProject[]; audit: AuditEntry[]; sessionUserId: string | null; }
const emptyDb = (): DB => ({ users: [], businesses: [], requests: [], offers: [], orders: [], messages: [], plans: [], subscriptions: [], payments: [], roomProjects: [], audit: [], sessionUserId: null });
interface BackendCtx { db: DB; session: User | null; api: Api; }
const Ctx = createContext<BackendCtx | null>(null);
export interface Api {
  signIn: (provider: string, role: Role, info?: { name?: string; email?: string; phone?: string }) => User;
  signOut: () => void; setRole: (role: Role) => void; createBusiness: (b: Partial<Business>) => Business; updateBusinessStatus: (id: string, status: BusinessStatus) => void; connectProduct: (bizId: string, productId: string) => void;
  createRequest: (r: Omit<QuoteRequest, "id" | "createdAt" | "status" | "deadlineAt" | "matchedBusinessIds" | "customerId">, hours: number) => QuoteRequest; submitOffer: (o: Omit<Offer, "id" | "createdAt" | "status">) => Offer; acceptOffer: (offerId: string) => Order | null;
  sandboxPay: (orderId: string, ok: boolean) => void; subscribe: (planId: string, interval: "monthly" | "annual", paid: boolean) => Subscription | null; cancelSubscription: (userId: string) => void; updatePlan: (plan: Plan) => void; updatePayment: (cfg: PaymentMethodConfig) => void; testPayment: (key: PaymentMethodKey) => void; markRead: (id: string) => void; saveRoomProject: (p: RoomProject) => void; deleteRoomProject: (id: string) => void; reset: () => void;
}
function dbRole(role: "buyer" | "supplier" | "admin"): Role { return role === "buyer" ? "customer" : role === "supplier" ? "business" : "admin"; }

export function BackendProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(emptyDb); const [session, setSession] = useState<User | null>(null);
  const refresh = async () => {
    const client = requireSupabase(); const { data: { session: restoredSession } } = await client.auth.getSession();
    // A missing session is the expected public/visitor state, not an error.
    if (!restoredSession) { setSession(null); setDb(emptyDb()); return; }
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError?.name === "AuthSessionMissingError") { setSession(null); setDb(emptyDb()); return; }
    if (authError) throw authError;
    if (!user) { setSession(null); setDb(emptyDb()); return; }
    const [{ data: profile, error: profileError }, { data: roleRow, error: roleError }, { data: members, error: memberError }, { data: notices, error: noticeError }, { data: requests, error: requestError }, { data: quotes, error: quoteError }] = await Promise.all([
      client.from("profiles").select("display_name, phone, created_at").eq("id", user.id).single(), client.from("user_roles").select("role").eq("user_id", user.id).single(), client.from("company_members").select("company_id, companies(*)").eq("user_id", user.id), client.from("notifications").select("id, type, title, body, reference_id, read_at, created_at").eq("profile_id", user.id).order("created_at", { ascending: false }), client.from("buyer_requests").select("*, buyer_request_items(*) , request_recipients(company_id)").order("created_at", { ascending: false }), client.from("supplier_quotes").select("*, supplier_quote_items(*)").order("created_at", { ascending: false }),
    ]);
    if (profileError || roleError || memberError || noticeError || requestError || quoteError) throw profileError || roleError || memberError || noticeError || requestError || quoteError;
    const actualRole = (roleRow?.role || "buyer") as "buyer" | "supplier" | "admin";
    const current: User = { id: user.id, name: profile?.display_name || user.email || "IDEA Member", email: user.email, phone: profile?.phone || undefined, role: dbRole(actualRole), provider: "supabase", createdAt: Date.parse(profile?.created_at || user.created_at) };
    const businesses = (members || []).map((row: any): Business => { const c = Array.isArray(row.companies) ? row.companies[0] : row.companies; return { id: row.company_id, ownerId: user.id, legalName: c?.legal_name || "", publicName: c?.public_name || "", representative: "", email: c?.email || "", phone: c?.phone || "", governorate: "", serviceAreas: [], companyType: "Supplier", crNumber: "", taxNumber: "", brands: [], categories: [], productIds: [], deliveryCapacityM2: 0, minOrderM2: 0, status: c?.status === "verified" ? "Verified" : "Submitted", rating: 0, createdAt: Date.parse(c?.created_at || user.created_at) }; });
    const requestModels: QuoteRequest[] = (requests || []).flatMap((request: any) => (request.buyer_request_items || []).map((item: any) => ({ id: request.id, requestItemId: item.id, customerId: request.buyer_id, productId: item.catalog_product_id || "", variantLabel: item.variant_label || "", quantity: Number(item.requested_quantity), unit: item.unit, governorate: request.governorate, destination: request.destination || "", deliveryDate: request.delivery_date || "", projectType: request.project_type || "", phased: false, notes: request.notes || "", status: request.status === "quotes_received" ? "Offers Received" : request.status === "awaiting_quotes" ? "Awaiting Offers" : "Request Submitted", createdAt: Date.parse(request.created_at), deadlineAt: 0, matchedBusinessIds: (request.request_recipients || []).map((recipient: any) => recipient.company_id) })));
    const offerModels: Offer[] = (quotes || []).map((quote: any) => { const item = quote.supplier_quote_items?.[0]; return { id: quote.id, requestId: quote.request_id, businessId: quote.company_id, exactProduct: true, quantity: Number(item?.quoted_quantity || 0), unit: "pieces", unitPrice: Number(item?.unit_price || 0), shipping: 0, taxRate: 0, availability: quote.availability || "", prepDays: quote.lead_time_days || 0, deliveryDays: 0, paymentTerms: "", notes: quote.notes || "", expiresAt: Date.parse(quote.expires_at || quote.created_at), status: quote.status, createdAt: Date.parse(quote.created_at) }; });
    setSession(current); setDb((old) => ({ ...old, users: [current], businesses, requests: requestModels, offers: offerModels, sessionUserId: user.id, messages: (notices || []).map((n) => ({ id: n.id, to: user.id, scope: "customer", kind: n.type, title: n.title, body: n.body, requestId: n.reference_id || undefined, read: Boolean(n.read_at), createdAt: Date.parse(n.created_at) })) }));
  };
  useEffect(() => {
    if (!supabase) return;
    void refresh().catch((error) => console.error("IDEA session restore failed", error));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) { setSession(null); setDb(emptyDb()); return; }
      void refresh().catch((error) => console.error("IDEA auth update failed", error));
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const unavailable = (): never => { throw new Error(backendConfigurationError); };
  const api = useMemo<Api>(() => ({
    signIn: unavailable, signOut: () => { void requireSupabase().auth.signOut(); }, setRole: unavailable, createBusiness: unavailable, updateBusinessStatus: unavailable, connectProduct: unavailable,
    createRequest: (r) => { if (!session) return unavailable(); const pending: QuoteRequest = { ...r, id: "pending", customerId: session.id, status: "Request Submitted", createdAt: Date.now(), deadlineAt: Date.now(), matchedBusinessIds: [] }; void requireSupabase().rpc("create_buyer_request", { p_governorate: r.governorate, p_destination: r.destination || null, p_delivery_date: r.deliveryDate || null, p_project_type: r.projectType || null, p_notes: r.notes || null, p_items: [{ productId: r.productId, quantity: r.quantity, unit: r.unit, variantLabel: r.variantLabel || null }] }).then(({ error }) => { if (error) console.error("IDEA RFQ creation failed", error); else void refresh(); }); return pending; },
    submitOffer: (offer) => { const request = db.requests.find((entry) => entry.id === offer.requestId); if (!request?.requestItemId) return unavailable(); const pending: Offer = { ...offer, id: "pending", status: "submitted", createdAt: Date.now() }; void requireSupabase().rpc("submit_supplier_quote", { p_request_id: offer.requestId, p_availability: offer.availability || null, p_lead_time_days: offer.prepDays || null, p_minimum_order_quantity: null, p_notes: offer.notes || null, p_expires_at: new Date(offer.expiresAt).toISOString(), p_items: [{ requestItemId: request.requestItemId, quantity: offer.quantity, unitPrice: offer.unitPrice }] }).then(({ error }) => { if (error) console.error("IDEA quote submission failed", error); else void refresh(); }); return pending; }, acceptOffer: unavailable, sandboxPay: unavailable, subscribe: unavailable, cancelSubscription: unavailable, updatePlan: unavailable, updatePayment: unavailable, testPayment: unavailable,
    markRead: (id) => { void requireSupabase().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).then(({ error }) => { if (error) console.error("IDEA notification update failed", error); else void refresh(); }); }, saveRoomProject: unavailable, deleteRoomProject: unavailable, reset: unavailable,
  }), [db.requests, session]);
  return <Ctx.Provider value={{ db, session, api }}>{children}</Ctx.Provider>;
}
export function useBackend() { const context = useContext(Ctx); if (!context) throw new Error("useBackend must be used within BackendProvider"); return context; }
