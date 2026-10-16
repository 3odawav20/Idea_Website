import { useEffect, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Building2, KeyRound, Mail, ShieldCheck, UserRound, Clock3 } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useBackend } from "../backend/db";
import { supabase, backendConfigurationError } from "../backend/supabaseClient";
import { Container, Section, Button } from "../components/ui";
import { Panel, Field, inputStyle } from "../components/dash";

type AccountKind = "customer" | "business";
const say = (locale: string, ar: string, en: string, fr = en) =>
  locale === "ar" ? ar : locale === "fr" ? fr : en;

const choiceCard: CSSProperties = {
  display: "flex", flexDirection: "column", gap: 14, padding: 24,
  textDecoration: "none", color: "var(--idea-text)",
  borderRadius: "var(--idea-radius-lg)", border: "1px solid var(--idea-hairline)",
  background: "var(--idea-surface-2)", minHeight: 230
};

export function Register() {
  const { locale } = useI18n();
  return <Section style={{paddingTop:"var(--idea-space-8)"}}>
    <Container style={{maxWidth: 850}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div className="idea-eyebrow">IDEA EGYPT</div>
        <h1 className="idea-display">{say(locale,"اختر نوع الحساب","Choose your account type","Choisissez votre type de compte")}</h1>
        <p style={{color:"var(--idea-text-muted)"}}>{say(locale,"اختار حساب فردي أو حساب شركة. صلاحيات الإدارة لا تُمنح عبر التسجيل العام.","Create a personal account or apply as a business. Administrator access is never self-registered.","Créez un compte personnel ou demandez un compte entreprise. L'administration nécessite une autorisation.")}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 280px), 1fr))",gap:18}}>
        <Link to="/register/customer" style={choiceCard}>
          <UserRound size={32} color="var(--idea-gold)"/>
          <strong style={{fontSize:22}}>{say(locale,"حساب فردي","Personal account","Compte personnel")}</strong>
          <span style={{color:"var(--idea-text-muted)"}}>{say(locale,"تصفح المنتجات، احفظ المفضلة، اطلب عروض أسعار، وتابع طلباتك.","Browse products, save favorites, request quotes and track orders.","Parcourez les produits, les favoris et vos demandes de devis.")}</span>
          <span style={{color:"var(--idea-gold-bright)",display:"flex",gap:8,alignItems:"center",marginTop:"auto"}}>{say(locale,"إنشاء حساب فردي","Create personal account","Créer un compte")} <ArrowRight size={17}/></span>
        </Link>
        <Link to="/register/business" style={choiceCard}>
          <Building2 size={32} color="var(--idea-gold)"/>
          <strong style={{fontSize:22}}>{say(locale,"حساب شركة أو مورد","Business / supplier account","Compte entreprise / fournisseur")}</strong>
          <span style={{color:"var(--idea-text-muted)"}}>{say(locale,"قدّم بيانات شركتك للمراجعة. بعد موافقة الإدارة تقدر تدير منتجاتك وعروضك.","Apply for verification. After approval, manage your products and supplier quotations.","Soumettez votre entreprise. Après validation, gérez vos produits et devis.")}</span>
          <span style={{color:"var(--idea-gold-bright)",display:"flex",gap:8,alignItems:"center",marginTop:"auto"}}>{say(locale,"تقديم طلب شركة","Apply as a business","Créer une demande")} <ArrowRight size={17}/></span>
        </Link>
      </div>
      <p style={{textAlign:"center",marginTop:28,color:"var(--idea-text-muted)"}}>{say(locale,"عندك حساب بالفعل؟","Already registered?","Déjà inscrit ?")} <Link to="/login" style={{color:"var(--idea-gold-bright)"}}>{say(locale,"تسجيل الدخول","Sign in","Connexion")}</Link></p>
    </Container>
  </Section>;
}

