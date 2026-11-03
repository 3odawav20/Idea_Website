# IDEA Company Control & Advertising — 2026-11-03

Status: feature branch and preview only. NOT LIVE. Connected Supabase project is INACTIVE. This migration has not run on any database.

## Features implemented in code
- Admin /admin/companies: company rail; brands and private supplier product listings; private prices, promotions; approve/suspend company and approve/revoke delegated manager. Supplier can only manage own verified company.
- Business /business/products: company-scoped product listing and price management. Products remain unpublished unless the platform admin separately approves them.
- /business/apply: buyer account submits a new pending application. Real supplier role assigned only after platform-admin verification.
- Admin /admin/sales and supplier /business/sales: paid confirmed monthly sales, refunds, and net totals. No fabricated sales, no quotes counted as revenue. External verified payments must be integrated to populate ledger.
- /admin/search: exact catalogue or source SKU or IDEA reference lookup and administrator-private price.
- /admin/announcements: Arabic + English (+ optional French) ticker controlled exclusively by admin, sticky within Header, mobile and reduced-motion support.
- /admin/advertising and /business/ads: Top Line, New Collections, Home Hero MP4, Google Ads and Facebook/Instagram campaign REQUESTS, with approval and private file-review workflow.
- Homepage placements read from a sanitized public-ad table. Supplier campaign budgets and their private files are never part of public ad records.
- Shop catalogue search matches names, source code, IDEA code, manufacturer or brand. Similar products are ranked by material, size, pattern, finish, colors, brand and family, but NOT by hidden price.

## Technical specs
Top Line: image 1600x240 WebP/JPG, max 5MB.
New Collections: image 1200x1200 WebP/JPG, max 5MB.
Home Hero Video: MP4 1920x1080 (16:9), duration 6–20 seconds, max 40MB. Files uploaded into a private Supabase Storage bucket for admin review, not publicly shown until manual approval and approved public URL.
Google/Meta Ads: external spending and targeting requires account ownership, business approvals, OAuth/API credentials and campaign budget consent. Clicking IDEA approval does not call those ad networks.
IDEA proposed media management fee 15% of actual external ad spend (business proposal, not a quoted Google or Meta price). Internal website placements are subject to admin quotation, not a fabricated market price.

## Authentication
SocialAuth supports real Supabase OAuth calls to Google, Facebook, Apple, Twitter/X and Microsoft/Azure but buttons are only shown when VITE_AUTH_PROVIDERS is configured and auth is live. SMS OTP can be enabled when configured. WhatsApp Business verification is not built in. No OAuth or phone connection is claimed live. Real supplier/customer subscription payments need a verified billing and webhook integration.

## Safety and required deployment
Migration: supabase/migrations/20261103130000_company_control_center.sql
Before applying: verify the correct live database, take a backup, reconcile migration history, review RLS/security advisors. This migration changes company membership, listing approvals, private financial data and campaign permissions: do not automatically apply it to a different or inactive project. Test anon, Supplier A, Supplier B, suspended supplier, revoked manager, platform admin and real storefront. SQL was not applied/tested on live Supabase in this batch.
The 643 unapproved supplier candidates from earlier PR are not auto-registered as company accounts and no supplier price has been made public.

## Proposed IDEA onsite advertising rate cards (administrator-only draft)

These are proposed internally editable IDEA placement prices, NOT network media prices. Seeded UNPUBLISHED: no price is public until an admin approves.
- Home top line: 2,500 EGP for 7 days.
- New collections: 4,500 EGP for 14 days.
- Homepage hero video: 9,000 EGP for 7 days.
- Google/Meta: actual third-party spend (not fixed), plus a proposed 15% IDEA management fee, with customer approval before any spend.
- Admin can edit and publish prices independently from approving supplier advertising creatives.

## Verification boundaries

Migration SQL was parsed by PostgreSQL parser pglast, but it was NOT applied to a live database.
Connected Supabase project was INACTIVE; no tenant RLS or real supplier/admin credentials could be tested.
Monthly sales use security-invoker server aggregation and Africa/Cairo calendar month boundaries with no 1,000-order truncation.
Sales are not yet populated by a verified payment gateway. No live OAuth, real campaign placement, customer billing or external ads were activated.
Local Chrome checked desktop/mobile company application, anonymous admin redirect, and product search. This is not a logged-in E2E test.
No production deployment, company approval, real payments or advertisement publish occurred.
