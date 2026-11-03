# IDEA AI migration release gate — 2026-11-03

Target host: `idea-dh.com`; cPanel document root: `/home/lsenet5/idea-dh.com`.

**Status: LOCAL CANDIDATE ONLY — NOT LIVE OR GENERATION-VERIFIED.**

## Which backend is which

- `server/cpanel/api/visualize.php` — previous React visualizer route, authenticates via **Supabase**. Its successful build is not proof it can authenticate users in the new MySQL installation.
- `server/cpanel/idea-accounts-api/platform-ai.php` — NEW, MySQL account-platform integration candidate. It requires the **existing** IDEA account `platform.php`, `idea_ai_jobs` table, `accountQuery`, `accountCompany`, `accountCustomer`, `platformSecret`, and other platform functions. That host code and schema have **not been retrieved or verified** for `idea-dh.com`.
- `deploy/livefree/20261102/idea-accounts-api/platform-ai.php` — retired historical deployment **source stub**; earlier fallback implementation is available in Git history, not an acceptable deployment file.

## New Runpod-only candidate

- Requires server-only `RUNPOD_API_KEY`, `RUNPOD_ENDPOINT_ID`, and explicit `RUNPOD_WORKER_CONTRACT=idea-qwen-mask-v1`. Never include secrets in browser build, Git, public HTML, or logs.
- Uses the Qwen Image Edit 2511 worker payload and its returned **edited image plus white-on-black edit mask**; rejects remote URL outputs and missing/mismatched/unsafe masks. This code does not assume the Runpod worker exists.
- Only floor, walls or both may be selected. New regular accounts are limited to **5 lifetime attempts**; authenticated platform administrators are unlimited. This is an implementation target, not evidence of live account-policy enforcement.
- Composites the edited region over the original room. Because the existing MySQL platform stores JPEG results, re-encoding can change compression outside the edit region; **exact, bitwise pixel preservation is not established**.
- This candidate now uses asynchronous Runpod `run` submission plus `status/{job}` polling via separate `ai-process` and `ai-job` requests to avoid observed 504 gateway timeouts. This flow has passed source/syntax checks, but NOT a live endpoint test; verify real job recovery, mask, and site limits before release.

## Required cPanel readiness and acceptance tests

1. Confirm `/home/lsenet5/idea-dh.com` is the live document root via DNS, SSL, server response and cPanel domain settings. Take a protected backup/snapshot before replacing any files.
2. Obtain authorized shell/FTP or authenticated cPanel API access. Previous direct SSH attempt to port **2222** failed public-key authentication. Do not use or disclose raw account secrets.
3. Inventory actual MySQL databases/tables and PHP modules. Export/backup current schema and data. Verify `platform.php` functions and user/role/usage tables, rather than inventing mappings.
4. Move the best approved IDEA front end and **working** account API together. Update React auth/visualizer calls from Supabase to the verified MySQL API contract. Do not ship the Supabase-only `/api/visualize.php` as if it were a MySQL bridge.
5. Obtain Runpod endpoint ID and worker contract from the authorized account. Verify one bounded real generation for floor, walls, both, then failure/timeout and cancellation, measuring output and edited-mask geometry. Never route to alternate image providers silently.
6. Test distinct real users: anonymous, buyer with **five** generations and exhausted sixth, supplier/owner limited to five, platform admin unlimited, suspended company/manager denied where applicable, another user's jobs inaccessible.
7. Verify exact tile-only catalogue photography, IDEA product links, manufacturer evidence, high-resolution asset rights and responsive mobile UI. Previously extracted **643 records remain quarantined**; do not publish them by count alone.
8. Test login/signup/password recovery, MySQL admin/company data separation, private prices, advertising requests, monthly sales (verified transactions only), and payment-provider webhooks where configured.
9. Promote only after successful staging browser tests, monitoring and tested rollback. Preserve existing unrelated mail/private files.

## Completed local verification, not production verification

- Source code contains no direct Gemini API fallback in the new MySQL adapter or the packaged Supabase-specific visualizer adapter.
- Static Node regression tests check Qwen-only contract, lifetime quota, mask, credentials, and retired fallback.
- A PHP parser checked the PHP syntax; live PHP execution, MySQL integration and real Runpod generation are **not yet verified**.

## Unresolved dependencies

Production `idea-dh.com` MySQL account platform, valid authenticated cPanel deployment channel, Runpod worker endpoint and key, and real administrator/buyer/company test accounts are required. Do not assert completion without all gates passing.
