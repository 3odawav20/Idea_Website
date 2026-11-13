import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import {
  Activity, ArrowRight, ArrowUpRight, BadgeCheck, BarChart3, Boxes, Check,
  ChevronRight, CircleAlert, ClipboardCheck, Database, Download, ExternalLink,
  Eye, EyeOff, Filter, Globe2, Image as ImageIcon, Layers3, LayoutDashboard,
  LockKeyhole, Menu, Megaphone, Package, RefreshCw, Search, Settings2, ShieldCheck,
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
const TARGET_PER_MATERIAL=2000;
const MIN_PER_MATERIAL=TARGET_PER_MATERIAL;
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
  if(!p.manufacturer?.trim())a.push("Manufacturer not verified");
  if(!p.sizes.some(s=>s.widthMm && s.heightMm))a.push("Dimensions unverified");
  if(!isValidProductImage(p.image))a.push("Missing / invalid image");
  if(!p.source?.productPageUrl)a.push("Supplier product link missing");
  if(!MATERIALS.includes(p.collection as Material))a.push("Material outside core categories");
  return a;
}
function Stat({title,value,sub,icon:Icon,accent}:{title:string;value:string|number;sub:string;icon:typeof Package;accent?:boolean}){
 return <div className={"ids-stat"+(accent?" ids-stat-accent":"")}>
   <span className="ids-stat-icon"><Icon size={20}/></span>
   <span className="ids-stat-label">{title}</span>
   <strong>{typeof value==="number"?format(value):value}</strong>
   <small>{sub}</small>
 </div>;
}
function Heading({kicker,title,sub,action}:{kicker:string;title:string;sub:string;action?:ReactNode}){
 return <div className="ids-heading">
   <div><span className="ids-kicker">{kicker}</span><h2>{title}</h2><p>{sub}</p></div>
   {action&&<div className="ids-heading-action">{action}</div>}
 </div>;
}
function Pill({ok,children}:{ok:boolean;children:ReactNode}){
 return <span className={"ids-pill "+(ok?"ids-pill-ok":"ids-pill-warn")}>{ok?<Check size={12}/>:<CircleAlert size={12}/>} {children}</span>;
}

export function AdminStudioLayout(){
 const {session}=useBackend();const [menu,setMenu]=useState(false);
 if(!session||session.role!=="admin")return <div className="ids-denied"><LockKeyhole size={30}/><h2>Restricted workspace</h2><p>This area requires an administrator role verified by the authentication server.</p><Link to="/login">Sign in <ArrowRight size={16}/></Link></div>;
 const links=[
  {to:"/admin",label:"Overview",icon:LayoutDashboard,end:true},
  {to:"/admin/companies",label:"الشركات والبراندات",icon:Building2,end:false},
  {to:"/admin/sales",label:"تحليل المبيعات",icon:BarChart3,end:false},
  {to:"/admin/search",label:"البحث بكود المنتج",icon:Search,end:false},
  {to:"/admin/announcements",label:"الشريط الإعلاني",icon:Megaphone,end:false},
  {to:"/admin/advertising",label:"طلبات الإعلانات",icon:TrendingUp,end:false},
  {to:"/admin/catalogue",label:"Products",icon:Package,end:false},
  {to:"/admin/promotions",label:"Private offers",icon:TrendingUp,end:false},
  {to:"/admin/quality",label:"Quality control",icon:ShieldCheck,end:false},
  {to:"/admin/operations",label:"Operations",icon:Truck,end:false},
  {to:"/admin/visualizer",label:"AI visualizer",icon:Sparkles,end:false},
  {to:"/admin/settings",label:"Workspace settings",icon:Settings2,end:false}
 ];
 return <div className="ids-root">
   <div className="ids-ambient one" aria-hidden="true"/><div className="ids-ambient two" aria-hidden="true"/>
   <div className="ids-layout">
    <aside className={"ids-sidebar"+(menu?" is-open":"")}>
      <div className="ids-brand"><Link to="/admin" onClick={()=>setMenu(false)}><span className="ids-brand-mark"><Layers3 size={22}/></span><span><b>IDEA<span>.</span></b><small>COMMAND CENTER</small></span></Link><button className="ids-sidebar-close" aria-label="Close menu" onClick={()=>setMenu(false)}><X size={18}/></button></div>
      <div className="ids-workspace"><span className="ids-workspace-icon"><Store size={17}/></span><span><b>IDEA Egypt</b><small>Commerce workspace</small></span><ChevronRight size={16}/></div>
      <div className="ids-nav-label">MANAGEMENT</div>
      <nav className="ids-nav">{links.map(n=><NavLink key={n.to} to={n.to} end={n.end} onClick={()=>setMenu(false)} className={({isActive})=>"ids-navlink"+(isActive?" active":"")}><n.icon size={18}/><span>{n.label}</span></NavLink>)}</nav>
      <div className="ids-sidebar-foot">
        <div className="ids-quality-promo"><span><Sparkles size={16}/> QUALITY STANDARD</span><strong>Built for precision.</strong><p>Target: 2,000 individually verified products per core material.</p><Link to="/admin/quality" onClick={()=>setMenu(false)}>View quality report <ArrowRight size={14}/></Link></div>
        <Link to="/" className="ids-back-store"><ExternalLink size={16}/> View storefront</Link>
        <div className="ids-user"><span className="ids-avatar">{(session.name||"A")[0].toUpperCase()}</span><span><b>{session.name}</b><small>Administrator</small></span><BadgeCheck size={18}/></div>
      </div>
    </aside>
    {menu&&<button className="ids-backdrop" aria-label="Close navigation" onClick={()=>setMenu(false)}/>}
    <div className="ids-main">
      <header className="ids-topbar"><div><button className="ids-hamburger" aria-label="Open admin navigation" onClick={()=>setMenu(true)}><Menu size={21}/></button><span className="ids-breadcrumb">WORKSPACE <ChevronRight size={14}/> <strong>Administrator</strong></span></div><div className="ids-topright"><span className="ids-secure"><i/> Authorized access</span><Link to="/" title="Open store" aria-label="Open store"><Globe2 size={19}/></Link></div></header>
      <div className="ids-page"><Outlet/></div>
      <div className="ids-footer"><span>© IDEA EGYPT — ADMIN WORKSPACE</span><span>Live operations depend on server policy and connectivity</span></div>
    </div>
   </div>
 </div>;
}

