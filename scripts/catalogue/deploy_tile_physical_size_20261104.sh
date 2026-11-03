#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/lsenet5/idea-dh.com
STAGE=/home/lsenet5/idea-dh-staging-20261103
BACKUPS=/home/lsenet5/idea-deploy-backups
for f in api/platform-ai.php api/marketplace.php api/tile-dimensions.php \
         idea-accounts-api/platform-ai.php idea-accounts-api/tile-dimensions.php; do
  test -s "$STAGE/$f"
  php -l "$STAGE/$f" >/dev/null
done
php "$STAGE/tests/tile-physical-size.test.php"
php "$STAGE/tests/tile-size-catalogue.integration.php"
php "$STAGE/tests/ai-mask-preservation.test.php"
mkdir -p "$BACKUPS"
ts=$(date -u +%Y%m%dT%H%M%SZ)
backup="$BACKUPS/idea-tile-backend-before-$ts.tar.gz"
tar -czf "$backup" -C "$ROOT" api/platform-ai.php api/marketplace.php idea-accounts-api/platform-ai.php
chmod 0600 "$backup"
printf 'BACKUP_CREATED %s\n' "$backup"
rollback() {
  printf 'ERROR: restoring previous PHP modules\n' >&2
  tar -xzf "$backup" -C "$ROOT"
  rm -f "$ROOT/api/tile-dimensions.php" "$ROOT/idea-accounts-api/tile-dimensions.php"
  exit 2
}
trap rollback ERR
for f in api/tile-dimensions.php idea-accounts-api/tile-dimensions.php \
         api/platform-ai.php idea-accounts-api/platform-ai.php api/marketplace.php; do
  install -m 0644 "$STAGE/$f" "$ROOT/$f"
done
for f in api/tile-dimensions.php api/platform-ai.php api/marketplace.php \
         idea-accounts-api/platform-ai.php; do
  php -l "$ROOT/$f" >/dev/null
done
trap - ERR
echo 'LIVE_TILE_SIZE_MODULE_DEPLOYED'
sha256sum "$ROOT/api/tile-dimensions.php" "$ROOT/api/platform-ai.php" "$ROOT/api/marketplace.php"
