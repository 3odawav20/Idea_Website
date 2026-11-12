import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { localMaterialFace } from "../data/localMaterialFace";
import { Link, useSearchParams } from "react-router";
import {
  ArrowLeftRight, Check, ChevronDown, CircleAlert, Download, Expand,
  Eye, Focus, ImagePlus, Layers3, LockKeyhole, Maximize2, RotateCcw,
  Search, ShieldCheck, Sparkles, UploadCloud, X, ZoomIn, ZoomOut,
} from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { ideaInternalCode, productMaker, sourceSku } from "../data/ideaProductIdentity";
import { useStore } from "../store/store";
import { useBackend } from "../backend/db";
import { supabase } from "../backend/supabaseClient";
import type { Product } from "../data/types";
import "./AiVisualizerStudio.css";

type Surface = "floor" | "walls" | "both";
type RoomKind = "living" | "bedroom" | "kitchen" | "bathroom" | "office" | "hallway" | "commercial" | "other";
type JobStage = "idle" | "uploading" | "validating" | "queued" | "generating" | "verification_failed" | "ready" | "failed";
type ViewMode = "compare" | "original" | "result";
type Quota = { limit: number | null; used: number; remaining: number | null; unlimited: boolean };
type Quality = {
  dimensionsPreserved?: boolean;
  maskVerified?: boolean;
  protectedPixelsCompositedFromOriginal?: boolean;
  watermark?: string;
};
type JobResponse = {
  jobId?: string;
  state?: string;
  stage?: JobStage;
  image?: string;
  error?: string;
  code?: string;
  quota?: Quota;
  quality?: Quality;
};

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 12 * 1024 * 1024;
const POLL_INTERVAL = 2500;
const POLL_LIMIT = 240;
const STAGE_ORDER: JobStage[] = ["uploading", "validating", "queued", "generating", "ready"];

function fileUrl(file: File | undefined): string | null {
  if (!file || !ALLOWED.includes(file.type) || file.size > MAX_BYTES || file.size === 0) return null;
  return URL.createObjectURL(file);
}
function safeBlobUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.protocol === "blob:" ? parsed.href : null;
  } catch {
    return null;
  }
}
function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
}

/** Source-labelled product faces are the only allowed images in the material gallery. */
function materialFaces(product: Product): string[] {
  const sourceFaces = product.source?.original?.tiles || [];
  const faces = [...new Set(sourceFaces.filter((url) =>
    /^https:\/\/[^\s]+\.(?:png|jpe?g|webp)(?:\?[^\s]*)?$/i.test(url)
  ))];
  const cached = localMaterialFace(product.id);
  return cached ? [cached, ...faces.slice(1)] : faces;
}

