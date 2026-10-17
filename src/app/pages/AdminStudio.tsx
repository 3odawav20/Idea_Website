import { useUiText as useLocaleText } from "../i18n/useUiText";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import {
  Activity, ArrowRight, ArrowUpRight, BadgeCheck, BarChart3, Boxes, Check,
  ChevronRight, CircleAlert, ClipboardCheck, Database, Download, ExternalLink,
  Eye, EyeOff, Filter, Globe2, Image as ImageIcon, Layers3, LayoutDashboard,
  LockKeyhole, Menu, Package, RefreshCw, Search, Settings2, ShieldCheck,
  SlidersHorizontal, Sparkles, Store, TrendingUp, Truck, X,
} from "lucide-react";
import { useBackend } from "../backend/db";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { requireSupabase } from "../backend/supabaseClient";
import type { Product, CollectionSlug } from "../data/types";
import type { AdminOverride } from "../data/catalogueOverrides";
import { isValidProductImage, normalizeAdminOverride } from "../data/catalogueOverrides";
import "./AdminStudio.css";

type Material = "ceramics" | "porcelain" | "tiles" | "marble";
const MATERIALS: Material[] = ["ceramics", "porcelain", "tiles", "marble"];
const MIN_PER_MATERIAL=1500;
const TARGET_PER_MATERIAL=2000;
const format=(n:number)=>new Intl.NumberFormat("en-US").format(n);
const materialName=(s:string)=>s==="marble"?"Natural marble":s.charAt(0).toUpperCase()+s.slice(1);
const styles={};

function downloadCSV(rows:string[][], filename:string){
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n");
  const u=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=u;a.download=filename;a.click();URL.revokeObjectURL(u);
}
function sourceLink(p:Product){return p.source?.productPageUrl || p.source?.originalUrl || "";}
function qualityFlags(p:Product){
  const a:string[]=[];
  if(!p.name.en.trim())a.push("Missing title");
  if(!p.approved)a.push("Not approved for storefront");
  if(!p.brand.trim())a.push("Missing brand");
  if(!p.sizes.some(s=>s.widthMm && s.heightMm))a.push("Dimensions unverified");
  if(!isValidProductImage(p.image))a.push("Missing / invalid image");
  if(!p.source?.productPageUrl)a.push("Supplier product link missing");
  if(!MATERIALS.includes(p.collection as Material))a.push("Material outside core categories");
  return a;
}
function Stat({title,value,sub,icon:Icon,accent}:{title:string;value:string|number;sub:string;icon:typeof Package;accent?:boolean}){
  const uiText = useLocaleText();

 return <div className={"ids-stat"+(accent?" ids-stat-accent":"")}>
   <span className="ids-stat-icon"><Icon size={20}/></span>
   <span className="ids-stat-label">{uiText(title)}</span>
   <strong>{uiText(typeof value==="number"?format(value):value)}</strong>
   <small>{uiText(sub)}</small>
 </div>;
}
function Heading({kicker,title,sub,action}:{kicker:string;title:string;sub:string;action?:ReactNode}){
  const uiText = useLocaleText();

 return <div className="ids-heading">
   <div><span className="ids-kicker">{uiText(kicker)}</span><h2>{uiText(title)}</h2><p>{uiText(sub)}</p></div>
   {uiText(action&&<div className="ids-heading-action">{uiText(action)}</div>)}
 </div>;
}
function Pill({ok,children}:{ok:boolean;children:ReactNode}){
  const uiText = useLocaleText();

 return <span className={"ids-pill "+(ok?"ids-pill-ok":"ids-pill-warn")}>{uiText(ok?<Check size={12}/>:<CircleAlert size={12}/>)} {uiText(children)}</span>;
}

