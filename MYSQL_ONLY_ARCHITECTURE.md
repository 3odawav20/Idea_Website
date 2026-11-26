# IDEA WEBSITE — PERMANENT MYSQL-ONLY ARCHITECTURE SPECIFICATION

## 1. Non-Negotiable Architecture Mandate

- **Repository**: `https://github.com/3odawav20/Idea_Website`
- **Production Website**: `https://idea-dh.com` (InMotion cPanel hosting)
- **Authorized Backend**: PHP + MySQL ONLY (`PDO` with prepared statements, server-side PHP sessions, `X-CSRF-Token` verification, server-side RBAC).

```text
React / TypeScript / Vite
           |
     HTTPS / JSON
           |
       PHP API (/api/*.php)
           |
         MySQL
```

The browser never connects directly to any database. All authentication (including Google OAuth and social login via `/api/social-auth.php`) and business mutations execute strictly through the PHP/MySQL backend.

## 2. Permanently Prohibited Technologies

Future restoration, installation, import, configuration, or code generation of any of the following is strictly forbidden:

1. **Firebase**: `firebase`, `firebase-admin`, `@firebase/*`, Firebase Auth, Firestore, Firebase Storage, Firebase Realtime Database.
2. **Supabase**: `@supabase/supabase-js`, `@supabase/*`, Supabase Auth, Supabase Storage, Supabase Edge Functions, Supabase Realtime.
3. **PostgreSQL & Drizzle ORM**: `pg`, `postgres`, `drizzle-orm`, `drizzle-kit`, PostgreSQL schemas or connection pools.

## 3. Permanently Retired Paths (Must Never Exist)

- `firebase-applet-config.json`
- `firebase-blueprint.json`
- `firestore.rules`
- `firebase.json`
- `.firebaserc`
- `eslint.config.mjs` (Firebase rules plugin configuration)
- `bun.lock`
- `supabase/`
- `utils/supabase/`
- `src/app/backend/supabaseClient.ts`
- `src/app/backend/storage.ts`
- `src/lib/firebase-admin.ts`
- `src/middleware/auth.ts`
- `src/db/` (`drizzle.config.ts`, `index.ts`, `schema.ts`, `seed.ts`, `users.ts`)
- `server.ts`
- `server/cpanel/api/visualize.php` (retired Supabase visualizer; only `server/cpanel/idea-accounts-api/visualize.php` is authorized)
- `scripts/catalogue/clean_company_sql.py`

## 4. Authorized PHP/MySQL Contracts

The following files define the active production backend integration and must be preserved:

- `src/app/backend/phpAccounts.ts`
- `src/app/backend/apiClient.ts`
- `src/app/backend/dashboardApi.ts`
- `src/app/backend/db.tsx`
- `server/cpanel/api/marketplace.php`
- `server/cpanel/api/social-auth.php`
- `server/cpanel/api/ask-idea.php`
- `server/cpanel/api/tile-dimensions.php`
- `server/cpanel/idea-accounts-api/visualize.php`
- `server/cpanel/idea-accounts-api/platform-ai.php`
- `server/cpanel/idea-accounts-api/platform-ai-surfaces.php`
- `server/cpanel/migrations/`

## 5. Automated Anti-Regression Enforcement

- **Validator Script**: `scripts/verify-mysql-only.mjs` (`pnpm run verify:mysql`)
- **CI Workflow**: `.github/workflows/mysql-only-guard.yml`
- **Build & Staging Integration**: `verify:mysql` runs automatically before production builds and cPanel staging. Any reintroduction of Firebase, Supabase, Firestore, or PostgreSQL immediately fails the build with a non-zero exit code.
