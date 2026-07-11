#!/usr/bin/env bash
# lint-changed.sh - Lint apenas arquivos alterados

set -e

echo "🔍 LINT APENAS ALTERADOS"

CHANGED=$(git diff --name-only --diff-filter=d origin/main...HEAD -- '*.ts' '*.tsx' '*.js' '*.jsx' 2>/dev/null || echo "")

if [ -z "$CHANGED" ]; then
  echo "Nenhum arquivo TS/JS alterado"
  exit 0
fi

echo "Arquivos alterados:"
echo "$CHANGED" | sed 's/^/  - /'

echo "$CHANGED" | xargs npx eslint --cache --cache-strategy content --cache-location .eslintcache

echo "✅ Lint OK"