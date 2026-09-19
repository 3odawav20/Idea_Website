const BACKEND = "https://api.fuzzycell.com/idea-catalog/api.php";
const ALLOWED_ACTIONS = new Set(["health", "products", "product", "collections", "source-feed"]);

export default async function handler(req, res) {
  try {
    const action = String(req.query?.action || "health");
    if (!ALLOWED_ACTIONS.has(action)) {
      res.status(400).json({ ok: false, error: "Unsupported catalog action" });
      return;
    }

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query || {})) {
      if (Array.isArray(value)) {
        for (const item of value) params.append(key, String(item));
      } else if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }
    params.set("action", action);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);

    let response;
    try {
      response = await fetch(`${BACKEND}?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
          "User-Agent": "IDEA-Catalog-Proxy/1.0",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    const body = await response.text();
    res.setHeader(
      "Cache-Control",
      action === "product"
        ? "s-maxage=300, stale-while-revalidate=3600"
        : "s-maxage=60, stale-while-revalidate=600"
    );
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/json; charset=utf-8");
    res.status(response.status).send(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Catalog proxy failed";
    res.status(502).json({ ok: false, error: message });
  }
}
