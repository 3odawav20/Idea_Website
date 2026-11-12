from pathlib import Path
import re
p=Path(__file__).resolve().parents[2]/"src/app/pages/AiVisualizerStudio.tsx"
s=p.read_text(encoding="utf-8")
assert "selectedProduct?.sizes[0]?.label || tileSize" in s
s=s.replace('const [tileSize, setTileSize] = useState("60 x 60 cm");','const [tileSize, setTileSize] = useState("");',1)
needle='  const selectedFaces = useMemo(() => selectedProduct ? materialFaces(selectedProduct) : [], [selectedProduct]);'
assert needle in s
s=s.replace(needle,needle+'''
  // Never offer an arbitrary default; only use dimensions recorded for this product variant.
  const physicalSizes = (selectedProduct?.sizes || []).filter((size) =>
    Number.isFinite(size.widthMm) && Number.isFinite(size.heightMm) &&
    Number(size.widthMm) >= 50 && Number(size.heightMm) >= 50 &&
    Number(size.widthMm) <= 3200 && Number(size.heightMm) <= 3200
  );
  const selectedPhysicalSize = physicalSizes.find((size) => size.id === tileSize) || physicalSizes[0] || null;
''',1)
needle='    if (quota && !quota.unlimited && quota.remaining === 0) {'
assert needle in s
s=s.replace(needle,'''    if (!selectedPhysicalSize) {
      setError(tr("مقاس البلاطة غير موثق لهذا المنتج. يجب إضافة المقاس الحقيقي قبل التوليد.",
                  "This product has no verified physical tile dimensions. Add an actual size before generating."));
      return;
    }
'''+needle,1)
s=s.replace('form.append("tileSize", selectedProduct.sizes[0]?.label || tileSize);', '''form.append("tileSize", selectedPhysicalSize.label);
       form.append("tile_width_mm", String(selectedPhysicalSize.widthMm));
       form.append("tile_height_mm", String(selectedPhysicalSize.heightMm));
       form.append("variant_id", selectedPhysicalSize.id);''',1)
s=s.replace('    setFaceIndex(0);\n    setResult(null);','    setFaceIndex(0);\n    setTileSize("");\n    setResult(null);',1)
pattern=r'<select value=\{selectedProduct\?\.sizes\[0\]\?\.label \|\| tileSize\}.*?</select>'
replacement='''<select value={selectedPhysicalSize?.id || ""} onChange={(event) => setTileSize(event.target.value)} disabled={physicalSizes.length <= 1}>
               {physicalSizes.length ? physicalSizes.map((size) => (
                 <option value={size.id} key={size.id}>
                   {String(Number(size.widthMm) / 10) + " × " + String(Number(size.heightMm) / 10) + " cm"}
                 </option>
               )) : <option value="">{tr("المقاس غير متوفر", "Size unavailable")}</option>}
             </select>
             <small className="idea-studio-size-note">{tr("المقاس من بيانات المنتج. القياس داخل الغرفة تقريبي دون مرجع معايرة معروف.",
               "Dimensions come from this product. In-room scale remains approximate without a measured reference.")}</small>'''
s,n=re.subn(pattern,replacement,s,flags=re.S)
assert n==1,f"Could not replace size control: {n}"
s=s.replace('disabled={busy || !photo || !selectedProduct || (!selectedFaceImage && !material) ||', 'disabled={busy || !photo || !selectedProduct || !selectedPhysicalSize || (!selectedFaceImage && !material) ||',1)
s,n=re.subn(r'tr\("([^"\\]|\\.)*"\s*,\s*"Reference scale"\)', 'tr("المقاس الحقيقي للبلاطة", "Actual tile size")',s)
assert n==1,f"Label replacement count {n}"
p.write_text(s,encoding="utf-8")
print("TILE_SIZES_LOCKED",p)
