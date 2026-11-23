import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const REQUIRED_LEGAL_ROUTES = [
  "/legal",
  "/privacy",
  "/terms",
  "/cookies",
  "/refund-policy",
  "/intellectual-property",
  "/licenses",
  "/accessibility",
];

test("App.tsx mounts all 8 dedicated legal and license sitelink routes", () => {
  const appSrc = readFileSync("src/app/App.tsx", "utf8");
  for (const route of REQUIRED_LEGAL_ROUTES) {
    assert.match(appSrc, new RegExp(`path="${route}"`), `Missing route ${route} in App.tsx`);
  }
});

test("legalDocuments.ts provides complete trilingual legal content, OSS licenses, and canonical URL helper", async () => {
  const mod = await import("../src/app/data/legalDocuments.ts");
  const {
    LEGAL_DOCUMENTS,
    OPEN_SOURCE_LICENSES,
    getLegalDocumentBySlug,
    getLegalCanonicalUrl,
    getAllLegalSitelinks,
  } = mod;

  assert.equal(LEGAL_DOCUMENTS.length, 7);
  for (const doc of LEGAL_DOCUMENTS) {
    for (const lang of ["ar", "en", "fr"]) {
      assert.ok(doc.title[lang]?.trim().length > 5, `${doc.slug} missing ${lang} title`);
      assert.ok(doc.summary[lang]?.trim().length > 15, `${doc.slug} missing ${lang} summary`);
      assert.ok(doc.shortLabel[lang]?.trim().length > 2, `${doc.slug} missing ${lang} shortLabel`);
    }
    assert.ok(doc.sections.length >= 2, `${doc.slug} must have at least 2 structured sections`);
    assert.equal(getLegalDocumentBySlug(doc.slug)?.path, doc.path);
  }

  assert.ok(OPEN_SOURCE_LICENSES.length >= 6, "Must list core open-source licenses");
  assert.equal(getLegalCanonicalUrl("/privacy"), "https://idea-dh.com/privacy");
  assert.equal(getLegalCanonicalUrl("terms", "https://idea-dh.com/"), "https://idea-dh.com/terms");

  const sitelinks = getAllLegalSitelinks();
  assert.deepEqual(
    sitelinks.map((s) => s.path),
    REQUIRED_LEGAL_ROUTES
  );
});

test("public/sitemap.xml and public/robots.txt expose all legal sitelinks and exclude private portals", () => {
  const sitemap = readFileSync("public/sitemap.xml", "utf8");
  const robots = readFileSync("public/robots.txt", "utf8");

  for (const route of REQUIRED_LEGAL_ROUTES) {
    assert.ok(
      sitemap.includes(`<loc>https://idea-dh.com${route}</loc>`),
      `sitemap.xml missing ${route}`
    );
    assert.ok(robots.includes(`Allow: ${route}`), `robots.txt missing Allow: ${route}`);
  }
  assert.match(robots, /Disallow:\s*\/admin/);
  assert.match(robots, /Disallow:\s*\/account/);
  assert.match(robots, /Sitemap:\s*https:\/\/idea-dh\.com\/sitemap\.xml/);
});

test("index.html embeds valid Schema.org Organization, WebSite SearchAction, and SiteNavigationElement sitelinks JSON-LD", () => {
  const html = readFileSync("index.html", "utf8");
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, "index.html must include JSON-LD structured data");
  const jsonLd = JSON.parse(match[1]);
  assert.equal(jsonLd["@context"], "https://schema.org");
  assert.ok(Array.isArray(jsonLd["@graph"]));

  const types = new Set(jsonLd["@graph"].map((node) => node["@type"]));
  assert.ok(types.has("Organization"));
  assert.ok(types.has("WebSite"));
  assert.ok(types.has("ItemList"));

  const sitelinksNode = jsonLd["@graph"].find((node) => node["@type"] === "ItemList");
  const urls = new Set(sitelinksNode.itemListElement.map((el) => el.url));
  for (const route of REQUIRED_LEGAL_ROUTES) {
    assert.ok(urls.has(`https://idea-dh.com${route}`), `JSON-LD sitelinks missing ${route}`);
  }
});

test("Footer.tsx links all 8 legal & license pages and AccountEntry.tsx signup links resolve to real routes", () => {
  const footerSrc = readFileSync("src/app/components/Footer.tsx", "utf8");
  for (const route of REQUIRED_LEGAL_ROUTES) {
    assert.ok(footerSrc.includes(`"${route}"`), `Footer.tsx missing link to ${route}`);
  }
  const accountSrc = readFileSync("src/app/pages/AccountEntry.tsx", "utf8");
  assert.match(accountSrc, /to="\/terms"/);
  assert.match(accountSrc, /to="\/privacy"/);
});
