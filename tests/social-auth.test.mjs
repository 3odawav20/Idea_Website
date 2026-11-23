import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const iconsSrc = readFileSync("src/app/components/SocialAuthIcons.tsx", "utf8");
const socialUiSrc = readFileSync("src/app/components/SocialAuth.tsx", "utf8");
const accountEntrySrc = readFileSync("src/app/pages/AccountEntry.tsx", "utf8");
const accountCssSrc = readFileSync("src/app/pages/AccountEntry.css", "utf8");
const phpClientSrc = readFileSync("src/app/backend/phpAccounts.ts", "utf8");
const phpBackendSrc = readFileSync("server/cpanel/api/social-auth.php", "utf8");
const sqlMigrationSrc = readFileSync("server/cpanel/migrations/20261122_social_auth_mysql.sql", "utf8");
const apiHtaccessSrc = readFileSync("server/cpanel/api/.htaccess", "utf8");
const rootHtaccessSrc = readFileSync("server/cpanel/.htaccess", "utf8");
const buildCpanelSrc = readFileSync("scripts/build-cpanel.mjs", "utf8");
const envExampleSrc = readFileSync(".env.example", "utf8");

test("official crisp SVG brand icons exist for all 6 required providers", () => {
  for (const name of [
    "GoogleBrandIcon",
    "WhatsAppBrandIcon",
    "FacebookBrandIcon",
    "AppleBrandIcon",
    "MicrosoftBrandIcon",
    "XBrandIcon",
  ]) {
    assert.match(iconsSrc, new RegExp(`export function ${name}\\b`), `missing ${name}`);
  }
  // Google 4 authentic brand colors
  assert.match(iconsSrc, /#4285F4/);
  assert.match(iconsSrc, /#34A853/);
  assert.match(iconsSrc, /#FBBC05/);
  assert.match(iconsSrc, /#EA4335/);
  // WhatsApp green, Facebook blue, Microsoft 4-square colors, Apple & X monochrome currentColor
  assert.match(iconsSrc, /#25D366/);
  assert.match(iconsSrc, /#1877F2/);
  assert.match(iconsSrc, /#F25022/);
  assert.match(iconsSrc, /#7FBA00/);
  assert.match(iconsSrc, /#00A4EF/);
  assert.match(iconsSrc, /#FFB900/);
  assert.match(iconsSrc, /fill="currentColor"/);
});

test("SocialAuth renders all 6 providers symmetrically, routes strictly via cPanel PHP/MySQL with zero Firebase, keeps unconfigured providers disabled, and separates WhatsApp OTP from OAuth", () => {
  for (const provider of ["google", "whatsapp", "facebook", "apple", "microsoft", "x"]) {
    assert.match(socialUiSrc, new RegExp(`id: "${provider}"`), `missing provider ${provider}`);
  }
  // Enables providers strictly when confirmed by cPanel PHP backend; keeps unconfigured providers disabled
  assert.match(socialUiSrc, /const isReady = isProviderReady\(item\.id\)/);
  assert.match(socialUiSrc, /disabled=\{!isReady \|\| pending !== null \|\| waBusy\}/);
  assert.doesNotMatch(socialUiSrc, /firebase\/auth|firebase\/app|firebase-applet-config/);
  // WhatsApp uses OTP flow, never OAuth redirect
  assert.match(socialUiSrc, /if \(provider === "whatsapp"\)/);
  assert.match(socialUiSrc, /sendWhatsAppOtp\(/);
  assert.match(socialUiSrc, /verifyWhatsAppOtp\(/);
  // Arabic RTL & English LTR copy present
  assert.match(socialUiSrc, /أو أنشئ حسابك عبر/);
  assert.match(socialUiSrc, /Or continue with/);
});

test("Frontend auth, API client, and backend context contain zero Firebase SDK imports", () => {
  const authPageSrc = readFileSync("src/app/pages/Auth.tsx", "utf8");
  const dbSrc = readFileSync("src/app/backend/db.tsx", "utf8");
  const apiClientSrc = readFileSync("src/app/backend/apiClient.ts", "utf8");
  for (const [label, src] of [
    ["Auth.tsx", authPageSrc],
    ["SocialAuth.tsx", socialUiSrc],
    ["db.tsx", dbSrc],
    ["apiClient.ts", apiClientSrc],
  ]) {
    assert.doesNotMatch(src, /from\s+["']firebase\/|firebase-applet-config|lib\/firebase/, `${label} must not import Firebase`);
  }
  assert.match(authPageSrc, /export function LoginWithGoogleButton\b/);
  assert.match(authPageSrc, /verifyGoogleIdTokenPhp\(/);
  assert.match(authPageSrc, /googleLoginSlot=\{<LoginWithGoogleButton mode="login"/);
  assert.match(authPageSrc, /googleLoginSlot=\{<LoginWithGoogleButton mode="register"/);
});

test("AccountEntry mounts SocialAuth strictly for Customer accounts only (never Business or Admin)", () => {
  assert.match(accountEntrySrc, /import \{ SocialAuth \} from "\.\.\/components\/SocialAuth"/);
  assert.match(
    accountEntrySrc,
    /\{isCustomer\s*&&\s*\(?\s*<SocialAuth\s+mode=\{isRegister\s*\?\s*"register"\s*:\s*"login"\}\s+redirectTo="\/account"\s*\/>/
  );
  // Old placeholder marks are gone
  assert.doesNotMatch(accountEntrySrc, /idea-apple-mark|idea-google-mark/);
});

test("AccountEntry.css defines symmetrical 3-col desktop / 2-col mobile grid and light/dark adaptation", () => {
  assert.match(accountCssSrc, /\.idea-auth-social \.idea-auth-social-grid[\s\S]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(accountCssSrc, /@media\(max-width:520px\)[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(accountCssSrc, /\.idea-auth-scene\.idea-auth-scene--light \.idea-auth-social \.idea-social-btn/);
  assert.match(accountCssSrc, /\.idea-social-icon--mono\{\s*color:currentColor;/);
});

test("phpAccounts client helpers sanitize redirects and fail closed on unavailable providers", () => {
  assert.match(phpClientSrc, /export function sanitizeSocialRedirect/);
  assert.match(phpClientSrc, /startsWith\("\/\/"\)/);
  assert.match(phpClientSrc, /export function getSocialAuthStartUrl/);
  assert.match(phpClientSrc, /export async function socialProviderStatus/);
  assert.match(phpClientSrc, /X-CSRF-Token/);
  // Fail closed: every provider must be strictly compared against boolean true
  assert.match(
    phpClientSrc,
    /google: flags\?\.google === true,\s*whatsapp: flags\?\.whatsapp === true,\s*facebook: flags\?\.facebook === true,\s*apple: flags\?\.apple === true,\s*microsoft: flags\?\.microsoft === true,\s*x: flags\?\.x === true/
  );
});

test("PHP social-auth backend enforces OAuth/OIDC security, buyer-only isolation, CSRF, PKCE, and real WhatsApp OTP", () => {
  // Uses existing cPanel core
  assert.match(phpBackendSrc, /require_once __DIR__ \. '\/platform-core\.php'/);
  // Loads credentials strictly from private config outside public_html
  assert.match(phpBackendSrc, /platformPrivateRoot\(\)/);
  assert.match(phpBackendSrc, /platformSecret\('GOOGLE_CLIENT_ID'\)/);
  // Never embeds real secrets
  assert.doesNotMatch(phpBackendSrc, /GOCSPX-|AIzaSy|EAAG[A-Za-z0-9]/);
  // Enforces PKCE S256, state hashing, single-use consumption, and RS256 JWKS verification
  assert.match(phpBackendSrc, /code_challenge_method'\s*=>\s*'S256'/);
  assert.match(phpBackendSrc, /hash\('sha256', \$state\)/);
  assert.match(phpBackendSrc, /UPDATE idea_social_oauth_states SET used_at = \? WHERE state_hash = \? AND used_at IS NULL/);
  assert.match(phpBackendSrc, /openssl_verify\(/);
  assert.match(phpBackendSrc, /https:\/\/www\.googleapis\.com\/oauth2\/v3\/certs/);
  assert.match(phpBackendSrc, /https:\/\/appleid\.apple\.com\/auth\/keys/);
  assert.match(phpBackendSrc, /https:\/\/login\.microsoftonline\.com\/common\/discovery\/v2\.0\/keys/);
  // Apple ES256 client secret + form_post
  assert.match(phpBackendSrc, /'response_mode'\s*=>\s*'form_post'/);
  assert.match(phpBackendSrc, /socialEcdsaDerToJose/);
  // Strict Buyer-only role isolation (blocks Admin and Supplier linking)
  assert.match(phpBackendSrc, /if \(strtolower\(\(string\) \$existingUser\['role'\]\) !== 'buyer'\)/);
  assert.match(phpBackendSrc, /ADMIN_SOCIAL_LOGIN_DISABLED/);
  assert.match(phpBackendSrc, /\$_SESSION\['idea_user_role'\]\s*=\s*'buyer'/);
  assert.match(phpBackendSrc, /session_regenerate_id\(true\)/);
  // WhatsApp Business Cloud API OTP (non-OAuth) + CSRF + timing-safe hash_equals + rate limit
  assert.match(phpBackendSrc, /https:\/\/graph\.facebook\.com\/v21\.0\/' \. rawurlencode\(\$cfg\['phone_number_id'\]\) \. '\/messages/);
  assert.match(phpBackendSrc, /socialVerifyCsrfFromHeader\(\)/);
  assert.match(phpBackendSrc, /hash_equals\(\(string\) \$otpRow\['code_hash'\], \$expectedHash\)/);
  assert.match(phpBackendSrc, /socialCheckRateLimit\(/);
});

test("MySQL migration is strictly additive and preserves existing tables", () => {
  assert.doesNotMatch(sqlMigrationSrc, /\bDROP\s+TABLE\b|\bTRUNCATE\b|\bDELETE\s+FROM\b/i);
  for (const table of [
    "idea_social_identities",
    "idea_social_oauth_states",
    "idea_whatsapp_otps",
    "idea_social_rate_limits",
  ]) {
    assert.match(sqlMigrationSrc, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`));
  }
});

test("ModSecurity HTTP 406 exception is narrowly scoped to social-auth.php and never disables ModSecurity globally", () => {
  assert.match(apiHtaccessSrc, /<Files "social-auth\.php">/);
  assert.match(apiHtaccessSrc, /<IfModule mod_security2\.c>/);
  assert.match(apiHtaccessSrc, /SecRuleRemoveById 931130/);
  assert.doesNotMatch(apiHtaccessSrc, /SecRuleEngine\s+Off/i);
  assert.doesNotMatch(apiHtaccessSrc, /AuthType|AuthUserFile|Require valid-user/i);
  assert.match(rootHtaccessSrc, /RewriteRule \^api\/ - \[END\]/);
});

test("cPanel build script packages social-auth.php and api/.htaccess and .env.example has no secrets", () => {
  assert.match(buildCpanelSrc, /server\/cpanel\/api\/social-auth\.php/);
  assert.match(buildCpanelSrc, /server\/cpanel\/api\/\.htaccess/);
  assert.match(envExampleSrc, /GOOGLE_OAUTH_CREDENTIALS_FILE=/);
  assert.match(envExampleSrc, /VITE_GOOGLE_CLIENT_ID=/);
  assert.match(envExampleSrc, /WHATSAPP_PHONE_NUMBER_ID=/);
  assert.doesNotMatch(envExampleSrc, /VITE_GOOGLE_CLIENT_SECRET|VITE_FACEBOOK_APP_SECRET|VITE_WHATSAPP_ACCESS_TOKEN/);
});

test("Google Identity Services (GIS) and PHP google-id-token endpoint are wired with the supplied public Web Client ID", () => {
  const gisSrc = readFileSync("src/app/backend/googleIdentity.ts", "utf8");
  const expectedClientId = "248124470809-kfsdd38rgblg2dvd5020j14kgrm0j38p.apps.googleusercontent.com";
  assert.match(gisSrc, new RegExp(expectedClientId.replace(/\./g, "\\.")));
  assert.match(gisSrc, /https:\/\/accounts\.google\.com\/gsi\/client/);
  assert.match(gisSrc, /export async function requestGoogleIdToken/);
  assert.match(phpClientSrc, /export async function socialProviderDetails/);
  assert.match(phpClientSrc, /export async function verifyGoogleIdTokenPhp/);
  assert.match(phpBackendSrc, new RegExp(`IDEA_DEFAULT_GOOGLE_CLIENT_ID\\s*=\\s*'${expectedClientId.replace(/\./g, "\\.")}'`));
  assert.match(phpBackendSrc, /\$action === 'google-id-token'/);
  assert.match(phpBackendSrc, /socialGooglePublicClientId\(\)/);
  assert.match(phpBackendSrc, /socialVerifyOidcIdToken\(/);
});

