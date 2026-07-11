#!/usr/bin/env bash
# typecheck-changed.sh - Typecheck apenas arquivos alterados

set -e

echo "🔍 TYPECHECK APENAS ALTERADOS"

CHANGED=$(git diff --name-only --diff-filter=d origin/main...HEAD -- '*.ts' '*.tsx' 2>/dev/null || echo "")

if [ -z "$CHANGED" ]; then
  echo "Nenhum arquivo TS alterado"
  exit 0
fi

echo "Arquivos TS alterados:"
echo "$CHANGED" | sed 's/^/  - /'

echo "$CHANGED" | xargs npx tsc --noEmit --incremental

echo "✅ Typecheck OK"