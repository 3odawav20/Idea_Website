# Dashboard regression reconciliation — 2026-11-24

The legacy Supabase migration assertions remain in the existing tests. The migrated frontend is now tested against the actual tracked PHP marketplace handler instead of requiring old Supabase RPC calls. These are source contract checks, not authenticated production tests.

Functional fixes: supplier sales and ad queries pass a company selected from the authenticated marketplace bootstrap; admins retain unscoped access. Unreconciled refunds no longer masquerade as verified net sales. Private price review stops silently treating an inaccessible company as an empty result and identifies the bounded 15-company sample.

Remaining feature gaps: the old multi-offer promotion editor is now a read-only private-price review, not a migrated multi-offer CRUD workflow. The PHP advertising path accepts a brief and media kind only; private creative upload, external budget/15% service-fee workflow, and public media publication are not implemented by this contract. Legacy announcement/sponsored components remain inactive or separate; public publication needs verified PHP integration. Do not treat passing source tests as acceptance of these missing capabilities. Production PHP core, auth, schema and live workflows still require authorized verification. No database changes or deployment performed.
