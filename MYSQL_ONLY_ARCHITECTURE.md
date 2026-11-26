# IDEA Website — approved production architecture

## Production target

- Website: https://idea-dh.com
- Hosting: InMotion cPanel
- Backend: PHP 8.3 and MySQL
- Frontend: React, TypeScript, Vite and Tailwind CSS
- Image generation: server-side RunPod integration

## Request flow

```text
React / TypeScript / Vite
           |
       HTTPS / JSON
           |
        PHP APIs
           |
          MySQL
```

The browser communicates only with the site's PHP APIs. PHP owns authentication, server-side sessions, CSRF validation, authorization, persistence, file access and all privileged operations.

## Required invariants

1. MySQL is the single persistent source of truth for accounts, roles, companies, products, private prices, RFQs, quotations, orders, payments, announcements and AI quotas.
2. The server verifies the authenticated user, role, record ownership and company scope for every protected operation.
3. No secret, database credential, RunPod key or privileged token may enter the browser bundle.
4. File uploads must be validated, stored outside public access where required, and served only after server-side ownership checks.
5. AI generation must use the authorized PHP adapter and its verified worker contract. The frontend must not call the provider directly.
6. Existing live data and account identifiers must be preserved. Schema changes require backups, reviewed migrations and explicit release approval.
7. Preview builds are not evidence of successful production authentication, payments, marketplace transactions or image generation.

## Authorized integration points

- Frontend account/session: `src/app/backend/phpAccounts.ts` and `src/app/backend/db.tsx`
- Marketplace and dashboard APIs: `src/app/backend/apiClient.ts`, `src/app/backend/dashboardApi.ts`
- PHP marketplace: `server/cpanel/api/marketplace.php`
- PHP social authentication: `server/cpanel/api/social-auth.php`
- PHP AI adapter: `server/cpanel/idea-accounts-api/visualize.php`
- AI processing: `server/cpanel/idea-accounts-api/platform-ai.php` and `platform-ai-surfaces.php`

## Verification

Run `pnpm run verify:mysql`, `pnpm lint`, `pnpm run build` and the relevant PHP tests before release. Production acceptance additionally requires authenticated tests against the real cPanel/MySQL environment.
