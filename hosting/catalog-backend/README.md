# IDEA Catalog Backend

This package is designed for shared hosting with PHP 8+, MySQL/MariaDB and cron.

Deployment layout:
- api.php: read-only catalog API
- sync_mazloum.php: scheduled source sync
- schema.sql: database schema
- config.local.php: production-only credentials, never committed
- media/: mirrored product images

The frontend remains on Vercel. This backend owns normalized product data and media copies so IDEA does not depend on supplier uptime at request time.
