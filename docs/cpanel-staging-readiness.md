# InMotion cPanel staging and release readiness

## Current answer

No dedicated, web-accessible staging environment has been provisioned or verified. Do not use `https://idea-dh.com` or `/home/lsenet5/idea-dh.com` as staging. The repository's `/home/lsenet5/idea_release_staging` path is a private build-release location only; it is not confirmed to have a hostname, document-root mapping, SSL, or a staging database.

| Item | Current evidence | Status |
| --- | --- | --- |
| Production hostname | `idea-dh.com` supplied by the owner | SOURCE_ONLY; not independently checked |
| Production document root | `/home/lsenet5/idea-dh.com` supplied by the owner | SOURCE_ONLY; not independently checked |
| Staging hostname and SSL | No verified value | BLOCKED |
| Staging document root | No web-accessible path verified; `/home/lsenet5/idea_release_staging` is a private build path | BLOCKED |
| Isolated staging MySQL database/user | Not verified; no database was connected to | BLOCKED |
| cPanel SSH/deployment authorization | No usable connection is configured in this workspace; prior authorized SSH attempt failed public-key authentication | BLOCKED |
| PHP account/session modules | `platform-core.php`, `accounts.php`, `platform.php`, and private configuration are not in this checkout | BLOCKED |
| RFQ request/offer/order APIs | No verified PHP/MySQL lifecycle contract is present in this checkout | BLOCKED |

## Verified source behavior

- `.cpanel.yml` invokes `scripts/cpanel-stage-release.sh`; that script creates a unique release under `/home/lsenet5/idea_release_staging` and does not write to `/home/lsenet5/idea-dh.com` or connect to MySQL.
- The cPanel bundle currently contains the React/Vite output and the checked-in `api/visualize.php` and `api/ask-idea.php` files. It does not contain private account configuration or `platform-core.php`.
- `src/app/backend/phpAccounts.ts` expects `/api/accounts.php`, `/api/social-auth.php`, and `/api/platform.php`; those files are absent from the checkout. `server/cpanel/api/marketplace.php` requires a same-directory `platform-core.php`, which is also absent.
- The checked-in marketplace PHP source supports company/product and advertisement operations, but it does not implement the complete RFQ → supplier offers → buyer award → order lifecycle. Current customer/admin RFQ actions fail closed rather than claiming an unverified write succeeded.
- The company control panel now fails closed and has no Supabase calls while the PHP/MySQL company contract is unavailable. Other legacy catalogue, pricing, and promotion UI paths still contain Supabase call sites, but `src/app/backend/supabaseClient.ts` is deliberately disabled (`supabase` is `null`; `requireSupabase()` throws). Those screens are unavailable and are not a verified PHP/MySQL integration.
- The new package manifest records the exact source commit and per-file SHA-256 values, and labels PHP/MySQL account and RFQ readiness as blocked. This is a source/package-integrity check, not staging or live-backend verification.

## cPanel resources required to complete real staging tests

1. **A dedicated staging hostname** selected and created in cPanel, with DNS and valid TLS. The value is not known and must not be guessed from the production domain.
2. **A separate staging document root** assigned to that hostname, with no symlink or alias to `/home/lsenet5/idea-dh.com`. Keep `/home/lsenet5/idea_release_staging` private unless the owner deliberately maps a different, verified web root in cPanel.
3. **An isolated MySQL database and database user** created for staging, with grants limited to that staging database. Confirm it is not the production database before any migration or write test. Use schema-only setup and synthetic test data; do not copy production customer rows.
4. **The real private PHP runtime modules** required by the site, located and reviewed on cPanel: account platform/bootstrap, database connection include, session and CSRF helpers, role/ownership checks, and any route modules. Keep their credentials and session secrets outside GitHub and the public document root.
5. **A staging-only deployment channel**: cPanel Git Version Control permissions or a restricted SSH key, plus a way to identify the cPanel repository's exact checked-out commit. Do not grant this channel access to production database credentials or the production document root.
6. **A PHP runtime inventory** for the staging account: selected PHP version, required extensions (including PDO MySQL if the private implementation uses it), Apache rewrite/header support, upload limits, and session-cookie settings.
7. **Synthetic test identities** provisioned only in staging: buyer, supplier/company owner, supplier manager, a second unrelated buyer/company for isolation tests, and a private admin account with mandatory MFA. Disable public admin self-registration. Social/OAuth/phone methods must remain disabled until their actual server handlers, callback URLs, provider configuration, and verification rules are confirmed.
8. **A protected backup and rollback location** outside all web roots, with enough capacity for the existing document root and private PHP modules. Before a production promotion, cPanel must confirm the current file layout, uploads/mail/config boundaries, and whether the account supports an atomic release switch or requires a preserving copy/restore procedure.

