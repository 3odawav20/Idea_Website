import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Megaphone } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { supabase } from "../backend/supabaseClient";
import "./AnnouncementBar.css";

type Announcement={id:string;title_ar:string;title_en:string;title_fr:string|null;target_path:string|null};

/** Only admin-published records pass the server-side read policy.
 * Never claim today's sales or discounts from static/mock data.
 */
export function AnnouncementBar(){
  const {locale}=useI18n();
  const [rows,setRows]=useState<Announcement[]>([]);
  useEffect(()=>{
    if(!supabase)return;
    let valid=true;
    const refresh=async()=>{
      const [announcements,sponsored]=await Promise.all([
        supabase.from("idea_site_announcements")
          .select("id,title_ar,title_en,title_fr,target_path")
          .eq("is_published",true).order("created_at",{ascending:false}).limit(8),
        supabase.from("idea_public_campaign_placements")
          .select("campaign_id,title_ar,title_en,landing_path")
          .eq("placement","home_topline").order("published_at",{ascending:false}).limit(4),
      ]);
      if(valid&&(!announcements.error||!sponsored.error)){
        const ordinary=((announcements.data||[]) as Announcement[]);
        const paid=(sponsored.data||[]).map(x=>({
          id:x.campaign_id,title_ar:"إعلان · "+x.title_ar,
          title_en:"Sponsored · "+(x.title_en||x.title_ar),
          title_fr:null,target_path:x.landing_path,
        }));
        setRows([...ordinary,...paid]);
      }
    };
    void refresh();
    const channel=supabase.channel("idea-announcements-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"idea_site_announcements"},()=>{void refresh()})
      .on("postgres_changes",{event:"*",schema:"public",table:"idea_public_campaign_placements"},()=>{void refresh()})
      .subscribe();
    return()=>{valid=false;void supabase.removeChannel(channel)};
  },[]);
  if(!rows.length)return null;
  const localized=(a:Announcement)=>locale==="ar"?a.title_ar:locale==="fr"?(a.title_fr||a.title_en):a.title_en;
  return <div className="idea-admin-ticker" role="region" aria-label={locale==="ar"?"إعلانات IDEA":"IDEA announcements"}>
    <span className="idea-admin-ticker-mark"><Megaphone size={14}/><strong>IDEA</strong></span>
    <div className="idea-admin-ticker-clip">
      <div className="idea-admin-ticker-track" aria-live="off">
        {[...rows,...rows].map((announcement,index)=>
          <span key={announcement.id+"-"+index} className="idea-admin-ticker-item" dir={locale==="ar"?"rtl":"ltr"}>
            {announcement.target_path?
              <Link to={announcement.target_path}>{localized(announcement)}</Link>:
              <span>{localized(announcement)}</span>}
            <i aria-hidden="true">◆</i>
          </span>
        )}
      </div>
    </div>
  </div>;
}
