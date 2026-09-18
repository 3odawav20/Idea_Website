
const SOURCE_HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
  "accept": "text/html,application/xhtml+xml",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  "pragma": "no-cache",
  "referer": "https://mazloumhome.com/",
};

async function fetchMazloumPage(url) {
  let lastResponse = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: SOURCE_HEADERS, redirect: "follow" });
      lastResponse = response;
      if (response.ok || response.status < 500) return response;
    } catch (error) {
      if (attempt === 2) throw error;
    }
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 250 : 700));
    }
  }
  return lastResponse;
}

function decodeHtml(value = "") {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value = "") {
  return decodeHtml(value.replace(/<[^>]*>/g, " "));
}

function collectJsonLd(value, out) {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLd(item, out);
    return;
  }
  if (typeof value !== "object") return;
  out.push(value);
  if (Array.isArray(value["@graph"])) collectJsonLd(value["@graph"], out);
}

function parseJsonLd(html) {
  const nodes = [];
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const raw = match[1].trim();
      if (!raw) continue;
      collectJsonLd(JSON.parse(raw), nodes);
    } catch {
      // Ignore malformed third-party structured data.
    }
  }
  return nodes;
}

function absolutize(value, base) {
  if (!value) return null;
  try { return new URL(value, base).toString(); } catch { return null; }
}

function asText(value) {
  if (typeof value === "string") return stripTags(value);
  if (typeof value === "number") return String(value);
  return null;
}

export default async function handler(req, res) {
  try {
    const rawUrl = String(req.query?.url || "");
    if (!rawUrl) {
      res.status(400).json({ ok: false, error: "Missing Mazloum product URL." });
      return;
    }

    const target = new URL(rawUrl);
    if (!(target.hostname === "mazloumhome.com" || target.hostname.endsWith(".mazloumhome.com"))) {
      res.status(400).json({ ok: false, error: "Unsupported product source." });
      return;
    }

    const fetchTarget = new URL(target.toString());
    fetchTarget.hash = "";
    const response = await fetchMazloumPage(fetchTarget.toString());

    if (!response || !response.ok) {
      const status = response?.status || 502;
      res.status(status).json({ ok: false, error: `Mazloum source returned HTTP ${status} after retries` });
      return;
    }

    const html = await response.text();
    const nodes = parseJsonLd(html);
    const product = nodes.find((node) => {
      const type = node?.["@type"];
      return type === "Product" || (Array.isArray(type) && type.includes("Product"));
    }) || {};

    const breadcrumb = nodes.find((node) => node?.["@type"] === "BreadcrumbList");
    const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers || {};

    const galleryFromLd = Array.isArray(product.image) ? product.image : product.image ? [product.image] : [];
    const galleryFromHtml = [
      ...[...html.matchAll(/data-image-large-src=["']([^"']+)["']/gi)].map((m) => m[1]),
      ...[...html.matchAll(/data-full-size-image-url=["']([^"']+)["']/gi)].map((m) => m[1]),
      ...[...html.matchAll(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi)].map((m) => m[1]),
      ...[...html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/gi)].map((m) => m[1]),
    ];
    const gallery = [...new Set([...galleryFromLd, ...galleryFromHtml].map((image) => absolutize(image, target.toString())).filter(Boolean))];

    const features = [];
    const featureBlock = html.match(/<section[^>]*class=["'][^"']*product-features[^"']*["'][^>]*>([\s\S]*?)<\/section>/i)?.[1] || "";
    const dts = [...featureBlock.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)];
    for (const match of dts) {
      const label = stripTags(match[1]);
      const value = stripTags(match[2]);
      if (label && value) features.push({ label, value });
    }

    const name = asText(product.name)
      || stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "")
      || "Mazloum product";

    const description = asText(product.description)
      || stripTags(html.match(/<div[^>]*class=["'][^"']*product-description[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || "");

    const brand = typeof product.brand === "string"
      ? stripTags(product.brand)
      : asText(product.brand?.name);

    const breadcrumbs = Array.isArray(breadcrumb?.itemListElement)
      ? breadcrumb.itemListElement.map((entry) => asText(entry?.name || entry?.item?.name)).filter(Boolean)
      : [];

    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=7200");
    res.status(200).json({
      ok: true,
      sourceUrl: target.toString(),
      name,
      description: description || null,
      sku: asText(product.sku || product.mpn),
      brand,
      gallery,
      breadcrumbs,
      features,
      price: asText(offer.price),
      priceCurrency: asText(offer.priceCurrency) || "EGP",
      availability: asText(offer.availability)?.split("/").at(-1) || null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Unknown Mazloum detail error" });
  }
}
