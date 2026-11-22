#!/usr/bin/env bash
# cPanel Git deployment staging only. Intentionally does NOT overwrite idea-dh.com.
set -Eeuo pipefail
umask 077

REPO="/home/lsenet5/repositories/Idea_Website"
STAGE_ROOT="/home/lsenet5/idea_release_staging"
PRODUCTION_ROOT="/home/lsenet5/idea-dh.com"
EXPECTED_SHA="${IDEA_EXPECTED_COMMIT_SHA:-}"

fail() {
  printf 'IDEA_STAGE_ERROR: %s\n' "$*" >&2
  exit 1
}
test "$STAGE_ROOT" != "$PRODUCTION_ROOT" || fail "Staging path cannot be the production document root."
case "$STAGE_ROOT/" in "$PRODUCTION_ROOT/"*) fail "Staging path overlaps the production document root." ;; esac
test ! -L "$STAGE_ROOT" || fail "The private staging path must not be a symbolic link."
test -d "$REPO/.git" || fail "The cPanel-managed Git repository is missing."
cd "$REPO"
test -z "$(git status --porcelain)" || fail "Uncommitted changes detected in cPanel-managed repository. Review and preserve them before deploying."
test -f package-lock.json || fail "package-lock.json missing. Refusing non-reproducible install."
test -f scripts/build-cpanel.mjs || fail "cPanel package builder missing."
test -f scripts/verify-cpanel-release.mjs || fail "Release manifest verifier missing."
command -v node >/dev/null 2>&1 || fail "Node.js is unavailable on this cPanel account. Build and verify the package in CI instead."
command -v npm >/dev/null 2>&1 || fail "npm is unavailable on this cPanel account. Build and verify the package in CI instead."

SOURCE_SHA="$(git rev-parse HEAD)"
[[ "$SOURCE_SHA" =~ ^[a-f0-9]{40}$ ]] || fail "Unable to determine a full source commit SHA."
if [[ -n "$EXPECTED_SHA" ]]; then
  [[ "$EXPECTED_SHA" =~ ^[a-f0-9]{40}$ ]] || fail "IDEA_EXPECTED_COMMIT_SHA must be a full 40-character SHA."
  test "$EXPECTED_SHA" = "$SOURCE_SHA" || fail "Checked-out commit does not match IDEA_EXPECTED_COMMIT_SHA."
fi
printf 'IDEA_STAGE_SOURCE_SHA=%s\n' "$SOURCE_SHA"
printf 'IDEA_STAGE_NODE_VERSION=%s\n' "$(node --version)"
npm ci --no-audit --no-fund
npm run build:cpanel
node scripts/verify-cpanel-release.mjs dist "$SOURCE_SHA"

mkdir -p -m 700 "$STAGE_ROOT"
test ! -L "$STAGE_ROOT" || fail "The private staging path must not be a symbolic link."
RELEASE_DIR="$(mktemp -d "$STAGE_ROOT/release_${SOURCE_SHA}_XXXXXXXX")"
cp -a dist/. "$RELEASE_DIR/"
node scripts/verify-cpanel-release.mjs "$RELEASE_DIR" "$SOURCE_SHA"

printf 'IDEA_STAGE_SUCCESS=1\n'
printf 'IDEA_STAGE_SOURCE_SHA=%s\n' "$SOURCE_SHA"
printf 'IDEA_STAGE_RELEASE_DIR=%s\n' "$RELEASE_DIR"
printf 'IDEA_STAGE_NOTE=Private build staging only; this directory is not asserted to be web-accessible.\n'
printf 'IDEA_STAGE_PRODUCTION=UNCHANGED\n'
printf 'IDEA_STAGE_DATABASE=NOT_ACCESSED\n'
printf 'IDEA_STAGE_GATE=Do not promote until isolated web staging, PHP/MySQL contracts, backups, rollback, and acceptance tests are verified.\n'
