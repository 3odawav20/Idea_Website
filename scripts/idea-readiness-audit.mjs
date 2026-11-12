/**
 * IDEA release readiness: static, offline, READ-ONLY source audit.
 *
 * Checks candidate code, never calls remote endpoints, reads secrets, mutates DB,
 * installs dependencies, or certifies a production service. --strict exits 1
 * when any BLOCKER / NOT_VERIFIED requirement exists. Normal mode reports only.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_FILES = [
  "AGENTS.md",
  "docs/IDEA_OWNER_MASTER_DIRECTIVES_20261112.md",
  "docs/IDEA_EXECUTION_STATUS_20261112.md",
  "src/app/backend/db.tsx",
  "src/app/pages/Account.tsx",
  "src/app/pages/RequestQuote.tsx",
  "src/app/pages/BusinessGrowth.tsx",
  "server/cpanel/api/marketplace.php",
  "server/cpanel/idea-accounts-api/platform-ai.php",
  "SECURITY.md",
];

const item = (id, status, detail, evidence) => ({ id, status, detail, evidence });

/**
 * Pure evaluator allows regression tests without touching the filesystem.
 * `source` is an object mapping repository paths to strings or null.
 */
export function evaluateReadiness(source) {
  const own = source["docs/IDEA_OWNER_MASTER_DIRECTIVES_20261112.md"] || "";
  const status = source["docs/IDEA_EXECUTION_STATUS_20261112.md"] || "";
  const agents = source["AGENTS.md"] || "";
  const backend = source["src/app/backend/db.tsx"] || "";
  const buyer = source["src/app/pages/RequestQuote.tsx"] || "";
  const account = source["src/app/pages/Account.tsx"] || "";
  const company = source["src/app/pages/BusinessGrowth.tsx"] || "";
  const mysql = source["server/cpanel/api/marketplace.php"] || "";
  const ai = source["server/cpanel/idea-accounts-api/platform-ai.php"] || "";
  const security = source["SECURITY.md"] || "";

  const gates = [
    item("owner-source-of-truth",
      own.includes("Owner Master Directives") && status.includes("Execution Register") && agents.includes("IDEA OWNER DIRECTIVES")
        ? "SOURCE_PRESENT" : "BLOCKER",
      "Persist owner instructions, execution evidence and agent entrypoint in repository.",
      "docs/IDEA_OWNER_MASTER_DIRECTIVES_20261112.md; docs/IDEA_EXECUTION_STATUS_20261112.md; AGENTS.md"),
    item("unified-PHP-MySQL-account-client",
      /requireSupabase|supabase\.auth|@supabase\//i.test(backend + company) ? "BLOCKER" : "NOT_VERIFIED",
      "Frontend identity/role/commerce must use the existing production PHP/MySQL contract; absence of a Supabase import is not evidence of working MySQL sessions.",
      "src/app/backend/db.tsx; src/app/pages/BusinessGrowth.tsx"),
    item("no-fake-RFQ-success",
      /id:\s*["']pending["']|createRequest:\s*\(r\)\s*=>|submitOffer:\s*\(offer\)\s*=>/.test(backend)
        ? "BLOCKER" : "NOT_VERIFIED",
      "Do not clear quote basket or report a saved request/offer before the server returns an actual persisted ID. Confirm through real integration tests.",
      "src/app/backend/db.tsx; src/app/pages/RequestQuote.tsx"),
    item("buyer-acceptance-and-order",
      /acceptOffer:\s*unavailable/.test(backend) ? "BLOCKER" : "NOT_VERIFIED",
      "Buyer must choose quote and complete atomic, server-validated order. A frontend-only button is not enough.",
      "src/app/backend/db.tsx; src/app/pages/Account.tsx"),
    item("existing-PHP-marketplace-boundary",
      /accountCsrf\(/.test(mysql) && /mpNeedCompany\(/.test(mysql)
        ? "SOURCE_PRESENT" : "BLOCKER",
      "cPanel candidate contains scoped company and CSRF checks, but live sessions/permissions are NOT verified by this script.",
      "server/cpanel/api/marketplace.php"),
    item("AI-mysql-runpod-source",
      ai.includes("RUNPOD_") || ai.includes("runpod") ? "SOURCE_PRESENT" : "NOT_VERIFIED",
      "Runpod/MySQL adapter source exists if detected; actual mask worker, jobs, quotas, privacy and API contract need live tests.",
      "server/cpanel/idea-accounts-api/platform-ai.php"),
    item("security-policy",
      /Use this section to tell people|Tell them where to go|5\.1\.x/.test(security)
        ? "BLOCKER" : "NOT_VERIFIED",
      "SECURITY.md is a generic template. Only owner-approved real reporting process may replace it.",
      "SECURITY.md"),
    item("approved-three-auth-screenshots", "NOT_VERIFIED",
      "Owner's customer/company/admin screenshots must be pixel-reviewed in AR/EN and day/night at mobile and desktop widths.",
      "owner supplied reference images; account routes"),
    item("supplier-entitlements-and-tenancy", "NOT_VERIFIED",
      "Verify exact manufacturer/SKU/variant, approved active subscription, private bids, no cross-company IDOR, staff roles and audit.",
      "live/staging PHP/MySQL + controlled multi-role test accounts"),
    item("payments-invoices-webhooks", "NOT_VERIFIED",
      "Accept supplier offer exactly once; verified payment/refund/shipping events and no phantom revenue.",
      "actual payment and delivery integration"),
    item("AI-role-quota-e2e", "NOT_VERIFIED",
      "Customer exactly 5 lifetime requests, anonymous/company zero, admin unlimited; idempotent reservations and failed-job refunds.",
      "actual PHP/MySQL test users + Qwen Runpod masked worker"),
    item("main-branch-protection", "NOT_VERIFIED",
      "Require real GitHub branch rules: no force push, required checks, reviewers. Static files cannot verify GitHub settings.",
      "GitHub repository settings / branch protection API"),
    item("code-scanning-alerts", "NOT_VERIFIED",
      "Need permission to inspect open/closed Code Scanning, Dependabot and Secret Scanning alerts; inaccessible does not mean zero.",
      "GitHub Security alerts UI/API"),
    item("production-backup-and-domain", "NOT_VERIFIED",
      "Do not ship until restorable cPanel/MySQL backup, exact-Vercel-SHA preview, source reconciliation, rollback and live smoke tests.",
      "cPanel production + Vercel deployment metadata"),
  ];
  return {
    project: "IDEA",
    scope: "offline static source; cannot certify live services",
    summary: {
      blockers: gates.filter(g => g.status === "BLOCKER").length,
      unverified: gates.filter(g => g.status === "NOT_VERIFIED").length,
      source_present: gates.filter(g => g.status === "SOURCE_PRESENT").length,
      production_ready: false,
    },
    gates,
  };
}

export function collectSources(root) {
  const source = {};
  for (const relative of SOURCE_FILES) {
    // Read *only* the curated code and instruction files. In particular, never
    // inspect .env, local secrets, keys, user files or runtime token stores.
    try { source[relative] = readFileSync(resolve(root, relative), "utf8"); }
    catch (error) { if (error?.code !== "ENOENT") throw error; source[relative] = null; }
  }
  return source;
}

const executed = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (executed) {
  const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
  const result = evaluateReadiness(collectSources(root));
  if (process.argv.includes("--json")) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } else {
    process.stdout.write("IDEA RELEASE READINESS: NOT CERTIFIED (static/source-only)\n");
    for (const g of result.gates) process.stdout.write("[" + g.status + "] " + g.id + " — " + g.detail + "\n");
    process.stdout.write("Blockers: " + result.summary.blockers + " | Unverified: " + result.summary.unverified + "\n");
  }
  if (process.argv.includes("--strict") &&
      (result.summary.blockers > 0 || result.summary.unverified > 0)) process.exitCode = 1;
}
