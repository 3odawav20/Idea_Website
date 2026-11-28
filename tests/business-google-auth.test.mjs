import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const php=readFileSync("server/cpanel/api/social-auth.php","utf8");
const section=php.slice(php.indexOf("if ($action === 'google-business')"),php.indexOf("// 1b. Google Identity Services"));
const ui=readFileSync("src/app/pages/AccountEntry.tsx","utf8");
test("Google business registration is gated, CSRF protected and verifies Google identity on server",()=>{
 assert.match(section,/IDEA_BUSINESS_GOOGLE_ENABLED/);
 assert.match(section,/socialVerifyCsrfFromHeader\(\)/);
 assert.match(section,/socialVerifyOidcIdToken\(/);
 assert.match(section,/email_verified/);
});
test("Google cannot upgrade any existing buyer/admin or attach to an existing email",()=>{
 assert.match(section,/\$user\['role'\] !== 'supplier'/);
 assert.match(section,/LOWER\(email\)=\?/);
 assert.match(section,/ACCOUNT_EXISTS/);
 assert.doesNotMatch(section,/UPDATE idea_users/);
});
test("new company is pending, created transactionally, with correct session key",()=>{
 assert.match(section,/\$db->beginTransaction\(\)/);
 assert.match(section,/\$db->rollBack\(\)/);
 assert.match(section,/'submitted'/);
 assert.match(section,/'requested'/);
 assert.match(section,/\$_SESSION\['uid'\]=\$user\['id'\]/);
 assert.match(ui,/isBusiness&&businessGoogle&&<button/);
 assert.match(ui,/verified\.role!=="business"/);
});
