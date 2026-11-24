import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { localMaterialFace } from "../data/localMaterialFace";
import { Link, useSearchParams } from "react-router";
import {
  ArrowLeftRight, Check, ChevronDown, CircleAlert, Download,
  Eye, Focus, ImagePlus, Layers3, Maximize2, RotateCcw,
  Search, ShieldCheck, Sparkles, UploadCloud, X, ZoomIn, ZoomOut,
} from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { ideaInternalCode, productMaker, sourceSku } from "../data/ideaProductIdentity";
import { useStore } from "../store/store";
import { useBackend } from "../backend/db";
import { getPhpSession } from "../backend/phpAccounts";
import type { Product } from "../data/types";
import "./AiVisualizerStudio.css";

type Surface = "floor" | "walls" | "both";
type MaterialSurface = Exclude<Surface, "both">;
type Point = [number, number];
type SurfaceSelection = {
  productId: string | null;
  face: number;
  sizeId: string;
  rotation: number;
  grout: string;
  area: Point[];
};
function emptySelection(productId: string | null = null): SurfaceSelection {
  return { productId, face: 0, sizeId: "", rotation: 0, grout: "#ddd8cf", area: [] };
}

function supportsSurface(product: Product, target: MaterialSurface) {
  return target === "floor" ? /\bfloor\b/i.test(product.application || "") : /\bwall\b/i.test(product.application || "");
}

function cataloguedSizes(product: Product | null) {
  return (product?.sizes || []).filter(({ widthMm, heightMm }) =>
    typeof widthMm === "number" && typeof heightMm === "number" &&
    widthMm >= 50 && heightMm >= 50 && widthMm <= 3200 && heightMm <= 3200
  );
}
type RoomKind = "living" | "bedroom" | "kitchen" | "bathroom" | "office" | "hallway" | "commercial" | "other";
type JobStage = "idle" | "uploading" | "validating" | "queued" | "generating" | "verification_failed" | "ready" | "failed";
type ViewMode = "compare" | "original" | "result" | "mask";
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
  maskAvailable?: boolean;
  error?: string;
  code?: string;
  quota?: Quota;
  quality?: Quality;
};

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;
const POLL_INTERVAL = 2500;
const POLL_LIMIT = 480;
const STAGE_ORDER: JobStage[] = ["uploading", "validating", "queued", "generating", "ready"];

const MAX_PIXELS = 10_000_000;
const MAX_EDGE = 8192;

