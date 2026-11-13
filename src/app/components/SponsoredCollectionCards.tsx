import {useEffect,useState} from "react";
import {Link} from "react-router";
import {supabase} from "../backend/supabaseClient";
import {useI18n} from "../i18n/i18n";
import "./SponsoredCollectionCards.css";

type Placement={campaign_id:string;title_ar:string;title_en:string|null;media_url:string|null;landing_path:string|null};
export function SponsoredCollectionCards(){
  const {locale}=useI18n();
  const [rows,setRows]=useState<Placement[]>([]);
  useEffect(()=>{
    if(!supabase)return;
    let mounted=true;
    void supabase.from("idea_public_campaign_placements")
      .select("campaign_id,title_ar,title_en,media_url,landing_path")
      .eq("placement","new_collections").not("media_url","is",null)
      .order("published_at",{ascending:false}).limit(3)
      .then(({data,error})=>{if(mounted&&!error)setRows((data||[]) as Placement[])});
    return()=>{mounted=false};
  },[]);
  if(!rows.length)return null;
  return <section className="idea-sponsored-collections" aria-label="Sponsored collections">
    <header><span>IDEA · SPONSORED COLLECTIONS</span>
      <h2>{locale==="ar"?"مجموعات مختارة من شركائنا":"Featured partner collections"}</h2></header>
    <div>{rows.map(p=><article key={p.campaign_id}>
      {p.media_url&&<img src={p.media_url} alt={locale==="ar"?p.title_ar:p.title_en||p.title_ar} loading="lazy"/>}
      <div><small>إعلان ممول · Sponsored</small><h3>{locale==="ar"?p.title_ar:p.title_en||p.title_ar}</h3>
        {p.landing_path&&<Link to={p.landing_path}>{locale==="ar"?"عرض منتجات المجموعة":"View collection"}</Link>}
      </div></article>)}</div>
  </section>;
}
