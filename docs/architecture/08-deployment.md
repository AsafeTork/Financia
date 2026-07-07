# Arquitetura 08 — Deploy e CI/CD

## Visao Geral

3 canais de entrega: Web (Render), Android (APK via GitHub Actions), Windows (Electron EXE via GitHub Actions).

---

## Deploy Web (Render)

| Aspecto | Detalhe |
|---|---|
| Plataforma | Render Static Site |
| URL producao | `https://financia-gestao.onrender.com` |
| Trigger | Auto-deploy em `git push origin main` |
| Build command | `npm install && npm run build` |
| Output | `./dist` |
| Tempo medio | 2-3 min |
| Config | `render.yaml` na raiz |

### Variaveis de ambiente (Render)

| Var | Onde obter |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API |
| `VITE_APP_URL` | URL publica do Render |

### Headers de seguranca (render.yaml)

```yaml
headers:
  - path: "/*"
      name: X-Frame-Options
      value: DENY
  - path: "/*"
      name: X-Content-Type-Options
      value: nosniff
  - path: "/*"
      name: Content-Security-Policy
      value: "default-src 'self'; ..."
```

---

## CI/CD — GitHub Actions

Arquivo: `.github/workflows/build.yml`

### Triggers

1. `push` para `main`
2. `workflow_dispatch` com inputs: `client_name`, `logo_url`, `primary_color`

### Jobs

#### 1. build-apk (Android)

| Step | O que faz |
|---|---|
| Checkout | Clona repositorio |
| Setup Java | JDK 17 |
| Decode keystore | `KEYSTORE_B64` → `keystore.jks` |
| Substitui icone | Baixa `logo_url`, gera icones PNG com `gen_icons.py` |
| Build Gradle | `./gradlew assembleRelease` |
| Assina APK | `apksigner` com `KEYSTORE_PASS` e `KEY_ALIAS` |
| Upload artifact | APK pronto para release |

#### 2. build-windows (Electron)

| Step | O que faz |
|---|---|
| Checkout | Clona repositorio |
| Setup Node | Node 20 |
| npm install | Instala dependencias |
| Gera icone | `gen_icon_win.py` com `primary_color` |
| Build Vite | `npm run build` |
| Electron-builder | Gera NSIS installer |
| Upload artifact | EXE pronto para release |

#### 3. create-release

| Step | O que faz |
|---|---|
| Download artifacts | APK + EXE dos jobs anteriores |
| Create Release | GitHub Release com tag automatica |
| Upload assets | APK + EXE anexados ao release |

### Secrets necessarios

| Secret | Onde configurar |
|---|---|
| `KEYSTORE_B64` | GitHub > Settings > Secrets |
| `KEYSTORE_PASS` | GitHub > Settings > Secrets |
| `KEY_ALIAS` | GitHub > Settings > Secrets |
| `GITHUB_TOKEN` | Automatico (fornecido pelo Actions) |

---

## Build Electron (Local)

```bash
npm run electron:build    # Gera instalador .exe em dist/electron/
```

### Configuracao (package.json)

```json
{
  "build": {
    "appId": "com.gestaofinanceira.app",
    "productName": "Financia",
    "win": {
      "target": "nsis",
      "icon": "electron/icon.ico"
    },
    "nsis": {
      "oneClick": true,
      "allowToChangeInstallationDirectory": false
    }
  }
}
```

Electron 31 carrega a URL de producao (`https://financia-gestao.onrender.com`) em uma janela nativa.

---

## APK Build Manual (triggerApkBuild)

### Como funciona

1. Cliente com white-label clica "Gerar APK personalizado"
2. Frontend chama `triggerApkBuild(name, logoUrl, color)` em `src/lib/db.js`
3. Funcao faz `POST` para GitHub API (`repos/.../actions/workflows/build.yml/dispatches`)
4. Workflow dispara com `client_name`, `logo_url`, `primary_color` como inputs
5. APK e gerado e publicado no GitHub Releases

### Rate limiting

- Minimo 5 min entre builds (`nancia_last_build_at` em localStorage)
- Requer `nancia_gh_token` configurado (Settings > Painel admin > GitHub Token)

---

## Build de Producao (Vite)

```bash
npm run build
```

### Saida

| Arquivo | Tamanho | gzip |
|---|---|---|
| `index.html` | ~2 kB | ~0.8 kB |
| `index-*.css` | ~45 kB | ~10 kB |
| `index-*.js` | ~320 kB | ~103 kB |
| Chunks lazy | 5-31 kB cada | 2-8 kB gzip |

### Aviso de chunk grande

O Vite avisa sobre chunks > 500 kB. Atualmente o bundle principal esta em ~320 kB (abaixo do limite). Historicamente chegou a ~555 kB antes da code-splitting com `React.lazy`.

### Code splitting

Todas as views usam `React.lazy`:
- `Dashboard`, `TxView`, `InventoryView`, `ReportView`, `EmailView`, `SettingsView`, `PlansView`
- `Landing`, `Login`, `PrivacyPolicy`, `TermsOfService`

Carregadas sob demanda dentro de `<Suspense fallback={<PageSkeleton/>}>`.

---

## Lint e Testes

### Lint

```bash
npm run lint    # eslint src/
```

Configuracao: `eslint.config.js` (formato flat, ESLint v9)
- Plugins: `@eslint/js`, `eslint-plugin-react`, `eslint-plugin-react-hooks`
- Regras: `react-hooks/rules-of-hooks` = error, `exhaustive-deps` = warn
- Atualmente: 0 erros, ~79 warnings (todos `no-unused-vars` ou `exhaustive-deps`)

### Testes

```bash
npm test           # vitest run
npm run test:watch # vitest (modo watch)
```

Configuracao: inline no `vite.config.js`
- Ambiente padrao: `node`
- jsdom: via comentario `// @vitest-environment jsdom` no topo do arquivo
- Setup: `src/test/setup.js`
- Mocks: `src/test/mocks.js` (`makeLdbTable`, `makeSb`, `makeSession`)

### CI/CD

> **GAP**: O `build.yml` NAO executa `npm test` nem `npm run lint`. Builds quebrados podem passar. Recomenda-se adicionar step de teste antes do deploy.

---

## Ordem de Deploy Recomendada

```
1. Desenvolver localmente (npm run dev)
2. Rodar testes (npm test)
3. Rodar lint (npm run lint)
4. Build local (npm run build) — confirmar sem erros
5. Aplicar migrations no Supabase (se houver)
6. git push origin main
7. Aguardar Render deploy (~3 min)
8. Testar URL de producao
9. Disparar build APK/EXE se necessario
```
