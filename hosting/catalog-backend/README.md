# IDEA Catalog Backend

This package is the durable catalog layer for IDEA. It is designed for shared hosting with PHP 8+, MySQL/MariaDB and cron while the React storefront stays on Vercel.

## Components

- `api.php` — catalog feed, health check, filters and pagination.
- `detail.php` — stored product details, attributes and mirrored images.
- `sync_mazloum.php` — scheduled importer and media mirror worker.
- `schema.sql` — normalized product, image, attribute and sync-run tables.
- `media/` — local copies of supplier product media.

## Hosting configuration

Create a database and user, import `schema.sql`, and expose these environment variables to PHP:

- `IDEA_DB_DSN=mysql:host=localhost;dbname=...`
- `IDEA_DB_USER=...`
- `IDEA_DB_PASSWORD=...`
- `IDEA_CORS_ORIGIN=https://idea-website-two.vercel.app`
- `IDEA_MEDIA_DIR=/home/ACCOUNT/public_html/catalog-media`
- `IDEA_MEDIA_PUBLIC_BASE=https://YOUR-DOMAIN/catalog-media`
- `IDEA_DETAIL_BATCH=60`

The sync worker discovers the current source catalog, normalizes product records into IDEA collections, preserves exact source URLs and values, and mirrors available gallery images to the hosting account.

## Cron

Run the worker from CLI PHP on a schedule, for example every six hours:

`php -q /home/ACCOUNT/catalog-backend/sync_mazloum.php`

The worker never deletes products just because a source is temporarily unavailable. Failed pages remain in the database and are retried on later runs.

## Frontend switchover

Set `VITE_CATALOG_API_BASE_URL` to the public backend directory and redeploy Vercel. Until that variable is set, IDEA continues using the existing Vercel source proxy, so this backend can be deployed and tested without breaking production.
