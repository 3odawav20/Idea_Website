import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ART_CERAMIC_PRODUCTS } from "../app/data/artceramicImport";
import { distinctStorefrontProducts } from "../app/data/storefrontDistinct";
import {
  buildSidebarFacets,
  extractSurfaceSpecs,
  filterCatalogueProduct,
  matchesColorFamily,
  matchesMaterialCategory,
  matchesSurfaceLook,
  resolveActiveMaterialCategory,
} from "./catalogue-filters";

const distinctProducts = distinctStorefrontProducts(ART_CERAMIC_PRODUCTS);

describe("catalogue-filters", () => {
  it("builds accurate material categories including ceramics, porcelain, tiles, and marble", () => {
    const facets = buildSidebarFacets(distinctProducts, distinctProducts);
    const keys = facets.materialCategories.map((c) => c.key);
    assert.deepEqual(keys, ["all", "ceramics", "porcelain", "tiles", "marble"]);

    const ceramics = facets.materialCategories.find((c) => c.key === "ceramics");
    const tiles = facets.materialCategories.find((c) => c.key === "tiles");
    const porcelain = facets.materialCategories.find((c) => c.key === "porcelain");
    const marble = facets.materialCategories.find((c) => c.key === "marble");

    assert.equal(ceramics?.count, distinctProducts.length);
    assert.equal(tiles?.count, distinctProducts.length);
    assert.equal(porcelain?.count, 0);
    assert.equal(marble?.count, 0);
  });

  it("extracts real surface specs without duplicating Matte/Glossy finishes", () => {
    const facets = buildSidebarFacets(distinctProducts, distinctProducts);
    const specNames = facets.surfaceSpecs.map(([name]) => name);
    assert.ok(specNames.includes("Nature"));
    assert.ok(specNames.includes("High Resistance"));
    assert.ok(specNames.includes("Anti Slip"));
    assert.ok(!specNames.includes("Matt"));
    assert.ok(!specNames.includes("Glossy"));

    const sampleNature = distinctProducts.find((p) =>
      p.source?.originalSurface?.includes("Nature"),
    );
    assert.ok(sampleNature);
    assert.deepEqual(extractSurfaceSpecs(sampleNature), ["Nature"]);
  });

  it("classifies surface looks accurately with word boundaries (no false positives)", () => {
    const facets = buildSidebarFacets(distinctProducts, distinctProducts);
    const byKey = new Map(facets.surfaceLooks.map((l) => [l.key, l.count]));
    assert.ok((byKey.get("marble-look") ?? 0) >= 10);
    assert.ok((byKey.get("wood-look") ?? 0) >= 10);
    assert.ok((byKey.get("stone-look") ?? 0) >= 10);
    assert.ok((byKey.get("mosaic-pattern") ?? 0) >= 5);

    const dash = distinctProducts.find((p) => p.name.en === "Dash");
    if (dash) {
      assert.equal(matchesSurfaceLook(dash, "wood-look"), false);
    }
  });

  it("matches normalized color families and raw color labels seamlessly", () => {
    const greyProduct = distinctProducts.find((p) => p.colors?.includes("Grey"));
    assert.ok(greyProduct);
    assert.equal(matchesColorFamily(greyProduct, "grey"), true);
    assert.equal(matchesColorFamily(greyProduct, "Grey"), true);
    assert.equal(matchesColorFamily(greyProduct, "green"), false);
  });

  it("filters products cleanly across combined facets", () => {
    const filtered = distinctProducts.filter((product) =>
      filterCatalogueProduct(product, {
        category: "ceramics",
        material: null,
        look: "marble-look",
        surface: null,
        format: null,
        finish: "Matte",
        application: null,
        size: null,
        usage: null,
        color: "grey",
        brand: null,
        type: null,
        texture: null,
      }),
    );
    assert.ok(filtered.length > 0);
    for (const item of filtered) {
      assert.equal(matchesMaterialCategory(item, "ceramics"), true);
      assert.equal(matchesSurfaceLook(item, "marble-look"), true);
      assert.equal(item.finish, "Matte");
      assert.equal(matchesColorFamily(item, "grey"), true);
    }
  });

  it("resolves active material category from URL search params", () => {
    assert.equal(resolveActiveMaterialCategory(null, null), "all");
    assert.equal(resolveActiveMaterialCategory("ceramics", null), "ceramics");
    assert.equal(resolveActiveMaterialCategory("porcelain", null), "porcelain");
    assert.equal(resolveActiveMaterialCategory(null, "tiles"), "tiles");
    assert.equal(resolveActiveMaterialCategory(null, "marble"), "marble");
  });
});
