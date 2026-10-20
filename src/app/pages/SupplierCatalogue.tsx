import { useEffect, useState, type FormEvent } from "react";
import { useBackend } from "../backend/db";
import { accountRequest } from "../backend/accountsApi";
import { useStore } from "../store/store";
import { Panel, Field, inputStyle } from "../components/dash";
import { Button } from "../components/ui";
import { useMembershipText } from "./Membership";

export function SupplierCatalogue() {
  const text = useMembershipText(), { session, db } = useBackend();
  const { products } = useStore();
  const [catalogId,setCatalogId] = useState('');
  const [editing,setEditing]=useState<any>(null);
  const company = db.businesses.find(item => item.ownerId === session?.id);
  const [items, setItems] = useState<any[]>([]), [busy, setBusy] = useState(false), [status, setStatus] = useState<"saved" | "error" | null>(null);
  const [values, setValues] = useState({ title: "", brand: "", material: "ceramic", dimensions: "", sku: "", description: "" });
  const [file, setFile] = useState<File | null>(null);
  const publish = async (id: string) => {
    if (!company || busy) return; setBusy(true); setStatus(null);
    try {
      await accountRequest('publish',{id}); await load();
    } catch { setStatus("error"); } finally { setBusy(false); }
  };
  const load = async () => {
    if (!company) return;
    const data = await accountRequest('products'); setItems(data.products || []);
  };
  useEffect(() => { void load().catch(() => setStatus("error")); }, [company?.id]);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!session || !company || busy) return;
    const form = event.currentTarget;
    setBusy(true); setStatus(null);
    try {
      let image = editing?.specifications?.image || '';
      if (file) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10485760) throw new Error("Invalid image");
        const upload=new FormData();upload.append('image',file);image=(await accountRequest('upload',upload)).image;
      }
      await accountRequest('product',{ id:editing?.id, catalog_product_id:catalogId, title: values.title.trim(), sku: values.sku.trim(),
        specifications: { brand: values.brand.trim(), material: values.material, dimensions: values.dimensions.trim(), description: values.description.trim(), image } });
      setValues({ title: "", brand: "", material: "ceramic", dimensions: "", sku: "", description: "" }); setFile(null);
      form.reset();setEditing(null);setCatalogId(''); await load(); setStatus("saved");
    } catch {
      setStatus("error");
    } finally { setBusy(false); }
  };
  if (!company) return <Panel><p>{text("Your company profile is being prepared. Refresh after confirming your email.", "جاري تجهيز ملف شركتك. حدّث الصفحة بعد تأكيد بريدك الإلكتروني.")}</p></Panel>;
  const field = (key: keyof typeof values, label: string, required = false) => <Field label={label}><input aria-label={label} name={key} style={inputStyle} value={values[key]} onChange={event => setValues(old => ({ ...old, [key]: event.target.value }))} required={required} maxLength={key === "description" ? 2000 : 200} /></Field>;
  return <>
    <Panel style={{ marginBottom: 24 }}>
      <h1 className="idea-display" style={{ fontSize: "var(--idea-text-xl)", marginBottom: 12 }}>{text("Your company catalogue", "كتالوج شركتك")}</h1>
      <p style={{ fontSize: "var(--idea-text-sm)", color: "var(--idea-text-muted)", lineHeight: 1.9 }}>{text("Add your own ceramic, porcelain and marble products. New products are saved as drafts for review before publishing.", "أضف منتجاتك من السيراميك والبورسلين والرخام. المنتجات الجديدة بتتحفظ كمسودات للمراجعة قبل النشر.")}</p>
      <form onSubmit={save} style={{ marginTop: 24 }}>
        <Field label={text('Link to an IDEA catalogue product (for matching quotation requests)','ربط بمنتج من كتالوج IDEA (لمطابقة طلبات الأسعار)')}><select style={inputStyle} aria-label={text('Catalogue product','منتج الكتالوج')} value={catalogId} onChange={event=>{
          const id=event.target.value;setCatalogId(id);const product=products.find(p=>p.id===id);if(product)setValues(old=>({...old,title:product.name.en,brand:product.brand,dimensions:product.sizes[0]?.label||'',material:product.collection==='porcelain'?'porcelain':'ceramic'}));
        }}><option value="">{text('Own product / not in catalogue','منتج خاص / غير موجود بالكتالوج')}</option>{products.map(product=><option key={product.id} value={product.id}>{product.name.en} · {product.id}</option>)}</select></Field>
        <div className="idea-signup-fields">
          {field("title", text("Product name", "اسم المنتج"), true)}{field("brand", text("Brand", "العلامة التجارية"), true)}
          <Field label={text("Material", "الخامة")}><select aria-label={text("Material", "الخامة")} style={inputStyle} value={values.material} onChange={event => setValues(old => ({ ...old, material: event.target.value }))}>
            <option value="ceramic">{text("Ceramic", "سيراميك")}</option><option value="porcelain">{text("Porcelain", "بورسلين")}</option><option value="marble">{text("Marble", "رخام")}</option>
          </select></Field>
          {field("dimensions", text("Tile dimensions (cm)", "مقاسات البلاطة (سم)"), true)}{field("sku", text("Product code", "كود المنتج"))}{field("description", text("Product details", "تفاصيل المنتج"))}
        </div>
        <Field label={text("Product photo · JPG, PNG or WebP · up to 10 MB", "صورة المنتج · JPG أو PNG أو WebP · حتى 10 ميجابايت")}><input aria-label={text("Product photo", "صورة المنتج")} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setFile(event.target.files?.[0] || null)} /></Field>
        <Button type="submit" disabled={busy}>{busy ? text("Saving…", "جارٍ الحفظ…") : text("Save product for review", "حفظ المنتج للمراجعة")}</Button>
        {status && <p role="status">{status === "saved" ? text("Product saved as a draft.", "تم حفظ المنتج كمسودة.") : text("We could not save or load your catalogue. Please try again.", "تعذّر حفظ أو تحميل الكتالوج. حاول مرة أخرى.")}</p>}
      </form>
    </Panel>
    <div className="idea-access-grid">{items.map(item => <Panel key={item.id}>
      {item.specifications?.image && <img src={item.specifications.image} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8 }} />}
      <h2 style={{ fontSize: "var(--idea-text-lg)" }}>{item.title}</h2><p>{item.specifications?.brand} · {item.specifications?.dimensions}</p>
      <span>{item.active ? text("Published", "منشور") : text("Draft · awaiting review", "مسودة · في انتظار المراجعة")}</span>
      <Button type="button" variant="outline" disabled={busy} onClick={()=>{setEditing(item);setCatalogId(item.catalog_product_id||'');setFile(null);setValues({title:item.title,sku:item.sku,...item.specifications});window.scrollTo({top:0,behavior:'smooth'});}}>{text('Edit product','تعديل المنتج')}</Button>
      {!item.active && company.status === "Verified" && <Button type="button" style={{ marginTop: 12 }} disabled={busy} onClick={() => void publish(item.id)}>{text("Publish product", "نشر المنتج")}</Button>}
    </Panel>)}</div>
  </>;
}
