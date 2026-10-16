import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { UploadCloud, MousePointerClick, Sparkles, Image as ImageIcon, ClipboardList, BadgeCheck, CreditCard, Truck } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { Button, Container, Section, SectionHeader } from "../components/ui";
import { useStore } from "../store/store";

export function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    { icon: MousePointerClick, title: "Select Products", body: "Choose surfaces and quantity — square metres for ceramic & porcelain, pieces for sanitary ware." },
    { icon: ClipboardList, title: "Submit One Request", body: "Send a single Best-Price request; no public prices are shown." },
    { icon: BadgeCheck, title: "Receive Private Offers", body: "Verified matching suppliers submit offers within 24 hours." },
    { icon: CreditCard, title: "Confirm & Pay", body: "Confirm your preferred offer and pay securely (Credit Card · Fawry · Vodafone Cash)." },
    { icon: Truck, title: "Delivery", body: "Prepared and delivered, typically within 3–7 business days where applicable." },
  ];
  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container>
        <SectionHeader eyebrow="Process" title={t("nav.how")} sub={t("home.bestPriceBody")} />
        <div style={{ display: "grid", gap: "var(--idea-space-4)" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "var(--idea-space-4)", alignItems: "flex-start", background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-5)" }}>
              <div style={{ width: 46, height: 46, borderRadius: 999, display: "grid", placeItems: "center", background: "var(--idea-gold-soft)", border: "1px solid var(--idea-gold)", color: "var(--idea-gold-bright)", flexShrink: 0 }}>
                <s.icon size={20} />
              </div>
              <div>
                <div style={{ color: "var(--idea-gold)", fontSize: "var(--idea-text-xs)" }}>Step {i + 1}</div>
                <div className="idea-display" style={{ fontSize: "var(--idea-text-lg)", color: "var(--idea-text)", margin: "2px 0 6px" }}>{s.title}</div>
                <p style={{ color: "var(--idea-text-muted)", lineHeight: 1.6, margin: 0 }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "var(--idea-space-6)" }}>
          <Link to="/request-quote/new"><Button size="lg">{t("action.requestPrice")}</Button></Link>
        </div>
      </Container>
    </Section>
  );
}

// UI-only handoff to a separately maintained image-visualization service.
// No photo is transferred until the user presses Send and the integration is configured.
const VISUALIZER_ENDPOINT = String(import.meta.env.VITE_IDEA_VISUALIZER_ENDPOINT || "").trim();
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const ACCEPTED_IMAGES = ["image/jpeg", "image/png", "image/webp"];

function useLocalPreview(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const preview = URL.createObjectURL(file);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);
  return url;
}

