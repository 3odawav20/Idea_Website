#!/bin/bash
set -e

echo "=== Starting Automated Deployment ==="

# مسار الموقع المباشر في cPanel
TARGET_PATH="/home/lsenet5/public_html"

# التأكد من وجود مسار النشر
mkdir -p "$TARGET_PATH"

# إذا كان المشروع يحتاج بناء (Node / Vite / React)
if [ -f "package.json" ]; then
    echo "Installing dependencies and building..."
    export PATH=$PATH:/usr/local/bin:~/.nvm/versions/node/$(ls ~/.nvm/versions/node 2>/dev/null | tail -n 1)/bin
    npm install --silent 2>/dev/null || true
    npm run build --if-present
fi

# تحديد مجلد الإخراج الناتج عن البناء إن وجد
if [ -d "dist" ]; then
    SOURCE_DIR="dist/"
elif [ -d "out" ]; then
    SOURCE_DIR="out/"
elif [ -d "build" ]; then
    SOURCE_DIR="build/"
else
    SOURCE_DIR="./"
fi

echo "Copying files to $TARGET_PATH ..."

# نقل الملفات وتخطي ملفات النظام وملفات Git
rsync -av --delete \
  --exclude='.git' \
  --exclude='.gitignore' \
  --exclude='.cpanel.yml' \
  --exclude='scripts' \
  --exclude='node_modules' \
  "$SOURCE_DIR" "$TARGET_PATH/"

# ضبط الصلاحيات تلقائياً
find "$TARGET_PATH" -type d -exec chmod 755 {} + 2>/dev/null || true
find "$TARGET_PATH" -type f -exec chmod 644 {} + 2>/dev/null || true

echo "=== Deployment Completed Successfully! ==="
