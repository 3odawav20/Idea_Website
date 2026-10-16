import { useState, useRef, useEffect, useMemo } from "react";
import {
  Layers3,
  ArrowUpLeft,
  ImagePlus,
  Check,
  ChevronDown,
  Download,
  Bookmark,
  RotateCcw,
  MoveHorizontal,
  Sparkles,
  SlidersHorizontal,
  Plus,
  ArrowLeft,
  Expand,
  X,
  FolderHeart,
  Grid2X2,
  MousePointer2,
  LoaderCircle,
  Cloud,
  Info,
} from "lucide-react";
import { readUpload, renderMaterial, imageData } from "./render";
import { firebaseConfigured, getUser, saveDesign } from "./firebase";
import { listLocalDesigns, saveLocalDesign } from "./designStore";
const base = `${import.meta.env.BASE_URL}ceramic-studio/`;
const catalog = [
  {
    id: "ivory",
    name: "ترافرتين عاجي",
    kind: "حجر طبيعي",
    tone: "فاتح",
    src: `${base}materials/ivory.svg`,
  },
  {
    id: "marble",
    name: "كالاكاتا وايت",
    kind: "رخامي",
    tone: "فاتح",
    src: `${base}materials/marble.svg`,
  },
  {
    id: "sand",
    name: "بيج رملي",
    kind: "مطفي",
    tone: "دافئ",
    src: `${base}materials/sand.svg`,
  },
  {
    id: "dark",
    name: "أرماني جراي",
    kind: "رخامي",
    tone: "داكن",
    src: `${base}materials/dark.svg`,
  },
  {
    id: "terra",
    name: "تيراكوتا",
    kind: "مطفي",
    tone: "دافئ",
    src: `${base}materials/terra.svg`,
  },
  {
    id: "sage",
    name: "سيج جرين",
    kind: "مطفي",
    tone: "هادئ",
    src: `${base}materials/sage.svg`,
  },
];
const floor = [
    [0.07, 0.81],
    [0.73, 0.81],
    [0.82, 1],
    [0, 1],
  ],
  wall = [
    [0.11, 0.07],
    [0.475, 0.07],
    [0.475, 0.8],
    [0.11, 0.8],
  ];
