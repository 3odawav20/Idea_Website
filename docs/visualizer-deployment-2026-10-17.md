# IDEA Material Studio — deployment & verification (2026-10-17)

Scope: **only** https://github.com/3odawav20/Idea_Website. Do not push this feature to `3odawav/idea_aistudio`.

## Delivered code

- `/ai-room-visualizer?product=<catalogue-id>` selects the **actual published product** and shows its catalogue image.
- Both product cards and product detail pages link directly to the studio with that product ID; the existing separate `/room-designer` is not replaced or modified.
- The retired nonfunctional `AiVisualizer` placeholder was removed; one studio route remains.
- Upload an original room image (JPEG/PNG/WebP, <=10 MB), select surface, room type, tile dimensions, orientation and grout, upload a genuine material image if cross-origin product images cannot be read, and request image generation.
- A real generated image is shown only when the backend returns one; before/after comparison and download work **only** on that returned image. No dummy output/preview is presented as AI generation.
- Uses IBM Plex Sans Arabic and IDEA orange/neutral palette; CSS layouts at desktop, tablet and mobile widths. No original IDEA logo changes.
- A PHP cPanel adapter at `server/cpanel/api/visualize.php` verifies a real Supabase access token on the server, validates uploaded image contents and size, enforces a coarse per-user daily quota, and calls Google Gemini using a **server-side secret**. Uploaded photos are transmitted to Gemini; they are not persisted by this adapter.
- Secrets are intentionally never included in any `VITE_*` variable, Git file or static bundle.

## Build, smoke checks and deployment

Prerequisites: Node 22, npm, cPanel hosting with Apache rewrite support and **PHP >=8.1** plus `curl`, `fileinfo`, and `mbstring` extensions.

From repository root:

```bash
npm install --no-audit --no-fund --no-package-lock
npm run test:visualizer
npm run build:cpanel
```

`dist/` contains `index.html`, assets, `.htaccess`, and a real `api/visualize.php` copied **after** Vite's static build. Upload the *contents* of `dist/` into cPanel's document root for the **specific authorized domain/subdomain**. Do not overwrite other websites or delete an existing website without a verified backup and explicit release scope. SPA routes are rewritten to `index.html`; the API is excluded from this rewrite.

Configure **server-only** environment variables for PHP-FPM/Apache:

| Variable | Required | Meaning |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key held server-side only |
| `IDEA_SUPABASE_URL` | Yes | Existing Supabase HTTPS project URL |
| `IDEA_SUPABASE_ANON_KEY` | Yes | Public Supabase anon key for server-side JWT validation (never service-role) |
| `GEMINI_IMAGE_MODEL` | No | Defaults to `gemini-2.5-flash-image` |

The browser Supabase client must also have its public project configuration and sign-in enabled. Configure secrets in cPanel/Apache/PHP-FPM **outside the document root**, following host support. Confirm `getenv()` exposes the names to PHP without printing values. Never create a public `env.php` or expose keys in `.htaccess` stored in source control. A missing key causes a deliberate HTTP 503, not a mocked image.

**Vercel caveat:** this specific adapter is for PHP-capable cPanel. The Vite build on Vercel **will not execute** PHP. A Vercel-compatible API route or Supabase Edge Function must be added separately if rendering is intended from the Vercel preview.

## Release acceptance (must be checked in production)

1. Test visitor 401, valid authenticated customer token, oversized/wrong MIME images 422/413, and hourly/daily abuse controls (quota currently 8/user/IP/day, with non-distributed temp-file storage).
2. Verify Gemini image generation with a real account, real provider key and a permitted material image; verify status 503 when key is missing.
3. Test Chrome Android and Safari iPhone using actual devices or equivalent automated browser coverage for 320, 360, 375, 390, 414, 768, 1024, 1280, and 1440 CSS px; RTL Arabic, LTR English and French.
4. Test selected product handoff and 404/reload-safe routes on the **real** cPanel deployment; confirm domain returns HTML for `/ai-room-visualizer`, PHP JSON for `/api/visualize.php`.
5. Validate upload consent/privacy notices, third-party media rights, Google Gemini terms, provider quotas/billing and rate limits under the intended launch load. Current PHP temporary-file quota is not shared across multiple servers.
6. Independently QA data, categories, user/customer/business signup, catalogue import and payments; this studio feature does **not** certify those unrelated systems.

## Status

- Frontend integration + cPanel adapter: **implemented**.
- JS static checks: **5 small source-level tests**, useful guardrails but not browser or end-to-end assertions.
- Browser rendering, PHP runtime, Supabase access, Gemini generation and cPanel deployment: **must be verified separately** and must not be reported as completed without actual results.
- Existing source catalogue and payments were **not** modified in this feature branch.
