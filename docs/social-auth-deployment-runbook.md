# IDEA Marketplace — Social Authentication cPanel Deployment & Verification Runbook

## 1. Pre-Deployment Backup (Mandatory)
Before uploading changes to `idea-dh.com`, create a timestamped backup on cPanel:
```bash
TS=$(date +%Y%m%d_%H%M%S)
mkdir -p ~/backups/social-auth-$TS
cp -a ~/public_html/.htaccess ~/backups/social-auth-$TS/
cp -a ~/public_html/api ~/backups/social-auth-$TS/api
mysqldump --single-transaction "$DB_NAME" idea_users > ~/backups/social-auth-$TS/idea_users.sql
```

## 2. Additive MySQL Migration (Non-Destructive)
Apply `/server/cpanel/migrations/20261122_social_auth_mysql.sql` to the existing IDEA database.
It only runs `CREATE TABLE IF NOT EXISTS` for:
- `idea_social_identities`
- `idea_social_oauth_states`
- `idea_whatsapp_otps`
- `idea_social_rate_limits`

Existing `idea_users`, passwords, company/supplier records, and marketplace data are untouched.

## 3. Private Credentials Placement (Outside `public_html`)
Never store credentials inside `public_html`, frontend code, or GitHub.
Place secrets in your cPanel private directory (`platformPrivateRoot()`, e.g., `/home/<cpanel_user>/idea-private/`):

### Priority 1: Google Sign-In (Active via GIS Client ID + Optional Full OAuth Upgrade)
- **Configured Public Web Client ID:** `248124470809-kfsdd38rgblg2dvd5020j14kgrm0j38p.apps.googleusercontent.com`
- **Instant Activation (No Client Secret Needed via Google Identity Services + RS256 JWKS):**
  1. In Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client `248124470809-kfsdd38rgblg2dvd5020j14kgrm0j38p.apps.googleusercontent.com`, ensure **Authorized JavaScript origins** includes:
     - `https://idea-dh.com`
     - `https://www.idea-dh.com`
  2. Deploy `dist/` (including `api/social-auth.php` and `api/.htaccess`) and apply the additive SQL migration. Google Sign-In immediately works via `POST /api/social-auth.php?action=google-id-token` (RS256 JWKS verification, immune to ModSecurity 406 query-string rules).
- **Optional Full OAuth Authorization Code + PKCE Mode:**
  1. Upload your Google OAuth JSON (`client_id` + `client_secret`) to `/home/<cpanel_user>/idea-private/google-oauth.json` with `chmod 600`.
  2. Verify **Authorized redirect URIs** includes:
     `https://idea-dh.com/api/social-auth.php?action=callback&provider=google`

### Remaining Providers (Auto-Unlock When Configured)
- **Facebook (Meta OAuth):** `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
  - Callback URI: `https://idea-dh.com/api/social-auth.php?action=callback&provider=facebook`
- **Apple (Sign in with Apple):** `APPLE_CLIENT_ID` (Services ID), `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY_FILE` (`.p8` stored with `chmod 600` outside `public_html`)
  - Return URL: `https://idea-dh.com/api/social-auth.php?action=callback&provider=apple`
- **Microsoft (Entra ID / Identity Platform):** `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` (`common` or tenant GUID)
  - Redirect URI: `https://idea-dh.com/api/social-auth.php?action=callback&provider=microsoft`
- **X (OAuth 2.0 + PKCE):** `X_CLIENT_ID`, `X_CLIENT_SECRET`
  - Callback URI: `https://idea-dh.com/api/social-auth.php?action=callback&provider=x`
- **WhatsApp Business (Verified Phone OTP — NOT OAuth):** `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_OTP_TEMPLATE` (approved Meta authentication template with 1 body OTP variable), `WHATSAPP_OTP_LANG` (`ar` or `en_US`), `IDEA_OTP_PEPPER` (32+ random bytes).

## 4. Resolving the ModSecurity HTTP 406 Callback Issue
`/server/cpanel/api/.htaccess` adds a narrowly scoped `<Files "social-auth.php">` block that removes ONLY OWASP CRS false-positive rule IDs (`931120`, `931130`, `942100`, `949110`) triggered by Google's `scope=https://www.googleapis.com/...` callback query string. ModSecurity remains active globally across the site.

If your cPanel/WHM server disallows `SecRuleRemoveById` inside `.htaccess`, apply the equivalent narrow WHM ModSecurity exclusion strictly for `/api/social-auth.php`:
```apache
<LocationMatch "^/api/social-auth\.php$">
  SecRuleRemoveById 931120 931130 942100 949110
</LocationMatch>
```
Verify by checking `curl -i "https://idea-dh.com/api/social-auth.php?action=providers"` (must return HTTP `200` JSON) and completing a live Google login callback (must return HTTP `302` to `/account`, never HTTP `406`).

## 5. Rollback Plan
If any issue occurs during cutover:
```bash
cp -a ~/backups/social-auth-$TS/api/* ~/public_html/api/
cp -a ~/backups/social-auth-$TS/.htaccess ~/public_html/.htaccess
```
Because the SQL migration is strictly additive, rolling back application files leaves all pre-existing tables and sessions fully intact.
