# IDEA PHP/MySQL + Runpod Visualizer — Release QA

## Authoritative production architecture

- The browser calls the same-origin `/api/visualize.php` endpoint.
- The supported PHP/MySQL visualizer adapter source is `server/cpanel/idea-accounts-api/visualize.php`, backed by `platform-ai.php` and `platform-ai-surfaces.php`.
- The obsolete Supabase-backed visualizer adapter has been removed from `server/cpanel/api/` and is not part of the cPanel frontend package.
- The frontend release is deliberately static-only. `scripts/build-cpanel.mjs` packages Vite assets; `cpanel-publish-frontend.py` preserves the live `/api`, `/data`, and `.htaccess` paths. Never overwrite those protected paths as part of a frontend deployment.
- The production PHP core, mail integration, database credentials, and private configuration remain host-managed. They are not copied into the frontend bundle or committed to GitHub.
- The frontend uses PHP/MySQL session-backed authorization. No browser database SDK, external database URL, or database secret belongs in Vite environment variables.

## AI and authorization invariants

- A verified buyer is limited to five lifetime AI generations; a platform administrator is unlimited; suppliers and anonymous sessions are not eligible.
- Runpod endpoint ID, API key, and worker contract are server-only.
- The server validates job ownership and provider output, verifies masks, and composites the edited result through the approved surface mask. The client cannot select an arbitrary output URL or bypass the server composition path.
- Failed or cancelled jobs do not consume lifetime attempts; queued, processing, and completed jobs are accounted for by the MySQL job ledger.

## Deployment gates

1. Run the full GitHub Actions suite, including TypeScript, visualizer/marketplace regressions, PHP syntax, MySQL role-policy tests, and mask-preservation tests.
2. Build the frontend-only cPanel package. Do not package or replace PHP APIs, MySQL data, private configuration, or routing files.
3. Before promoting frontend assets, the cPanel release gate must verify the live `/api/accounts.php?action=health` and `/api/visualize.php?action=health` responses. The visualizer must report PHP/MySQL session authentication and a configured, runtime-ready Runpod provider.
4. Verify the main-branch SHA against the cPanel Git checkout and use the existing backup/rollback mechanism. A successful Vite build alone is not proof that the live PHP/MySQL API is healthy.
5. After promotion, verify the public marketplace, product details, login, buyer AI quota, administrator AI access, and a real Runpod generation without exposing credentials or private data.

## Verification limits

- Repository tests prove source contracts and local PHP syntax; they do not prove that private host-only PHP includes, production MySQL records, live sessions, or the Runpod endpoint are healthy.
- Do not claim the cPanel API was deployed or verified unless the live health responses and a real authenticated generation are observed.
- Never print private credentials, migrate/delete production rows, or replace the protected live API as part of a frontend-only release.
