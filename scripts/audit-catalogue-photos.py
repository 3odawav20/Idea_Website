#!/usr/bin/env python3
"""Independent record-by-record QA for IDEA's sourced Art Ceramic catalogue.

Requires Pillow for image-dimension checks. All reported data are evidence from
artceramic.json and responses from the original image server; no fields are invented.
Usage: python scripts/audit-catalogue-photos.py --workers 10 --timeout 12
"""
import argparse
import csv
import hashlib
import io
import json
import re
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

from PIL import Image, ImageFile, UnidentifiedImageError

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "src/app/data/artceramic.json"
Image.MAX_IMAGE_PIXELS = 35_000_000
ImageFile.LOAD_TRUNCATED_IMAGES = False
BAD_PREFIX = re.compile(r"^(?:data:|blob:|javascript:)", re.I)
SIZE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(?:cm)?\s*$", re.I)
MIN_WIDTH, MIN_HEIGHT = 700, 500

def media_check(url, timeout=12, dry_run=False):
    if not isinstance(url, str) or BAD_PREFIX.search(url or ""):
        return ("invalid_url", 0, 0, "", "", "")
    parts = urlsplit(url)
    if parts.scheme != "https" or not parts.netloc:
        return ("invalid_url", 0, 0, "", "", "")
    if dry_run:
        return ("not_checked", 0, 0, "", "", "")
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; IDEA-Catalogue-QA/1.0)", "Accept": "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            ctype = response.headers.get("Content-Type", "").split(";")[0].lower()
            raw = response.read(9_000_000)
            if not ctype.startswith("image/"):
                return ("non_image", 0, 0, ctype, "", "")
            try:
                with Image.open(io.BytesIO(raw)) as img:
                    img.load()
                    width, height = img.size
                    fmt = img.format or ""
            except (UnidentifiedImageError, OSError, ValueError):
                return ("unreadable_image", 0, 0, ctype, "", "")
            status = "ok" if width >= MIN_WIDTH and height >= MIN_HEIGHT else "low_resolution"
            return (status, width, height, ctype, fmt, hashlib.sha256(raw).hexdigest())
    except urllib.error.HTTPError as ex:
        return (f"http_{ex.code}", 0, 0, "", "", "")
    except Exception as ex:
        return ("network_" + type(ex).__name__, 0, 0, "", "", "")

