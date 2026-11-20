import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { ShieldCheck } from "lucide-react";
import { useBackend } from "../backend/db";
import "./CompanyControlCenter.css";

export function CompanyControlCenter({ mode }: { mode: "admin" | "supplier" }) {
  const { session } = useBackend();
  const isAdmin = mode === "admin" && session?.role === "admin";

  if (!session || (mode === "supplier" && session.role !== "supplier") || (mode === "admin" && !isAdmin)) {
    return <div role="alert">هذه الصفحة تتطلب صلاحية الشركة أو مسؤول IDEA.</div>;
  }

  return (
    <section className="icc-root" dir="rtl">
      <header className="icc-top">
        <div>
          <span className="icc-eyebrow"><ShieldCheck size={16} /> IDEA · COMPANY CONTROL</span>
          <h1>{isAdmin ? "إدارة الشركات والمنتجات" : "إدارة منتجات شركتك"}</h1>
          <p>تظهر بيانات الشركة وأعضاء الفريق والمنتجات والأسعار الخاصة بعد توصيل واجهة PHP/MySQL الموثقة.</p>
        </div>
      </header>
      <div className="icc-error" role="status">
        BLOCKED: the verified PHP/MySQL company API and schema are not available in this checkout. This page does not access an alternate database or change company, member, listing, price, promotion, or approval records.
      </div>
    </section>
  );
}

export function CompanyApplication() {
  const { session } = useBackend();
  const [legal, setLegal] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setError("BLOCKED: the verified PHP/MySQL contract has no company-application action. No company record or supplier role was created.");
  };

  return (
    <div className="icc-apply" dir="rtl">
      <div className="icc-apply-card">
        <span className="icc-eyebrow"><ShieldCheck size={16} /> COMPANY ONBOARDING</span>
        <h1>إضافة شركتك إلى IDEA</h1>
        <p>كل شركة لها صفحة منتجات وبراندات وأسعار خاصة. طلب التسجيل لا يمنح صلاحيات أدمن أو ينشر منتجات تلقائيًا.</p>
        {!session ? (
          <p>سجّل دخولك أولًا: <Link to="/register/business">إنشاء حساب</Link> أو <Link to="/login">تسجيل الدخول</Link>.</p>
        ) : (
          <form onSubmit={submit}>
            <label>الاسم القانوني<input required minLength={2} maxLength={160} value={legal} onChange={(event) => setLegal(event.target.value)} /></label>
            <label>اسم الشركة الظاهر للزوار<input required minLength={2} maxLength={160} value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>بريد الشركة<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <button type="submit">تقديم طلب الانضمام</button>
          </form>
        )}
        {error && <div className="icc-error" role="alert">{error}</div>}
      </div>
    </div>
  );
}