function AuthShell({ mode, accountType = "customer" }: { mode: "login" | "register"; accountType?: AccountKind }) {
  const { t, locale } = useI18n(); const nav = useNavigate(); const { session } = useBackend();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState(""); const [companyPhone, setCompanyPhone] = useState("");
  const [companyType, setCompanyType] = useState("supplier");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const [waitingForSession, setWaitingForSession] = useState(false);
  const [businessPendingLogin, setBusinessPendingLogin] = useState(false);
  const configured = Boolean(supabase);
  useEffect(() => {
    if (!waitingForSession || !session) return;
    setWaitingForSession(false);
    if (session.role === "admin") nav("/admin", {replace:true});
    else if (session.role === "business") nav("/business", {replace:true});
    else if (accountType === "business" || businessPendingLogin) nav("/business/application", {replace:true});
    else nav("/account", {replace:true});
  }, [waitingForSession, session, accountType, businessPendingLogin, nav]);

  const submit = async () => {
    if (!supabase || !email.trim() || !password || (mode === "register" && !name.trim())) return;
    if (mode === "register" && accountType === "business" && (!companyName.trim() || !companyPhone.trim())) {
      setMessage(say(locale,"أدخل اسم الشركة ورقم التواصل أولًا.","Enter your company name and contact number.","Saisissez le nom de l'entreprise et son numéro.")); return;
    }
    setBusy(true); setMessage("");
    const result = mode === "register"
      ? await supabase.auth.signUp({
          email: email.trim(), password,
          options: {
            data: {
              display_name: name.trim(),
              requested_account_type: accountType,
              ...(accountType === "business" ? {
                company_name: companyName.trim(), company_phone: companyPhone.trim(),
                company_type: companyType
              } : {})
            },
            emailRedirectTo: `${window.location.origin}${accountType === "business" ? "/business/application" : "/account"}`
          }
        })
      : await supabase.auth.signInWithPassword({email: email.trim(), password});
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (mode === "register" && !result.data.session) {
      setMessage(say(locale, "راجع بريدك الإلكتروني لتأكيد الحساب. طلب الشركة يظل قيد المراجعة حتى موافقة الإدارة.", "Check your email to confirm registration. Business access requires administrator approval.", "Confirmez votre e-mail. Le compte entreprise nécessite une validation."));
      return;
    }
    if (mode === "login" && result.data.user?.user_metadata?.requested_account_type === "business") setBusinessPendingLogin(true);
    setWaitingForSession(true);
    setMessage(say(locale,"تم تسجيل الدخول، جاري فتح حسابك...","Signed in. Opening your account...","Connexion réussie. Ouverture du compte..."));
  };
  const reset = async () => {
    if (!supabase || !email.trim()) return;
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {redirectTo:`${window.location.origin}/login`});
    setBusy(false);
    setMessage(error ? error.message : say(locale,"تم إرسال رابط إعادة تعيين كلمة المرور.","Password-reset email sent.","Un e-mail de réinitialisation a été envoyé."));
  };
  const business = accountType === "business" && mode === "register";
  return <Section style={{paddingTop:"var(--idea-space-8)"}}><Container style={{maxWidth: business ? 560 : 440}}><Panel>
    <div style={{textAlign:"center",marginBottom:"var(--idea-space-5)"}}>
      <div className="idea-eyebrow">IDEA EGYPT</div>
      <h1 className="idea-display" style={{fontSize:"var(--idea-text-2xl)",color:"var(--idea-text)",margin:"var(--idea-space-2) 0 0"}}>
        {mode === "login" ? t("auth.signIn") : business ? say(locale,"تسجيل شركة أو مورد","Register your business","Inscrire votre entreprise") : say(locale,"إنشاء حساب فردي","Create a personal account","Créer un compte personnel")}
      </h1>
      {business && <p style={{color:"var(--idea-text-muted)"}}>{say(locale,"يتم تفعيل صلاحيات المورد بعد مراجعة الإدارة لبيانات الشركة.","Supplier permissions are activated only after administrator review.","L'accès fournisseur est activé après validation.")}</p>}
    </div>
    {!configured ? <p role="alert" style={{color:"var(--idea-danger)"}}>{backendConfigurationError}</p> : <>
      {mode === "register" && <Field label={business ? say(locale,"اسم مسؤول الشركة","Contact person","Contact") : say(locale,"الاسم","Full name","Nom")}>
        <input style={inputStyle} required value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/>
      </Field>}
      {business && <>
        <Field label={say(locale,"اسم الشركة التجاري","Business name","Nom de l'entreprise")}>
          <input style={inputStyle} required value={companyName} maxLength={150} onChange={e=>setCompanyName(e.target.value)} autoComplete="organization"/>
        </Field>
        <Field label={say(locale,"رقم هاتف الشركة","Business phone","Téléphone de l'entreprise")}>
          <input style={inputStyle} required type="tel" value={companyPhone} maxLength={35} onChange={e=>setCompanyPhone(e.target.value)} autoComplete="tel"/>
        </Field>
        <Field label={say(locale,"نوع النشاط","Business activity","Activité")}>
          <select style={inputStyle} value={companyType} onChange={e=>setCompanyType(e.target.value)}>
            <option value="supplier">{say(locale,"مورد أو موزع","Supplier / distributor","Fournisseur / distributeur")}</option>
            <option value="manufacturer">{say(locale,"مصنّع","Manufacturer","Fabricant")}</option>
            <option value="showroom">{say(locale,"معرض أو محل","Showroom / store","Magasin")}</option>
          </select>
        </Field>
      </>}
      <Field label={t("auth.email")}><input style={inputStyle} required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com"/></Field>
      <Field label={say(locale,"كلمة المرور","Password","Mot de passe")}><input style={inputStyle} required type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8}/></Field>
      {message && <p role="status" style={{color:"var(--idea-text-muted)",marginBottom:"var(--idea-space-3)"}}>{message}</p>}
      <Button style={{width:"100%"}} disabled={busy || waitingForSession} onClick={()=>void submit()}><Mail size={16}/>{busy || waitingForSession ? say(locale,"جاري التنفيذ...","Please wait...","Patientez...") : mode === "login" ? t("auth.signIn") : business ? say(locale,"إرسال طلب تسجيل الشركة","Submit business application","Soumettre la demande") : t("auth.createAccount")}<ArrowRight size={16}/></Button>
      {mode === "login" && <button type="button" disabled={busy} onClick={()=>void reset()} style={{display:"inline-flex",gap:8,alignItems:"center",marginTop:16,border:0,background:"transparent",color:"var(--idea-gold-bright)",cursor:"pointer"}}><KeyRound size={14}/>{say(locale,"نسيت كلمة المرور؟","Reset password","Mot de passe oublié ?")}</button>}
    </>}
    <p style={{display:"flex",gap:7,alignItems:"flex-start",marginTop:20,color:"var(--idea-text-faint)",fontSize:"var(--idea-text-xs)"}}><ShieldCheck size={15} style={{flexShrink:0}}/>{say(locale,"صلاحية الأدمن لا يمكن اختيارها أثناء التسجيل. طلبات الشركات تحتاج موافقة الإدارة.","Administrator access cannot be selected at signup. Business accounts require review.","L'administration n'est pas accessible à l'inscription.")}</p>
    <p style={{textAlign:"center",marginTop:16,color:"var(--idea-text-muted)"}}>{mode === "login" ? <><Link to="/register" style={{color:"var(--idea-gold-bright)"}}>{say(locale,"إنشاء حساب جديد","Create account","Créer un compte")}</Link></> : <><Link to="/register" style={{color:"var(--idea-gold-bright)"}}>{say(locale,"تغيير نوع الحساب","Change account type","Changer de type")}</Link> · <Link to="/login" style={{color:"var(--idea-gold-bright)"}}>{say(locale,"تسجيل الدخول","Sign in","Connexion")}</Link></>}</p>
  </Panel></Container></Section>;
}
export function Login(){return <AuthShell mode="login"/>;}
export function RegisterCustomer(){return <AuthShell mode="register" accountType="customer"/>;}
export function RegisterBusiness(){return <AuthShell mode="register" accountType="business"/>;}
export function RoleSelect(){return <Register/>;}

