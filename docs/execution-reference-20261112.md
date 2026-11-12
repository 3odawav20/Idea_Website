# IDEA recovery and execution reference — 2026-11-12

## Controlling scope

Preserve the production PHP/MySQL identity, catalogue, companies, quotations, prices and assets. Keep only the AI visualizer and interactive 3D studio as design tools; retire the old Tile Showroom and duplicate room planners, not commerce/catalogue functionality. Match the owner's supplied header/hero reference. Do not represent disabled integrations or static UI as completed functionality.

## Source inventory

| Source | Verified state | Use |
| --- | --- | --- |
| GitHub main | `830a0c813e31b8232b6ee72252196a1d0ecb359b`, 2026-11-03 | Baseline; not the newest feature work |
| GitHub recovery/idea-consolidated-20261108 | `5451589635ba8b0976f1b7c6882cc140100b8f92` | Latest retrieved consolidated remote; base for this branch |
| GitHub feat/idea-glass-header-hamburger-only-20261108 | Same SHA | Already included; do not merge twice |
| Local previous recovery | `D:/Users/rakan/Documents/Codex/2026-11-02/v/work/idea-consolidated-20261108`, HEAD `dc7e30e` plus uncommitted files | Preserved separately; newer material cache and hero recovered selectively, not overlaid over newer 3D fixes |
| Vercel preview | Deployment `dpl_FypzQFYEhkBCyvHGtLr8JZqtvnFG`, READY, source `5451589` | Static preview, not PHP hosting |
| Figma Make | `2JO061LakfkSpi33fKyC39` | Opened authenticated. Old carousel and backend-integration history visible; linked source-resource reads failed. Complete export/content comparison not completed |
| cPanel production | `/home/lsenet5/idea-dh.com`, plus `/idea-next` preview | Active older deployment; source files and dates observed through File Manager. No deployment performed |

Remote preview: https://idea-website-6xkyc2rov-abdelrahmanamr895-6118s-projects.vercel.app

## Recovered request evidence

- Codex chat **صغ برومبت تنفيذ IDEA احترافي**, ID `01a19bfd-61d3-7392-b5ba-a9267f455956`: latest turn recovered; prior run ended at usage limit with local uncommitted hero/material changes. Remote branch and local worktree independently checked. Older turns remain paginated, not exhaustively read.
- ChatGPT **Branch · Branch · تكملة باك إند المشروع**, ID `6aea67dc-d050-83ea-8fd2-35c90feb9638`: room geometry, camera, surface materials, controllable lighting, realistic kitchen, automatic hero video.
- ChatGPT **Branch · تكملة باك إند المشروع**, ID `6ae9c6da-ab24-83e9-a4cc-3010b52fcffc`: company-specific product and price control, admin company list, monthly sales, announcements, code/brand search, similar products, real registration, advertising packages and media approval.
- ChatGPT **ضبط اللغة والخطوط**, ID `6aeb8faf-7f00-83ea-83f3-ca7468050619`: 26-section admin specification; explicitly a specification rather than deployed features. Remove Tile Showroom, preserve 3D/AI and original catalogue images.
- ChatGPT **تكملة باك إند المشروع**, ID `6ae83d08-a324-83ea-b843-b1824f425d78`: preserve existing hosting/account backend.
- Current supplied four PNG images, header reference and MP4 take priority over older visual instructions.

150 active ChatGPT history summaries were paginated to locate relevant chats. Relevant messages above were read. This is NOT a claim that every message in every active/archived chat was read. Archived history and inaccessible historical attachments remain outside verified coverage.

## Implemented in this isolated branch

1. Latest consolidated remote retained, including removal of duplicate design routes and generic fixture engine.
2. Supplied 1920x1080, 10.026667-second MP4 used by both light/dark hero cycles; two theme-specific stills follow the film. No player controls; muted inline playback, visibility and reduced-motion handling retained.
3. Four supplied PNGs encoded as local WebP; source hashes recorded in `hero-media-20261112.json`. Original files and existing films preserved. Mobile MP4 currently retains the same original 1080p bytes: bundled FFmpeg lacks libx264. No claim of mobile transcoding or reduced bitrate.
4. Header height aligned to 64px; existing drawer/scroll-aware header retained. Exact full pixel parity is not certified.
5. 396 recovered local source tile-face images cover 475 catalogue IDs. AI first-face selection and 3D texture loading prefer the local cache while retaining original catalogue/source records. Other AI face variants may still use their original remote URLs.
6. 3D gallery card proportions follow the selected verified dimensions, instead of a fixed 120px-tall thumbnail box.

## Production blockers proved now

- `GET https://idea-dh.com/api/platform.php?action=features` returned `mail:false`, `runpod:false`, `runpod_model:qwen-image-edit-2511`, Paymob `configured:false`, Bosta `configured:false`, `cod_enabled:false`.
- `GET /api/visualize.php?action=status` returned 404. The new candidate AI frontend calls this endpoint; the live host currently exposes `/api/platform.php` and `/idea-accounts-api` instead. The live studio also displays a missing-service-key warning. Route/contract reconciliation is required, not just a visual patch.
- `Auth.tsx`, `CompanyControlCenter.tsx`, backend provider and route guards in the candidate still depend on Supabase. The live account infrastructure is PHP/MySQL. Shipping this complete frontend as an account replacement would violate the existing identity contract.
- Runpod console opened authenticated, but the inspected Serverless page showed onboarding rather than a verified deployed IDEA worker. No endpoint health, deployed model version, request schema or real inference was proved. No credentials/settings changed and no paid generation started.
- Live main homepage still exposes Tile Showroom links. Live `/idea-next/room-designer/3d` still exposes generic sanitary placeholders and older dropdown material selectors. These are absent from the newer consolidated candidate, but live removal was not deployed.

