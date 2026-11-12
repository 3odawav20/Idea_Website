# IDEA consolidated recovery — 2026-11-08

Repository: https://github.com/3odawav20/Idea_Website

Branch: `recovery/idea-consolidated-20261108`. Base: `830a0c813e31b8232b6ee72252196a1d0ecb359b`.

## Included source

- Consolidated company-control donor (`IDEA_Company_Control_20261103`), incorporating the catalogue quarantine, company/admin control, Qwen Runpod adapter, locale, physical tile-size, 3D lighting and brand-film work previously split across PRs 74–80.
- Product-detail gallery from PR 71, merged with manufacturer identity, private-price authorization and recommendations.
- Owner's slim single-row header, navigation drawer and admin announcement integration.
- Arabic Cairo and English Josefin Sans Thin 100, self-hosted with their licenses; responsive wrapping rules.
- Owner-provided dark hero MP4s, local ordinary Git assets: `public/media/hero/idea-dark-desktop.mp4` (1920×1080) and `idea-dark-mobile.mp4` (1280×720), both 19.916667 seconds. Dark mode deliberately has no poster image. One video element switches by theme and viewport. The existing light film is temporary pending the owner's replacement.
- Product detail links in every rendered AI material card. Existing product routes use catalogue slugs; AI links use stable catalogue IDs.
- Retired unused HeroCarousel and TileShowroom components and their styles. The current AI and `/room-designer/3d` routes remain. Original material assets and catalogue source records are preserved.

## Evidence on 2026-11-08

- Local Node checks: 66 tests passed.
- Supplier ingestion Python checks: 17 tests passed.
- Vite production build passed. Large JavaScript chunk warning remains.
- Browser verified English Josefin Sans weight 100; Arabic Cairo/RTL was checked separately. English AI at a 390px viewport had no document horizontal overflow and no measured text overflow in the checked headings, paragraphs, labels and buttons.
- Browser verified dark desktop and mobile playback (`readyState=4`, advancing playback, muted, looping, no controls, no poster, one video element).
- Browser followed an AI material-details link to `/product/acacia-grey-527`; product-section anchors resolved. This is a sample flow, not a claim that every route and external source was manually visited.

## Release boundaries — not completed or certified

- This is a consolidated source/preview release, not proof that the production commerce/AI services work.
- React authentication/company screens currently use Supabase; the historical deployed account system uses PHP/MySQL. Do not create a parallel user database or migrate real accounts silently. The existing MySQL account entry points, helpers/schema and authorized deployment connection must be recovered and reconciled before this UI is a production account replacement.
- PHP/MySQL marketplace and Runpod adapter source is included under `server/cpanel`. Existing `platform.php`/account helper files, real server configuration and approved Runpod worker must be supplied by the existing hosting system. PHP does not execute on a static Vercel deployment.
- No real authenticated AI edit, server-side quota accounting, supplier isolation, paid subscription, payment webhook, OAuth/WhatsApp sign-in or Google/Meta advertising spend was verified in this recovery release. UI controls and source checks do not establish those behaviors.
- 475 existing Art Ceramic catalogue records are separate from 643 supplier candidates in quarantine. The latter are not approved stock, real company accounts or verified inventory; do not add the counts together.
- No new light-mode film has been supplied yet. Offline 3D operation has not been certified; local geometry rendering does not prove availability of every remote texture while offline.
- Dependency audit reports three findings (nested Astra UI React Router and Vite). No forced dependency upgrade was applied to the recovered shared installation.
- Local PHP runtime tests were unavailable; GitHub CI supplies PHP 8.3/GD and must pass before treating those checks as verified.

## Rollback

Keep `main` and its existing deployment intact while reviewing this recovery branch. Git history retains deleted code. Revert the consolidation commit or deploy the prior pinned commit to roll back. Do not remove original database records, hosted assets or backups.