export function AiVisualizerStudio() {
  const { locale } = useI18n();
  const { session } = useBackend();
  // Presentation guard only. PHP/MySQL checks the authenticated role on every AI action.
  const aiEligible = session?.role === "admin" || session?.role === "customer";
  const { products } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const ar = locale === "ar";
  const tr = (arabic: string, english: string, french?: string) => ar ? arabic : locale === "fr" ? (french || english) : english;
  // Supplier catalogue text is sometimes only populated in one language.
  // Never display arbitrary Arabic text in English UI (or vice versa).
  const containsArabic = (value: string) => /[\u0600-\u06FF]/u.test(value);
  const containsLatin = (value: string) => /[A-Za-z]/.test(value);
  const localizedValue = (value: string | null | undefined, fallbackAr: string, fallbackEn: string): string => {
    const original = String(value || "").trim();
    if (!original) return tr(fallbackAr, fallbackEn);
    if (ar) return containsArabic(original) || !containsLatin(original) ? original : fallbackAr;
    return containsArabic(original) ? fallbackEn : original;
  };
  const localizedName = (product: Product): string => {
    const direct = String(product.name[locale] || "").trim();
    const english = String(product.name.en || "").trim();
    const arabic = String(product.name.ar || "").trim();
    const code = product.code || ideaInternalCode(product);
    if (ar) return containsArabic(direct) ? direct : containsArabic(arabic) ? arabic : "خامة " + code;
    return direct && !containsArabic(direct) ? direct : english && !containsArabic(english) ? english : "Material " + code;
  };
  const selectedId = searchParams.get("product");
  const selectedProduct = products.find((product) => product.id === selectedId || product.slug === selectedId) || null;

  const [search, setSearch] = useState("");
  const [atlasGroup, setAtlasGroup] = useState<"all" | "ceramics" | "porcelain" | "marble" | "marble-look">("all");
  const [atlasBrand, setAtlasBrand] = useState("");
  const [atlasFinish, setAtlasFinish] = useState("");
  const [atlasSize, setAtlasSize] = useState("");
  const [atlasColor, setAtlasColor] = useState("");
  const [atlasTexture, setAtlasTexture] = useState("");
  const [atlasVisibleCount, setAtlasVisibleCount] = useState(24);
  const [faceIndex, setFaceIndex] = useState(0);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoMeta, setPhotoMeta] = useState<{ width: number; height: number; megapixels: string } | null>(null);
  const [material, setMaterial] = useState<File | null>(null);
  const [materialUrl, setMaterialUrl] = useState<string | null>(null);
  const [surface, setSurface] = useState<Surface>("floor");
  const [roomKind, setRoomKind] = useState<RoomKind>("living");
  const [rotation, setRotation] = useState(0);
  const [grout, setGrout] = useState("#ddd8cf");
  const [tileSize, setTileSize] = useState("60 × 60 cm");
  const [result, setResult] = useState<string | null>(null);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [compare, setCompare] = useState(50);
  const [viewMode, setViewMode] = useState<ViewMode>("compare");
  const [zoom, setZoom] = useState(1);
  const [stage, setStage] = useState<JobStage>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [integration, setIntegration] = useState("configuration_unchecked");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  const selectedFaces = useMemo(() => selectedProduct ? materialFaces(selectedProduct) : [], [selectedProduct]);
  // Never offer an arbitrary default; only use dimensions recorded for this product variant.
  const physicalSizes = (selectedProduct?.sizes || []).filter((size) =>
    Number.isFinite(size.widthMm) && Number.isFinite(size.heightMm) &&
    Number(size.widthMm) >= 50 && Number(size.heightMm) >= 50 &&
    Number(size.widthMm) <= 3200 && Number(size.heightMm) <= 3200
  );
  const selectedPhysicalSize = physicalSizes.find((size) => size.id === tileSize) || physicalSizes[0] || null;

  const selectedFaceImage = selectedFaces[faceIndex] || selectedFaces[0] || null;
  const safePhotoUrl = safeBlobUrl(photoUrl);
  const safeMaterialUrl = safeBlobUrl(materialUrl);
  const busy = !["idle", "ready", "failed", "verification_failed"].includes(stage);
  // Keep product provenance intact: a marble pattern is NOT proof of natural marble.
  const isMarbleLook = (product: (typeof products)[number]) =>
    product.collection !== "marble" && /marble|calacatta|carrara|statuario|onyx|رخام|كالاكاتا|كرارا|أونيكس/i.test([
      product.texture, product.source?.originalSurface, product.name.en, product.name.ar,
    ].filter(Boolean).join(" "));
  const materialLibrary = useMemo(() => products.filter((product) =>
    materialFaces(product).length > 0 && product.status !== "sample" &&
    (product.collection === "ceramics" || product.collection === "porcelain" || product.collection === "marble")
  ), [products]);
  const atlasFacets = useMemo(() => {
    const unique = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    return {
      brands: unique(materialLibrary.map((product) => product.manufacturer || product.brand)),
      finishes: unique(materialLibrary.map((product) => product.finish || "")),
      sizes: unique(materialLibrary.flatMap((product) => product.sizes.map((size) => size.label))),
      colors: unique(materialLibrary.flatMap((product) => product.colors || [])),
      textures: unique(materialLibrary.map((product) => product.texture || product.source?.originalSurface || "")),
    };
  }, [materialLibrary]);
  const atlasCounts = useMemo(() => ({
    all: materialLibrary.length,
    ceramics: materialLibrary.filter((product) => product.collection === "ceramics").length,
    porcelain: materialLibrary.filter((product) => product.collection === "porcelain").length,
    marble: materialLibrary.filter((product) => product.collection === "marble").length,
    "marble-look": materialLibrary.filter(isMarbleLook).length,
  }), [materialLibrary]);
  const eligibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return materialLibrary.filter((product) => {
      if (atlasGroup === "marble-look" && !isMarbleLook(product)) return false;
      if (atlasGroup === "ceramics" && product.collection !== "ceramics") return false;
      if (atlasGroup === "porcelain" && product.collection !== "porcelain") return false;
      if (atlasGroup === "marble" && product.collection !== "marble") return false;
      if (atlasBrand && (product.manufacturer || product.brand) !== atlasBrand) return false;
      if (atlasFinish && product.finish !== atlasFinish) return false;
      if (atlasSize && !product.sizes.some((size) => size.label === atlasSize)) return false;
      if (atlasColor && !product.colors?.includes(atlasColor)) return false;
      if (atlasTexture && (product.texture || product.source?.originalSurface || "") !== atlasTexture) return false;
      return !query || [
        product.name.en, product.name.ar, product.name.fr, product.brand, product.manufacturer,
        product.model, product.code, product.finish, product.collection, product.texture,
        product.type, product.variant, product.source?.originalSurface,
        ...(product.colors || []), ...product.sizes.map((size) => size.label),
      ].some((value) => String(value || "").toLocaleLowerCase().includes(query));
    });
  }, [materialLibrary, search, atlasGroup, atlasBrand, atlasFinish, atlasSize, atlasColor, atlasTexture]);
  useEffect(() => setAtlasVisibleCount(24), [search, atlasGroup, atlasBrand, atlasFinish, atlasSize, atlasColor, atlasTexture]);
  const visibleAtlasProducts = eligibleProducts.slice(0, atlasVisibleCount);
  const resetAtlas = () => {
    setSearch(""); setAtlasGroup("all"); setAtlasBrand(""); setAtlasFinish("");
    setAtlasSize(""); setAtlasColor(""); setAtlasTexture("");
  };

  useEffect(() => setFaceIndex(0), [selectedProduct?.id]);
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);
  useEffect(() => () => { if (materialUrl) URL.revokeObjectURL(materialUrl); }, [materialUrl]);

  useEffect(() => {
    if (!aiEligible || !supabase) {
      setQuota(null);
      return;
    }
    let active = true;
    void (async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session?.access_token) return;
      const response = await fetch("/api/visualize.php?action=status", {
        headers: { Authorization: `Bearer ${auth.session.access_token}` },
        cache: "no-store",
      });
      const data = await response.json().catch(() => null) as (JobResponse & { integration?: string }) | null;
      if (!active || !data) return;
      if (data.quota) setQuota(data.quota);
      setIntegration(data.integration || (response.ok ? "configuration_present_unverified" : "configuration_required"));
    })().catch(() => { if (active) setIntegration("unavailable"); });
    return () => { active = false; };
  }, [session?.id, aiEligible]);

  async function onRoomFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = fileUrl(file);
    if (!url) {
      setError(tr("استخدم صورة JPG أو PNG أو WebP بحجم لا يزيد عن 12 ميجابايت.", "Use a JPG, PNG or WebP image no larger than 12 MB."));
      return;
    }
    setStage("validating");
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width < 256 || bitmap.height < 256 || bitmap.width * bitmap.height > 12_000_000) {
        bitmap.close();
        throw new Error(tr("أبعاد الصورة غير مناسبة. الحد من 256 بكسل وحتى 12 ميجابكسل.", "Image dimensions must be at least 256px and no more than 12 megapixels."));
      }
      setPhotoMeta({ width: bitmap.width, height: bitmap.height, megapixels: (bitmap.width * bitmap.height / 1_000_000).toFixed(1) });
      bitmap.close();
      setPhoto(file);
      setPhotoUrl(url);
      setResult(null);
      setQuality(null);
      setJobId(null);
      setZoom(1);
      setError("");
      setStage("idle");
    } catch (cause) {
      URL.revokeObjectURL(url);
      setStage("failed");
      setError(cause instanceof Error ? cause.message : tr("تعذر قراءة الصورة.", "The image could not be decoded."));
    }
  }

  function onMaterialFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = fileUrl(file);
    if (!url) {
      setError(tr("صورة الخامة يجب أن تكون JPG أو PNG أو WebP وأقل من 12 ميجابايت.", "The material reference must be JPG, PNG or WebP under 12 MB."));
      return;
    }
    setMaterial(file);
    setMaterialUrl(url);
    setResult(null);
    setQuality(null);
    setError("");
  }

  function chooseProduct(id: string) {
    setSearchParams({ product: id }, { replace: true });
    setMaterial(null);
    setMaterialUrl(null);
    setFaceIndex(0);
    setTileSize("");
    setResult(null);
    setQuality(null);
    setError("");
    window.requestAnimationFrame(() => {
      document.querySelector(".idea-studio-workspace")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        block: "start",
      });
    });
  }

  async function accessToken() {
    if (!supabase) throw new Error(tr("خدمة تسجيل الدخول غير مهيأة.", "Authentication is not configured."));
    const { data, error: authError } = await supabase.auth.getSession();
    if (authError || !data.session?.access_token) throw new Error(tr("سجّل الدخول قبل بدء التوليد.", "Sign in before starting a generation."));
    return data.session.access_token;
  }

  async function materialBlob(signal: AbortSignal) {
    if (material) return material;
    if (!selectedFaceImage) return null;
    try {
      const response = await fetch(selectedFaceImage, { mode: "cors", signal, cache: "force-cache" });
      if (!response.ok) return null;
      const blob = await response.blob();
      return ALLOWED.includes(blob.type) && blob.size > 0 && blob.size <= MAX_BYTES ? blob : null;
    } catch {
      return null;
    }
  }

  async function pollJob(id: string, token: string, controller: AbortController) {
    for (let attempt = 0; attempt < POLL_LIMIT; attempt++) {
      await wait(POLL_INTERVAL, controller.signal);
      const response = await fetch(`/api/visualize.php?job=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null) as JobResponse | null;
      if (!data) throw new Error(tr("استجابة غير صالحة من خدمة التصور.", "The visualization service returned an invalid response."));
      if (data.quota) setQuota(data.quota);
      if (data.stage) setStage(data.stage);
      if (data.state === "ready" && data.image) {
        if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data.image)) throw new Error("Invalid verified image response");
        setResult(data.image);
        setQuality(data.quality || null);
        setCompare(50);
        setViewMode("compare");
        setStage("ready");
        return;
      }
      if (data.state === "failed" || data.state === "cancelled") {
        throw new Error(data.error || tr("فشل التوليد وتم رد المحاولة.", "Generation failed and the attempt was released."));
      }
    }
    throw new Error(tr("انتهت مهلة الوظيفة. يمكن فحصها لاحقًا من السجل.", "The job timed out. It can be inspected later from history."));
  }

  async function generate() {
    if (busy) return;
    if (!session) {
      setError(tr("سجّل حساب مستخدم أولًا قبل توليد الصور.", "Create a customer account and sign in to generate images."));
      return;
    }
    if (!aiEligible) {
      setError(tr("توليد الصور متاح لحسابات العملاء والأدمن فقط. حسابات الشركات غير مؤهلة.", "Image generation is limited to customer and admin accounts; company accounts are ineligible."));
      return;
    }
    if (!photo) {
      setError(tr("ارفع صورة الغرفة أولًا.", "Upload your room photo first."));
      inputRef.current?.click();
      return;
    }
    if (!selectedProduct) {
      setError(tr("اختر منتجًا حقيقيًا من المكتبة.", "Select a real catalogue product."));
      return;
    }
    if (!selectedPhysicalSize) {
      setError(tr("مقاس البلاطة غير موثق لهذا المنتج. يجب إضافة المقاس الحقيقي قبل التوليد.",
                  "This product has no verified physical tile dimensions. Add an actual size before generating."));
      return;
    }
    if (quota && !quota.unlimited && quota.remaining === 0) {
      setError(tr("استخدمت المحاولات الخمس المتاحة.", "Your five lifetime attempts have been used."));
      return;
    }
    const controller = new AbortController();
    requestRef.current?.abort();
    requestRef.current = controller;
    setError("");
    setStage("uploading");
    try {
      const token = await accessToken();
      const reference = await materialBlob(controller.signal);
      if (!reference) throw new Error(tr(
        "تعذر قراءة صورة المنتج من مصدرها. ارفع عينة أصلية واضحة للخامة.",
        "The product image cannot be read from its source. Upload a clear original material reference."
      ));
      const form = new FormData();
      form.append("action", "create");
      form.append("room", photo);
      form.append("material", reference, "material-reference");
      form.append("productId", selectedProduct.id);
      form.append("productName", selectedProduct.name.en);
      form.append("brand", selectedProduct.brand);
      form.append("finish", selectedProduct.finish || "");
      form.append("surface", surface);
      form.append("roomKind", roomKind);
      form.append("rotation", String(rotation));
      form.append("tileSize", selectedPhysicalSize.label);
       form.append("tile_width_mm", String(selectedPhysicalSize.widthMm));
       form.append("tile_height_mm", String(selectedPhysicalSize.heightMm));
       form.append("variant_id", selectedPhysicalSize.id);
      form.append("grout", grout);
      form.append("idempotencyKey", crypto.randomUUID());
      setStage("validating");
      const response = await fetch("/api/visualize.php", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        cache: "no-store",
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null) as JobResponse | null;
      if (!response.ok || !data?.jobId) throw new Error(data?.error || tr("تعذر قبول وظيفة التوليد.", "The generation job could not be accepted."));
      if (data.quota) setQuota(data.quota);
      setJobId(data.jobId);
      setStage(data.stage || "queued");
      await pollJob(data.jobId, token, controller);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setStage("failed");
        setError(cause instanceof Error ? cause.message : tr("حدث خطأ غير متوقع.", "An unexpected error occurred."));
      }
    } finally {
      requestRef.current = null;
    }
  }

  async function cancelJob() {
    if (!jobId || !busy) return;
    requestRef.current?.abort();
    try {
      const token = await accessToken();
      const form = new FormData();
      form.append("action", "cancel");
      form.append("jobId", jobId);
      const response = await fetch("/api/visualize.php", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form, cache: "no-store" });
      const data = await response.json().catch(() => null) as JobResponse | null;
      if (data?.quota) setQuota(data.quota);
    } finally {
      setStage("idle");
      setJobId(null);
    }
  }

  const productName = selectedProduct ? localizedName(selectedProduct) : tr("اختر خامة", "Select a material");
  const stageText: Record<JobStage, string> = {
    idle: tr("جاهز", "Ready"),
    uploading: tr("رفع الملفات الآمن", "Secure upload"),
    validating: tr("فحص الصورة والخامة", "Validating source files"),
    queued: tr("في انتظار عامل Runpod", "Waiting for Runpod worker"),
    generating: tr("توليد وتثبيت المشهد", "Generating with scene lock"),
    verification_failed: tr("فشل تحقق الحماية", "Protection verification failed"),
    ready: tr("النتيجة جاهزة", "Verified result ready"),
    failed: tr("توقفت الوظيفة بأمان", "Job stopped safely"),
  };
  const displaySource = viewMode === "original" ? safePhotoUrl : viewMode === "result" ? result : safePhotoUrl;

  return (
    <main className="idea-studio" lang={locale} dir={ar ? "rtl" : "ltr"}>
      <header className="idea-studio-commandbar">
        <div>
          <span className="idea-studio-brandmark"><Layers3 size={19} /></span>
          <span><b>IDEA</b><small>{tr("محرك حماية المشهد", "IMMUTABLE SCENE ENGINE")}</small></span>
        </div>
        <div className="idea-studio-command-status">
          <span className={`idea-studio-provider ${integration === "configuration_present_unverified" ? "pending" : ""}`}>
            <i /> {integration === "configuration_present_unverified" ? tr("Runpod جاهز للاختبار", "Runpod configuration unverified") : tr("حالة Runpod غير مؤكدة", "Runpod status unavailable")}
          </span>
          <span className="idea-studio-quota">
            <ShieldCheck size={15} />
            {quota?.unlimited
              ? tr("أدمن · توليد غير محدود", "Admin · unlimited quota")
              : quota
                ? tr(`${quota.remaining} / ${quota.limit} محاولات متبقية`, `${quota.remaining} / ${quota.limit} attempts remaining`)
                : !session
                  ? tr("سجّل الدخول لمعرفة الرصيد", "Sign in to view quota")
                  : !aiEligible
                    ? tr("حساب الشركات غير مؤهل للـAI", "Company accounts cannot use AI")
                    : tr("رصيد المحاولات غير متاح", "Quota unavailable")}
          </span>
        </div>
      </header>

      <section className="idea-studio-intro">
        <div>
          <span className="idea-studio-kicker"><Sparkles size={14} /> {tr("IDEA / استوديو الخامات 2030", "IDEA MATERIAL INTELLIGENCE / 2030")}</span>
          <h1>{tr("غيّر السطح.", "Change the surface.")}<em>{tr(" لا تغيّر الغرفة.", " Never the room.")}</em></h1>
          <p>{tr("المشهد الأصلي يظل مرجعًا ثابتًا. لا تُنشر أي نتيجة إلا بعد التحقق من القناع والأبعاد وإعادة تركيب البكسلات المحمية من الصورة الأصلية.", "Your original scene remains immutable. No result is released without mask, dimension and protected-pixel verification.")}</p>
        </div>
        <div className="idea-studio-trust"><LockKeyhole size={18} /><span><b>{tr("تركيب آمن للصورة", "PIXEL-SAFE COMPOSITING")}</b><small>{tr("الصورة الأصلية · قناع معتمد · علامة IDEA", "ORIGINAL FRAME · VERIFIED MASK · IDEA WATERMARK")}</small></span></div>
      </section>

      <div className="idea-studio-workspace">
        <aside className="idea-studio-rail idea-studio-room">
          <div className="idea-studio-rail-head"><span>01</span><div><small>{tr("ذكاء الغرفة", "ROOM INTELLIGENCE")}</small><h2>{tr("المشهد الأصلي", "Source scene")}</h2></div><ChevronDown size={16} /></div>
          <button className="idea-studio-upload" type="button" onClick={() => inputRef.current?.click()}>
            <UploadCloud size={24} />
            <strong>{photo ? tr("تغيير صورة الغرفة", "Replace room image") : tr("ارفع صورة الغرفة", "Upload room image")}</strong>
            <small dir="ltr">JPG · PNG · WEBP · 12 MB</small>
          </button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onRoomFile} capture="environment" />
          {photoMeta && (
            <div className="idea-studio-analysis">
              <span><Check size={13} /> {tr("تم فك الصورة", "Image decoded")}</span>
              <dl>
                <div><dt>{tr("الأبعاد", "Resolution")}</dt><dd>{photoMeta.width} × {photoMeta.height}</dd></div>
                <div><dt>{tr("الدقة", "Image data")}</dt><dd>{photoMeta.megapixels} MP</dd></div>
                <div><dt>{tr("التركيب", "Framing")}</dt><dd>{tr("سيُحفظ كما هو", "Locked")}</dd></div>
              </dl>
            </div>
          )}
          <div className="idea-studio-control-block">
            <label>{tr("المساحة المطلوب تغييرها", "Target surface")}</label>
            <div className="idea-studio-choice">
              {([["floor", tr("الأرضية", "Floor")], ["walls", tr("الحوائط", "Walls")], ["both", tr("الاثنان", "Both")]] as const).map(([value, label]) => (
                <button type="button" key={value} className={surface === value ? "active" : ""} onClick={() => setSurface(value)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="idea-studio-protection">
            <span><ShieldCheck size={15} /> {tr("حماية إلزامية", "Mandatory protection")}</span>
            <ul>
              <li>{tr("الأثاث والأشخاص", "Furniture and people")}</li>
              <li>{tr("الأبواب والنوافذ", "Doors and windows")}</li>
              <li>{tr("السقف والتركيبات", "Ceiling and fixtures")}</li>
              <li>{tr("كل سطح غير محدد", "Every unselected surface")}</li>
            </ul>
          </div>
          <button className="idea-studio-reset-source" type="button" disabled={!photo} onClick={() => { setPhoto(null); setPhotoUrl(null); setPhotoMeta(null); setResult(null); setStage("idle"); }}>
            <RotateCcw size={14} /> {tr("مسح المشهد", "Clear source")}
          </button>
        </aside>

        <section className="idea-studio-canvas" aria-label={tr("لوحة المعاينة المعمارية", "Architectural visualization canvas")}>
          <div className="idea-studio-canvas-head">
            <div><span className={`idea-studio-live ${stage}`} /><b>{stageText[stage]}</b>{jobId && <small>JOB {jobId.slice(0, 8).toUpperCase()}</small>}</div>
            <div className="idea-studio-view-tabs">
              {(["original", "compare", "result"] as ViewMode[]).map((mode) => (
                <button key={mode} type="button" disabled={mode !== "original" && !result} className={viewMode === mode ? "active" : ""} onClick={() => setViewMode(mode)}>
                  {mode === "original" ? tr("الأصل", "Original") : mode === "compare" ? tr("مقارنة", "Compare") : tr("النتيجة", "Result")}
                </button>
              ))}
            </div>
            <div className="idea-studio-zoom">
              <button type="button" aria-label={tr("تصغير", "Zoom out")} onClick={() => setZoom((value) => Math.max(.5, value-.25))}><ZoomOut size={16} /></button>
              <span>{Math.round(zoom*100)}%</span>
              <button type="button" aria-label={tr("تكبير", "Zoom in")} onClick={() => setZoom((value) => Math.min(2, value+.25))}><ZoomIn size={16} /></button>
              <button type="button" aria-label={tr("ملاءمة الشاشة", "Fit screen")} onClick={() => setZoom(1)}><Maximize2 size={16} /></button>
            </div>
          </div>
          <div className="idea-studio-stage">
            {safePhotoUrl ? (
              <div className="idea-studio-image-plane" style={{ transform: `scale(${zoom})` }}>
                {viewMode === "compare" && result ? (
                  <div className="idea-studio-comparison">
                    <img src={safePhotoUrl} alt={tr("الغرفة الأصلية", "Original room")} />
                    <div className="idea-studio-after" style={{ clipPath: `inset(0 ${100-compare}% 0 0)` }}><img src={result} alt={tr("النتيجة", "Verified result")} /></div>
                    <div className="idea-studio-split" style={{ left: `${compare}%` }}><span><ArrowLeftRight size={16} /></span></div>
                    <input className="idea-studio-comparison-range" type="range" min="0" max="100" value={compare} onChange={(event) => setCompare(Number(event.target.value))} aria-label={tr("مقارنة قبل وبعد", "Before and after comparison")} />
                  </div>
                ) : (
                  <img className="idea-studio-single-image" src={displaySource || safePhotoUrl} alt={viewMode === "result" ? tr("النتيجة", "Verified result") : tr("الغرفة الأصلية", "Original room")} />
                )}
              </div>
            ) : (
              <button className="idea-studio-empty" type="button" onClick={() => inputRef.current?.click()}>
                <span className="idea-studio-scan-icon"><Focus size={34} /></span>
                <strong>{tr("أدخل غرفتك إلى الاستوديو", "Bring your room into the studio")}</strong>
                <span>{tr("ارفع لقطة واضحة. لن نعيد تصميم الأثاث أو نغيّر الكاميرا.", "Upload a clear photograph. Furniture and camera framing remain untouched.")}</span>
                <small>{tr("اضغط للرفع أو استخدم كاميرا الهاتف", "CLICK TO UPLOAD OR USE YOUR CAMERA")}</small>
              </button>
            )}
            {busy && (
              <div className="idea-studio-processing" role="status">
                <span className="idea-studio-scanline" />
                <div className="idea-studio-processing-core"><Sparkles size={22} /><strong>{stageText[stage]}</strong><small>{tr("لا توجد نسبة وهمية؛ يتم عرض حالة الخادم الفعلية.", "No simulated percentage. This is the actual server state.")}</small></div>
                <div className="idea-studio-stage-track">
                  {STAGE_ORDER.map((item) => <span key={item} className={STAGE_ORDER.indexOf(item) <= STAGE_ORDER.indexOf(stage) ? "done" : ""}>{stageText[item]}</span>)}
                </div>
                <button type="button" onClick={() => void cancelJob()}><X size={14} /> {tr("إلغاء الوظيفة", "Cancel job")}</button>
              </div>
            )}
          </div>
          <div className="idea-studio-canvas-foot">
            <div>
              <button type="button" disabled={!result} onClick={() => setViewMode("compare")}><ArrowLeftRight size={15} /> {tr("واقع الخامة", "Material Reality")}</button>
              <button type="button" disabled><Eye size={15} /> {tr("قناع الحماية بعد التحليل", "Protection mask after analysis")}</button>
              <button type="button" disabled><Expand size={15} /> {tr("مراجعة المعماري", "Architect review")}</button>
            </div>
            {result && <a download={`idea-${selectedProduct?.slug || "visualization"}.png`} href={result}><Download size={16} /> {tr("تنزيل PNG", "Download PNG")}</a>}
          </div>
          {quality && (
            <div className="idea-studio-quality">
              <span><ShieldCheck size={15} /> {tr("تقرير الجودة", "Quality report")}</span>
              <i>{quality.dimensionsPreserved ? tr("الأبعاد محفوظة", "Dimensions preserved") : "—"}</i>
              <i>{quality.maskVerified ? tr("القناع موثّق", "Mask verified") : "—"}</i>
              <i>{quality.protectedPixelsCompositedFromOriginal ? tr("المناطق المحمية من الأصل", "Protected pixels from original") : "—"}</i>
            </div>
          )}
          {error && <div className="idea-studio-error" role="alert"><CircleAlert size={17} /><span>{localizedValue(error, "تعذر إتمام الطلب. يُرجى المحاولة مرة أخرى.", "The request could not be completed. Please try again.")}</span>{!session && <Link to="/login">{tr("تسجيل الدخول", "Sign in")}</Link>}</div>}
        </section>

        <aside className="idea-studio-rail idea-studio-material">
          <div className="idea-studio-rail-head"><span>02</span><div><small>{tr("ذكاء الخامة", "MATERIAL INTELLIGENCE")}</small><h2>{tr("المنتج المحدد", "Selected product")}</h2></div><ChevronDown size={16} /></div>
          <div className="idea-studio-product-image">
            {selectedFaceImage ? <img src={selectedFaceImage} alt={productName} /> : <span><ImagePlus size={28} />{tr("اختر وجه بلاطة أصلي", "Select an original tile face")}</span>}
          </div>
          {selectedFaces.length > 1 && (
            <div className="idea-studio-face-picker" aria-label={tr("وجوه البلاطة الأصلية", "Original tile faces")}>
              <span>{tr("اختار وجه البلاطة", "Choose tile face")} · {selectedFaces.length} {tr("أشكال أصلية", "source faces")}</span>
              <div className="idea-studio-face-grid">
                {selectedFaces.map((face, index) => (
                  <button type="button" key={face}
                    aria-label={tr(`الوجه ${index + 1}`, `Face ${index + 1}`)}
                    aria-pressed={index === faceIndex} className={index === faceIndex ? "active" : ""}
                    onClick={() => { setFaceIndex(index); setMaterial(null); setMaterialUrl(null); setResult(null); setQuality(null); }}>
                    <img src={face} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          )}
          <h3>{productName}</h3>
          {selectedProduct && (
            <>
              <p>{localizedValue(selectedProduct.manufacturer || selectedProduct.brand, "الشركة المصنعة غير مترجمة", "Manufacturer name not localized")}</p>
              <dl className="idea-studio-product-specs">
                <div><dt>{tr("الكود", "Code")}</dt><dd>{selectedProduct.code || "—"}</dd></div>
                <div><dt>{tr("التشطيب", "Finish")}</dt><dd>{localizedValue(selectedProduct.finish, "التشطيب غير محدد", "Finish not specified")}</dd></div>
                <div><dt>{tr("المقاس", "Dimensions")}</dt><dd>{selectedProduct.sizes[0]?.label || "—"}</dd></div>
              </dl>
              <Link className="idea-studio-product-link" to={`/product/${selectedProduct.slug}`}>{tr("فتح صفحة المنتج", "Open product page")}</Link>
            </>
          )}
          <label className="idea-studio-sample"><ImagePlus size={16} /><span>{tr("عينة خامة أوضح", "Clearer material reference")}<small>{tr("اختياري عند تعذر قراءة صورة المصدر", "Optional when source media is blocked")}</small></span><input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onMaterialFile} /></label>
          {safeMaterialUrl && <div className="idea-studio-material-thumb"><img src={safeMaterialUrl} alt="" /><Check size={14} /> {tr("مرجع مخصص", "Custom reference")}</div>}
          <div className="idea-studio-control-block">
            <label>{tr("نوع الغرفة", "Room type")}</label>
            <select value={roomKind} onChange={(event) => setRoomKind(event.target.value as RoomKind)}>
              <option value="living">{tr("غرفة معيشة", "Living room")}</option><option value="bedroom">{tr("غرفة نوم", "Bedroom")}</option>
              <option value="kitchen">{tr("مطبخ", "Kitchen")}</option><option value="bathroom">{tr("حمام", "Bathroom")}</option>
              <option value="office">{tr("مكتب", "Office")}</option><option value="hallway">{tr("ممر", "Hallway")}</option>
              <option value="commercial">{tr("مساحة تجارية", "Commercial")}</option><option value="other">{tr("أخرى", "Other")}</option>
            </select>
          </div>
          <div className="idea-studio-control-block">
            <label>{tr("اتجاه البلاطة", "Tile orientation")}</label>
            <div className="idea-studio-choice">{[0,45,90].map((value) => <button type="button" key={value} className={rotation === value ? "active" : ""} onClick={() => setRotation(value)}>{value}°</button>)}</div>
          </div>
          <div className="idea-studio-control-block">
            <label>{tr("المقاس الحقيقي للبلاطة", "Actual tile size")}</label>
            <select value={selectedPhysicalSize?.id || ""} onChange={(event) => setTileSize(event.target.value)} disabled={physicalSizes.length <= 1}>
               {physicalSizes.length ? physicalSizes.map((size) => (
                 <option value={size.id} key={size.id}>
                   {String(Number(size.widthMm) / 10) + " × " + String(Number(size.heightMm) / 10) + " cm"}
                 </option>
               )) : <option value="">{tr("المقاس غير متوفر", "Size unavailable")}</option>}
             </select>
             <small className="idea-studio-size-note">{tr("المقاس من بيانات المنتج. القياس داخل الغرفة تقريبي دون مرجع معايرة معروف.",
               "Dimensions come from this product. In-room scale remains approximate without a measured reference.")}</small>
          </div>
          <div className="idea-studio-control-block">
            <label>{tr("لون الفواصل", "Grout tone")}</label>
            <div className="idea-studio-colors">{["#3b3b3b","#ffffff","#ddd8cf","#9b998f"].map((color) => <button type="button" key={color} style={{ background: color }} className={grout === color ? "active" : ""} onClick={() => setGrout(color)} aria-label={color} />)}</div>
          </div>
          {!session && <small role="status"><Link to="/login">{tr("سجّل الدخول بحساب مستخدم لتوليد الصور.", "Sign in with a customer account to generate images.")}</Link></small>}
          {session && !aiEligible && <small role="status">{tr("حسابات الشركات ليس لها صلاحية توليد الصور.", "Company accounts are not eligible for AI generation.")}</small>}
          <button className="idea-studio-generate" type="button" onClick={() => void generate()} disabled={!aiEligible || busy || !photo || !selectedProduct || !selectedPhysicalSize || (!selectedFaceImage && !material) || Boolean(quota && !quota.unlimited && quota.remaining === 0)}>
            <Sparkles size={17} /> {tr("ابدأ التوليد المحمي", "Generate with scene lock")}
          </button>
          <small className="idea-studio-consent">{tr("ببدء التوليد تُرسل الصورتان إلى Runpod للمعالجة المؤقتة وفق سياسة الخصوصية.", "Generation sends the room and material references to Runpod for temporary processing.")}</small>
        </aside>
      </div>

      <section className="idea-studio-library" id="idea-material-atlas" aria-labelledby="idea-atlas-heading">
        <div className="idea-atlas-overline"><span className="idea-studio-kicker">{tr("IDEA / مكتبة الخامات 2030", "IDEA / MATERIAL ATLAS 2030")}</span><span>{tr("كتالوج مستورد • يتوسع مع كل مورد جديد", "Source-linked catalogue · expanding with supplier imports")}</span></div>
        <div className="idea-studio-library-head">
          <div>
            <h2 id="idea-atlas-heading">{tr("عالم كامل من", "A universe of")} <em>{tr("الخامات المعمارية.", "architectural surfaces.")}</em></h2>
            <p>{tr("سيراميك، بورسلين، وتصميمات بتأثير الرخام. اختر بلاطتك الحقيقية وشوفها في غرفتك.", "Ceramic, porcelain and marble-effect designs. Choose an actual catalogue product and visualize it in your own room.")}</p>
          </div>
          <div className="idea-atlas-total" aria-live="polite"><strong>{materialLibrary.length.toLocaleString()}</strong><span>{tr("خامة متاحة حاليًا", "catalogue materials")}</span></div>
        </div>
        <div className="idea-atlas-categories" aria-label={tr("نوع الخامة", "Material categories")}>
          {([
            ["all", tr("كل الخامات", "All materials")],
            ["ceramics", tr("السيراميك", "Ceramic")],
            ["porcelain", tr("البورسلين", "Porcelain")],
            ["marble", tr("الرخام الطبيعي", "Natural marble")],
            ["marble-look", tr("تصميمات رخامية", "Marble effects")],
          ] as const).map(([group, label]) => (
            <button type="button" key={group} aria-pressed={atlasGroup === group}
              className={atlasGroup === group ? "active" : ""} onClick={() => setAtlasGroup(group)}>
              <span>{label}</span><small>{atlasCounts[group].toLocaleString()}</small>
            </button>
          ))}
        </div>
        <div className="idea-atlas-filterbar">
          <label className="idea-studio-search"><Search size={18} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder={tr("دوّر بالاسم، الكود، الماركة، اللون أو المقاس...", "Search names, SKUs, brands, finishes, colours or sizes...")} /></label>
          <div className="idea-atlas-facets">
            {([
              { key: "brand", label: tr("الشركة", "Brand"), value: atlasBrand, set: setAtlasBrand, options: atlasFacets.brands },
              { key: "texture", label: tr("النقشة / الخامة", "Pattern"), value: atlasTexture, set: setAtlasTexture, options: atlasFacets.textures },
              { key: "finish", label: tr("التشطيب", "Finish"), value: atlasFinish, set: setAtlasFinish, options: atlasFacets.finishes },
              { key: "size", label: tr("المقاس", "Size"), value: atlasSize, set: setAtlasSize, options: atlasFacets.sizes },
              { key: "color", label: tr("اللون", "Colour"), value: atlasColor, set: setAtlasColor, options: atlasFacets.colors },
            ]).map((item) => (
              <label className="idea-atlas-facet" key={item.key}><span>{item.label}</span>
                <select value={item.value} onChange={(event) => item.set(event.target.value)}>
                  <option value="">{tr("الكل", "All")}</option>
                  {item.options.map((value) => <option value={value} key={value}>{localizedValue(value, "بيانات المصدر غير مترجمة", "Source value not localized")}</option>)}
                </select>
              </label>
            ))}
          </div>
          <div className="idea-atlas-results"><span aria-live="polite">{tr("نتائج مطابقة", "Matching materials")}: <strong>{eligibleProducts.length.toLocaleString()}</strong></span>
            <button type="button" onClick={resetAtlas}>{tr("مسح الفلاتر", "Reset filters")} <RotateCcw size={13} /></button>
          </div>
        </div>
        <div className="idea-studio-swatches">
          {visibleAtlasProducts.map((product) => (
            <article className="idea-atlas-product" key={product.id}>
            <button type="button" onClick={() => chooseProduct(product.id)}
              aria-pressed={selectedProduct?.id === product.id} className={selectedProduct?.id === product.id ? "selected" : ""}>
              <span className="idea-studio-swatch-image">
                <img src={materialFaces(product)[0]} alt="" loading="lazy" decoding="async" />
                <span className="idea-atlas-card-kind">{product.collection === "marble" ? tr("رخام طبيعي", "Natural marble") : isMarbleLook(product) ? tr("تأثير رخامي", "Marble effect") : product.collection === "porcelain" ? tr("بورسلين", "Porcelain") : tr("سيراميك", "Ceramic")}</span>
                {selectedProduct?.id === product.id && <i><Check size={13} /></i>}
              </span>
              <span className="idea-atlas-card-body">
                <strong>{localizedName(product)}</strong>
                <small>{localizedValue(product.manufacturer ? productMaker(product, locale).value : product.brand, "الشركة غير مترجمة", "Maker name not localized")}{product.manufacturer ? "" : tr(" · المصنع غير مؤكد", " · maker unverified")}</small>
                <span className="idea-atlas-card-details">{product.sizes[0]?.label || tr("المقاس غير محدد", "Size not specified")}{product.finish ? " · " + localizedValue(product.finish, "تشطيب غير محدد", "Finish not specified") : ""}</span>
                <span className="idea-atlas-card-reference"><span>{tr("كود IDEA", "IDEA reference")}</span><code dir="ltr">{ideaInternalCode(product)}</code></span>
                <span className="idea-atlas-card-bottom"><span>{sourceSku(product) ? (tr("كود المورد", "Supplier SKU") + ": " + sourceSku(product)) : tr("كود المورد غير موثّق", "Supplier SKU unverified")}</span><span>{selectedProduct?.id === product.id ? tr("مُختار ✓", "Selected ✓") : tr("جرّب في غرفتك", "Visualize ↗")}</span></span>
              </span>
            </button>
            <Link className="idea-studio-product-link" to={`/product/${product.slug}`}>{tr("تفاصيل الخامة", "Material details")}</Link>
            </article>
          ))}
        </div>
        {!eligibleProducts.length && <div className="idea-studio-no-products"><Search size={26} /><strong>{tr("مفيش خامات مطابقة للفلاتر دي", "No matching materials")}</strong><p>{tr("جرّب بحث تاني أو امسح الفلاتر.", "Try another search or clear your filters.")}</p><button type="button" onClick={resetAtlas}>{tr("عرض كل الخامات", "Browse all materials")}</button></div>}
        {atlasVisibleCount < eligibleProducts.length && (
          <div className="idea-atlas-loadmore">
            <p>{tr("معروض", "Showing")} {visibleAtlasProducts.length.toLocaleString()} / {eligibleProducts.length.toLocaleString()}</p>
            <button type="button" onClick={() => setAtlasVisibleCount((count) => count + 24)}>
              {tr("استكشف خامات أكتر", "Explore more materials")} <ChevronDown size={17} />
            </button>
          </div>
        )}
        <p className="idea-atlas-disclaimer">{tr("الرخام الطبيعي مختلف عن السيراميك بتأثير الرخام. البيانات معروضة حسب مصدر كل كتالوج، وبعض السجلات المستوردة تحتاج مراجعة بشرية قبل الاعتماد التجاري.", "Natural marble differs from marble-effect tile. Specifications are shown as supplied by their source catalogues; some imported records still require human verification before commercial approval.")}</p>
      </section>
    </main>
  );
}
