# IDEA Website

The IDEA marketplace frontend is built with React, TypeScript, Vite and Tailwind CSS. Production identity, marketplace data and business workflows are served by the cPanel PHP/MySQL backend.

## Requirements

- Node.js 22
- pnpm 10.34.3
- PHP 8.3 for backend syntax and integration checks

## Development

```bash
pnpm install --frozen-lockfile
pnpm dev
```

## Verification and builds

```bash
pnpm run verify:mysql
pnpm lint
pnpm run build
pnpm run build:cpanel
```

The cPanel build creates the frontend release bundle. PHP services remain server-side under `server/cpanel/`; do not publish secrets or private server configuration into the frontend bundle.

## Production architecture

- Frontend: React / TypeScript / Vite.
- Backend: PHP APIs with MySQL persistence, server-side sessions, CSRF validation and server-enforced role permissions.
- Image generation: the authorized RunPod adapter, called only from the PHP backend.
- Package manager: pnpm, pinned by `packageManager` and `pnpm-lock.yaml`.