export function BusinessApplicationStatus(){
  const {session}=useBackend();
  const {locale}=useI18n();
  const [status,setStatus]=useState<string>("loading");
  const [error,setError]=useState("");
  useEffect(()=>{
    if(!session || !supabase) return;
    let active=true;
    supabase.from("supplier_applications").select("status").eq("user_id",session.id).maybeSingle().then(({data,error:queryError})=>{
      if(!active)return;
      if(queryError){setError(say(locale,"تعذر تحميل حالة الطلب. قد يحتاج النظام إلى تفعيل قاعدة البيانات.","Cannot load the application. Database setup may be incomplete."));setStatus("error");return;}
      setStatus(data?.status || "not-found");
    });
    return ()=>{active=false;};
  },[session,locale]);
  if(!session)return <Section><Container><Panel><p>{say(locale,"سجّل الدخول لمتابعة طلب الشركة.","Sign in to view your business application.")}</p><Link to="/login">{say(locale,"تسجيل الدخول","Sign in")}</Link></Panel></Container></Section>;
  if(session.role==="business")return <Section><Container><Panel><h2>{say(locale,"تمت الموافقة على حساب شركتك","Your business account is approved")}</h2><Link to="/business">{say(locale,"فتح لوحة الشركة","Open business dashboard")}</Link></Panel></Container></Section>;
  return <Section style={{paddingTop:"var(--idea-space-8)"}}><Container style={{maxWidth:560}}><Panel>
    <Clock3 size={32} color="var(--idea-gold)"/>
    <h1 className="idea-display">{say(locale,"حالة تسجيل الشركة","Business application status","Statut de l'inscription")}</h1>
    <p style={{color:"var(--idea-text-muted)"}}>
      {status==="loading"?say(locale,"جاري التحقق من الطلب...","Checking your application..."):
       status==="pending"?say(locale,"تم استلام طلبك، وهو قيد مراجعة الإدارة. لن تتاح إضافة المنتجات قبل الموافقة.","Application received. Supplier features stay locked until approval."):
       status==="rejected"?say(locale,"تعذر قبول الطلب. تواصل مع الإدارة.","Your application was not approved. Contact support."):
       status==="error"?error:
       say(locale,"لم يتم العثور على طلب شركة مرتبط بهذا الحساب. يُرجى التواصل مع الإدارة.","No business application was found for this account. Contact support.")}
    </p><Link to="/account" style={{color:"var(--idea-gold-bright)"}}>{say(locale,"الرجوع لحسابي","Go to my account")}</Link>
  </Panel></Container></Section>;
}