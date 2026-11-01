import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Building2, UserRound, X } from "lucide-react";
import { useBackend } from "../backend/db";
import { useI18n } from "../i18n/i18n";
import "./VisitorWelcome.css";

const content={
 en:{headline:"Welcome to IDEA",desc:"Explore premium surfaces. Sign in to save your favourites and receive private quotations.",user:"Personal account",business:"Company account",login:"I already have an account",close:"Dismiss welcome invitation",note:"Company selling features require verification."},
 ar:{headline:"أهلًا بيك في آيديا",desc:"اكتشف الخامات المميزة. سجّل حساب علشان تحفظ المفضلة وتستقبل عروض الأسعار الخاصة.",user:"حساب شخصي",business:"حساب شركة",login:"عندي حساب بالفعل",close:"إغلاق دعوة التسجيل",note:"خدمات البيع للشركات بتحتاج مراجعة واعتماد."},
 fr:{headline:"Bienvenue chez IDEA",desc:"Découvrez des matériaux premium. Connectez-vous pour enregistrer vos favoris et recevoir des devis.",user:"Compte personnel",business:"Compte entreprise",login:"J'ai déjà un compte",close:"Fermer l'invitation",note:"Les fonctions fournisseurs nécessitent une validation."}
};
export function VisitorWelcome(){
 const {session}=useBackend();const {locale}=useI18n();const {pathname}=useLocation();
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  if(session||pathname!=="/"){setVisible(false);return;}
  try{if(sessionStorage.getItem("idea.welcome.v1"))return;}catch{}
  const timer=window.setTimeout(()=>setVisible(true),1600);
  return()=>window.clearTimeout(timer);
 },[pathname,session?.id]);
 const hide=()=>{
  try{sessionStorage.setItem("idea.welcome.v1","1");}catch{}
  setVisible(false);
 };
 if(!visible||session||pathname!=="/")return null;
 const t=content[locale];
 return <aside className="idea-visitor-welcome" dir={locale==="ar"?"rtl":"ltr"} aria-label={t.headline}>
  <button className="idea-visitor-close" onClick={hide} aria-label={t.close}><X size={17}/></button>
  <div className="idea-visitor-sign">IDEA <span>•</span></div>
  <h2>{t.headline}</h2><p>{t.desc}</p>
  <div className="idea-visitor-options">
   <Link onClick={hide} to="/register/customer"><UserRound size={17}/>{t.user}</Link>
   <Link onClick={hide} to="/register/business"><Building2 size={17}/>{t.business}</Link>
  </div>
  <Link onClick={hide} className="idea-visitor-existing" to="/login">{t.login}</Link>
  <small>{t.note}</small>
 </aside>;
}
