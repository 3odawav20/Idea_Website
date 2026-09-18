import { MAZLOUM_SNAPSHOT } from "../src/app/data/mazloumSnapshot";
const SOURCE_URL = "https://mazloumhome.com/2-home";
const FALLBACK_URL = "https://mazloumhome.com/new-products";
const PAGE_SIZE = 12;

const SOURCE_HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
  "accept": "text/html,application/xhtml+xml",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  "pragma": "no-cache",
  "referer": "https://mazloumhome.com/",
};

async function fetchCataloguePage(baseUrl, page) {
  const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
  let lastResponse = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: SOURCE_HEADERS, redirect: "follow" });
      lastResponse = response;
      if (response.ok) return { response, url };
    } catch {
      // Retry transient source/network failures below.
    }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 250 : 700));
  }
  return { response: lastResponse, url };
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

function absoluteUrl(value) {
  if (!value) return null;
  try { return new URL(value, SOURCE_URL).toString(); } catch { return null; }
}

function firstMatch(value, patterns) {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return null;
}

function productFromArticle(article) {
  const productUrl = absoluteUrl(firstMatch(article, [
    /<h\d[^>]*class=["'][^"']*product-title[^"']*["'][^>]*>[\s\S]*?<a[^>]*href=["']([^"']+)["']/i,
    /<a[^>]*class=["'][^"']*product-thumbnail[^"']*["'][^>]*href=["']([^"']+)["']/i,
    /<a[^>]*href=["']([^"']+\.html(?:\?[^"']*)?)["'][^>]*>/i,
  ]));

  const name = firstMatch(article, [
    /<h\d[^>]*class=["'][^"']*product-title[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /<h\d[^>]*>([A-Z0-9][\s\S]*?)<\/h\d>/i,
  ]);

  const imageCandidate = firstMatch(article, [
    /<img[^>]*data-full-size-image-url=["']([^"']+)["']/i,
    /<img[^>]*data-original=["']([^"']+)["']/i,
    /<img[^>]*data-lazy-src=["']([^"']+)["']/i,
    /<img[^>]*data-src=["']([^"']+)["']/i,
    /<img[^>]*src=["']([^"']+)["']/i,
    /<(?:img|source)[^>]*(?:data-srcset|srcset)=["']\s*([^,"'\s]+)[^"']*["']/i,
    /<(?:meta|link)[^>]*(?:itemprop|property)=["'](?:image|og:image)["'][^>]*(?:content|href)=["']([^"']+)["']/i,
    /<(?:meta|link)[^>]*(?:content|href)=["']([^"']+)["'][^>]*(?:itemprop|property)=["'](?:image|og:image)["']/i,
    /background-image\s*:\s*url\((?:["']?)([^)"']+)(?:["']?)\)/i,
  ]);
  const image = absoluteUrl(imageCandidate);

  const priceTexts = [...article.matchAll(/<span[^>]*class=["'][^"']*(?:price|regular-price)[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)]
    .map((match) => stripTags(match[1]))
    .filter((value) => /EGP|LE|£|\d/.test(value));
  const uniquePrices = [...new Set(priceTexts)];

  const discount = firstMatch(article, [
    /<span[^>]*class=["'][^"']*(?:discount-percentage|discount-amount)[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
  ]);

  const badges = [...article.matchAll(/<li[^>]*class=["'][^"']*product-flag[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);

  const id = firstMatch(article, [
    /data-id-product=["'](\d+)["']/i,
  ]) || productUrl?.match(/\/(\d+)-[^/?#]+\.html/i)?.[1] || productUrl || name;

  if (!name || !productUrl) return null;

  const path = (() => { try { return new URL(productUrl).pathname; } catch { return ""; } })();
  const categorySlug = path.split("/").filter(Boolean)[0]?.replace(/\.html$/i, "") || null;
  const category = categorySlug ? decodeURIComponent(categorySlug).replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) : null;

  return {
    id: String(id),
    name: stripTags(name),
    productUrl,
    image,
    category,
    price: uniquePrices.at(-1) || null,
    previousPrice: uniquePrices.length > 1 ? uniquePrices[0] : null,
    discount: discount ? stripTags(discount) : null,
    badges: [...new Set(badges)],
  };
}

function parseProducts(html) {
  const articleMatches = [...html.matchAll(/<article\b[^>]*class=["'][^"']*product-miniature[^"']*["'][^>]*>[\s\S]*?<\/article>/gi)]
    .map((match) => match[0]);

  const blocks = articleMatches.length
    ? articleMatches
    : [...html.matchAll(/<div\b[^>]*class=["'][^"']*product-miniature[^"']*["'][^>]*>[\s\S]*?<\/div>\s*<\/div>/gi)].map((match) => match[0]);

  return blocks.map(productFromArticle).filter(Boolean);
}

export default async function handler(req, res) {
  try {
    const requestedPage = Math.max(1, Math.min(200, Number(req.query?.page || 1) || 1));
    let sourceBase = SOURCE_URL;
    let fetched = await fetchCataloguePage(SOURCE_URL, requestedPage);

    if (!fetched.response?.ok) {
      sourceBase = FALLBACK_URL;
      fetched = await fetchCataloguePage(FALLBACK_URL, requestedPage);
    }

    const response = fetched.response;
    if (!response?.ok) {
      const snapshotStart = (requestedPage - 1) * PAGE_SIZE;
      const snapshotProducts = MAZLOUM_SNAPSHOT.slice(snapshotStart, snapshotStart + PAGE_SIZE);
      const total = MAZLOUM_SNAPSHOT.length;
      res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=86400");
      res.status(200).json({
        ok: true,
        source: {
          id: "source-13",
          name: "Mazloum Home",
          url: SOURCE_URL,
          fetchedAt: new Date().toISOString(),
          mode: "verified-snapshot",
        },
        page: requestedPage,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        products: snapshotProducts,
      });
      return;
    }

    const html = await response.text();
    const totalMatch = html.match(/There are\s*([\d,]+)\s*products?/i);
    const showingMatch = html.match(/Showing\s*([\d,]+)\s*-\s*([\d,]+)\s*of\s*([\d,]+)\s*item/i);
    const total = Number((showingMatch?.[3] || totalMatch?.[1] || "0").replace(/,/g, "")) || null;
    const products = parseProducts(html);

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json({
      ok: true,
      source: {
        id: "source-13",
        name: "Mazloum Home",
        url: sourceBase,
        fetchedAt: new Date().toISOString(),
      },
      page: requestedPage,
      pageSize: PAGE_SIZE,
      total,
      totalPages: total ? Math.ceil(total / PAGE_SIZE) : null,
      products,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Unknown Mazloum import error" });
  }
}
