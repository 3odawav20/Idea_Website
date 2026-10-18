# cPanel MySQL activation

Target repository: 3odawav20/Idea_Website. Target domain: https://livefree.support.
The owner selected PHP/MySQL on cPanel instead of Supabase on 18 October 2026.

Continue the existing codex/ceramic-studio-cpanel implementation. No tender-named remote branch was present when inspected.

Import database/mysql-accounts.sql, followed by database/mysql-workflow-extensions.sql, into the confirmed IDEA database after a verified backup. Both use CREATE TABLE IF NOT EXISTS; they do not replace existing records.

The private idea-accounts-config.php file must stay outside the document root. PHP 8.1+ with pdo_mysql and fileinfo is required. Preserve unrelated legacy PHP sites and root handlers; scope the modern handler to the IDEA API directory if necessary.

New features: server-confirmed membership activation/suspension/cancellation, product publishing moderation, exact-product supplier invitations, handwritten vector signatures stored in private database rows, payment terms and revision number, quote acceptance/rejection, atomic single-award protection, and supplier result visibility. These signatures have no certified identity status. Membership activation does not confirm a payment.

Local validation: real PHP 8.3 server with isolated SQLite fixture; registration, role spoof rejection, company approval, fan-out to two matching suppliers, quote privacy, totals, CSRF, logout/login persistence, signature storage, membership authorization, bid acceptance ownership, duplicate award conflict, and revision lock after award passed. Vite production build and PHP lint passed.

Production MySQL and live-domain acceptance must be recorded separately. No local test establishes production availability. Existing customers are preserved; never auto-promote public registrations. The owner identified Ahmad.khaled@gmail.com as the intended administrator; promote only this exact existing account and verify one matching record.
