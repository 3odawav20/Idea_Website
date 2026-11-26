"""Drop superseded SQL function declarations from migration, keeping final guarded RPC."""
from pathlib import Path
import re
path=Path(__file__).resolve().parents[2]/"supabase/migrations/20261103130000_company_control_center.sql"
original=path.read_text(encoding="utf-8")
pattern=(r"create or replace function public\.idea_set_ad_status\(p_id uuid,p_status text\)"
         r"[\s\S]*?\$\$;\s*revoke all on function public\.idea_set_ad_status"
         r"\(uuid,text\) from public,anon;\s*"
         r"grant execute on function public\.idea_set_ad_status\(uuid,text\) to authenticated;")
matches=list(re.finditer(pattern,original,re.I))
assert len(matches)==3, f"Expected exactly 3 superseded RPC definitions, found {len(matches)}"
reduced=original[:matches[0].start()]+original[matches[0].end():matches[1].start()]+original[matches[1].end():]
assert reduced.count("create or replace function public.idea_set_ad_status") == 1
assert "if current_ad.placement in ('google_ads','meta_ads')" in reduced
path.write_text(reduced,encoding="utf-8")
print("CLEANED_COMPANY_SQL",len(matches),"definitions -> 1")