function UploadBox({ onFile, children, className = "" }) {
  const input = useRef();
  return (
    <div
      className={`upload-box ${className}`}
      role="button"
      tabIndex={0}
      onClick={() => input.current.click()}
      onKeyDown={(e) => {
        if (["Enter", " "].includes(e.key)) {
          e.preventDefault();
          input.current.click();
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onFile(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          onFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
      {children}
    </div>
  );
}
export default function CeramicStudio({
  materialOptions = [],
  initialMaterialId = null,
  authenticate = null,
  generationDisabled = false,
  onRequestQuote = null,
}) {
  const [room, setRoom] = useState(`${base}room.png`),
    [materials, setMaterials] = useState(catalog),
    [selected, setSelected] = useState(catalog[0]),
    [filter, setFilter] = useState("كتالوج IDEA"),
    [search, setSearch] = useState(""),
    [visibleCount, setVisibleCount] = useState(12),
    [roomType, setRoomType] = useState("غرفة معيشة"),
    [roomAspect, setRoomAspect] = useState(16 / 9),
    [surface, setSurface] = useState("الأرضية"),
    [size, setSize] = useState("60 × 60"),
    [angle, setAngle] = useState(0),
    [grout, setGrout] = useState("#d8d1c5"),
    [result, setResult] = useState(null),
    [showMask, setShowMask] = useState(false),
    [split, setSplit] = useState(50),
    [busy, setBusy] = useState(false),
    [autoApply, setAutoApply] = useState(true),
    [notice, setNotice] = useState(""),
    [points, setPoints] = useState(floor),
    [manualSelection, setManualSelection] = useState(false),
    [editing, setEditing] = useState(false),
    [newPoints, setNewPoints] = useState([]),
    [modal, setModal] = useState(null),
    [saved, setSaved] = useState([]),
    [mode, setMode] = useState("ai");
  const initialSelectionApplied = useRef(false);
  useEffect(() => {
    let active = true;
    listLocalDesigns()
      .then((items) => {
        if (active) setSaved(items);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    setMaterials((current) => [
      ...current.filter((m) => !m.product),
      ...materialOptions,
    ]);
    const initial =
      materialOptions.find((m) => m.id === initialMaterialId) ||
      (!initialMaterialId ? materialOptions[0] : null);
    // Async catalogue overrides must not reset the customer's active design.
    if (initial && !initialSelectionApplied.current) {
      initialSelectionApplied.current = true;
      setSelected(initial);
      setResult(null);
    }
  }, [materialOptions, initialMaterialId]);
  const visibleMaterials = useMemo(
    () =>
      materials.filter(
        (m) =>
          (filter === "الكل" ||
            (filter === "كتالوج IDEA"
              ? m.product
              : filter === "توضيحية"
                ? !m.product && m.kind !== "خامتي الخاصة"
                : m.category === filter || m.kind === filter)) &&
          (!search ||
            (m.name + " " + m.tone)
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [materials, filter, search],
  );
  useEffect(() => {
    if (selected.tileSize) setSize(selected.tileSize);
  }, [selected.id, selected.tileSize]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    const key = (e) => {
      if (e.key === "Escape") setModal(null);
      if (e.key === "Tab") {
        const nodes = [
          ...document.querySelectorAll(
            ".studio .modal button,.studio .modal a[href]",
          ),
        ];
        if (!nodes.length) return;
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus?.();
    };
  }, [modal]);
  const stage = useRef();
  const notify = (e) => setNotice(e.message || e);
  const invalidate = () => {
    setResult(null);
    setNotice("");
  };
  async function uploadRoom(f) {
    try {
      const v = await readUpload(f);
      setRoom(v);
      invalidate();
      setEditing(mode === "preview");
      setNewPoints([]);
      setPoints([]);
      setManualSelection(false);
      setNotice(
        mode === "ai"
          ? "صورتك جاهزة. اختر المنتج وسنحدد سطح التشطيب تلقائيًا عند التوليد."
          : "حدّد ٤ زوايا للسطح بالترتيب حول حدوده، من أعلى اليسار.",
      );
    } catch (e) {
      notify(e);
    }
  }
  async function uploadMaterial(f) {
    try {
      const src = await readUpload(f);
      const m = {
        id: crypto.randomUUID(),
        name: f.name.replace(/\.[^.]+$/, ""),
        kind: "خامتي الخاصة",
        tone: "خاص",
        src,
      };
      setMaterials((v) => [m, ...v]);
      setSelected(m);
      setFilter("الكل");
      invalidate();
    } catch (e) {
      notify(e);
    }
  }
  function changeSurface(v) {
    setManualSelection(false);
    setSurface(v);
    invalidate();
    setPoints(room.startsWith("data:") ? [] : v === "الأرضية" ? floor : wall);
    setEditing(mode === "preview" && room.startsWith("data:"));
    setNewPoints([]);
  }
  async function generate(materialChoice = selected) {
    if (mode === "ai" && generationDisabled) {
      notify(
        "توليد الصور مخصص للعملاء المشترين فقط، وغير متاح لحسابات الشركات أو الأدمين.",
      );
      return;
    }
    if (mode === "preview" && points.length !== 4) {
      notify("حدّد زوايا السطح الأربع أولًا.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      let image,
        mask = null;
      if (mode === "preview") {
        image = await renderMaterial(
          room,
          materialChoice.src,
          points,
          size,
          angle,
          grout,
        );
      } else {
        const token = authenticate
          ? await authenticate()
          : await (await getUser()).getIdToken();
        const res = await fetch(
          import.meta.env.VITE_GENERATION_ENDPOINT ||
            `${import.meta.env.BASE_URL}api/generate.php`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              room: await imageData(room),
              material: await imageData(materialChoice.src),
              roomType,
              surface,
              size,
              angle,
              grout,
              points: manualSelection ? points : [],
              materialType: materialChoice.category || "سيراميك",
            }),
            signal: AbortSignal.timeout(240000),
          },
        );
        const data = await res.json().catch(() => {
          throw new Error(
            "خدمة الصور غير متاحة. تأكد من تشغيل PHP وإعداد السيرفر.",
          );
        });
        if (!res.ok) throw new Error(data.error || "تعذّر توليد الصورة.");
        if (!/^data:image\/(png|jpeg|webp);base64,/.test(data.image || ""))
          throw new Error("الخدمة لم تُرجع صورة صالحة.");
        image = data.image;
        mask = data.mask || null;
      }
      setResult({ image, mask, mode, material: materialChoice.name });
      setShowMask(false);
      setSplit(50);
    } catch (e) {
      notify(e);
    } finally {
      setBusy(false);
    }
  }
  function selectPoint(e) {
    if (!editing) return;
    const b = e.currentTarget.getBoundingClientRect();
    const next = [
      ...newPoints,
      [(e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height],
    ];
    setNewPoints(next);
    if (next.length === 4) {
      setPoints(next);
      setManualSelection(true);
      setEditing(false);
      invalidate();
    }
  }
  async function save() {
    if (!result) return;
    setBusy(true);
    try {
      const data = {
        material: result.material,
        surface,
        size,
        roomType,
        mode: result.mode,
        date: new Date().toLocaleDateString("ar-EG"),
      };
      if (firebaseConfigured) {
        await saveDesign(result.image, data);
        setNotice("تم حفظ التصميم في حسابك السحابي.");
      } else {
        const item = {
          ...data,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          image: result.image,
        };
        const next = await saveLocalDesign(item);
        setSaved(next);
        setNotice("تم حفظ التصميم على هذا المتصفح.");
      }
    } catch (e) {
      notify(
        e.name === "QuotaExceededError"
          ? "مساحة حفظ المتصفح ممتلئة. نزّل الصورة للاحتفاظ بها."
          : e,
      );
    } finally {
      setBusy(false);
    }
  }
  const download = () => {
    const a = document.createElement("a");
    a.href = result.image;
    a.download = `idea-${result.mode}-${Date.now()}.png`;
    a.click();
  };
  const canvas = (
    <div
      className={`stage ${editing ? "selecting" : ""}`}
      style={{ aspectRatio: roomAspect }}
      ref={stage}
      onClick={selectPoint}
    >
      <img
        className="room-image"
        src={room}
        alt="صورة المكان الأصلية"
        onLoad={(e) =>
          setRoomAspect(
            e.currentTarget.naturalWidth / e.currentTarget.naturalHeight,
          )
        }
      />
      {result && (
        <>
          <img
            className="result-image"
            src={result.image}
            alt="المكان بعد تجربة الخامة"
            style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
          />
          <div className="split-line" style={{ left: `${split}%` }}>
            <span>
              <MoveHorizontal size={20} />
            </span>
          </div>
          <input
            className="compare-range"
            aria-label="مقارنة قبل وبعد"
            type="range"
            min="0"
            max="100"
            value={split}
            onChange={(e) => setSplit(+e.target.value)}
          />
          <span className="before-tag">قبل</span>
          <span className="after-tag">بعد</span>
        </>
      )}
      {editing && (
        <>
          <svg
            className="point-overlay"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              points={newPoints
                .map(([x, y]) => `${x * 100},${y * 100}`)
                .join(" ")}
              fill="#d7aa7433"
              stroke="#eec797"
              strokeWidth=".5"
            />
            {newPoints.map(([x, y], i) => (
              <circle key={i} cx={x * 100} cy={y * 100} r="1" fill="#f4ce9f" />
            ))}
          </svg>
          <span className="edit-hint">
            حدّد الزاوية {newPoints.length + 1} من ٤ بالترتيب حول السطح
          </span>
        </>
      )}
      {showMask && result?.mask && (
        <div
          className="surface-mask"
          aria-label="منطقة التشطيب المحددة"
          style={{
            maskImage: `url(${result.mask})`,
            WebkitMaskImage: `url(${result.mask})`,
            maskMode: "luminance",
          }}
        />
      )}
      {busy && (
        <div className="rendering">
          <LoaderCircle className="spin" size={30} />
          <b>بنجهّز رؤيتك الجديدة…</b>
        </div>
      )}
      <div className="stage-bottom">
        <span>
          <i />{" "}
          {result
            ? result.mode === "preview"
              ? "معاينة خامة محلية"
              : "نتيجة مولّدة بالذكاء الاصطناعي"
            : "مساحتك، بإمكانيات جديدة"}
        </span>
        <button
          title="عرض موسّع"
          aria-label="عرض موسّع"
          onClick={(e) => {
            e.stopPropagation();
            setModal("preview");
          }}
        >
          <Expand size={17} />
        </button>
      </div>
    </div>
  );
  return (
    <div className="studio idea-ceramic-studio">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">
            <Layers3 size={25} />
          </span>
          <span>
            مساحة<small>MASAHA STUDIO</small>
          </span>
        </a>
        <nav>
          <a className="active" href="#studio">
            استوديو التصميم
          </a>
          <button
            onClick={() =>
              document
                .getElementById("materials")
                .scrollIntoView({ behavior: "smooth" })
            }
          >
            مكتبة الخامات
          </button>
          <button onClick={() => setModal("saved")}>
            تصميماتي <span className="count">{saved.length}</span>
          </button>
        </nav>
        <div className="header-end">
          <span className="studio-label">مساحة لفكرتك.</span>
          <button
            className="avatar"
            title="عن الاستوديو"
            onClick={() => setModal("about")}
          >
            م
          </button>
        </div>
      </header>
      <div className="studio-main" id="studio">
        <div className="intro">
          <div>
            <div className="eyebrow">
              <span /> IDEA · توليد الصور لحسابات العملاء
            </div>
            <h1>
              شوف مساحتك <span>بشكل جديد.</span>
            </h1>
            <p>
              ارفع المكان كما هو، واختر من متجر IDEA. غيّر التشطيب واحتفظ
              بتفاصيل المكان.
            </p>
          </div>
          <button className="quiet-button" onClick={() => setModal("help")}>
            <Info size={16} /> إزاي تستخدم الاستوديو؟ <ArrowUpLeft size={16} />
          </button>
        </div>
        <div
          className="workspace"
          inert={busy ? "" : undefined}
          aria-busy={busy}
        >
          <aside className="settings">
            <div className="panel-title">
              <span>ابدأ تصميمك</span>
              <SlidersHorizontal size={17} />
            </div>
            <section>
              <h2>
                <em>01</em> مساحتك
              </h2>
              <UploadBox onFile={uploadRoom}>
                <ImagePlus size={25} />
                <b>ارفع صورة المكان</b>
                <span>أو اسحب الصورة هنا</span>
                <small>JPG, PNG, WebP · حتى 10 MB</small>
              </UploadBox>
              <div className="sample-row">
                <img src={`${base}room.png`} alt="غرفة تجريبية" />
                <div>
                  <b>
                    {room.startsWith("data:")
                      ? "صورتك الخاصة"
                      : "مساحة جاهزة للتجربة"}
                  </b>
                  <small>
                    {room.startsWith("data:")
                      ? "تم رفع الصورة"
                      : "ابدأ بالصورة التجريبية"}
                  </small>
                </div>
                <Check size={16} />
              </div>
              <label className="field-label" htmlFor="roomType">
                نوع المساحة
              </label>
              <div className="select-wrap">
                <select
                  id="roomType"
                  value={roomType}
                  onChange={(e) => {
                    setRoomType(e.target.value);
                    invalidate();
                  }}
                >
                  {[
                    "حمّام",
                    "غرفة معيشة",
                    "غرفة نوم",
                    "مطبخ",
                    "مساحة خارجية",
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
                <ChevronDown size={15} />
              </div>
            </section>
            <section>
              <h2>
                <em>02</em> سطح التطبيق
              </h2>
              <div className="segmented">
                {["الأرضية", "الحوائط"].map((v) => (
                  <button
                    key={v}
                    className={v === surface ? "chosen" : ""}
                    onClick={() => changeSurface(v)}
                  >
                    <Grid2X2 size={15} />
                    {v}
                  </button>
                ))}
              </div>
              <button
                className="outline-button"
                onClick={() => {
                  invalidate();
                  setEditing(true);
                  setNewPoints([]);
                }}
              >
                <MousePointer2 size={14} /> تحديد حدود السطح{" "}
                <ArrowLeft size={14} />
              </button>
              <small className="muted">
                {mode === "ai"
                  ? "تحديد تلقائي للسطح مع استثناء الأثاث والأدوات الصحية. التحديد اليدوي اختياري للتصحيح."
                  : "٤ زوايا متتالية حول المساحة المطلوب تغييرها."}
              </small>
            </section>
            <section>
              <h2>
                <em>03</em> تفاصيل التركيب
              </h2>
              <label className="field-label" htmlFor="tileSize">
                مقاس البلاطة <small>سم</small>
              </label>
              <div className="select-wrap">
                <select
                  dir="ltr"
                  id="tileSize"
                  value={size}
                  onChange={(e) => {
                    setSize(e.target.value);
                    invalidate();
                  }}
                >
                  {[
                    ...new Set(
                      [
                        selected.tileSize,
                        "60 × 60",
                        "120 × 60",
                        "30 × 30",
                      ].filter(Boolean),
                    ),
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
                <ChevronDown size={15} />
              </div>
              <div className="detail-row">
                <label htmlFor="angle">زاوية التركيب</label>
                <span>{angle}°</span>
              </div>
              <input
                id="angle"
                aria-label="زاوية التركيب"
                type="range"
                min="0"
                max="90"
                step="45"
                value={angle}
                onChange={(e) => {
                  setAngle(+e.target.value);
                  invalidate();
                }}
              />
              <div className="detail-row">
                <span>لون الفواصل</span>
                <div className="swatches">
                  {["#d8d1c5", "#ffffff", "#54524e"].map((v) => (
                    <button
                      key={v}
                      aria-label={`لون الفواصل ${v}`}
                      style={{ background: v }}
                      className={grout === v ? "picked" : ""}
                      onClick={() => {
                        setGrout(v);
                        invalidate();
                      }}
                    />
                  ))}
                </div>
              </div>
            </section>
            <div className="settings-note">
              <Layers3 size={18} />
              <p>
                التفاصيل الصغيرة
                <br />
                <b>بتعمل فرق كبير.</b>
              </p>
            </div>
          </aside>
          <div className="main-panel">
            <div className="preview-toolbar">
              <div>
                <span className="live-dot" /> معاينة المساحة{" "}
                <small>/ {roomType}</small>
              </div>
              <button
                className="saved-button"
                onClick={() => setModal("saved")}
              >
                <FolderHeart size={14} /> تصميماتي
              </button>
              <button
                className="icon-button"
                aria-label="إعادة ضبط التصميم"
                title="إعادة ضبط التصميم"
                onClick={() => {
                  setRoom(`${base}room.png`);
                  setSurface("الأرضية");
                  setRoomType("غرفة معيشة");
                  setPoints(floor);
                  setManualSelection(false);
                  setEditing(false);
                  setNewPoints([]);
                  setSelected(catalog[0]);
                  setSize("60 × 60");
                  setAngle(0);
                  setGrout("#d8d1c5");
                  invalidate();
                }}
              >
                <RotateCcw size={16} />
              </button>
            </div>
            {canvas}
            <div className="preview-caption">
              <span>
                <MoveHorizontal size={16} />
                {result
                  ? "اسحب المؤشر للمقارنة بين قبل وبعد"
                  : "جرّب الخامة وشاهدها داخل مساحتك"}
              </span>
              <span dir="ltr">DESIGNED AROUND YOU</span>
              {result?.mask && (
                <button
                  className="review-mask"
                  onClick={() => setShowMask((v) => !v)}
                >
                  {showMask ? "إخفاء حدود العزل" : "راجع منطقة التغيير"}
                </button>
              )}
            </div>
            <section id="materials" className="materials">
              <div className="materials-heading">
                <div>
                  <span className="eyebrow">IDEA · MATERIAL LIBRARY</span>
                  <h2>كل مساحة، وليها خامتها.</h2>
                </div>
                <UploadBox onFile={uploadMaterial} className="upload-material">
                  <Plus size={16} /> ارفع خامتك
                </UploadBox>
              </div>
              <p className="library-note">
                خامات الكتالوج مرتبطة بالموقع. الخامات الست الملوّنة توضيحية؛
                ارفع صورة البلاطة الفعلية لأفضل نتيجة.
              </p>
              <div className="filters">
                {[
                  "كتالوج IDEA",
                  "سيراميك",
                  "بورسلين",
                  "رخام",
                  "توضيحية",
                  "الكل",
                ].map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setFilter(v);
                      setVisibleCount(12);
                    }}
                    className={filter === v ? "selected-filter" : ""}
                  >
                    {v}
                  </button>
                ))}
                <span>{visibleMaterials.length} خامات</span>
              </div>
              <input
                className="material-search"
                aria-label="ابحث عن خامة"
                placeholder="ابحث باسم الخامة أو الماركة…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisibleCount(12);
                }}
              />
              <label className="auto-apply">
                <input
                  type="checkbox"
                  checked={autoApply}
                  onChange={(e) => setAutoApply(e.target.checked)}
                />{" "}
                طبّق الخامة تلقائيًا عند اختيارها بعد رفع صورة المكان
              </label>
              <div className="material-grid">
                {visibleMaterials.slice(0, visibleCount).map((m) => (
                  <button
                    key={m.id}
                    className={`material-card ${selected.id === m.id ? "selected-material" : ""}`}
                    onClick={() => {
                      setSelected(m);
                      invalidate();
                      if (autoApply && room.startsWith("data:") && !editing)
                        void generate(m);
                    }}
                  >
                    <div className="material-image">
                      <img src={m.src} alt={m.name} />
                      {selected.id === m.id && (
                        <span className="material-check">
                          <Check size={13} />
                        </span>
                      )}
                    </div>
                    <b>{m.name}</b>
                    <small>
                      {m.product
                        ? m.kind
                        : m.kind === "خامتي الخاصة"
                          ? "خامتي الخاصة"
                          : "خامة توضيحية"}{" "}
                      <span>• {m.tone}</span>
                    </small>
                  </button>
                ))}
              </div>
              {visibleMaterials.length === 0 && (
                <p className="empty-state">لا توجد خامات تطابق البحث.</p>
              )}
              {visibleMaterials.length > visibleCount && (
                <button
                  className="show-more"
                  onClick={() => setVisibleCount((v) => v + 12)}
                >
                  عرض خامات أكثر ({visibleMaterials.length - visibleCount})
                </button>
              )}
            </section>
          </div>
          <aside className="design-summary">
            <div className="summary-head">
              <span className="eyebrow">IDEA MATERIAL STUDIO</span>
              <h2>رؤيتك، في التفاصيل.</h2>
              <p>اختيارات بتعبّر عنك.</p>
            </div>
            <div className="selected-texture">
              <img
                src={selected.src}
                alt={`الخامة المختارة ${selected.name}`}
              />
              <span>
                الخامة المختارة <Check size={12} />
              </span>
            </div>
            <h3>{selected.name}</h3>
            <p className="texture-type">
              {selected.product
                ? `${selected.category} · ${selected.tone}`
                : selected.kind === "خامتي الخاصة"
                  ? "خامتك الخاصة"
                  : "عينة توضيحية وليست منتجًا من المتجر"}
            </p>
            {!selected.product && (
              <label className="custom-category">
                نوع الخامة{" "}
                <select
                  aria-label="نوع الخامة الخاصة"
                  value={selected.category || "سيراميك"}
                  onChange={(e) => {
                    setSelected((m) => ({ ...m, category: e.target.value }));
                    invalidate();
                  }}
                >
                  {["سيراميك", "بورسلين", "رخام"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            )}
            <dl>
              <div>
                <dt>المساحة</dt>
                <dd>{roomType}</dd>
              </div>
              <div>
                <dt>التطبيق</dt>
                <dd>{surface}</dd>
              </div>
              <div>
                <dt>المقاس</dt>
                <dd dir="ltr">{size} cm</dd>
              </div>
              <div>
                <dt>التركيب</dt>
                <dd>
                  {angle === 45 ? "قطري" : angle === 90 ? "رأسي" : "مستقيم"}
                </dd>
              </div>
            </dl>
            <label className="field-label" htmlFor="mode">
              طريقة المعاينة
            </label>
            <div className="select-wrap">
              <select
                id="mode"
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                  setEditing(
                    e.target.value === "preview" && points.length !== 4,
                  );
                  invalidate();
                }}
              >
                <option value="preview">معاينة خامة محلية</option>
                <option value="ai">توليد بالذكاء الاصطناعي</option>
              </select>
              <ChevronDown size={14} />
            </div>
            <p className="mode-note">
              {mode === "preview"
                ? "تطبيق هندسي للخامة داخل الحدود التي تختارها. لا يحافظ تلقائيًا على الأثاث أو الظلال."
                : "يحدد سطح التشطيب تلقائيًا، ويطبّق منتجك داخل قناع السطح فقط لحماية باقي الصورة. راجع النتيجة وحدود العزل قبل الاعتماد."}
            </p>
            <button
              className="generate"
              disabled={
                (mode === "ai" && generationDisabled) ||
                busy ||
                editing ||
                (mode === "preview" && points.length !== 4)
              }
              onClick={() => generate()}
            >
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Sparkles size={17} />
              )}{" "}
              {mode === "preview" ? "جرّب الخامة في مساحتك" : "ولّد تصميمك"}
              <ArrowUpLeft size={17} />
            </button>
            <span className="generation-note">
              {mode === "preview"
                ? "معاينة فورية · بدون رفع صورك"
                : "صورك تُرسل لخدمة التوليد عند الطلب"}
            </span>
            <div className="result-actions">
              <button disabled={!result || busy} onClick={download}>
                <Download size={15} /> تنزيل
              </button>
              <button disabled={!result || busy} onClick={save}>
                <Bookmark size={15} /> حفظ
              </button>
            </div>
            {onRequestQuote && (
              <button
                className="quote-material"
                disabled={!selected.product}
                onClick={() => onRequestQuote(selected.id)}
              >
                اطلب سعر المنتج المختار <ArrowLeft size={14} />
              </button>
            )}
            <div className="tip">
              <span>نصيحة من الاستوديو</span>
              <p>صورة واضحة بإضاءة طبيعية تساعدك تتخيّل الخامة بشكل أفضل.</p>
            </div>
          </aside>
        </div>
        <footer>
          <span className="footer-brand">
            <Layers3 size={16} /> مساحة <i>—</i> من الخيال، للمكان.
          </span>
          <span>
            {firebaseConfigured ? (
              <>
                <Cloud size={13} /> Firebase مُعدّ للاتصال
              </>
            ) : (
              <>
                <span className="tiny-dot" /> وضع المعاينة المحلية
              </>
            )}
          </span>
          <small>© {new Date().getFullYear()} مساحة استوديو</small>
        </footer>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Info size={18} />
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="إغلاق الإشعار">
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div
            className={`modal ${modal === "preview" ? "wide" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="تفاصيل الاستوديو"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="modal-close"
              onClick={() => setModal(null)}
              aria-label="إغلاق"
            >
              <X />
            </button>
            {modal === "preview" ? (
              <>
                <h2>مساحتك بتفاصيل أكبر</h2>
                <img
                  className="expanded-image"
                  src={result?.image || room}
                  alt="معاينة موسعة"
                />
              </>
            ) : modal === "saved" ? (
              <>
                <FolderHeart size={30} />
                <h2>تصميماتك المحفوظة</h2>
                <p>
                  التصميمات المحلية محفوظة في هذا المتصفح. عند إعداد Firebase
                  تُحفظ النتائج الجديدة سحابيًا.
                </p>
                {saved.length ? (
                  saved.map((s) => (
                    <div className="saved-item" key={s.id}>
                      <img src={s.image} alt={s.material} />
                      <div>
                        <b>{s.material}</b>
                        <p>
                          {s.roomType} · {s.date}
                        </p>
                        <a href={s.image} download={`idea-${s.id}.png`}>
                          تنزيل التصميم
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">
                    ابدأ بتجربة خامة، ثم اضغط «حفظ» لتلاقي تصميمك هنا.
                  </p>
                )}
              </>
            ) : modal === "help" ? (
              <>
                <h2>من صورتك للتصميم</h2>
                <ol>
                  <li>ارفع صورة واضحة للمكان أو ابدأ بالصورة التجريبية.</li>
                  <li>
                    اختر الأرضية أو الحوائط. وضع الذكاء الاصطناعي يحدد السطح
                    تلقائيًا؛ التحديد اليدوي أداة تصحيح اختيارية.
                  </li>
                  <li>اختر خامة من المكتبة أو ارفع صورة السيراميك الخاص بك.</li>
                  <li>
                    بعد رفع صورتك، اختيار منتج يطبّقه تلقائيًا إذا كان الخيار
                    مفعّلًا. يمكنك كذلك الضغط على «ولّد تصميمك».
                  </li>
                  <li>اسحب المقارنة، ثم نزّل النتيجة أو احفظها.</li>
                </ol>
                <p>
                  المعاينة المحلية دراسة تقريبية للخامة. مقاس البلاط بصري تقريبي
                  لعدم وجود قياسات حقيقية للمكان. التوليد الذكي يحتاج توصيل
                  الخدمة.
                </p>
              </>
            ) : (
              <>
                <Layers3 size={30} />
                <h2>مساحة لفكرتك.</h2>
                <p>
                  استوديو عربي لتجربة خامات السيراميك داخل صور المساحات. واجهة
                  React مع تكامل Firebase ووسيط PHP لاستضافة cPanel.
                </p>
                <p>
                  التصميمات تصوّر بصري؛ راجع عينة الخامة والمقاسات الفعلية قبل
                  التنفيذ.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
