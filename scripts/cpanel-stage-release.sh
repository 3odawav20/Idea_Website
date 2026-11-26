#!/usr/bin/env bash
# cPanel Git deployment staging only. Intentionally does NOT overwrite idea-dh.com.
set -Eeuo pipefail
umask 077

REPO="/home/lsenet5/repositories/Idea_Website"
STAGE_ROOT="/home/lsenet5/idea_release_staging"

fail() {
  printf 'IDEA_STAGE_ERROR: %s\n' "$*" >&2
  exit 1
}
test -d "$REPO/.git" || fail "The cPanel-managed Git repository is missing."
cd "$REPO"
test -z "$(git status --porcelain)" || fail "Uncommitted changes detected in cPanel-managed repository. Review and preserve them before deploying."
test -f package-lock.json || fail "package-lock.json missing. Refusing non-reproducible install."
test -f scripts/build-cpanel.mjs || fail "cPanel package builder missing."
command -v node >/dev/null 2>&1 || fail "Node.js is unavailable on this cPanel account. Build in CI and deploy a verified artifact instead."
command -v npm >/dev/null 2>&1 || fail "npm is unavailable on this cPanel account. Build in CI and deploy a verified artifact instead."

printf 'IDEA_STAGE_SOURCE_SHA=%s\n' "$(git rev-parse HEAD)"
printf 'IDEA_STAGE_NODE_VERSION=%s\n' "$(node --version)"
npm ci --no-audit --no-fund
npm run build:cpanel

test -s dist/index.html || fail "Build output dist/index.html missing."
test -f dist/.htaccess || fail "Required Apache .htaccess missing."
test -f dist/api/visualize.php || fail "Packaged PHP visualizer route missing."
mkdir -p "$STAGE_ROOT"
SOURCE_SHA="$(git rev-parse --short=12 HEAD)"
RELEASE_DIR="$(mktemp -d "$STAGE_ROOT/release_${SOURCE_SHA}_XXXXXXXX")"
cp -a dist/. "$RELEASE_DIR/"
test -s "$RELEASE_DIR/index.html" || fail "Staging copy failed."

printf 'IDEA_STAGE_SUCCESS=1\n'
printf 'IDEA_STAGE_RELEASE_DIR=%s\n' "$RELEASE_DIR"
printf 'IDEA_STAGE_NOTE=Private staging only; no files in /home/lsenet5/idea-dh.com or MySQL were modified by this script.\n'
printf 'IDEA_STAGE_GATE=Do not promote until PHP/MySQL auth and protected API integrations have been verified against the live site.\n'
