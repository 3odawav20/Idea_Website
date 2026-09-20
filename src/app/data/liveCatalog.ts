import type { CollectionSlug, Product, ProductSpecificationItem } from "./types";
import { cleanCatalogText, isPresentableImageUrl } from "./catalogPresentation";
import { sourceProviderName } from "./catalogSources";

const API_BASE = (import.meta.env.VITE_CATALOG_API_BASE_URL || "").replace(/\/$/, "");
const catalogUrl = (query: string) => API_BASE ? `${API_BASE}/api.php?${query}` : `/api/catalog?${query}`;
const PAGE_SIZE = 500;
const PAGE_CONCURRENCY = 3;

const SOURCE_FEEDS = [
  "source-04",
  "source-06",
  "source-08",
  "source-12",
  "source-13",
  "source-22",
  "source-25",
  "source-36",
] as const;

const DISPLAY_COLLECTIONS = new Set<CollectionSlug>([
  "ceramics",
  "porcelain",
  "marble",
  "sanitary-ware",
  "faucets",
  "bathroom-units",
  "bathtubs",
  "shower-units",
  "bathroom-accessories",
  "plumbing-products",
  "furniture",
  "lighting",
  "home-decor",
]);

const SKIP_SOURCES = new Set(["source-02", "source-05", "source-07", "source-10", "source-20", "source-26", "source-34"]);

interface CatalogRow {
  id: number;
  source_id: string;
  source_record_id: string;
  slug: string;
  name: string;
  brand: string | null;
  sku: string | null;
  collection_slug: string;
  subcategory: string | null;
  product_type: string | null;
  description: string | null;
  material: string | null;
  color: string | null;
  dimension_text: string | null;
  price_text: string | null;
  compare_at_price_text: string | null;
  currency: string | null;
  availability: string | null;
  primary_image_url: string | null;
  source_url: string;
  last_source_sync_at?: string | null;
}

interface ProductPage {
  ok: boolean;
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  products: CatalogRow[];
}

function clean(value?: string | null) {
  const text = cleanCatalogText(value);
  return text || undefined;
}

function displayPrice(value?: string | null, currency?: string | null) {
  const raw = clean(value);
  if (!raw) return undefined;
  // A zero catalogue price is not a sellable price; present it as request-only.
  if (/^(?:(?:EGP|ج\.م)\s*)?0(?:[.,]0+)?$/iu.test(raw)) return undefined;
  const number = Number(raw);
  if (Number.isFinite(number)) {
    return `${currency || "EGP"} ${number.toLocaleString("en-US", {
      minimumFractionDigits: number % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    })}`;
  }
  if (currency && raw.toLowerCase().startsWith(currency.toLowerCase())) return raw;
  return [currency, raw].filter(Boolean).join(" ");
}