## Role-by-role execution checklist

Status meanings: **Source only** = code/UI exists, not a verified production capability. **Blocked** = required real service/identity integration is missing or incompatible. **Verified local** = exercised in current browser/process only.

| Role/area | Required behavior | Current evidence / next acceptance check |
| --- | --- | --- |
| Customer identity | Real login/register, correct role and session, recovery, social providers | Blocked: candidate Supabase versus live PHP/MySQL; recover exact accounts contract, then test dedicated customer login without impersonating real users |
| Customer catalogue | SKU/brand/company search, correct sizes/source imagery, similar items | Source only; catalogue preserved. Verify actual API search and deep links across login |
| Customer RFQ | Private requests reach approved companies carrying matching canonical product/variant; buyer selects winner | Source only. Test two eligible suppliers and one ineligible supplier with controlled test records |
| Customer orders | Cart, checkout, orders, invoices, refunds, notifications | Source only; payments/delivery not configured. No fake paid state or sales figures |
| Customer AI | Five lifetime attempts, atomic/idempotent reservations, refund failed jobs, floor/wall/both masks, same dimensions, protected furniture, private outputs, IDEA watermark | Blocked by live Runpod configuration and API contract mismatch; test fifth/sixth attempt, concurrency, job failures, cross-user image isolation and real pixel comparison |
| 3D | Real face-only library, per-wall/floor material, verified physical tile dimensions, lighting/cameras, local save | Verified local: 475 mapped products, loaded local faces, WebGL canvas, selected material and downloaded layout JSON. True offline cold load/reload not certified; no service worker installed |
| Company | Verified company onboarding and own company sidebar/products/brands | Source only; identity bridge required |
| Company catalogue | Add/update products, codes, own private pricing, stock, promotions, publish approval | Source only; verify server authorization and persistence against PHP/MySQL, including cross-company denial |
| Company staff | Owner/manager membership, invitation/revocation, suspension | Source only; do not grant privileges from a client role |
| Company sales | Monthly paid sales, returns and net totals; filters/export | Source only. Compare totals with real payment/order records; no synthetic metrics |
| Company ads | Packages, placement, hero video requests, quality/size guidance and admin review | Source only. Real payment, media validation, storage ownership and scheduling unverified |
| Super Admin | Dashboard, companies, brands, company profiles, product approval, prices/stock, search, recommendations | Source only. 26-section spec recovered; not a completed deployed dashboard |
| Super Admin commerce | Customers, orders, sales, analytics, quotations, payments/invoices, subscriptions | Blocked for paid integrations and session reconciliation |
| Super Admin content | Ads, packages, video ads, announcement bar, media library, site content | Source only. Verify publish/approval and Arabic/English content persistence |
| Super Admin integrations | Google/Meta campaigns, mail, notifications | Not connected/verified; requires actual provider accounts, OAuth and credentials, never simulated campaigns |
| Super Admin security | Roles, per-company permissions, audit history, AI settings/quotas, system settings | Source only. Requires authenticated role tests, CSRF/IDOR checks, DB transaction verification and redacted audit records |

## Dependency order and rollout

1. Preserve and pin all source versions and original media — done locally.
2. Finish bounded hero/material draft with source tests/build/browser evidence — implemented; see verification record.
3. Export/snapshot the exact deployed account/backend source and schema privately, excluding credentials; reconcile PHP session/CSRF/request/response contracts with the frontend. Do not silently provision a replacement Supabase database.
4. Wire/test Customer first, then company-scoped supplier operations, then Super Admin privileges with dedicated test accounts.
5. Configure an approved existing Runpod worker and verify model/schema, masks, dimensions, quotas/refunds and output privacy. Do not create paid workers or persistent API credentials merely to hide configuration errors.
6. Connect payments, mail, delivery and advertising only through real provider setup and isolated test transactions; preserve actual company records.
7. Review all UI routes/actions on Arabic RTL and English LTR, real 390px mobile and desktop; check persistence, authorization and error paths, not build alone.
8. Commit/push a feature branch and review its exact source. Deploy only compatible reviewed slices, with a live-host backup and rollback; do not overwrite account systems.

## Current verification

- 74 Node tests passed after material cache integration; includes source/contract checks, not 74 end-to-end journeys.
- 17 Python supplier-ingestion tests passed.
- Production Vite build and cPanel packaging passed before cache integration; final packaging rerun after integration is recorded separately.
- Browser: supplied film `readyState=4`, advancing time, `muted=true`, `controls=false`; both theme images loaded; English/Arabic header and RTL checked; drawer opened/closed; 3D canvas rendered, local face images loaded and Acacia Grey became selected; layout download produced JSON.
- Viewport override did not actually change `innerWidth` from 1280. Therefore a true 390px browser pass is NOT claimed. Saved Arabic screenshot is desktop-width.
- PHP runtime, live authenticated role isolation, database writes/transactions, real AI generation, payment flows, exhaustive security review and cold offline reload are not verified.

## Rollback

Original worktree remains untouched. Original uncommitted source/media archived separately as `IDEA-local-recovery-20261112.zip`. This branch can be discarded or reverted to `5451589`. No live files, DB rows, secrets or settings were changed. No existing catalogue assets were deleted.
