# IDEA — Execution Register / Release Gates

**Snapshot:** 2026-11-12, source repository `3odawav20/Idea_Website`. This file is the ongoing evidence ledger for the owner's instructions in `docs/IDEA_OWNER_MASTER_DIRECTIVES_20261112.md`. Every finished action must add actual commit, exact tests, deployment target and results; never write "100%" or "no bugs" without exhaustive evidence. Historical facts listed here are dated, not assumed current.

## Verified starting points, 2026-11-12

- GitHub main SHA: `741cc66f99bf1b1d8eb5270499758a4945c86ce8`, `protected=false` (GitHub API).
- GitHub PRs enumerated: 102 total, 39 open, 62 merged, 1 closed without merge (#32). Some merged into feature branches, not main.
- Ruleset `Idea` ID 23468859: `target=tag`, `enforcement=disabled`. It does **not** protect main.
- `SECURITY.md` is a default template referencing irrelevant version 5.1.x, not project-specific vulnerability contacts.
- The repository has `.github/workflows/visualizer-ci.yml` and `catalogue-qa.yml`. Green build is **not** PHP/MySQL full E2E, provider authorization, real payment, cross-company abuse testing, or CodeQL certification.
- GitHub Security endpoints `code-scanning/alerts`, `dependabot/alerts`, `secret-scanning/alerts` could **not** be queried using the current integration. Counts are **UNKNOWN**, not 0. AutoFix PR #53 and #54 are merged, but current alert dispositions are unverified.
- Main's `src/app/backend/db.tsx` directly depends on `requireSupabase`; RFQ create/submit used fire-and-forget with fake pending IDs; accepted offer/order backend unavailable. Current PHP/MySQL candidate `server/cpanel/api/marketplace.php` exists but frontend account state is not migrated to it.
- Draft PR [#103](https://github.com/3odawav20/Idea_Website/pull/103) `07924cbe23cb6ce05d4c22b24a56977d59ad4d8c` improved server-save confirmation, buyer basket preservation, supplier availability, and truthful subtotal labels. GitHub Actions [run 43277407022](https://github.com/3odawav20/Idea_Website/actions/runs/43277407022) succeeded; still Supabase adapter, **NOT approved to merge as complete PHP/MySQL RFQ**.
- Latest documented attempt to create PR #103 Vercel preview was rejected with HTTP **402 `api-deployments-free-per-day`** (>100/day). Prior READY preview is an older SHA `6dae061b`, not latest PR #103.
- Prior host audits (from project docs, NOT revalidated this turn) reported historical 6 users, 2 companies, 0 supplier products, 3 RFQs; no verified paid orders. Do not present those as current production counts.
- Connected Samsung4 device has a Git clone under `C:\Users\rakan\Desktop\_AI_REMOTE_WORK\IDEA_Header_QA_20261112` with **untracked user artifacts**. Preserve all untracked files, existing branch and edits. Remote source worktree path is not evidence of the canonical deployed production source.

## Phase-by-phase release checklist

Legend: [x] **proof-backed milestone done**; [ ] still outstanding / cannot verify. "Source exists" never makes a production checkbox complete.

### P0 — source inventory, backup and governance (release prerequisite)
- [x] Enumerate latest main and review all 39 open PR filenames; grouped into high-risk and bounded candidates. See tables below.
- [x] Commit owner's non-negotiable directives into repo `docs/` on non-production documentation branch.
- [ ] Read-only inventory of **actual cPanel PHP, MySQL schema, existing sessions, live root and media** (without publishing credentials).
- [ ] Verified restorable encrypted cPanel files + SQL backup, checksum/restore plan, baseline Git commit.
- [ ] Protect `main` with reviews, status checks and no force push/deletion; project owner/admin rights required. Do not secretly change rules on another repository.
- [ ] Obtain authorized Security/Dependabot/Secret Scanning access, triage all actual alerts; CodeQL if needed.
- [ ] Record one canonical approved Vercel preview project/domain and ensure SHA parity; API deployment rate limit blocker must be resolved legitimately.

### P1 — authentic PHP/MySQL accounts + 3 exact reference scenes
- [ ] Customer, company and admin screenshot parity (owner's uploaded 3 exact references; **no arbitrary redesign or white replacement**), English-only/Arabic-only in both themes.
- [ ] Unified PHP/MySQL session, password recovery, secure cookie, CSRF and account linking. Replace Supabase client paths **without deleting existing MySQL accounts or hashes**.
- [ ] Multi-company tenant isolation, company approval and suspension, admin MFA, staff grant/revoke. Verify server denies forged role and IDOR.
- [ ] Google, Apple, Microsoft, Facebook, X and phone OTP callbacks/provider readiness. PR #98 (UI) and stacked PR #101 (fail-closed PHP groundwork) are **draft, not live identities**.
- [ ] Test actual account login/signout/recovery/tenancy with dedicated non-sensitive test records in staging.

### P2 — verified marketplace RFQ and purchases (highest business value)
- [ ] Company canonical products and exact manufacturer/SKU/size/finish, approved and paid subscription status, real inventory.
- [ ] Buyer request idempotent transaction, **match only eligible subscribed approved exact suppliers** (never NULL product wildcard); send each private offer invitation and audit record.
- [ ] Supplier bids: saved private amount, qty, shipping, tax, delivery time, terms, expiry; no competitor visibility. Server-check supplier assignment.
- [ ] Buyer compares verified *delivered* price, chooses manually, server atomically accepts once, real order, invoice, payment and delivery; no fake payments or phantom paid revenues.
- [ ] Test 1 buyer / 2 eligible / 1 ineligible / 1 suspended / admin, and concurrent double-submit, permissions, expiry and refunds.
- [x] **PR #103** regression patch written and CI-tested for pending-ID bug; remains draft on legacy Supabase adapter, not deployed and not completed P2.

### P3 — company/admin/control center, campaigns
- [ ] Company-owned products/verified prices/SKUs/employee roles/ads packages and requests, real paid monthly sales, subscriptions, shipping, user notifications.
- [ ] Admin's complete 26-section owner specification: user/company/product approval; pricing/stock, advertising/video/announcements, sales/orders/refunds, access control and audit logs. Build does not certify privilege.
- [ ] External Google/Meta campaign workflows only when authenticated advertiser accounts and accepted pricing are set; never promise live campaigns from sample config.
- [ ] CSV/source imports quarantined until provenance and intellectual-property QA; no same-factory identical product cards and no loss of size/variants.

### P4 — Qwen + Offline 3D
- [ ] Verified private Runpod **Qwen** masked worker, floor/walls only, exact tile physical size, preserve fixtures/scene and async job fail-safe.
- [ ] Server-side 5 lifetime attempts **customer**, unlimited application AI **admin**, **zero company** / visitor; atomic use/refund and cross-user output isolation.
- [ ] 3D standalone Offline materials, accurate tile faces/dimensions and fixtures; test **cold** offline launch, not just local rendering and cache.
- [ ] Avoid unsupported Gemini/other provider substitutions, hardcoded keys or generated room art in tile catalogue.

### P5 — final design/system QA and controlled release
- [ ] One integrated Vercel URL includes customer, company and admin journeys, landing hero/glass header/logo colour, material categories, AI/3D links.
- [ ] Manual + automated AR/EN, RTL/LTR, iPhone Safari, Android and desktop UI/visual tests against owner screenshots; no clipping/inert controls.
- [ ] Real PHP/MySQL staging security, upload, CSRF, XSS, SQLi, tenant isolation, CSRF/session renewal, webhook/payment tests.
- [ ] Production cPanel backup/restoration proof, approved compatible files, exact SHA Vercel preview, deploy to `idea-dh.com`, live smoke tests, logged rollback availability.

## PR triage register — open as verified from GitHub, 2026-11-12

Class codes: `M` mandatory **business requirement but branch NOT necessarily safe to merge**; `O` optional quality/UX; `X` direct merge is dangerous/incompatible/duplicated; `S` security/dependency review before approval. No PR is auto-authorized to merge.

| PR | Class | Decision for current branch |
|---|---|---|
| #103 | M | Keep draft; port save-confirmation to PHP/MySQL; tests green on Supabase candidate |
| #101 | M | Stacked on #98; provider config fail-closed; end-to-end identity validation before enabling |
| #98 | M | Reference UI/provider buttons; visual parity, approved source images, resolve conflicts |
| #94 | O | Smoky discovery glass; visual check against approved colorless-glass decision |
| #90 | X | New Header duplicate/overlap with merged #92; diff before extraction |
| #89 | X | Header changes on older stacked base; avoid outdated CSS overwrite |
| #87 | X | Recovery media overlapping merged #88; cherry-pick only missing assets |
| #82 | S | Rollup package update; validate lockfile, build and security first |
| #80 | O | Cinematic film; verify current hero/approved media before extracting |
| #78 | M | True-size manufacturer tile/mask protection; import only compatible PHP/MySQL contract |
| #77 | M | Bilingual studio/RTL/EN purity; cherry-pick targeted differences |
| #76 | M | Runpod Qwen PHP/MySQL candidate; verify actual worker and service contract |
| #75 | M | Company/admin controls; must eliminate remaining Supabase ownership |
| #74 | M | Supplier QA provenance; quarantined inventory must stay unpublished |
| #71 | O | Product source gallery; preserve exact valid source faces |
| #69 | X | Atlas overlaps merged #68, compare before merge |
| #67 | X | Broad old cPanel frontend+backend rewrite; extract carefully only |
| #66 | X | Old large RFQ/backend set; no whole-branch merge |
| #65 | X | Old broad catalog/backend changes; preserve current source |
| #64 | O | Material reveal decorative, optional and owner visual approval needed |
| #60 | X | 156-file broad legacy platform rewrite; no wholesale merge |
| #59 | S | source-map-js patch; review lockfile and installed dependency tree |
| #58 | O | .figma/backup React Router update only; no production urgency |
| #57 | O | .figma/backup Vite update only; no production urgency |
| #56 | S | Vite 6.4.4 -> 6.4.6 targeted patch; CI/security review, not forced update |
| #50 | X | Legacy cPanel MySQL massive code; API inventory/cherry-pick not overwrite |
| #46 | X | Gemini-based AI conflicts with approved Runpod/Qwen |
| #45 | M | Product-to-AI/3D material handoff; verify exact SKU and face |
| #44 | X | Huge outdated studio/backend; conflicts with modern main |
| #43 | X | Supabase-first account roles, conflicts with MySQL decision |
| #40 | O | Old QA staging sources; reviews usable, never publish staging as real catalog |
| #35 | X | Old storefront redesign; owner has newer approved look |
| #34 | X | Unapproved broadened bath/pool inventory and major UI overhaul |
| #33 | O | Vercel web analytics; privacy review and opt-in as appropriate |
| #31 | X | Legacy cPanel config could overwrite current serving config |
| #28 | O | Image/product filtering; verify it does not hide valid products |
| #26 | O | Old performance improvement, likely superseded by #20 |
| #19 | O | Source import tools; rigorous provenance/QA required |
| #3 | O | Old merchandising PR; avoid restoring outdated layout |

## Code scanning, CI, dependencies

- **Merged** #53 and #54 Copilot Autofix: source hardens image blob URL handling in AI Visualizer. GitHub alert closure **not verified** because security alerts API blocked; a PR merged is not a clean scan.
- Review available Dependency PR #56 Vite 6.4.6, #82 Rollup 4.68.0, #59 source-map-js 1.2.2. Do not blindly apply `npm audit fix --force`, upgrade major React/Three versions or install dependencies unrelated to the current issue.
- Current `SECURITY.md` is default/template, no real reporting channel. Replace only when the owner confirms the security contact / process; don't fabricate one.
- Current workflow tests Node source patterns, PHP lint and some role functions; does not require live MySQL test database, CodeQL, secret scan or successful production CD. Branch-protection status currently false; need separate admin-approved GitHub settings.
- Assess PRs independently. Run `git diff main...branch`, preserve untracked files, use feature branches, test and log exact SHA. Do not label PR as "fixed" solely because it has no obvious conflict.

## End-to-end validation tracker (populate only from actual test results)

| Test | Expected | Current | Evidence |
|---|---|---|---|
| Main branch guarded against direct force-push | yes | BLOCKED | GitHub main `protected=false`; no admin rule change |
| Credentials outside webroot | yes | UNKNOWN live | Do not print secrets; inspect actual private config only via authorized host |
| Existing users survive bridge | 100% | NOT TESTED | MySQL data migration not executed |
| Company reads other company data | 403 | NOT TESTED | Controlled test accounts required |
| Visitor triggers AI | 401/403 | NOT TESTED live | Code source only |
| Company triggers AI | 403 | NOT TESTED live | Code source only |
| Buyer 5th and 6th AI attempts | 5th allowed, 6th blocked | NOT TESTED live | Runpod worker integration needed |
| Admin AI | authenticated, not quota-limited | NOT TESTED live | Admin session required |
| RFQ hits eligible suppliers only | exactly eligible | NOT TESTED | Current matcher needs correction |
| Bid private, quote acceptance once | exact persistence | NOT TESTED | Backend missing |
| Billing/invoices from actual paid orders | exact | NOT TESTED | Merchant webhooks not verified |
| 3 role reference screenshots exact | owner-approved match | NOT TESTED | Refs and all locales/modes needed |
| Vercel preview from intended SHA | SHA match | BLOCKED | Last observed HTTP 402 daily deployments quota |
| cPanel domain release | live 200 + functional journeys | NOT DEPLOYED | no current release/rollback evidence |

## Per-task evidence journal

- **2026-11-12 / Documentation baseline:** New dedicated branch `docs/idea-owner-master-plan-20261112` created from `main@741cc66f`; owner requirements persisted to `docs/IDEA_OWNER_MASTER_DIRECTIVES_20261112.md`. **No commit to main, no production changes, no cPanel MySQL operations.**
- **Next execution:** inspect and protect source, run a release readiness audit, then controlled PHP/MySQL contract inventory with backup; port PR #103 server-confirmed RFQ only after account storage is verified. Every next agent must append timestamp, affected files, verified checks, SHA, preview/live status, and blockers.

**Do not mark milestones complete without evidence.**