function normalizedCollection(row: CatalogRow): CollectionSlug | null {
  const raw = clean(row.collection_slug) || "";
  const nameText = clean(row.name)?.toLowerCase() || "";
  const text = clean([row.name, row.subcategory, row.product_type].filter(Boolean).join(" "))?.toLowerCase() || "";
  const bathroomSource = new Set(["source-04", "source-12", "source-22", "source-36"]).has(row.source_id);

  if (
    /\b(?:adhesive|grout|cement|sealant|cleaner|paint(?:s)?|masking|tape|tool|tools|spare part|spare parts|gift card|smart lock|door lock|switch|socket|cover frame|kitchen hood|extractor hood|water heater)\b/i.test(text) ||
    /لاصق|روبة|اسمنت|أسمنت|سيلانت|منظف|دهان|شريط|أداة|اداة|قطع غيار|كارت هدية|قفل ذكي|كالون|مفتاح كهرباء|بريزة|شفاط مطبخ|سخان مياه/u.test(text)
  ) return null;

  // Source 25 includes construction/cabinet materials that do not belong in
  // the current consumer marketplace taxonomy.
  if (
    row.source_id === "source-25" &&
    (
      /\b(?:mdf|hdf|solid wood|engineered wood|parquet|laminate|garbelotto|wood panel|wood board|spc wall panel|spc flooring|wall panel|cladding sheet|door hardware|kitchen hardware|closet hardware|dressing hardware|furniture handle|cabinet handle)\b/i.test(text) ||
      /^floors?$/i.test(clean(row.subcategory) || "")
    )
  ) return null;

  // Drain covers and drain channels can mention ceramic/porcelain because a
  // tile is inserted into the cover. They are plumbing products, not surfaces.
  if (
    /\b(?:drain cover|wall drain|linear drain|shower drain|floor drain|drain channel)\b/i.test(text) ||
    /نقطة صرف|غطاء بيبه|غطاء بيبة|مجرى شاور|مجرى دش|غطاء صرف|صرف خطي|بلاعة|صفاية/u.test(text)
  ) return "plumbing-products";

  // A sink may mention mixer holes, but the product itself is still a sink.
  if (/^(?:kitchen\s+sink|sink\b|basin\b|wash\s*basin\b)/i.test(nameText) || /^(?:حوض|احواض|أحواض)\b/u.test(nameText)) {
    return "sanitary-ware";
  }

  // Complete sanitary sets must stay under sanitary ware even when a shower is included.
  if (
    /^(?:bathroom set|sanitary set|combination)\b/i.test(nameText) ||
    /^(?:طقم حمام|أطقم حمام|طقم حمامات|اطقم حمامات|كمبنيشن|كومبنيشن)/u.test(nameText)
  ) return "sanitary-ware";

  // Drainage products are plumbing products, not shower systems.
  if (
    /\b(?:concealed cistern|flush tank|wall drain|linear drain|shower drain|floor drain|drain channel)\b/i.test(text) ||
    /خزان دفن|خزانات الدفن|مجرى شاور|مجرى دش|غطاء صرف|صرف خطي/u.test(text)
  ) return "plumbing-products";

  if (/\b(?:faucet|mixer|tap|tapware|health faucet|bidet spray)\b/i.test(text) || /خلاط|خلاطات|حنفيه|حنفية|حنفيات|شطاف/u.test(text)) return "faucets";
  if (
    /\b(?:bathroom accessories?|towel (?:rail|ring|holder)|soap (?:dish|holder)|robe hook|toilet brush|paper holder)\b/i.test(text) ||
    /اكسسوار(?:ات)? حمام|إكسسوار(?:ات)? حمام|حامل فوط|حامل فوطة|حامل صابون|صبانة|حامل ورق|فرشاة تواليت/u.test(text) ||
    (bathroomSource && /اكسسوار|إكسسوار|accessor/i.test(text))
  ) return "bathroom-accessories";
  if (/\b(?:bathtub|bath tub|jacuzzi|freestanding bath|spa bath)\b/i.test(text) || /بانيو|جاكوزي|حوض استحمام/u.test(text)) return "bathtubs";
  if (/\b(?:shower enclosure|shower cabin|shower tray|shower column|shower system|shower set|shower panel|shower)\b/i.test(text) || /كابينة دش|كابينه دش|عمود دش|شاور بانل|دش|شاور/u.test(text)) return "shower-units";
  if (/\b(?:vanity|bathroom unit|bathroom furniture|bathroom cabinet)\b/i.test(text) || /وحدة حمام|وحدات حمام|اثاث حمام|أثاث حمام|خزانة حمام/u.test(text)) return "bathroom-units";
  if (/\b(?:basin|wash ?basin|sink|toilet|wc|bidet|urinal|sanitary ware|sanitary)\b/i.test(text) || /حوض|احواض|أحواض|مرحاض|تواليت|قاعدة حمام|قواعد حمام|بيديه|مبولة|ادوات صحية|أدوات صحية|كومبنيشن/u.test(text)) return "sanitary-ware";
  if (/\b(?:pipe|fitting|valve|plumbing|trap|siphon|drain|connector)\b/i.test(text) || /مواسير|ماسورة|وصلة|وصلات|محبس|محابس|سباكة|سيفون|صرف|بلف/u.test(text)) return "plumbing-products";

  if (/\b(?:chandelier|pendant lamp|pendent lamp|ceiling lamp|wall lamp|floor lamp|table lamp|lighting|light fixture|lamp)\b/i.test(text) ||
      /نجفة|نجف|إضاءة|اضاءة|أباجورة|اباجورة|لمبة|وحدة إضاءة/u.test(text)) return "lighting";

  if (/\b(?:door hardware|kitchen hardware|furniture handle|cabinet handle|closet hardware|dressing hardware)\b/i.test(text) ||
      /مقبض أثاث|مقبض اثاث|اكسسوارات مطابخ|إكسسوارات مطابخ/u.test(text)) return null;

  if (/\b(?:sofa|sofachair|armchair|chair|dining room|living room|bed room|bedroom|bed|occasional table|occassional table|coffee table|side table|console table|desk|cabinet|wardrobe|bench|stool|furniture)\b/i.test(text) ||
      /أثاث|اثاث|كنبة|كنب|كرسي|كراسي|ترابيزة|ترابيزات|طاولة|طاولات|سرير|غرفة نوم|غرف نوم|سفرة|كونسول|خزانة|دولاب/u.test(text)) return "furniture";
  if (/\b(?:vase|statue|decorative object|candle holder|wall object|painting|mirror|rug|carpet|cushion|throw|textile|wallpaper|wall covering|home decor|decoration)\b/i.test(text) ||
      /فازة|فازات|تمثال|ديكور|شمعدان|لوحة|لوحات|مراية|مرآة|سجادة|سجاد|وسادة|ورق حائط/u.test(text)) return "home-decor";

  // Surface categories are evaluated after product nouns so incidental words
  // such as "ceramic cartridge" on a mixer cannot turn plumbing into tiles.
  // Within surfaces, porcelain/ceramic win over decorative marble/granite effects.
  if (/\bporcelain\b/i.test(text) || /بورسلين/u.test(text)) return "porcelain";
  if (/\b(?:ceramic|ceramic tile|ceramic tiles)\b/i.test(text) || /سيراميك/u.test(text)) return "ceramics";
  if (/\b(?:marble|natural stone|travertine|granite)\b/i.test(text) || /رخام|حجر طبيعي|ترافرتين|جرانيت(?!و)/u.test(text)) return "marble";
  if (/\b(?:tiles?|wall tile|floor tile)\b/i.test(text) || /بلاط|حوائط|أرضيات|ارضيات/u.test(text)) return "ceramics";

  if (row.source_id === "source-13" && DISPLAY_COLLECTIONS.has(raw as CollectionSlug)) return raw as CollectionSlug;
  return null;
}

