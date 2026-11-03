"""Add user-authorized exact source URLs and dated discovery evidence to canonical registry.
Preserve historic source counts, legacy resolved/original URLs and product review state.
"""
from pathlib import Path
import json
from datetime import datetime,timezone

ROOT=Path(__file__).resolve().parents[2]
p=ROOT/"src/app/data/sourceRegistry.json"
register=json.loads(p.read_text("utf-8"))
sources=json.loads((ROOT/"scripts/catalogue/approved-sources.json").read_text("utf-8"))["sources"]
diagnostics=json.loads((ROOT/"docs/catalogue/supplier-qa-2026-11-03/source-diagnostics.json").read_text("utf-8"))
expected={s["source_id"]:s for s in sources}
qa={s["source_id"]:s for s in diagnostics}
listed={s["source_id"]:s for s in register["sources"]}
assert len(expected)==len(qa)==len(listed)==40, "source register diverges from 40 exact inputs"
for source_id, src in expected.items():
    row=listed[source_id]
    row["approved_input_url_2026_11_03"]=src["url"]
    row["source_name_approved_input"]=src["name"]
    r=qa[source_id]
    row["discovery_evidence_2026_11_03"]={
        "status":r.get("status"),"http_status":r.get("http_status"),
        "final_url":r.get("final_url"),"adapter":r.get("adapter"),
        "reason":r.get("reason"),"checked_at":r.get("checked_at"),
        "canonical_source_id":r.get("canonical_source_id")
    }
register["registryVersion"]=3
register["approvedSourceListDate"]="2026-11-03"
register["approvedSourceListCount"]=len(sources)
register["registryStatus"]="PARTIAL"
# Legacy product_count is a historical figure and NOT current approved/live products.
p.write_text(json.dumps(register,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("REGISTRY_ENRICHED_WITH_EVIDENCE",len(expected),"historic counts preserved",sum(s.get("product_count") or 0 for s in register["sources"]))
