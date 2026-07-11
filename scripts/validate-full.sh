#!/usr/bin/env bash
# validate-full.sh - Validação completa

set -e

echo "🔍 VALIDAÇÃO COMPLETA"

# 1. Lint completo
echo "🔍 Lint completo..."
npm run lint

# 2. Typecheck completo
echo ""
echo "🔍 Typecheck completo..."
npx tsc --noEmit --incremental

# 2. Build
echo ""
echo "🏗️  Build..."
npm run build

# 3. Testes completos
echo ""
echo "🧪 Testes completos..."
npm test

echo ""
echo "✅ VALIDAÇÃO COMPLETA - TUDO OK"