def audit(args):
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    names = Counter(x.get("name", "").strip().casefold() for x in data)
    slugs = Counter(x.get("slug", "").strip().casefold() for x in data)
    ids = Counter(str(x.get("id", "")) for x in data)
    primaries = {x.get("image", "") for x in data}
    # QA every primary individually. Galleries are checked for URL structure and duplicate entries;
    # --all-gallery-images additionally downloads every unique supplementary image.
    urls = sorted({url for x in data for url in [x.get("image"), *(x.get("tiles") or [])] if url} if args.all_gallery_images else primaries)
    results = {}
    start = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        future_map = {pool.submit(media_check, url, args.timeout, args.offline): url for url in urls}
        for i, future in enumerate(as_completed(future_map), 1):
            results[future_map[future]] = future.result()
            if i % 50 == 0 or i == len(urls):
                print(f"Checked {i}/{len(urls)} images in {time.time()-start:.1f}s", flush=True)

    rows = []
    for x in data:
        id_ = str(x.get("id", ""))
        slug = str(x.get("slug") or "")
        name = str(x.get("name") or "").strip()
        size = str(x.get("size") or "")
        cover = x.get("image") or ""
        gallery = x.get("tiles") or []
        flags = []
        if not name: flags.append("missing_name")
        if not id_ or ids[id_]>1: flags.append("missing_or_duplicate_id")
        if not slug or slugs[slug.casefold()]>1: flags.append("missing_or_duplicate_slug")
        if names[name.casefold()]>1: flags.append("repeated_name_check_variant")
        if not SIZE.fullmatch(size): flags.append("size_format_needs_review")
        elif any(float(n)<=0 for n in SIZE.fullmatch(size).groups()): flags.append("invalid_dimensions")
        if not x.get("texture"): flags.append("missing_source_surface")
        if not x.get("types"): flags.append("missing_source_usage")
        if any("porcelain" in str(t).casefold() for t in (x.get("types") or [])):
            flags.append("porcelain_material_needs_manual_category_verification")
        if any(not isinstance(u,str) or urlsplit(u).scheme!="https" for u in gallery):
            flags.append("invalid_gallery_url")
        if len(gallery)!=len(set(gallery)): flags.append("duplicate_gallery_url")
        if cover in gallery: flags.append("primary_repeated_in_gallery")
        image = results.get(cover, ("missing_image",0,0,"","",""))
        if image[0] != "ok":flags.append("primary_"+image[0])
        if args.all_gallery_images:
            bad=[url for url in gallery if results.get(url,("missing_image",))[0]!="ok"]
            if bad:flags.append("gallery_images_unavailable_or_small")
        # The source export genuinely has NO per-product model/code/source page.
        # These never become fabricated values. They are documented provenance limitations.
        flags.extend(["product_code_not_in_source", "model_not_in_source", "localized_names_not_in_source", "individual_product_url_not_in_source"])
        row = {
            "id":id_, "slug":slug, "title_from_source":name, "size_from_source":size,
            "color_from_source":str(x.get("color") or ""), "texture_from_source":str(x.get("texture") or ""),
            "usage_from_source":" | ".join(str(t) for t in (x.get("types") or [])),
            "image_url":cover, "image_status":image[0], "image_width":image[1], "image_height":image[2],
            "image_format":image[4], "image_sha256":image[5],
            "source_gallery_count":len(gallery), "gallery_image_checks":("full" if args.all_gallery_images and not args.offline else "url_structure_only"),
            "review_flags":" | ".join(flags), "flag_count":len(flags)
        }
        rows.append(row)
    hashes=Counter(x["image_sha256"] for x in rows if x["image_sha256"])
    for row in rows:
        if row["image_sha256"] and hashes[row["image_sha256"]]>1:
            row["review_flags"] += " | same_image_bytes_as_another_product"
            row["flag_count"] +=1
    outdir=ROOT/"reports"
    outdir.mkdir(exist_ok=True)
    csv_file=outdir/"catalogue-artceramic-per-product.csv"
    with csv_file.open("w",newline="",encoding="utf-8-sig") as f:
        w=csv.DictWriter(f,fieldnames=rows[0].keys())
        w.writeheader();w.writerows(rows)
    checks=Counter(row["image_status"] for row in rows)
    flagcounts=Counter(f for r in rows for f in r["review_flags"].split(" | ") if f)
    summary={
        "date_utc":datetime.now(timezone.utc).isoformat(),
        "source_file":str(SOURCE.relative_to(ROOT)), "catalogue_total":len(rows),
        "unique_ids":len(ids),"unique_slugs":len(slugs),"repeated_product_names":sum(v>1 for v in names.values()),
        "unique_primary_urls":len(primaries),"all_unique_gallery_and_primary_urls":len({url for x in data for url in [x.get("image"),*(x.get("tiles") or [])] if url}),
        "image_checks":dict(checks), "flags":dict(flagcounts),
        "network_image_checks_enabled":not args.offline,
        "all_gallery_images_checked":args.all_gallery_images,
        "quality_threshold":"700x500 px; inspect artistic/technical suitability manually; no automatic image filters or source substitution",
        "known_provenance_limits":"Art Ceramic export lacks per-product model/SKU, verified category, source product URL and localized names; must not fabricate them.",
        "note":"Only 475 products from committed artceramic.json; pending/staged external supplier API is excluded. This audit does not certify correctness against manufacturer documentation or appearance on every physical phone."
    }
    (outdir/"catalogue-artceramic-summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(summary,ensure_ascii=False,indent=2),flush=True)
    if args.strict and any(s not in ("ok","not_checked") for s in checks):return 1
    return 0

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--workers",type=int,default=10)
    parser.add_argument("--timeout",type=int,default=12)
    parser.add_argument("--all-gallery-images",action="store_true")
    parser.add_argument("--offline",action="store_true")
    parser.add_argument("--strict",action="store_true")
    sys.exit(audit(parser.parse_args()))
