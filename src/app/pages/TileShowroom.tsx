import { useState, useMemo } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Check } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { MATERIAL_LOOKS } from "../components/MaterialLookStrip";
import type { Product, Locale } from "../data/types";

type RoomType = "bathroom" | "living" | "hallway";

// ── One-point perspective room SVG ─────────────────────────────────────────
// Viewbox 1000×620, VP at (500,160)
// Back wall:  250,80 → 750,80 → 750,390 → 250,390
// Floor:      0,620 → 1000,620 → 750,390 → 250,390
// Ceiling:    0,0 → 1000,0 → 750,80 → 250,80
// Left wall:  0,0 → 250,80 → 250,390 → 0,620
// Right wall: 1000,0 → 750,80 → 750,390 → 1000,620

function RoomSVG({
  floorTile,
  wallTile,
  roomType,
}: {
  floorTile: string | null;
  wallTile: string | null;
  roomType: RoomType;
}) {
  const grout = "#cac7bc";

  return (
    <svg
      viewBox="0 0 1000 620"
      style={{ width: "100%", height: "100%", display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {floorTile && (
          <pattern id="fp" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <image href={floorTile} x="0" y="0" width="120" height="120" preserveAspectRatio="xMidYMid slice" />
            <line x1="0" y1="0" x2="0" y2="120" stroke={grout} strokeWidth="2.5" />
            <line x1="0" y1="0" x2="120" y2="0" stroke={grout} strokeWidth="2.5" />
          </pattern>
        )}
        {wallTile && (
          <pattern id="wp" x="0" y="0" width="95" height="95" patternUnits="userSpaceOnUse">
            <image href={wallTile} x="0" y="0" width="95" height="95" preserveAspectRatio="xMidYMid slice" />
            <line x1="0" y1="0" x2="0" y2="95" stroke={grout} strokeWidth="1.8" />
            <line x1="0" y1="0" x2="95" y2="0" stroke={grout} strokeWidth="1.8" />
          </pattern>
        )}
        {wallTile && (
          <pattern id="sp" x="0" y="0" width="95" height="95" patternUnits="userSpaceOnUse">
            <image href={wallTile} x="0" y="0" width="95" height="95" preserveAspectRatio="xMidYMid slice" />
            <line x1="0" y1="0" x2="0" y2="95" stroke={grout} strokeWidth="1.8" />
            <line x1="0" y1="0" x2="95" y2="0" stroke={grout} strokeWidth="1.8" />
          </pattern>
        )}
        <radialGradient id="atmos" cx="50%" cy="15%" r="65%">
          <stop offset="0%" stopColor="white" stopOpacity="0.18" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <filter id="side-shadow">
          <feColorMatrix type="saturate" values="0.9" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.78" />
            <feFuncG type="linear" slope="0.78" />
            <feFuncB type="linear" slope="0.78" />
          </feComponentTransfer>
        </filter>
      </defs>

      {/* Ambient background */}
      <rect width="1000" height="620" fill="#f2efe9" />

      {/* Ceiling */}
      <polygon points="0,0 1000,0 750,80 250,80" fill="#eae7e0" />

      {/* Left wall */}
      <polygon
        points="0,0 250,80 250,390 0,620"
        fill={wallTile ? "url(#sp)" : "#dedad2"}
        filter={wallTile ? "url(#side-shadow)" : undefined}
      />

      {/* Right wall */}
      <polygon
        points="1000,0 750,80 750,390 1000,620"
        fill={wallTile ? "url(#sp)" : "#e0dcd4"}
        filter={wallTile ? "url(#side-shadow)" : undefined}
      />

      {/* Back wall */}
      <polygon
        points="250,80 750,80 750,390 250,390"
        fill={wallTile ? "url(#wp)" : "#f0ede6"}
      />

      {/* Floor */}
      <polygon
        points="0,620 1000,620 750,390 250,390"
        fill={floorTile ? "url(#fp)" : "#e2dfd7"}
      />

      {/* Subtle floor perspective grid when no tile */}
      {!floorTile && (
        <g stroke={grout} strokeWidth="1" opacity="0.45">
          {[100, 200, 300, 400, 600, 700, 800, 900].map((x) => (
            <line key={x} x1={x} y1="620" x2={x * 0.5 + 250} y2="390" />
          ))}
          {[0.25, 0.5, 0.75].map((d) => (
            <line key={d} x1={d * 250} y1={620 - d * 230} x2={1000 - d * 250} y2={620 - d * 230} />
          ))}
        </g>
      )}

      {/* Room edge lines */}
      <g stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" fill="none">
        <line x1="0" y1="620" x2="250" y2="390" />
        <line x1="1000" y1="620" x2="750" y2="390" />
        <line x1="250" y1="390" x2="750" y2="390" />
        <line x1="0" y1="0" x2="250" y2="80" />
        <line x1="1000" y1="0" x2="750" y2="80" />
        <line x1="250" y1="80" x2="750" y2="80" />
        <line x1="250" y1="80" x2="250" y2="390" />
        <line x1="750" y1="80" x2="750" y2="390" />
      </g>

      {/* ── BATHROOM fixtures ── */}
      {roomType === "bathroom" && (
        <g>
          {/* Bathtub — right foreground */}
          <rect x="790" y="430" width="185" height="82" rx="41" fill="white" stroke="#c8c4bc" strokeWidth="2" />
          <rect x="803" y="442" width="159" height="58" rx="30" fill="#f4f1ec" stroke="#ddd" strokeWidth="1" />
          <circle cx="858" cy="432" r="5" fill="#aaa" />
          <line x1="858" y1="432" x2="858" y2="422" stroke="#aaa" strokeWidth="2" />
          {/* Toilet — left foreground */}
          <ellipse cx="120" cy="520" rx="58" ry="72" fill="white" stroke="#c8c4bc" strokeWidth="2" />
          <ellipse cx="120" cy="528" rx="46" ry="58" fill="#f4f1ec" stroke="#ddd" strokeWidth="1" />
          <rect x="80" y="420" width="80" height="26" rx="8" fill="white" stroke="#c8c4bc" strokeWidth="2" />
          {/* Vanity / sink on back wall */}
          <rect x="340" y="360" width="180" height="28" rx="6" fill="white" stroke="#c8c4bc" strokeWidth="1.5" />
          <ellipse cx="430" cy="388" rx="50" ry="10" fill="#e8e4de" stroke="#ccc" strokeWidth="1" />
          <line x1="430" y1="375" x2="430" y2="365" stroke="#bbb" strokeWidth="2" />
        </g>
      )}

      {/* ── LIVING ROOM fixtures ── */}
      {roomType === "living" && (
        <g>
          {/* Sofa — center foreground */}
          <rect x="80" y="480" width="520" height="110" rx="22" fill="white" stroke="#c8c4bc" strokeWidth="2" />
          <rect x="88" y="468" width="504" height="28" rx="14" fill="#e8e4dc" stroke="#ccc" strokeWidth="1.5" />
          <rect x="94" y="494" width="110" height="78" rx="14" fill="#ede9e2" stroke="#ccc" strokeWidth="1" />
          <rect x="225" y="494" width="110" height="78" rx="14" fill="#ede9e2" stroke="#ccc" strokeWidth="1" />
          <rect x="357" y="494" width="110" height="78" rx="14" fill="#ede9e2" stroke="#ccc" strokeWidth="1" />
          <rect x="490" y="468" width="28" height="120" rx="8" fill="#e0dbd2" stroke="#ccc" strokeWidth="1" />
          <rect x="88" y="468" width="28" height="120" rx="8" fill="#e0dbd2" stroke="#ccc" strokeWidth="1" />
          {/* Coffee table */}
          <ellipse cx="420" cy="455" rx="130" ry="36" fill="white" stroke="#ccc" strokeWidth="1.5" />
          {/* TV on back wall */}
          <rect x="355" y="130" width="240" height="140" rx="4" fill="#222" stroke="#333" strokeWidth="1.5" />
          <rect x="360" y="135" width="230" height="130" fill="#1a1a1a" />
          <rect x="455" y="270" width="40" height="18" rx="2" fill="#333" />
          {/* TV unit */}
          <rect x="310" y="288" width="330" height="16" rx="3" fill="#e0ddd6" stroke="#ccc" strokeWidth="1" />
        </g>
      )}

      {/* ── HALLWAY fixtures ── */}
      {roomType === "hallway" && (
        <g>
          {/* Door on back wall */}
          <rect x="385" y="118" width="130" height="262" fill="none" stroke="#c0bcb4" strokeWidth="3.5" />
          <rect x="392" y="125" width="116" height="248" rx="2" fill="#ede9e2" stroke="#d4d0c8" strokeWidth="1" />
          <circle cx="412" cy="256" r="6" fill="#b0a898" />
          <line x1="412" y1="256" x2="426" y2="256" stroke="#b0a898" strokeWidth="2" />
          <path d="M392 125 Q450 200 392 373" fill="none" stroke="#d4d0c8" strokeWidth="1" strokeDasharray="4,4" />
          {/* Console table */}
          <rect x="30" y="450" width="155" height="14" rx="4" fill="white" stroke="#ccc" strokeWidth="1.5" />
          <line x1="48" y1="463" x2="48" y2="556" stroke="#d0ccc4" strokeWidth="8" strokeLinecap="round" />
          <line x1="172" y1="463" x2="172" y2="556" stroke="#d0ccc4" strokeWidth="8" strokeLinecap="round" />
          <ellipse cx="107" cy="443" rx="45" ry="12" fill="white" stroke="#ccc" strokeWidth="1.5" />
          {/* Mirror on left wall */}
          <rect x="18" y="140" width="118" height="188" rx="4" fill="none" stroke="#c0bcb4" strokeWidth="3" />
          <rect x="24" y="146" width="106" height="176" fill="#f8f6f2" />
          <line x1="77" y1="146" x2="77" y2="322" stroke="#e4e0d8" strokeWidth="1" />
          <line x1="24" y1="234" x2="130" y2="234" stroke="#e4e0d8" strokeWidth="1" />
          {/* Artwork/sconce on right wall */}
          <rect x="868" y="160" width="100" height="140" rx="4" fill="none" stroke="#c0bcb4" strokeWidth="2.5" />
          <rect x="874" y="166" width="88" height="128" fill="#f0ede6" />
          <ellipse cx="918" cy="310" rx="12" ry="6" fill="#b0a898" />
        </g>
      )}

      {/* Atmosphere overlay */}
      <rect width="1000" height="620" fill="url(#atmos)" />

      {/* Floor shadow at base of back wall */}
      <polygon points="250,385 750,385 750,400 250,400" fill="rgba(0,0,0,0.08)" />
    </svg>
  );
}

// ── Product filtering by look ──────────────────────────────────────────────
function getProductsForLook(products: Product[], lookId: string): Product[] {
  const tiles = products.filter((p) => p.image && ["ceramics", "porcelain"].includes(p.collection));

  let filtered: Product[] = [];
  switch (lookId) {
    case "marble":
      filtered = tiles.filter(
        (p) =>
          p.texture?.toLowerCase().includes("marble") ||
          p.colors?.some((c) => ["White", "Cream", "Gold", "Beige"].includes(c))
      );
      break;
    case "wood":
      filtered = tiles.filter((p) => p.texture?.toLowerCase().includes("wood"));
      break;
    case "stone":
      filtered = tiles.filter(
        (p) =>
          p.texture?.toLowerCase().includes("stone") ||
          p.texture?.toLowerCase().includes("granite") ||
          p.colors?.some((c) => ["Grey", "Charcoal", "Anthracite"].includes(c))
      );
      break;
    case "pattern":
      filtered = tiles.filter((p) => p.collection === "ceramics");
      break;
    case "colour":
      filtered = tiles.filter(
        (p) =>
          p.colors?.some((c) => !["White", "Black", "Grey", "Beige", "Cream", "Brown"].includes(c))
      );
      break;
  }

  // Always return at least some products — pad with any tile products
  return [...new Map([...filtered, ...tiles].map((p) => [p.id, p])).values()].slice(0, 16);
}

// ── TileShowroom page ──────────────────────────────────────────────────────
const ROOMS: { id: RoomType; label: Record<Locale, string> }[] = [
  { id: "bathroom", label: { en: "Bathroom", ar: "الحمام", fr: "Salle de bain" } },
  { id: "living", label: { en: "Living Room", ar: "غرفة المعيشة", fr: "Salon" } },
  { id: "hallway", label: { en: "Hallway", ar: "المدخل", fr: "Couloir" } },
];

export function TileShowroom() {
  const { lookId } = useParams<{ lookId: string }>();
  const { locale } = useI18n();
  const { products } = useStore();

  const look = MATERIAL_LOOKS.find((l) => l.id === lookId) ?? MATERIAL_LOOKS[0];
  const lookProducts = useMemo(() => getProductsForLook(products, lookId ?? "marble"), [products, lookId]);

  const [roomType, setRoomType] = useState<RoomType>("bathroom");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [applyFloor, setApplyFloor] = useState(true);
  const [applyWall, setApplyWall] = useState(true);

  const activeTile = selectedProduct?.image ?? look.tileImage;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 70px)", background: "var(--idea-bg-2)" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--idea-space-3)",
        padding: "var(--idea-space-3) var(--idea-space-5)",
        background: "var(--idea-surface)",
        borderBottom: "var(--idea-hairline)",
        flexShrink: 0,
        flexWrap: "wrap",
        rowGap: "var(--idea-space-2)",
      }}>
        <Link
          to="/"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)",
            textDecoration: "none", flexShrink: 0,
          }}
        >
          <ArrowLeft size={17} /> Home
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--idea-border)", flexShrink: 0 }} />
        {/* Look tabs */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", flexWrap: "nowrap" }}>
          {MATERIAL_LOOKS.map((l) => (
            <Link
              key={l.id}
              to={`/tile-showroom/${l.id}`}
              style={{
                padding: "6px 16px",
                background: l.id === look.id ? "var(--idea-gold)" : "transparent",
                color: l.id === look.id ? "white" : "var(--idea-text-muted)",
                borderRadius: "var(--idea-radius-full)",
                fontSize: "var(--idea-text-sm)",
                textDecoration: "none",
                whiteSpace: "nowrap",
                fontFamily: "var(--idea-font-display)",
                letterSpacing: "0.06em",
                border: l.id === look.id ? "none" : "var(--idea-hairline)",
                transition: "all 0.18s",
                flexShrink: 0,
              }}
            >
              {l.label[locale as Locale]}
            </Link>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="idea-showroom-body" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left — Room view */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "var(--idea-space-4) var(--idea-space-5)",
          gap: "var(--idea-space-3)",
          overflow: "hidden",
          minWidth: 0,
        }}>
          {/* Controls row */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--idea-space-2)", flexWrap: "wrap" }}>
            {ROOMS.map((r) => (
              <button
                key={r.id}
                onClick={() => setRoomType(r.id)}
                style={{
                  padding: "7px 18px",
                  background: roomType === r.id ? "var(--idea-text)" : "var(--idea-surface)",
                  color: roomType === r.id ? "white" : "var(--idea-text-muted)",
                  border: roomType === r.id ? "none" : "var(--idea-hairline)",
                  borderRadius: "var(--idea-radius-full)",
                  cursor: "pointer",
                  fontSize: "var(--idea-text-sm)",
                  fontFamily: "var(--idea-font-display)",
                  letterSpacing: "0.06em",
                  transition: "all 0.18s",
                }}
              >
                {r.label[locale as Locale]}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            {/* Surface toggles */}
            {[
              { key: "floor", label: locale === "ar" ? "أرضية" : "Floor", checked: applyFloor, toggle: () => setApplyFloor((v) => !v) },
              { key: "wall", label: locale === "ar" ? "جدار" : "Walls", checked: applyWall, toggle: () => setApplyWall((v) => !v) },
            ].map(({ key, label, checked, toggle }) => (
              <button
                key={key}
                onClick={toggle}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px",
                  background: checked ? "var(--idea-gold-soft)" : "var(--idea-surface)",
                  border: checked ? "1px solid var(--idea-gold)" : "var(--idea-hairline)",
                  borderRadius: "var(--idea-radius-full)",
                  cursor: "pointer",
                  fontSize: "var(--idea-text-sm)",
                  color: checked ? "var(--idea-gold-bright)" : "var(--idea-text-muted)",
                  transition: "all 0.18s",
                }}
              >
                {checked && <Check size={13} />}
                {label}
              </button>
            ))}
          </div>

          {/* Room SVG */}
          <div style={{
            flex: 1,
            background: "white",
            borderRadius: "var(--idea-radius-lg)",
            overflow: "hidden",
            border: "var(--idea-hairline)",
            boxShadow: "var(--idea-shadow-md)",
            minHeight: 0,
          }}>
            <RoomSVG
              floorTile={applyFloor ? activeTile : null}
              wallTile={applyWall ? activeTile : null}
              roomType={roomType}
            />
          </div>

          <p style={{ fontSize: "var(--idea-text-xs)", color: "var(--idea-text-faint)", margin: 0, lineHeight: 1.5 }}>
            {locale === "ar"
              ? "معاينة فقط. قد يختلف مظهر البلاط الفعلي حسب الحجم والتشطيب والإضاءة."
              : "Preview only. Actual tile appearance may vary by size, finish, and lighting."}
          </p>
        </div>

        {/* Right — Tile picker */}
        <div style={{
          width: 300,
          flexShrink: 0,
          borderInlineStart: "var(--idea-hairline)",
          background: "var(--idea-surface)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }} className="idea-tile-picker">
          {/* Picker header */}
          <div style={{
            padding: "var(--idea-space-4) var(--idea-space-4) var(--idea-space-3)",
            borderBottom: "var(--idea-hairline)",
            flexShrink: 0,
          }}>
            <div style={{
              fontFamily: "var(--idea-font-display)",
              fontSize: "var(--idea-text-xs)",
              letterSpacing: "var(--idea-tracking-wide)",
              color: "var(--idea-gold-bright)",
              marginBottom: 4,
              textTransform: "uppercase",
            }}>
              {locale === "ar" ? "اختر البلاطة" : "Select Tile"}
            </div>
            <div style={{ fontSize: "var(--idea-text-sm)", color: "var(--idea-text-muted)" }}>
              {look.label[locale as Locale]} · {lookProducts.length} {locale === "ar" ? "منتج" : "surfaces"}
            </div>
          </div>

          {/* Look default option */}
          <div style={{ padding: "var(--idea-space-3) var(--idea-space-4) 0", flexShrink: 0 }}>
            <button
              onClick={() => setSelectedProduct(null)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: "var(--idea-radius-md)",
                border: selectedProduct === null ? "2px solid var(--idea-gold)" : "var(--idea-hairline)",
                background: selectedProduct === null ? "var(--idea-gold-soft)" : "var(--idea-surface-2)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <img
                src={look.tileImage}
                alt="Default"
                style={{ width: 44, height: 44, objectFit: "cover", borderRadius: "var(--idea-radius-sm)", flexShrink: 0 }}
              />
              <div>
                <div style={{
                  fontFamily: "var(--idea-font-display)",
                  fontSize: "var(--idea-text-sm)",
                  color: "var(--idea-text)",
                  letterSpacing: "0.04em",
                }}>
                  {locale === "ar" ? "النمط الافتراضي" : "Look Preview"}
                </div>
                <div style={{ fontSize: "var(--idea-text-xs)", color: "var(--idea-text-muted)" }}>
                  {look.label[locale as Locale]}
                </div>
              </div>
            </button>
          </div>

          {/* Products grid */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "var(--idea-space-3) var(--idea-space-4) var(--idea-space-4)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--idea-space-2)",
            alignContent: "start",
            scrollbarWidth: "thin",
          }}>
            {lookProducts.map((p) => {
              const isSelected = selectedProduct?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProduct(isSelected ? null : p)}
                  style={{
                    padding: 0,
                    border: isSelected ? "2px solid var(--idea-gold)" : "var(--idea-hairline)",
                    borderRadius: "var(--idea-radius-md)",
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "transparent",
                    display: "flex",
                    flexDirection: "column",
                    textAlign: "left",
                    transition: "border-color 0.15s",
                    position: "relative",
                  }}
                >
                  {isSelected && (
                    <div style={{
                      position: "absolute",
                      top: 6, right: 6,
                      background: "var(--idea-gold)",
                      borderRadius: "var(--idea-radius-full)",
                      width: 20, height: 20,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      zIndex: 1,
                    }}>
                      <Check size={12} color="white" />
                    </div>
                  )}
                  <img
                    src={p.image}
                    alt={p.name[locale as Locale]}
                    style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <div style={{ padding: "6px 8px", background: "var(--idea-surface-2)" }}>
                    <div style={{
                      fontSize: 11,
                      color: "var(--idea-text-muted)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontFamily: "var(--idea-font-display)",
                      letterSpacing: "0.04em",
                    }}>
                      {p.name[locale as Locale]}
                    </div>
                    {p.sizes?.[0] && (
                      <div style={{ fontSize: 10, color: "var(--idea-text-faint)" }}>
                        {p.sizes[0].label}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* CTA strip */}
          {selectedProduct && (
            <div style={{
              padding: "var(--idea-space-4)",
              borderTop: "var(--idea-hairline)",
              background: "var(--idea-surface)",
              flexShrink: 0,
            }}>
              <div style={{
                fontFamily: "var(--idea-font-display)",
                fontSize: "var(--idea-text-sm)",
                color: "var(--idea-text)",
                marginBottom: "var(--idea-space-3)",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {selectedProduct.name[locale as Locale]}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Link
                  to={`/product/${selectedProduct.slug}`}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    background: "var(--idea-surface-2)",
                    border: "var(--idea-hairline)",
                    borderRadius: "var(--idea-radius-md)",
                    textAlign: "center",
                    textDecoration: "none",
                    color: "var(--idea-text)",
                    fontSize: "var(--idea-text-sm)",
                    fontFamily: "var(--idea-font-display)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {locale === "ar" ? "عرض" : "View"}
                </Link>
                <Link
                  to="/request-quote/new"
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    background: "var(--idea-gold)",
                    borderRadius: "var(--idea-radius-md)",
                    textAlign: "center",
                    textDecoration: "none",
                    color: "white",
                    fontSize: "var(--idea-text-sm)",
                    fontFamily: "var(--idea-font-display)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {locale === "ar" ? "طلب سعر" : "Get Quote"}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .idea-showroom-body { flex-direction: column !important; overflow: auto !important; }
          .idea-tile-picker {
            width: 100% !important;
            border-inline-start: none !important;
            border-top: var(--idea-hairline) !important;
            max-height: 360px;
          }
        }
      `}</style>
    </div>
  );
}
