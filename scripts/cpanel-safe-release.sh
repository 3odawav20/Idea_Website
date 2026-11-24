#!/usr/bin/env bash
# IDEA: stage a tested release; promote with private opt-in or per-SHA approval.
# Never deploy PHP, overwrite server configuration, run SQL or delete live files.
set -Eeuo pipefail
umask 077
REPO=/home/lsenet5/repositories/Idea_Website
LIVE=/home/lsenet5/idea-dh.com
ROOT=/home/lsenet5/idea_release_staging
APPROVAL="$ROOT/approved-production-sha"
NODE22=/opt/alt/alt-nodejs22/root/usr/bin
BASE=https://idea-dh.com
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
fail() { printf 'IDEA_RELEASE_ERROR: %s\n' "$*" >&2; exit 1; }
mkdir -p "$ROOT"
chmod 700 "$ROOT"
exec 9>"$ROOT/deploy.lock"
flock -n 9 || fail 'Another IDEA deployment is running.'
[[ -d "$REPO/.git" && -d "$LIVE/assets" && -f "$LIVE/index.html" ]] || fail 'Repository or live site missing.'
cd "$REPO"
[[ $(git symbolic-ref --quiet --short HEAD) == main ]] || fail 'Only main may be staged by this deployment.'
[[ -z $(git status --porcelain) ]] || fail 'Repository has local changes; preserve and review them first.'
SHA=$(git rev-parse HEAD)
printf 'IDEA_SOURCE_SHA=%s\n' "$SHA"
[[ -x "$NODE22/node" && -x "$NODE22/corepack" ]] || fail 'Node.js 22 runtime is not available at the expected path.'
export PATH="$NODE22:$PATH"
[[ $(node -p 'process.versions.node.split(".")[0]') == 22 ]] || fail 'Node.js 22 is required.'
for bin in corepack php python3 curl git flock tar; do command -v "$bin" >/dev/null || fail "$bin is missing."; done
# Build outside the checkout so generated files cannot block later git updates.
BUILD_DIR=$(mktemp -d "$ROOT/build_${SHA:0:12}_XXXXXXXX")
git archive "$SHA" | tar -x -C "$BUILD_DIR"
cd "$BUILD_DIR"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
corepack pnpm@10.34.9 install --frozen-lockfile --reporter=append-only
corepack pnpm@10.34.9 exec tsc --noEmit
corepack pnpm@10.34.9 exec tsx --test tests/*.test.ts src/app/backend/authValidation.test.ts
node --test tests/*.test.mjs
php tests/ai-role-policy.test.php
php tests/tile-physical-size.test.php
php tests/ai-mask-preservation.test.php
for f in server/cpanel/api/visualize.php server/cpanel/api/social-auth.php server/cpanel/api/ask-idea.php server/cpanel/api/marketplace.php server/cpanel/api/tile-dimensions.php server/cpanel/idea-accounts-api/platform-ai.php; do php -l "$f"; done
corepack pnpm@10.34.9 run build:cpanel
[[ -s dist/index.html && -d dist/assets && -s dist/api/visualize.php && -f dist/.htaccess ]] || fail 'Incomplete cPanel bundle.'
RELEASE=$(mktemp -d "$ROOT/release_${SHA:0:12}_XXXXXXXX")
cp -a dist/. "$RELEASE/"
printf 'IDEA_STAGE_SUCCESS=1\nIDEA_STAGE_RELEASE_DIR=%s\n' "$RELEASE"
# Automatic publishing is enabled only by a private, operator-owned marker.
if [[ ! -f "$ROOT/automatic-frontend-enabled" ]] && { [[ ! -f "$APPROVAL" ]] || [[ $(tr -d '\r\n' < "$APPROVAL") != "$SHA" ]]; }; then
  printf 'IDEA_PROMOTION=WAITING_FOR_REVIEW\n'
  exit 0
fi
python3 "$BUILD_DIR/scripts/cpanel-publish-frontend.py" "$SHA" "$RELEASE"
printf 'IDEA_FRONTEND_PROMOTION_SUCCESS=1\nIDEA_SOURCE_SHA=%s\n' "$SHA"
# Only discard this invocation's temporary build/package after verified publication.
case "$BUILD_DIR" in "$ROOT"/build_*) rm -rf -- "$BUILD_DIR";; esac
case "$RELEASE" in "$ROOT"/release_*) rm -rf -- "$RELEASE";; esac
