import { useState } from "react";
import { supabase } from "../backend/supabaseClient";
import { useI18n } from "../i18n/i18n";

/** Display only providers explicitly configured by the site operator.
 * Never claim a social-login button is connected until provider credentials,
 * redirect URLs, and a live Supabase project are present.
 */
const PROVIDERS=[
  {id:"google",label:"Google"},
  {id:"facebook",label:"Facebook"},
  {id:"apple",label:"Apple"},
  {id:"twitter",label:"X / Twitter"},
  {id:"azure",label:"Microsoft"},
] as const;
type Provider=(typeof PROVIDERS)[number]["id"];
const configured=new Set(String(import.meta.env.VITE_AUTH_PROVIDERS||"")
  .split(",").map(v=>v.trim().toLowerCase()).filter(Boolean));

export function SocialAuth({redirectTo}:{redirectTo:string}){
  const {locale}=useI18n();
  const [busy,setBusy]=useState(false);
  const [phone,setPhone]=useState("");
  const [otp,setOtp]=useState("");
  const [sent,setSent]=useState(false);
  const [error,setError]=useState("");
  const active=PROVIDERS.filter(p=>configured.has(p.id));
  const text=(ar:string,en:string)=>locale==="ar"?ar:en;
  const oauth=async(provider:Provider)=>{
    if(!supabase||!configured.has(provider))return;
    setBusy(true);setError("");
    try{
      const {error:e}=await supabase.auth.signInWithOAuth({
        provider,options:{redirectTo:window.location.origin+redirectTo},
      });
      if(e)throw e;
    }catch(e){setError(e instanceof Error?e.message:String(e))}
    finally{setBusy(false)}
  };
  const send=async()=>{
    if(!supabase||!configured.has("sms"))return;
    if(!/^\+[1-9]\d{7,14}$/.test(phone)){setError(text("اكتب رقمًا دوليًا يبدأ +20","Enter an international phone number, e.g. +20…"));return}
    setBusy(true);setError("");
    try{
      const {error:e}=await supabase.auth.signInWithOtp({phone});
      if(e)throw e;setSent(true);
    }catch(e){setError(e instanceof Error?e.message:String(e))}
    finally{setBusy(false)}
  };
  const verify=async()=>{
    if(!supabase)return;
    setBusy(true);setError("");
    try{
      const {error:e}=await supabase.auth.verifyOtp({phone,token:otp,type:"sms"});
      if(e)throw e;
      window.location.assign(redirectTo);
    }catch(e){setError(e instanceof Error?e.message:String(e))}
    finally{setBusy(false)}
  };
  if(!supabase||(!active.length&&!configured.has("sms")))return null;
  return <section aria-label="Other sign-in methods" style={{marginTop:20,display:"grid",gap:8}}>
    <div style={{fontSize:12,color:"var(--idea-text-muted)",textAlign:"center"}}>
      {text("أو الدخول باستخدام حساب متصل","Or sign in with a connected provider")}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8}}>
      {active.map(provider=><button type="button" key={provider.id} disabled={busy}
        onClick={()=>void oauth(provider.id)}
        style={{border:"var(--idea-hairline)",borderRadius:8,padding:"10px 8px",cursor:"pointer",
          background:"var(--idea-surface-2)",color:"var(--idea-text)",fontWeight:600}}>
        {provider.label}
      </button>)}
    </div>
    {configured.has("sms")&&<div style={{display:"grid",gap:7}}>
      <label style={{fontSize:12,color:"var(--idea-text-muted)"}}>{text("الدخول بكود SMS للهاتف","SMS phone code")}
        <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}
          placeholder="+2010…" style={{width:"100%",padding:9,marginTop:5,border:"var(--idea-hairline)",background:"var(--idea-surface-2)",color:"var(--idea-text)"}}/>
      </label>
      {!sent?<button disabled={busy} onClick={()=>void send()}>{text("إرسال الرمز","Send code")}</button>:
        <><input inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={e=>setOtp(e.target.value)} placeholder={text("كود التحقق","Verification code")}/>
          <button disabled={busy||!otp} onClick={()=>void verify()}>{text("تأكيد الهاتف","Verify phone")}</button></>}
    </div>}
    {error&&<p role="alert" style={{color:"var(--idea-danger)",fontSize:12}}>{error}</p>}
  </section>;
}
