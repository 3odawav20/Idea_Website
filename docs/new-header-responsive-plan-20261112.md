# IDEA — New Header / responsive implementation plan (2026-11-12)

## Source of truth
- Owner screenshot: `New Header.png` (user-supplied). The old white double-height navigation must disappear; use one thin black strip with IDEA logo left, truthful catalogue announcement centered, and account controls plus hamburger right. Hero starts immediately **below** it, not behind a transparent overlay.
- Source baseline: `bc4198c9dc2234f2e951df963c77e2ce4914daff`.
- Isolated branch: `fix/idea-new-header-responsive-20261112`; no production deployment or database mutation in this change.
- Authentication/backend target: existing cPanel **PHP/MySQL**. Do not provision Supabase or migrate, destroy, or replace live user/company/admin records.

## Phase 1 — header source changes (implemented in this branch; browser QA pending)
1. Single 52px desktop / 54px mobile black row, owner IDEA logo, source-backed catalogue count, controls and clickable ☰.
2. Former two horizontal navigation strips retained as accessible accordion links **inside** the menu dialog, including website resources and 3D/AI destinations.
3. Hero no longer overlaps header; no old white-bar slot.
4. Mobile: safe-area padding, 44px touch controls, concise icons; hide only favorites from the **header** at <=375px (favorites still accessible in the menu); no forced horizontal scroll.
5. Responsive rules for wide desktop, <=1200px, <=900px, <=680px, <=375px; prefers-reduced-motion and viewport-height fallbacks.
6. Header catalogue text is explicit static fallback, **not simulated daily sales or database-driven admin announcements**. The obsolete Supabase announcement fetch is no longer mounted in Header.
7. Existing account/quote/favorites/search links remain; unchanged logo, hero media, product records, and stored assets.

## Phase 2 — PHP/MySQL migration (NOT implemented here)
- Inspect and back up the actual cPanel `platform.php`, MySQL schema, sessions, CSRF protection, user/company mapping and admin publishing contract.
- Replace Supabase in auth, admin, company, RFQ, and advertisements only against verified PHP/MySQL endpoints and authorization tests. No partial client-side role change or dummy persistent state.
- Restore admin-controlled published announcements only after its MySQL contract is verified; static fallback until then.
- Preserve live marketplace data and use safe staging deployment plus rollback.

## Phase 3 — verification and release gates
- GitHub Actions: Node regression suite, Vite build, cPanel package and PHP syntax checks; report actual results.
- Browser QA (not yet certified): viewport widths **320, 375, 390, 430, 768, 1024, 1440**. Cover English LTR, Arabic RTL, light/dark, scrolling, focus/ESC/backdrop, route transitions, menu accordion, input/search, hero full-bleed and font loading.
- Test WebKit/Safari on iPhone/iPad/macOS as well as Chromium Windows; CSS-source checks are not evidence of actual device results.
- Confirm no severe console/network errors or horizontal overflow, and compare screenshots with `New Header.png`.
- Do not merge into `main` or deploy to `idea-dh.com` until all production gates pass.

## Status
- **Code staged:** Header and CSS; focused static regression tests.
- **Not verified yet:** Actual iOS/macOS Safari, all responsive breakpoints, live MySQL features, build/CI at time of plan creation, and live deployment.
