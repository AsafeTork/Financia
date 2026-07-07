# Branding & White-Label

> Sistema de identidade visual do Financia — unica fonte de verdade da aparência.

---

## Conceito

O Financia e white-label: cada cliente pode ter sua propria identidade visual (nome, logo, cores, tema). O sistema de branding controla tudo isso via CSS variables aplicadas em tempo real.

---

## Niveis de Branding

| Nivel | Quem | O que pode |
|---|---|---|
| **Plano** (free/pro/premium) | Sistema | Paleta fixa por plano (teal/azul/dourado) |
| **White-label** | Cliente (apos compra) | Cores, logo, tema, nome customizados |
| **Admin** | Admin | Editor completo via ClientEditModal |

### Presets por Plano (`PLAN_VISUAL_DEFAULTS`)

`src/lib/constants.js:128`:

| Plano | color | color_secondary | color_accent |
|---|---|---|---|
| free | `#0f3d3e` (petroleo) | `#ccfbf1` | `#0d9488` |
| pro | `#2563EB` (azul) | `#e0e7ff` | `#4F46E5` |
| premium | `#0F172A` (grafite) | `#fef3c7` | `#D4AF6A` |

Cliente SEM white-label recebe automaticamente as cores do seu plano. Nao pode personalizar.

### White-label Default

Se white-label ativo mas cliente nao configurou paleta, usa `WHITE_LABEL_VISUAL_DEFAULT` (navy Financia).

---

## Fluxo de Aplicacao

```
brand (state) + planInfo (state)
        ↓
useBrandAppearance(brand, planInfo)
        ↓
    appBrand (useMemo)
    ├── white_label=true + custom_palette → usa brand direto
    ├── white_label=true + sem paleta → usa WHITE_LABEL_VISUAL_DEFAULT
    └── white_label=false → usa PLAN_VISUAL_DEFAULTS[plan]
        ↓
    applyBrandVars(appBrand)  ← useEffect
        ↓
    document.documentElement.style
    ├── --brand          (cor primaria)
    ├── --brand-soft     (8% alpha)
    ├── --brand-secondary
    ├── --brand-accent
    ├── --brand-accent-soft (12% alpha)
    └── --brand-grad     (linear-gradient 135deg)
```

---

## `useBrandAppearance.js` — Hook Central

`src/hooks/useBrandAppearance.js` (70 linhas):

| Funcao | CC | Responsabilidade |
|---|---|---|
| `loadThemePref()` | 1 | Le tema do localStorage |
| `computeMissingCustomPalette(b)` | 1 | Verifica se faltam cores |
| `computeUseWhiteLabelFallback(...)` | 1 | Decide se usa fallback navy |
| `computeEffectiveTheme(...)` | 1 | themePref > appBrand.theme > 'light' |
| `applyBrandVars(b)` | 1 | Aplica 6 CSS vars no `<html>` (exportada) |
| Hook body | 3 | Orquestra tudo |

### Flag `custom_palette`

- `true` quando cliente ja configurou paleta manualmente
- Evita que `useWhiteLabelFallback` engula paleta intencional
- Setada em `saveBrand()` quando `hasWhiteLabel === true`

---

## `saveBrand()` — Persistencia

`src/hooks/useBrandManager.js:9`:

```
saveBrand(nb)
  1. Le existing do Dexie
  2. Computa hasWhiteLabel (nb || existing)
  3. Se nao WL: sobrescreve cores com PLAN_VISUAL_DEFAULTS[plan]
  4. Incrementa visual_version
  5. Seta custom_palette = hasWhiteLabel
  6. Dexie put (row, _synced=0)
  7. setBrand (React state)
  8. SW postMessage UPDATE_BRAND
  9. Supabase upsert (online)
```

---

## ColorField — Componente Compartilhado

`src/components/ColorField.jsx` (20 linhas):

Props: `{ label, desc, value, onChange }`

- Color picker nativo + text input com validacao hex
- Preview swatch
- CSS vars (`--bg-input`, `--text-main`, `--border`) — dark mode compativel
- Usado em SettingsView (cliente) e ClientEditModal (admin)

---

## THEME_PRESETS — Galeria de Temas

`src/lib/constants.js:160`:

8 temas pre-configurados por segmento:
- Azul Corporativo, Verde Natural, Vermelho Energia, Roxo Premium
- Laranja Vibrante, Rosa Moderno, Petroleo Sobrio, Grafite Minimal

Aplicaveis em 1 clique no ClientEditModal (admin).

---

## Logo Storage

| Cenario | Onde |
|---|---|
| Admin upload | Supabase Storage bucket `logos` (path: `user_id/logo.ext`) |
| Cliente upload | Base64 data URI no Dexie + company_profiles |

Bucket `logos` tem RLS por pasta (`user_id`). Clientes so acessam sua propria pasta.

---

## data-plan e data-theme no `<html>`

`src/App.jsx`:

```js
document.documentElement.setAttribute('data-plan', plan);  // free/pro/premium
document.documentElement.setAttribute('data-theme', theme); // light/dark
```

CSS em `index.css` usa esses atributos para:
- `[data-plan="pro"]` — sombras, glow, badge
- `[data-plan="premium"]` — grafite + dourado, sidebar com gradiente
- `[data-theme="dark"]` — override completo de cores

---

## Precos

| Item | Preco |
|---|---|
| White-label (personalizacao visual) | R$ 497 unico |
| Plano Pro | R$ 49,90/mes |
| Plano Premium | R$ 99,90/mes |

Precos customizados por cliente: admin define via `admin-set-custom-price`.

---

## Bugs Conhecidos / Limitacoes

- Cliente promovido a Pro precisa de logout/login (ou 2min sync) para ver mudanca visual
- `deriveCores()` com hue+150 produz accents estranhos para primarias quentes (vermelho→ciano)
- `custom_palette` so é setado em `saveBrand` — admin que aplica preset nao seta o flag