## Read-only cPanel inspection procedure

Run this only in cPanel Terminal or phpMyAdmin after the owner has confirmed the target is the **staging** account/database. Do not use production credentials or execute API writes.

### 1. Discover PHP module locations without printing source

This command prints filenames/paths only and does not execute or display PHP contents:

```sh
find /home/lsenet5 -xdev -maxdepth 7 -type f \\
  \( -name 'platform.php' -o -name 'platform-core.php' -o -name 'accounts.php' \\
     -o -name 'social-auth.php' -o -name 'idea-accounts-config.php' \\
     -o -name 'marketplace.php' \) -print 2>/dev/null
```

Confirm the actual paths in cPanel File Manager. Do not assume the conventional names exist. Do not paste full source files, `phpinfo()` output, configuration files, `.env` files, session data, or SQL query literals into GitHub, v0, logs, or chat.

### 2. Record only sanitized API contract facts

Using the verified source files in cPanel File Manager, produce a short table with **names and types only**:

- relative endpoint path, HTTP method, and action name;
- request query/body field names, types, and required/optional status (no sample values);
- response JSON key names and types, plus HTTP status/error-code names;
- whether a logged-in session and CSRF header are required (header/cookie names only; never values);
- exact role names and company-owner/staff scope checks;
- included private module paths (path names only), and whether each action has persistent writes.

Do not send implementation code, SQL statement bodies, host secrets, database credentials, actual emails/phone numbers, user IDs, session cookies, tokens, or production records. A response contract is not verified until these facts are checked against the implementation and staging responses.

### 3. Inspect staging schema metadata only

In phpMyAdmin, first verify that the selected database is the dedicated staging database. Run the following read-only queries separately. They return table/column/index/constraint metadata only; they do not read application rows or reveal defaults.

```sql
SELECT TABLE_NAME, ENGINE, TABLE_COLLATION
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

SELECT TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION, COLUMN_TYPE, IS_NULLABLE,
       CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE, EXTRA
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, ORDINAL_POSITION;

SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME, INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE
FROM information_schema.TABLE_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME,
       REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE CONSTRAINT_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME, ORDINAL_POSITION;
```

Do not run `SELECT` against business tables, `SHOW CREATE` on production, `mysqldump`, database exports, migrations, or seed/write statements as part of this inspection. If staging is not clearly isolated, stop before running SQL.

## Release and rollback gates

1. A GitHub PR check must pass for the exact 40-character commit SHA. The manual `cPanel release package` workflow builds a tar artifact with a SHA-256 manifest and keeps it separate from production. The cPanel Git deployment hook also builds a unique, private release directory; compare its reported full SHA to the tested GitHub SHA.
2. The private release directory is not a browser staging site. Do not call the release “staging verified” until cPanel maps a dedicated staging hostname/document root to the package and the staging browser tests pass against isolated PHP and MySQL services.
3. Run session/CSRF, role isolation, buyer RFQ submit, matching supplier fan-out, private supplier quotes, buyer award, admin visibility, and failure/rollback checks using only synthetic staging accounts/data. Test Google, Facebook, WhatsApp Business verification, X, Microsoft, and Apple only when the matching server handlers/provider callbacks are configured; UI provider availability alone is not proof of authentication.
4. Production promotion remains blocked until staging tests pass, cPanel documents and verifies a complete backup of the existing files/private modules, a tested rollback is available, and the owner gives explicit final authorization. No production PHP files or database records have been changed by this workflow.
5. A production promotion script cannot safely be finalized from this checkout alone: the current document-root layout, private modules, writable/upload paths, current deployment mechanism, backup target, and rollback/symlink support are not verified. Do not replace the whole document root or overwrite private PHP modules based only on this package.
