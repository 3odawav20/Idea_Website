# IDEA WEBSITE — PERMANENT MYSQL-ONLY ARCHITECTURE

React + TypeScript + Vite frontend paired exclusively with the InMotion cPanel PHP/MySQL backend (`https://idea-dh.com`).

## 1. Authorized Architecture

- **Frontend**: React, TypeScript, Vite, Tailwind CSS (`src/`).
- **Backend**: PHP + MySQL (PDO with prepared statements, server-side sessions, CSRF protection, role-based authorization) in `server/cpanel/`.
- **AI Visualizer**: Authorized RunPod integration via `server/cpanel/idea-accounts-api/visualize.php`, `server/cpanel/idea-accounts-api/platform-ai.php`, and `server/cpanel/idea-accounts-api/platform-ai-surfaces.php`.
- **Single Source of Truth**: MySQL is the ONLY authorized database and backend for all business data (accounts, roles, verifications, companies, products, private prices, RFQs, quotations, orders, payments, announcements, ad requests, and AI quotas).

## 2. Permanently Prohibited Technologies

The following technologies are **permanently prohibited** in this repository and must never be installed, imported, configured, generated, or restored:

- Firebase (`firebase`, `firebase-admin`, `@firebase/*`, Firebase Auth, Firestore, Firebase Storage, Realtime Database)
- Supabase (`@supabase/*`, Supabase Auth, Supabase Storage, Supabase Edge Functions, Supabase Realtime)
- PostgreSQL and PostgreSQL-based Drizzle ORM adapters (`pg`, `postgres`, `drizzle-orm`, `drizzle-kit`)

Never restore or recreate any of these retired paths:
- `firebase-applet-config.json`, `firebase-blueprint.json`, `firestore.rules`, `firebase.json`, `.firebaserc`
- `supabase/`, `utils/supabase/`
- `src/app/backend/supabaseClient.ts`, `src/app/backend/storage.ts`
- `src/lib/firebase-admin.ts`, `src/middleware/auth.ts`, `src/db/`
- `server.ts`, `server/cpanel/api/visualize.php`, `scripts/catalogue/clean_company_sql.py`

## 3. Mandatory Verification Before Every Build, Export, or GitHub Push

Always run:

```bash
node scripts/verify-mysql-only.mjs
node --test tests/*.test.mjs
```

Read `MYSQL_ONLY_ARCHITECTURE.md` and `guidelines/Guidelines.md` before making any changes.
