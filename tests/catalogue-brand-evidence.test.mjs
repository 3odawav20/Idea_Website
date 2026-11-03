import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root="docs/catalogue/supplier-qa-2026-11-03/";
const products=JSON.parse(readFileSync(root+"quarantine-products.json","utf8"));
const summary=JSON.parse(readFileSync(root+"brand-evidence-summary.json","utf8"));
const identity=readFileSync("scripts/catalogue/identity.py","utf8");
const card=readFileSync("src/app/components/ProductCard.tsx","utf8");
const studio=readFileSync("src/app/pages/AiVisualizerStudio.tsx","utf8");

test("shopify vendor is product brand evidence, retailer is not a manufacturer",()=>{
  assert.equal(summary.source_shopify_vendor_brand,379);
  assert.equal(summary.source_product_title_brand,129);
  assert.equal(summary.brand_requires_more_evidence,135);
  assert.equal(summary.manufacturer_identity_documented,0);
  assert.equal(summary.unique_brand_names,12);
  assert.equal(products.length,643);
  assert.equal(products.filter(p=>p.source_id==="source-08").length,379);
  assert.equal(products.filter(p=>p.source_id==="source-05"&&!p.product_brand).length,135);
  assert.match(identity,/SHOPIFY_TILE_BRANDS/);
  assert.match(identity,/if source_id=="source-08"/);
  assert.match(identity,/return None,None/);
  assert.equal(summary.per_brand["Kale Turkey"],12);
  assert.equal(summary.per_brand["Beroia"],19);
});
test("brand attribution has auditable provenance and does not expose supplier prices",()=>{
  const ids=new Set();
  for(const item of products){
    assert.match(item.idea_reference_code,/^IDEA-REF-[A-F0-9]{16}$/);
    assert.ok(!ids.has(item.idea_reference_code),"duplicate IDEA reference");
    ids.add(item.idea_reference_code);
    assert.equal(item.price,null);
    assert.equal(item.approved,false);
    assert.equal(item.publicly_live,false);
    assert.equal(item.manufacturer,null);
    if(item.product_brand)assert.ok(["shopify_tile_vendor","supplier_product_title"].includes(item.product_brand_evidence));
    else assert.equal(item.product_brand_evidence,null);
  }
});
test("material-only product cards distinguish actual maker, brand and IDEA references",()=>{
  assert.match(card,/ideaInternalCode\(product\)/);
  assert.match(card,/productMaker\(product, locale\)/);
  assert.match(card,/maker\.verified \? maker\.value : product\.brand/);
  assert.match(card,/idea-material-photo/);
  assert.match(studio,/materialFaces\(product\)\[0\]/);
  assert.match(studio,/ideaInternalCode\(product\)/);
  assert.match(studio,/sourceSku\(product\)/);
});