function normalizedSubcategory(row: CatalogRow, collection: CollectionSlug) {
  const sourceValue = clean(row.subcategory) || clean(row.product_type);
  const text = clean([row.name, sourceValue].filter(Boolean).join(" "))?.toLowerCase() || "";
  const sourceIsArabic = Boolean(sourceValue && /[\u0600-\u06FF]/u.test(sourceValue));
  const nameIsArabic = /[\u0600-\u06FF]/u.test(row.name || "");
  if (sourceIsArabic) return sourceValue;
  if (!sourceValue && nameIsArabic) return undefined;

  if (collection === "faucets") {
    if (/kitchen|مطبخ/u.test(text)) return "Kitchen Mixers";
    if (/basin|lavatory|حوض/u.test(text)) return "Basin Mixers";
    if (/bath|بانيو/u.test(text)) return "Bath Mixers";
    if (/shower|دش|شاور/u.test(text)) return "Shower Mixers";
    return sourceValue || "Mixers";
  }
  if (collection === "sanitary-ware") {
    if (/kitchen sink|حوض مطبخ/u.test(text)) return "Kitchen Sinks";
    if (/bathroom set|complete set|طقم حمام|أطقم حمام/u.test(text)) return "Bathroom Sets";
    if (/toilet|wc|مرحاض|تواليت|قاعدة/u.test(text)) return "Toilets";
    if (/bidet|بيديه/u.test(text)) return "Bidets";
    if (/urinal|مبولة/u.test(text)) return "Urinals";
    if (/basin|sink|حوض|احواض|أحواض/u.test(text)) return "Basins & Sinks";
  }
  if (collection === "lighting") {
    if (/chandelier|نجف/u.test(text)) return "Chandeliers";
    if (/pendant|pendent/u.test(text)) return "Pendant Lights";
    if (/wall lamp/u.test(text)) return "Wall Lights";
    if (/floor lamp/u.test(text)) return "Floor Lamps";
    if (/table lamp/u.test(text)) return "Table Lamps";
    if (/ceiling lamp/u.test(text)) return "Ceiling Lights";
  }
  if (collection === "furniture") {
    if (/sofa|sofachair|living room|كنب|كنبة/u.test(text)) return "Living Room";
    if (/dining|سفرة/u.test(text)) return "Dining Room";
    if (/bed room|bedroom|سرير|غرفة نوم/u.test(text)) return "Bedroom";
    if (/table|ترابيزة|طاولة/u.test(text)) return "Tables";
    if (/chair|كرسي/u.test(text)) return "Chairs";
  }
  if (collection === "home-decor") {
    if (/vase|فاز/u.test(text)) return "Vases";
    if (/mirror|مراية|مرآة/u.test(text)) return "Mirrors";
    if (/painting|photo frame|لوح|برواز/u.test(text)) return "Wall Art & Frames";
    if (/wallpaper|wall covering|ورق حائط/u.test(text)) return "Wall Coverings";
    if (/statue|decorative object|bookend|تمثال/u.test(text)) return "Decorative Objects";
    if (/candle holder|hurricane|شمعدان/u.test(text)) return "Candle Holders";
    if (/tray|bowl|صينية|طبق ديكور/u.test(text)) return "Trays & Bowls";
    if (/planter|زرع|أصيص/u.test(text)) return "Planters";
    if (/textile|cushion|throw|وسادة|منسوج/u.test(text)) return "Textiles";
  }
  if (collection === "ceramics" || collection === "porcelain" || collection === "marble") {
    if (/wall|حوائط/u.test(text)) return "Wall Surfaces";
    if (/floor|أرضيات|ارضيات/u.test(text)) return "Floor Surfaces";
  }
  return sourceValue;
}



