import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { BadgeCheck, CalendarDays, CircleAlert, ExternalLink, Film, Image as ImageIcon, Megaphone, Plus, Search, ShieldCheck, TrendingUp, Video } from "lucide-react";
import { useBackend } from "../backend/db";
import { apiFetch, requireSavedId } from "../backend/apiClient";
import { requireSupabase, supabase } from "../backend/supabaseClient";
import "./BusinessGrowth.css";

type Sale={company_id:string;public_name:string;orders_count:number;gross_cents:number;refund_accounting:string};
type SalesResponse={month:string;timezone:string;basis:string;rows:Sale[];caveat:string};
type Company={id:string;public_name:string};
type Announcement={id:string;text_ar:string;text_en:string;link_path:string;state:"draft"|"published"|"archived";updated_at:number|string};
type Campaign={id:string;company_id:string;placement:string;title_ar:string;title_en:string|null;status:string;media_url:string|null;proposed_budget_egp:number|null;service_fee_percent:number;message:string|null;media_storage_path:string|null};
type AdRate={placement:string;title_ar:string;title_en:string;base_rate_egp:number;duration_days:number;is_published:boolean};
const months=(s:string)=>s.slice(0,7);
const currency=(amount:number)=>new Intl.NumberFormat("ar-EG",{maximumFractionDigits:2}).format(amount)+" ج.م";
const errorText=(x:unknown)=>x instanceof Error?x.message:String(x);
const PLACEMENTS=[
  {id:"home_topline",title:"Top line",desc:"إعلان خفيف في الشريط العلوي بجانب عنوان الموقع",image:"/images/featured/tiles.webp",spec:"Banner image: 1600×240 px, WebP/JPEG, up to 3 MB"},
  {id:"new_collections",title:"New Collections",desc:"كارت مميز للبراند أو المجموعة الجديدة داخل صفحة المنتجات",image:"/images/featured/porcelain.webp",spec:"Product tile image: 1200×1200 px, WebP/JPEG, up to 5 MB"},
  {id:"home_hero_video",title:"Home video hero",desc:"فيديو أفقي كبير في الصفحة الرئيسية، ويُنشر فقط بعد موافقة IDEA",image:"/images/featured/marble.webp",spec:"Video: MP4 H.264, 1920×1080 (16:9), 6–20 sec, up to 40 MB; silent/autoplay-safe"},
  {id:"google_ads",title:"Google Ads",desc:"حملة Google Search/Display بميزانية مزاد منفصلة يحددها صاحب الشركة",image:"/images/featured/ceramics.webp",spec:"Campaign brief + landing page; final media format depends on Google Ads placement"},
  {id:"meta_ads",title:"Facebook & Instagram",desc:"حملة Meta Ads بميزانية مزاد منفصلة يحددها صاحب الشركة",image:"/images/featured/stone.webp",spec:"Creative 1080×1080 or 1080×1920 depending on placement; reviewed before publishing"},
] as const;

