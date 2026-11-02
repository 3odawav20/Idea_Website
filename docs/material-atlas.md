# IDEA Material Atlas — AI Room Visualizer

## What ships
- A premium, responsive material catalogue directly below the existing AI Room Visualizer workspace.
- Uses public catalogue products from the existing React store.
- Categories for ceramics, porcelain, natural marble, and overlapping marble-effect patterns.
- Filters for brand, source pattern, finish, size, colour, and full-text catalogue search.
- Incremental rendering in groups of 24 items, suitable for growing supplier catalogues.
- Product selection preserves the exact catalogue ID in the existing URL and brings the workspace back into view.
- Responsive Arabic, English and French text, accessible pressed states and reduced-motion support.

## Source and classification rules
- Never fabricate products or use staging samples in the visualizer.
- The Natural marble category requires a product genuinely classified as natural marble in the source.
- Marble-effect tiles are not necessarily natural marble.
- Missing SKUs, specifications and supplier attributes are displayed as missing, not invented.
- The checked-in Art Ceramic catalogue source contains 475 records; the store also has other data adapters. Live counts are calculated from approved, loaded records.
- Some imported records retain a human-review flag; public display does not substitute for commercial verification.

## Backend and deployment limits
- This feature retains the current submit/poll functionality and PHP Runpod adapter without modifying its unverified worker contract.
- Build and source tests do not prove real authenticated Qwen/Runpod image generation. A production-safe E2E test with the deployed worker is required.
- GitHub CI now tests the material atlas alongside the existing visualizer.
- Building the cPanel bundle is not the same as publishing it. Production automation needs validated deploy secrets, safe backup, health checks and rollback.
