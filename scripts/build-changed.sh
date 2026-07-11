#!/usr/bin/env bash
# build-changed.sh - Build incremental apenas se necessário

set -e

echo "🏗️  BUILD INCREMENTAL"

# Verificar se há mudanças relevantes para o build
CHANGED=$(git diff --name-only origin/main...HEAD -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.css' '*.scss' '*.html' '*.json' 'vite.config.*' 'tailwind.config.*' 'postcss.config.*' 2>/dev/null || echo "")

if [ -z "$CHANGED" ]; then
  echo "Nenhuma mudança relevante para build - pulando"
  exit 0
fi

echo "Arquivos relevantes para build alterados:"
echo "$CHANGED" | sed 's/^/  - /'

echo ""
echo "🏗️  Executando build..."
npm run build

echo "✅ Build OK"