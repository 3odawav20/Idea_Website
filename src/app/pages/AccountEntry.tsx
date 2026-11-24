import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, ChevronDown,
  Eye, EyeOff, FileCheck2, FileText, Globe2, Heart, Home, Layers3,
  LockKeyhole, Mail, MapPin, Package, ShieldCheck, Shield, Truck,
  UploadCloud, UserRound, Users, Warehouse, Factory, Network,
  SlidersHorizontal, KeyRound
} from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useTheme } from "../theme/theme";
import { SocialAuth } from "../components/SocialAuth";
import { useBackend } from "../backend/db";
import { authenticatePhp, uploadBusinessDocument } from "../backend/phpAccounts";
import "./AccountEntry.css";

type Audience = "customer" | "business" | "admin";
type Mode = "register" | "login";
type Txt = { ar: string; en: string; fr?: string };
const msg = (ar:string,en:string,fr?:string):Txt => ({ar,en,fr});
const content = (value:Txt,locale:"ar"|"en"|"fr") =>
  locale==="ar"?value.ar:locale==="fr"?(value.fr??value.en):value.en;
const PHONE_COUNTRIES = [
  {country:"EG", dial:"+20", label:"Egypt"},
  {country:"SA", dial:"+966",label:"Saudi Arabia"},
  {country:"AE", dial:"+971",label:"UAE"},
  {country:"KW", dial:"+965",label:"Kuwait"},
  {country:"QA", dial:"+974",label:"Qatar"},
  {country:"JO", dial:"+962",label:"Jordan"}
] as const;

const CUSTOMER_FEATURES = [
  {icon:Home,title:msg("خطط لتشطيب منزلك","Plan your home finishes"),desc:msg("استلهم أفكارًا لتشطيب متكامل لشقتك أو منزلك.","Discover complete finishing ideas for your home.")},
  {icon:Package,title:msg("تابع طلباتك بسهولة","Track your orders easily"),desc:msg("ابقَ على اطلاع بحالة طلباتك من الشراء حتى التوصيل.","Follow your orders from purchase to delivery.")},
  {icon:Heart,title:msg("احفظ اختياراتك المفضلة","Save your favorites"),desc:msg("أنشئ قائمة بمفضلاتك من التصاميم والخامات للرجوع إليها لاحقًا.","Keep your preferred materials and designs in one place.")},
];
const BUSINESS_FEATURES = [
  {icon:FileText,title:msg("طلبات عروض الأسعار (RFQ)","Quotation requests (RFQ)"),desc:msg("أرسل واستقبل عروض الأسعار بسهولة","Send and receive quotations easily")},
  {icon:Layers3,title:msg("أسعار الجملة والمشاريع","Wholesale & project pricing"),desc:msg("أسعار خاصة لشركاء الأعمال","Special trade-partner pricing")},
  {icon:Network,title:msg("الوصول إلى شبكة الموردين","Supplier network access"),desc:msg("تواصل مباشر مع الموردين المعتمدين","Connect with approved suppliers")},
  {icon:Package,title:msg("طلبات الكميات الكبيرة","Bulk orders"),desc:msg("حلول مرنة للمشاريع الكبيرة","Flexible solutions for large projects")}
];
const ADMIN_FEATURES = [
  {icon:SlidersHorizontal,title:msg("تحكم كامل بالمنصة","Full platform control"),desc:msg("إدارة المنتجات والطلبات والمحتوى والمستخدمين من مكان واحد.","Manage products, orders, content and users.")},
  {icon:Users,title:msg("صلاحيات متقدمة","Advanced permissions"),desc:msg("إدارة آمنة ومتدرجة لصلاحيات فريق العمل.","Secure, tiered team permissions.")},
  {icon:ShieldCheck,title:msg("وصول آمن ومحمي","Secure access"),desc:msg("حماية متعددة الطبقات والتحقق الثنائي.","Layered protection and two-factor verification.")}
];