export function AdminStudioLayout(){
  const uiText = useLocaleText();

 const {session}=useBackend();const [menu,setMenu]=useState(false);
 if(!session||session.role!=="admin")return <div className="ids-denied"><LockKeyhole size={30}/><h2>{uiText("Restricted workspace")}</h2><p>{uiText("This area requires an administrator role verified by the authentication server.")}</p><Link to="/login">{uiText("Sign in ")}<ArrowRight size={16}/></Link></div>;
 const links=[
  {to:"/admin",label:"Overview",icon:LayoutDashboard,end:true},
  {to:"/admin/catalogue",label:"Products",icon:Package,end:false},
  {to:"/admin/quality",label:"Quality control",icon:ShieldCheck,end:false},
  {to:"/admin/operations",label:"Operations",icon:Truck,end:false},
  {to:"/admin/settings",label:"Workspace settings",icon:Settings2,end:false}
 ];
 return <div className="ids-root">
   <div className="ids-ambient one" aria-hidden="true"/><div className="ids-ambient two" aria-hidden="true"/>
   <div className="ids-layout">
    <aside className={"ids-sidebar"+(menu?" is-open":"")}>
      <div className="ids-brand"><Link to="/admin" onClick={()=>setMenu(false)}><span className="ids-brand-mark"><Layers3 size={22}/></span><span><b>{uiText("IDEA")}<span>{uiText(".")}</span></b><small>{uiText("COMMAND CENTER")}</small></span></Link><button className="ids-sidebar-close" aria-label={uiText("Close menu")} onClick={()=>setMenu(false)}><X size={18}/></button></div>
      <div className="ids-workspace"><span className="ids-workspace-icon"><Store size={17}/></span><span><b>{uiText("IDEA Egypt")}</b><small>{uiText("Commerce workspace")}</small></span><ChevronRight size={16}/></div>
      <div className="ids-nav-label">{uiText("MANAGEMENT")}</div>
      <nav className="ids-nav">{uiText(links.map(n=><NavLink key={n.to} to={n.to} end={n.end} onClick={()=>setMenu(false)} className={({isActive})=>"ids-navlink"+(isActive?" active":"")}><n.icon size={18}/><span>{uiText(n.label)}</span></NavLink>))}</nav>
      <div className="ids-sidebar-foot">
        <div className="ids-quality-promo"><span><Sparkles size={16}/>{uiText(" QUALITY STANDARD")}</span><strong>{uiText("Built for precision.")}</strong><p>{uiText("Minimum 1,500 individually verified SKUs per core material.")}</p><Link to="/admin/quality" onClick={()=>setMenu(false)}>{uiText("View quality report ")}<ArrowRight size={14}/></Link></div>
        <Link to="/" className="ids-back-store"><ExternalLink size={16}/>{uiText(" View storefront")}</Link>
        <div className="ids-user"><span className="ids-avatar">{uiText((session.name||"A")[0].toUpperCase())}</span><span><b>{uiText(session.name)}</b><small>{uiText("Administrator")}</small></span><BadgeCheck size={18}/></div>
      </div>
    </aside>
    {uiText(menu&&<button className="ids-backdrop" aria-label={uiText("Close navigation")} onClick={()=>setMenu(false)}/>)}
    <div className="ids-main">
      <header className="ids-topbar"><div><button className="ids-hamburger" aria-label={uiText("Open admin navigation")} onClick={()=>setMenu(true)}><Menu size={21}/></button><span className="ids-breadcrumb">{uiText("WORKSPACE ")}<ChevronRight size={14}/> <strong>{uiText("Administrator")}</strong></span></div><div className="ids-topright"><span className="ids-secure"><i/>{uiText(" Authorized access")}</span><Link to="/" title={uiText("Open store")} aria-label={uiText("Open store")}><Globe2 size={19}/></Link></div></header>
      <div className="ids-page"><Outlet/></div>
      <div className="ids-footer"><span>{uiText("© IDEA EGYPT — ADMIN WORKSPACE")}</span><span>{uiText("Live operations depend on server policy and connectivity")}</span></div>
    </div>
   </div>
 </div>;
}