function dimensionFromName(name: string) {
  const match = name.match(/(\d{1,4}(?:\.\d+)?)\s*[×x*]\s*(\d{1,4}(?:\.\d+)?)(?:\s*[×x*]\s*(\d{1,4}(?:\.\d+)?))?\s*(سم|cm|مم|mm)?/iu);
  if (!match) return undefined;
  const values = [match[1], match[2], match[3]].filter(Boolean);
  const unit = match[4]?.toLowerCase();
  return values.join(" × ") + (unit ? " " + unit : "");
}

function finishFromName(name: string) {
  if (/(?:glossy|polished)/i.test(name) || /لامع/u.test(name)) return "Glossy";
  if (/(?:matt|matte)/i.test(name) || /(?:^|\s)مط(?:\s|$)/u.test(name)) return "Matte";
  return undefined;
}

function materialFromName(name: string) {
  if (/stainless\s*steel/i.test(name) || /ستانلس/u.test(name)) return "Stainless Steel";
  if (/brass/i.test(name) || /نحاس/u.test(name)) return "Brass";
  if (/acrylic/i.test(name) || /أكريليك|اكريليك/u.test(name)) return "Acrylic";
  return undefined;
}

function brandFromName(name: string) {
  const brands: Array<[RegExp, string]> = [
    [/ideal standard|ايديال ستاندرد/iu, "Ideal Standard"],
    [/duravit|ديورافيت/iu, "Duravit"],
    [/cleopatra|كليوباترا/iu, "Cleopatra"],
    [/sanipure|ساني بيور|سانى بيور/iu, "Sanipure"],
    [/grohe|جروهي/iu, "Grohe"],
    [/villeroy\s*&\s*boch/iu, "Villeroy & Boch"],
  ];
  return brands.find(([pattern]) => pattern.test(name))?.[1];
}

function cleanImageUrl(value?: string | null) {
  const image = (value || "").trim();
  if (!isPresentableImageUrl(image)) return "";
  if (/\b(array|null|undefined)\b/i.test(image)) return "";
  if (/[-_](?:80|100|120|150|180|200)x(?:80|100|120|150|180|200)(?:\.|-)/i.test(image)) return "";
  return image;
}

