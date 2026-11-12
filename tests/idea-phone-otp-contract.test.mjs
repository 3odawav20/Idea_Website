import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const core=readFileSync("server/cpanel/idea-accounts-api/auth/phone/_phone.php","utf8");
const start=readFileSync("server/cpanel/idea-accounts-api/auth/phone/start/index.php","utf8");
const verify=readFileSync("server/cpanel/idea-accounts-api/auth/phone/verify/index.php","utf8");
const pack=readFileSync("scripts/build-cpanel.mjs","utf8");
const ht=readFileSync("server/cpanel/.htaccess","utf8");
const frontend=readFileSync("src/app/components/AccountSocialMethods.tsx","utf8");

test("SMS sends actual Twilio Verify verification with private credentials",()=>{
 assert.match(core,/https:\/\/verify\.twilio\.com\/v2\/Services\//);
 assert.match(core,/CURLOPT_SSL_VERIFYPEER => true/);
 assert.match(core,/CURLOPT_FOLLOWLOCATION => false/);
 assert.match(start,/ideaPhoneTwilio\('\/Verifications'/);
 assert.match(start,/'Channel' => 'sms'/);
 assert.match(verify,/ideaPhoneTwilio\('\/VerificationCheck'/);
});
test("SMS is fail-closed and cannot directly confer client-supplied roles",()=>{
 assert.match(core,/\['bridge_verified'\] \?\? false/);
 assert.match(core,/\['e2e_verified'\] \?\? false/);
 assert.match(core,/function_exists\('ideaAuthLoginVerifiedPhone'\)/);
 assert.match(verify,/ideaAuthLoginVerifiedPhone\(\$phone,\s*\$audience,\s*\$intent\)/);
 assert.match(verify,/ADMIN_MFA_REQUIRED/);
 assert.doesNotMatch(verify,/\$role\s*=\s*\$audience/);
});
test("Twilio SMS has request binding, origin check, rate limits and no redirects on POST",()=>{
 assert.match(core,/hash_equals\(\$site, \$origin\)/);
 assert.match(core,/SameSite|samesite/);
 assert.match(start,/ideaPhoneRateLimit\('sms_start_ip'/);
 assert.match(verify,/ideaPhoneRateLimit\('sms_verify_phone'/);
 assert.match(start,/session_regenerate_id\(true\)/);
 assert.match(verify,/VERIFICATION_EXPIRED/);
 assert.match(frontend,/\/auth\/phone\/start\//);
 assert.match(frontend,/\/auth\/phone\/verify\//);
});
test("cPanel package ships auth routes without private config or rewriting PHP requests to SPA",()=>{
 assert.match(pack,/server\/cpanel\/idea-accounts-api\/auth/);
 assert.doesNotMatch(pack,/oauth-config\.php/);
 assert.match(ht,/RewriteRule \^idea-accounts-api\/ - \[END\]/);
});
