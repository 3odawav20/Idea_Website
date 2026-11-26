# IDEA Website development guidelines

## General

- Inspect the current implementation before changing architecture or dependencies.
- Prefer focused changes over broad rewrites.
- Preserve existing user data, product catalogue content, media, URLs and working integrations.
- Do not introduce mock persistence or report a successful operation unless the server confirms it.
- Keep business rules and authorization on the PHP server.

## UI and design

- Reuse the existing IDEA components and design tokens.
- Maintain the approved black/gold night theme and light day theme.
- Keep Arabic layouts RTL and English layouts LTR.
- Check mobile, tablet and desktop breakpoints.
- Support keyboard navigation, visible focus, semantic labels and reduced motion.
- Do not replace approved logos, product imagery or visual references without instruction.

## Backend

- Use the existing PHP/MySQL API contracts.
- Use prepared statements, server-side sessions, CSRF validation and server-side role/ownership checks.
- Keep credentials and privileged operations server-side.
- Preserve tenant isolation between customers, companies and administrators.

## Quality gates

- Run `pnpm run verify:mysql` and `pnpm lint`.
- Run `pnpm run build` after frontend changes.
- Run relevant PHP syntax and behavior tests after backend changes.
- Review the full diff before committing.
