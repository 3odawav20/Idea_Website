# IDEA Egypt — Six identity providers: configuration and deployment contract

Status: **provider UI + fail-closed readiness API prepared**. **NOT enabled in production**. Never equate a branded button with working authentication.

Production origin: `https://idea-dh.com`.
Legacy authoritative identities: **the current cPanel PHP/MySQL `idea_users` database**. Do not switch to the existing Supabase demo session model; do not overwrite `platform.php` or `platform-core.php`.

## Provider control-plane registration (owner account)

| Login option | Owner developer portal | Required app type/settings | Planned callback (not yet deployed) |
| --- | --- | --- | --- |
| Google | https://console.cloud.google.com/auth/clients | Google Auth Platform > external audience > Web client, `openid email profile` | `https://idea-dh.com/idea-accounts-api/oauth/google/callback` |
| Facebook | https://developers.facebook.com/apps/ | Meta Login / Facebook Login for website, valid OAuth redirect URI; request `email`, `public_profile` only | `https://idea-dh.com/idea-accounts-api/oauth/facebook/callback` |
| Apple | https://developer.apple.com/account/resources/identifiers/list | Paid Apple Developer membership, primary App ID + Services ID, Team ID, Key ID, private `.p8`; registered website domain | `https://idea-dh.com/idea-accounts-api/oauth/apple/callback` |
| X (Twitter) | https://console.x.com/ | OAuth 2.0 authorization-code with **PKCE**, web app, `users.read`, `tweet.read` only as required for users/me; API-access tier may have cost | `https://idea-dh.com/idea-accounts-api/oauth/twitter/callback` |
| Microsoft | https://entra.microsoft.com/ | Entra App registration > Authentication > Web, choose multitenant + personal MS accounts where supported, `openid profile email` | `https://idea-dh.com/idea-accounts-api/oauth/azure/callback` |
| Phone OTP | https://www.twilio.com/console | Twilio Verify Service, SMS delivery support/cost for Egypt, API Key + secret + Verify Service SID | POST `https://idea-dh.com/idea-accounts-api/auth/phone/start` then `.../verify` |

All callback URLs above are **planned exact strings**: register them with providers only after the corresponding PHP callback route is implemented and reachable on the production origin. Apple often uses a POST callback (`response_mode=form_post`), which needs robust cross-site state and cookie handling. X does not guarantee email; use immutable provider user IDs, never match by display name.

## Deployment into cPanel

1. Confirm the current live `/home/lsenet5/idea-dh.com/idea-accounts-api/platform.php` and `platform-core.php` behavior. The GitHub repository **does not contain the complete live authentication platform source**. Obtain a secure backup and inspect account/session/database integration before modifications.
2. Keep private credentials **outside web root**, e.g. `/home/lsenet5/idea_private/oauth-config.php`. The checked-in `server/cpanel/examples/oauth-config.php.example` intentionally has blank values and all flags off. Restrict owner-only file permissions. Protect the Apple private signing key similarly.
3. Deploy `server/cpanel/idea-accounts-api/auth/providers/index.php` so that GET `https://idea-dh.com/idea-accounts-api/auth/providers` returns only `{"providers":[],"phone":false}` until actually ready. This is a readiness interface, **not an OAuth callback implementation**.
4. Implement OAuth provider begin + callback, with cryptographic `state`, `nonce`, `PKCE` where applicable, exact redirect validation and short expiry. Exchange authorization codes on the server, validate ID token issuer/audience/signature/JWKS, not just unsigned payloads.
5. Link `(provider, immutable_subject)` to one existing MySQL IDEA user; enforce unique provider+subject mapping and authenticated linking. **Never auto-link solely by unverified email**; never grant `admin` or `business` roles from user-controlled OAuth input. A new supplier remains pending approval.
6. Issue/revoke the real existing PHP session used by `platform.php` (`HttpOnly Secure SameSite` and rotation at login). Implement verified SMS OTP via Twilio Verify with E.164, anti-bot/rate limits, per-number and per-IP throttles, replay prevention; user-account mapping must happen **after server verification**.
7. Test a real, consented user on all 6 methods, password login regression, company/admin role boundaries, logout, session refresh, denied consent, incorrect state, token invalid, duplicate account linking and security logs.
8. Set `bridge_verified=true` and the individual `e2e_verified=true` **only for providers whose complete test passed**, then confirm readiness endpoint and live login.
9. Preview React on Vercel before release, but never assume Vercel PHP execution or use Vercel local session as proof of production login. Do not merge or publish PHP backend over existing cPanel files until safe staging/backup tests pass.

## Public frontend configuration

The current customer, business and admin UI consumes:
- `VITE_IDEA_ACCOUNT_API=https://idea-dh.com/idea-accounts-api` at build time (production only after origin and CORS policy are configured).
- `GET /auth/providers` -> `{"providers":["google","facebook","apple","twitter","azure"],"phone":true}` only when verified.
- `GET /oauth/{provider}?audience=customer|business|admin&intent=login|register`.
- `POST /auth/phone/start` and `POST /auth/phone/verify`.

**Admin social login** must be restricted to an existing admin account and server-enforced MFA. Any sign-in method can authenticate identity, but must NEVER self-assign privileges.

## Exact remaining ownership gates

- **Owner may be needed to sign in or accept terms** on each Google/Meta/Apple/Microsoft/X developer dashboard. Creating these app registrations is not possible just with a cPanel API Token.
- **Apple may require an active paid developer membership; X API tier and SMS transport may have costs.** Do not subscribe, pay or upgrade without explicit expense approval.
- A working provider app requires an actual PHP backend callback/session adapter, developer credentials and registered callback, all tested on `idea-dh.com`. None has yet been independently verified.
- cPanel login session observed expired. No cPanel production changes authorized by this source-only commit.