export function AdminStudioHome(){
  const uiText = useLocaleText();

 const {db}=useBackend();const {products}=useStore();
 const flags=useMemo(()=>products.reduce((n,p)=>n+(qualityFlags(p).length?1:0),0),[products]);
 const counts=useMemo(()=>Object.fromEntries(MATERIALS.map(m=>[m,products.filter(p=>p.collection===m).length])) as Record<Material,number>,[products]);
 const total=Object.values(counts).reduce((s,n)=>s+n,0);
 return <>
  <div className="ids-hero"><div><div className="ids-hero-kicker"><span className="ids-pulse"/>{uiText(" IDEA EGYPT / ADMIN CONSOLE")}</div><h1>{uiText("Every detail.")}<br/><em>{uiText("Under control.")}</em></h1><p>{uiText("Your catalogue, performance and quality standards — brought together in one precision workspace.")}</p><div className="ids-hero-actions"><Link to="/admin/catalogue" className="ids-primary">{uiText("Manage products ")}<ArrowUpRight size={17}/></Link><Link to="/admin/quality" className="ids-secondary">{uiText("Quality overview ")}<ArrowRight size={17}/></Link></div></div><div className="ids-orbit" aria-hidden="true"><div className="ids-orbit-ring ring-one"/><div className="ids-orbit-ring ring-two"/><div className="ids-orbit-core"><Layers3 size={44}/></div><div className="ids-orbit-node n1"/><div className="ids-orbit-node n2"/></div></div>
  <Heading kicker="LIVE OVERVIEW" title={uiText("Store intelligence")} sub={uiText("Counts below reflect products currently loaded in the storefront. Source imports in quarantine are not included.")}/>
  <div className="ids-stats">
    <Stat title={uiText("Storefront products")} value={products.length} sub={uiText("Loaded in this session")} icon={Package} accent/>
    <Stat title={uiText("Material catalogue")} value={total} sub={uiText("Across four core categories")} icon={Layers3}/>
    <Stat title={uiText("Quality flags")} value={flags} sub={uiText("Static-field review · not image certification")} icon={ShieldCheck}/>
    <Stat title={uiText("Quote requests")} value={db.requests.length} sub={uiText("Returned by connected backend")} icon={Activity}/>
  </div>
  <div className="ids-dashboard-grid">
    <div className="ids-panel"><div className="ids-panel-head"><div><span className="ids-kicker">{uiText("CATALOGUE STATUS")}</span><h3>{uiText("Material distribution")}</h3></div><Link to="/admin/catalogue" className="ids-text-link">{uiText("Explore ")}<ArrowRight size={15}/></Link></div>
      <div className="ids-material-list">{uiText(MATERIALS.map((m,i)=><div className="ids-material" key={m}><span className={"ids-material-icon m"+i}><Layers3 size={17}/></span><div className="ids-material-info"><div><b>{uiText(materialName(m))}</b><span>{uiText(format(counts[m]))}{uiText(" / ")}{uiText(format(MIN_PER_MATERIAL))}</span></div><div className="ids-progress"><span style={{width:(Math.min(100,counts[m]/MIN_PER_MATERIAL*100))+"%"}}/></div></div><span className="ids-material-percent">{uiText(Math.floor(counts[m]/MIN_PER_MATERIAL*100))}{uiText("%")}</span></div>))}</div>
      <div className="ids-panel-note"><CircleAlert size={16}/>{uiText(" Minimum release requirement: 1,500 verified unique SKUs in each category (6,000 total). Visible counts alone do not certify readiness.")}</div>
    </div>
    <div className="ids-panel ids-standards"><div className="ids-panel-head"><div><span className="ids-kicker">{uiText("QUALITY FRAMEWORK")}</span><h3>{uiText("Publishing standards")}</h3></div><ShieldCheck size={20}/></div>
      <div className="ids-standard-total">{uiText(MATERIALS.filter(m=>counts[m]>=MIN_PER_MATERIAL).length)}<small>{uiText("/ 4")}</small></div><p>{uiText("Categories meeting minimum numeric volume")}</p><div className="ids-standard-lines"><div><span><Check size={16}/>{uiText(" Distinct category targets")}</span><b>{uiText(format(MIN_PER_MATERIAL))}{uiText("+ / each")}</b></div><div><span><ImageIcon size={16}/>{uiText(" High-quality product imagery")}</span><b>{uiText("QA required")}</b></div><div><span><Database size={16}/>{uiText(" Source provenance")}</span><b>{uiText("QA required")}</b></div><div><span><ShieldCheck size={16}/>{uiText(" Publication approval")}</span><b>{uiText("Manual review")}</b></div></div><Link to="/admin/quality" className="ids-action-outline">{uiText("Open quality control ")}<ArrowRight size={16}/></Link>
    </div>
  </div>
  <div className="ids-panel ids-quick"><div><span className="ids-kicker">{uiText("WORKFLOW")}</span><h3>{uiText("Quick navigation")}</h3></div><div className="ids-quick-grid"><Link to="/admin/catalogue"><Package size={20}/><b>{uiText("Product explorer")}</b><small>{uiText("Inspect source records")}</small><ArrowUpRight size={17}/></Link><Link to="/admin/quality"><ClipboardCheck size={20}/><b>{uiText("Quality control")}</b><small>{uiText("Filter and export issues")}</small><ArrowUpRight size={17}/></Link><Link to="/admin/operations"><BarChart3 size={20}/><b>{uiText("Business operations")}</b><small>{uiText("Backend activity summary")}</small><ArrowUpRight size={17}/></Link></div></div>
 </>;
}

