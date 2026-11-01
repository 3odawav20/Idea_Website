# IDEA – account registration incident and recovery

## Diagnosis (18 Oct 2026)

The user reported a **Failed to fetch** error when clicking Create your account on `https://livefree.support/register`. The prior application imported a generated project ID in `utils/supabase/info.tsx` and silently used `https://<projectId>.supabase.co` when environment values were absent.

The generated project hostname, `wkyvpulectwuaqskmjkr.supabase.co`, failed public DNS resolution (NXDOMAIN on the connected machine), and HTTPS/health requests could not reach it. The connected Supabase integration listed **zero accessible projects**. The Vercel project associated with this repo also had no configured `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` at the time of inspection.

The actual production hostname `livefree.support` resolves to a separate nginx/cPanel origin (192.249.122.240), **not** the Vercel deployment. Updating only the GitHub repo or Vercel does not update that live domain.

## Code changes

- Fail closed if the build has no explicit valid HTTPS Supabase URL/public key. Do not reuse the unreachable generated project ID.
- Catch sign-up, sign-in and password-reset network errors and display a localized, user-facing explanation. Keep entered values intact.
- Add regression checks for the missing-backend failure path.

These changes improve diagnostic correctness and safety; they **cannot provision or restore a backend** on their own. Do not report registration as working until the next steps pass.

## Owner checklist – necessary to restore actual registration

1. In the intended Supabase account, restore the old project (if recoverable) or select/create an **active project** with billing approval when applicable. The project's auth API hostname must resolve via DNS and respond over HTTPS.
2. Confirm that the project's SQL migrations have been applied, including the new-user trigger and RLS policies in `supabase/migrations`. Run these on a backed-up project; do not guess schema state.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (public anon/publishable only) in the environment used by Vite **during the cPanel build**. In Vercel, set both variables for the relevant deployment environments separately if that preview needs login. Never expose a service-role key to the browser.
4. In Supabase Auth > URL Configuration, set Site URL to `https://livefree.support` and allow `https://livefree.support/account` and `https://livefree.support/login` as redirect URLs. Configure email confirmation and SMTP sender limits before enabling OTP email.
5. Build via `npm run build:cpanel`, back up current document root, and deploy the verified `dist/` contents to the **exact** `livefree.support` root. This domain currently runs outside Vercel.
6. Test a NEW customer email on the actual domain, sign up, confirm email (if enabled), sign in, sign out, password reset, profile creation, and a second user's isolation. Inspect Console and Network tab for `/auth/v1/signup` status and CORS. Do not use a real password in support chats or CI logs.
7. Verify user-role trigger, no client-side role escalation, and no accidental test account leaks. Only then mark sign-up live.

## Acceptance gate

- `npm run build:cpanel` passes.
- The browser calls the correct live HTTPS Supabase Auth domain.
- Registration and login succeed with a fresh authorized test account.
- `profiles` and `user_roles` records are created by verified database logic.
- `livefree.support`, not just Vercel, serves the updated assets.

**Current status:** Code patch prepared; backend account access and cPanel deployment remain external requirements. Do not claim the issue is resolved on production until end-to-end verification.
