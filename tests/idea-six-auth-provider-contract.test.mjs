import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync("server/cpanel/idea-accounts-api/auth/providers/index.php", "utf8");
const config = readFileSync("server/cpanel/examples/oauth-config.php.example", "utf8");
const ui = readFileSync("src/app/components/AccountSocialMethods.tsx", "utf8");

test("PHP readiness endpoint defaults to disabled without a verified MySQL bridge", () => {
  assert.match(api, /\$providers = \[\];/);
  assert.match(api, /\$phone = false;/);
  assert.match(api, /\['bridge_verified'\] \?\? false/);
  assert.match(api, /\['e2e_verified'\] \?\? false/);
  assert.match(config, /'bridge_verified' => false/);
  assert.match(api, /Content-Type: application\/json/);
});
test("readiness endpoint does not return raw secrets or publish config paths", () => {
  assert.match(api, /IDEA_OAUTH_CONFIG_FILE/);
  assert.match(api, /\/home\/lsenet5\/idea_private\/oauth-config\.php/);
  assert.match(api, /\['providers' => \$providers, 'phone' => \$phone\]/);
  assert.doesNotMatch(api, /echo\s+\$config|json_encode\(\$config/);
});
test("frontend looks up canonical PHP index endpoint and never enables unconfigured providers", () => {
  assert.match(ui, /"\/auth\/providers\/"/);
  assert.match(ui, /disabled=\{!isReady \|\| busy\}/);
  assert.match(ui, /disabled=\{!phoneReady \|\| busy\}/);
});