export function CompanyRevenueReport({mode}:{mode:"admin"|"supplier"}){
  const {session,db}=useBackend();
  const isAdmin=mode==="admin"&&session?.role==="admin";
  const [records,setRecords]=useState<Sale[]>([]);
  const [caveat,setCaveat]=useState("");
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const load=useCallback(async()=>{
    if(!session)return;
    setLoading(true);setError("");
    try{
      const company=db.businesses.find(item=>item.ownerId===session.id)||db.businesses[0];
      if(!isAdmin&&!company)throw new Error("BLOCKED: no server-confirmed company membership is available.");
      const params=new URLSearchParams({action:"sales",month:period});
      if(!isAdmin&&company)params.set("company_id",company.id);
      const response=await apiFetch<SalesResponse>(`/api/marketplace.php?${params.toString()}`,{authRequired:true});
      if(response.basis!=="captured_payments_only"||!Array.isArray(response.rows))throw new Error("PHP_SALES_RESPONSE_CONTRACT_INVALID");
      setRecords(response.rows);
      setCaveat(response.caveat);
    }catch(e){setError(errorText(e));setRecords([]);setCaveat("")}
    finally{setLoading(false)}
  },[db.businesses,isAdmin,period,session]);
  useEffect(()=>{void load()},[load]);
  const grossCents=records.reduce((sum,row)=>sum+Number(row.gross_cents),0);
  const orderCount=records.reduce((sum,row)=>sum+Number(row.orders_count),0);
  if(!session||mode==="admin"&&!isAdmin)return null;
  return <section className="ibg-root" dir="rtl">
    <header className="ibg-head"><span className="ibg-kicker"><TrendingUp size={18}/> VERIFIED SALES ONLY</span>
      <h1>{isAdmin?"تحليل مبيعات الشركات":"مبيعات شركتك الشهرية"}</h1>
      <p>الأرقام مقيدة من PHP/MySQL لعمليات الدفع المسجلة كمدفوعة. طلبات عروض الأسعار والطلبات غير المدفوعة لا تدخل في الإجمالي.</p>
    </header>
    <div className="ibg-period"><label><CalendarDays size={17}/> الشهر
      <input type="month" value={period} onChange={e=>setPeriod(e.target.value)}/></label>
      <strong>إجمالي المدفوعات المسجلة: {currency(grossCents/100)}</strong>
      <span>{orderCount} طلب مدفوع مسجل عبر الخادم</span>
      <button type="button" onClick={()=>void load()} disabled={loading}>تحديث المبيعات</button>
    </div>
    {error&&<div className="ibg-error" role="alert"><CircleAlert size={16}/>{error}</div>}
    <div className="ibg-sale-list">
      <div className="ibg-sale-row ibg-sale-label"><span>الشركة</span><span>طلبات مدفوعة</span><span>إجمالي مسجل</span><span>المرتجعات</span><span>الصافي</span></div>
      {records.map(row=><div className="ibg-sale-row" key={row.company_id}>
        <strong>{row.public_name}</strong><span>{row.orders_count}</span><span>{currency(row.gross_cents/100)}</span>
        <span>BLOCKED: غير متصالح</span><b>BLOCKED: غير متاح</b>
      </div>)}
      {!records.length&&!loading&&<p className="ibg-no-data">لا توجد سجلات مدفوعات ملتقطة في PHP/MySQL لهذه الفترة، أو أن مسار التقرير غير متاح. لن نختلق مبيعات.</p>}
    </div>
    {caveat&&<p className="ibg-note"><ShieldCheck size={16}/> {caveat} لا يُعرض صافي بعد المرتجعات قبل وجود تسوية موثقة.</p>}
  </section>;
}

