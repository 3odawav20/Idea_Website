# Editorial homepage

Reference: https://www.cleopatraceramics.com/en/ (reviewed 2026-10-16).

Original IDEA implementation inspired by the reference's full-bleed hero, wide image carousel, alternating image/text stories, look navigation and room designer placement. No Cleopatra logos, copy or image assets are included.

## Images

Created with the built-in image generation tool. Original generated PNGs were converted to 1600×900 WebP website assets in `public/images/featured/`. These are architectural inspiration illustrations, not photographs or certified representations of specific SKUs.

Shared generation instructions: single standalone photorealistic premium architectural interior, landscape 16:9, rich harmonious colours, natural lighting, pristine material details, realistic perspective, no people, text, logos, watermarks, borders or collage. Surface materials must be the visual subject, with generous visible flooring.

Scene prompts:

- `marble.webp`: Grand contemporary hotel lobby, glossy white marble-effect porcelain slabs with dramatic charcoal and gold veining on floor and feature wall, bronze reception desk, camel lounge chairs, distant city windows.
- `ceramics.webp`: Contemporary bathroom with glossy deep teal ceramic wall tiles, ivory ceramic tiled floor, brass fixtures, walnut floating basin cabinet, plants and warm daylight.
- `porcelain.webp`: Top-down editorial view of a living room with broad ivory large-format porcelain slabs with delicate golden onyx veining, grey sofa and ochre cushions, dark round coffee table; floor fills two-thirds of frame.
- `tiles.webp`: Mediterranean entry courtyard with geometric blue and ivory patterned floor tiles, cream plaster, terracotta pots, lush greenery, built-in bench and linen cushions.
- `wood.webp`: Sunlit refined living room with honey oak wood-effect porcelain plank floor, cream curved sofa, muted olive chair, walnut cabinetry, linen and plants.
- `stone.webp`: Serene spa bathroom with large textured warm limestone-effect porcelain tiles, sculptural pale basin, charcoal fixtures, sage greenery and skylight.
- `pattern.webp`: Designer Mediterranean courtyard lounge with geometric blue and ivory ceramic floor tiles, terracotta seating, creamy plaster, plants and filtered sunlight.
- `colour.webp`: Luxurious contemporary bathroom, teal glazed ceramic tile wall, soft blush tiled niche, brass fixtures, ivory terrazzo floor and natural daylight.

## Interaction and catalogue boundaries

The collection rail supports mouse dragging (movement threshold prevents accidental link navigation), native touch scrolling, arrows and keyboard. Autoplay reverses at the ends, pauses on hover/focus and document hiding, and respects reduced-motion preferences. Play/pause controls are explicit.

The existing imported catalogue does not consistently declare material classifications. No product is relabelled by this change. Category covers with no declared matching inventory open the existing inspiration showroom; ceramics and porcelain catalogue routes activate when matching products exist. Tiles covers the ceramic/porcelain families. Natural marble inventory is not certified. Existing sanitary categories and product data remain in their existing catalogue routes.

## Verification

- Production build passes (pre-existing large JS bundle warning).
- `git diff --check` passes.
- Vercel preview successfully deployed.
- Browser observed all four carousel images loaded.
- Mouse drag moved the rail and did not navigate; it paused autoplay.
- English/light and Arabic/dark layouts inspected in desktop browser.
- Initial desktop inspection found header overflow in English at 1363px; responsive navigation breakpoint adjusted to 1400px.
- Initial marble product destination returned zero results; fallback destination added rather than fabricating classifications.
- Physical iPhone and touch-device tests have not been performed.
- Existing footer translations, fixed announcement product count, catalogue completeness, and sanitary image sources are outside this homepage visual change and still need a separate data/site audit.
