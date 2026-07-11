#!/bin/bash
set -e

echo "=== Financia Codespace Setup ==="

# Idempotent: git config (sobrescreve se ja existir)
git config --global user.name "${GITHUB_USER:-developer}"
git config --global user.email "${GITHUB_USER:-developer}@users.noreply.github.com"
git config --global core.autocrlf input

# Idempotent: .env.local a partir de secrets (sobrescreve se existir)
if [ -n "${VITE_SUPABASE_URL}" ]; then
  cat > /workspaces/Financia/.env.local << EOF
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}
VITE_APP_URL=https://financia-gestao.onrender.com
EOF
  echo "  .env.local criado a partir de secrets"
fi

# Idempotent: npm install (segunda execucao usa cache e apenas atualiza lock)
cd /workspaces/Financia
if [ ! -d node_modules ]; then
  npm install
  echo "  npm install concluido"
else
  npm ci --prefer-offline 2>/dev/null || npm install
  echo "  node_modules ja existe — atualizado"
fi

# Idempotent: Playwright Chromium
if ! npx playwright install --dry-run chromium 2>/dev/null; then
  npx playwright install chromium --with-deps 2>/dev/null || echo "  Playwright: instalacao adiada"
fi

# Idempotent: link Supabase
if command -v supabase &> /dev/null && [ ! -f supabase/.temp/project-ref ]; then
  echo "  Supabase: execute 'supabase link' manualmente (requer access token)"
fi

echo "=== Setup concluido ==="
echo "Comandos uteis:"
echo "  npm run dev            - Iniciar servidor Vite"
echo "  npm test               - Rodar testes"
echo "  npm run lint           - Lint"
echo "  npm run build          - Build"
echo "  npm run validate:fast  - Validacao rapida"
echo "  npm run validate:full  - Validacao completa"
