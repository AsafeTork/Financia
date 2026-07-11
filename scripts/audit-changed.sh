#!/usr/bin/env bash
# audit-changed.sh - Auditoria incremental apenas do que mudou

set -e

echo "🔍 AUDITORIA INCREMENTAL - apenas o que mudou"

# Obter arquivos alterados
CHANGED=$(git diff --name-only --diff-filter=d origin/main...HEAD 2>/dev/null || echo "")
if [ -z "$CHANGED" ]; then
  echo "ℹ️  Nenhuma alteração detectada"
  exit 0
fi

echo "📝 Arquivos alterados:"
echo "$CHANGED" | sed 's/^/  - /'
echo ""

# 1. Novas migrations
MIGRATIONS=$(echo "$CHANGED" | grep '^supabase/migrations/.*\.sql$' | sort -u || true)
if [ -n "$MIGRATIONS" ]; then
  echo "📦 Migrations novas ($(echo "$MIGRATIONS" | wc -l)):"
  echo "$MIGRATIONS" | sed 's/^/  - /'
  echo "  🔍 Validando..."
  npx supabase db diff --schema public --dry-run > /dev/null && echo "  ✅ Migrações válidas" || echo "  ⚠️  Verificar migrações"
  echo ""
fi

# 2. Edge Functions alteradas
EF_CHANGED=$(echo "$CHANGED" | grep '^supabase/functions/' | sed 's|supabase/functions/\([^/]*\)/.*|\1|' | sort -u | tr '\n' ' ')
if [ -n "$EF_CHANGED" ]; then
  echo "⚡ Edge Functions alteradas: $EF_CHANGED"
  for EF in $EF_CHANGED; do
    echo "  🔍 Verificando $EF..."
    if deno check "supabase/functions/$EF/index.ts" 2>/dev/null; then
      echo "  ✅ $EF - sintaxe OK"
    else
      echo "  ⚠️  $EF - erros de tipo"
    fi
  done
  echo ""
fi

# 3. Migrações não rastreadas localmente
echo "🔍 Verificando migrations não rastreadas..."
if [ -d "supabase/migrations" ]; then
  LOCAL_COUNT=$(find supabase/migrations -name "*.sql" | wc -l)
  echo "  $LOCAL_COUNT migrations locais"
  
  # Verifica se há migrations não aplicadas
  if command -v supabase >/dev/null 2>&1; then
    if npx supabase db pull --schema public --dry-run >/dev/null 2>&1; then
      echo "  ✅ Banco sincronizado"
    else
      echo "  ⚠️  Execute: npx supabase db pull"
    fi
  fi
  echo ""
fi

# 3. Edge Functions sem caller
echo "🔍 Verificando Edge Functions sem caller..."
if [ -d "supabase/functions" ]; then
  for EF in $(ls -1 supabase/functions/); do
    if [ -d "supabase/functions/$EF" ]; then
      CALLERS=$(grep -r "supabase.functions.invoke.*['\"]$EF['\"]" src/ 2>/dev/null | wc -l)
      if [ "$CALLERS" -eq 0 ] && [[ ! "$EF" =~ ^(ai|stripe-webhook|stripe-checkout)$ ]]; then
        echo "  ⚠️  $EF - sem caller detectado no frontend"
      fi
    fi
  done
  echo ""
fi

# 4. Verificar migrações não rastreadas no remoto
echo "🔍 Verificando migrações não rastreadas no remoto..."
if command -v supabase >/dev/null 2>&1; then
  if npx supabase db pull --schema public --dry-run >/dev/null 2>&1; then
    echo "  ✅ Banco sincronizado"
  else
    echo "  ⚠️  Execute: npx supabase db pull"
  fi
else
  echo "  ⚠️  Supabase CLI não instalado - pulando verificação remota"
fi

echo ""
echo "✅ AUDITORIA INCREMENTAL CONCLUÍDA"