export function AdminAnnouncementEditor(){
  const {session}=useBackend();
  const [rows,setRows]=useState<Announcement[]>([]);
  const [ar,setAr]=useState("");const [en,setEn]=useState("");
  const [path,setPath]=useState("");const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");const [message,setMessage]=useState("");
  const load=useCallback(async()=>{
    if(session?.role!=="admin")return;
    try{
      const response=await apiFetch<{announcements:Announcement[]}>("/api/marketplace.php?action=bootstrap",{authRequired:true});
      setRows(response.announcements||[]);setError("");
    }catch(e){setError(errorText(e));setRows([])}
  },[session?.role]);
  useEffect(()=>{void load()},[load]);
  const add=async(e:FormEvent)=>{
    e.preventDefault();if(session?.role!=="admin")return;
    setBusy(true);setError("");setMessage("");
    try{
      const result=await apiFetch<unknown>("/api/marketplace.php?action=ticker-save",{
        method:"POST",authRequired:true,body:{text_ar:ar.trim(),text_en:en.trim(),link_path:path.trim(),state:"draft"}
      });
      requireSavedId(result);setAr("");setEn("");setPath("");
      await load();setMessage("تم حفظ الإعلان كمسودة على PHP/MySQL.");
    }catch(x){setError(errorText(x))}
    finally{setBusy(false)}
  };
  const publish=async(row:Announcement)=>{
    if(session?.role!=="admin")return;
    setBusy(true);setError("");setMessage("");
    try{
      const result=await apiFetch<unknown>("/api/marketplace.php?action=ticker-save",{
        method:"POST",authRequired:true,body:{id:row.id,text_ar:row.text_ar,text_en:row.text_en,link_path:row.link_path,state:row.state==="published"?"draft":"published"}
      });
      requireSavedId(result);await load();setMessage("تم تحديث حالة النشر على PHP/MySQL.");
    }catch(x){setError(errorText(x))}
    finally{setBusy(false)}
  };
  if(session?.role!=="admin")return null;
  return <section className="ibg-root" dir="rtl">
    <header className="ibg-head"><span className="ibg-kicker"><Megaphone size={18}/> IDEA HEADER TICKER</span>
      <h1>الشريط الإعلاني الثابت</h1><p>تُحفظ الرسائل وتُنشر عبر PHP/MySQL؛ لا تُعرض تخفيضات أو مبيعات غير مؤكدة.</p></header>
    <form className="ibg-form" onSubmit={e=>void add(e)}>
      <label>الرسالة بالعربي<input required minLength={3} maxLength={500} value={ar} onChange={e=>setAr(e.target.value)} placeholder="مجموعة جديدة وصلت IDEA…"/></label>
      <label>English text<input required minLength={3} maxLength={500} value={en} onChange={e=>setEn(e.target.value)} placeholder="New collection now available…"/></label>
      <label>رابط داخلي (اختياري)<input value={path} onChange={e=>setPath(e.target.value)} placeholder="/products?category=porcelain"/></label>
      <button disabled={busy} type="submit"><Plus size={15}/> حفظ مسودة</button>
    </form>
    {error&&<div className="ibg-error" role="alert">{error}</div>}
    {message&&<div className="ibg-success" role="status">{message}</div>}
    <div className="ibg-list">{rows.map(row=><div className="ibg-row" key={row.id}>
      <span><strong>{row.text_ar}</strong><small>{row.text_en}</small></span>
      <span>{row.state==="published"?"منشور في الهيدر":row.state}</span>
      <button disabled={busy} onClick={()=>void publish(row)}>{row.state==="published"?"إيقاف النشر":"انشر في الهيدر"}</button>
    </div>)}
    {!rows.length&&<p>لا توجد رسائل محفوظة على PHP/MySQL.</p>}</div>
  </section>;
}

async function readFileHeader(file:File,length:number):Promise<Uint8Array>{
  const buf=await file.slice(0,length).arrayBuffer();
  return new Uint8Array(buf);
}

function startsWithBytes(data:Uint8Array,signature:number[]):boolean{
  if(data.length<signature.length)return false;
  for(let i=0;i<signature.length;i++)if(data[i]!==signature[i])return false;
  return true;
}

