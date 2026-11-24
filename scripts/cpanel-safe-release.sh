#!/usr/bin/env bash
# IDEA: stage a tested release; promote frontend only after explicit approval.
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
[[ -x "$NODE22/node" && -x "$NODE22/npm" ]] || fail 'Node.js 22 runtime is not available at the expected path.'
export PATH="$NODE22:$PATH"
[[ $(node -p 'process.versions.node.split(".")[0]') == 22 ]] || fail 'Node.js 22 is required.'
for bin in npm php python3 curl rsync; do command -v "$bin" >/dev/null || fail "$bin is missing."; done
npm ci --no-audit --no-fund
node --test tests/*.test.mjs
php tests/ai-role-policy.test.php
php tests/tile-physical-size.test.php
php tests/ai-mask-preservation.test.php
for f in server/cpanel/api/visualize.php server/cpanel/api/social-auth.php server/cpanel/api/ask-idea.php server/cpanel/api/marketplace.php server/cpanel/api/tile-dimensions.php server/cpanel/idea-accounts-api/platform-ai.php; do php -l "$f"; done
npm run build:cpanel
[[ -s dist/index.html && -d dist/assets && -s dist/api/visualize.php && -f dist/.htaccess ]] || fail 'Incomplete cPanel bundle.'
RELEASE=$(mktemp -d "$ROOT/release_${SHA:0:12}_XXXXXXXX")
cp -a dist/. "$RELEASE/"
printf 'IDEA_STAGE_SUCCESS=1\nIDEA_STAGE_RELEASE_DIR=%s\n' "$RELEASE"
# Per-commit approval is deliberately outside Git and outside the public document root.
if [[ ! -f "$APPROVAL" ]] || [[ $(tr -d '\r\n' < "$APPROVAL") != "$SHA" ]]; then
  printf 'IDEA_PROMOTION=WAITING_FOR_REVIEW\n'
  exit 0
fi
# Do not replace a hand-patched live HTML shell with an incompatible GitHub shell.
# Only Vite entry filenames may differ; all custom tags/markup must match.
python3 - "$LIVE/index.html" "$RELEASE/index.html" <<'PY'
import re, sys
from pathlib import Path
pat = re.compile(rb'(/assets/index-)[A-Za-z0-9_-]+(\.(?:js|css))')
def normalized(path):
    return pat.sub(rb'\g<1>BUILD\g<2>', Path(path).read_bytes())
if normalized(sys.argv[1]) != normalized(sys.argv[2]):
    sys.exit('IDEA_PROMOTION_BLOCKED: live HTML shell differs beyond Vite entry hashes; reconcile live custom tags before promotion.')
PY
# Check actual live PHP/MySQL connectivity before publishing frontend files.
health() {
  curl --fail --silent --show-error --max-time 20 -A "$UA" -H 'Cache-Control: no-cache' "$BASE/api/accounts.php?action=health" | python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get("ok") is True and d.get("backend")=="php-mysql" else 1)'
}
health || fail 'Live PHP/MySQL health check failed.'
# Refuse changed collisions and missing new public files: only assets can be added.
python3 - "$RELEASE" "$LIVE" <<'PY'
import sys, filecmp
from pathlib import Path
stage, live = map(Path, sys.argv[1:])
for p in stage.rglob('*'):
    if p.is_symlink(): sys.exit(f'Unexpected symlink: {p}')
    if not p.is_file(): continue
    rel = p.relative_to(stage)
    if rel.parts[0] == 'assets':
        q = live / rel
        if q.exists() and (not q.is_file() or not filecmp.cmp(p,q,shallow=False)):
            sys.exit(f'IDEA_PROMOTION_BLOCKED: conflicting live asset {rel}')
    elif rel.parts[0] != 'api' and rel.as_posix() not in ('index.html','.htaccess'):
        q = live / rel
        if not q.is_file() or not filecmp.cmp(p,q,shallow=False):
            sys.exit(f'IDEA_PROMOTION_BLOCKED: non-asset public file requires separate review: {rel}')
PY
BACKUP=$(mktemp -d "$ROOT/live_backup_${SHA:0:12}_XXXXXXXX")
cp -p "$LIVE/index.html" "$BACKUP/index.html"
printf '%s\n' "$SHA" > "$BACKUP/new-release-sha"
printf 'IDEA_BACKUP=%s\n' "$BACKUP"
# Old hashed assets are retained for cached browsers and rollback.
rsync -r --ignore-existing --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r "$RELEASE/assets/" "$LIVE/assets/"
TMP=$(mktemp "$LIVE/.idea-index-XXXXXXXX")
rollback() {
  rc=$?
  trap - ERR INT TERM
  printf 'IDEA_PROMOTION_FAILED: restoring original index.html\n' >&2
  if [[ -f "$BACKUP/index.html" ]]; then
    cp -p "$BACKUP/index.html" "$TMP" && mv -f "$TMP" "$LIVE/index.html" || printf 'IDEA_ROLLBACK_ERROR: manual restore from %s required\n' "$BACKUP" >&2
  fi
  exit "${rc:-1}"
}
trap rollback ERR INT TERM
cp "$RELEASE/index.html" "$TMP"
chmod --reference="$BACKUP/index.html" "$TMP"
mv -f "$TMP" "$LIVE/index.html"
# Verify fresh public HTML and protected backend health. Failure restores old entrypoint.
for route in / /login /account /business /admin; do
  curl --fail --silent --show-error --max-time 20 -A "$UA" -H 'Cache-Control: no-cache' "$BASE$route?idea_release=$SHA" -o "$BACKUP/response.html"
  python3 - "$RELEASE/index.html" "$BACKUP/response.html" <<'PY'
import re,sys
from pathlib import Path
pattern=rb'/assets/index-[A-Za-z0-9_-]+\.js'
expected=re.findall(pattern,Path(sys.argv[1]).read_bytes())
actual=Path(sys.argv[2]).read_bytes()
if not expected or not all(x in actual for x in expected): sys.exit('Live HTML does not reference the approved new bundle.')
PY
done
health
trap - ERR INT TERM
rm -f "$BACKUP/response.html"
printf 'IDEA_FRONTEND_PROMOTION_SUCCESS=1\nIDEA_SOURCE_SHA=%s\n' "$SHA"
printf 'PHP, MySQL, live settings, and existing assets were not replaced. Authenticated browser tests are still required.\n'
