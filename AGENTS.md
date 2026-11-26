# IDEA Website — project instructions

IDEA is a production React/TypeScript/Vite marketplace paired with its cPanel PHP/MySQL backend.

## Architecture

- Use the existing React application and shared design tokens.
- Route authentication, account state, permissions and persistent business data through the existing PHP APIs.
- MySQL is the persistent source of truth. Browser code must never connect directly to a database.
- Keep RunPod credentials and all server secrets on the PHP server.
- Enforce role, ownership, CSRF and tenant boundaries on the server; UI checks are not authorization.
- Preserve current catalogue records, product images, company/customer/admin records, orders, quotations, RFQs and existing integrations.

## Design and localization

- Preserve the approved IDEA visual identity and existing day/night themes.
- Keep Arabic RTL and English LTR correct independently.
- Reuse existing components, typography, spacing and color tokens before adding new styles.
- Keep layouts responsive and accessible, including keyboard focus and reduced-motion behavior.

## Verification

Before committing:
1. Run `pnpm run verify:mysql`.
2. Run `pnpm lint`.
3. Run the production build with `pnpm run build`.
4. For PHP changes, run PHP syntax checks and the relevant backend tests.
5. Review the complete diff and confirm no unrelated files or user data changed.

Do not deploy to the live domain unless explicitly requested.
