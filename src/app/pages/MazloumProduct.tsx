import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { Container, Section, Tag } from "../components/ui";

interface MazloumDetailResponse {
  ok: boolean;
  error?: string;
  sourceUrl: string;
  name: string;
  description: string | null;
  sku: string | null;
  brand: string | null;
  gallery: string[];
  breadcrumbs: string[];
  features: { label: string; value: string }[];
  price: string | null;
  priceCurrency: string | null;
  availability: string | null;
}

export function MazloumProduct() {
  const [params] = useSearchParams();
  const sourceUrl = params.get("url") || "";
  const [data, setData] = useState<MazloumDetailResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(sourceUrl));
  const [error, setError] = useState(sourceUrl ? "" : "Missing product source URL.");
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!sourceUrl) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/mazloum-detail?url=${encodeURIComponent(sourceUrl)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as MazloumDetailResponse;
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load product.");
        setData(payload);
        setActiveImage(0);
      })
      .catch((reason) => {
        if (reason?.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Unable to load product.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [sourceUrl]);

  const specs = useMemo(() => {
    const fixed = [
      data?.brand ? { label: "Brand", value: data.brand } : null,
      data?.sku ? { label: "Reference / SKU", value: data.sku } : null,
      data?.availability ? { label: "Availability", value: data.availability } : null,
    ].filter(Boolean) as { label: string; value: string }[];
    return [...fixed, ...(data?.features ?? [])];
  }, [data]);

  return (
    <Section style={{ paddingTop: "var(--idea-space-6)" }}>
      <Container>
        <Link to="/market/mazloum" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--idea-gold-bright)", textDecoration: "none", marginBottom: "var(--idea-space-5)" }}>
          <ChevronLeft size={16} /> Back to Mazloum catalogue
        </Link>

        {loading && <div style={{ padding: "var(--idea-space-8)", textAlign: "center", color: "var(--idea-text-muted)" }}>Loading product details…</div>}
        {error && <div style={{ padding: "var(--idea-space-6)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-lg)", color: "var(--idea-text)" }}>{error}</div>}

        {!loading && !error && data && (
          <>
            {data.breadcrumbs.length > 0 && (
              <div style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", marginBottom: "var(--idea-space-4)" }}>
                {data.breadcrumbs.join(" / ")}
              </div>
            )}

            <div className="mazloum-detail-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "var(--idea-space-7)", alignItems: "start" }}>
              <div>
                <div style={{ aspectRatio: "4/3", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-lg)", overflow: "hidden", background: "var(--idea-surface)" }}>
                  {data.gallery[activeImage] ? (
                    <img src={data.gallery[activeImage]} alt={data.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div className="idea-image-unavailable">Image unavailable</div>
                  )}
                </div>

                {data.gallery.length > 1 && (
                  <div style={{ display: "flex", gap: 10, overflowX: "auto", marginTop: 12, paddingBottom: 4 }}>
                    {data.gallery.map((image, index) => (
                      <button key={image} onClick={() => setActiveImage(index)} aria-label={`Show image ${index + 1}`} style={{
                        width: 84, height: 64, flex: "0 0 auto", overflow: "hidden", padding: 0, cursor: "pointer",
                        borderRadius: "var(--idea-radius-sm)", border: `1px solid ${activeImage === index ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`
                      }}>
                        <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                {data.brand && <div className="idea-eyebrow">{data.brand}</div>}
                <h1 className="idea-display" style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-2xl)", margin: "8px 0 12px" }}>{data.name}</h1>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "var(--idea-space-4)" }}>
                  {data.sku && <Tag>{data.sku}</Tag>}
                  {data.availability && <Tag>{data.availability}</Tag>}
                </div>

                {data.price && (
                  <div style={{ color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-xl)", fontWeight: 700, marginBottom: "var(--idea-space-5)" }}>
                    {data.priceCurrency === "EGP" ? "EGP " : `${data.priceCurrency || ""} `}{data.price}
                  </div>
                )}

                {data.description && (
                  <p style={{ color: "var(--idea-text-muted)", lineHeight: 1.85, marginBottom: "var(--idea-space-5)", whiteSpace: "pre-line" }}>
                    {data.description}
                  </p>
                )}

                {specs.length > 0 && (
                  <div style={{ background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)", padding: "var(--idea-space-4) var(--idea-space-5)", marginBottom: "var(--idea-space-5)" }}>
                    {specs.map((item, index) => (
                      <div key={`${item.label}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: 20, padding: "10px 0", borderBottom: index === specs.length - 1 ? "none" : "1px solid var(--idea-border-neutral)" }}>
                        <span style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>{item.label}</span>
                        <span style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-sm)", textAlign: "end" }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <a href={data.sourceUrl} target="_blank" rel="noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 7, color: "var(--idea-gold-bright)", textDecoration: "none",
                  border: "1px solid var(--idea-gold)", borderRadius: "var(--idea-radius-full)", padding: "9px 14px"
                }}>
                  Open original source <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </>
        )}
      </Container>
      <style>{`@media (max-width: 860px){ .mazloum-detail-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </Section>
  );
}