function FeatureItems({ audience,locale }: {audience:Audience;locale:"ar"|"en"|"fr"}) {
  const features=audience==="customer"?CUSTOMER_FEATURES:audience==="business"?BUSINESS_FEATURES:ADMIN_FEATURES;
  return <div className={"idea-auth-feature-list idea-auth-feature-list--"+audience}>
    {features.map(item=><div className="idea-auth-feature" key={item.title.en}>
      <item.icon aria-hidden="true" size={29} strokeWidth={1.7}/>
      <strong>{content(item.title,locale)}</strong>
      <small>{content(item.desc,locale)}</small>
    </div>)}
  </div>;
}
function FormField({ id, label,icon:Icon, type="text",value,onChange,autoComplete,placeholder,required=true, children }:
{ id:string;label:string;icon:typeof Home;type?:string;value:string;onChange:(v:string)=>void;autoComplete?:string;placeholder?:string;required?:boolean;children?:React.ReactNode}) {
  return <label className="idea-auth-field" htmlFor={id}>
    <span className="idea-auth-label">{label}{required&&<em aria-hidden="true"> *</em>}</span>
    <span className="idea-auth-input-wrap">
      <Icon size={17} aria-hidden="true"/>
      <input id={id} name={id} type={type} value={value} required={required} autoComplete={autoComplete} placeholder={placeholder||label} onChange={e=>onChange(e.currentTarget.value)} />
      {children}
    </span>
  </label>;
}

