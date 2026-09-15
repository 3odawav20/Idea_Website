import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Upload, Ruler, Camera, Save, Layers, Grid3x3, RotateCw, Info, ArrowLeftRight } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { useBackend, type RoomProject } from "../backend/db";
import { Container, Section, SectionHeader, Button } from "../components/ui";
import { Panel, Field, inputStyle, EmptyState } from "../components/dash";

/* ── Landing ─────────────────────────────────────────────────────────────── */
export function RoomDesignerHome() {
  const { t } = useI18n();
  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container style={{ maxWidth: 960 }}>
        <SectionHeader eyebrow="Visualize" title={t("room.title")} sub="Preview real IDEA surfaces on your own room. Two ways to start:" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--idea-space-4)" }} className="idea-room-grid">
          <Panel>
            <Upload size={26} color="var(--idea-gold-bright)" />
            <div className="idea-display" style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-lg)", margin: "10px 0 6px" }}>{t("room.upload")}</div>
            <p style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>Bathroom, kitchen, living room, bedroom, office or façade photo. Apply floor & wall surfaces.</p>
            <Link to="/room-designer/new?mode=photo"><Button style={{ marginTop: 12 }}>Upload a photo</Button></Link>
          </Panel>
          <Panel>
            <Ruler size={26} color="var(--idea-gold-bright)" />
            <div className="idea-display" style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-lg)", margin: "10px 0 6px" }}>{t("room.measured")}</div>
            <p style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>Enter length, width, height, doors and windows in m, cm or mm.</p>
            <Link to="/room-designer/new?mode=measured"><Button variant="outline" style={{ marginTop: 12 }}>Create a room</Button></Link>
          </Panel>
        </div>
        <div style={{ marginTop: "var(--idea-space-5)", display: "flex", gap: 12 }}>
          <Link to="/room-designer/photo-guide"><Button variant="ghost"><Camera size={16} /> {t("room.photoGuide")}</Button></Link>
        </div>
      </Container>
      <style>{`@media (max-width: 720px){ .idea-room-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </Section>
  );
}

/* ── Photo guide ────────────────────────────────────────────────────────── */
export function PhotoGuide() {
  const { t } = useI18n();
  const guides = [
    { title: "General", steps: ["Stand in a corner showing the largest floor area.", "Hold the phone near chest height and keep it level.", "Capture the floor and two connected walls.", "Avoid direct flash and people in frame.", "Include a known measurement reference where possible.", "Take additional angles for accuracy."] },
    { title: "Bathroom", steps: ["Stand near the doorway or a corner.", "Hold the phone near chest height.", "Include the floor and main walls.", "Include sink, bathtub, shower and toilet where possible.", "Take one wide photo, then corner shots."] },
    { title: "Living room", steps: ["Stand in a corner showing the largest floor area.", "Include two connected walls.", "Keep furniture visible for correct occlusion.", "Avoid direct sunlight into the camera.", "Capture more than one angle."] },
    { title: "Kitchen", steps: ["Capture floor, cabinets, backsplash, doors and windows.", "Stand at a doorway or room corner.", "Avoid blocking the floor with close objects.", "Include a known dimension when possible."] },
  ];
  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container style={{ maxWidth: 860 }}>
        <SectionHeader eyebrow={t("room.title")} title={t("room.photoGuide")} sub="A good photo makes surface detection far more accurate." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--idea-space-4)" }} className="idea-room-grid">
          {guides.map((g) => (
            <Panel key={g.title}>
              <div className="idea-display" style={{ color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-lg)", marginBottom: 10 }}>{g.title}</div>
              <ol style={{ margin: 0, paddingInlineStart: 18, color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", display: "flex", flexDirection: "column", gap: 6 }}>
                {g.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </Panel>
          ))}
        </div>
        <p style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", marginTop: "var(--idea-space-5)" }}>We do not claim engineering-level measurement accuracy from a single photograph.</p>
        <div style={{ marginTop: 16 }}><Link to="/room-designer/new?mode=photo"><Button>Start designing</Button></Link></div>
      </Container>
      <style>{`@media (max-width: 720px){ .idea-room-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </Section>
  );
}

