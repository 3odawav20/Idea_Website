import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Megaphone } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { apiFetch } from "../backend/apiClient";
import "./AnnouncementBar.css";

type Announcement={id:string;title_ar:string;title_en:string;title_fr:string|null;target_path:string|null};
type PhpAnnouncement={id:string;text_ar:string;text_en:string;link_path:string};

/** Only admin-published records pass the server-side read policy.
 * Never claim today's sales or discounts from static/mock data.
 */
export function AnnouncementBar({fallback = null}: {fallback?: ReactNode}){
  const {locale}=useI18n();
  const [rows,setRows]=useState<Announcement[]>([]);
  useEffect(()=>{
    let active=true;
    const refresh=async()=>{
      try{
        const response=await apiFetch<{announcements:PhpAnnouncement[]}>("/api/marketplace.php?action=ticker");
        if(active)setRows((response.announcements||[]).map(item=>({
          id:item.id,title_ar:item.text_ar,title_en:item.text_en,title_fr:null,target_path:item.link_path||null,
        })));
      }catch{
        if(active)setRows([]);
      }
    };
    void refresh();
    return()=>{active=false};
  },[]);
  if(!rows.length)return fallback;
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
