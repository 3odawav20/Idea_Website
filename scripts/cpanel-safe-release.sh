#!/usr/bin/env bash
# IDEA cPanel pull-deployment entrypoint. cPanel runs this after Deploy HEAD Commit.
# Build and publish only the frontend; never rsync --delete or replace PHP/MySQL data.
set -Eeuo pipefail
umask 077

REPO="/home/lsenet5/repositories/Idea_Website"
STAGE_ROOT="/home/lsenet5/idea_release_staging"
NODE22="/opt/alt/alt-nodejs22/root/usr/bin"

fail() {
  printf 'IDEA_RELEASE_ERROR: %s\n' "$*" >&2
  exit 1
}

[[ -d "$REPO/.git" ]] || fail "The cPanel-managed Git repository is missing at $REPO."
cd "$REPO"

BRANCH="$(git symbolic-ref --quiet --short HEAD || true)"
[[ "$BRANCH" == "main" ]] || fail "Only the main branch may be published (current: ${BRANCH:-detached})."
[[ -z "$(git status --porcelain)" ]] || fail "The cPanel repository has local changes. Preserve and review them before deploying."

SHA="$(git rev-parse HEAD)"
SHORT_SHA="$(printf '%s' "$SHA" | cut -c1-12)"

mkdir -p "$STAGE_ROOT"
chmod 700 "$STAGE_ROOT"
exec 9>"$STAGE_ROOT/deploy.lock"
flock -n 9 || fail "Another IDEA deployment is already running."

# Prefer the cPanel Node.js 22 runtime when present; never silently build with an older Node.
if [[ -x "$NODE22/node" && -x "$NODE22/corepack" ]]; then
  export PATH="$NODE22:$PATH"
fi
command -v node >/dev/null 2>&1 || fail "Node.js is unavailable."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$NODE_MAJOR" == "22" ]] || fail "Node.js 22 is required; found $(node --version)."
for bin in corepack python3 curl git flock sed tail cut; do
  command -v "$bin" >/dev/null 2>&1 || fail "$bin is unavailable."
done
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

printf 'IDEA_SOURCE_SHA=%s\n' "$SHA"
STAGE_LOG="$(mktemp "$STAGE_ROOT/cpanel-stage-$SHORT_SHA-XXXXXX.log")"

if ! /bin/bash "$REPO/scripts/cpanel-stage-release.sh" >"$STAGE_LOG" 2>&1; then
  cat "$STAGE_LOG" >&2
  fail "Frontend staging, tests, or build failed. The live site was not changed."
fi
cat "$STAGE_LOG"

RELEASE_DIR="$(sed -n 's/^IDEA_STAGE_RELEASE_DIR=//p' "$STAGE_LOG" | tail -n 1)"
[[ -n "$RELEASE_DIR" ]] || fail "The staging script did not return a release directory."
case "$RELEASE_DIR" in
  "$STAGE_ROOT"/release_"$SHORT_SHA"_*) ;;
  *) fail "The staging script returned an unexpected release path: $RELEASE_DIR." ;;
esac
[[ -s "$RELEASE_DIR/index.html" && -d "$RELEASE_DIR/assets" ]] || fail "The staged frontend bundle is incomplete."

# This publisher performs live PHP/MySQL health checks, backs up changed frontend files,
# preserves .htaccess/API/data, verifies served routes and asset hashes, and rolls back on failure.
python3 "$REPO/scripts/cpanel-publish-frontend.py" "$SHA" "$RELEASE_DIR"

printf 'IDEA_FRONTEND_PROMOTION_SUCCESS=1\n'
printf 'IDEA_SOURCE_SHA=%s\n' "$SHA"
printf 'IDEA_LIVE_TARGET=/home/lsenet5/idea-dh.com\n'
printf 'PHP_MYSQL_API_CONFIG_UPLOADS_AND_DATABASE_PRESERVED=1\n'
