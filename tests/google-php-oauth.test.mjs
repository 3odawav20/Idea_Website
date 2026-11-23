import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const server=readFileSync("server/cpanel/idea-accounts-api/social-auth.php","utf8");
const entry=readFileSync("src/app/pages/AccountEntry.tsx","utf8");
const social=readFileSync("src/app/components/SocialAuth.tsx","utf8");

test("Google root callback and PKCE match live Google OAuth configuration",()=>{
  assert.match(server,/return 'https:\/\/idea-dh\.com';|return \$uri;/);
  assert.match(server,/code_challenge_method'=>'S256'/);
  assert.ok(server.includes("'code_verifier'=>(string)$flow['code_verifier']"));
  assert.match(server,/hash\('sha256',\$state\)/);
  assert.match(server,/social_flow'/);
  assert.match(server,/expires'=>time\(\)\+600/);
});
test("Google-verified Gmail can link to an existing account without rewriting roles",()=>{
  assert.match(server,/verifiedGoogleMail/);
  assert.match(server,/gmail\\\.com\|googlemail\\\.com/);
  assert.match(server,/SELECT id,role FROM idea_users WHERE email=/);
  assert.match(server,/\$userId=\$existing\['id'\]/);
  assert.match(server,/INSERT INTO idea_auth_identities/);
  assert.match(server,/EMAIL_ALREADY_REGISTERED_SIGN_IN_FIRST/);
  assert.doesNotMatch(server,/UPDATE idea_users SET role/);
});
test("Google login targets real role-based dashboard, including preview route",()=>{
  assert.match(server,/\$role==='admin'\?'\/admin'/);
  assert.match(server,/\$role==='supplier'\?'\/business'/);
  assert.match(server,/return_to/);
  assert.match(server,/\/idea-next\/account/);
  assert.match(entry,/url\.searchParams\.set\("return_to","\/idea-next\/account"\)/);
  assert.match(social,/url\.searchParams\.set\("return_to","\/idea-next\/account"\)/);
  assert.match(entry,/social_error/);
});
test("no Google client credentials exist in the versioned OAuth PHP or React files",()=>{
  for(const body of [server,entry,social]){
    assert.doesNotMatch(body,/GOCSPX-|apps\.googleusercontent\.com/);
  }
});
