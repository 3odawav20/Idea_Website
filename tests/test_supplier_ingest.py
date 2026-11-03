"""Offline regression checks; no supplier requests, no paid service, no production."""
from pathlib import Path
import sys
import json
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"/"catalogue"))
from ingest import SOURCES, material_from, sizes_from, product_from_shopify
from woo_adapter import from_woo

class IngestionQA(unittest.TestCase):
    def test_exact_forty_source_ids_and_urls(self):
        self.assertEqual(len(SOURCES),40)
        self.assertEqual(len({s["source_id"] for s in SOURCES}),40)
        self.assertTrue(all(s["url"].startswith(("https://","http://")) for s in SOURCES))
        self.assertEqual(SOURCES[7]["url"],"https://abaelmozahem.com/collections/ceramic")
        self.assertEqual(SOURCES[4]["url"],"https://www.cleopatraceramics.store/ar/")
    def test_deduplicate_known_provider_hosts(self):
        self.assertEqual(SOURCES[18]["url"].split("/")[2],SOURCES[9]["url"].split("/")[2])
        self.assertEqual(SOURCES[23]["url"].split("/")[2],SOURCES[29]["url"].split("/")[2])
        self.assertEqual(SOURCES[20]["url"],SOURCES[37]["url"])
    def test_material_categories_are_not_assigned_from_visual_effect(self):
        self.assertIsNone(material_from("","Marble effect".split(),"","Porcelain marble-look"))
        self.assertEqual(material_from("Porcelain tile",["Marble look"],None,"Carrara"),"porcelain")
        self.assertEqual(material_from("Wall Ceramic",["Bathroom"],None,"Tile"),"ceramics")
        self.assertEqual(material_from("Natural Marble",[],None,"Carrara"),"natural_marble")
        self.assertIsNone(material_from("Bathtub Ceramic",[],None,"Bathtub"))
    def test_dimensions_normalized_only_when_printed(self):
        self.assertEqual(sizes_from("Carrara 60x120 cm","")["label"],"60 × 120 cm")
        self.assertEqual(sizes_from("بلاط مقاس 30×60 سم","")["width_cm"],30.0)
        self.assertIsNone(sizes_from("Carrara marble-white",""))
        self.assertIsNone(sizes_from("1000x1000 cm",""))
    def test_shopify_quarantine_and_no_prices_or_fabricated_factory(self):
        raw={"id":201,"title":"Porcelain Carrara 60x120 cm","handle":"carrara",
             "vendor":"Bathroom Retailer","product_type":"Porcelain tile","tags":["Marble look"],
             "body_html":"<p>Porcelain product</p>",
             "variants":[{"id":22,"sku":"P-2026","price":"1470.00"}],
             "images":[{"src":"https://supplier.example/carrara.jpg"}]}
        rec=product_from_shopify(raw,SOURCES[7])
        self.assertEqual(rec["material"],"porcelain")
        self.assertEqual(rec["stage"],"QUARANTINE")
        self.assertFalse(rec["approved"])
        self.assertFalse(rec["publicly_live"])
        self.assertIsNone(rec["manufacturer"])
        self.assertNotIn("1470.00",json.dumps(rec))
        self.assertEqual(rec["variant_count"],1)
        self.assertEqual(rec["size"]["label"],"60 × 120 cm")
    def test_woo_exposes_supplier_proved_porcelain_and_drops_price(self):
        raw={"id":777,"name":"بورسلين فوسيل 60&#215;120 سم","permalink":"https://elrwadgroup.com/product/porcelain/",
             "categories":[{"name":"بورسلين"},{"name":"ارضيات"}],
             "sku":"foseil","prices":{"price":"99000"},"images":[{"src":"https://elrwadgroup.com/tile.webp"}]}
        rec=from_woo(raw,SOURCES[21],{})
        self.assertEqual(rec["material"],"porcelain")
        self.assertEqual(rec["size"]["label"],"60 × 120 cm")
        self.assertEqual(rec["sku"],"foseil")
        self.assertEqual(rec["stage"],"QUARANTINE")
        self.assertNotIn("99000",json.dumps(rec,ensure_ascii=False))
    def test_woo_quarantine_and_no_prices(self):
        raw={"id":32208,"name":"Joker Brown","permalink":"https://www.cleopatraceramics.store/product/joker-brown/",
            "prices":{"price":"70000"},"images":[{"src":"https://www.cleopatraceramics.store/wp-content/uploads/joker.jpg"}]}
        rec=from_woo(raw,SOURCES[4],{"material":"porcelain","size":{"label":"60 × 120 cm"},"supplier_category":"Porcelain stoneware"})
        self.assertEqual(rec["stage"],"QUARANTINE")
        self.assertIsNone(rec["sku"])
        self.assertIsNone(rec["manufacturer"])
        self.assertIn("missing_required_product_evidence",rec["flags"])
        self.assertNotIn("70000",json.dumps(rec))

    def test_canonical_source_registry_matches_current_exact_url_list(self):
        reg=json.loads((ROOT/"src/app/data/sourceRegistry.json").read_text("utf-8"))
        r={item["source_id"]:item for item in reg["sources"]}
        self.assertEqual(len(r),40)
        for source in SOURCES:
            self.assertEqual(r[source["source_id"]]["approved_input_url_2026_11_03"],source["url"])
        self.assertEqual(sum(item.get("product_count",0) for item in reg["sources"]),json.loads((ROOT/"docs/catalogue/supplier-qa-2026-11-03/baseline.json").read_text("utf-8"))["existing_registry_extracted_sum_not_verified"])
    def test_quarantine_output_not_public_and_no_source_prices_leak(self):
        path=ROOT/"docs/catalogue/supplier-qa-2026-11-03/quarantine-products.json"
        records=json.loads(path.read_text("utf-8"))
        self.assertEqual(len(records),json.loads((ROOT/"docs/catalogue/supplier-qa-2026-11-03/report.json").read_text("utf-8"))["new_extracted"])
        self.assertEqual(len({r["idea_staging_id"] for r in records}),len(records))
        self.assertTrue(all(r["stage"]=="QUARANTINE" and not r["approved"] and not r["publicly_live"] for r in records))
        self.assertTrue(all(r.get("price") is None for r in records))
        self.assertTrue(all("image_rights_unconfirmed" in r["flags"] for r in records))
        self.assertFalse(any("prices" in r or "price_html" in r for r in records))

if __name__=="__main__":
    unittest.main()