/* ── Editor (2D apply-material) ─────────────────────────────────────────── */
type SurfaceId = "floor" | "wallA" | "wallB";
interface Fixture { id: string; label: string; x: number; y: number; }

export function RoomDesignerEditor() {
  const { t, locale } = useI18n();
  const { products, addToQuote } = useStore();
  const { api, session, db } = useBackend();
  const { projectId } = useParams();
  const nav = useNavigate();
  const existing = projectId ? db.roomProjects.find((p) => p.id === projectId) : null;

  const [photo, setPhoto] = useState<string | null>(existing?.photo || null);
  const [dims, setDims] = useState(existing?.dims || { length: 4, width: 3, height: 2.8, unit: "m" as const });
  const [active, setActive] = useState<SurfaceId>("floor");
  const [assign, setAssign] = useState<Record<SurfaceId, string | null>>({
    floor: existing?.surfaces.find((s) => s.id === "floor")?.productId || null,
    wallA: existing?.surfaces.find((s) => s.id === "wallA")?.productId || null,
    wallB: existing?.surfaces.find((s) => s.id === "wallB")?.productId || null,
  });
  const [tile, setTile] = useState(60); // px scale of a tile in preview
  const [grout, setGrout] = useState(2);
  const [groutColor, setGroutColor] = useState("#cfcabf");
  const [rotate, setRotate] = useState(0);
  const [fixtures, setFixtures] = useState<Fixture[]>([{ id: "vanity", label: "Vanity", x: 20, y: 60 }, { id: "bathtub", label: "Bathtub", x: 60, y: 25 }]);
  const [q, setQ] = useState("");
  const [compareBefore, setCompareBefore] = useState(false);
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);

  const gallery = useMemo(() => products.filter((p) => p.image && p.name.en.toLowerCase().includes(q.toLowerCase())).slice(0, 40), [products, q]);
  const surfProduct = (id: SurfaceId) => products.find((p) => p.id === assign[id]);

  const tileStyle = (id: SurfaceId): React.CSSProperties => {
    const p = surfProduct(id);
    if (!p) return { background: "var(--idea-surface-2)" };
    return {
      backgroundImage: `url(${p.image})`,
      backgroundSize: `${tile}px ${tile}px`,
      backgroundRepeat: "repeat",
      transform: `rotate(${rotate}deg)`,
      boxShadow: `inset 0 0 0 ${grout}px ${groutColor}`,
      outline: `${grout}px solid ${groutColor}`,
    };
  };

  const estM2 = (dims.length * dims.width) * (dims.unit === "cm" ? 0.0001 : dims.unit === "mm" ? 0.000001 : 1);

  const save = () => {
    if (!session) { nav("/login"); return; }
    const proj: RoomProject = {
      id: existing?.id || `room_${Math.random().toString(36).slice(2, 8)}`,
      userId: session.id, name: existing?.name || `Room ${new Date().toLocaleDateString()}`,
      createdAt: existing?.createdAt || Date.now(), photo, dims,
      surfaces: (["floor", "wallA", "wallB"] as SurfaceId[]).map((s) => ({ id: s, label: s, productId: assign[s], estM2: s === "floor" ? Math.round(estM2) : Math.round(dims.length * dims.height) })),
    };
    api.saveRoomProject(proj);
    nav("/account/room-projects");
  };

  const addAllToQuote = () => {
    (["floor", "wallA", "wallB"] as SurfaceId[]).forEach((s) => { const p = surfProduct(s); if (p) addToQuote(p.id, "sqm"); });
    nav("/request-quote/new");
  };

  const onDrag = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 100;
    const y = ((e.clientY - box.top) / box.height) * 100;
    setFixtures((fs) => fs.map((f) => f.id === dragRef.current!.id ? { ...f, x: Math.max(0, Math.min(90, x)), y: Math.max(0, Math.min(90, y)) } : f));
  };

  return (
    <Container style={{ padding: "var(--idea-space-6) var(--idea-space-5)" }}>
      <div style={{ display: "flex", gap: "var(--idea-space-5)", alignItems: "flex-start" }} className="idea-editor">
        {/* Material panel */}
        <aside style={{ width: 280, flexShrink: 0 }} className="idea-editor-side">
          <div className="idea-display" style={{ color: "var(--idea-text)", marginBottom: 8 }}><Layers size={16} style={{ verticalAlign: "-2px" }} /> Materials</div>
          <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Search catalogue…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, maxHeight: 420, overflowY: "auto" }}>
            {gallery.map((p) => (
              <button key={p.id} onClick={() => setAssign((a) => ({ ...a, [active]: p.id }))} title={p.name[locale]} style={{
                border: assign[active] === p.id ? "2px solid var(--idea-gold)" : "var(--idea-hairline)", borderRadius: "var(--idea-radius-sm)",
                overflow: "hidden", cursor: "pointer", background: "var(--idea-surface-2)", padding: 0,
              }}>
                <img src={p.image} alt={p.name[locale]} style={{ width: "100%", height: 60, objectFit: "cover", display: "block" }} />
                <div style={{ fontSize: 10, color: "var(--idea-text-muted)", padding: "3px 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name[locale]}</div>
              </button>
            ))}
          </div>
        </aside>

        {/* Stage */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {(["floor", "wallA", "wallB"] as SurfaceId[]).map((s) => (
              <button key={s} onClick={() => setActive(s)} style={{
                padding: "6px 14px", borderRadius: "var(--idea-radius-full)", cursor: "pointer", textTransform: "capitalize", fontSize: "var(--idea-text-sm)",
                border: `1px solid ${active === s ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`,
                background: active === s ? "var(--idea-gold-soft)" : "transparent", color: active === s ? "var(--idea-gold-bright)" : "var(--idea-text-muted)",
              }}>{s === "wallA" ? "Wall A" : s === "wallB" ? "Wall B" : "Floor"}</button>
            ))}
            <label style={{ marginInlineStart: "auto", display: "inline-flex" }}>
              <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)); }} />
              <span style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-sm)" }}><Upload size={15} /> Photo</span>
            </label>
          </div>

          {/* Perspective room box */}
          <div onMouseMove={onDrag} onMouseUp={() => (dragRef.current = null)} onMouseLeave={() => (dragRef.current = null)}
            style={{ position: "relative", aspectRatio: "16/10", borderRadius: "var(--idea-radius-lg)", overflow: "hidden", border: "var(--idea-hairline)", background: "var(--idea-bg-2)", perspective: "900px" }}>
            {photo && <img src={photo} alt="Room" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: compareBefore ? 1 : 0.28 }} />}
            {!compareBefore && <>
              {/* Wall B (left) */}
              <div onClick={() => setActive("wallB")} style={{ position: "absolute", top: 0, left: 0, width: "34%", height: "66%", transformOrigin: "left center", transform: "rotateY(28deg)", ...tileStyle("wallB"), cursor: "pointer", borderInlineEnd: active === "wallB" ? "2px solid var(--idea-gold)" : undefined }} />
              {/* Wall A (back) */}
              <div onClick={() => setActive("wallA")} style={{ position: "absolute", top: 0, left: "34%", width: "66%", height: "66%", ...tileStyle("wallA"), cursor: "pointer", outline: active === "wallA" ? "2px solid var(--idea-gold)" : undefined }} />
              {/* Floor */}
              <div onClick={() => setActive("floor")} style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "40%", transformOrigin: "bottom", transform: "rotateX(52deg)", ...tileStyle("floor"), cursor: "pointer", outline: active === "floor" ? "2px solid var(--idea-gold)" : undefined }} />
              {/* Movable fixtures */}
              {fixtures.map((f) => (
                <div key={f.id} onMouseDown={() => (dragRef.current = { id: f.id, ox: 0, oy: 0 })} style={{
                  position: "absolute", left: `${f.x}%`, top: `${f.y}%`, cursor: "grab", userSelect: "none",
                  background: "var(--idea-overlay)", border: "1px solid var(--idea-gold)", color: "var(--idea-text)",
                  borderRadius: "var(--idea-radius-sm)", padding: "4px 10px", fontSize: "var(--idea-text-xs)", backdropFilter: "blur(4px)",
                }}>{f.label}</div>
              ))}
            </>}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <Button size="sm" variant="ghost" onClick={() => setCompareBefore((v) => !v)}><ArrowLeftRight size={14} /> {compareBefore ? "After" : "Before"}</Button>
            <Button size="sm" onClick={save}><Save size={14} /> Save project</Button>
            <Button size="sm" variant="outline" onClick={addAllToQuote}>Add surfaces to quote</Button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "10px 14px", background: "var(--idea-gold-soft)", border: "1px solid var(--idea-gold)", borderRadius: "var(--idea-radius-md)", color: "var(--idea-text)", fontSize: "var(--idea-text-xs)" }}>
            <Info size={16} color="var(--idea-gold-bright)" style={{ flexShrink: 0 }} /> {t("room.aiNote")}
          </div>
        </div>

        {/* Controls */}
        <aside style={{ width: 240, flexShrink: 0 }} className="idea-editor-side">
          <div className="idea-display" style={{ color: "var(--idea-text)", marginBottom: 10 }}><Grid3x3 size={16} style={{ verticalAlign: "-2px" }} /> {active === "floor" ? "Floor" : active === "wallA" ? "Wall A" : "Wall B"} controls</div>
          <Field label={`Tile scale (${tile}px)`}><input type="range" min={24} max={120} value={tile} onChange={(e) => setTile(Number(e.target.value))} style={{ width: "100%" }} /></Field>
          <Field label={`Grout width (${grout}px)`}><input type="range" min={0} max={8} value={grout} onChange={(e) => setGrout(Number(e.target.value))} style={{ width: "100%" }} /></Field>
          <Field label="Grout color"><input type="color" value={groutColor} onChange={(e) => setGroutColor(e.target.value)} style={{ width: "100%", height: 34, background: "none", border: "none" }} /></Field>
          <Button size="sm" variant="ghost" onClick={() => setRotate((r) => (r + 45) % 360)}><RotateCw size={14} /> Rotate {rotate}°</Button>

          <div className="idea-display" style={{ color: "var(--idea-text)", margin: "18px 0 8px" }}><Ruler size={16} style={{ verticalAlign: "-2px" }} /> Room</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Field label="Length"><input type="number" style={inputStyle} value={dims.length} onChange={(e) => setDims({ ...dims, length: Number(e.target.value) })} /></Field>
            <Field label="Width"><input type="number" style={inputStyle} value={dims.width} onChange={(e) => setDims({ ...dims, width: Number(e.target.value) })} /></Field>
            <Field label="Height"><input type="number" style={inputStyle} value={dims.height} onChange={(e) => setDims({ ...dims, height: Number(e.target.value) })} /></Field>
            <Field label="Unit"><select style={inputStyle} value={dims.unit} onChange={(e) => setDims({ ...dims, unit: e.target.value as "m" | "cm" | "mm" })}><option value="m">m</option><option value="cm">cm</option><option value="mm">mm</option></select></Field>
          </div>
          <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>Estimated floor area ≈ <strong style={{ color: "var(--idea-gold-bright)" }}>{estM2.toFixed(1)} m²</strong> (estimate until confirmed)</div>
        </aside>
      </div>
      <p style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", marginTop: 16 }}>
        Real-time surface detection & photorealistic 3D relighting require a server-side vision model and are not enabled in this frontend build (see report). This 2D preview applies real catalogue textures with correct grout/scale.
      </p>
      <style>{`@media (max-width: 1040px){ .idea-editor{ flex-direction: column !important; } .idea-editor-side{ width: 100% !important; } }`}</style>
    </Container>
  );
}

export function RoomProjectMissing() { return <Container style={{ padding: "var(--idea-space-8)" }}><EmptyState title="Project not found" /></Container>; }
