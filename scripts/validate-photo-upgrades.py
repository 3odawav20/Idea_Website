#!/usr/bin/env python3
"""Validate Art Ceramic's original/large image variants before adopting them.

No URLs are blindly substituted: every candidate is checked with the actual image
origin, dimensions and plausible aspect ratio. Run on demand to refresh the mapping.
"""
import concurrent.futures as cf
import io
import json
import time
import urllib.request
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parent.parent
DATA=json.loads((ROOT/"src/app/data/artceramic.json").read_text(encoding="utf-8"))
OUT=ROOT/"src/app/data/artceramicPhotoUpgrades.json"
def probe(t):
    key, url=t
    try:
        r=urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0","Range":"bytes=0-65535"}),timeout=8)
        if r.status not in (200,206) or not r.headers.get("Content-Type","").startswith("image/"):return key, None
        with Image.open(io.BytesIO(r.read(65536))) as img:
            width,height=img.size
        return key, (width,height)
    except Exception:
        return key,None

tasks=[]
for rec in DATA:
    original=rec["image"]
    if "/medium_" not in original: continue
    for variant, replace in (("large","/large_"),("original","/")):
        url=original.replace("/medium_",replace,1)
        tasks.append((str(rec["id"])+"|"+variant,url))
out={}
started=time.time()
with cf.ThreadPoolExecutor(max_workers=12) as pool:
    futures=[pool.submit(probe,t) for t in tasks]
    for n,fut in enumerate(cf.as_completed(futures),1):
        key,size=fut.result()
        if size:
            id_,variant=key.split("|")
            out.setdefault(id_,{})[variant]={"width":size[0],"height":size[1]}
        if n%100==0:print(n,"/",len(tasks),"checked in",round(time.time()-started,1),"s",flush=True)

verified={}
for rec in DATA:
    ident=str(rec["id"])
    versions=out.get(ident,{})
    # Large version should have a known, clear improvement over 750 px medium.
    large=versions.get("large")
    original=versions.get("original")
    if not large or large["width"]<900 or large["height"]<400:continue
    medium=rec["image"]
    source=medium.replace("/medium_","/large_",1)
    entry={"large":source}
    if original and original["width"]>large["width"] and original["height"]>=large["height"]:
        if abs(original["width"]/original["height"]-large["width"]/large["height"])<.06:
            entry["original"]=medium.replace("/medium_","/",1)
    verified[ident]=entry

OUT.write_text(json.dumps(verified,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Total source products",len(DATA),"verified large",len(verified),"verified original",sum("original" in x for x in verified.values()),"remaining source-medium",len(DATA)-len(verified),flush=True)
