# IDEA studio locale and typography verification — 2026-11-03

Production: https://idea-dh.com/ai-room-visualizer?locale_fix_version=20261103v2

Scope: correct English/Arabic UI leakage in the **existing** ceramic studio without changing AI, supplier records or the PHP/MySQL account service.

## Verified browser outcomes

- Before: English studio displayed 26 Arabic words, in four text nodes: the IDEA introductory eyebrow, selected-surface guidance, and two tile-selection placeholders.
- After: desktop English (loaded) and 390px English (loaded) had **0 Arabic words** in page text. Arabic mode retained Arabic copy, switched to RTL, and persisted selection in \`localStorage\`.
- 390px: \`documentElement.scrollWidth === clientWidth === 390\` with no horizontal overflow. Header ticker wrapping and small captions updated in CSS revision 2.
- JS/CSS served HTTP 200; exact patch source is stored in \`deploy/cpanel/locale-polish-20261103/\`.
- Local Vite build for the newer studio sources succeeded and 13 previously available visualization/material tests passed. The source patch adds locale-respecting product names, finishes, and filter labels without inventing unverified translations.
- The live fix is intentionally a small injected UI script; the newest Vite source build is NOT directly deployed over the existing MySQL frontend.

## Cache caveat

InMotion NGINX page cache can still return an older HTML shell for unversioned routes. A versioned URL is verified above. Direct server-side \`/purge/\` returned HTTP 403, so cache invalidation via the account's authorized cPanel Cache Manager remains separate. Do not claim all browser caches are clean.

## Reversibility

Production \`index.html\` was backed up under \`/home/lsenet5/idea-deploy-backups/idea-live-locale-before-*.tar.gz\` before the first script injection. Revision 2 includes a \`idea-locale-css-before-v2-*.tar.gz\` backup. Rollback restores \`index.html\` and the revision 1 CSS; do not touch unrelated files.

This UI verification **does not** claim a working Runpod masked generation pipeline or paid account integrations.
