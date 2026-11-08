import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Film } from "lucide-react";
import { supabase } from "../backend/supabaseClient";
import "./SponsoredHeroVideo.css";

type Sponsor={campaign_id:string;title_ar:string;title_en:string|null;media_url:string|null;landing_path:string|null};
export function SponsoredHeroVideo(){
  const [campaign,setCampaign]=useState<Sponsor|null>(null);
  useEffect(()=>{
    if(!supabase)return;
    let valid=true;
    void supabase.from("idea_public_campaign_placements")
      .select("campaign_id,title_ar,title_en,media_url,landing_path")
      .eq("placement","home_hero_video")
      .not("media_url","is",null).order("created_at",{ascending:false}).limit(1)
      .then(({data,error})=>{if(valid&&!error)setCampaign((data?.[0] as Sponsor)||null)});
    return()=>{valid=false};
  },[]);
  if(!campaign||!campaign.media_url)return null;
  return <section className="idea-sponsored-hero" aria-label="Sponsored partner video">
    <div className="idea-sponsored-inner">
      <video controls playsInline preload="metadata" muted src={campaign.media_url}
        aria-label={campaign.title_en||campaign.title_ar}/>
      <div className="idea-sponsored-copy">
        <span><Film size={14}/> SPONSORED · IDEA PARTNER</span>
        <h2>{campaign.title_ar}</h2>
        {campaign.landing_path&&<Link to={campaign.landing_path}>عرض مجموعة الشركة</Link>}
      </div>
    </div>
  </section>;
}
