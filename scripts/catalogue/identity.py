"""Source-backed IDEA listing codes, product BRANDS and maker verification."""
from __future__ import annotations
import re
from typing import Any

MASK=(1<<64)-1
PRIME=0x100000001b3
SEED=0xcbf29ce484222325

# Exact Shopify public vendor values observed at abaelmozahem.com (source-08).
# Site labels this category "براند البلاط" (Tile brand). Neither this field
# nor a shop title is proof of the legal factory/manufacturer identity.
SHOPIFY_TILE_BRANDS={
    "cleopatra":"Ceramica Cleopatra", "gemma":"Gemma", "granito":"Granito",
    "art":"Art Ceramic", "prima":"Prima", "beroia":"Beroia",
    "kale turkey":"Kale Turkey",
}
# Limited patterns explicitly present in seller product headings; candidates
# remain "source_title" evidence unless verified from product page brand field.
TITLE_BRANDS=(
    (r"كليوباترا|\bcleopatra\b","Ceramica Cleopatra"),
    (r"الجوهرة|الجوهره|\bgemma\b","Gemma"),
    (r"بريما|\bprima\b","Prima"),
    (r"جرانيتو|\bgranito\b","Granito"),
    (r"جلوريا|\bgloria\b","Gloria"),
    (r"سيراميك ارت|\bart ceramic\b","Art Ceramic"),
    (r"بيرويا|\bberoia\b","Beroia"),
    (r"كالي تركيا|\bkale turkey\b","Kale Turkey"),
    (r"ايديال لايف|\bideal life\b","Ideal Life"),
    (r"بورسيلوكس|\bporcelux\b","Porcelux"),
    (r"فارمورا|\bfarmora\b","Farmora"),
    (r"رويال|\broyal\b","Royal"),
)

def idea_reference(source_id: str, source_product_id: str) -> str:
    identity=(str(source_id)+"|"+str(source_product_id)).encode("utf-8")
    h=SEED
    for byte in identity:
        h=((h ^ byte) * PRIME) & MASK
    return "IDEA-REF-"+format(h,"016X")

def source_claimed_brand(title: str) -> str | None:
    for pattern, brand in TITLE_BRANDS:
        if re.search(pattern, title or "", flags=re.IGNORECASE):
            return brand
    return None

def review_brand_evidence(item: dict[str,Any]) -> tuple[str|None,str|None]:
    """Distinguish a product brand from a marketplace/retailer identity."""
    source_id=item.get("source_id")
    vendor=str(item.get("retailer_vendor") or "").strip()
    if source_id=="source-08":
        recognized=SHOPIFY_TILE_BRANDS.get(vendor.casefold())
        if recognized:
            return recognized,"shopify_tile_vendor"
    title_brand=source_claimed_brand(item.get("name") or "")
    if title_brand:
        return title_brand,"supplier_product_title"
    # Ceramica Cleopatra Group itself links to cleopatraceramics.store as its
    # official ecommerce shop. This is source-STORE brand context, weaker than a
    # product-specific vendor field; it never asserts legal manufacturer.
    source_url=str(item.get("source_url") or "").lower()
    if source_id=="source-05" and "cleopatraceramics.store" in source_url and vendor.casefold()=="cleopatra ceramic store":
        return "Ceramica Cleopatra","official_brand_store"
    # Do not claim "El Sewify", "Elrwad", "Alwan" or "Cleopatra Ceramic
    # Store" are manufacturers or brands of every product in their shops.
    return None,None

def decorate_for_review(item: dict[str,Any]) -> dict[str,Any]:
    """Each source listing gets unique stable code plus brand provenance."""
    item["idea_reference_code"]=idea_reference(item["source_id"],item["source_product_id"])
    item["brand_named_in_supplier_title"]=source_claimed_brand(item.get("name",""))
    brand,brand_source=review_brand_evidence(item)
    item["product_brand"]=brand
    item["product_brand_evidence"]=brand_source
    item["brand_review_status"]="source_field" if brand_source=="shopify_tile_vendor" else (
        "official_store_context" if brand_source=="official_brand_store" else (
            "title_candidate" if brand_source else "requires_source_proof")
    )
    item["manufacturer_review_status"]=(
        "source_verified" if item.get("manufacturer") else "requires_product_level_proof"
    )
    return item
