import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { accountRequest, currentAccount, type AccountSnapshot } from "./accountsApi";

export type Role = "customer" | "business" | "designer" | "contractor" | "admin";
export type Unit = "sqm" | "pieces";
export interface User { id: string; name: string; email?: string; phone?: string; role: Role; provider: string; createdAt: number; }
export type BusinessStatus = "Draft" | "Submitted" | "Under Review" | "More Information Required" | "Verified" | "Rejected" | "Suspended";
export interface Business { id: string; ownerId: string; legalName: string; publicName: string; description?: string; representative: string; email: string; phone: string; governorate: string; serviceAreas: string[]; companyType: string; crNumber: string; taxNumber: string; brands: string[]; categories: string[]; productIds: string[]; deliveryCapacityM2: number; minOrderM2: number; status: BusinessStatus; rating: number; createdAt: number; }
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
interface BackendCtx { db: DB; session: User | null; api: Api; loading: boolean; }
const Ctx = createContext<BackendCtx | null>(null);
export interface Api {
  signIn: (provider: string, role: Role, info?: { name?: string; email?: string; phone?: string }) => User;
  signOut: () => void; setRole: (role: Role) => void; createBusiness: (b: Partial<Business>) => Business; updateBusinessStatus: (id: string, status: BusinessStatus) => void; connectProduct: (bizId: string, productId: string) => void;
  createRequest: (r: Omit<QuoteRequest, "id" | "createdAt" | "status" | "deadlineAt" | "matchedBusinessIds" | "customerId">, hours: number) => QuoteRequest; submitOffer: (o: Omit<Offer, "id" | "createdAt" | "status">) => Offer; acceptOffer: (offerId: string) => Order | null;
  sandboxPay: (orderId: string, ok: boolean) => void; subscribe: (planId: string, interval: "monthly" | "annual", paid: boolean) => Subscription | null; cancelSubscription: (userId: string) => void; updatePlan: (plan: Plan) => void; updatePayment: (cfg: PaymentMethodConfig) => void; testPayment: (key: PaymentMethodKey) => void; markRead: (id: string) => void; saveRoomProject: (p: RoomProject) => void; deleteRoomProject: (id: string) => void; reset: () => void;
}
function dbRole(role: "buyer" | "supplier" | "admin"): Role { return role === "buyer" ? "customer" : role === "supplier" ? "business" : "admin"; }

export function BackendProvider({children}:{children:ReactNode}) {
  const [snapshot,setSnapshot]=useState<AccountSnapshot|null>(currentAccount),[loading,setLoading]=useState(true);
  useEffect(()=>{
    const update=()=>{setSnapshot(currentAccount());setLoading(false);};window.addEventListener('idea-account-change',update);
    void accountRequest('session').catch(()=>setSnapshot(null)).finally(()=>setLoading(false));
    return()=>window.removeEventListener('idea-account-change',update);
  },[]);
  const user=snapshot?.user,company=snapshot?.company;
  const session:User|null=user?{id:user.id,name:user.name,email:user.email,phone:user.phone,role:dbRole(user.role),provider:'IDEA',createdAt:Number(user.created_at)}:null;
  const businesses:Business[]=company?[{id:company.id,ownerId:company.owner_id,legalName:company.legal_name,publicName:company.public_name,
    description:company.description,representative:user?.name||'',email:company.email,phone:company.phone,governorate:company.business_details?.governorate||'',
    serviceAreas:[],companyType:company.business_details?.company_type||'',crNumber:'',taxNumber:'',brands:[],categories:company.business_details?.categories||[],productIds:[],deliveryCapacityM2:0,minOrderM2:0,
    status:({submitted:'Submitted',verified:'Verified',rejected:'Rejected',suspended:'Suspended',draft:'Draft'} as Record<string,BusinessStatus>)[company.status]||'Submitted',rating:0,createdAt:Number(company.created_at)}]:[];
  const db:DB={...emptyDb(),users:session?[session]:[],businesses,sessionUserId:session?.id||null};
  const unavailable=():never=>{throw new Error('This feature is not available on this hosting configuration yet.');};
  const api=useMemo<Api>(()=>({signIn:unavailable,signOut:()=>{void accountRequest('logout',{}).catch(console.error);},setRole:unavailable,createBusiness:unavailable,updateBusinessStatus:unavailable,connectProduct:unavailable,
    createRequest:unavailable,submitOffer:unavailable,acceptOffer:unavailable,sandboxPay:unavailable,subscribe:unavailable,cancelSubscription:unavailable,updatePlan:unavailable,updatePayment:unavailable,testPayment:unavailable,
    markRead:unavailable,saveRoomProject:unavailable,deleteRoomProject:unavailable,reset:unavailable}),[]);
  return <Ctx.Provider value={{db,session,api,loading}}>{children}</Ctx.Provider>;
}
export function useBackend() { const context = useContext(Ctx); if (!context) throw new Error("useBackend must be used within BackendProvider"); return context; }