async function hasValidFileSignature(file:File):Promise<boolean>{
  const header=await readFileHeader(file,16);
  if(file.type==="image/jpeg")return startsWithBytes(header,[0xFF,0xD8,0xFF]);
  if(file.type==="image/png")return startsWithBytes(header,[0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  if(file.type==="image/webp"){
    return startsWithBytes(header,[0x52,0x49,0x46,0x46]) &&
      header[8]===0x57&&header[9]===0x45&&header[10]===0x42&&header[11]===0x50;
  }
  if(file.type==="video/mp4"){
    return header[4]===0x66&&header[5]===0x74&&header[6]===0x79&&header[7]===0x70;
  }
  return false;
}

async function validateMedia(file:File,placement:string):Promise<void>{
  const video=file.type==="video/mp4";
  const image=["image/jpeg","image/png","image/webp"].includes(file.type);
  if(!video&&!image)throw new Error("النوع المدعوم: JPG / PNG / WebP / MP4 فقط.");
  if(!(await hasValidFileSignature(file)))throw new Error("محتوى الملف لا يطابق نوعه المعلن.");
  if(file.size>(video?40:5)*1024*1024)
    throw new Error(video?"الفيديو يجب ألا يزيد عن 40MB.":"الصورة يجب ألا تزيد عن 5MB.");
  if(placement==="home_hero_video"&&!video)
    throw new Error("إعلان Hero Video يحتاج ملف MP4.");
  if(placement!=="home_hero_video"&&video&&placement!=="meta_ads"&&placement!=="google_ads")
    throw new Error("هذا المكان مخصص لصورة إعلان فقط.");
  const temp=URL.createObjectURL(file);
  try{
    if(video){
      const metadata=await new Promise<{w:number;h:number;duration:number}>((resolve,reject)=>{
        const el=document.createElement("video");el.preload="metadata";
        el.onloadedmetadata=()=>resolve({w:el.videoWidth,h:el.videoHeight,duration:el.duration});
        el.onerror=()=>reject(new Error("تعذّر فحص أبعاد الفيديو."));
        el.removeAttribute("src");
        el.srcObject=null;
        el.src=temp;
        el.load();
      });
      if(placement==="home_hero_video"&&(metadata.w!==1920||metadata.h!==1080||
        metadata.duration<6||metadata.duration>20)){
        throw new Error("فيديو Hero مطلوب 1920×1080 بالضبط، مدته 6–20 ثانية.");
      }
    }else{
      const dimensions=await new Promise<{w:number;h:number}>((resolve,reject)=>{
        const el=new Image();el.onload=()=>resolve({w:el.naturalWidth,h:el.naturalHeight});
        el.onerror=()=>reject(new Error("تعذّر قراءة أبعاد الصورة."));el.src=temp;
      });
      const required=placement==="home_topline"?[1600,240]:
        placement==="new_collections"?[1200,1200]:null;
      if(required&&(dimensions.w!==required[0]||dimensions.h!==required[1]))
        throw new Error("أبعاد الصورة غير مطابقة لمكان الإعلان المختار.");
    }
  }finally{URL.revokeObjectURL(temp)}
}

export function BusinessAdvertising({mode}:{mode:"admin"|"supplier"}){
  const {session}=useBackend();
  const isAdmin=mode==="admin"&&session?.role==="admin";
  const [companies,setCompanies]=useState<Company[]>([]);
  const [selected,setSelected]=useState("");
  const [campaigns,setCampaigns]=useState<Campaign[]>([]);
  const [rates,setRates]=useState<AdRate[]>([]);
  const [rateDrafts,setRateDrafts]=useState<Record<string,{price:string;days:string}>>({});
  const [placement,setPlacement]=useState<string>("home_hero_video");
  const [title,setTitle]=useState("");
  const [titleEn,setTitleEn]=useState("");
  const [creativeUrl,setCreativeUrl]=useState("");
  const [creativeFile,setCreativeFile]=useState<File|null>(null);
  const [approvedUrl,setApprovedUrl]=useState<Record<string,string>>({});
  const [brief,setBrief]=useState("");
  const [budget,setBudget]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const load=useCallback(async()=>{
    if(!session)return;
    try{
      const db=requireSupabase();
      const [cos,member,ads,adRates]=await Promise.all([
        db.from("companies").select("id,public_name").order("public_name"),
        db.from("company_members").select("company_id,revoked_at,member_role").eq("user_id",session.id),
        db.from("idea_company_ad_requests")
          .select("id,company_id,placement,title_ar,title_en,status,media_url,media_storage_path,proposed_budget_egp,service_fee_percent,message")
          .order("created_at",{ascending:false}).limit(200),
        db.from("idea_ad_package_rates")
          .select("placement,title_ar,title_en,base_rate_egp,duration_days,is_published"),
      ]);
      if(cos.error)throw cos.error;if(member.error)throw member.error;if(ads.error)throw ads.error;
      if(adRates.error)throw adRates.error;
      setRates((adRates.data||[]) as AdRate[]);
      const membershipIds=new Set((member.data||[]).filter(x=>!x.revoked_at).map(x=>x.company_id));
      const allowed=((cos.data||[]) as Company[]).filter(c=>isAdmin||membershipIds.has(c.id));
      setCompanies(allowed);setSelected(old=>allowed.some(x=>x.id===old)?old:(allowed[0]?.id||""));
      setCampaigns((ads.data||[]) as Campaign[]);
    }catch(e){setError(errorText(e))}
  },[session?.id,isAdmin]);
  useEffect(()=>{void load()},[load]);

  const updateRate=async(rate:AdRate,publish?:boolean)=>{
    if(!isAdmin)return;
    const draft=rateDrafts[rate.placement];
    const price=draft?Number(draft.price):Number(rate.base_rate_egp);
    const days=draft?Number(draft.days):Number(rate.duration_days);
    if(!Number.isFinite(price)||price<0||!Number.isInteger(days)||days<1||days>365){
      setError("سعر الباقة أو عدد الأيام غير صحيح.");return;
    }
    if(publish!==undefined&&!window.confirm((publish?"نشر":"إخفاء")+" سعر باقة "+rate.title_ar+"؟"))return;
    setBusy(true);setError("");
    try{
      const {error:saveError}=await requireSupabase().from("idea_ad_package_rates").update({
        base_rate_egp:price,duration_days:days,
        ...(publish===undefined?{}:{is_published:publish}),
        updated_at:new Date().toISOString(),
      }).eq("placement",rate.placement);
      if(saveError)throw saveError;
      await load();
      setMessage("تم حفظ تسعير IDEA. نشر الباقة منفصل عن موافقة الحملة والإعلان.");
    }catch(e){setError(errorText(e))}
    finally{setBusy(false)}
  };
  const submit=async(e:FormEvent)=>{
    e.preventDefault();if(!session||!selected)return;
    if(creativeUrl&&!/^https:\/\/\S+$/i.test(creativeUrl.trim())){setError("الملف لازم يكون على رابط HTTPS آمن.");return}
    if(PLATFORMS.has(placement)&&(!budget.trim()||!Number.isFinite(Number(budget))||Number(budget)<0)){setError("حدد ميزانية مبدئية للحملة.");return}
    setBusy(true);setError("");setMessage("");
    try{
      let storagePath:string|null=null;
      if(creativeFile){
        await validateMedia(creativeFile,placement);
        storagePath=selected+"/"+session.id+"/"+crypto.randomUUID()+"-"+creativeFile.name.replace(/[^a-z0-9._-]/gi,"_");
        const {error:upError}=await requireSupabase().storage.from("idea_ad_creatives").upload(storagePath,creativeFile,{contentType:creativeFile.type,upsert:false});
        if(upError)throw upError;
      }
      const {error:x}=await requireSupabase().from("idea_company_ad_requests").insert({
        company_id:selected,placement,title_ar:title.trim(),title_en:titleEn.trim()||null,
        media_url:isAdmin?(creativeUrl.trim()||null):null,media_storage_path:storagePath,
        message:[brief.trim(),creativeUrl.trim()?"Supplier suggested media URL for admin review: "+creativeUrl.trim():""].filter(Boolean).join("\n")||null,
        proposed_budget_egp:budget.trim()?Number(budget):null,
        service_fee_percent:15,status:"draft",
      });if(x)throw x;
      setTitle("");setTitleEn("");setCreativeUrl("");setCreativeFile(null);setBrief("");setBudget("");
      await load();setMessage("تم إرسال طلب الإعلان كمسودة خاصة للمراجعة، ولم يبدأ أي صرف أو نشر.");
    }catch(x){setError(errorText(x))}
    finally{setBusy(false)}
  };
  const preview=async(item:Campaign)=>{
    if(!item.media_storage_path)return;
    try{
      const {data,error:e}=await requireSupabase().storage.from("idea_ad_creatives").createSignedUrl(item.media_storage_path,180);
      if(e)throw e;
      window.open(data.signedUrl,"_blank","noopener,noreferrer");
    }catch(e){setError(errorText(e))}
  };
  const publishMedia=async(item:Campaign)=>{
    if(!isAdmin)return;
    const url=approvedUrl[item.id]?.trim()||"";
    if(!/^https:\/\/\S+$/.test(url)){setError("اكتب رابط HTTPS للملف بعد التأكد من جودته وحقوقه.");return;}
    setBusy(true);setError("");
    try{
      const {error:e}=await requireSupabase().from("idea_company_ad_requests").update({media_url:url}).eq("id",item.id);
      if(e)throw e;await load();setMessage("حُفظ رابط المادة المعتمدة؛ يجب اعتماد الحملة قبل عرضها.");
    }catch(e){setError(errorText(e))}finally{setBusy(false)}
  };
  const change=async(item:Campaign,next:"approved"|"rejected"|"live"|"paused")=>{
    if(!isAdmin)return;
    if(!window.confirm("تأكيد تحويل حالة إعلان "+item.title_ar+" إلى "+next+"؟"))return;
    setBusy(true);setError("");
    try{
      const {error:x}=await requireSupabase().rpc("idea_set_ad_status",{p_id:item.id,p_status:next});
      if(x)throw x;await load();
    }catch(x){setError(errorText(x))}
    finally{setBusy(false)}
  };
  if(!session)return null;
  return <section className="ibg-root" dir="rtl">
    <header className="ibg-head"><span className="ibg-kicker"><Megaphone size={18}/> IDEA ADVERTISING STUDIO</span>
      <h1>{isAdmin?"إعلانات الشركات وموافقات النشر":"الباكيجات والدعاية لشركتك"}</h1>
      <p>اختار المكان المناسب، وقدم المادة الإعلانية للمنصة. كل حملة لازم يراجعها أدمن IDEA قبل التشغيل.</p></header>
    <div className="ibg-packages">{PLACEMENTS.map(p=><button key={p.id} type="button" className={"ibg-package "+(placement===p.id?"chosen":"")} onClick={()=>setPlacement(p.id)}>
      <img src={p.image} alt="" loading="lazy"/>
      <div><b>{p.title}</b><p>{p.desc}</p><small>{p.spec}</small>
        {rates.find(r=>r.placement===p.id)?<strong className="ibg-package-price">{currency(Number(rates.find(r=>r.placement===p.id)!.base_rate_egp))} / {rates.find(r=>r.placement===p.id)!.duration_days} أيام {isAdmin&&!rates.find(r=>r.placement===p.id)!.is_published?"(مسودة لم تُنشر)":""}</strong>
          :<strong className="ibg-package-price">السعر بعد مراجعة الإدارة</strong>}
      </div>
    </button>)}</div>
    {isAdmin&&<section className="ibg-rates">
      <h3>تسعير IDEA الداخلي — تحكم المدير فقط</h3>
      <p>هذه أسعار مقترحة لظهور الإعلان داخل IDEA، وليست أسعار Google أو Meta. لا يراها الموردون إلا بعد النشر؛ وتحتاج كل حملة موافقة منفصلة.</p>
      <div className="ibg-rates-list">{rates.map(rate=><div className="ibg-rate-item" key={rate.placement}>
        <strong>{rate.title_ar}</strong>
        <label>السعر (جنيه)
          <input type="number" min="0" step="0.01" value={rateDrafts[rate.placement]?.price??String(rate.base_rate_egp)}
            onChange={e=>setRateDrafts(old=>({...old,[rate.placement]:{price:e.target.value,days:old[rate.placement]?.days??String(rate.duration_days)}}))}/>
        </label>
        <label>عدد أيام العرض
          <input type="number" min="1" max="365" step="1" value={rateDrafts[rate.placement]?.days??String(rate.duration_days)}
            onChange={e=>setRateDrafts(old=>({...old,[rate.placement]:{days:e.target.value,price:old[rate.placement]?.price??String(rate.base_rate_egp)}}))}/>
        </label>
        <button type="button" disabled={busy} onClick={()=>void updateRate(rate)}>حفظ</button>
        <button type="button" disabled={busy} onClick={()=>void updateRate(rate,!rate.is_published)}>
          {rate.is_published?"إخفاء السعر":"نشر السعر"}
        </button>
      </div>)}</div>
    </section>}
    <div className="ibg-note"><BadgeCheck size={17}/> IDEA تقترح أتعاب إدارة **15% من ميزانية الحملات الخارجية**، رقم مبدئي قابل لاعتماد الأدمن، وليس سعرًا من Google أو Meta. ميزانية المزاد الفعلية تختلف حسب الاستهداف والمنافسة. الأماكن داخل IDEA تحتاج عرض سعر داخلي معتمد.</div>
    {!isAdmin&&<div className="ibg-note"><Film size={17}/> **قبل تصوير فيديو الهيرو:** لازم تتواصل مع فريق IDEA برسالة من حساب الشركة لتأكيد الجودة والأبعاد والمحتوى وحقوق الاستخدام. بعد الموافقة يتم تجهيز الملف النهائي. الصورة بحد أقصى 5MB، والفيديو MP4 بجودة 1920×1080 (16:9)، طول 6–20 ثانية، بحد أقصى 40MB.</div>}
    <form className="ibg-form" onSubmit={e=>void submit(e)}>
      <label>الشركة<select value={selected} onChange={e=>setSelected(e.target.value)}>
        {companies.map(c=><option key={c.id} value={c.id}>{c.public_name}</option>)}</select></label>
      <label>مكان الإعلان<select value={placement} onChange={e=>setPlacement(e.target.value)}>
        {PLACEMENTS.map(p=><option value={p.id} key={p.id}>{p.title}</option>)}</select></label>
      <label>عنوان الإعلان (عربي)<input required minLength={3} value={title} onChange={e=>setTitle(e.target.value)}/></label>
      <label>English headline<input value={titleEn} onChange={e=>setTitleEn(e.target.value)}/></label>
      <label>ملف الإعلان للمراجعة (خاص لا ينشر تلقائيًا)<input type="file" accept="image/webp,image/jpeg,image/png,video/mp4" onChange={e=>setCreativeFile(e.target.files?.[0]||null)}/></label>
      <label>رابط خارجي معتمد، إن وجد (HTTPS)<input type="url" value={creativeUrl} onChange={e=>setCreativeUrl(e.target.value)} placeholder="https://…"/></label>
      <label>الميزانية المقترحة بالجنيه (إن وجدت)<input type="number" min="0" step="0.01" value={budget} onChange={e=>setBudget(e.target.value)}/></label>
      <label className="ibg-wide">تفاصيل الإعلان / رسالة للإدارة<textarea rows={3} value={brief} onChange={e=>setBrief(e.target.value)} placeholder="الماركة، المجموعة، التاريخ، هل تريد فيديو هيرو، وأي مواصفات فنية…"/></label>
      <button type="submit" disabled={!selected||busy}><Plus size={16}/> تسجيل طلب الإعلان للمراجعة</button>
    </form>
    {error&&<div className="ibg-error" role="alert">{error}</div>}
    {message&&<div className="ibg-success" role="status">{message}</div>}
    <div className="ibg-list"><h3>طلبات إعلانات الشركات</h3>
      {campaigns.map(item=><div className="ibg-row" key={item.id}>
        <span><strong>{item.title_ar}</strong><small>{PLACEMENTS.find(p=>p.id===item.placement)?.title||item.placement} · {companies.find(c=>c.id===item.company_id)?.public_name||item.company_id.slice(0,7)}</small>
          {item.proposed_budget_egp!==null&&<small>الميزانية المقترحة: {currency(Number(item.proposed_budget_egp))}</small>}</span>
        <b>{item.status}</b>
        {item.media_storage_path&&<button type="button" onClick={()=>void preview(item)}><Video size={14}/> معاينة الملف الخاص</button>}
        {isAdmin&&<div className="ibg-publish-url"><input type="url" placeholder="رابط النسخة النهائية بعد فحص الجودة والحقوق" value={approvedUrl[item.id]||""} onChange={e=>setApprovedUrl(x=>({...x,[item.id]:e.target.value}))}/><button disabled={busy} onClick={()=>void publishMedia(item)}>اعتماد رابط الفيديو</button></div>}
        {isAdmin&&<span className="ibg-row-actions">
          {item.status!=="approved"&&<button disabled={busy} onClick={()=>void change(item,"approved")}>اعتماد مبدئي</button>}
          {item.status==="approved"&&<button disabled={busy} onClick={()=>void change(item,"live")}>بدء العرض بعد التحقق</button>}
          {item.status==="live"&&<button disabled={busy} onClick={()=>void change(item,"paused")}>إيقاف</button>}
          {item.status!=="rejected"&&<button disabled={busy} onClick={()=>void change(item,"rejected")}>رفض</button>}
        </span>}
      </div>)}
      {!campaigns.length&&<p>لا توجد طلبات إعلانية محفوظة بعد.</p>}
    </div>
  </section>;
}
const PLATFORMS=new Set(["google_ads","meta_ads"]);
