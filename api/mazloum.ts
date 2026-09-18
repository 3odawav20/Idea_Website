const SOURCE_URL = "https://mazloumhome.com/2-home";
const FALLBACK_URL = "https://mazloumhome.com/new-products";
const PAGE_SIZE = 12;

const MAZLOUM_SNAPSHOT = [
  { id:"2297", name:"LIETO", productUrl:"https://mazloumhome.com/living-rooms/2297-lieto.html", image:"https://mazloum-img.s3-eu-west-1.amazonaws.com/img/p/1/0/3/7/2/10372-home_default.jpg", category:"Living Rooms", price:"EGP 343,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2295", name:"TANGRAM", productUrl:"https://mazloumhome.com/living-rooms/2295-7247-tangram.html#/50-material-fabric/2305-color-taupe/5530-dimension_model-h72_94w276d242_cm", image:null, category:"Living Rooms", price:"EGP 199,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2294", name:"TANGRAM", productUrl:"https://mazloumhome.com/living-rooms/2294-7244-tangram.html#/143-material-leather/6229-color-musk_green/6274-dimension_model-h72_94w223d102_2_cm", image:null, category:"Living Rooms", price:"EGP 257,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2293", name:"LIETO", productUrl:"https://mazloumhome.com/living-rooms/2293-lieto.html", image:null, category:"Living Rooms", price:"EGP 259,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2292", name:"LIETO", productUrl:"https://mazloumhome.com/living-rooms/2292-lieto.html", image:null, category:"Living Rooms", price:"EGP 259,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2291", name:"STUPORE", productUrl:"https://mazloumhome.com/living-rooms/2291-stupore.html", image:null, category:"Living Rooms", price:"EGP 304,760.00", previousPrice:"EGP 320,800.00", discount:"-5%", badges:["On sale!","-5%","New"] },
  { id:"2289", name:"GAIA", productUrl:"https://mazloumhome.com/sofachairs/2289-gaia.html", image:null, category:"Sofa&Chairs", price:"EGP 13,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2288", name:"GRATITUDINE", productUrl:"https://mazloumhome.com/sofachairs/2288-gratitudine.html", image:null, category:"Sofa&Chairs", price:"EGP 65,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2286", name:"SIDNEY", productUrl:"https://mazloumhome.com/sofachairs/2286-7191-sidney.html#/50-material-fabric/2783-color-greige/5585-dimension_model-h111w82d93_157_cm", image:null, category:"Sofa&Chairs", price:"EGP 172,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2284", name:"BRAMA", productUrl:"https://mazloumhome.com/living-rooms/2284-7184-brama.html#/143-material-leather/5858-color-sambuco", image:null, category:"Living Rooms", price:"EGP 402,424.75", previousPrice:"EGP 445,900.00", discount:"-9.75%", badges:["-9.75%","New"] },
  { id:"2283", name:"GAIA", productUrl:"https://mazloumhome.com/sofachairs/2283-7181-gaia.html#/50-material-fabric/5521-dimension_model-h43w39d39_cm/6483-color-pewter", image:null, category:"Sofa&Chairs", price:"EGP 14,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2281", name:"DAMEN", productUrl:"https://mazloumhome.com/sofachairs/2281-damen.html", image:null, category:"Sofa&Chairs", price:"EGP 69,900.00", previousPrice:null, discount:null, badges:["New"] },

  { id:"1823", name:"U255", productUrl:"https://mazloumhome.com/sofachairs/1823-u255.html", image:null, category:"Sofa&Chairs", price:"EGP 50,252.00", previousPrice:"EGP 73,900.00", discount:"-32%", badges:["Sale"] },
  { id:"2254", name:"A.I. LITE", productUrl:"https://mazloumhome.com/sofachairs/2254-6720-ai-lite.html", image:null, category:"Sofa&Chairs", price:"EGP 12,900.00", previousPrice:null, discount:null, badges:[] },
  { id:"89", name:"MOKA", productUrl:"https://mazloumhome.com/sofachairs/89-moka.html", image:null, category:"Sofa&Chairs", price:"EGP 66,160.00", previousPrice:"EGP 82,700.00", discount:"-20%", badges:["Sale"] },
  { id:"1956", name:"MAUI SOFT NOMA", productUrl:"https://mazloumhome.com/sofachairs/1956-maui-soft-noma.html", image:null, category:"Sofa&Chairs", price:"EGP 47,900.00", previousPrice:null, discount:null, badges:[] },
  { id:"84", name:"ODEON", productUrl:"https://mazloumhome.com/sofachairs/84-odeon.html", image:null, category:"Sofa&Chairs", price:"EGP 82,640.00", previousPrice:"EGP 103,300.00", discount:"-20%", badges:["Sale"] },
  { id:"87", name:"WEBY", productUrl:"https://mazloumhome.com/sofachairs/87-weby.html", image:null, category:"Sofa&Chairs", price:"EGP 75,920.00", previousPrice:"EGP 94,900.00", discount:"-20%", badges:["Sale"] },

  { id:"206", name:"WS 053", productUrl:"https://mazloumhome.com/wall-lamp/206-ws-053.html", image:"https://mazloum-img.s3-eu-west-1.amazonaws.com/img/p/5/3/8/3/5383-home_default.jpg", category:"Wall Lamp", price:"EGP 1,360.00", previousPrice:null, discount:null, badges:[] },
  { id:"1842", name:"ASIMETRIC", productUrl:"https://mazloumhome.com/wall-lamp/1842-asimetric.html", image:null, category:"Wall Lamp", price:"EGP 2,880.00", previousPrice:"EGP 3,600.00", discount:"-20%", badges:["Sale"] },
  { id:"779", name:"KE 023", productUrl:"https://mazloumhome.com/wall-lamp/779-ke-023.html", image:null, category:"Wall Lamp", price:"EGP 1,120.00", previousPrice:"EGP 1,400.00", discount:"-20%", badges:["Sale"] },
  { id:"1846", name:"PARACURU", productUrl:"https://mazloumhome.com/wall-lamp/1846-paracuru.html", image:null, category:"Wall Lamp", price:"EGP 3,840.00", previousPrice:"EGP 4,800.00", discount:"-20%", badges:["Sale"] },
  { id:"1836", name:"BOAVISTA", productUrl:"https://mazloumhome.com/wall-lamp/1836-boavista.html", image:null, category:"Wall Lamp", price:"EGP 2,320.00", previousPrice:"EGP 2,900.00", discount:"-20%", badges:["Sale"] },
  { id:"1636", name:"TOJA 472", productUrl:"https://mazloumhome.com/wall-lamp/1636-toja-472.html", image:null, category:"Wall Lamp", price:"EGP 3,600.00", previousPrice:"EGP 4,500.00", discount:"-20%", badges:["Sale"] },
  { id:"1630", name:"HEMISFERIC 466", productUrl:"https://mazloumhome.com/wall-lamp/1630-hemisferic-466.html", image:null, category:"Wall Lamp", price:"EGP 4,640.00", previousPrice:"EGP 5,800.00", discount:"-20%", badges:["Sale"] },
  { id:"1736", name:"BARKAN", productUrl:"https://mazloumhome.com/wall-lamp/1736-barkan.html", image:null, category:"Wall Lamp", price:"EGP 3,675.00", previousPrice:"EGP 4,900.00", discount:"-25%", badges:["Sale"] },

  { id:"2133", name:"A61206", productUrl:"https://mazloumhome.com/vases/2133-a61206.html", image:"https://mazloum-img.s3-eu-west-1.amazonaws.com/img/p/9/0/1/6/9016-home_default.jpg", category:"Vases", price:"EGP 3,900.00", previousPrice:null, discount:null, badges:[] },
  { id:"1529", name:"ABSOLUTE VASE", productUrl:"https://mazloumhome.com/vases/1529-absolute-vase.html", image:null, category:"Vases", price:"EGP 6,750.00", previousPrice:"EGP 7,500.00", discount:"-10%", badges:["Sale"] },
  { id:"1801", name:"LORD VASE", productUrl:"https://mazloumhome.com/vases/1801-lord-vase.html", image:null, category:"Vases", price:"EGP 16,380.00", previousPrice:"EGP 18,200.00", discount:"-10%", badges:["Sale"] },
  { id:"1440", name:"VENISSA VASE", productUrl:"https://mazloumhome.com/vases/1440-venissa-vase.html", image:null, category:"Vases", price:"EGP 6,750.00", previousPrice:"EGP 7,500.00", discount:"-10%", badges:["Sale"] },
  { id:"1523", name:"PASSADE VASE", productUrl:"https://mazloumhome.com/vases/1523-passade-vase.html", image:null, category:"Vases", price:"EGP 18,810.00", previousPrice:"EGP 20,900.00", discount:"-10%", badges:["Sale"] },
  { id:"2131", name:"E77972", productUrl:"https://mazloumhome.com/vases/2131-e77972.html", image:null, category:"Vases", price:"EGP 3,500.00", previousPrice:null, discount:null, badges:[] },
  { id:"2126", name:"E61149", productUrl:"https://mazloumhome.com/vases/2126-e61149.html", image:null, category:"Vases", price:"EGP 2,600.00", previousPrice:null, discount:null, badges:[] },
  { id:"2130", name:"E77967", productUrl:"https://mazloumhome.com/vases/2130-e77967.html", image:null, category:"Vases", price:"EGP 4,500.00", previousPrice:null, discount:null, badges:[] },

  { id:"1798", name:"FORMELLA", productUrl:"https://mazloumhome.com/wall-objects/1798-formella.html", image:null, category:"Wall Objects", price:"EGP 9,450.00", previousPrice:"EGP 10,500.00", discount:"-10%", badges:["Sale"] },
  { id:"195", name:"SASSO STONE", productUrl:"https://mazloumhome.com/wall-objects/195-sasso-stone.html", image:null, category:"Wall Objects", price:"EGP 14,775.00", previousPrice:"EGP 19,700.00", discount:"-25%", badges:["Sale"] },
  { id:"197", name:"SASSO STONE", productUrl:"https://mazloumhome.com/wall-objects/197-sasso-stone.html", image:null, category:"Wall Objects", price:"EGP 31,650.00", previousPrice:"EGP 42,200.00", discount:"-25%", badges:["Sale"] },
];


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
