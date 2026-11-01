import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowLeft, ArrowRight, ArrowLeftRight, Camera, Check, ChevronDown, CircleHelp,
  Download, Home, Image as Picture, Layers3, Loader2, RotateCcw, Search,
  Settings2, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, UploadCloud, X
} from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { useBackend } from "../backend/db";
import { requireSupabase } from "../backend/supabaseClient";
import type { Product } from "../data/types";
import "./AiRoomStudio.css";

type Choice = "floor" | "wall";
type Lang = "ar" | "en" | "fr";
const words = {
  eyebrow:{en:"IDEA MATERIAL STUDIO",ar:"استوديو خامات آيديا",fr:"STUDIO DES MATÉRIAUX IDEA"},
  title1:{en:"See your space.",ar:"شوف مساحتك",fr:"Voyez votre espace."},
  title2:{en:"In a new light.",ar:"بشكل جديد.",fr:"Sous un autre jour."},
  subtitle:{en:"Plan with your real room photo and genuine IDEA catalogue materials.",ar:"صمّم على صورة غرفتك الحقيقية بخامات موجودة في كتالوج آيديا.",fr:"Imaginez votre pièce avec une vraie photo et des matériaux du catalogue."},
  back:{en:"Back to home",ar:"العودة للرئيسية",fr:"Retour à l'accueil"},
  library:{en:"Material library",ar:"مكتبة الخامات",fr:"Bibliothèque des matériaux"},
  side:{en:"Your chosen finish",ar:"الخامة المختارة",fr:"Votre finition"},
  choose:{en:"Choose a material below",ar:"اختار خامة من المكتبة",fr:"Choisissez un matériau"},
  brand:{en:"Brand",ar:"الماركة",fr:"Marque"},
  size:{en:"Size",ar:"المقاس",fr:"Taille"},
  type:{en:"Material",ar:"نوع الخامة",fr:"Matériau"},
  original:{en:"Your original photo",ar:"صورة غرفتك الأصلية",fr:"Votre photo originale"},
  upload:{en:"Upload your room photo",ar:"ارفع صورة غرفتك",fr:"Importer la photo de votre pièce"},
  uploadDesc:{en:"JPG, PNG or WebP · up to 10 MB",ar:"صورة بصيغة JPG أو PNG أو WebP بحد أقصى ١٠ ميجابايت",fr:"JPG, PNG ou WebP · 10 Mo maximum"},
  replace:{en:"Change photo",ar:"تغيير الصورة",fr:"Changer la photo"},
  noPhoto:{en:"Start with a real photo of your room",ar:"ابدأ بصورة حقيقية للغرفة",fr:"Commencez avec une photo"},
  noPhotoHint:{en:"Your room's furniture, windows and geometry are preserved in the AI editing instructions.",ar:"تعليمات التعديل تحافظ على الأثاث والشبابيك وشكل الغرفة.",fr:"L'IA devra préserver meubles et architecture."},
  control:{en:"Design controls",ar:"أدوات التصميم",fr:"Réglages"},
  uploadStep:{en:"1 · Your space",ar:"١ · صورتك",fr:"1 · Votre pièce"},
  surfaceStep:{en:"2 · Target surface",ar:"٢ · السطح المطلوب",fr:"2 · Surface"},
  settingsStep:{en:"3 · Installation",ar:"٣ · تفاصيل التركيب",fr:"3 · Pose"},
  floor:{en:"Floor",ar:"الأرضية",fr:"Sol"},
  wall:{en:"Walls",ar:"الحوائط",fr:"Murs"},
  tileSize:{en:"Tile size",ar:"مقاس البلاطة",fr:"Taille du carreau"},
  grout:{en:"Grout width",ar:"عرض الفواصل",fr:"Largeur des joints"},
  angle:{en:"Tile rotation",ar:"زاوية التركيب",fr:"Rotation"},
  shade:{en:"Grout shade",ar:"لون الفواصل",fr:"Teinte des joints"},
  before:{en:"Original",ar:"الأصل",fr:"Original"},
  after:{en:"AI result",ar:"نتيجة الذكاء الاصطناعي",fr:"Résultat IA"},
  waiting:{en:"Awaiting Gemini API connection",ar:"في انتظار توصيل واجهة جيميني",fr:"Connexion Gemini en attente"},
  waitingDesc:{en:"The studio is ready. Photorealistic rendering is not active until the secure backend and Gemini API key are configured.",ar:"الاستوديو جاهز. التوليد الواقعي مش هيتفعل إلا بعد تجهيز الخادم وإضافة مفتاح جيميني بأمان.",fr:"Le rendu photoréaliste attend le serveur sécurisé et la clé Gemini."},
  create:{en:"Generate realistic preview",ar:"أنشئ معاينة واقعية",fr:"Générer l'aperçu"},
  signIn:{en:"Sign in to render",ar:"سجّل دخولك للتوليد",fr:"Connectez-vous"},
  saved:{en:"Download result",ar:"حمّل النتيجة",fr:"Télécharger"},
  close:{en:"Close",ar:"إغلاق",fr:"Fermer"},
  search:{en:"Search real catalogue products",ar:"ابحث في منتجات الكتالوج",fr:"Rechercher les produits"},
  count:{en:"catalogue materials",ar:"خامة من الكتالوج",fr:"matériaux"},
  all:{en:"All",ar:"الكل",fr:"Tous"},
  ceramic:{en:"Ceramic",ar:"سيراميك",fr:"Céramique"},
  porcelain:{en:"Porcelain",ar:"بورسلين",fr:"Grès cérame"},
  live:{en:"Real catalogue products · no simulated renders",ar:"منتجات حقيقية · بدون نتائج توليد وهمية",fr:"Produits réels · pas d'images simulées"},
  quote:{en:"Request material pricing",ar:"اطلب سعر الخامة",fr:"Demander le prix"},
  tip:{en:"AI generation may vary; confirm exact tile dimensions and colours with the supplier.",ar:"نتيجة الذكاء الاصطناعي تقديرية؛ تأكد من مقاس ولون البلاطة الفعلي عند المورد.",fr:"Confirmez les tailles et couleurs auprès du fournisseur."},
  reset:{en:"Reset design",ar:"إعادة ضبط التصميم",fr:"Réinitialiser"},
  save:{en:"Your source image stays in this tab until you request a render.",ar:"صورة غرفتك بتفضل في الصفحة لحد ما تطلب التوليد.",fr:"Votre photo reste ici avant le lancement du rendu."},
  errorType:{en:"Choose a valid JPG, PNG or WebP image.",ar:"اختار صورة صحيحة بصيغة JPG أو PNG أو WebP.",fr:"Choisissez une image valide."},
  errorSize:{en:"Image exceeds the 10 MB size limit.",ar:"حجم الصورة أكبر من ١٠ ميجابايت.",fr:"Image supérieure à 10 Mo."},
  errorPhoto:{en:"Upload your room photo first.",ar:"ارفع صورة الغرفة الأول.",fr:"Importez votre photo."},
  errorMaterial:{en:"Select a material first.",ar:"اختار خامة الأول.",fr:"Sélectionnez un matériau."},
  errorService:{en:"The rendering service is not ready yet. Your image has not been generated.",ar:"خدمة التوليد لسه مش جاهزة، وما اتعملتش صورة جديدة.",fr:"Le service de rendu n'est pas prêt."},
};
function f(key:keyof typeof words,lang:Lang){return words[key][lang];}
function isProductUsable(p:Product){return p.approved && Boolean(p.image) && (p.collection==="ceramics"||p.collection==="porcelain");}
function sourceImage(url:string){return /^https:\/\//i.test(url) || url.startsWith("/images/");}
function readFile(file:File):Promise<string>{
 return new Promise((resolve,reject)=>{const rd=new FileReader();rd.onload=()=>resolve(String(rd.result));rd.onerror=reject;rd.readAsDataURL(file);});
}
const gradients=["#30363c","#eeeeeb","#b5a49b"];
export function AiRoomStudio(){
 const {locale}=useI18n();const lang=locale as Lang;
 const {products,addToQuote}=useStore();const {session}=useBackend();
 const [params]=useSearchParams();
 const inputRef=useRef<HTMLInputElement>(null);
 const [photo,setPhoto]=useState<string | null>(null);
 const [photoMime,setPhotoMime]=useState("");
 const [selected,setSelected]=useState<string|null>(null);
 const [area,setArea]=useState<Choice>("floor");
 const [tileSize,setTileSize]=useState("");
 const [grout,setGrout]=useState(2);
 const [angle,setAngle]=useState(0);
 const [shade,setShade]=useState(1);
 const [query,setQuery]=useState("");
 const [kind,setKind]=useState("all");
 const [result,setResult]=useState<string|null>(null);
 const [showOriginal,setShowOriginal]=useState(false);
 const [error,setError]=useState("");
 const [pending,setPending]=useState(false);
 const [showReady,setShowReady]=useState(false);
 const available=useMemo(()=>products.filter(isProductUsable),[products]);
 const picked=available.find(p=>p.id===selected)||null;
 const shown=useMemo(()=>available.filter(p=>{
  if(kind!=="all"&&p.collection!==kind)return false;
  const q=query.trim().toLocaleLowerCase();
  return !q||[p.name.en,p.name.ar,p.brand,p.model,p.code||""].some(v=>v?.toLocaleLowerCase().includes(q));
 }).slice(0,80),[available,query,kind]);
 useEffect(()=>{
  const productId=params.get("product");
  if(!productId)return;
  const found=available.find(p=>p.id===productId||p.slug===productId);
  if(found)setSelected(found.id);
 },[params,available]);
 useEffect(()=>{
  if(picked?.sizes?.length)setTileSize(picked.sizes[0].label);
  else setTileSize("");
  setResult(null);
 },[picked?.id]);
 const loadPhoto=async(file?:File)=>{
  if(!file)return;
  setError("");
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setError(f("errorType",lang));return;}
  if(file.size>10*1024*1024){setError(f("errorSize",lang));return;}
  try{
   const data=await readFile(file);
   // Verify actual image decode before committing to stage.
   const img=new Image();img.src=data;await img.decode();
   if(img.width<512||img.height<384){setError(f("errorType",lang));return;}
   setPhoto(data);setPhotoMime(file.type);setResult(null);setShowOriginal(false);
  }catch{setError(f("errorType",lang));}
 };
 const reset=()=>{setSelected(null);setPhoto(null);setPhotoMime("");setAngle(0);setGrout(2);setShade(1);setError("");setResult(null);setShowReady(false);};
 const generate=async()=>{
  if(!photo){setError(f("errorPhoto",lang));return;}
  if(!picked){setError(f("errorMaterial",lang));return;}
  if(!session){setShowReady(true);setError(f("signIn",lang));return;}
  setPending(true);setError("");
  try{
   const {data,error:invokeError}=await requireSupabase().functions.invoke("ai-room-render",{
    body:{roomImage:photo,productImage:picked.image,target:area,tileSize,groutMm:grout,rotation:angle,groutColor:gradients[shade],productId:picked.id}
   });
   if(invokeError)throw invokeError;
   if(!data?.image||typeof data.image!=="string"||!data.image.startsWith("data:image/"))throw Error("NO_RENDERED_IMAGE");
   setResult(data.image);setShowOriginal(false);setShowReady(false);
  }catch{
   setError(f("errorService",lang));setShowReady(true);
  }finally{setPending(false);}
 };
 const download=()=>{
  if(!result)return;
  const a=document.createElement("a");a.href=result;a.download="idea-room-preview.png";a.click();
 };
 const quote=()=>{if(!picked)return;addToQuote(picked.id,"sqm");};
 return <main className="idea-studio" dir={locale==="ar"?"rtl":"ltr"}>
  <div className="idea-studio-top"><div className="idea-studio-intro"><div className="idea-studio-breadcrumb"><Link to="/"><Home size={13}/>{f("back",lang)}</Link><span> / </span><span>{f("eyebrow",lang)}</span></div><p className="idea-studio-eyebrow">{f("eyebrow",lang)}</p><h1>{f("title1",lang)} <span>{f("title2",lang)}</span></h1><p>{f("subtitle",lang)}</p></div>
   <Link className="idea-studio-home" to="/"><ArrowLeft size={16}/>{f("back",lang)}</Link>
  </div>
  <div className="idea-studio-workspace">
   <aside className="idea-studio-chosen">
    <div className="idea-studio-panel-head"><span className="idea-studio-kicker">{f("side",lang)}</span><Layers3 size={17}/></div>
    {picked?<><div className="idea-studio-material-large"><img src={picked.image} alt={picked.name[locale]}/></div><h2>{picked.name[locale]||picked.name.en}</h2><p className="idea-studio-brand">{picked.brand}</p>
       <div className="idea-studio-spec"><span>{f("type",lang)}</span><b>{f(picked.collection==="porcelain"?"porcelain":"ceramic",lang)}</b></div><div className="idea-studio-spec"><span>{f("size",lang)}</span><b dir="ltr">{picked.sizes.map(s=>s.label).join(", ")||"—"}</b></div><div className="idea-studio-spec"><span>{f("brand",lang)}</span><b>{picked.brand}</b></div>
       <button className="idea-studio-quote" onClick={quote}><ShoppingBag size={16}/>{f("quote",lang)}</button>
       <Link className="idea-studio-view-product" to={"/product/"+picked.slug}>{lang==="ar"?"عرض تفاصيل المنتج":lang==="fr"?"Voir le produit":"Open product page"} <ArrowRight size={14}/></Link>
      </>:<><div className="idea-studio-chosen-empty"><Layers3 size={28}/><span>{f("choose",lang)}</span></div><p className="idea-studio-helper">{f("live",lang)}</p></>}
    <div className="idea-studio-privacy"><ShieldCheck size={16}/>{f("save",lang)}</div>
   </aside>
   <section className="idea-studio-stage">
     <div className="idea-studio-stage-head"><div><span className="idea-studio-kicker">{f("original",lang)}</span><span className="idea-studio-stage-chip"><span/>{f("waiting",lang)}</span></div><div className="idea-studio-stage-actions"><button onClick={reset} title={f("reset",lang)} aria-label={f("reset",lang)}><RotateCcw size={15}/></button><button disabled={!result} onClick={()=>setShowOriginal(v=>!v)} title={f("before",lang)} aria-label={f("before",lang)}><ArrowLeftRight size={15}/></button><button disabled={!result} onClick={download} title={f("saved",lang)} aria-label={f("saved",lang)}><Download size={15}/></button></div></div>
     <div className={"idea-studio-canvas"+(photo?" has-photo":"")}>
       {photo?<img src={showOriginal||!result?photo:result} alt={showOriginal||!result?f("original",lang):f("after",lang)}/>:<div className="idea-studio-upload-empty"><div className="idea-studio-empty-glow"><Camera size={42}/></div><h2>{f("noPhoto",lang)}</h2><p>{f("noPhotoHint",lang)}</p><button onClick={()=>inputRef.current?.click()}><UploadCloud size={17}/>{f("upload",lang)}</button></div>}
       {photo&&<div className="idea-studio-photo-badge"><Picture size={14}/>{result&&!showOriginal?f("after",lang):f("before",lang)}</div>}
     </div>
     <div className="idea-studio-stage-footer"><span><ShieldCheck size={14}/>{f("live",lang)}</span><span>{f("tip",lang)}</span></div>
     <div className="idea-studio-library">
      <div className="idea-studio-library-head"><div><span className="idea-studio-kicker">{f("library",lang)}</span><h2>{lang==="ar"?"كل خامة ولها حكاية":lang==="fr"?"Une matière pour chaque espace":"Find your perfect finish"}</h2></div><small>{shown.length} {f("count",lang)}</small></div>
      <div className="idea-studio-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={f("search",lang)} aria-label={f("search",lang)}/><select value={kind} onChange={e=>setKind(e.target.value)} aria-label={f("type",lang)}><option value="all">{f("all",lang)}</option><option value="ceramics">{f("ceramic",lang)}</option><option value="porcelain">{f("porcelain",lang)}</option></select></div>
      <div className="idea-studio-products">{shown.map(p=><button key={p.id} className={"idea-studio-product"+(selected===p.id?" is-selected":"")} onClick={()=>{setSelected(p.id);setError("");}}><span className="idea-studio-product-image"><img loading="lazy" src={p.image} alt={p.name[locale]}/>{selected===p.id&&<i><Check size={14}/></i>}</span><span className="idea-studio-product-title">{p.name[locale]||p.name.en}</span><small>{p.brand}</small></button>)}</div>
      {!shown.length&&<p className="idea-studio-empty-results">{lang==="ar"?"لا توجد خامات تطابق البحث":lang==="fr"?"Aucun matériau trouvé":"No materials found"}</p>}
     </div>
   </section>
   <aside className="idea-studio-controls">
    <div className="idea-studio-panel-head"><span className="idea-studio-kicker">{f("control",lang)}</span><SlidersHorizontal size={17}/></div>
    <div className="idea-studio-setting"><h3><span>01</span>{f("uploadStep",lang)}</h3><button className="idea-studio-upload" onClick={()=>inputRef.current?.click()}><UploadCloud size={25}/><strong>{photo?f("replace",lang):f("upload",lang)}</strong><small>{f("uploadDesc",lang)}</small></button><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>void loadPhoto(e.target.files?.[0])}/></div>
    <div className="idea-studio-setting"><h3><span>02</span>{f("surfaceStep",lang)}</h3><div className="idea-studio-choice"><button aria-pressed={area==="floor"} onClick={()=>{setArea("floor");setResult(null)}}><Layers3 size={17}/>{f("floor",lang)}</button><button aria-pressed={area==="wall"} onClick={()=>{setArea("wall");setResult(null)}}><Settings2 size={17}/>{f("wall",lang)}</button></div></div>
    <div className="idea-studio-setting"><h3><span>03</span>{f("settingsStep",lang)}</h3><label className="idea-studio-field">{f("tileSize",lang)}<select value={tileSize} onChange={e=>setTileSize(e.target.value)} disabled={!picked?.sizes.length}><option value="">{lang==="ar"?"غير متاح":lang==="fr"?"Indisponible":"Not provided"}</option>{picked?.sizes.map(s=><option key={s.id} value={s.label}>{s.label}</option>)}</select></label>
       <label className="idea-studio-field">{f("grout",lang)}<span className="idea-studio-range-title"><input type="range" min="0" max="8" step="1" value={grout} onChange={e=>setGrout(Number(e.target.value))}/><b>{grout} mm</b></span></label>
       <label className="idea-studio-field">{f("angle",lang)}<span className="idea-studio-range-title"><input type="range" min="0" max="180" step="45" value={angle} onChange={e=>setAngle(Number(e.target.value))}/><b>{angle}°</b></span></label>
       <div className="idea-studio-field">{f("shade",lang)}<div className="idea-studio-colors">{gradients.map((c,i)=><button key={c} className={i===shade?"active":""} style={{background:c}} aria-label={f("shade",lang)+" "+(i+1)} aria-pressed={i===shade} onClick={()=>setShade(i)}/>)}</div></div>
    </div>
    {error&&<p className="idea-studio-error" role="alert">{error}</p>}
    <div className="idea-studio-render"><div><Sparkles size={19}/><span>{f("waiting",lang)}</span></div><p>{f("waitingDesc",lang)}</p><button disabled={pending||!photo||!picked} onClick={()=>void generate()}>{pending?<Loader2 size={17} className="idea-studio-spin"/>:<Sparkles size={17}/>} {f("create",lang)}</button>{!session&&<Link to="/login">{f("signIn",lang)} <ArrowRight size={13}/></Link>}</div>
    {showReady&&<div className="idea-studio-notice"><CircleHelp size={18}/>{f("waitingDesc",lang)}<button onClick={()=>setShowReady(false)} aria-label={f("close",lang)}><X size={14}/></button></div>}
   </aside>
  </div>
 </main>;
}
