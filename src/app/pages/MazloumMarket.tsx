import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ExternalLink, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Container, Section, Tag } from "../components/ui";

interface MazloumProduct {
  id: string;
  name: string;
  productUrl: string;
  image: string | null;
  category: string | null;
  price: string | null;
  previousPrice: string | null;
  discount: string | null;
  badges: string[];
}

interface MazloumResponse {
  ok: boolean;
  error?: string;
  page: number;
  pageSize: number;
  total: number | null;
  totalPages: number | null;
  products: MazloumProduct[];
  source: { name: string; fetchedAt: string };
}

export function MazloumMarket() {
  const [page, setPage] = useState(() => Math.max(1, Number(new URLSearchParams(location.search).get("page") || 1)));
  const [data, setData] = useState<MazloumResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/mazloum?page=${page}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as MazloumResponse;
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load Mazloum catalogue.");
        setData(payload);
        const url = new URL(window.location.href);
        url.searchParams.set("page", String(page));
        window.history.replaceState({}, "", url);
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
      .catch((reason) => {
        if (reason?.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Unable to load catalogue.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [page]);

  const categories = useMemo(
    () => [...new Set((data?.products ?? []).map((product) => product.category).filter(Boolean) as string[])].sort(),
    [data]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.products ?? []).filter((product) => {
      if (category && product.category !== category) return false;
      if (needle && ![product.name, product.category, product.price].filter(Boolean).join(" ").toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [data, query, category]);

  const totalPages = data?.totalPages ?? 1;

  return (
    <Section style={{ paddingTop: "var(--idea-space-6)" }}>
      <Container>
        <header style={{ marginBottom: "var(--idea-space-6)" }}>
          <div className="idea-eyebrow">IDEA Source Marketplace · Mazloum Home</div>
          <h1 className="idea-display" style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-2xl)", margin: "8px 0 10px" }}>
            Mazloum Home Catalogue
          </h1>
          <p style={{ color: "var(--idea-text-muted)", maxWidth: 760, lineHeight: 1.7, margin: 0 }}>
            A live IDEA presentation of the Mazloum Home catalogue. Product names, imagery, source prices and commercial badges are read from the current source catalogue while the page keeps IDEA's own interface.
          </p>
          {data?.total && (
            <div style={{ marginTop: 12, color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-sm)" }}>
              {data.total.toLocaleString()} products · page {data.page} of {data.totalPages}
            </div>
          )}
        </header>

        <div style={{
          display: "grid", gridTemplateColumns: "minmax(220px, 1fr) auto", gap: 12, alignItems: "center",
          padding: "var(--idea-space-4)", background: "var(--idea-surface)", border: "var(--idea-hairline)",
          borderRadius: "var(--idea-radius-lg)", marginBottom: "var(--idea-space-5)"
        }} className="mazloum-toolbar">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this catalogue page"
            style={{
              width: "100%", background: "var(--idea-bg)", color: "var(--idea-text)", border: "var(--idea-hairline)",
              borderRadius: "var(--idea-radius-md)", padding: "12px 14px", font: "inherit"
            }}
          />
          <button
            onClick={() => { setCategory(null); setQuery(""); setPage(1); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7, border: "var(--idea-hairline)",
              background: "transparent", color: "var(--idea-text-muted)", borderRadius: "var(--idea-radius-md)",
              padding: "11px 14px", cursor: "pointer"
            }}
          >
            <RefreshCw size={15} /> Reset
          </button>
        </div>

        {categories.length > 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "var(--idea-space-5)" }}>
            <button onClick={() => setCategory(null)} style={filterButton(category === null)}>All on this page</button>
            {categories.map((value) => (
              <button key={value} onClick={() => setCategory(category === value ? null : value)} style={filterButton(category === value)}>
                {value}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ padding: "var(--idea-space-8)", textAlign: "center", color: "var(--idea-text-muted)" }}>Loading Mazloum catalogue…</div>
        )}

        {error && (
          <div style={{ padding: "var(--idea-space-6)", border: "1px solid var(--idea-border-neutral)", borderRadius: "var(--idea-radius-lg)", color: "var(--idea-text)" }}>
            {error}
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div style={{ padding: "var(--idea-space-8)", textAlign: "center", color: "var(--idea-text-muted)" }}>No products match this page filter.</div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "var(--idea-space-5)" }}>
            {visible.map((product) => (
              <article key={product.id} style={{
                overflow: "hidden", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-lg)",
                background: "var(--idea-surface)", display: "flex", flexDirection: "column"
              }}>
                <div style={{ aspectRatio: "4/3", overflow: "hidden", background: "var(--idea-bg)", position: "relative" }}>
                  <MazloumCardImage product={product} />
                  <div style={{ position: "absolute", top: 10, insetInlineStart: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {product.discount && <span style={badgeStyle}>{product.discount}</span>}
                    {product.badges.slice(0, 2).map((badge) => <span key={badge} style={badgeStyle}>{badge}</span>)}
                  </div>
                </div>

                <div style={{ padding: "var(--idea-space-4)", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                  {product.category && <div className="idea-eyebrow">{product.category}</div>}
                  <h2 className="idea-display" style={{ margin: 0, color: "var(--idea-text)", fontSize: "var(--idea-text-lg)" }}>{product.name}</h2>
                  <div style={{ marginTop: "auto", display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    {product.previousPrice && <span style={{ color: "var(--idea-text-faint)", textDecoration: "line-through", fontSize: "var(--idea-text-xs)" }}>{product.previousPrice}</span>}
                    {product.price && <span style={{ color: "var(--idea-gold-bright)", fontWeight: 700 }}>{product.price}</span>}
                  </div>
                  <Link to={`/market/mazloum/product?url=${encodeURIComponent(product.productUrl)}`} style={{
                    display: "inline-flex", justifyContent: "center", alignItems: "center", gap: 7, textDecoration: "none",
                    color: "var(--idea-on-gold)", background: "var(--idea-gold)", border: "1px solid var(--idea-gold)",
                    borderRadius: "var(--idea-radius-full)", padding: "8px 12px", fontSize: "var(--idea-text-xs)", marginTop: 4
                  }}>
                    View inside IDEA
                  </Link>
                  <a href={product.productUrl} target="_blank" rel="noreferrer" style={{
                    display: "inline-flex", justifyContent: "center", alignItems: "center", gap: 7, textDecoration: "none",
                    color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)"
                  }}>
                    Original source <ExternalLink size={12} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <nav aria-label="Catalogue pagination" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: "var(--idea-space-7)", flexWrap: "wrap" }}>
            <button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} style={pagerStyle(page <= 1)}>
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} style={pagerStyle(page >= totalPages)}>
              Next <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </Container>
      <style>{`
        @media (max-width: 680px) {
          .mazloum-toolbar { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Section>
  );
}


function MazloumCardImage({ product }: { product: MazloumProduct }) {
  const [image, setImage] = useState(product.image);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (image || failed) return;
    const controller = new AbortController();

    fetch(`/api/mazloum-detail?url=${encodeURIComponent(product.productUrl)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Image lookup failed");
        const payload = await response.json() as { gallery?: string[] };
        const sourceImage = payload.gallery?.[0];
        if (sourceImage) setImage(sourceImage);
        else setFailed(true);
      })
      .catch((reason) => {
        if (reason?.name !== "AbortError") setFailed(true);
      });

    return () => controller.abort();
  }, [product.productUrl, image, failed]);

  if (!image) {
    return (
      <div className="idea-image-unavailable" style={{ width: "100%", height: "100%" }}>
        {failed ? "Image unavailable" : "Loading image…"}
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={product.name}
      loading="lazy"
      onError={() => { setImage(null); setFailed(true); }}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

const badgeStyle: React.CSSProperties = {
  background: "var(--idea-overlay)", color: "var(--idea-gold-bright)", border: "var(--idea-hairline)",
  borderRadius: "var(--idea-radius-full)", padding: "4px 9px", fontSize: 10, textTransform: "uppercase",
  letterSpacing: ".06em", backdropFilter: "blur(6px)"
};

function filterButton(active: boolean): React.CSSProperties {
  return {
    border: `1px solid ${active ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`,
    background: active ? "var(--idea-gold-soft)" : "var(--idea-surface)",
    color: active ? "var(--idea-gold-bright)" : "var(--idea-text-muted)",
    borderRadius: "var(--idea-radius-full)", padding: "7px 12px", cursor: "pointer"
  };
}

function pagerStyle(disabled: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 7, border: "var(--idea-hairline)",
    background: "var(--idea-surface)", color: disabled ? "var(--idea-text-faint)" : "var(--idea-text)",
    borderRadius: "var(--idea-radius-full)", padding: "9px 14px", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? .55 : 1
  };
}
