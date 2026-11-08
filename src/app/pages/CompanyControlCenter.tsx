import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Building2, Check, CircleAlert, Layers3, LockKeyhole, Package, PauseCircle, Play, Plus, RefreshCw, Search, ShieldCheck, Tag, UserMinus, UserPlus, Users, Wallet } from "lucide-react";
import { useBackend } from "../backend/db";
import { requireSupabase } from "../backend/supabaseClient";
import "./CompanyControlCenter.css";

type Company = {id:string;public_name:string;legal_name:string;status:string;email:string|null};
type Member = {company_id:string;user_id:string;member_role:string;revoked_at:string|null};
type Listing = {id:string;company_id:string;title:string;sku:string|null;brand_name:string|null;manufacturer_name:string|null;active:boolean;approved_for_storefront:boolean;catalog_product_id:string|null;created_at:string};
type Price = {listing_id:string;price_egp:number};
type Promo = {id:string;listing_id:string;label:string;offer_price_egp:number;starts_at:string|null;ends_at:string|null;is_enabled:boolean};
const PER_PAGE=300;
const errorText=(error:unknown)=>error instanceof Error?error.message:String(error);
const brandLabel=(s:string|null)=>s?.trim()||"براند غير محدد";
const money=(n:number)=>new Intl.NumberFormat("ar-EG",{maximumFractionDigits:2}).format(n)+" ج.م";

