import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const admin=readFileSync("src/app/pages/AdminStudio.tsx","utf8");
const server=readFileSync("server/cpanel/api/visualize.php","utf8");
const section=admin.slice(admin.indexOf("export function AdminVisualizer(){"));

test("admin AI status never uses a Supabase access token or trusts frontend role alone",()=>{
  assert.ok(section.startsWith("export function AdminVisualizer(){"));
  assert.doesNotMatch(section,/requireSupabase|access_token|Bearer /);
  assert.match(section,/session\?\.role!=="admin"/);
  assert.match(section,/credentials:"include"/);
  assert.match(section,/redirect:"error"/);
});

test("admin AI panel displays actual server quota or unknown, never a fake working state",()=>{
  assert.match(section,/setQuota\("—"\)/);
  assert.match(section,/payload\.quota\?\.unlimited!==true/);
  assert.match(section,/value=\{quota\}/);
  assert.match(section,/value=\{provider\}/);
  assert.match(section,/No verified generation/);
  assert.doesNotMatch(section,/value="Unlimited"|value="Runpod"/);
  assert.doesNotMatch(section,/setState\("configured"\)/);
});

test("AI status requires JSON, authenticated GET, server permission and a real masked job to certify",()=>{
  assert.match(section,/response\.headers\.get\("content-type"\)/);
  assert.match(section,/method:"GET"/);
  assert.match(section,/response\.ok/);
  assert.match(section,/real masked-image generation has not been verified/);
  assert.match(server,/function authenticate\(/);
  assert.match(server,/configuration_present_unverified/);
});

test("server role quota policy is not a front-end marketing claim",()=>{
  assert.match(server,/REGULAR_LIFETIME_LIMIT = 5/);
  assert.match(server,/if \(\$admin\) return/);
  assert.match(admin,/Customers: 5 lifetime attempts; suppliers: blocked/);
});
