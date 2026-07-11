#!/usr/bin/env bash
# validate-changed.sh - Validação incremental apenas arquivos alterados

set -e

echo "🚀 VALIDAÇÃO INCREMENTAL - apenas arquivos alterados"

# 1. Lint apenas alterados
echo "🔍 Lint apenas arquivos alterados..."
CHANGED=$(git diff --name-only --diff-filter=d origin/main...HEAD -- '*.ts' '*.tsx' '*.js' '*.jsx' 2>/dev/null || echo "")
if [ -n "$CHANGED" ]; then
  echo "$CHANGED" | xargs npx eslint --cache --cache-strategy content --cache-location .eslintcache
  echo "✅ Lint OK"
else
  echo "Nenhum arquivo TS/JS alterado"
fi

# 2. Typecheck apenas alterados
echo ""
echo "🔍 Typecheck apenas arquivos alterados..."
CHANGED_TS=$(git diff --name-only --diff-filter=d origin/main...HEAD -- '*.ts' '*.tsx' 2>/dev/null || echo "")
if [ -n "$CHANGED_TS" ]; then
  echo "$CHANGED_TS" | xargs npx tsc --noEmit --incremental
  echo "✅ Typecheck OK"
else
  echo "Nenhum arquivo TS alterado"
fi

# 3. Testes apenas alterados
echo ""
echo "🧪 Testes apenas alterados..."
npx vitest run --changed --reporter=dot --pool=threads --poolOptions.threads.maxThreads=4

echo ""
echo "✅ VALIDAÇÃO INCREMENTAL CONCLUÍDA"