export function CompanyControlCenter({mode}:{mode:"admin"|"supplier"}) {
  const {session}=useBackend();
  const isAdmin=mode==="admin"&&session?.role==="admin";
  const [companies,setCompanies]=useState<Company[]>([]);
  const [roles,setRoles]=useState<Member[]>([]);
  const [companyId,setCompanyId]=useState("");
  const [listings,setListings]=useState<Listing[]>([]);
  const [prices,setPrices]=useState<Price[]>([]);
  const [promos,setPromos]=useState<Promo[]>([]);
  const [members,setMembers]=useState<Member[]>([]);
  const [brand,setBrand]=useState("");
  const [filter,setFilter]=useState("");
  const [limit,setLimit]=useState(PER_PAGE);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [productName,setProductName]=useState("");
  const [productBrand,setProductBrand]=useState("");
  const [productSku,setProductSku]=useState("");
  const [editingPrice,setEditingPrice]=useState("");
  const [priceValue,setPriceValue]=useState("");
  const [editingPromo,setEditingPromo]=useState("");
  const [offerName,setOfferName]=useState("");
  const [offerAmount,setOfferAmount]=useState("");
  const [offerStart,setOfferStart]=useState("");
  const [offerEnd,setOfferEnd]=useState("");
  const [inviteEmail,setInviteEmail]=useState("");

  const company=companies.find(x=>x.id===companyId);
  const ownMember=roles.find(x=>x.company_id===companyId&&!x.revoked_at);
  const canEdit=Boolean(isAdmin||(company?.status==="verified"&&["owner","manager"].includes(ownMember?.member_role||"")));
  const canTeam=Boolean(isAdmin||ownMember?.member_role==="owner");

  const loadCompanies=useCallback(async()=>{
    if(!session)return;
    setLoading(true);setError("");
    try {
      const c=requireSupabase();
      const [co,me]=await Promise.all([
        c.from("companies").select("id,public_name,legal_name,status,email").order("public_name"),
        c.from("company_members").select("company_id,user_id,member_role,revoked_at").eq("user_id",session.id),
      ]);
      if(co.error)throw co.error;if(me.error)throw me.error;
      const memberships=(me.data||[]) as Member[];
      const allowed=new Set(memberships.filter(m=>!m.revoked_at).map(m=>m.company_id));
      const visible=isAdmin?(co.data||[]) as Company[]:((co.data||[]) as Company[]).filter(x=>allowed.has(x.id));
      setCompanies(visible);setRoles(memberships);
      setCompanyId(previous=>visible.some(x=>x.id===previous)?previous:(visible[0]?.id||""));
    }catch(e){setError(errorText(e))}
    finally{setLoading(false)}
  },[session?.id,isAdmin]);

  const loadListings=useCallback(async()=>{
    if(!companyId){setListings([]);setPrices([]);setPromos([]);setMembers([]);return}
    setLoading(true);setError("");
    try {
      const c=requireSupabase();
      const [products,team]=await Promise.all([
        c.from("supplier_listings").select("id,company_id,title,sku,brand_name,manufacturer_name,active,approved_for_storefront,catalog_product_id,created_at")
          .eq("company_id",companyId).order("created_at",{ascending:false}).range(0,limit-1),
        c.from("company_members").select("company_id,user_id,member_role,revoked_at").eq("company_id",companyId),
      ]);
      if(products.error)throw products.error;if(team.error)throw team.error;
      const items=(products.data||[]) as Listing[];
      setListings(items);setMembers((team.data||[]) as Member[]);
      if(!items.length){setPrices([]);setPromos([]);return}
      const ids=items.map(x=>x.id);
      const [costs,offers]=await Promise.all([
        c.from("supplier_listing_private_prices").select("listing_id,price_egp").in("listing_id",ids),
        c.from("supplier_listing_private_promotions").select("id,listing_id,label,offer_price_egp,starts_at,ends_at,is_enabled").in("listing_id",ids),
      ]);
      if(costs.error)throw costs.error;if(offers.error)throw offers.error;
      setPrices((costs.data||[]) as Price[]);setPromos((offers.data||[]) as Promo[]);
    }catch(e){setError(errorText(e));setPrices([]);setPromos([])}
    finally{setLoading(false)}
  },[companyId,limit]);

  useEffect(()=>{void loadCompanies()},[loadCompanies]);
  useEffect(()=>{void loadListings()},[loadListings]);
  useEffect(()=>{setBrand("");setFilter("");setLimit(PER_PAGE)},[companyId]);
  const brands=useMemo(()=>[...new Set(listings.map(x=>brandLabel(x.brand_name)))].sort(),[listings]);
  const shown=useMemo(()=>listings.filter(x=>
    (!brand||brandLabel(x.brand_name)===brand)&&
    (!filter||[x.title,x.sku||"",x.brand_name||""].some(s=>s.toLowerCase().includes(filter.trim().toLowerCase())))
  ),[listings,brand,filter]);
  const priceMap=useMemo(()=>new Map(prices.map(x=>[x.listing_id,x.price_egp])),[prices]);

  const run=async(work:()=>Promise<void>,success:string)=>{
    if(busy)return;
    setBusy(true);setError("");setNotice("");
    try{await work();await loadListings();setNotice(success)}
    catch(e){setError(errorText(e))}
    finally{setBusy(false)}
  };
  const updateCompany=async(status:"verified"|"suspended"|"submitted")=>{
    if(!isAdmin||!company||!window.confirm("تأكيد تغيير حالة "+company.public_name+" إلى "+status+"؟"))return;
    setBusy(true);setError("");
    try{
      const {error:e}=await requireSupabase().rpc("admin_set_idea_company_status",{p_company:company.id,p_status:status});
      if(e)throw e;
      await loadCompanies();setNotice("تم تغيير حالة الشركة إلى "+status);
    }catch(e){setError(errorText(e))}
    finally{setBusy(false)}
  };
  const addProduct=async(e:FormEvent)=>{
    e.preventDefault();if(!canEdit||!companyId)return;
    await run(async()=>{
      const {error:x}=await requireSupabase().from("supplier_listings").insert({
        company_id:companyId,title:productName.trim(),brand_name:productBrand.trim(),
        sku:productSku.trim()||null,active:false,
      });if(x)throw x;
      setProductName("");setProductBrand("");setProductSku("");
    },"تم حفظ المنتج كمسودة غير منشورة.");
  };
  const toggleProduct=async(p:Listing)=>run(async()=>{
    const {error:x}=await requireSupabase().from("supplier_listings").update({active:!p.active})
      .eq("id",p.id).eq("company_id",companyId);
    if(x)throw x;
  }, "تم تحديث حالة المنتج داخل سجل الشركة.");
  const approveListing=async(p:Listing)=>{
    if(!isAdmin||!window.confirm("تأكيد مراجعة/إلغاء اعتماد المنتج "+p.title+"؟"))return;
    await run(async()=>{
      const {error:x}=await requireSupabase().from("supplier_listings")
        .update({approved_for_storefront:!p.approved_for_storefront}).eq("id",p.id).eq("company_id",companyId);
      if(x)throw x;
    },"تم تحديث قرار اعتماد المنتج. التفعيل العام يتطلب شركة موثقة ومنتجًا نشطًا.");
  };
  const savePrice=async(id:string)=>{
    const value=Number(priceValue);
    if(priceValue.trim()===""||!Number.isFinite(value)||value<0){setError("أدخل سعرًا صحيحًا.");return}
    await run(async()=>{
      const {error:x}=await requireSupabase().from("supplier_listing_private_prices")
        .upsert({listing_id:id,price_egp:value},{onConflict:"listing_id"});
      if(x)throw x;
      setEditingPrice("");setPriceValue("");
    },"تم حفظ السعر في جدول الشركة الخاص؛ الزوار لا يستطيعون قراءته.");
  };
  const savePromo=async(e:FormEvent)=>{
    e.preventDefault();
    const value=Number(offerAmount);
    if(!editingPromo||!offerName.trim()||offerAmount.trim()===""||!Number.isFinite(value)||value<0||
       (offerStart&&offerEnd&&offerStart>offerEnd)){setError("راجع اسم العرض والسعر والتاريخ.");return}
    await run(async()=>{
      const {error:x}=await requireSupabase().from("supplier_listing_private_promotions").insert({
        listing_id:editingPromo,label:offerName.trim(),offer_price_egp:value,
        starts_at:offerStart||null,ends_at:offerEnd||null,is_enabled:false,
      });if(x)throw x;
      setEditingPromo("");setOfferName("");setOfferAmount("");setOfferStart("");setOfferEnd("");
    },"تم حفظ العرض كمسودة خاصة بالشركة.");
  };
  const togglePromo=async(p:Promo)=>run(async()=>{
    const {error:x}=await requireSupabase().from("supplier_listing_private_promotions")
      .update({is_enabled:!p.is_enabled}).eq("id",p.id);
    if(x)throw x;
  },"تم تحديث العرض في السجل الخاص، وليس في الأسعار العامة.");
  const invite=async(e:FormEvent)=>{
    e.preventDefault();
    if(!canTeam||!inviteEmail)return;
    await run(async()=>{
      const {error:x}=await requireSupabase().rpc("company_invite_idea_manager",{
        p_company:companyId,p_email:inviteEmail.trim(),
      });if(x)throw x;setInviteEmail("");
    },"تم تفويض مدير شركة بحساب IDEA مسجّل مسبقًا.");
  };
  const access=async(m:Member,enable:boolean)=>run(async()=>{
    const {error:x}=await requireSupabase().rpc("company_set_idea_member_access",{
      p_company:companyId,p_user:m.user_id,p_enabled:enable,
    });if(x)throw x;
  },enable?"تمت استعادة صلاحيات العضو.":"تم سحب صلاحية العضو فورًا.");

  if(!session||(mode==="supplier"&&session.role!=="business")||(mode==="admin"&&!isAdmin))
    return <div role="alert">هذه الصفحة تتطلب صلاحية الشركة أو مسؤول IDEA.</div>;

  return <section className="icc-root" dir="rtl">
    <header className="icc-top"><div><span className="icc-eyebrow"><ShieldCheck size={16}/> IDEA · COMPANY CONTROL</span>
      <h1>{isAdmin?"الشركات والبراندات والمنتجات":"إدارة منتجات شركتك"}</h1>
      <p>لكل شركة مساحتها، برانداتها، منتجاتها، أسعارها وعروضها. الأسعار خاصة ولا تظهر لعملاء الموقع.</p></div>
      <button type="button" onClick={()=>void loadCompanies()} disabled={loading||busy}><RefreshCw size={16}/> تحديث</button>
    </header>
    {error&&<div className="icc-error" role="alert"><CircleAlert size={18}/>{error} — قد تحتاج جداول الشركات لتطبيق الترحيل.</div>}
    {notice&&<div className="icc-notice" role="status"><Check size={18}/>{notice}</div>}
    <div className="icc-body">
      <aside className="icc-side">
        <div className="icc-side-heading"><Building2 size={17}/> الشركات <b>{companies.length}</b></div>
        {companies.map(c=><button type="button" className={"icc-company"+(c.id===companyId?" selected":"")} key={c.id} onClick={()=>setCompanyId(c.id)}>
          <span className="icc-logo">{c.public_name.slice(0,1).toUpperCase()}</span>
          <span><strong>{c.public_name}</strong><small>{c.status==="verified"?"موثقة":c.status==="suspended"?"موقوفة":c.status==="submitted"?"بانتظار الموافقة":c.status}</small></span>
        </button>)}
        {!companies.length&&!loading&&<p>لم يتم العثور على شركات مسجلة بعد.</p>}
        {!isAdmin&&<Link to="/business/apply"><Plus size={14}/> تسجيل شركة</Link>}
        <div className="icc-secret"><LockKeyhole size={16}/> الأسعار محفوظة بصلاحيات الشركة والإدارة فقط.</div>
      </aside>
      <main className="icc-main">
        {!company?<div className="icc-empty"><Building2 size={28}/><b>{loading?"تحميل الشركات…":"لا توجد شركة مختارة"}</b>
          {!isAdmin&&<Link to="/business/apply">تقديم طلب شركة جديدة</Link>}</div>:<>
          <div className="icc-company-title"><span className="icc-logo large">{company.public_name.slice(0,1)}</span>
            <div><span className="icc-eyebrow">COMPANY WORKSPACE</span><h2>{company.public_name}</h2>
              <p>{company.legal_name} · {company.status==="verified"?"نشطة":company.status==="suspended"?"موقوفة":"تنتظر المراجعة"}</p></div>
            {isAdmin&&<div className="icc-actions">
              {company.status!=="verified"&&<button type="button" disabled={busy} onClick={()=>void updateCompany("verified")}>اعتماد</button>}
              {company.status!=="suspended"&&<button type="button" className="danger" disabled={busy} onClick={()=>void updateCompany("suspended")}><PauseCircle size={15}/> إيقاف</button>}
              {company.status==="suspended"&&<button type="button" disabled={busy} onClick={()=>void updateCompany("submitted")}>إعادة للمراجعة</button>}
            </div>}
          </div>
          <div className="icc-stats">
            <div><Package/><strong>{listings.length}{listings.length===limit?"+":""}</strong><small>منتجات</small></div>
            <div><Layers3/><strong>{brands.length}</strong><small>براندات</small></div>
            <div><Wallet/><strong>{prices.length}</strong><small>أسعار خاصة</small></div>
            <div><Users/><strong>{members.filter(x=>!x.revoked_at).length}</strong><small>أعضاء</small></div>
          </div>
          {!canEdit&&!isAdmin&&<div className="icc-warning">الشركة الموقوفة أو غير المعتمدة يمكنها عرض بياناتها، لكن لا يمكنها تعديل المنتجات أو الأسعار.</div>}
          <div className="icc-section-title"><Tag size={17}/><h3>براندات الشركة</h3></div>
          <div className="icc-brands"><button className={!brand?"selected":""} onClick={()=>setBrand("")}>الكل <b>{listings.length}</b></button>
            {brands.map(x=><button className={brand===x?"selected":""} key={x} onClick={()=>setBrand(x)}>{x} <b>{listings.filter(p=>brandLabel(p.brand_name)===x).length}</b></button>)}
            {!brands.length&&<span>ستظهر البراندات تلقائيًا عند إضافة منتجات الشركة.</span>}
          </div>
          <div className="icc-section-title icc-filter"><div><Package size={17}/><h3>منتجات الشركة وأسعارها</h3></div>
            <label><Search size={17}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="اسم البلاطة، الماركة أو كود المورد"/></label></div>
          {canEdit&&<form className="icc-add" onSubmit={e=>void addProduct(e)}>
            <h4><Plus size={16}/> إضافة منتج إلى الشركة</h4>
            <div className="icc-fields"><label>اسم المنتج<input required minLength={2} value={productName} onChange={e=>setProductName(e.target.value)}/></label>
              <label>البراند<input required minLength={2} value={productBrand} onChange={e=>setProductBrand(e.target.value)}/></label>
              <label>كود المورد إن وجد<input value={productSku} onChange={e=>setProductSku(e.target.value)}/></label>
              <button type="submit" disabled={busy}>حفظ المنتج كمسودة</button></div>
            <small>لا ننسب المنتج لمصنع من غير دليل. إضافة المنتج لا تنشره على المتجر تلقائيًا.</small>
          </form>}
          <div className="icc-list">
            {shown.map(p=>{
              const cost=priceMap.get(p.id);const offers=promos.filter(x=>x.listing_id===p.id);
              return <article key={p.id} className="icc-product">
                <div className="icc-product-head"><div className="icc-product-icon"><Layers3 size={23}/></div>
                  <div className="icc-product-copy"><small>{brandLabel(p.brand_name)}</small>
                    <h4>{p.title}</h4><p>كود المورد: <code dir="ltr">{p.sku||"غير موثق"}</code> · مرجع IDEA: <code dir="ltr">{p.id.slice(0,8)}</code></p>
                    {p.manufacturer_name&&<p>المصنع المُسجَّل (يحتاج توثيقًا): {p.manufacturer_name}</p>}</div>
                  <span className={"icc-badge "+(p.active?"active":"")}>{p.active?(p.approved_for_storefront?"معتمد":"مفعّل داخليًا / بانتظار الجودة"):"متوقف"}</span>
                </div>
                <div className="icc-product-tools"><span><LockKeyhole size={14}/> السعر الخاص: <b>{cost===undefined?"لم يُحدد":money(cost)}</b></span>
                  {canEdit&&<button type="button" onClick={()=>{setEditingPrice(p.id);setPriceValue(cost===undefined?"":String(cost))}}>تعديل السعر</button>}
                  {canEdit&&<button type="button" onClick={()=>void toggleProduct(p)}>{p.active?<PauseCircle size={15}/>:<Play size={15}/>} {p.active?"إيقاف المنتج":"تفعيل المنتج"}</button>}
                  {isAdmin&&<button type="button" disabled={busy} onClick={()=>void approveListing(p)}><ShieldCheck size={15}/>{p.approved_for_storefront?"إلغاء اعتماد العرض":"اعتماد للعرض بعد مراجعة الصور"}</button>}
                </div>
                {canEdit&&editingPrice===p.id&&<form className="icc-inline" onSubmit={e=>{e.preventDefault();void savePrice(p.id)}}>
                  <label>السعر EGP<input type="number" min="0" step="0.01" required value={priceValue} onChange={e=>setPriceValue(e.target.value)}/></label>
                  <button type="submit" disabled={busy}>حفظ</button><button type="button" onClick={()=>setEditingPrice("")}>إلغاء</button>
                </form>}
                <div className="icc-offers"><div><b>بروموشنات المنتج ({offers.length})</b>
                  {canEdit&&<button onClick={()=>setEditingPromo(p.id)} type="button"><Plus size={14}/> إضافة عرض</button>}</div>
                  {offers.map(o=><div className="icc-offer" key={o.id}>
                    <span>{o.label}</span><b>{money(o.offer_price_egp)}</b>
                    <small>{o.starts_at||"—"} / {o.ends_at||"—"}</small>
                    <em>{o.is_enabled?"نشط في السجل الخاص":"مسودة خاصة"}</em>
                    {canEdit&&<button type="button" disabled={busy} onClick={()=>void togglePromo(o)}>{o.is_enabled?"إيقاف":"تنشيط"}</button>}
                  </div>)}
                </div>
                {canEdit&&editingPromo===p.id&&<form className="icc-inline" onSubmit={e=>void savePromo(e)}>
                  <label>عنوان العرض<input required value={offerName} onChange={e=>setOfferName(e.target.value)}/></label>
                  <label>سعر العرض EGP<input type="number" min="0" step="0.01" required value={offerAmount} onChange={e=>setOfferAmount(e.target.value)}/></label>
                  <label>بداية<input type="date" value={offerStart} onChange={e=>setOfferStart(e.target.value)}/></label>
                  <label>نهاية<input type="date" value={offerEnd} onChange={e=>setOfferEnd(e.target.value)}/></label>
                  <button type="submit" disabled={busy}>حفظ كمسودة</button><button type="button" onClick={()=>setEditingPromo("")}>إلغاء</button>
                </form>}
              </article>
            })}
            {!shown.length&&<div className="icc-empty"><Package size={25}/><b>لا توجد منتجات مطابقة حاليًا</b></div>}
            {listings.length>=limit&&<button className="icc-more" type="button" onClick={()=>setLimit(x=>x+PER_PAGE)}>عرض المزيد من المنتجات</button>}
          </div>
          <div className="icc-section-title"><Users size={17}/><h3>مديرو الشركة والمفوّضون</h3></div>
          <section className="icc-team">
            {canTeam&&company.status==="verified"&&<form className="icc-inline" onSubmit={e=>void invite(e)}>
              <label>بريد مدير لديه حساب IDEA<input type="email" required value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="manager@company.com"/></label>
              <button type="submit" disabled={busy}><UserPlus size={15}/> تفويض مدير</button>
            </form>}
            {members.map(m=><div className="icc-member" key={m.user_id}><Users size={17}/>
              <span><strong>{m.member_role==="owner"?"صاحب الشركة":m.member_role==="manager"?"مدير مفوّض":"مبيعات"}</strong><small dir="ltr">{m.user_id.slice(0,8)}…</small></span>
              <i>{m.revoked_at?"موقوف":"نشط"}</i>
              {canTeam&&m.member_role!=="owner"&&<button type="button" disabled={busy} onClick={()=>void access(m,Boolean(m.revoked_at))}>
                {m.revoked_at?<UserPlus size={15}/>:<UserMinus size={15}/>} {m.revoked_at?"استعادة الصلاحية":"إلغاء صلاحية المدير"}</button>}
            </div>)}
          </section>
        </>}
      </main>
    </div>
  </section>;
}

