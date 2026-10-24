import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowLeftRight, Check, Download, ImagePlus, RotateCcw, Search, SlidersHorizontal, Sparkles, UploadCloud } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { supabase } from "../backend/supabaseClient";
import "./AiVisualizerStudio.css";

type Surface = "floor" | "walls" | "backsplash";
type RoomKind = "living" | "bedroom" | "kitchen" | "bathroom" | "other";
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

function readImage(file: File | undefined): string | null {
  if (!file || !ALLOWED.includes(file.type) || file.size > MAX_BYTES || file.size === 0) return null;
  return URL.createObjectURL(file);
}
function sanitizeImageUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol === "blob:") return parsed.href;
  } catch {
    return null;
  }
  return null;
}
function titleFor(locale: string, ar: string, en: string, fr?: string) {
  return locale === "ar" ? ar : locale === "fr" ? (fr || en) : en;
}

export function AiVisualizerStudio() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const { products } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("product");
  const selectedProduct = products.find(p => p.id === selectedId || p.slug === selectedId) || null;
  const [search, setSearch] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [material, setMaterial] = useState<File | null>(null);
  const [materialUrl, setMaterialUrl] = useState<string | null>(null);
  const safeMaterialUrl = sanitizeImageUrl(materialUrl);
  const [surface, setSurface] = useState<Surface>("floor");
  const [roomKind, setRoomKind] = useState<RoomKind>("living");
  const [rotation, setRotation] = useState(0);
  const [grout, setGrout] = useState("#ddd8cf");
  const [tileSize, setTileSize] = useState("60 × 60 cm");
  const [result, setResult] = useState<string | null>(null);
  const [compare, setCompare] = useState(50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const visible = useMemo(() => products.filter(p => p.image && (
    !search || (p.name.en + " " + p.name.ar + " " + p.brand + " " + p.model).toLowerCase().includes(search.toLowerCase())
  )).slice(0, 18), [products, search]);
  const tr = (arabic: string, english: string, french?: string) => titleFor(locale, arabic, english, french);

  useEffect(() => {
    return () => {
      requestRef.current?.abort();
    };
  }, []);
  useEffect(() => {
    return () => { if (photoUrl) URL.revokeObjectURL(photoUrl); };
  }, [photoUrl]);
  useEffect(() => {
    return () => { if (materialUrl) URL.revokeObjectURL(materialUrl); };
  }, [materialUrl]);

  function setRoomFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = readImage(file);
    if (!url) { setError(tr("الصورة لازم تكون JPG أو PNG أو WebP وأقل من 10 ميجابايت.", "Upload a JPG, PNG or WebP under 10 MB.")); return; }
    setPhoto(file);
    setPhotoUrl(url);
    setResult(null);
    setError("");
  }
  function setMaterialFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = readImage(file);
    if (!url) { setError(tr("صورة الخامة لازم تكون أقل من 10 ميجابايت.", "Material image must be under 10 MB.")); return; }
    setMaterial(file);
    setMaterialUrl(url);
    setResult(null);
    setError("");
  }
  function chooseProduct(id: string) {
    setSearchParams({product: id}, { replace: true });
    setResult(null);
    setMaterial(null);
    setMaterialUrl(null);
    setError("");
  }
  async function generate() {
    if (busy) return;
    if (!photo) { setError(tr("ارفع صورة الغرفة أولًا.", "Upload your room photo first.")); inputRef.current?.click(); return; }
    if (!selectedProduct) { setError(tr("اختار خامة من المكتبة أولًا.", "Select a material from the library.")); return; }
    if (!supabase) { setError(tr("خدمة تسجيل الدخول غير مهيأة بعد.", "Sign-in service is not configured.")); return; }
    setBusy(true);
    setError("");
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const {data: auth, error: authError} = await supabase.auth.getSession();
      if (authError || !auth.session?.access_token) throw new Error(tr("سجّل دخولك قبل إنشاء التصميم.", "Sign in before generating your design."));
      const form = new FormData();
      form.append("room", photo);
      form.append("productId", selectedProduct.id);
      form.append("productName", selectedProduct.name.en);
      form.append("brand", selectedProduct.brand);
      form.append("finish", selectedProduct.finish || "");
      form.append("surface", surface);
      form.append("roomKind", roomKind);
      form.append("rotation", String(rotation));
      form.append("tileSize", tileSize);
      form.append("grout", grout);
      if (material) {
        form.append("material", material);
      } else {
        // Only use assets the browser can legitimately fetch (same-origin / CORS-enabled).
        // Never silently substitute another product's texture when CORS blocks the image.
        try {
          const imageResponse = await fetch(selectedProduct.image, { mode: "cors", signal: controller.signal });
          if (imageResponse.ok) {
            const blob = await imageResponse.blob();
            if (ALLOWED.includes(blob.type) && blob.size > 0 && blob.size <= MAX_BYTES) {
              form.append("material", blob, "selected-material");
            }
          }
        } catch { /* user can upload a sample from the material panel */ }
      }
      if (!form.has("material")) throw new Error(tr(
        "صورة المنتج غير متاحة للمعالجة المباشرة. ارفع صورة الخامة الأصلية من لوحة الخامة للحفاظ على شكلها.",
        "The product image cannot be read securely. Upload an original material sample to preserve its appearance."
      ));
      const response = await fetch("/api/visualize.php", {
        method: "POST",
        headers: { Authorization: "Bearer " + auth.session.access_token },
        body: form,
        signal: controller.signal,
        cache: "no-store"
      });
      const data = await response.json().catch(() => null) as { image?: string; error?: string } | null;
      if (!response.ok || !data?.image) {
        if (response.status === 503) throw new Error(tr("محرك الصور لسه محتاج إعداد Gemini API على السيرفر.", "Gemini API needs server configuration before image rendering is available."));
        throw new Error(data?.error || tr("تعذر إنشاء الصورة. حاول مرة تانية.", "Unable to generate the image. Try again."));
      }
      if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data.image)) throw new Error("Invalid rendering response");
      setCompare(50);
      setResult(data.image);
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : tr("حصل خطأ غير متوقع.", "Unexpected error."));
    } finally {
      setBusy(false);
      requestRef.current = null;
    }
  }

  const productName = selectedProduct ? selectedProduct.name[locale] : tr("اختار خامتك", "Select a surface");
  return (
    <main className="idea-studio" dir={ar ? "rtl" : "ltr"}>
      <div className="idea-studio-hero">
        <div className="idea-studio-hero-inner">
          <span className="idea-studio-kicker"><Sparkles size={15}/> {tr("استوديو خامات IDEA", "IDEA MATERIAL STUDIO / AI")}</span>
          <h1>{tr("شوف مساحتك", "Your space,")} <em>{tr("بشكل جديد.", "reimagined.")}</em></h1>
          <p>{tr("اختار البلاط اللي عجبك، وارفع صورة غرفتك، وشوف تصورًا بصريًا باستخدام خامتك المختارة.", "Choose an IDEA surface, upload your room and visualize the space with your selected material.")}</p>
        </div>
        <span className="idea-studio-hero-index">{tr("01 / تصميم مساحتك", "01 / DESIGN YOUR SPACE")}</span>
      </div>
      <div className="idea-studio-grid">
        <aside className="idea-studio-panel idea-studio-product">
          <div className="idea-studio-heading"><span>01</span><h2>{tr("خامتك المختارة", "Your material")}</h2></div>
          <div className="idea-studio-product-photo">{selectedProduct?.image ? <><img src={selectedProduct.image} alt={productName} onError={e => { e.currentTarget.hidden = true; const fallback = e.currentTarget.nextElementSibling as HTMLElement | null; if (fallback) fallback.hidden = false; }}/><div className="idea-studio-blank" hidden><ImagePlus size={32}/><span>{tr("صورة المنتج غير متاحة", "Product image unavailable")}</span></div></> : <div className="idea-studio-blank"><ImagePlus size={32}/><span>{tr("اختار منتجًا من المكتبة", "Choose a product below")}</span></div>}</div>
          <h3>{productName}</h3>
          {selectedProduct && <><p>{selectedProduct.brand}</p><dl><div><dt>{tr("النوع","Type")}</dt><dd>{selectedProduct.type || "—"}</dd></div><div><dt>{tr("التشطيب","Finish")}</dt><dd>{selectedProduct.finish || "—"}</dd></div><div><dt>{tr("المقاس","Size")}</dt><dd>{selectedProduct.sizes[0]?.label || "—"}</dd></div></dl><Link className="idea-studio-text-link" to={"/product/" + selectedProduct.slug}>{tr("تفاصيل المنتج ←", "Product details →")}</Link></>}
          <label className="idea-studio-sample"><ImagePlus size={18}/>{tr("ارفع صورة خامة أو عينة أوضح (اختياري)", "Upload a clearer material sample (optional)")}<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={setMaterialFile}/></label>
          {safeMaterialUrl && <div className="idea-studio-material-thumb"><img src={safeMaterialUrl} alt={tr("العينة المرفوعة", "Uploaded sample")}/><Check size={15}/></div>}
          <p className="idea-studio-fine">{tr("صورة المنتج الحقيقية هي المرجع الأساسي. في حالة منع تحميلها، ارفع صورة أصلية للخامة.", "The actual product image is the reference. If blocked by its source, upload a genuine material sample.")}</p>
        </aside>
        <section className="idea-studio-center" aria-label={tr("معاينة الغرفة", "Room preview")}>
          <div className="idea-studio-stage-top"><span><span className="idea-studio-dot"/> {result ? tr("التصور الناتج", "Generated visualization") : tr("مساحة المعاينة", "Live workspace")}</span><span>{tr("استوديو IDEA", "IDEA / STUDIO")}</span></div>
          <div className="idea-studio-stage">
            {photoUrl ? (
              <div className="idea-studio-comparison">
                <img className="idea-studio-before" src={photoUrl} alt={tr("الغرفة الأصلية","Original room")}/>
                {result && <div className="idea-studio-after" style={{clipPath:"inset(0 " + (100 - compare) + "% 0 0)"}}><img src={result} alt={tr("تصور بالذكاء الاصطناعي","AI visualization")}/></div>}
                {result && <div className="idea-studio-split" style={{left: compare + "%"}}><span><ArrowLeftRight size={16}/></span></div>}
              </div>
            ) : (
              <button type="button" className="idea-studio-empty" onClick={() => inputRef.current?.click()}><div className="idea-studio-upload-icon"><UploadCloud size={32}/></div><strong>{tr("ابدأ بصورة غرفتك", "Start with your room")}</strong><span>{tr("ارفع صورة للصالة أو الحمام أو المطبخ أو أي مساحة.", "Upload a living room, bathroom, kitchen or any space.")}</span><small>JPG · PNG · WEBP / MAX 10 MB</small></button>
            )}
            {busy && <div className="idea-studio-processing" role="status"><div className="idea-studio-spinner"/><strong>{tr("جاري تجهيز التصور...", "Creating your visualization...")}</strong><small>{tr("قد يستغرق الأمر قليلًا حسب محرك الصور.", "Image generation may take a moment.")}</small></div>}
          </div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={setRoomFile}/>
          <div className="idea-studio-stage-actions">
            <button type="button" onClick={() => inputRef.current?.click()}><UploadCloud size={16}/>{tr("تغيير صورة الغرفة", "Change room photo")}</button>
            {result && <><label className="idea-studio-range"><ArrowLeftRight size={15}/>{tr("قبل / بعد", "Before / After")} <input aria-label={tr("مقارنة قبل وبعد", "Before and after comparison")} type="range" min="0" max="100" value={compare} onChange={e => setCompare(Number(e.target.value))}/></label><a download="idea-room-visualization.png" href={result}><Download size={15}/>{tr("حفظ النتيجة", "Download")}</a></>}
            <button type="button" onClick={() => { setResult(null); setCompare(50); }} disabled={!result}><RotateCcw size={15}/>{tr("إعادة ضبط", "Reset")}</button>
          </div>
          <p className="idea-studio-disclaimer">{tr("التصور الناتج للتخيل البصري فقط؛ الألوان والمقاسات والقصّ والتركيب الفعلي قد تختلف.", "Visual concept only. Real-world color, scale, cuts and installation may differ.")}</p>
          {error && <div role="alert" className="idea-studio-error">{error} <Link to="/login">{tr("تسجيل الدخول", "Sign in")}</Link></div>}
        </section>
        <aside className="idea-studio-panel idea-studio-controls">
          <div className="idea-studio-heading"><span>02</span><h2>{tr("إعداد التصميم", "Design settings")}</h2></div>
          <label className="idea-studio-label">{tr("نوع الغرفة", "Room type")}</label>
          <select value={roomKind} onChange={e => setRoomKind(e.target.value as RoomKind)}><option value="living">{tr("غرفة معيشة","Living room")}</option><option value="bedroom">{tr("غرفة نوم","Bedroom")}</option><option value="kitchen">{tr("مطبخ","Kitchen")}</option><option value="bathroom">{tr("حمام","Bathroom")}</option><option value="other">{tr("مساحة أخرى","Other space")}</option></select>
          <label className="idea-studio-label">{tr("منطقة التركيب", "Application area")}</label>
          <div className="idea-studio-segments">{([["floor",tr("الأرضية", "Floor")],["walls",tr("الحوائط","Walls")],["backsplash",tr("خلفية المطبخ","Backsplash")]] as const).map(([key,label])=><button key={key} type="button" className={surface === key ? "active" : ""} onClick={()=>setSurface(key)}>{label}</button>)}</div>
          <label className="idea-studio-label" htmlFor="idea-studio-tile-size">{tr("مقاس البلاطة", "Tile size")}</label>
          <select id="idea-studio-tile-size" value={tileSize} onChange={e=>setTileSize(e.target.value)}><option>30 × 30 cm</option><option>60 × 60 cm</option><option>60 × 120 cm</option><option>80 × 80 cm</option><option>120 × 120 cm</option></select>
          <label className="idea-studio-label">{tr("اتجاه التركيب", "Laying angle")}</label>
          <div className="idea-studio-segments">{[0,45,90].map(value=><button key={value} type="button" className={rotation === value ? "active" : ""} onClick={()=>setRotation(value)}>{value}°</button>)}</div>
          <label className="idea-studio-label">{tr("لون الفواصل", "Grout color")}</label>
          <div className="idea-studio-color">{["#3b3b3b","#ffffff","#ddd8cf","#9b998f"].map(color=><button key={color} type="button" style={{background:color}} className={color === grout ? "active" : ""} aria-label={color} onClick={()=>setGrout(color)}/>)}</div>
          <button type="button" className="idea-studio-generate" onClick={generate} disabled={busy}><Sparkles size={18}/>{busy ? tr("جاري التوليد...", "Generating...") : tr("شوفها في شقتك", "Visualize in your room")}</button>
          <p className="idea-studio-fine"><SlidersHorizontal size={14}/>{tr("النتيجة بالذكاء الاصطناعي تتطلب حسابًا نشطًا ومفتاح Gemini على السيرفر. صور الغرفة والخامة تُرسل إلى Google Gemini عند التوليد.", "Generation requires sign-in and a server-side Gemini API key. Your room and material images are sent to Google Gemini when generating.")}</p>
        </aside>
        <section className="idea-studio-library">
          <div className="idea-studio-library-top"><div><span className="idea-studio-kicker">{tr("مكتبة خامات IDEA", "IDEA MATERIAL LIBRARY")}</span><h2>{tr("كل مساحة وليها خامتها.", "Find your next surface.")}</h2></div><div className="idea-studio-search"><Search size={17}/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={tr("ابحث عن خامة أو موديل", "Search materials and models")} aria-label={tr("بحث الخامات", "Search materials")}/></div></div>
          <div className="idea-studio-swatches">{visible.map(p=><button type="button" key={p.id} onClick={()=>chooseProduct(p.id)} className={selectedProduct?.id===p.id?"selected":""}><span className="idea-studio-swatch-image"><img src={p.image} alt="" loading="lazy" onError={e=>{ e.currentTarget.hidden = true; const fallback = e.currentTarget.nextElementSibling as HTMLElement | null; if (fallback) fallback.hidden = false; }} /><span className="idea-studio-image-fallback" hidden><ImagePlus size={18}/>{tr("الصورة غير متاحة", "Image unavailable")}</span>{selectedProduct?.id===p.id && <span className="idea-studio-selected"><Check size={15}/></span>}</span><strong>{p.name[locale]}</strong><small>{p.brand}</small></button>)}</div>
          {visible.length===0 && <p className="idea-studio-fine">{tr("مفيش منتجات تطابق بحثك.", "No matching materials.")}</p>}
          <Link to="/products" className="idea-studio-all">{tr("تصفح كل المنتجات", "Browse all products")}</Link>
        </section>
      </div>
    </main>
  );
}