export function AdminStudioHome(){
 const {db}=useBackend();const {products}=useStore();
 const flags=useMemo(()=>products.reduce((n,p)=>n+(qualityFlags(p).length?1:0),0),[products]);
 const counts=useMemo(()=>Object.fromEntries(MATERIALS.map(m=>[m,products.filter(p=>p.collection===m).length])) as Record<Material,number>,[products]);
 const total=Object.values(counts).reduce((s,n)=>s+n,0);
 return <>
  <div className="ids-hero"><div><div className="ids-hero-kicker"><span className="ids-pulse"/> IDEA EGYPT / ADMIN CONSOLE</div><h1>Every detail.<br/><em>Under control.</em></h1><p>Your catalogue, performance and quality standards — brought together in one precision workspace.</p><div className="ids-hero-actions"><Link to="/admin/catalogue" className="ids-primary">Manage products <ArrowUpRight size={17}/></Link><Link to="/admin/quality" className="ids-secondary">Quality overview <ArrowRight size={17}/></Link></div></div><div className="ids-orbit" aria-hidden="true"><div className="ids-orbit-ring ring-one"/><div className="ids-orbit-ring ring-two"/><div className="ids-orbit-core"><Layers3 size={44}/></div><div className="ids-orbit-node n1"/><div className="ids-orbit-node n2"/></div></div>
  <Heading kicker="LIVE OVERVIEW" title="Store intelligence" sub="Counts below reflect products currently loaded in the storefront. Source imports in quarantine are not included."/>
  <div className="ids-stats">
    <Stat title="Storefront products" value={products.length} sub="Loaded in this session" icon={Package} accent/>
    <Stat title="Material catalogue" value={total} sub="Across four core categories" icon={Layers3}/>
    <Stat title="Quality flags" value={flags} sub="Static-field review · not image certification" icon={ShieldCheck}/>
    <Stat title="Quote requests" value={db.requests.length} sub="Returned by connected backend" icon={Activity}/>
  </div>
  <div className="ids-dashboard-grid">
    <div className="ids-panel"><div className="ids-panel-head"><div><span className="ids-kicker">CATALOGUE STATUS</span><h3>Material distribution</h3></div><Link to="/admin/catalogue" className="ids-text-link">Explore <ArrowRight size={15}/></Link></div>
      <div className="ids-material-list">{MATERIALS.map((m,i)=><div className="ids-material" key={m}><span className={"ids-material-icon m"+i}><Layers3 size={17}/></span><div className="ids-material-info"><div><b>{materialName(m)}</b><span>{format(counts[m])} / {format(MIN_PER_MATERIAL)}</span></div><div className="ids-progress"><span style={{width:(Math.min(100,counts[m]/MIN_PER_MATERIAL*100))+"%"}}/></div></div><span className="ids-material-percent">{Math.floor(counts[m]/MIN_PER_MATERIAL*100)}%</span></div>)}</div>
      <div className="ids-panel-note"><CircleAlert size={16}/> Minimum release requirement: 1,500 verified unique SKUs in each category (6,000 total). Visible counts alone do not certify readiness.</div>
    </div>
    <div className="ids-panel ids-standards"><div className="ids-panel-head"><div><span className="ids-kicker">QUALITY FRAMEWORK</span><h3>Publishing standards</h3></div><ShieldCheck size={20}/></div>
      <div className="ids-standard-total">{MATERIALS.filter(m=>counts[m]>=MIN_PER_MATERIAL).length}<small>/ 4</small></div><p>Categories meeting minimum numeric volume</p><div className="ids-standard-lines"><div><span><Check size={16}/> Distinct category targets</span><b>{format(MIN_PER_MATERIAL)}+ / each</b></div><div><span><ImageIcon size={16}/> High-quality product imagery</span><b>QA required</b></div><div><span><Database size={16}/> Source provenance</span><b>QA required</b></div><div><span><ShieldCheck size={16}/> Publication approval</span><b>Manual review</b></div></div><Link to="/admin/quality" className="ids-action-outline">Open quality control <ArrowRight size={16}/></Link>
    </div>
  </div>
  <div className="ids-panel ids-quick"><div><span className="ids-kicker">WORKFLOW</span><h3>Quick navigation</h3></div><div className="ids-quick-grid"><Link to="/admin/catalogue"><Package size={20}/><b>Product explorer</b><small>Inspect source records</small><ArrowUpRight size={17}/></Link><Link to="/admin/quality"><ClipboardCheck size={20}/><b>Quality control</b><small>Filter and export issues</small><ArrowUpRight size={17}/></Link><Link to="/admin/operations"><BarChart3 size={20}/><b>Business operations</b><small>Backend activity summary</small><ArrowUpRight size={17}/></Link></div></div>
 </>;
}

