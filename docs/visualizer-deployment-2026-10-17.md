# IDEA 2030 Material Studio — deployment and verification

## Implemented

- `/ai-room-visualizer?product=<catalogue-id>` retains the real product ID.
- Real catalogue media and metadata are used; missing source assets are not
  replaced by fabricated textures.
- The frontend submits authenticated asynchronous jobs to the cPanel PHP
  adapter and polls actual Runpod states.
- Normal users receive five lifetime accepted attempts on one cPanel node.
  Reservations use server-side file locks and idempotency keys. Failed or
  cancelled jobs are released. Administrators bypass the application quota.
- The adapter requires a same-size edited image and edit mask. It uses the
  original image as the compositing base and copies generated pixels only
  through the approved mask.
- Results with missing masks, invalid images, changed dimensions, provider
  failure, or unsupported worker contracts are blocked.
- The final verified PNG receives a subtle IDEA watermark in the bottom-right.
- The interface supports Arabic RTL, English/French LTR, mobile layouts, light
  and dark themes, reduced motion, before/after comparison, product deep links,
  honest progress states and a quality report.

## Server configuration

Required PHP environment variables:

| Variable | Purpose |
|---|---|
| `RUNPOD_API_KEY` | Private Runpod key; never expose to Vite |
| `RUNPOD_ENDPOINT_ID` | Verified Serverless endpoint ID |
| `IDEA_SUPABASE_URL` | Existing Supabase HTTPS URL |
| `IDEA_SUPABASE_ANON_KEY` | Supabase anon key used with the customer JWT |
| `RUNPOD_WORKER_CONTRACT` | Optional; must equal `idea-qwen-mask-v1` |

Required PHP modules: PHP 8.1+, `curl`, `fileinfo`, `mbstring`, and `gd`.

The Figma Make secret card does not prove that cPanel/PHP-FPM can read the same
values. Configure them outside the document root and confirm `getenv()` works
without printing their values.

## Worker contract

See `docs/runpod-worker-contract-v1.md`. The current endpoint has not been
health-tested from this workspace, and its real model/schema remain unverified.
The UI therefore says “configuration unverified”, never “Connected”.

## Important quota limitation

The requested Supabase service-role key was not provided. The current runtime
therefore uses private cPanel temporary storage plus atomic file locks. This is
server-side and prevents browser/localStorage bypass on a single node, but it is
not a distributed database ledger and will not survive host migration or
temporary-directory cleanup.

Before horizontal scaling or production billing, migrate reservations, jobs,
refunds, admin grants and audit history to transactional database tables using a
server-only privileged credential. Do not grant refund/finalization RPCs to
ordinary authenticated clients.

## Build

```bash
pnpm test:visualizer
pnpm build:cpanel
```

Upload the contents of `dist/` to the authorized PHP-enabled document root.
Back up the current deployment first. The build copies the PHP adapter into
`dist/api/visualize.php`; Vite alone cannot execute PHP.

## Production acceptance still required

- Verify a redacted real Runpod request/response against the deployed worker.
- Confirm the endpoint actually runs the approved Qwen Image Edit version.
- Run floor-only, walls-only and both-surface jobs on genuine room photographs.
- Compare all protected pixels against the original at the original grid.
- Verify the fifth customer attempt succeeds and the sixth is rejected.
- Verify provider failures and cancellations release reservations.
- Verify administrators remain unlimited.
- Test private job ownership across two real accounts.
- Test PHP upload limits, cold starts, timeouts, cancellation and cleanup.
- Test Arabic/English, 320–1440px layouts, Safari iPhone and Chrome Android.

No successful Runpod generation, deployed cPanel runtime, endpoint health,
worker schema, segmentation quality or production pixel-preservation result has
been claimed from this workspace.
