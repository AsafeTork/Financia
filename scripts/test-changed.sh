#!/usr/bin/env bash
# test-changed.sh - Testes apenas arquivos alterados

set -e

echo "🧪 TESTES APENAS ALTERADOS"

npx vitest run --changed --reporter=dot --pool=threads --poolOptions.threads.maxThreads=4

echo "✅ Testes alterados OK"