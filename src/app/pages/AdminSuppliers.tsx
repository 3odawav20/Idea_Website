import { useCallback, useEffect, useState } from "react";
import { Building2, RefreshCw, ShieldCheck, AlertTriangle, Check, X } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { requireSupabase } from "../backend/supabaseClient";
import "./AdminStudio.css";

type SupplierApplication = {
  user_id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_type: "supplier" | "manufacturer" | "showroom";
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export function AdminSupplierApplications() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [applications, setApplications] = useState<SupplierApplication[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const {data, error: dbError} = await requireSupabase()
        .from("supplier_applications")
        .select("user_id,company_name,contact_name,contact_email,contact_phone,company_type,status,created_at")
        .order("created_at", {ascending:false});
      if(dbError) throw dbError;
      setApplications((data || []) as SupplierApplication[]);
      setError("");
    } catch(e) {
      setError(ar
        ? "تعذر قراءة طلبات الشركات. تأكد من تنفيذ Migration الخاصة بالتسجيل الجديد وصلاحيات حساب الأدمن."
        : "Supplier applications unavailable. Apply the account-registration migration and verify administrator permissions.");
      console.error("Supplier application loading failed",e);
    } finally {setLoading(false);}
  }, [ar]);
  useEffect(() => { void load(); }, [load]);

  const review = async (id:string, approve:boolean) => {
    if(!window.confirm(approve
      ? (ar ? "تأكيد اعتماد الشركة ومنح صلاحية المورد؟" : "Approve this business and grant supplier access?")
      : (ar ? "هل تريد رفض طلب الشركة؟" : "Reject this business application?"))) return;
    setBusyId(id);setNotice("");setError("");
    try{
      const {data, error: rpcError} = await requireSupabase().rpc("review_idea_supplier_application",{
        p_user_id:id,p_approve:approve
      });
      if(rpcError)throw rpcError;
      setNotice(approve
        ? (ar ? "تم اعتماد الشركة وإنشاء حساب المورد." : "Business approved and supplier access granted.")
        : (ar ? "تم رفض طلب الشركة." : "Business application rejected."));
      await load();
    }catch(e){
      console.error("Supplier application review failed",e);
      setError(ar ? "تعذر تنفيذ الإجراء. راجع الصلاحيات وإعدادات Supabase." : "Action failed. Check Supabase permissions and database setup.");
    }finally{setBusyId(null);}
  };

  const pending = applications.filter(x=>x.status==="pending").length;
  return <div>
    <div className="ids-heading">
      <div>
        <span className="ids-kicker">IDEA EGYPT / SUPPLIER ACCESS</span>
        <h2>{ar ? "طلبات تسجيل الشركات" : "Business applications"}</h2>
        <p>{ar ? "راجع الشركات الجديدة ووافق عليها قبل منح صلاحيات المورد." : "Review new businesses before activating supplier privileges."}</p>
      </div>
      <div className="ids-heading-action">
        <button className="ids-action-outline" type="button" onClick={()=>void load()} disabled={loading}>
          <RefreshCw size={17}/>{ar ? "تحديث" : "Refresh"}
        </button>
      </div>
    </div>
    <div className="ids-stat" style={{maxWidth:290,marginBottom:24}}>
      <span className="ids-stat-icon"><Building2 size={20}/></span>
      <span className="ids-stat-label">{ar ? "طلبات تنتظر الموافقة" : "Awaiting approval"}</span>
      <strong>{pending}</strong>
      <small>{ar ? "لا توجد صلاحيات مورد قبل الموافقة" : "No supplier access before approval"}</small>
    </div>
    {error && <p role="alert" className="ids-notice"><AlertTriangle size={18}/>{error}</p>}
    {notice && <p role="status" className="ids-notice"><ShieldCheck size={18}/>{notice}</p>}
    <div className="ids-panel ids-table-panel">
      <div className="ids-panel-head"><h3>{ar ? "مراجعة الشركات" : "Applicant directory"}</h3></div>
      <div className="ids-table-scroll">
        <table className="ids-table">
          <thead><tr>
            <th>{ar ? "الشركة" : "Business"}</th>
            <th>{ar ? "التواصل" : "Contact"}</th>
            <th>{ar ? "النشاط" : "Activity"}</th>
            <th>{ar ? "الحالة" : "Status"}</th>
            <th>{ar ? "الإجراءات" : "Actions"}</th>
          </tr></thead>
          <tbody>{applications.map(app=><tr key={app.user_id}>
            <td><strong>{app.company_name}</strong><div>{new Date(app.created_at).toLocaleDateString(locale)}</div></td>
            <td>{app.contact_name}<div>{app.contact_email}</div><div>{app.contact_phone}</div></td>
            <td>{app.company_type}</td>
            <td><span className={app.status==="approved"?"ids-pill ids-pill-ok":"ids-pill ids-pill-warn"}>{app.status}</span></td>
            <td>{app.status==="pending"
              ? <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button className="ids-action-outline" disabled={busyId===app.user_id}
                    onClick={()=>void review(app.user_id,true)}><Check size={16}/>{ar ? "قبول" : "Approve"}</button>
                  <button className="ids-action-outline" disabled={busyId===app.user_id}
                    onClick={()=>void review(app.user_id,false)}><X size={16}/>{ar ? "رفض" : "Reject"}</button>
                </div>
              : "—"}</td>
          </tr>)}</tbody>
        </table>
        {!loading && !applications.length && !error && <p className="ids-empty">{ar ? "لا توجد طلبات شركات حاليًا." : "No business applications yet."}</p>}
      </div>
    </div>
  </div>;
}