function AdminDataHeader({product}:{product:Product}){
  const uiText = useLocaleText();

 return <div className="ids-product-name"><span className="ids-product-thumb">{uiText(isValidProductImage(product.image)?<img src={product.image} alt={uiText("")} loading="lazy"/>:<ImageIcon size={19}/>)}</span><span><b>{uiText(product.name.en)}</b><small>{uiText(product.slug)}</small></span></div>;
}

export function AdminProducts(){
  const uiText = useLocaleText();

 const {adminProducts:products}=useStore();
 const [q,setQ]=useState("");const [category,setCategory]=useState("all");const [quality,setQuality]=useState("all");const [page,setPage]=useState(1);
 const [edit,setEdit]=useState<Product|null>(null);
 const [records,setRecords]=useState<Map<string,AdminOverride>>(new Map());
 const [dbState,setDbState]=useState<"loading"|"ready"|"unavailable">("loading");
 const [dbError,setDbError]=useState("");
 const load=async()=>{
  setDbState("loading");
  try{
   const {data,error}=await requireSupabase().from("catalogue_admin_overrides").select("*");
   if(error)throw error;
   setRecords(new Map((data||[]).map(d=>[d.product_id,normalizeAdminOverride(d)])));
   setDbState("ready");setDbError("");
  }catch(e){setDbState("unavailable");setDbError(e instanceof Error?e.message:String(e));}
 };
 useEffect(()=>{void load();},[]);
 const list=useMemo(()=>products.filter(p=>{
  if(category!=="all"&&p.collection!==category)return false;
  if(quality==="issues"&&!qualityFlags(p).length)return false;
  if(quality==="clear"&&qualityFlags(p).length)return false;
  const needle=q.trim().toLowerCase();
  return !needle||[p.name.en,p.name.ar,p.brand,p.model,p.code,p.slug].some(x=>String(x||"").toLowerCase().includes(needle));
 }),[products,q,category,quality]);
 const items=list.slice((page-1)*12,page*12);
 const exportData=()=>downloadCSV([["ID","Title","Category","Brand","Size","URL","Source URL","Issues"],...list.map(p=>[p.id,p.name.en,p.collection,p.brand,p.sizes.map(s=>s.label).join(" | "),location.origin+"/product/"+p.slug,sourceLink(p),qualityFlags(p).join("; ")])],"idea-products-audit.csv");
 return <>
   <Heading kicker="CATALOGUE MANAGEMENT" title={uiText("Product intelligence")} sub={uiText("Search, inspect, audit and edit sourced products. Changes require a configured and protected database.")}
     action={<button className="ids-action-outline" onClick={exportData}><Download size={16}/>{uiText(" Export CSV")}</button>}/>
   {uiText(dbState==="unavailable"&&<div className="ids-notice"><CircleAlert size={17}/><span>{uiText("Editing unavailable until the Supabase admin migration is applied. Existing records remain unchanged. ")}{uiText(dbError)}</span></div>)}
   {uiText(dbState==="ready"&&<div className="ids-oknotice"><ShieldCheck size={17}/>{uiText(" Protected catalogue overrides connected. A saved change updates the storefront after data refresh.")}</div>)}
   <div className="ids-stats ids-stats-three"><Stat title={uiText("Products loaded")} value={products.length} sub={uiText("Storefront inventory")} icon={Boxes} accent/><Stat title={uiText("Filtered results")} value={list.length} sub={uiText("Matching current filters")} icon={Filter}/><Stat title={uiText("Quality issues")} value={products.filter(p=>qualityFlags(p).length).length} sub={uiText("Fields needing review")} icon={ClipboardCheck}/></div>
   <div className="ids-panel ids-table-panel"><div className="ids-filterbar"><label className="ids-search"><Search size={18}/><input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder={uiText("Search name, brand, SKU, slug...")} aria-label={uiText("Search products")}/></label><select aria-label={uiText("Filter material")} value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}><option value="all">{uiText("All materials")}</option>{uiText(MATERIALS.map(m=><option value={m} key={m}>{uiText(materialName(m))}</option>))}</select><select aria-label={uiText("Quality filter")} value={quality} onChange={e=>{setQuality(e.target.value);setPage(1)}}><option value="all">{uiText("All quality states")}</option><option value="issues">{uiText("Needs review")}</option><option value="clear">{uiText("No static flags")}</option></select></div>
   <div className="ids-table-scroll"><table className="ids-table"><thead><tr><th>{uiText("PRODUCT")}</th><th>{uiText("MATERIAL")}</th><th>{uiText("BRAND")}</th><th>{uiText("QUALITY")}</th><th>{uiText("ACTIONS")}</th></tr></thead><tbody>
    {uiText(items.map(p=><tr key={p.id}><td><AdminDataHeader product={p}/></td><td><span className="ids-table-tag">{uiText(materialName(p.collection))}</span></td><td>{uiText(p.brand||"Unspecified")}</td><td><Pill ok={!qualityFlags(p).length}>{uiText(qualityFlags(p).length?qualityFlags(p).length+" flag(s)":"Fields present")}</Pill></td><td><div className="ids-row-actions"><a href={"/product/"+p.slug} target="_blank" rel="noopener noreferrer" title={uiText("Open product page")} aria-label={uiText("Open "+p.name.en)}><ExternalLink size={16}/></a><button onClick={()=>setEdit(p)} title={uiText("Review and edit")} aria-label={uiText("Edit "+p.name.en)}><SlidersHorizontal size={16}/></button></div></td></tr>))}
   </tbody></table>{uiText(!list.length&&<div className="ids-empty">{uiText("No products match your filters.")}</div>)}</div>
   <div className="ids-pagination"><span>{uiText("Showing ")}{uiText(list.length?(page-1)*12+1:0)}{uiText("–")}{uiText(Math.min(page*12,list.length))}{uiText(" of ")}{uiText(format(list.length))}</span><div><button disabled={page===1} onClick={()=>setPage(x=>x-1)}>{uiText("Previous")}</button><span>{uiText("Page ")}{uiText(page)}{uiText(" of ")}{uiText(Math.max(1,Math.ceil(list.length/12)))}</span><button disabled={page>=Math.ceil(list.length/12)} onClick={()=>setPage(x=>x+1)}>{uiText("Next")}</button></div></div>
   </div>
   {uiText(edit&&<ProductEditor product={edit} override={records.get(edit.id)} ready={dbState==="ready"} onClose={()=>setEdit(null)} onSaved={async()=>{await load();setEdit(null)}}/>)}
 </>;
}
function ProductEditor({product,override,ready,onClose,onSaved}:{product:Product;override?:AdminOverride;ready:boolean;onClose:()=>void;onSaved:()=>Promise<void>}){
  const uiText = useLocaleText();

 const [title,setTitle]=useState(override?.name_en||product.name.en);
 const [brand,setBrand]=useState(override?.brand||product.brand);
 const [material,setMaterial]=useState<Material>((override?.collection||product.collection) as Material);
 const [image,setImage]=useState(override?.image_url||product.image);
 const [visible,setVisible]=useState(override?.visible!==false);
 const [proof,setProof]=useState(override?.source_proof_url||sourceLink(product));
 const [working,setWorking]=useState(false);const [error,setError]=useState("");
 const onSave=async()=>{
  if(!title.trim()||!brand.trim()||!MATERIALS.includes(material)||!isValidProductImage(image)||!/^https:\/\//.test(proof)){setError("Valid title, brand, material, image and HTTPS evidence URL are required.");return}
  setWorking(true);setError("");
  try{
   const record={product_id:product.id,visible,name_en:title.trim(),brand:brand.trim(),collection:material,image_url:image.trim(),source_proof_url:proof.trim(),updated_at:new Date().toISOString()};
   const {error}=await requireSupabase().from("catalogue_admin_overrides").upsert(record,{onConflict:"product_id"});
   if(error)throw error;window.dispatchEvent(new Event("idea:catalogue-updated"));await onSaved();
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setWorking(false)}
 };
 return <div className="ids-modal-overlay" role="presentation" onMouseDown={onClose}><section className="ids-modal" role="dialog" aria-modal="true" aria-label={uiText("Product editor")} onMouseDown={e=>e.stopPropagation()}>
 <div className="ids-modal-head"><div><span className="ids-kicker">{uiText("PRODUCT CONTROL")}</span><h2>{uiText("Manage product")}</h2></div><button aria-label={uiText("Close")} onClick={onClose}><X size={20}/></button></div><div className="ids-modal-body"><div className="ids-editor-preview"><img src={product.image} alt={uiText(product.name.en)}/><div><strong>{uiText(product.name.en)}</strong><small>{uiText("Source ID: ")}{uiText(product.id)}</small><Link to={"/product/"+product.slug} target="_blank">{uiText("View on store ")}<ExternalLink size={13}/></Link></div></div>
 <label className="ids-field">{uiText("Product name")}<input value={title} onChange={e=>setTitle(e.target.value)}/></label>
 <label className="ids-field">{uiText("Brand")}<input value={brand} onChange={e=>setBrand(e.target.value)}/></label>
 <label className="ids-field">{uiText("Material")}<select value={material} onChange={e=>setMaterial(e.target.value as Material)}>{uiText(MATERIALS.map(m=><option value={m} key={m}>{uiText(materialName(m))}</option>))}</select></label>
 <label className="ids-field">{uiText("Image URL / local image path")}<input value={image} onChange={e=>setImage(e.target.value)}/></label>
 <label className="ids-field">{uiText("Original supplier evidence link (required)")}<input value={proof} onChange={e=>setProof(e.target.value)} placeholder={uiText("https://...")}/></label>
 <label className="ids-toggle-line"><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/><span><strong>{uiText("Visible in storefront")}</strong><small>{uiText("Hiding a product is reversible and does not erase source data.")}</small></span></label>
 <p className="ids-editor-warning"><CircleAlert size={15}/>{uiText(" Editing metadata does not certify dimensions, rights or technical suitability. Unapproved staged imports cannot be published here.")}</p>
 {uiText(error&&<p className="ids-form-error" role="alert">{uiText(error)}</p>)}
 {uiText(!ready&&<p className="ids-form-error">{uiText("Database migration / connection required before editing. Nothing will be saved locally.")}</p>)}
 </div><div className="ids-modal-actions"><button onClick={onClose} className="ids-action-outline">{uiText("Cancel")}</button><button onClick={()=>void onSave()} className="ids-primary" disabled={!ready||working}>{uiText(working?"Saving...":"Save to database")} <ArrowRight size={15}/></button></div>
 </section></div>;
}
export function AdminQuality(){
  const uiText = useLocaleText();

 const {adminProducts:products}=useStore();
 const counts=useMemo(()=>Object.fromEntries(MATERIALS.map(m=>[m,products.filter(p=>p.collection===m).length])) as Record<Material,number>,[products]);
 const flagged=useMemo(()=>products.flatMap(p=>qualityFlags(p).map(issue=>({p,issue}))),[products]);
 const [needle,setNeedle]=useState("");
 const filtered=flagged.filter(x=>!needle||x.issue.toLowerCase().includes(needle.toLowerCase())||x.p.name.en.toLowerCase().includes(needle.toLowerCase()));
 return <>
 <Heading kicker="DATA INTEGRITY" title={uiText("Quality command")} sub={uiText("Measured from loaded product records. This screen does not claim a completed visual inspection or supplier-website validation.")} action={<button className="ids-action-outline" onClick={()=>downloadCSV([["ID","Product","Category","Issue","Source"],...filtered.map(x=>[x.p.id,x.p.name.en,x.p.collection,x.issue,sourceLink(x.p)])],"idea-qa-findings.csv")}><Download size={15}/>{uiText(" Export issues")}</button>}/>
 <div className="ids-notice"><ShieldCheck size={18}/><span>{uiText("Release policy: 1,500 ")}<b>{uiText("individually verified")}</b>{uiText(" unique products per category, 6,000 total minimum. The numbers below are storefront counts, ")}<b>{uiText("not")}</b>{uiText(" verified approvals.")}</span></div>
 <div className="ids-stats ids-stats-three"><Stat icon={Package} title={uiText("Loaded products")} value={products.length} sub={uiText("Storefront records")} accent/><Stat icon={CircleAlert} title={uiText("Flagged fields")} value={flagged.length} sub={uiText("Automatic schema checks")}/><Stat icon={BadgeCheck} title={uiText("Approved target")} value="6,000" sub={uiText("4 × 1,500 verified products")}/></div>
 <div className="ids-dashboard-grid">
  <div className="ids-panel"><div className="ids-panel-head"><div><span className="ids-kicker">{uiText("THRESHOLD TRACKER")}</span><h3>{uiText("Four material gates")}</h3></div></div>
  {uiText(MATERIALS.map((m,i)=><div className="ids-quality-row" key={m}><span className={"ids-material-icon m"+i}><Layers3 size={18}/></span><div><div><strong>{uiText(materialName(m))}</strong><small>{uiText(counts[m])}{uiText(" loaded / ")}{uiText(MIN_PER_MATERIAL)}{uiText(" required")}</small></div><div className="ids-progress"><span style={{width:Math.min(100,counts[m]*100/MIN_PER_MATERIAL)+"%"}}/></div></div><Pill ok={false}>{uiText(counts[m]>=MIN_PER_MATERIAL?"Verify records":"Short "+format(MIN_PER_MATERIAL-counts[m]))}</Pill></div>))}
  </div>
  <div className="ids-panel"><div className="ids-panel-head"><div><span className="ids-kicker">{uiText("INSPECTION SCOPE")}</span><h3>{uiText("Validation layers")}</h3></div></div>
   <div className="ids-checklist">{uiText([["Category and material","Cross-check source type"],["Image relevance","Visual review pending"],["Measurements","Require original documentation"],["Internal site link","Validate route and SKU"],["Supplier URL","Inspect provenance"],["Duplicates","Confirm variants and IDs"],["Usage rights","Confirm reproduction permission"]].map(([a,b])=><div key={a}><span><CircleAlert size={16}/></span><span><b>{uiText(a)}</b><small>{uiText(b)}</small></span></div>))}</div>
  </div>
 </div>
 <div className="ids-panel ids-table-panel"><div className="ids-panel-head ids-flags-head"><div><span className="ids-kicker">{uiText("AUTOMATED FINDINGS")}</span><h3>{uiText("Products needing attention")}</h3></div><label className="ids-search"><Search size={17}/><input value={needle} onChange={e=>setNeedle(e.target.value)} placeholder={uiText("Search products / issues...")} aria-label={uiText("Search quality findings")}/></label></div><div className="ids-table-scroll"><table className="ids-table"><thead><tr><th>{uiText("PRODUCT")}</th><th>{uiText("CATEGORY")}</th><th>{uiText("FLAG")}</th><th>{uiText("LINK")}</th></tr></thead><tbody>{uiText(filtered.slice(0,80).map(({p,issue},i)=><tr key={p.id+"-"+i}><td><AdminDataHeader product={p}/></td><td>{uiText(materialName(p.collection))}</td><td><Pill ok={false}>{uiText(issue)}</Pill></td><td><Link to={"/product/"+p.slug} target="_blank" aria-label={uiText("View "+p.name.en)}><ExternalLink size={16}/></Link></td></tr>))}</tbody></table>{uiText(!filtered.length&&<p className="ids-empty">{uiText("No matching static-field issues. Manual visual and sourcing QA remain required.")}</p>)}</div><div className="ids-pagination">{uiText(Math.min(80,filtered.length))}{uiText(" shown of ")}{uiText(format(filtered.length))}{uiText(" issues. Export CSV for the complete result.")}</div></div>
 </>;
}
export function AdminOperations(){
  const uiText = useLocaleText();

 const [metrics,setMetrics]=useState<{companies:number;requests:number;quotes:number;listings:number}|null>(null);
 const [error,setError]=useState("");const [loading,setLoading]=useState(true);
 const refresh=async()=>{
  setLoading(true);
  try{
   const supabase=requireSupabase();
   const tables=["companies","buyer_requests","supplier_quotes","supplier_listings"];
   const responses=await Promise.all(tables.map(t=>supabase.from(t).select("*",{head:true,count:"exact"})));
   const problem=responses.find(x=>x.error);
   if(problem?.error)throw problem.error;
   setMetrics({companies:responses[0].count||0,requests:responses[1].count||0,quotes:responses[2].count||0,listings:responses[3].count||0});
   setError("");
  }catch(e){setMetrics(null);setError(e instanceof Error?e.message:String(e));}finally{setLoading(false);}
 };
 useEffect(()=>{void refresh()},[]);
 return <>
 <Heading kicker="BUSINESS INTELLIGENCE" title={uiText("Operations desk")} sub={uiText("Counts come from authenticated Supabase queries. If access or connection fails, no figures are invented.")} action={<button className="ids-action-outline" onClick={()=>void refresh()} disabled={loading}><RefreshCw size={16}/>{uiText(" Refresh")}</button>}/>
 {uiText(error&&<div className="ids-notice"><CircleAlert size={17}/>{uiText(error)}</div>)}
 <div className="ids-stats">{uiText([["Suppliers","companies",Store],["Quote requests","requests",Activity],["Offers","quotes",TrendingUp],["Supplier listings","listings",Package]].map(([label,key,Icon])=><Stat key={key as string} title={uiText(label as string)} value={loading?"…":metrics?metrics[key as keyof typeof metrics]:"—"} sub={uiText(metrics?"Database result":"Awaiting secure connection")} icon={Icon as typeof Package}/>))}</div>
 <div className="ids-dashboard-grid"><div className="ids-panel ids-operations-card"><BarChart3 size={29}/><span className="ids-kicker">{uiText("OPERATIONS DATA")}</span><h3>{uiText("Connect the business lifecycle")}</h3><p>{uiText("This section reads real supplier, quote and listing totals from your database using the administrator's authenticated session. All record mutations remain under database permissions.")}</p><Link to="/admin/catalogue" className="ids-action-outline">{uiText("Product catalogue ")}<ArrowRight size={16}/></Link></div><div className="ids-panel ids-operations-card"><ShieldCheck size={29}/><span className="ids-kicker">{uiText("SECURITY FIRST")}</span><h3>{uiText("No simulated actions")}</h3><p>{uiText("Financial settings, refunds, staff permissions and customer records need audited server-side workflows. No buttons on this dashboard pretend to enable an unconfigured integration.")}</p><Link to="/admin/settings" className="ids-action-outline">{uiText("Workspace status ")}<ArrowRight size={16}/></Link></div></div>
 </>;
}
export function AdminSettings(){
  const uiText = useLocaleText();

 const {session}=useBackend();
 const [state,setState]=useState("Checking database...");
 useEffect(()=>{void (async()=>{try{const {error}=await requireSupabase().from("catalogue_admin_overrides").select("product_id",{head:true,count:"exact"});if(error)throw error;setState("Admin metadata table is reachable");}catch(e){setState("Needs database migration / connection: "+(e instanceof Error?e.message:String(e)));}})()},[]);
 return <>
 <Heading kicker="CONFIGURATION" title={uiText("Workspace configuration")} sub={uiText("Real integration status, administrator safeguards and available routes.")}/>
 <div className="ids-dashboard-grid"><div className="ids-panel ids-operations-card"><ShieldCheck size={25}/><h3>{uiText("Administrator identity")}</h3><p>{uiText(session?.email||session?.name||"Authenticated user")}</p><Pill ok={session?.role==="admin"}>{uiText("Server role: ")}{uiText(session?.role||"unknown")}</Pill></div><div className="ids-panel ids-operations-card"><Database size={25}/><h3>{uiText("Catalogue editing")}</h3><p>{uiText(state)}</p><small>{uiText("Migration: supabase/migrations/20261016_admin_catalogue_overrides.sql")}</small></div></div>
 <div className="ids-panel ids-settings-links"><div className="ids-panel-head"><div><span className="ids-kicker">{uiText("EXISTING MODULES")}</span><h3>{uiText("Advanced administration")}</h3></div></div>
  <Link to="/admin/subscriptions">{uiText("Subscription plans ")}<ArrowRight size={17}/></Link><Link to="/admin/settings/payments">{uiText("Payment configurations ")}<ArrowRight size={17}/></Link>
  <p><CircleAlert size={16}/>{uiText(" These legacy screens contain integrations which are not yet writable through the current Supabase API. Do not treat them as active payment processing.")}</p>
 </div>
 </>;
}