export function AiVisualizer() {
  const { locale } = useI18n();
  const { products } = useStore();
  const [params] = useSearchParams();
  const [selectedId, setSelectedId] = useState(params.get("product") || "");
  const [roomFile, setRoomFile] = useState<File | null>(null);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [space, setSpace] = useState("apartment");
  const [surface, setSurface] = useState("auto");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const ar = locale === "ar";
  const tr = (arabic: string, english: string) => ar ? arabic : english;
  useEffect(() => { setSelectedId(params.get("product") || ""); }, [params]);
  const product = products.find(item => item.id === selectedId);
  const roomPreview = useLocalPreview(roomFile);
  const materialPreview = useLocalPreview(materialFile);
  const matches = useMemo(() => {
    const key = query.trim().toLocaleLowerCase();
    return products.filter(item => !key || item.name.ar.toLocaleLowerCase().includes(key)
      || item.name.en.toLocaleLowerCase().includes(key)
      || item.brand.toLocaleLowerCase().includes(key)).slice(0, 12);
  }, [products, query]);
  function chooseImage(file: File | undefined, type: "room" | "material") {
    if (!file) return;
    setMessage(""); setResultUrl("");
    if (!ACCEPTED_IMAGES.includes(file.type) || file.size > MAX_IMAGE_BYTES) {
      setMessage(tr("اختر صورة مناسبة بحد أقصى ١٥ ميجابايت.", "Choose a JPEG, PNG or WebP image of at most 15 MB."));
      return;
    }
    if (type === "room") setRoomFile(file);
    else setMaterialFile(file);
  }
  async function submit() {
    if (!roomFile || (!product && !materialFile)) {
      setMessage(tr("ارفع صورة شقتك واختر المنتج أو ارفع صورة خامة.", "Upload your apartment photo and choose or upload a material."));
      return;
    }
    if (!VISUALIZER_ENDPOINT) {
      setMessage(tr("واجهة الرفع جاهزة، وخدمة التصوّر الخارجي لم تُربط بعد.", "The upload interface is ready, but the external visualization service is not connected yet."));
      return;
    }
    setBusy(true); setMessage(""); setResultUrl("");
    try {
      const form = new FormData();
      form.append("room_photo", roomFile, roomFile.name);
      if (materialFile) form.append("material_photo", materialFile, materialFile.name);
      if (product) {
        form.append("product_id", product.id);
        form.append("product_slug", product.slug);
        form.append("material_url", new URL(product.image, window.location.origin).href);
      }
      form.append("room_type", space);
      form.append("surface", surface);
      form.append("locale", ar ? "ar" : "en");
      const response = await fetch(VISUALIZER_ENDPOINT, { method: "POST", body: form, credentials: "same-origin" });
      if (!response.ok) throw new Error("service_unavailable");
      const data = await response.json().catch(() => ({})) as {result_url?: unknown};
      if (typeof data.result_url === "string") {
        const url = new URL(data.result_url, window.location.origin);
        if (url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost")) setResultUrl(url.href);
      }
      setMessage(tr("تم إرسال الصورة والخامة لخدمة التصوّر.", "Your apartment photo and material were sent to the visualization service."));
    } catch {
      setMessage(tr("تعذر إرسال الصورة. راجع اتصال الخدمة وأعد المحاولة.", "Unable to send the images. Check the service connection and retry."));
    } finally { setBusy(false); }
  }
  const previewBox = { aspectRatio: "4/3", minHeight: 180, background: "var(--idea-surface)",
    border: "1px dashed var(--idea-border)", borderRadius: "var(--idea-radius-lg)",
    overflow: "hidden", display: "grid", placeItems: "center" } as const;
  return <Section style={{ paddingTop: "var(--idea-space-7)" }}>
    <Container style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 26 }}>
        <div className="idea-eyebrow">{tr("تصوّر الخامات", "Material visualization")}</div>
        <h1 className="idea-display">{tr("جرّب المنتج في شقتك", "Try this product in your apartment")}</h1>
        <p style={{ color: "var(--idea-text-muted)" }}>
          {tr("ارفع صورة شقتك واختر أي خامة من المنتجات أو ارفع خامة من جهازك.",
            "Upload your apartment photo and choose any catalogue material, or upload your own material image.")}
        </p>
      </div>
      <div className="idea-apartment-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <h2 style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-lg)" }}>
            {tr("صورة شقتك", "Your apartment photo")}
          </h2>
          <label style={{ ...previewBox, cursor: "pointer" }}>
            {roomPreview
              ? <img src={roomPreview} alt={tr("صورة شقتك", "Your apartment")} style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: 330 }}/>
              : <span style={{ textAlign: "center", color: "var(--idea-text-muted)", padding: 20 }}>
                  <UploadCloud size={34} style={{ display: "block", margin: "0 auto 12px", color: "var(--idea-gold)" }}/>
                  {tr("اضغط لرفع صورة الشقة أو الصالة أو الحمام أو أي غرفة",
                    "Tap to upload your apartment, living room, bathroom or any room")}
                </span>}
            <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e => chooseImage(e.target.files?.[0], "room")}/>
          </label>
          {roomFile && <p style={{ color: "var(--idea-text-muted)", overflowWrap: "anywhere" }}>{roomFile.name}</p>}
        </div>
        <div>
          <h2 style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-lg)" }}>
            {tr("الخامة المختارة", "Selected material")}
          </h2>
          {(product || materialPreview)
            ? <div style={previewBox}>
                <img src={materialPreview || product?.image} alt={tr("صورة الخامة", "Material image")}
                  style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: 330 }}/>
              </div>
            : <div style={previewBox}><ImageIcon size={34} color="var(--idea-gold)"/></div>}
          {product && <p style={{ color: "var(--idea-text)" }}>{product.name[ar ? "ar" : "en"]}</p>}
          <label style={{ cursor: "pointer", color: "var(--idea-gold-bright)", display: "inline-flex",
            alignItems: "center", gap: 8, padding: "10px 0" }}>
            <UploadCloud size={18}/>
            {tr("ارفع أي خامة من جهازك", "Upload any material image")}
            <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e => chooseImage(e.target.files?.[0], "material")}/>
          </label>
          {materialFile && <p style={{ color: "var(--idea-text-muted)", overflowWrap: "anywhere" }}>{materialFile.name}</p>}
          <details style={{ marginTop: 8 }}>
            <summary style={{ color: "var(--idea-gold-bright)", cursor: "pointer" }}>
              {tr("اختار خامة تانية من الموقع", "Choose another material from the catalogue")}
            </summary>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder={tr("ابحث عن الخامة", "Search materials")}
              aria-label={tr("بحث في المنتجات", "Search catalogue")}
              style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 8,
                background: "var(--idea-surface)", color: "var(--idea-text)",
                border: "1px solid var(--idea-border)", margin: "12px 0" }}/>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
              {matches.map(item => <button key={item.id} type="button"
                onClick={() => { setSelectedId(item.id); setMaterialFile(null); setMessage(""); }}
                style={{ border: item.id === selectedId ? "2px solid var(--idea-gold)" : "1px solid var(--idea-border)",
                  background: "var(--idea-surface)", borderRadius: 8, padding: 5, minWidth: 0,
                  color: "var(--idea-text)", cursor: "pointer" }}>
                <img src={item.image} loading="lazy" alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}/>
                <span style={{ fontSize: 11, display: "block", overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name[ar ? "ar" : "en"]}</span>
              </button>)}
            </div>
          </details>
        </div>
      </div>
      <div style={{ marginTop: 24, background: "var(--idea-surface)", padding: 20,
        border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-lg)" }}>
        <div className="idea-apartment-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <label style={{ display: "grid", gap: 8, color: "var(--idea-text-muted)" }}>
            {tr("المكان", "Room")}
            <select value={space} onChange={e => setSpace(e.target.value)}
              style={{ padding: 11, borderRadius: 8, background: "var(--idea-surface-2)",
                color: "var(--idea-text)", border: "1px solid var(--idea-border)" }}>
              <option value="apartment">{tr("شقتك", "Apartment")}</option>
              <option value="living_room">{tr("الصالة", "Living room")}</option>
              <option value="bathroom">{tr("الحمام", "Bathroom")}</option>
              <option value="kitchen">{tr("المطبخ", "Kitchen")}</option>
              <option value="bedroom">{tr("غرفة النوم", "Bedroom")}</option>
              <option value="other">{tr("مكان آخر", "Other")}</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 8, color: "var(--idea-text-muted)" }}>
            {tr("مكان تركيب الخامة", "Apply material to")}
            <select value={surface} onChange={e => setSurface(e.target.value)}
              style={{ padding: 11, borderRadius: 8, background: "var(--idea-surface-2)",
                color: "var(--idea-text)", border: "1px solid var(--idea-border)" }}>
              <option value="auto">{tr("تحديد تلقائي", "Automatic")}</option>
              <option value="floor">{tr("الأرضية", "Floor")}</option>
              <option value="wall">{tr("الحائط", "Wall")}</option>
            </select>
          </label>
        </div>
        <p style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>
          {tr("الصور بتفضل عندك لحد ما تضغط إرسال. إنشاء النتيجة مسؤولية خدمة التصوّر الخارجية.",
            "Images stay on your device until you submit them. The external service handles rendering.")}
        </p>
        {!VISUALIZER_ENDPOINT && <p role="status" style={{ color: "var(--idea-text-muted)" }}>
          {tr("واجهة رفع الصور جاهزة، وفي انتظار ربطها بخدمة التصوّر الخارجية.",
            "The upload screen is ready and awaits the external visualization integration.")}
        </p>}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Button size="lg" disabled={!VISUALIZER_ENDPOINT || !roomFile || (!product && !materialFile) || busy}
            onClick={() => void submit()}><Sparkles size={16}/>
            {busy ? tr("جاري إرسال الصور", "Sending images") : tr("جرّب الخامة في شقتك", "Try the material in your apartment")}
          </Button>
          <Link to="/products" style={{ color: "var(--idea-gold-bright)" }}>
            {tr("رجوع للمنتجات", "Back to products")}
          </Link>
        </div>
        {message && <p role="status" style={{ color: "var(--idea-text)" }}>{message}</p>}
        {resultUrl && <a href={resultUrl} rel="noopener noreferrer" target="_blank"
          style={{ color: "var(--idea-gold-bright)" }}>{tr("عرض النتيجة", "View result")}</a>}
      </div>
    </Container>
    <style>{"@media(max-width:720px){.idea-apartment-grid{grid-template-columns:1fr!important}}"}</style>
  </Section>;
}
