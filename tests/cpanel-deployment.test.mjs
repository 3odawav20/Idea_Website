import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const yaml = readFileSync(".cpanel.yml", "utf8");
const release = readFileSync("scripts/cpanel-safe-release.sh", "utf8");
const stage = readFileSync("scripts/cpanel-stage-release.sh", "utf8");
const publisher = readFileSync("scripts/cpanel-publish-frontend.py", "utf8");
const autoSync = readFileSync("scripts/cpanel-auto-sync.sh", "utf8");
const gitignore = readFileSync(".gitignore", "utf8");

test("cPanel YAML invokes the guarded release entrypoint from the managed repository", () => {
  assert.match(yaml, /^---\s*\n/);
  assert.match(yaml, /^deployment:\s*\n\s+tasks:\s*\n\s+- \/bin\/bash \/home\/lsenet5\/repositories\/Idea_Website\/scripts\/cpanel-safe-release\.sh\s*$/m);
});

test("release entrypoint stages and validates before calling the protected publisher", () => {
  assert.match(release, /cpanel-stage-release\.sh/);
  assert.match(release, /cpanel-publish-frontend\.py/);
  assert.match(release, /flock/);
  assert.match(release, /IDEA_FRONTEND_PROMOTION_SUCCESS=1/);
  assert.match(release, /mktemp "\$STAGE_ROOT\/cpanel-stage-\$SHORT_SHA-XXXXXX"/);
  assert.doesNotMatch(release, /rsync\s+-av\s+--delete|\/home\/lsenet5\/public_html|npm install/);
});

test("cPanel staging uses the pinned pnpm lockfile and the same checks as CI", () => {
  assert.match(stage, /corepack pnpm install --frozen-lockfile/);
  assert.match(stage, /corepack pnpm lint/);
  assert.match(stage, /corepack pnpm exec tsx --test/);
  assert.match(stage, /corepack pnpm exec tsc --noEmit/);
  assert.match(stage, /corepack pnpm run build:cpanel/);
  assert.match(stage, /process\.versions\.node/);
  assert.match(stage, /IDEA_STAGE_RELEASE_DIR=/);
  assert.match(stage, /release_\$SOURCE_SHA"_XXXXXXXX/);
  assert.match(release, /release_"\$SHORT_SHA"_\*/);
});

test("the publisher targets idea-dh.com and preserves protected production services", () => {
  assert.match(publisher, /Path\("\/home\/lsenet5\/idea-dh\.com"\)/);
  assert.match(publisher, /LIVE\/"\.htaccess"/);
  assert.match(publisher, /LIVE\/"api"/);
  assert.match(publisher, /LIVE\/"data"/);
  assert.match(publisher, /LIVE_RELEASE_VERIFIED=1/);
  assert.match(publisher, /PROTECTED_PHP_CONFIG_DATA_UNCHANGED=1/);
  assert.match(publisher, /ROLLBACK_APPLIED=1/);
});

test("automatic cPanel sync and manual deployment share the same publication markers", () => {
  assert.match(autoSync, /last-published-sha/);
  assert.match(autoSync, /last-published-index-sha256/);
  assert.match(gitignore, /^package-lock\\.json$/m);
  assert.match(release, /cpanel-publish-frontend\.py/);
});