function codeFromName(name: string) {
  return name.match(/(?:\bsku\b|\bcode\b|كود)\s*[:#-]?\s*([A-Z0-9][A-Z0-9._/-]{2,})/iu)?.[1]?.trim();
}

function hasProfessionalMetadata(values: Array<string | undefined>) {
  const unique = new Set(values.map((value) => clean(value)?.toLowerCase()).filter(Boolean));
  return unique.size >= 2;
}

function mapRow(row: CatalogRow): Product | null {
  if (SKIP_SOURCES.has(row.source_id)) return null;

  const collection = normalizedCollection(row);
  if (!collection) return null;

  const name = clean(row.name);
  if (!name) return null;

  const dimension = clean(row.dimension_text) || dimensionFromName(name);
  const color = clean(row.color);
  const material = clean(row.material) || materialFromName(name);
  const finish = finishFromName(name);
  const sourceSubcategory = clean(row.subcategory);
  const sourceType = clean(row.product_type);
  const subcategory = normalizedSubcategory(row, collection);
  const type = subcategory || sourceType;
  const brand = clean(row.brand) || brandFromName(name) || "";
  const code = clean(row.sku) || codeFromName(name);
  const image = cleanImageUrl(row.primary_image_url);
  if (!image) return null;

  // Never publish an image-only card. A visible marketplace product needs
  // at least two independent product-specific data signals from the source.
  if (!hasProfessionalMetadata([brand, code, sourceSubcategory, sourceType, material, color, dimension, finish])) return null;

  const specs: ProductSpecificationItem[] = [
    dimension ? { label: "Dimensions", value: dimension, originalSourceValue: dimension, normalizedValue: dimension } : null,
    material ? { label: "Material", value: material, originalSourceValue: material, normalizedValue: material } : null,
    color ? { label: "Color", value: color, originalSourceValue: color, normalizedValue: color } : null,
    code ? { label: "SKU / Product code", value: code, originalSourceValue: code, normalizedValue: code } : null,
    row.availability ? { label: "Availability", value: row.availability, originalSourceValue: row.availability, normalizedValue: row.availability } : null,
  ].filter(Boolean) as ProductSpecificationItem[];

  return {
    id: `catalog:${row.source_id}:${row.source_record_id}`,
    slug: row.slug || `${row.source_id}-${row.source_record_id}`,
    name: { en: name, ar: name, fr: name },
    collection,
    subcategory,
    brand,
    code,
    type,
    description: clean(row.description),
    material,
    finish,
    colors: color ? [color] : undefined,
    sizes: dimension
      ? [{
          id: `catalog:${row.source_id}:${row.source_record_id}:size`,
          originalSourceValue: dimension,
          normalizedDisplayValue: dimension,
          label: dimension,
        }]
      : [],
    image,
    gallery: image ? [image] : [],
    priceText: displayPrice(row.price_text, row.currency),
    compareAtPriceText: displayPrice(row.compare_at_price_text, row.currency),
    currency: clean(row.currency),
    availability: clean(row.availability),
    specificationGroups: specs.length ? [{ title: "Product information", items: specs }] : undefined,
    source: {
      sourceId: row.source_id,
      provider: sourceProviderName(row.source_id) || "IDEA catalog source",
      recordId: row.source_record_id,
      productPageUrl: row.source_url,
      extractionTimestamp: row.last_source_sync_at || undefined,
      reviewStatus: "source-imported",
      sourceCategory: sourceSubcategory,
      sourceSubcategory,
      sourceProductType: sourceType,
      rawRecord: { catalogId: row.id },
    },
    approved: true,
    status: "imported",
  };
}

async function fetchPage(source: string, page: number, signal?: AbortSignal): Promise<ProductPage> {
  const url = catalogUrl(`action=products&source=${encodeURIComponent(source)}&per_page=${PAGE_SIZE}&page=${page}`);
  let lastStatus: number | string = "network";

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
    lastStatus = response.status;
    if (response.ok) {
      const payload = await response.json() as ProductPage;
      if (!payload.ok) throw new Error("Catalog request failed");
      return payload;
    }
    if (response.status !== 429 && response.status < 500) break;
    await new Promise((resolve) => window.setTimeout(resolve, 300 * (2 ** attempt)));
  }

  throw new Error(`Catalog request failed: ${lastStatus}`);
}

function productIdentity(product: Product) {
  const sku = (product.code || "").trim().toLowerCase();
  if (sku) return `sku:${product.brand.toLowerCase()}:${sku}`;
  return `name:${product.brand.toLowerCase()}:${product.name.en.trim().toLowerCase()}`;
}

function mappedProducts(payload: ProductPage) {
  return payload.products.map(mapRow).filter(Boolean) as Product[];
}

export async function loadLiveCatalog(
  onBatch: (products: Product[]) => void,
  signal?: AbortSignal
): Promise<void> {
  const seenProducts = new Set<string>();

  const publish = (products: Product[]) => {
    const cleanProducts = products.filter((product) => {
      if (!product.image) return false;
      const identity = productIdentity(product);
      if (seenProducts.has(identity)) return false;
      seenProducts.add(identity);
      return true;
    });
    if (cleanProducts.length) onBatch(cleanProducts);
  };

  const firstPages = await Promise.allSettled(
    SOURCE_FEEDS.map(async (source) => ({ source, payload: await fetchPage(source, 1, signal) }))
  );

  const remaining: Array<{ source: string; page: number }> = [];
  for (const result of firstPages) {
    if (result.status !== "fulfilled") continue;
    const { source, payload } = result.value;
    const firstBatch = mappedProducts(payload);
    if (firstBatch.length) publish(firstBatch);
    for (let page = 2; page <= Math.max(1, payload.totalPages || 1); page += 1) {
      remaining.push({ source, page });
    }
  }

  let cursor = 0;
  const worker = async () => {
    while (cursor < remaining.length) {
      if (signal?.aborted) return;
      const task = remaining[cursor++];
      try {
        const payload = await fetchPage(task.source, task.page, signal);
        const batch = mappedProducts(payload);
        if (batch.length) publish(batch);
      } catch (error) {
        if ((error as { name?: string })?.name === "AbortError") return;
        // Keep the already-visible catalogue and continue loading other pages.
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(PAGE_CONCURRENCY, remaining.length) }, () => worker()));
}
