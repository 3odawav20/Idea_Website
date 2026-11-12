import { useCallback, useEffect, useState } from "react";
import { CircleAlert, ExternalLink, LockKeyhole, RefreshCw, Trash2 } from "lucide-react";
import { useBackend } from "../backend/db";
import { requireSupabase } from "../backend/supabaseClient";
import "./AdminStudio.css";
import "./AdminPromotions.css";

type Promotion = {
  id: string;
  product_id: string;
  source_id: string;
  source_product_url: string;
  offer_label: string;
  standard_price: number | null;
  promotional_price: number;
  currency: "EGP";
  starts_at: string | null;
  ends_at: string | null;
  review_status: "draft" | "verified" | "rejected";
  created_at: string;
};
type Draft = {
  product_id: string; source_id: string; source_product_url: string;
  offer_label: string; standard_price: string; promotional_price: string;
  starts_at: string; ends_at: string;
};
const EMPTY: Draft = {
  product_id:"", source_id:"", source_product_url:"", offer_label:"",
  standard_price:"", promotional_price:"", starts_at:"", ends_at:"",
};
function validate(d: Draft): string | null {
  const regular=d.standard_price.trim()===""?null:Number(d.standard_price);
  const offer=d.promotional_price.trim()===""?NaN:Number(d.promotional_price);
  if(!d.product_id.trim()||!d.source_id.trim()||!d.offer_label.trim())
    return "Product ID, supplier/source ID and offer label are required.";
  if(!/^https:\/\/[^\s/]+/.test(d.source_product_url))
    return "Original HTTPS supplier product URL is required.";
  if(!Number.isFinite(offer)||offer<0||(regular!==null&&(!Number.isFinite(regular)||regular<offer)))
    return "Enter a non-negative price, no higher than the regular price.";
  if(d.starts_at&&d.ends_at&&d.starts_at>d.ends_at)
    return "The end date cannot precede the start date.";
  return null;
}
export function AdminPromotions() {
  const {session}=useBackend();
  const [offers,setOffers]=useState<Promotion[]>([]);
  const [draft,setDraft]=useState<Draft>(EMPTY);
  const [state,setState]=useState<"loading"|"ready"|"unavailable">("loading");
  const [working,setWorking]=useState(false);
  const [message,setMessage]=useState("");
  const refresh=useCallback(async()=>{
    setState("loading");
    try{
      const {data,error}=await requireSupabase().from("catalogue_admin_promotions")
        .select("id,product_id,source_id,source_product_url,offer_label,standard_price,promotional_price,currency,starts_at,ends_at,review_status,created_at")
        .order("created_at",{ascending:false}).limit(200);
      if(error)throw error;
      setOffers((data||[]) as Promotion[]);
      setState("ready");setMessage("");
    }catch(e){setState("unavailable");setMessage(e instanceof Error?e.message:String(e))}
  },[]);
  useEffect(()=>{if(session?.role==="admin")void refresh()},[session?.role,refresh]);
  if(session?.role!=="admin")return <div className="ids-denied">
    <LockKeyhole size={28}/><h2>Administrator access only</h2>
    <p>Private supplier prices cannot be read without server-side permissions.</p>
  </div>;
  const field=(key:keyof Draft,value:string)=>setDraft(previous=>({...previous,[key]:value}));
  const save=async()=>{
    const errorMessage=validate(draft);
    if(errorMessage){setMessage(errorMessage);return}
    if(state!=="ready"){setMessage("Private promotions database is not connected.");return}
    setWorking(true);setMessage("");
    try{
      const {error}=await requireSupabase().from("catalogue_admin_promotions").insert({
        product_id:draft.product_id.trim(),source_id:draft.source_id.trim(),
        source_product_url:draft.source_product_url.trim(),offer_label:draft.offer_label.trim(),
        standard_price:draft.standard_price.trim()===""?null:Number(draft.standard_price),
        promotional_price:Number(draft.promotional_price),currency:"EGP",
        starts_at:draft.starts_at||null,ends_at:draft.ends_at||null,review_status:"draft"
      });
      if(error)throw error;
      setDraft(EMPTY);await refresh();
      setMessage("Saved as a PRIVATE DRAFT. No public promotion was published.");
    }catch(e){setMessage(e instanceof Error?e.message:String(e))}
    finally{setWorking(false)}
  };
  const erase=async(item:Promotion)=>{
    if(state!=="ready"||!window.confirm("Delete private draft "+item.offer_label+"?"))return;
    setWorking(true);
    try{
      const {error}=await requireSupabase().from("catalogue_admin_promotions").delete().eq("id",item.id);
      if(error)throw error;
      await refresh();setMessage("Private draft deleted.");
    }catch(e){setMessage(e instanceof Error?e.message:String(e))}
    finally{setWorking(false)}
  };
  return <section className="idea-admin-promos">
    <div className="ids-heading"><div><span className="ids-kicker">PRIVATE FINANCIAL REVIEW</span>
      <h2>Supplier prices & promotions</h2>
      <p>Source-backed prices, discounts and promotion dates. Offers stay admin-only drafts and never appear on the public catalogue automatically.</p>
    </div><button type="button" className="ids-action-outline" onClick={()=>void refresh()} disabled={working||state==="loading"}>
      <RefreshCw size={15}/> Refresh</button></div>
    <div className="ids-notice"><LockKeyhole size={18}/><span>
      Database row-level security, not the menu, protects pricing. The current source list contains no verified promotion prices to import automatically.
    </span></div>
    {state==="unavailable"&&<div className="ids-notice" role="alert"><CircleAlert size={18}/>
      Private promotions table is not connected. Apply its migration before saving. {message}
    </div>}
    {state==="loading"&&<p aria-live="polite">Checking protected offers…</p>}
    <div className="ids-panel"><div className="ids-panel-head"><div><span className="ids-kicker">ADD REVIEW RECORD</span>
      <h3>Register a supplier offer</h3></div></div>
      <form className="idea-admin-promos-form" onSubmit={e=>{e.preventDefault();void save()}}>
        <label className="ids-field">IDEA product / review ID<input value={draft.product_id} onChange={e=>field("product_id",e.target.value)} placeholder="IDEA-QA-…" required/></label>
        <label className="ids-field">Supplier source ID<input value={draft.source_id} onChange={e=>field("source_id",e.target.value)} placeholder="source-08" required/></label>
        <label className="ids-field idea-admin-promos-wide">Original supplier product URL<input type="url" value={draft.source_product_url} onChange={e=>field("source_product_url",e.target.value)} placeholder="https://supplier.example/product" required/></label>
        <label className="ids-field idea-admin-promos-wide">Promotion name<input value={draft.offer_label} onChange={e=>field("offer_label",e.target.value)} placeholder="Exact supplier offer title" required/></label>
        <label className="ids-field">Regular price (EGP), if proven<input type="number" min="0" step="0.01" value={draft.standard_price} onChange={e=>field("standard_price",e.target.value)}/></label>
        <label className="ids-field">Offer price (EGP)<input type="number" min="0" step="0.01" required value={draft.promotional_price} onChange={e=>field("promotional_price",e.target.value)}/></label>
        <label className="ids-field">Start date<input type="date" value={draft.starts_at} onChange={e=>field("starts_at",e.target.value)}/></label>
        <label className="ids-field">End date<input type="date" value={draft.ends_at} onChange={e=>field("ends_at",e.target.value)}/></label>
        <div className="idea-admin-promos-actions"><button type="submit" className="ids-primary" disabled={working||state!=="ready"}>{working?"Saving…":"Save private draft"}</button></div>
      </form>
      {message&&state==="ready"&&<p role="status" className="idea-admin-promos-message">{message}</p>}
    </div>
    <div className="ids-panel ids-table-panel">
      <div className="ids-panel-head ids-flags-head"><div><span className="ids-kicker">ADMIN-ONLY REGISTER</span><h3>Supplier offers ({offers.length})</h3></div></div>
      <div className="ids-table-scroll"><table className="ids-table"><thead><tr><th>PRODUCT / SOURCE</th><th>PROMOTION</th><th>REGULAR</th><th>OFFER</th><th>STATE</th><th>ACTIONS</th></tr></thead><tbody>
      {offers.map(item=><tr key={item.id}>
        <td><strong>{item.product_id}</strong><div>{item.source_id}</div></td>
        <td>{item.offer_label}</td>
        <td>{item.standard_price===null?"—":String(item.standard_price)+" EGP"}</td>
        <td><strong>{item.promotional_price} EGP</strong></td>
        <td><span className="ids-table-tag">{item.review_status}</span></td>
        <td><div className="ids-row-actions">
          <a href={item.source_product_url} target="_blank" rel="noopener noreferrer" aria-label="Open supplier source"><ExternalLink size={15}/></a>
          <button type="button" disabled={working} onClick={()=>void erase(item)} aria-label={"Delete "+item.offer_label}><Trash2 size={15}/></button>
        </div></td></tr>)}
      </tbody></table>
      {!offers.length&&state==="ready"&&<p className="ids-empty">No private offers saved. Prices are never invented from unverified source records.</p>}
      </div>
    </div>
  </section>;
}
