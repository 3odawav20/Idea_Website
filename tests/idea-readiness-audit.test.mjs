import test from "node:test";
import assert from "node:assert/strict";
import { evaluateReadiness } from "../scripts/idea-readiness-audit.mjs";

const files = ({
  "docs/IDEA_OWNER_MASTER_DIRECTIVES_20261112.md": "# IDEA — Owner Master Directives",
  "docs/IDEA_EXECUTION_STATUS_20261112.md": "# IDEA — Execution Register",
  "AGENTS.md": "IDEA OWNER DIRECTIVES",
  "src/app/backend/db.tsx": "const api={acceptOffer: unavailable, createRequest: (r) => ({id: 'pending'})}; const client = requireSupabase();",
  "src/app/pages/BusinessGrowth.tsx": "requireSupabase()",
  "src/app/pages/RequestQuote.tsx": "createRequest()",
  "src/app/pages/Account.tsx": "choose offer",
  "server/cpanel/api/marketplace.php": "function mpNeedCompany() {} accountCsrf();",
  "server/cpanel/idea-accounts-api/platform-ai.php": "RUNPOD_API_KEY",
  "SECURITY.md": "Use this section to tell people",
});

const byId = (result,id) => result.gates.find(x=>x.id===id);

test("detects the legacy Supabase adapter, fake pending IDs and missing order acceptance",()=>{
  const x=evaluateReadiness(files);
  assert.equal(byId(x,"unified-PHP-MySQL-account-client").status,"BLOCKER");
  assert.equal(byId(x,"no-fake-RFQ-success").status,"BLOCKER");
  assert.equal(byId(x,"buyer-acceptance-and-order").status,"BLOCKER");
});

test("presence of PHP source does NOT certify production MySQL security or real payment",()=>{
  const x=evaluateReadiness(files);
  assert.equal(byId(x,"existing-PHP-marketplace-boundary").status,"SOURCE_PRESENT");
  assert.equal(byId(x,"supplier-entitlements-and-tenancy").status,"NOT_VERIFIED");
  assert.equal(byId(x,"payments-invoices-webhooks").status,"NOT_VERIFIED");
  assert.equal(x.summary.production_ready,false);
});

test("protects owner directives and flags placeholder security policy",()=>{
  let x=evaluateReadiness(files);
  assert.equal(byId(x,"owner-source-of-truth").status,"SOURCE_PRESENT");
  assert.equal(byId(x,"security-policy").status,"BLOCKER");
  x=evaluateReadiness({...files,"docs/IDEA_OWNER_MASTER_DIRECTIVES_20261112.md":""});
  assert.equal(byId(x,"owner-source-of-truth").status,"BLOCKER");
});

test("even without obvious Supabase text, manual live security gates remain UNVERIFIED",()=>{
  const x=evaluateReadiness({
    ...files,
    "src/app/backend/db.tsx":"native API bridging; awaiting PHP response",
    "src/app/pages/BusinessGrowth.tsx":"real company endpoint",
    "SECURITY.md":"IDEA contact information pending owner confirmation",
  });
  assert.equal(byId(x,"unified-PHP-MySQL-account-client").status,"NOT_VERIFIED");
  assert.equal(byId(x,"main-branch-protection").status,"NOT_VERIFIED");
  assert.equal(byId(x,"code-scanning-alerts").status,"NOT_VERIFIED");
  assert.equal(byId(x,"production-backup-and-domain").status,"NOT_VERIFIED");
  assert.equal(x.summary.production_ready,false);
});

test("returns only expected statuses and never implies source presence means completed service",()=>{
  const x=evaluateReadiness(files);
  assert.equal(x.gates.length,14);
  assert.ok(x.gates.every(g=>["SOURCE_PRESENT","BLOCKER","NOT_VERIFIED"].includes(g.status)));
  assert.ok(x.gates.every(g=>g.id && g.detail && g.evidence));
});
