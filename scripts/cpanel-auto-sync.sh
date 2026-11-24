#!/usr/bin/env bash
# cPanel private cron entrypoint. No production changes without operator opt-in.
set -Eeuo pipefail
umask 077
export HOME=/home/lsenet5
export PATH=/opt/alt/alt-nodejs22/root/usr/bin:/usr/local/bin:/usr/bin:/bin
export GIT_TERMINAL_PROMPT=0 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ROOT=/home/lsenet5/idea_release_staging
REPO=/home/lsenet5/repositories/Idea_Website
[[ -f "$ROOT/automatic-frontend-enabled" ]] || exit 0
exec 8>"$ROOT/auto-sync.lock"
flock -n 8 || exit 0
LOG="$ROOT/automatic-frontend.log"
if [[ -f "$LOG" && $(wc -c < "$LOG") -gt 5242880 ]]; then mv -f "$LOG" "$LOG.previous"; fi
exec >>"$LOG" 2>&1
printf '\n[%s] IDEA_AUTO_CHECK\n' "$(date -u +%FT%TZ)"
cd "$REPO"
[[ $(git symbolic-ref --quiet --short HEAD) == main && -z $(git status --porcelain) ]] || { echo IDEA_AUTO_BLOCKED_DIRTY_OR_NON_MAIN; exit 1; }
git fetch --no-tags origin main
SHA=$(git rev-parse origin/main)
if [[ -f "$ROOT/last-published-sha" && $(cat "$ROOT/last-published-sha") == "$SHA" ]]; then
  if [[ -f "$ROOT/last-published-index-sha256" && $(sha256sum /home/lsenet5/idea-dh.com/index.html | cut -d' ' -f1) == $(cat "$ROOT/last-published-index-sha256") ]]; then
    echo "IDEA_AUTO_UP_TO_DATE=$SHA";exit 0
  fi
  echo "IDEA_AUTO_BLOCKED_MANUAL_LIVE_INDEX_CHANGE=$SHA";exit 1
fi
# Back off repeated failed revisions for 30 minutes without preventing a new SHA.
if [[ -f "$ROOT/auto-last-failed-sha" && $(cat "$ROOT/auto-last-failed-sha") == "$SHA" && -n $(find "$ROOT/auto-last-failed-sha" -mmin -30 -print) ]]; then echo "IDEA_AUTO_RETRY_BACKOFF=$SHA";exit 0;fi
git merge --ff-only "$SHA"
if /bin/bash "$REPO/scripts/cpanel-safe-release.sh"; then
  if [[ -f "$ROOT/last-published-sha" && $(cat "$ROOT/last-published-sha") == "$SHA" ]]; then
    echo "IDEA_AUTO_SUCCESS=$SHA";exit 0
  fi
fi
printf '%s\n' "$SHA" > "$ROOT/auto-last-failed-sha"
echo "IDEA_AUTO_FAILED=$SHA";exit 1