// Keep the full frame and normalize oversized camera images before PHP validation.
async function prepareUpload(file: File): Promise<{ file: File; width: number; height: number }> {
  if (!file.size || !ALLOWED.includes(file.type)) throw new Error("unsupported_format");
  let image: ImageBitmap | HTMLImageElement;
  let sourceUrl: string | null = null;
  try {
    try {
      image = await createImageBitmap(file);
    } catch {
      sourceUrl = URL.createObjectURL(file);
      const element = new Image();
      await new Promise<void>((resolve, reject) => {
        element.onload = () => resolve();
        element.onerror = () => reject(new Error("invalid_image"));
        element.src = sourceUrl!;
      });
      image = element;
    }
    try {
      const w = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
      const h = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
      if (w < 256 || h < 256) throw new Error("invalid_dimensions");
      if (w * h <= MAX_PIXELS && Math.max(w, h) <= MAX_EDGE && file.size <= MAX_BYTES) {
        return { file, width: w, height: h };
      }
      const scale = Math.min(1, Math.sqrt(MAX_PIXELS / (w * h)), MAX_EDGE / Math.max(w, h));
      let width = Math.floor(w * scale);
      let height = Math.floor(h * scale);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("invalid_image");
      try {
        for (let attempt = 0; attempt < 8; attempt++) {
          if (width < 256 || height < 256) throw new Error("invalid_dimensions");
          canvas.width = width;
          canvas.height = height;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(image, 0, 0, width, height);
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
          if (blob && blob.type === "image/jpeg" && blob.size > 0 && blob.size <= MAX_BYTES) {
            return { file: new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: blob.type }), width, height };
          }
          width = Math.floor(width * 0.85);
          height = Math.floor(height * 0.85);
        }
        throw new Error("invalid_image");
      } finally {
        canvas.width = canvas.height = 1;
      }
    } finally {
      if ("close" in image) image.close();
    }
  } finally {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  }
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
  const [surface, setSurface] = useState<Surface>(() => searchParams.get("surface") === "walls" ? "walls" : "floor");
  const [materialSurface, setMaterialSurface] = useState<MaterialSurface>(() => surface === "walls" ? "walls" : "floor");
  const [selections, setSelections] = useState<Record<MaterialSurface, SurfaceSelection>>(() => ({
    walls: emptySelection(surface === "walls" ? searchParams.get("product") : null),
    floor: emptySelection(surface === "floor" ? searchParams.get("product") : null),
  }));
  const [drawingArea, setDrawingArea] = useState(false);
  const [maskAvailable, setMaskAvailable] = useState(false);
  const targets: MaterialSurface[] = surface === "both" ? ["walls", "floor"] : [surface];
  const surfaceLabel = (value: MaterialSurface) => value === "walls"
    ? tr("الحيطان", "Walls", "Murs") : tr("الأرضية", "Floor", "Sol");
  const materialFor = (value: MaterialSurface) => {
    const selection = selections[value];
    const product = products.find((item) => item.id === selection.productId || item.slug === selection.productId) || null;
    const faces = product ? materialFaces(product) : [];
    const sizes = cataloguedSizes(product);
    return {
      selection, product, faces, sizes,
      face: faces[selection.face] || faces[0] || null,
      size: sizes.find((item) => item.id === selection.sizeId) || sizes[0] || null,
    };
  };
  const activeMaterial = materialFor(materialSurface);
  const { product: selectedProduct, face: selectedFaceImage, faces: selectedFaces, sizes: physicalSizes, size: selectedPhysicalSize } = activeMaterial;
  const { face: faceIndex, rotation, grout, area } = activeMaterial.selection;

  const [search, setSearch] = useState("");
  const [atlasGroup, setAtlasGroup] = useState<"all" | "ceramics" | "porcelain" | "marble" | "marble-look">("all");
  const [atlasBrand, setAtlasBrand] = useState("");
  const [atlasFinish, setAtlasFinish] = useState("");
  const [atlasSize, setAtlasSize] = useState("");
  const [atlasColor, setAtlasColor] = useState("");
  const [atlasTexture, setAtlasTexture] = useState("");
  const [atlasVisibleCount, setAtlasVisibleCount] = useState(24);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoMeta, setPhotoMeta] = useState<{ width: number; height: number; megapixels: string } | null>(null);
  const [roomKind, setRoomKind] = useState<RoomKind>("living");
  const [result, setResult] = useState<string | null>(null);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [compare, setCompare] = useState(50);
  const [viewMode, setViewMode] = useState<ViewMode>("original");
  const [zoom, setZoom] = useState(1);
  const [stage, setStage] = useState<JobStage>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [integration, setIntegration] = useState("configuration_unchecked");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  const safePhotoUrl = safeBlobUrl(photoUrl);
  const busy = !["idle", "ready", "failed", "verification_failed"].includes(stage);
  const selectionsReady = targets.every((target) => {
    const choice = materialFor(target);
    return choice.product && supportsSurface(choice.product, target) && choice.face && choice.size &&
      (choice.selection.area.length === 0 || choice.selection.area.length >= 3);
  });
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
      if (!supportsSurface(product, materialSurface)) return false;
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
  }, [materialLibrary, materialSurface, search, atlasGroup, atlasBrand, atlasFinish, atlasSize, atlasColor, atlasTexture]);
  useEffect(() => setAtlasVisibleCount(24), [search, atlasGroup, atlasBrand, atlasFinish, atlasSize, atlasColor, atlasTexture]);
  const visibleAtlasProducts = eligibleProducts.slice(0, atlasVisibleCount);
  const resetAtlas = () => {
    setSearch(""); setAtlasGroup("all"); setAtlasBrand(""); setAtlasFinish("");
    setAtlasSize(""); setAtlasColor(""); setAtlasTexture("");
  };

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const response = await fetch("/api/visualize.php?action=status", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await response.json().catch(() => null) as (JobResponse & { integration?: string }) | null;
      if (!active || !data) return;
      setQuota(aiEligible ? data.quota || null : null);
      setIntegration(data.integration || (response.ok ? "configuration_present_unverified" : "configuration_required"));
    })().catch(() => { if (active) setIntegration("unavailable"); });
    return () => { active = false; };
  }, [session?.id, aiEligible]);

  function clearResult() {
    setResult(null);
    setQuality(null);
    setMaskAvailable(false);
    setJobId(null);
    setViewMode("original");
    setStage("idle");
    setError("");
  }

  function updateMaterial(next: Partial<SurfaceSelection>) {
    if (busy) return;
    setSelections((previous) => ({
      ...previous,
      [materialSurface]: { ...previous[materialSurface], ...next },
    }));
    clearResult();
  }

  function selectSurface(next: Surface) {
    if (busy || next === surface) return;
    setSurface(next);
    setMaterialSurface(next === "both" ? "walls" : next);
    setDrawingArea(false);
    clearResult();
  }

  async function loadRoom(file: File) {
    setStage("validating");
    try {
      const prepared = await prepareUpload(file);
      setPhotoMeta({ width: prepared.width, height: prepared.height, megapixels: (prepared.width * prepared.height / 1_000_000).toFixed(1) });
      setPhoto(prepared.file);
      setPhotoUrl(URL.createObjectURL(prepared.file));
      setSelections((previous) => ({
        walls: { ...previous.walls, area: [] },
        floor: { ...previous.floor, area: [] },
      }));
      setDrawingArea(false);
      setZoom(1);
      clearResult();
    } catch (cause) {
      setStage("failed");
      const code = cause instanceof Error ? cause.message : "";
      setError(code === "invalid_dimensions"
        ? tr("اختار صورة بعرض وارتفاع لا يقلوا عن 256 بكسل.", "Choose an image at least 256px on each side.")
        : tr("تعذر تجهيز الصورة. جرّب JPG أو PNG أو WebP.", "Could not open the image. Try JPG, PNG or WebP."));
    }
  }

  async function onRoomFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file && !busy) await loadRoom(file);
  }

  async function loadSampleRoom() {
    if (busy) return;
    setStage("validating");
    try {
      const response = await fetch(import.meta.env.BASE_URL + "images/category-covers/ceramics-v2.webp");
      if (!response.ok) throw new Error("sample_unavailable");
      await loadRoom(new File([await response.blob()], "idea-sample-bathroom.webp", { type: "image/webp" }));
      setRoomKind("bathroom");
    } catch {
      setStage("failed");
      setError(tr("تعذر تحميل الغرفة التجريبية.", "The sample room could not be loaded."));
    }
  }

  function chooseProduct(id: string) {
    if (busy) return;
    setSearchParams({ product: id, surface: materialSurface }, { replace: true });
    updateMaterial({ productId: id, face: 0, sizeId: "" });
    window.requestAnimationFrame(() => {
      document.querySelector(".idea-studio-material")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        block: "start",
      });
    });
  }

  async function csrfToken() {
    const current = await getPhpSession();
    if (!current.user || !["buyer", "admin"].includes(current.user.role)) {
      throw new Error(tr("سجّل الدخول بحساب عميل أو أدمن.", "Sign in with a customer or administrator account."));
    }
    return current.csrf;
  }

  async function pollJob(id: string, controller: AbortController) {
    for (let attempt = 0; attempt < POLL_LIMIT; attempt++) {
      await wait(POLL_INTERVAL, controller.signal);
      const response = await fetch(`/api/visualize.php?job=${encodeURIComponent(id)}`, {
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null) as JobResponse | null;
      if (!response.ok || !data) throw new Error(data?.error || tr("استجابة غير صالحة من خدمة التصور.", "The visualization service returned an invalid response."));
      if (data.quota) setQuota(data.quota);
      if (data.stage) setStage(data.stage);
      if (data.state === "ready" && data.image) {
        const secureResult = "/api/visualize.php?job=" + encodeURIComponent(id) + "&asset=result";
        if (data.image !== secureResult && !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data.image)) {
          throw new Error(tr("تعذر قراءة النتيجة.", "The result could not be read."));
        }
        setResult(data.image);
        setMaskAvailable(data.maskAvailable === true);
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
    if (!selectionsReady) {
      setError(tr("اختار خامة بمقاس موثق لكل سطح، وأكمل أي مساحة محددة على الصورة.",
                  "Choose a catalogue material with a documented size for each surface and finish any area selection."));
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
      const token = await csrfToken();
      const form = new FormData();
      form.append("action", "create");
      form.append("editVersion", "2");
      form.append("room", photo);
      form.append("surface", surface);
      form.append("roomKind", roomKind);
      for (const target of targets) {
        const choice = materialFor(target);
        if (!choice.product || !choice.face || !choice.size) throw new Error("Invalid catalogue material");
        const prefix = target + "_";
        form.append(prefix + "face", String(choice.selection.face));
        form.append(prefix + "productId", choice.product.id);
        form.append(prefix + "tileSize", choice.size.label);
        form.append(prefix + "tileWidth", String(choice.size.widthMm));
        form.append(prefix + "tileHeight", String(choice.size.heightMm));
        form.append(prefix + "rotation", String(choice.selection.rotation));
        form.append(prefix + "grout", choice.selection.grout);
        form.append(prefix + "area", JSON.stringify(choice.selection.area));
      }
      form.append("idempotencyKey", crypto.randomUUID());
      setDrawingArea(false);
      setStage("validating");
      const response = await fetch("/api/visualize.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": token },
        body: form,
        cache: "no-store",
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null) as JobResponse | null;
      if (!response.ok || !data?.jobId) throw new Error(data?.error || tr("تعذر قبول وظيفة التوليد.", "The generation job could not be accepted."));
      if (data.quota) setQuota(data.quota);
      setJobId(data.jobId);
      setStage(data.stage || "queued");
      await pollJob(data.jobId, controller);
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
    if (!requestRef.current || !busy) return;
    requestRef.current?.abort();
    setStage("failed");
    setError(tr("تم إيقاف المتابعة فقط. قد تستمر الوظيفة على الخادم؛ راجع سجل التصميمات.", "Polling stopped only. The server job may continue; check design history."));
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
          <h1>{tr("استوديو الخامات", "Surface Studio", "Studio des surfaces")}</h1>
          <p>{tr("ارفع صورة غرفتك، واختار خامة للحيطان وخامة للأرضية، وشوف الفرق على نفس الصورة.",
            "Upload a room photo, choose wall and floor materials, and compare the result on the same image.",
            "Importez une photo, choisissez les revêtements et comparez le résultat.")}</p>
        </div>
      </section>

      <div className="idea-studio-workspace">
        <aside className="idea-studio-rail idea-studio-room">
          <div className="idea-studio-rail-head"><div><h2>{tr("صورة الغرفة", "Room photo", "Photo de la pièce")}</h2></div></div>
          <button className="idea-studio-upload" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
            <UploadCloud size={24} />
            <strong>{photo ? tr("تغيير صورة الغرفة", "Replace room image") : tr("ارفع صورة الغرفة", "Upload room image")}</strong>
            <small dir="ltr">JPG · PNG · WEBP · 8 MB</small>
          </button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onRoomFile} />
          {!photo && <button className="idea-studio-sample-room" type="button" disabled={busy} onClick={() => void loadSampleRoom()}>{tr("جرّب صورة حمام", "Try a sample bathroom", "Essayer une salle de bain")}</button>}
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
              {([["walls", surfaceLabel("walls")], ["floor", surfaceLabel("floor")], ["both", tr("الاتنين", "Both", "Les deux")]] as const).map(([value, label]) => (
                <button type="button" key={value} disabled={busy} aria-pressed={surface === value} className={surface === value ? "active" : ""} onClick={() => selectSurface(value)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="idea-studio-control-block">
            <label htmlFor="idea-studio-room-kind">{tr("نوع الغرفة", "Room type", "Type de pièce")}</label>
            <select id="idea-studio-room-kind" disabled={busy} value={roomKind} onChange={(event) => { setRoomKind(event.target.value as RoomKind); clearResult(); }}>
              <option value="living">{tr("غرفة معيشة", "Living room", "Salon")}</option>
              <option value="bedroom">{tr("غرفة نوم", "Bedroom", "Chambre")}</option>
              <option value="kitchen">{tr("مطبخ", "Kitchen", "Cuisine")}</option>
              <option value="bathroom">{tr("حمام", "Bathroom", "Salle de bain")}</option>
              <option value="office">{tr("مكتب", "Office", "Bureau")}</option>
              <option value="hallway">{tr("ممر", "Hallway", "Couloir")}</option>
              <option value="commercial">{tr("مساحة تجارية", "Commercial", "Commerce")}</option>
              <option value="other">{tr("أخرى", "Other", "Autre")}</option>
            </select>
          </div>
          <button className="idea-studio-reset-source" type="button" disabled={!photo || busy} onClick={() => { setPhoto(null); setPhotoUrl(null); setPhotoMeta(null); setDrawingArea(false); clearResult(); }}>
            <RotateCcw size={14} /> {tr("إزالة الصورة", "Remove photo", "Retirer la photo")}
          </button>
        </aside>

        <section className="idea-studio-canvas" aria-label={tr("لوحة المعاينة المعمارية", "Architectural visualization canvas")}>
          <div className="idea-studio-canvas-head">
            <div><span className={`idea-studio-live ${stage}`} /><b>{stageText[stage]}</b></div>
            <div className="idea-studio-view-tabs">
              {(["original", "compare", "result"] as ViewMode[]).map((mode) => (
                <button key={mode} type="button" disabled={drawingArea || (mode !== "original" && !result)} aria-pressed={viewMode === mode} className={viewMode === mode ? "active" : ""} onClick={() => setViewMode(mode)}>
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
                {drawingArea && photoMeta ? (
                  <svg className="idea-studio-area-editor" viewBox={"0 0 " + photoMeta.width + " " + photoMeta.height}
                    aria-label={tr("تحديد جزء من " + surfaceLabel(materialSurface), "Outline a region of the " + surfaceLabel(materialSurface).toLowerCase())}
                    onClick={(event) => {
                      const matrix = event.currentTarget.getScreenCTM();
                      if (!matrix || area.length >= 24) return;
                      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
                      const x = point.x / photoMeta.width;
                      const y = point.y / photoMeta.height;
                      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) updateMaterial({ area: [...area, [x, y]] });
                    }}>
                    <image href={safePhotoUrl} width={photoMeta.width} height={photoMeta.height} />
                    <polygon points={area.map(([x, y]) => (x * photoMeta.width) + "," + (y * photoMeta.height)).join(" ")} />
                    {area.map(([x, y], index) => <circle key={index} cx={x * photoMeta.width} cy={y * photoMeta.height}
                      r={Math.max(photoMeta.width, photoMeta.height) / 140} />)}
                  </svg>
                ) : viewMode === "mask" && jobId ? (
                  <>
                    <img className="idea-studio-single-image" src={safePhotoUrl} alt={tr("الغرفة الأصلية", "Original room")} />
                    <img className="idea-studio-single-image idea-studio-mask-image" src={"/api/visualize.php?job=" + encodeURIComponent(jobId) + "&asset=mask"}
                      alt={tr("مساحات الحيطان والأرضية اللي اتغيرت", "Wall and floor areas accepted for editing")} />
                  </>
                ) : viewMode === "compare" && result ? (
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
                <button type="button" onClick={() => void cancelJob()}><X size={14} /> {tr("إيقاف المتابعة", "Stop waiting")}</button>
              </div>
            )}
          </div>
          <div className="idea-studio-canvas-foot">
            {drawingArea ? (
              <div className="idea-studio-region-tools">
                <span>{tr("علّم حدود " + surfaceLabel(materialSurface) + " بالضغط على الصورة.", "Click along the boundary of the " + surfaceLabel(materialSurface).toLowerCase() + ".")}</span>
                <button type="button" disabled={area.length === 0} onClick={() => updateMaterial({ area: area.slice(0, -1) })}>{tr("تراجع", "Undo")}</button>
                <button type="button" onClick={() => { updateMaterial({ area: [] }); setDrawingArea(false); }}>{tr("تحديد تلقائي", "Use automatic detection")}</button>
                <button type="button" disabled={area.length < 3} onClick={() => setDrawingArea(false)}><Check size={15} />{tr("اعتماد المنطقة", "Use this area")}</button>
              </div>
            ) : (
              <div>
                {photo && !result && <button type="button" disabled={busy} onClick={() => { setZoom(1); setDrawingArea(true); }}><Focus size={15} />{area.length ? tr("تعديل التحديد", "Edit selected area") : tr("حدد جزء من السطح", "Limit to an area")}</button>}
                {maskAvailable && <button type="button" aria-pressed={viewMode === "mask"} onClick={() => setViewMode(viewMode === "mask" ? "compare" : "mask")}><Eye size={15} />{tr("عرض مناطق التعديل", "Show edited areas")}</button>}
              </div>
            )}
            {result && <a download="idea-room-visualization.png" href={result}><Download size={16} /> {tr("تنزيل PNG", "Download PNG")}</a>}
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
          <div className="idea-studio-rail-head"><div><h2>{tr("خامات الغرفة", "Room materials", "Revêtements")}</h2></div></div>
          <div className="idea-studio-material-slots" role="group" aria-label={tr("خامة لكل سطح", "Materials by surface")}>
            {targets.map((target) => {
              const choice = materialFor(target);
              return (
                <button key={target} type="button" disabled={busy} aria-pressed={materialSurface === target}
                  onClick={() => { setMaterialSurface(target); setDrawingArea(false); }}>
                  <span className="idea-studio-slot-thumbnail">{choice.face ? <img src={choice.face} alt="" /> : <Layers3 size={19} />}</span>
                  <span><strong>{surfaceLabel(target)}</strong><small>{choice.product ? localizedName(choice.product) : tr("اختار خامة", "Choose material", "Choisir")}</small></span>
                  {choice.face && <Check size={14} />}
                </button>
              );
            })}
          </div>
          <a className="idea-studio-browse" href="#idea-material-atlas">
            <Search size={15} />{tr("اختار من الكتالوج", "Browse catalogue", "Parcourir le catalogue")}<ChevronDown size={14} />
          </a>
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
                    disabled={busy} onClick={() => updateMaterial({ face: index })}>
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
          <details className="idea-studio-material-settings">
            <summary>{tr("المقاس والتركيب", "Size and layout", "Format et pose")}</summary>
          <div className="idea-studio-control-block">
            <label>{tr("اتجاه البلاطة", "Tile orientation")}</label>
            <div className="idea-studio-choice">{[0,45,90].map((value) => <button type="button" key={value} className={rotation === value ? "active" : ""} disabled={busy} aria-pressed={rotation === value} onClick={() => updateMaterial({ rotation: value })}>{value}°</button>)}</div>
          </div>
          <div className="idea-studio-control-block">
            <label>{tr("المقاس الحقيقي للبلاطة", "Actual tile size")}</label>
            <select value={selectedPhysicalSize?.id || ""} onChange={(event) => updateMaterial({ sizeId: event.target.value })} disabled={busy || physicalSizes.length <= 1}>
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
            <div className="idea-studio-colors">{["#3b3b3b","#ffffff","#ddd8cf","#9b998f"].map((color) => <button type="button" key={color} style={{ background: color }} className={grout === color ? "active" : ""} disabled={busy} aria-pressed={grout === color} onClick={() => updateMaterial({ grout: color })} aria-label={color} />)}</div>
          </div>
          </details>
          {!session && <small role="status"><Link to="/login">{tr("سجّل الدخول بحساب مستخدم لتوليد الصور.", "Sign in with a customer account to generate images.")}</Link></small>}
          {session && !aiEligible && <small role="status">{tr("حسابات الشركات ليس لها صلاحية توليد الصور.", "Company accounts are not eligible for AI generation.")}</small>}
          <button className="idea-studio-generate" type="button" onClick={() => void generate()} disabled={!aiEligible || busy || !photo || !selectionsReady || drawingArea || Boolean(quota && !quota.unlimited && quota.remaining === 0)}>
            <Sparkles size={17} /> {tr("اعمل المعاينة", "Generate preview", "Créer l’aperçu")}
          </button>
          <small className="idea-studio-consent">{tr("صورة الغرفة ووجوه الخامات بتتبعث لـRunpod للمعالجة المؤقتة.", "Generation sends the room and material references to Runpod for temporary processing.")}</small>
        </aside>
      </div>

      <section className="idea-studio-library" id="idea-material-atlas" aria-labelledby="idea-atlas-heading">
        <div className="idea-atlas-overline"><span className="idea-studio-kicker">{tr("IDEA / مكتبة الخامات 2030", "IDEA / MATERIAL ATLAS 2030")}</span><span>{tr("كتالوج مستورد • يتوسع مع كل مورد جديد", "Source-linked catalogue · expanding with supplier imports")}</span></div>
        <div className="idea-studio-library-head">
          <div>
            <h2 id="idea-atlas-heading">{tr("اختار خامة", "Choose a material for", "Choisir pour")} <em>{surfaceLabel(materialSurface)}</em></h2>
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