function AdminDataHeader({product}:{product:Product}){
 return <div className="ids-product-name"><span className="ids-product-thumb">{isValidProductImage(product.image)?<img src={product.image} alt="" loading="lazy"/>:<ImageIcon size={19}/>}</span><span><b>{product.name.en}</b><small>{product.slug}</small></span></div>;
}

export function AdminProducts(){
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
  return !needle||[p.name.en,p.name.ar,p.brand,p.manufacturer,p.model,p.code,p.slug].some(x=>String(x||"").toLowerCase().includes(needle));
 }),[products,q,category,quality]);
 const items=list.slice((page-1)*12,page*12);
 const exportData=()=>downloadCSV([["ID","Title","Category","Brand","Manufacturer","Model","Code","Size","URL","Source URL","Issues"],...list.map(p=>[p.id,p.name.en,p.collection,p.brand,p.manufacturer||"",p.model||"",p.code||"",p.sizes.map(s=>s.label).join(" | "),location.origin+"/product/"+p.slug,sourceLink(p),qualityFlags(p).join("; ")])],"idea-products-audit.csv");
 return <>
   <Heading kicker="CATALOGUE MANAGEMENT" title="Product intelligence" sub="Search, inspect, audit and edit sourced products. Changes require a configured and protected database."
     action={<button className="ids-action-outline" onClick={exportData}><Download size={16}/> Export CSV</button>}/>
   {dbState==="unavailable"&&<div className="ids-notice"><CircleAlert size={17}/><span>Editing unavailable until the Supabase admin migration is applied. Existing records remain unchanged. {dbError}</span></div>}
   {dbState==="ready"&&<div className="ids-oknotice"><ShieldCheck size={17}/> Protected catalogue overrides connected. A saved change updates the storefront after data refresh.</div>}
   <div className="ids-stats ids-stats-three"><Stat title="Products loaded" value={products.length} sub="Storefront inventory" icon={Boxes} accent/><Stat title="Filtered results" value={list.length} sub="Matching current filters" icon={Filter}/><Stat title="Quality issues" value={products.filter(p=>qualityFlags(p).length).length} sub="Fields needing review" icon={ClipboardCheck}/></div>
   <div className="ids-panel ids-table-panel"><div className="ids-filterbar"><label className="ids-search"><Search size={18}/><input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Search name, brand, SKU, slug..." aria-label="Search products"/></label><select aria-label="Filter material" value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}><option value="all">All materials</option>{MATERIALS.map(m=><option value={m} key={m}>{materialName(m)}</option>)}</select><select aria-label="Quality filter" value={quality} onChange={e=>{setQuality(e.target.value);setPage(1)}}><option value="all">All quality states</option><option value="issues">Needs review</option><option value="clear">No static flags</option></select></div>
   <div className="ids-table-scroll"><table className="ids-table"><thead><tr><th>PRODUCT</th><th>MATERIAL</th><th>MANUFACTURER</th><th>QUALITY</th><th>ACTIONS</th></tr></thead><tbody>
    {items.map(p=><tr key={p.id}><td><AdminDataHeader product={p}/></td><td><span className="ids-table-tag">{materialName(p.collection)}</span></td><td>{p.manufacturer||"Not verified"}</td><td><Pill ok={!qualityFlags(p).length}>{qualityFlags(p).length?qualityFlags(p).length+" flag(s)":"Fields present"}</Pill></td><td><div className="ids-row-actions"><a href={"/product/"+p.slug} target="_blank" rel="noopener noreferrer" title="Open product page" aria-label={"Open "+p.name.en}><ExternalLink size={16}/></a><button onClick={()=>setEdit(p)} title="Review and edit" aria-label={"Edit "+p.name.en}><SlidersHorizontal size={16}/></button></div></td></tr>)}
   </tbody></table>{!list.length&&<div className="ids-empty">No products match your filters.</div>}</div>
   <div className="ids-pagination"><span>Showing {list.length?(page-1)*12+1:0}–{Math.min(page*12,list.length)} of {format(list.length)}</span><div><button disabled={page===1} onClick={()=>setPage(x=>x-1)}>Previous</button><span>Page {page} of {Math.max(1,Math.ceil(list.length/12))}</span><button disabled={page>=Math.ceil(list.length/12)} onClick={()=>setPage(x=>x+1)}>Next</button></div></div>
   </div>
   {edit&&<ProductEditor product={edit} override={records.get(edit.id)} ready={dbState==="ready"} onClose={()=>setEdit(null)} onSaved={async()=>{await load();setEdit(null)}}/>}
 </>;
}
function ProductEditor({product,override,ready,onClose,onSaved}:{product:Product;override?:AdminOverride;ready:boolean;onClose:()=>void;onSaved:()=>Promise<void>}){
 const [title,setTitle]=useState(override?.name_en||product.name.en);
 const [brand,setBrand]=useState(override?.brand||product.brand);
 const [manufacturer,setManufacturer]=useState(override?.manufacturer||product.manufacturer||"");
 const [model,setModel]=useState(override?.model||product.model||"");
 const [code,setCode]=useState(override?.code||product.code||"");
 const [price,setPrice]=useState("");
 const [material,setMaterial]=useState<Material>((override?.collection||product.collection) as Material);
 const [image,setImage]=useState(override?.image_url||product.image);
 const [visible,setVisible]=useState(override?.visible!==false);
 const [proof,setProof]=useState(override?.source_proof_url||sourceLink(product));
 const [working,setWorking]=useState(false);const [error,setError]=useState("");
 useEffect(()=>{void requireSupabase().from("catalogue_admin_prices").select("price").eq("product_id",product.id).maybeSingle().then(({data})=>{if(data)setPrice(String(data.price));});},[product.id]);
 const onSave=async()=>{
  const normalizedPrice=price.trim()===""?null:Number(price);
  if(!title.trim()||!brand.trim()||!MATERIALS.includes(material)||!isValidProductImage(image)||!/^https:\/\//.test(proof)||normalizedPrice!==null&&(!Number.isFinite(normalizedPrice)||normalizedPrice<0)){setError("Valid title, brand, material, image, HTTPS evidence URL and non-negative price are required.");return}
  setWorking(true);setError("");
  try{
   const record={product_id:product.id,visible,name_en:title.trim(),brand:brand.trim(),manufacturer:manufacturer.trim()||null,model:model.trim()||null,code:code.trim()||null,collection:material,image_url:image.trim(),source_proof_url:proof.trim(),updated_at:new Date().toISOString()};
   const {error}=await requireSupabase().from("catalogue_admin_overrides").upsert(record,{onConflict:"product_id"});
   if(error)throw error;
   const priceQuery=normalizedPrice===null
    ?requireSupabase().from("catalogue_admin_prices").delete().eq("product_id",product.id)
    :requireSupabase().from("catalogue_admin_prices").upsert({product_id:product.id,price:normalizedPrice,currency:"EGP",updated_at:new Date().toISOString()},{onConflict:"product_id"});
   const {error:priceError}=await priceQuery;
   if(priceError)throw priceError;window.dispatchEvent(new Event("idea:catalogue-updated"));await onSaved();
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setWorking(false)}
 };
 return <div className="ids-modal-overlay" role="presentation" onMouseDown={onClose}><section className="ids-modal" role="dialog" aria-modal="true" aria-label="Product editor" onMouseDown={e=>e.stopPropagation()}>
 <div className="ids-modal-head"><div><span className="ids-kicker">PRODUCT CONTROL</span><h2>Manage product</h2></div><button aria-label="Close" onClick={onClose}><X size={20}/></button></div><div className="ids-modal-body"><div className="ids-editor-preview"><img src={product.image} alt={product.name.en}/><div><strong>{product.name.en}</strong><small>Source ID: {product.id}</small><Link to={"/product/"+product.slug} target="_blank">View on store <ExternalLink size={13}/></Link></div></div>
 <label className="ids-field">Product name<input value={title} onChange={e=>setTitle(e.target.value)}/></label>
 <label className="ids-field">Brand<input value={brand} onChange={e=>setBrand(e.target.value)}/></label>
 <label className="ids-field">Manufacturer<input value={manufacturer} onChange={e=>setManufacturer(e.target.value)} placeholder="Leave blank when the source does not identify it"/></label>
 <label className="ids-field">Model<input value={model} onChange={e=>setModel(e.target.value)} placeholder="Exact source model name"/></label>
 <label className="ids-field">Product code / SKU<input value={code} onChange={e=>setCode(e.target.value)} placeholder="Exact source code only"/></label>
 <label className="ids-field">Internal admin price (EGP)<input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Visible only to administrators"/></label>
 <label className="ids-field">Material<select value={material} onChange={e=>setMaterial(e.target.value as Material)}>{MATERIALS.map(m=><option value={m} key={m}>{materialName(m)}</option>)}</select></label>
 <label className="ids-field">Image URL / local image path<input value={image} onChange={e=>setImage(e.target.value)}/></label>
 <label className="ids-field">Original supplier evidence link (required)<input value={proof} onChange={e=>setProof(e.target.value)} placeholder="https://..."/></label>
 <label className="ids-toggle-line"><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/><span><strong>Visible in storefront</strong><small>Hiding a product is reversible and does not erase source data.</small></span></label>
 <p className="ids-editor-warning"><CircleAlert size={15}/> Editing metadata does not certify dimensions, rights or technical suitability. Unapproved staged imports cannot be published here.</p>
 {error&&<p className="ids-form-error" role="alert">{error}</p>}
 {!ready&&<p className="ids-form-error">Database migration / connection required before editing. Nothing will be saved locally.</p>}
 </div><div className="ids-modal-actions"><button onClick={onClose} className="ids-action-outline">Cancel</button><button onClick={()=>void onSave()} className="ids-primary" disabled={!ready||working}>{working?"Saving...":"Save to database"} <ArrowRight size={15}/></button></div>
 </section></div>;
}
export function AdminQuality(){
 const {adminProducts:products}=useStore();
 const counts=useMemo(()=>Object.fromEntries(MATERIALS.map(m=>[m,products.filter(p=>p.collection===m).length])) as Record<Material,number>,[products]);
 const flagged=useMemo(()=>products.flatMap(p=>qualityFlags(p).map(issue=>({p,issue}))),[products]);
 const [needle,setNeedle]=useState("");
 const filtered=flagged.filter(x=>!needle||x.issue.toLowerCase().includes(needle.toLowerCase())||x.p.name.en.toLowerCase().includes(needle.toLowerCase()));
 return <>
 <Heading kicker="DATA INTEGRITY" title="Quality command" sub="Measured from loaded product records. This screen does not claim a completed visual inspection or supplier-website validation." action={<button className="ids-action-outline" onClick={()=>downloadCSV([["ID","Product","Category","Issue","Source"],...filtered.map(x=>[x.p.id,x.p.name.en,x.p.collection,x.issue,sourceLink(x.p)])],"idea-qa-findings.csv")}><Download size={15}/> Export issues</button>}/>
 <div className="ids-notice"><ShieldCheck size={18}/><span>Release policy: 2,000 <b>individually verified</b> unique products per category, 8,000 total target. The numbers below are storefront counts, <b>not</b> verified approvals.</span></div>
 <div className="ids-stats ids-stats-three"><Stat icon={Package} title="Loaded products" value={products.length} sub="Storefront records" accent/><Stat icon={CircleAlert} title="Flagged fields" value={flagged.length} sub="Automatic schema checks"/><Stat icon={BadgeCheck} title="Approved target" value="8,000" sub="4 × 2,000 verified products"/></div>
 <div className="ids-dashboard-grid">
  <div className="ids-panel"><div className="ids-panel-head"><div><span className="ids-kicker">THRESHOLD TRACKER</span><h3>Four material gates</h3></div></div>
  {MATERIALS.map((m,i)=><div className="ids-quality-row" key={m}><span className={"ids-material-icon m"+i}><Layers3 size={18}/></span><div><div><strong>{materialName(m)}</strong><small>{counts[m]} loaded / {MIN_PER_MATERIAL} required</small></div><div className="ids-progress"><span style={{width:Math.min(100,counts[m]*100/MIN_PER_MATERIAL)+"%"}}/></div></div><Pill ok={false}>{counts[m]>=MIN_PER_MATERIAL?"Verify records":"Short "+format(MIN_PER_MATERIAL-counts[m])}</Pill></div>)}
  </div>
  <div className="ids-panel"><div className="ids-panel-head"><div><span className="ids-kicker">INSPECTION SCOPE</span><h3>Validation layers</h3></div></div>
   <div className="ids-checklist">{[["Category and material","Cross-check source type"],["Image relevance","Visual review pending"],["Measurements","Require original documentation"],["Internal site link","Validate route and SKU"],["Supplier URL","Inspect provenance"],["Duplicates","Confirm variants and IDs"],["Usage rights","Confirm reproduction permission"]].map(([a,b])=><div key={a}><span><CircleAlert size={16}/></span><span><b>{a}</b><small>{b}</small></span></div>)}</div>
  </div>
 </div>
 <div className="ids-panel ids-table-panel"><div className="ids-panel-head ids-flags-head"><div><span className="ids-kicker">AUTOMATED FINDINGS</span><h3>Products needing attention</h3></div><label className="ids-search"><Search size={17}/><input value={needle} onChange={e=>setNeedle(e.target.value)} placeholder="Search products / issues..." aria-label="Search quality findings"/></label></div><div className="ids-table-scroll"><table className="ids-table"><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>FLAG</th><th>LINK</th></tr></thead><tbody>{filtered.slice(0,80).map(({p,issue},i)=><tr key={p.id+"-"+i}><td><AdminDataHeader product={p}/></td><td>{materialName(p.collection)}</td><td><Pill ok={false}>{issue}</Pill></td><td><Link to={"/product/"+p.slug} target="_blank" aria-label={"View "+p.name.en}><ExternalLink size={16}/></Link></td></tr>)}</tbody></table>{!filtered.length&&<p className="ids-empty">No matching static-field issues. Manual visual and sourcing QA remain required.</p>}</div><div className="ids-pagination">{Math.min(80,filtered.length)} shown of {format(filtered.length)} issues. Export CSV for the complete result.</div></div>
 </>;
}
export function AdminOperations(){
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
 <Heading kicker="BUSINESS INTELLIGENCE" title="Operations desk" sub="Counts come from authenticated Supabase queries. If access or connection fails, no figures are invented." action={<button className="ids-action-outline" onClick={()=>void refresh()} disabled={loading}><RefreshCw size={16}/> Refresh</button>}/>
 {error&&<div className="ids-notice"><CircleAlert size={17}/>{error}</div>}
 <div className="ids-stats">{[["Suppliers","companies",Store],["Quote requests","requests",Activity],["Offers","quotes",TrendingUp],["Supplier listings","listings",Package]].map(([label,key,Icon])=><Stat key={key as string} title={label as string} value={loading?"…":metrics?metrics[key as keyof typeof metrics]:"—"} sub={metrics?"Database result":"Awaiting secure connection"} icon={Icon as typeof Package}/>)}</div>
 <div className="ids-dashboard-grid"><div className="ids-panel ids-operations-card"><BarChart3 size={29}/><span className="ids-kicker">OPERATIONS DATA</span><h3>Connect the business lifecycle</h3><p>This section reads real supplier, quote and listing totals from your database using the administrator's authenticated session. All record mutations remain under database permissions.</p><Link to="/admin/catalogue" className="ids-action-outline">Product catalogue <ArrowRight size={16}/></Link></div><div className="ids-panel ids-operations-card"><ShieldCheck size={29}/><span className="ids-kicker">SECURITY FIRST</span><h3>No simulated actions</h3><p>Financial settings, refunds, staff permissions and customer records need audited server-side workflows. No buttons on this dashboard pretend to enable an unconfigured integration.</p><Link to="/admin/settings" className="ids-action-outline">Workspace status <ArrowRight size={16}/></Link></div></div>
 </>;
}
export function AdminSettings(){
 const {session}=useBackend();
 const [state,setState]=useState("Checking database...");
 useEffect(()=>{void (async()=>{try{const {error}=await requireSupabase().from("catalogue_admin_overrides").select("product_id",{head:true,count:"exact"});if(error)throw error;setState("Admin metadata table is reachable");}catch(e){setState("Needs database migration / connection: "+(e instanceof Error?e.message:String(e)));}})()},[]);
 return <>
 <Heading kicker="CONFIGURATION" title="Workspace configuration" sub="Real integration status, administrator safeguards and available routes."/>
 <div className="ids-dashboard-grid"><div className="ids-panel ids-operations-card"><ShieldCheck size={25}/><h3>Administrator identity</h3><p>{session?.email||session?.name||"Authenticated user"}</p><Pill ok={session?.role==="admin"}>Server role: {session?.role||"unknown"}</Pill></div><div className="ids-panel ids-operations-card"><Database size={25}/><h3>Catalogue editing</h3><p>{state}</p><small>Migration: supabase/migrations/20261016_admin_catalogue_overrides.sql</small></div></div>
 <div className="ids-panel ids-settings-links"><div className="ids-panel-head"><div><span className="ids-kicker">EXISTING MODULES</span><h3>Advanced administration</h3></div></div>
  <Link to="/admin/subscriptions">Subscription plans <ArrowRight size={17}/></Link><Link to="/admin/settings/payments">Payment configurations <ArrowRight size={17}/></Link>
  <p><CircleAlert size={16}/> These legacy screens contain integrations which are not yet writable through the current Supabase API. Do not treat them as active payment processing.</p>
 </div>
 </>;
}

export function AdminVisualizer(){
  const {session}=useBackend();
  const {locale}=useI18n();
  const tr=(ar:string,en:string)=>locale==="ar"?ar:en;
  const [state,setState]=useState<"loading"|"responded"|"unavailable">("loading");
  const [detail,setDetail]=useState(tr("جاري فحص خدمة الذكاء الاصطناعي من السيرفر…","Checking the server AI adapter…"));
  const [quota,setQuota]=useState("—");
  const [provider,setProvider]=useState("—");
  const check=async()=>{
    setState("loading");
    setDetail(tr("جاري فحص الخدمة…","Checking the server adapter…"));
    setQuota("—");setProvider("—");
    if(session?.role!=="admin"){
      setState("unavailable");
      setDetail(tr("يلزم الدخول بحساب أدمن موثّق قبل فحص الخدمة.","A verified administrator session is required for the AI check."));
      return;
    }
    try{
      // The server must validate the HttpOnly PHP/MySQL session. A frontend role
      // alone never grants access, and Supabase bearer tokens are not accepted.
      const response=await fetch("/api/visualize.php?action=status",{
        method:"GET",credentials:"include",headers:{Accept:"application/json"},
        cache:"no-store",redirect:"error"
      });
      if(!(response.headers.get("content-type")||"").includes("application/json"))
        throw new Error(tr("مسار الـAI لم يُرجع استجابة JSON صالحة.","AI endpoint did not return a valid JSON response."));
      const payload=await response.json() as {
        integration?:string;provider?:string;model?:string;
        quota?:{unlimited?:boolean;remaining?:number|null;limit?:number|null};
      };
      if(!response.ok)throw new Error(tr(`فشل فحص الـAI: HTTP ${response.status}`,`AI check failed: HTTP ${response.status}`));
      if(payload.provider!=="runpod" || payload.quota?.unlimited!==true)
        throw new Error(tr("السيرفر لم يؤكد تشغيل Runpod بصلاحيات الأدمن المطلوبة.","Server did not confirm Runpod and the required admin quota."));
      setState("responded");
      setProvider("Runpod");
      setQuota(tr("غير محدود حسب السيرفر","Unlimited per server"));
      setDetail(tr(
        "الخادم أكّد الإعدادات والحصة، لكن لم يثبت نجاح توليد صورة حقيقية مع القناع. الاتصال غير معتمد للإنتاج بعد.",
        "Server confirmed configuration and quota, but a real masked-image generation has not been verified. Production AI remains unverified."
      ));
    }catch(error){
      setState("unavailable");
      setDetail(error instanceof Error?error.message:tr("خدمة الـAI غير متاحة.","AI service is unavailable."));
    }
  };
  useEffect(()=>{void check();},[session?.id,session?.role,locale]);
  return <>
    <Heading kicker="IDEA AI" title={tr("مراقبة ذكاء الصور","AI visualizer control room")} sub={tr("تقرير حالة حقيقي من السيرفر، بدون مفاتيح أو صور العملاء.","Server-backed diagnostics without exposing keys or customer imagery.")}
      action={<button className="ids-action-outline" onClick={()=>void check()} disabled={state==="loading"}><RefreshCw size={16}/>{tr("إعادة الفحص","Recheck adapter")}</button>}/>
    <div className="ids-stats ids-stats-three">
      <Stat title={tr("المزوّد","Provider")} value={provider} sub={tr("حسب رد السيرفر","Server response")} icon={Sparkles} accent/>
      <Stat title={tr("حصة الأدمن","Admin quota")} value={quota} sub={tr("غير مؤكدة حتى يرد السيرفر","Requires server confirmation")} icon={ShieldCheck}/>
      <Stat title={tr("حالة الاختبار","Worker validation")} value={tr("غير معتمد بعد","Not verified")} sub={tr("يلزم اختبار قناع وتوليد حقيقي","Real masked job required")} icon={Database}/>
    </div>
    <div className="ids-dashboard-grid">
      <div className="ids-panel ids-operations-card">
        <Activity size={29}/><h3>{state==="loading"?tr("جارٍ الفحص","Checking…"):state==="responded"?tr("الإعدادات موجودة – لم يتم التحقق من التوليد","Configured — output unverified"):tr("الخدمة غير متاحة أو غير موثقة","Service unavailable or not verified")}</h3>
        <p role="status">{detail}</p>
        <Pill ok={false}>{tr("لا توجد شهادة توليد حقيقي","No verified generation")}</Pill>
      </div>
      <div className="ids-panel ids-operations-card">
        <ShieldCheck size={29}/><h3>{tr("الصلاحيات وحصص التوليد","Role and generation policy")}</h3>
        <p>{tr("اليوزر: ٥ محاولات مدى الحياة؛ الشركات: ممنوع؛ الأدمن: غير محدود إذا أكد السيرفر. كل ده يحتاج اختبار MySQL وRunpod الحقيقي.","Customers: 5 lifetime attempts; suppliers: blocked; admin: unlimited only if the server confirms. Live MySQL and Runpod tests are still required.")}</p>
        <Link to="/ai-room-visualizer" className="ids-action-outline">{tr("فتح استوديو AI","Open AI studio")} <ArrowRight size={16}/></Link>
      </div>
    </div>
    <div className="ids-notice"><CircleAlert size={17}/><span>{tr("ظهور اسم Runpod أو إعداداته لا يثبت نجاح التوليد. لا تُعتبر الخدمة جاهزة إلا بعد اختبار مصرح به لصور أصلية وقناع صحيح وحفظ آمن.","Runpod configuration alone cannot certify a working worker. Authorized end-to-end testing must verify a masked result and private storage before launch.")}</span></div>
  </>;
}