export function CompanyApplication(){
  const {session}=useBackend();
  const [legal,setLegal]=useState("");
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const submit=async(e:FormEvent)=>{
    e.preventDefault();if(!session)return;
    setBusy(true);setError("");setMessage("");
    try{
      const {data,error:x}=await requireSupabase().rpc("apply_for_idea_company",{
        p_legal_name:legal.trim(),p_public_name:name.trim(),p_email:email.trim()||null,
      });
      if(x)throw x;
      setMessage("تم تسجيل طلب الشركة رقم "+String(data).slice(0,8)+". يحتاج اعتماد مسؤول IDEA قبل إدارة المنتجات.");
    }catch(x){setError(errorText(x))}
    finally{setBusy(false)}
  };
  return <div className="icc-apply" dir="rtl"><div className="icc-apply-card">
    <span className="icc-eyebrow"><ShieldCheck size={16}/> COMPANY ONBOARDING</span>
    <h1>إضافة شركتك إلى IDEA</h1><p>كل شركة لها صفحة منتجات وبراندات وأسعار خاصة. طلب التسجيل لا يمنح صلاحيات أدمن أو ينشر منتجات تلقائيًا.</p>
    {!session?<p>سجّل دخولك أولًا: <Link to="/register/business">إنشاء حساب</Link> أو <Link to="/login">تسجيل الدخول</Link>.</p>:
    <form onSubmit={e=>void submit(e)}>
      <label>الاسم القانوني<input required minLength={2} maxLength={160} value={legal} onChange={e=>setLegal(e.target.value)}/></label>
      <label>اسم الشركة الظاهر للزوار<input required minLength={2} maxLength={160} value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>بريد الشركة<input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <button type="submit" disabled={busy}>تقديم طلب الانضمام</button>
    </form>}
    {error&&<div className="icc-error" role="alert">{error}</div>}
    {message&&<div className="icc-notice" role="status">{message}</div>}
  </div></div>;
}
