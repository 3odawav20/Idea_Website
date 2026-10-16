"""IDEA supplier import inventory audit. Review-only, not product publication."""
from pathlib import Path
from collections import Counter,defaultdict
from difflib import SequenceMatcher
import csv,json,re,unicodedata
ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/"src/app/data"
OUT=ROOT/"docs/catalogue"
OUT.mkdir(parents=True,exist_ok=True)
sources=[("artceramic","artceramic-curated.json"),("aba","aba-reviewed-local.json"),("cleopatra","cleopatra-staged-local.json"),("royal","royal-staged-local.json"),("elsweifi","elsweifi-staged-local.json")]
excluded=set(json.loads((DATA/"imageQualityExclusions.json").read_text(encoding="utf8"))["rejectedProductIds"])
rows=[];counts=Counter();errors=[]
for source,fn in sources:
 p=DATA/fn
 if not p.is_file():print("MISSING_SOURCE",fn,flush=True);continue
 for product in json.loads(p.read_text(encoding="utf8")):
  if source=="artceramic":
   if product["id"] in excluded:continue
   product={"id":product["id"],"slug":product["slug"],"name":{"ar":product["name"]},"collection":"ceramics","brand":"Art Ceramic","manufacturer":"Art Ceramic","manufacturerBasis":"official-manufacturer","image":product["image"],"sizes":[{"label":product["size"]}]}
  counts[source]+=1
  image=product.get("image","")
  path=ROOT/"public"/image.lstrip("/")
  valid=image.startswith("/images/catalog/") and path.is_file() and path.stat().st_size>=5000
  sizes=" | ".join(x.get("label","") for x in product.get("sizes",[]) if x.get("label"))
  site=product.get("sitePath") or "/product/"+product["slug"]
  row={"source":source,"source_id":product["id"],"idea_product_path":site,"category":product["collection"],"name":product["name"].get("ar") or product["name"].get("en"),"brand":product.get("brand") or "","confirmed_manufacturer":product.get("manufacturer") or "","manufacturer_evidence":product.get("manufacturerBasis") or "not_confirmed","code":product.get("code") or "","sizes":sizes,"local_image_path":image,"image_on_local_computer":valid,"review_status":"requires-rights-visual-and-dedup-review"}
  if not valid or not sizes or not site.startswith("/product/"):errors.append(row)
  rows.append(row)
assert len(set(x["idea_product_path"] for x in rows))==len(rows),"Duplicate first-party product paths"
assert not errors,f"Malformed or missing local assets: {errors[:3]}"
aliases={"art":"art ceramic","ceramica cleopatra":"cleopatra"}
def clean(s):
 t=unicodedata.normalize("NFKC",s).lower()
 return " ".join(re.sub(r"[^\w]+"," ",re.sub(r"[\u064b-\u065f]","",t)).split())
groups=defaultdict(list)
for row in rows:
 brand=aliases.get(clean(row["brand"]),clean(row["brand"]))
 if brand:groups[(brand,clean(row["sizes"].split("|")[0]))].append(row)
suspects=[]
for (brand,size),group in groups.items():
 for i,a in enumerate(group):
  for b in group[i+1:]:
   if a["source"]==b["source"]:continue
   sim=SequenceMatcher(None,clean(a["name"]),clean(b["name"])).ratio()
   if sim>=0.92 or (a["code"] and a["code"]==b["code"]):
    suspects.append({"a":a["idea_product_path"],"b":b["idea_product_path"],"size":size,"brand":brand,"similarity":round(sim,3)})
summary={"supplied_source_registry_links":40,"source_counts_review_only":dict(counts),"records":len(rows),"material_counts":dict(Counter(x["category"] for x in rows)),"unique_idea_paths":len(rows),"local_primary_images_verified":sum(x["image_on_local_computer"] for x in rows),"records_with_size":sum(bool(x["sizes"]) for x in rows),"manufacturer_evidenced":sum(bool(x["confirmed_manufacturer"]) for x in rows),"manufacturer_not_verified":sum(not x["confirmed_manufacturer"] for x in rows),"possible_cross_source_duplicates":len(suspects),"new_records_publicly_approved":0}
(OUT/"idea-product-inventory-summary.json").write_text(json.dumps({"summary":summary,"suspected_duplicates":suspects[:150]},ensure_ascii=False,indent=2)+"\n",encoding="utf8")
with (OUT/"idea-product-inventory-review.csv").open("w",newline="",encoding="utf-8-sig") as f:
 writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
(OUT/"README.md").write_text("# IDEA catalogue review\n\nEvery row has a first-party /product/ path, factual size and locally verified primary image. New supplier imports are UNAPPROVED and not available on the public website yet.\n\nImportant: image files are held on the authorized work computer and are NOT uploaded to GitHub just because a local path is in this report. Before publication, verify image reuse rights, image text/collages, provenance, brand/manufacturer identities, duplicate records, and availability of media on IDEA's hosting.\n\nSee idea-product-inventory-review.csv for individual records and idea-product-inventory-summary.json for counts and duplicate flags.\n",encoding="utf8")
print("INVENTORY_AUDIT",json.dumps(summary,ensure_ascii=True),flush=True)
