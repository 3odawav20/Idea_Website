# IDEA cPanel release and rollback

## Before deployment
- Confirm the domain and exact Document Root in cPanel Domains; never assume a default path.
- Backup the existing web root, databases and critical DNS/mail settings.
- Confirm Supabase auth Site URL, redirect allow-list, external APIs and live credentials.
- Never put Supabase service-role secrets in Vite frontend variables.

## Build
Install dependencies, then run npm run build. The contents of dist/ (including .htaccess) are the Apache static release. Supabase server functions require their own deployment and are NOT copied as a cPanel backend.

## Staged upload and QA
- Back up prior production files in a dated private location.
- Upload the contents of dist/ to a safe staging host or a verified correct domain root after approval.
- Check HTTPS, deep-link refreshes, browser errors, images, forms and real backend calls.
- Avoid changing unrelated domain files, mail records or databases.

## Rollback
Keep a tested copy of the prior site and its configuration. On failure restore it atomically and re-check HTTPS, assets, deep links and auth redirects. Database changes need their own compatible rollback plan.
