#!/usr/bin/env bash
# cPanel Git deployment staging only. The caller performs the guarded live promotion.
set -Eeuo pipefail
umask 077

REPO="/home/lsenet5/repositories/Idea_Website"
STAGE_ROOT="/home/lsenet5/idea_release_staging"
NODE22="/opt/alt/alt-nodejs22/root/usr/bin"

fail() {
  printf 'IDEA_STAGE_ERROR: %s\n' "$*" >&2
  exit 1
}

# Prefer the cPanel Node.js 22 runtime when available.
if [[ -x "$NODE22/node" && -x "$NODE22/corepack" ]]; then
  export PATH="$NODE22:$PATH"
fi

[[ -d "$REPO/.git" ]] || fail "The cPanel-managed Git repository is missing."
cd "$REPO"
[[ -z "$(git status --porcelain)" ]] || fail "Uncommitted changes detected in the cPanel repository. Preserve and review them before deploying."
[[ "$(git symbolic-ref --quiet --short HEAD || true)" == "main" ]] || fail "Only the main branch can be staged."
[[ -f pnpm-lock.yaml ]] || fail "pnpm-lock.yaml is missing. Refusing a non-reproducible install."
[[ -f scripts/build-cpanel.mjs ]] || fail "The cPanel package builder is missing."

command -v node >/dev/null 2>&1 || fail "Node.js is unavailable on this cPanel account."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$NODE_MAJOR" == "22" ]] || fail "Node.js 22 is required; found $(node --version)."
command -v corepack >/dev/null 2>&1 || fail "Corepack is unavailable on this cPanel account."
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

printf 'IDEA_STAGE_SOURCE_SHA=%s\n' "$(git rev-parse HEAD)"
printf 'IDEA_STAGE_NODE_VERSION=%s\n' "$(node --version)"

node scripts/verify-mysql-only.mjs
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm exec tsx --test tests/*.test.ts src/app/backend/authValidation.test.ts
corepack pnpm exec tsc --noEmit
corepack pnpm run build:cpanel

test -s dist/index.html || fail "Build output dist/index.html is missing."
test -d dist/assets || fail "Build assets are missing."
test ! -e dist/api/visualize.php || fail "A legacy PHP API was unexpectedly bundled."
test -z "$(git status --porcelain)" || fail "The build changed tracked repository files; refusing to deploy."

mkdir -p "$STAGE_ROOT"
chmod 700 "$STAGE_ROOT"
SOURCE_SHA="$(git rev-parse --short=12 HEAD)"
RELEASE_DIR="$(mktemp -d "$STAGE_ROOT/release_$SOURCE_SHA-XXXXXXXX")"
cp -a dist/. "$RELEASE_DIR/"
test -s "$RELEASE_DIR/index.html" || fail "The staging copy failed."
test -d "$RELEASE_DIR/assets" || fail "The staged assets are missing."

printf 'IDEA_STAGE_SUCCESS=1\n'
printf 'IDEA_STAGE_RELEASE_DIR=%s\n' "$RELEASE_DIR"
printf 'IDEA_STAGE_NOTE=Frontend-only release staged privately; the guarded publisher performs promotion after live health checks.\n'
