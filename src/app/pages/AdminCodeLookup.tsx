import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { LockKeyhole, Search, Tag } from "lucide-react";
import { useBackend } from "../backend/db";
import { requireSupabase } from "../backend/supabaseClient";
import { useStore } from "../store/store";
import { ideaInternalCode } from "../data/ideaProductIdentity";
import type { Product } from "../data/types";
import "./BusinessGrowth.css";

type Listing={id:string;company_id:string;title:string;sku:string|null;brand_name:string|null;manufacturer_name:string|null};
type Row={id:string;name:string;brand:string;sku:string;maker:string;company:string;source:string;price:number|null;url:string};
export function AdminCodeLookup(){
  const {session}=useBackend();
  const {products}=useStore();
  const [code,setCode]=useState("");
  const [rows,setRows]=useState<Row[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const search=async(event:FormEvent)=>{
    event.preventDefault();
    if(session?.role!=="admin"||!code.trim())return;
    setBusy(true);setError("");
    const q=code.trim().toLowerCase();
    try{
      const matching=products.filter(p=>[
        p.id,p.code||"",ideaInternalCode(p),p.model,p.brand,p.manufacturer||"",
      ].some(t=>t.toLowerCase()===q)||p.name.en.toLowerCase()===q).slice(0,45);
      const db=requireSupabase();
      const [cataloguePrices,supplierList]=await Promise.all([
        matching.length?db.from("catalogue_admin_prices").select("product_id,price").in("product_id",matching.map(p=>p.id)):
          Promise.resolve({data:[],error:null}),
        db.from("supplier_listings")
          .select("id,company_id,title,sku,brand_name,manufacturer_name")
          .ilike("sku",q.replaceAll("%","\\%").replaceAll("_","\\_")).limit(30)
      ]);
      if(cataloguePrices.error)throw cataloguePrices.error;
      if(supplierList.error)throw supplierList.error;
      const privatePrice=new Map((cataloguePrices.data||[]).map(p=>[p.product_id,Number(p.price)]));
      const sellerRows=(supplierList.data||[]) as Listing[];
      let listingPrices:{listing_id:string;price_egp:number}[]=[];
      let companies:{id:string;public_name:string}[]=[];
      if(sellerRows.length){
        const [pricesResult,companiesResult]=await Promise.all([
          db.from("supplier_listing_private_prices").select("listing_id,price_egp").in("listing_id",sellerRows.map(p=>p.id)),
          db.from("companies").select("id,public_name").in("id",[...new Set(sellerRows.map(p=>p.company_id))])
        ]);
        if(pricesResult.error)throw pricesResult.error;
        if(companiesResult.error)throw companiesResult.error;
        listingPrices=pricesResult.data||[];companies=companiesResult.data||[];
      }
      const listMap=new Map(listingPrices.map(p=>[p.listing_id,Number(p.price_egp)]));
      const companyNames=new Map(companies.map(c=>[c.id,c.public_name]));
      setRows([
        ...matching.map((p:Product):Row=>({
          id:p.id,name:p.name.en,brand:p.brand,sku:p.code||"غير متوفر",
          maker:p.manufacturer||"المصنع غير موثق",
          company:p.source?.provider||"مصدر الكتالوج",source:"المكتبة الرئيسية",
          price:privatePrice.get(p.id)??null,url:"/product/"+p.slug,
        })),
        ...sellerRows.map((p):Row=>({
          id:p.id,name:p.title,brand:p.brand_name||"غير معروف",
          sku:p.sku||"غير متوفر",maker:p.manufacturer_name||"المصنع غير موثق",
          company:companyNames.get(p.company_id)||"الشركة",
          source:"شركة مسجلة",price:listMap.get(p.id)??null,url:"/admin/companies",
        })),
      ]);
    }catch(e){setError(e instanceof Error?e.message:String(e));setRows([])}
    finally{setBusy(false)}
  };
  if(session?.role!=="admin")return null;
  return <section className="ibg-root" dir="rtl">
    <header className="ibg-head"><span className="ibg-kicker"><Search size={18}/> ADMIN PRODUCT LOOKUP</span>
      <h1>البحث بالكود أو البراند أو اسم المنتج</h1><p>بحث خاص بالأدمن في منتجات الكتالوج والشركات، يعرض الأسعار المحمية والتفاصيل الأصلية، دون إظهارها للزوار.</p></header>
    <form className="ibg-form" onSubmit={e=>void search(e)}>
      <label>كود المنتج أو اسم البراند بالضبط<input required value={code} onChange={e=>setCode(e.target.value)} placeholder="IDEA-REF-… / Supplier SKU / Brand"/></label>
      <button type="submit" disabled={busy}><Search size={16}/>{busy?"جاري البحث…":"ابحث بالكود"}</button>
    </form>
    {error&&<p className="ibg-error" role="alert">{error}</p>}
    <div className="ibg-list">{rows.map((item,i)=><div className="ibg-row" key={item.source+"-"+item.id+"-"+i}>
      <span><strong>{item.name}</strong><small>البراند: {item.brand} · المصنع: {item.maker}</small>
        <small>الشركة/المصدر: {item.company} · {item.source}</small><small>SKU: {item.sku}</small></span>
      <b><LockKeyhole size={14}/> السعر: {item.price===null?"غير مسجل":item.price.toLocaleString("ar-EG")+" ج.م"}</b>
      <Link to={item.url}><Tag size={15}/> التفاصيل</Link>
    </div>)}
    {!rows.length&&!error&&<p>أدخل الكود المطلوب للبحث. لم يتم عرض منتجات أو أسعار عامة.</p>}
    </div>
  </section>;
}
