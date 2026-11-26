#!/bin/bash
set -e

echo "=== Starting Automated Deployment ==="

# الانتقال تلقائياً للمجلد الرئيسي للمشروع
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# مسار الموقع المباشر ومجلد الـ API في cPanel
TARGET_PATH="/home/lsenet5/public_html"
API_TARGET_PATH="$TARGET_PATH/idea-accounts-api"

# التأكد من وجود مسارات النشر
mkdir -p "$TARGET_PATH"
mkdir -p "$API_TARGET_PATH"

# بناء المشروع تلقائياً إذا كان يحتوي على package.json
if [ -f "package.json" ]; then
    echo "Installing dependencies and building..."
    export PATH=$PATH:/usr/local/bin:~/.nvm/versions/node/$(ls ~/.nvm/versions/node 2>/dev/null | tail -n 1)/bin
    command -v corepack >/dev/null 2>&1 || { echo "Corepack is required; build in CI instead." >&2; exit 1; }
    node scripts/verify-mysql-only.mjs
    corepack pnpm install --frozen-lockfile
    corepack pnpm run build:cpanel
fi

# تحديد مجلد الإخراج الناتج عن البناء
if [ -d "dist" ]; then
    SOURCE_DIR="dist/"
elif [ -d "out" ]; then
    SOURCE_DIR="out/"
elif [ -d "build" ]; then
    SOURCE_DIR="build/"
else
    SOURCE_DIR="./"
fi

echo "Copying frontend files to $TARGET_PATH ..."

# نقل ملفات الواجهة مع الحفاظ على مجلدات السيرفر والـ API
rsync -av --delete \
  --exclude='.git' \
  --exclude='.gitignore' \
  --exclude='.cpanel.yml' \
  --exclude='.well-known' \
  --exclude='cgi-bin' \
  --exclude='scripts' \
  --exclude='node_modules' \
  --exclude='idea-accounts-api' \
  "$SOURCE_DIR" "$TARGET_PATH/"

# نسخ ملف أداة العرض المعتمد
if [ -f "server/cpanel/idea-accounts-api/visualize.php" ]; then
    echo "Deploying server/cpanel/idea-accounts-api/visualize.php ..."
    cp -f "server/cpanel/idea-accounts-api/visualize.php" "$API_TARGET_PATH/visualize.php"
fi

# ضبط الصلاحيات تلقائياً
find "$TARGET_PATH" -type d -exec chmod 755 {} + 2>/dev/null || true
find "$TARGET_PATH" -type f -exec chmod 644 {} + 2>/dev/null || true

echo "=== Deployment Completed Successfully! ==="
