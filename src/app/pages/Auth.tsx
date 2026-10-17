import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Mail, Building2, UserRound } from "lucide-react";
import { accountRequest } from "../backend/accountsApi";
import { BusinessQuestionnaire, emptyBusinessProfile } from "./BusinessQuestionnaire";
import { Container, Section, Button } from "../components/ui";
import { Panel, Field, inputStyle } from "../components/dash";
import { MembershipChoices, useMembershipText } from "./Membership";

function AuthShell({ mode, audience = "customer" }: { mode: "login" | "register"; audience?: "customer" | "business" }) {
  const text = useMembershipText(), nav = useNavigate(), [params] = useSearchParams();
  const business = audience === "business", register = mode === "register";
  const [fields, setFields] = useState({ email: "", password: "", name: "", company: "", phone: "", legalName: "", tax: "", registration: "" });
  const [businessProfile,setBusinessProfile]=useState(emptyBusinessProfile);
  const [message, setMessage] = useState<"confirm" | "reset" | "error" | null>(null), [busy, setBusy] = useState(false);
  const set = (key: keyof typeof fields, value: string) => setFields(old => ({ ...old, [key]: value }));
  const safeNext = (next: string | null) => next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : null;
  const destination = business ? "/business" : safeNext(params.get("next")) || "/account";
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage(null);
    try {
      const result = await accountRequest(register?'register':'login',register?{
        email:fields.email.trim(),password:fields.password,display_name:fields.name.trim(),account_type:audience,
        company_name:business?fields.company.trim():undefined,legal_name:business?fields.legalName.trim():undefined,phone:fields.phone.trim(),
        business_profile:business?{...businessProfile,commercial_registration:fields.registration.trim(),tax_number:fields.tax.trim()}:undefined,
        membership_interval:params.get('interval')==='annual'?'annual':'monthly',
      }:{email:fields.email.trim(),password:fields.password});
      nav(result.user?.role==='supplier'?'/business':result.user?.role==='admin'?'/admin':destination);
    } catch { setMessage("error"); } finally { setBusy(false); }
  };
  const reset = async () => {
    if (!fields.email.trim()) { setMessage("error"); return; }
    setBusy(true);
    try { await accountRequest('reset-request',{email:fields.email.trim()}); setMessage('reset'); }
    catch { setMessage("error"); } finally { setBusy(false); }
  };
  const input = (key: keyof typeof fields, label: string, type = "text", required = true, autoComplete?: string) => <Field label={label}><input name={key} aria-label={label} style={inputStyle} value={fields[key]} onChange={event => set(key, event.target.value)} type={type} required={required} autoComplete={autoComplete} minLength={key === "password" && register ? 8 : undefined} maxLength={key === "password" ? 128 : 200} /></Field>;
  return <Section><Container style={{ maxWidth: business && register ? 760 : 480 }}><Panel>
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      {business ? <Building2 size={30} color="var(--idea-gold)" /> : <UserRound size={30} color="var(--idea-gold)" />}
      <h1 className="idea-display" style={{ fontSize: "var(--idea-text-xl)", margin: "12px 0" }}>{register ? business ? text("Create a company account", "إنشاء حساب شركة") : text("Create a customer account", "إنشاء حساب عميل") : text("Sign in to IDEA", "تسجيل الدخول إلى IDEA")}</h1>
      {register && <p style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>{business ? text("Your company profile is reviewed before your products are published.", "بنراجع بيانات شركتك قبل نشر منتجاتها للجمهور.") : text("Your space, your materials. Start with a free customer account.", "مساحتك وخاماتك على ذوقك. ابدأ بحساب عميل مجاني.")}</p>}
    </div>
    <form onSubmit={submit}>
      <div className={business && register ? "idea-signup-fields" : undefined}>
        {register && input("name", business ? text("Contact person", "اسم المسؤول") : text("Full name", "الاسم بالكامل"), "text", true, "name")}
        {business && register && <>{input("company", text("Company display name", "اسم الشركة المعروض"), "text", true, "organization")}{input("legalName", text("Legal company name", "الاسم القانوني للشركة"))}{input("phone", text("Phone number", "رقم الهاتف"), "tel", true, "tel")}{input("registration", text("Commercial registration (optional)", "السجل التجاري (اختياري)"), "text", false)}{input("tax", text("Tax number (optional)", "الرقم الضريبي (اختياري)"), "text", false)}</>}
        {input("email", text("Email address", "البريد الإلكتروني"), "email", true, "email")}
        {input("password", text("Password", "كلمة المرور"), "password", true, register ? "new-password" : "current-password")}
      </div>
      {business && register && <BusinessQuestionnaire value={businessProfile} onChange={setBusinessProfile} />}
      {register && <p style={{ fontSize: "var(--idea-text-xs)", color: "var(--idea-text-muted)" }}>{text("Use at least 8 characters for your password.", "استخدم 8 أحرف على الأقل لكلمة المرور.")}</p>}
      {message && <p role="status" style={{ color: message === "error" ? "var(--idea-danger)" : "var(--idea-text)", lineHeight: 1.8 }}>{message === "confirm" ? text("Check your email to confirm your account, then sign in.", "راجع بريدك الإلكتروني لتأكيد الحساب، وبعدها سجّل الدخول.") : message === "reset" ? text("Password reset instructions were sent to your email.", "أرسلنا خطوات استعادة كلمة المرور إلى بريدك الإلكتروني.") : text("We could not complete this request. Check your details and try again.", "تعذّر إكمال الطلب. راجع بياناتك وحاول مرة أخرى.")}</p>}
      <Button type="submit" disabled={busy} style={{ width: "100%", marginTop: 12 }}><Mail size={16} />{busy ? text("Please wait…", "لحظة من فضلك…") : register ? text("Create account", "إنشاء الحساب") : text("Sign in", "تسجيل الدخول")}</Button>
      {!register && <button type="button" onClick={() => void reset()} disabled={busy} style={{ border: 0, background: "transparent", color: "var(--idea-gold)", marginTop: 16, cursor: "pointer" }}>{text("Forgot your password?", "نسيت كلمة المرور؟")}</button>}
    </form>
    <div style={{ display: "grid", gap: 12, textAlign: "center", marginTop: 24, fontSize: "var(--idea-text-sm)" }}>
      <Link to={register ? "/login" : "/register"}>{register ? text("Already have an account? Sign in", "عندك حساب؟ سجّل الدخول") : text("New here? Choose your account", "أول مرة هنا؟ اختار نوع حسابك")}</Link>
      {register && <Link to={`/register/${business ? "customer" : "business"}`} style={{ color: "var(--idea-gold)" }}>{business ? text("Shopping for yourself? Create a customer account", "بتشتري لنفسك؟ اعمل حساب عميل") : text("Have a company? Register as a supplier", "عندك شركة؟ سجّل كمورد")}</Link>}
    </div>
  </Panel></Container></Section>;
}
export function Login() { return <AuthShell mode="login" />; }
export function Register() { return <MembershipChoices />; }
export function RegisterCustomer() { return <AuthShell mode="register" audience="customer" />; }
export function RegisterBusiness() { return <AuthShell mode="register" audience="business" />; }
export function RoleSelect() { return <MembershipChoices />; }