export function AccountEntry({audience, mode="register", googleLoginSlot}:{audience:Audience;mode?:Mode;googleLoginSlot?:ReactNode}) {
  const {locale}=useI18n();
  const {mode:theme}=useTheme();
  const navigate=useNavigate();
  const { refresh }=useBackend();
  const isAdmin=audience==="admin",isBusiness=audience==="business",isCustomer=audience==="customer";
  const isRegister=mode==="register"&&!isAdmin;
  const tr=(ar:string,en:string,fr=en)=>content(msg(ar,en,fr),locale);
  const [name,setName]=useState("");
  const [company,setCompany]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [dial,setDial]=useState("+20");
  const [password,setPassword]=useState("");
  const [confirmation,setConfirmation]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [showConfirmation,setShowConfirmation]=useState(false);
  const [businessKind,setBusinessKind]=useState("");
  const [country,setCountry]=useState("");
  const [city,setCity]=useState("");
  const [license,setLicense]=useState("");
  const [docs,setDocs]=useState<File[]>([]);
  const [consent,setConsent]=useState(false);
  const [remember,setRemember]=useState(true);
  const [otp,setOtp]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const selectedTitle=useMemo(()=>{
    if(isAdmin)return tr("دخول الإدارة","Admin access");
    if(isBusiness)return isRegister?tr("تسجيل حساب شركة","Register a company"):tr("دخول حساب الشركة","Business sign in");
    return isRegister?tr("إنشاء حساب جديد","Create a new account"):tr("تسجيل الدخول","Sign in");
  },[audience,mode,locale]);
  const onSubmit=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();setError("");setNotice("");
    if(isRegister&&password!==confirmation){setError(tr("كلمتا المرور غير متطابقتين.","Passwords do not match."));return;}
    if(password.length<8){setError(tr("كلمة المرور يجب ألا تقل عن 8 أحرف.","Password must be at least 8 characters."));return;}
    if(isRegister&&!consent){setError(tr("يجب الموافقة على الشروط وسياسة الخصوصية.","Accept the terms and privacy policy."));return;}
    if(isBusiness&&isRegister){
      if(!company.trim()||!name.trim()||!businessKind||!country||!city.trim()||!license.trim()){
        setError(tr("أكمل بيانات الشركة المطلوبة.","Complete the required company details."));return;
      }
      if(!docs.length){setError(tr("ارفع مستندًا داعمًا واحدًا على الأقل.","Upload at least one supporting document."));return;}
    }
    setBusy(true);
    try{
      const payload:Record<string,unknown>={email:email.trim(),password};
      if(isRegister){
        payload.display_name=name.trim();
        payload.account_type=isBusiness?"business":"customer";
        payload.phone=dial+phone.trim();
        if(isBusiness){
          const kinds:Record<string,{activity:string;category:string}>={
            ceramic:{activity:"retailer",category:"ceramic"},
            factory:{activity:"manufacturer",category:"ceramic"},
            marble:{activity:"wholesaler",category:"marble"},
            distributor:{activity:"wholesaler",category:"ceramic"},
            wholesale:{activity:"wholesaler",category:"ceramic"}
          };
          const choice=kinds[businessKind];
          if(!choice)throw new Error("INVALID_COMPANY_TYPE");
          payload.company_name=company.trim();
          payload.legal_name=company.trim();
          payload.business_profile={
            company_type:choice.activity,categories:[choice.category],primary_category:choice.category,
            contract_volume:"prefer_not_to_say",commercial_registration:license.trim(),
            governorate:city.trim(),service_areas:country,industry:businessKind
          };
        }
      }
      if(isRegister)payload.consent=true;
      if(isAdmin){payload.otp=otp.trim();payload.remember_device=remember;}
      const account=await authenticatePhp(isRegister?"register":"login",payload);
      const role=account.user?.role;
      if(!role)throw new Error("ACCOUNT_ROLE_NOT_CONFIRMED");
      if(isAdmin&&role!=="admin")throw new Error("ADMIN_ACCESS_REQUIRED");
      if(isBusiness&&role!=="supplier")throw new Error("BUSINESS_ACCOUNT_REQUIRED");
      if(isCustomer&&role!=="buyer")throw new Error("CUSTOMER_ACCOUNT_REQUIRED");
      const verifiedSession=await refresh();
      const expectedRole=role==="supplier"?"business":role==="buyer"?"customer":"admin";
      if(!verifiedSession||verifiedSession.id!==String(account.user?.id)||verifiedSession.role!==expectedRole)throw new Error("ACCOUNT_SESSION_MISSING");
      if(isBusiness&&isRegister){
        let uploaded=0;
        try{
          for(const file of docs){
            await uploadBusinessDocument(file, "commercial_registration");
            uploaded++;
          }
        }catch(err){
          setError(tr("تم إنشاء حساب الشركة لكن رفع المستندات غير مكتمل. يمكنك تسجيل الدخول لاستكمال التحقق.","Business account created; document upload is incomplete. Sign in to complete verification."));
          setNotice(tr("المستندات المرفوعة: "+uploaded+" من "+docs.length,"Documents uploaded: "+uploaded+" of "+docs.length));
          return;
        }
      }
      navigate(role==="admin"?"/admin":role==="supplier"?"/business":"/account");
    }catch(err){
      const reason=err instanceof Error?err.message:"ACCOUNT_REQUEST_FAILED";
      const messages:Record<string,string>={
        INVALID_FIELDS:tr("راجع بيانات التسجيل المطلوبة.","Check the required fields."),
        INVALID_LOGIN:tr("البريد الإلكتروني أو كلمة المرور غير صحيحة.","Incorrect email or password."),
        ACCOUNT_EXISTS:tr("البريد الإلكتروني مسجل بالفعل.","This email is already registered."),
        INVALID_CSRF:tr("انتهت جلسة الأمان. حاول مجددًا.","Security session expired. Please retry."),
        ACCOUNT_SESSION_MISSING:tr("تعذر تأكيد جلسة الحساب. حاول تسجيل الدخول مرة أخرى.","Could not verify your account session. Please sign in again."),
        CSRF_INVALID:tr("انتهت جلسة الأمان. حاول مجددًا.","Security session expired. Please retry."),
        ACCOUNT_API_NON_JSON:tr("خدمة الحسابات غير متاحة على هذا الخادم.","Account API is not available on this host."),
        ADMIN_ACCESS_REQUIRED:tr("استخدم بوابة الإدارة بحساب مسؤول.","An administrator account is required."),
        BUSINESS_ACCOUNT_REQUIRED:tr("استخدم حساب شركة.","A business account is required."),
        CUSTOMER_ACCOUNT_REQUIRED:tr("استخدم حساب عميل.","A customer account is required."),
        ACCOUNTS_UNAVAILABLE:tr("خدمة الحسابات غير متاحة الآن.","Account service is temporarily unavailable."),
        TRY_LATER:tr("محاولات كثيرة. جرّب لاحقًا.","Too many attempts. Try later.")
      };
      setError(messages[reason]||reason);
    }finally{setBusy(false);}
  };
  const onDocuments=(files:FileList|null)=>{
    const list=Array.from(files||[]);
    const valid=list.every(f=>f.size<=10*1024*1024&&/^(application\/pdf|image\/jpeg|image\/png)$/i.test(f.type));
    if(!valid){setError(tr("PDF أو JPG أو PNG فقط، وبحد أقصى 10 ميجابايت لكل ملف.","PDF, JPG or PNG only; 10 MB maximum per file."));return;}
    setError("");setDocs(list.slice(0,5));
  };
  const goto=isAdmin?"/admin/login":isBusiness?"/register/business":"/register/customer";
  const heroHeading = isAdmin
    ? [tr("لوحة تحكم منصة IDEA","IDEA platform control"),tr("إدارة كاملة... رؤية أشمل.","Complete control. Clearer vision.")]
    : isBusiness
    ? [tr("تسجيل حساب شركة","Register your business"),tr("انضم إلى شبكة الأعمال في IDEA","Join IDEA's business network")]
    : [tr("أنشئ حسابك","Create your account"),tr("كعميل منزلي","For your home")];

  return <section className={"idea-auth-scene idea-auth-scene--"+audience+" idea-auth-scene--"+theme+" idea-auth-scene--"+(isRegister?"register":"login")} dir={locale==="ar"?"rtl":"ltr"} aria-label={selectedTitle}>
    <div className="idea-auth-content">
      <div className="idea-auth-visual">
        <div className="idea-auth-photo" role="img" aria-label={isAdmin?tr("مقر إدارة المنصة","IDEA management office"):isBusiness?tr("مصنع وشحنات الرخام والسيراميك","Ceramic and marble factory"):tr("اختيار تشطيبات المنزل","Home finishing selections")}/>
        {!isAdmin&&<div className="idea-auth-copy">
          {isAdmin&&<p className="idea-auth-eyebrow">IDEA ADMIN CONTROL</p>}
          <h1>{heroHeading[0]} <span>{heroHeading[1]}</span></h1>
          <p>{isAdmin
            ? tr("للدخول الآمن إلى نظام إدارة منصة IDEA لإدارة المنتجات والطلبات والمحتوى والمستخدمين وكل ما يخص المنصة.","Secure access to IDEA's control center for managing products, requests, content and users.")
            : isBusiness
            ? tr("منصة مخصصة لشركات السيراميك والرخام، المصانع، الموردين، ومشتري الجملة حول العالم.","A dedicated network for ceramic and marble companies, factories, suppliers and wholesale buyers.")
            : tr("كل ما تحتاجه لإنهاء وتشطيب منزلك بأجود تصاميم السيراميك والبورسلين والرخام والبلاط.","Explore beautiful ceramics, porcelain, marble and tiles for your home.")
          }</p>
        </div>}
        <FeatureItems audience={audience} locale={locale}/>
        {isBusiness&&isRegister&&<div className="idea-auth-business-types" aria-label={tr("حساب شركات الصناعة","Industry account types")}>
          {[
            {icon:Layers3,title:tr("شركات السيراميك","Ceramic companies")},
            {icon:Factory,title:tr("المصانع","Factories")},
            {icon:Package,title:tr("موردو الرخام","Marble suppliers")},
            {icon:Truck,title:tr("الموزعون","Distributors")},
            {icon:Warehouse,title:tr("مشترو الجملة","Wholesale buyers")}
          ].map(x=><span key={x.title}><x.icon aria-hidden="true" size={21}/>{x.title}</span>)}
        </div>}
      </div>
      <div className="idea-auth-panel-wrap">
        <form className="idea-auth-panel" onSubmit={e=>void onSubmit(e)} noValidate={false}>
          <div className="idea-auth-panel-header">
            {isAdmin&&<ShieldCheck className="idea-auth-admin-symbol" size={55} strokeWidth={1.3}/>}
            {!isAdmin&&<span className="idea-auth-header-icon">{isBusiness?<Building2 size={31}/>:<Home size={34}/>}</span>}
            <h2>{selectedTitle}</h2>
            {isAdmin&&<small className="idea-auth-capline">{content(msg("دخول الإدارة","ADMIN ACCESS","ACCÈS ADMIN"),locale)}</small>}
            {isBusiness&&<small className="idea-auth-capline">COMPANY REGISTRATION (B2B)</small>}
            <p>{isAdmin?tr("منطقة آمنة ومخصصة لإدارة منصة IDEA","A secure area reserved for IDEA administrators")
              :isBusiness?tr("أنشئ حساب شركتك للوصول إلى الأسعار التجارية وإرسال طلبات عروض الأسعار والتعاون مع شبكة IDEA.","Register your company to access business enquiries and the IDEA partner network.")
              :isRegister?tr("سجّل الآن للاستمتاع بتجربة مخصصة لاختيار وتشطيب شقتك أو منزلك.","Create your account for a personalized home finishing experience.")
              :tr("سجّل دخولك إلى حسابك الشخصي في IDEA.","Access your personal IDEA account.")}</p>
          </div>
          <div className={"idea-auth-fields"+(isBusiness&&isRegister?" idea-auth-fields--business":"")}>
            {isBusiness&&isRegister&&<FormField id="company" label={tr("اسم الشركة","Company name")} icon={Building2} value={company} onChange={setCompany} autoComplete="organization"/>}
            {isRegister&&<FormField id="fullname" label={isBusiness?tr("اسم المسؤول","Contact person"):tr("الاسم الكامل","Full name")} icon={UserRound} value={name} onChange={setName} autoComplete="name"/>}
            <FormField id="email" label={isAdmin?tr("البريد الإلكتروني للمدير","Administrator email"):isBusiness?tr("البريد الإلكتروني للأعمال","Business email"):tr("البريد الإلكتروني","Email address")} icon={Mail} type="email" value={email} onChange={setEmail} autoComplete="email" placeholder={isAdmin?"admin@idea.com":isBusiness?"example@company.com":""}/>
            {isRegister&&<label className="idea-auth-field idea-auth-field--phone" htmlFor="idea-phone">
              <span className="idea-auth-label">{tr("رقم الهاتف","Phone number")} <em>*</em></span>
              <span className="idea-auth-input-wrap"><UserRound size={16} aria-hidden="true"/>
                <input id="idea-phone" type="tel" autoComplete="tel-national" value={phone} onChange={e=>setPhone(e.currentTarget.value)} placeholder={tr("رقم الهاتف","Phone number")} required pattern="[0-9 +()\-]{7,18}"/>
                <select value={dial} onChange={e=>setDial(e.currentTarget.value)} aria-label={tr("مفتاح الدولة","Country calling code")}>
                  {PHONE_COUNTRIES.map(x=><option key={x.country} value={x.dial}>{x.dial}</option>)}
                </select>
              </span></label>}
            {isBusiness&&isRegister&&<>
              <label className="idea-auth-field idea-auth-field--full" htmlFor="biz-kind">
                <span className="idea-auth-label">{tr("نوع الشركة / النشاط","Business type")} <em>*</em></span>
                <span className="idea-auth-input-wrap"><Layers3 size={17} aria-hidden="true"/>
                  <select id="biz-kind" value={businessKind} onChange={e=>setBusinessKind(e.currentTarget.value)} required>
                    <option value="">{tr("اختر نوع النشاط","Choose business type")}</option>
                    {[
                      ["ceramic","شركة سيراميك","Ceramic company"],["factory","مصنع","Factory"],
                      ["marble","مورد رخام","Marble supplier"],["distributor","موزع","Distributor"],
                      ["wholesale","مشتري جملة","Wholesale buyer"]
                    ].map(([k,ar,en])=><option value={k} key={k}>{tr(ar,en)}</option>)}
                  </select><ChevronDown size={14} aria-hidden="true"/>
                </span>
              </label>
              <label className="idea-auth-field" htmlFor="biz-country">
                <span className="idea-auth-label">{tr("الدولة","Country")} <em>*</em></span>
                <span className="idea-auth-input-wrap"><Globe2 size={16} aria-hidden="true"/>
                  <select id="biz-country" value={country} onChange={e=>setCountry(e.currentTarget.value)} required>
                    <option value="">{tr("اختر الدولة","Choose country")}</option>
                    {PHONE_COUNTRIES.map(x=><option value={x.country} key={x.country}>{x.label}</option>)}
                  </select></span>
              </label>
              <FormField id="biz-city" label={tr("المدينة","City")} icon={MapPin} value={city} onChange={setCity}/>
              <div className="idea-auth-field idea-auth-field--full"><FormField id="license" label={tr("رقم السجل التجاري / رقم الترخيص","Commercial registration / license number")} icon={FileCheck2} value={license} onChange={setLicense}/></div>
              <label className="idea-auth-field idea-auth-field--full" htmlFor="biz-docs">
                <span className="idea-auth-label">{tr("رفع المستندات الداعمة","Supporting documents")} <em>*</em></span>
                <span className="idea-auth-dropzone"><UploadCloud size={29} aria-hidden="true"/>
                  <span>{docs.length?tr("الملفات المختارة: "+docs.map(x=>x.name).join("، "),docs.length+" files selected"):tr("اسحب الملفات هنا أو اختر من جهازك","Choose your files or drop them here")}</span>
                  <small>{tr("PDF أو JPG أو PNG — بحد أقصى 10MB لكل ملف","PDF, JPG or PNG — max 10 MB per file")}</small>
                  <input id="biz-docs" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={e=>onDocuments(e.currentTarget.files)} required={!docs.length}/>
                </span>
              </label>
            </>}
            <label className="idea-auth-field idea-auth-field--full" htmlFor="auth-password">
              <span className="idea-auth-label">{tr("كلمة المرور","Password")} <em>*</em></span>
              <span className="idea-auth-input-wrap">
                <LockKeyhole size={17} aria-hidden="true"/>
                <input id="auth-password" name="password" type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.currentTarget.value)} autoComplete={isRegister?"new-password":"current-password"} placeholder={tr("كلمة المرور","Password")} minLength={8} required/>
                <button type="button" className="idea-auth-eye" onClick={()=>setShowPassword(!showPassword)} aria-label={tr("عرض أو إخفاء كلمة المرور","Show or hide password")}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button>
              </span>
            </label>
            {isCustomer&&isRegister&&<label className="idea-auth-field idea-auth-field--full" htmlFor="auth-confirm">
              <span className="idea-auth-label">{tr("تأكيد كلمة المرور","Confirm password")} <em>*</em></span>
              <span className="idea-auth-input-wrap"><LockKeyhole size={17} aria-hidden="true"/>
                <input id="auth-confirm" type={showConfirmation?"text":"password"} value={confirmation} onChange={e=>setConfirmation(e.currentTarget.value)} required minLength={8} autoComplete="new-password" placeholder={tr("تأكيد كلمة المرور","Confirm password")}/>
                <button type="button" className="idea-auth-eye" onClick={()=>setShowConfirmation(!showConfirmation)} aria-label={tr("عرض أو إخفاء تأكيد كلمة المرور","Show or hide confirmation")}>{showConfirmation?<EyeOff size={17}/>:<Eye size={17}/>}</button>
              </span>
            </label>}
            {isBusiness&&isRegister&&<label className="idea-auth-field idea-auth-field--full" htmlFor="auth-confirm"><span className="idea-auth-label">{tr("تأكيد كلمة المرور","Confirm password")} <em>*</em></span><span className="idea-auth-input-wrap"><LockKeyhole size={17}/><input id="auth-confirm" type="password" required minLength={8} value={confirmation} onChange={e=>setConfirmation(e.currentTarget.value)} autoComplete="new-password" /></span></label>}
            {isAdmin&&<label className="idea-auth-field idea-auth-field--full" htmlFor="admin-otp">
              <span className="idea-auth-label">{tr("رمز التحقق الثنائي (اختياري)","Two-factor code (optional)")}</span>
              <span className="idea-auth-input-wrap"><Shield size={17} aria-hidden="true"/><input id="admin-otp" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={e=>setOtp(e.currentTarget.value)} maxLength={12} placeholder={tr("أدخل رمز التحقق (2FA)","Enter your 2FA code")}/></span>
            </label>}
          </div>
          <div className="idea-auth-actions">
            {isRegister?<label className="idea-auth-checkbox"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.currentTarget.checked)} required/>
              <span>{tr("أوافق على","I agree to")} <Link to="/terms">{tr("شروط الاستخدام","Terms of use")}</Link> {tr("و","and")} <Link to="/privacy">{tr("سياسة الخصوصية","Privacy policy")}</Link></span></label>:
              isAdmin?<div className="idea-auth-between"><label className="idea-auth-checkbox"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.currentTarget.checked)}/>{tr("تذكرني على هذا الجهاز","Remember this device")}</label><Link to="/contact">{tr("نسيت كلمة المرور؟","Forgot password?")}</Link></div>:null}
            {error&&<p role="alert" className="idea-auth-feedback idea-auth-feedback--error">{error}</p>}
            {notice&&<p role="status" className="idea-auth-feedback idea-auth-feedback--success"><CheckCircle2 size={17}/>{notice}</p>}
            <button className="idea-auth-submit" type="submit" disabled={busy}>
              {busy?tr("جاري التحقق...","Processing..."):isAdmin?tr("دخول لوحة التحكم","Enter control center"):isRegister?isBusiness?tr("إنشاء حساب شركة","Create business account"):tr("إنشاء الحساب","Create account"):tr("تسجيل الدخول","Sign in")}
              <ArrowRight size={20} aria-hidden="true"/>
            </button>
            {!isAdmin&&<p className="idea-auth-toggle">
              {isRegister?tr("لديك حساب بالفعل؟","Already have an account?"):tr("ليس لديك حساب؟","Need an account?")}
              {" "}<Link to={isRegister?isBusiness?"/business/login":"/login":goto}>{isRegister?tr("تسجيل الدخول","Sign in"):tr("إنشاء حساب جديد","Create an account")}</Link>
            </p>}
            {isCustomer&&googleLoginSlot}
            {isCustomer&&<SocialAuth mode={isRegister?"register":"login"} redirectTo="/account"/>}
          </div>
        </form>
      </div>
    </div>
  </section>;
}
