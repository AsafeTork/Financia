---
type: REFERENCE
---

# AI Brand Schema — Financia

## Objetivo

Este documento define o formato JSON para configurar a identidade visual do aplicativo **Financia**.

**Você (a IA) nunca modifica código, arquivos ou banco de dados.**

Você apenas retorna um JSON padronizado. O Financia interpreta, valida e aplica.

---

## Obrigações da IA

- Retornar **apenas JSON**.
- O JSON deve seguir **exatamente** este schema.
- O campo `schemaVersion` é **obrigatório** e fixo em `"1.0.0"`.
- Cores hexadecimais devem estar no formato `#RRGGBB` (com `#`).
- O objeto `modules.palette` é **obrigatório** com `primary`, `secondary` e `accent`.
- O objeto `modules.theme` com `mode` é **obrigatório**.
- Todos os demais módulos são **opcionais**.
- Valores omitidos recebem o padrão do sistema.

---

## Estrutura completa (Formato Modular)

```
/
├── schemaVersion      (obrigatório) string "1.0.0"
├── modules            (obrigatório) object
│   ├── palette        (obrigatório) { primary, secondary, accent, mode, ... }
│   ├── theme          (obrigatório) { mode: "light" | "dark" }
│   ├── typography     (opcional)   { fontFamily, fontDisplay, style, size }
│   ├── logo           (opcional)   { url, fallback, radius }
│   ├── sidebar        (opcional)   { background, textColor, textMuted, activeBg, style, width, collapsedWidth, hoverBg, divider }
│   ├── header         (opcional)   { background, textColor, style, height }
│   ├── cards          (opcional)   { background, radius, style, shadow }
│   ├── buttons        (opcional)   { radius, primaryBg, primaryText, secondaryBg, secondaryText, style, height }
│   ├── inputs         (opcional)   { background, border, radius, style, focusBorder, height }
│   ├── borderRadius   (opcional)   { sm, md, lg, xl, full, style }
│   ├── shadows        (opcional)   { sm, md, lg, intensity }
│   ├── spacing        (opcional)   { unit, cardPadding, sectionGap, density }
│   ├── animations     (opcional)   { enabled, speed, duration, easing }
│   └── planOverrides  (opcional)   { pro: { modules: {...}, logoColors: {...} }, premium: {...} }
```

---

## Módulos

### palette

**Obrigatório.** Define as cores do aplicativo.

| Campo | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `primary` | hex `#RRGGBB` | sim | `#002f59` | Cor principal. Sidebar, botões, navegação |
| `secondary` | hex `#RRGGBB` | sim | `#e8f0f7` | Cor suave. Badges, tags, fundos de card |
| `accent` | hex `#RRGGBB` | sim | `#1a6b5c` | Cor de destaque. CTAs, gráficos, progresso |
| `mode` | `"light" \| "dark"` | não | `"light"` | Modo de tema |
| `bgPage` | hex `#RRGGBB` | não | `#f5f5f0` | Fundo da página |
| `bgCard` | hex `#RRGGBB` | não | `#ffffff` | Fundo de cartões |
| `bgInput` | hex `#RRGGBB` | não | `#ffffff` | Fundo de inputs |
| `bgSubtle` | hex `#RRGGBB` | não | `#f5f5f0` | Fundo sutil de seções |
| `surface` | hex `#RRGGBB` | não | `#ffffff` | Superfície elevada |
| `textMain` | hex `#RRGGBB` | não | `#0f172a` | Texto principal |
| `textSub` | hex `#RRGGBB` | não | `#5b6b7c` | Texto secundário |
| `textMuted` | hex `#RRGGBB` | não | `#94a3b8` | Texto suave |
| `border` | hex `#RRGGBB` | não | `#edeae3` | Borda sutil |
| `borderMd` | hex `#RRGGBB` | não | `#e2ddd4` | Borda média |
| `success` | hex `#RRGGBB` | não | `#16a34a` | Indicador positivo |
| `warning` | hex `#RRGGBB` | não | `#f59e0b` | Indicador atenção |
| `danger` | hex `#RRGGBB` | não | `#dc2626` | Indicador negativo |
| `info` | hex `#RRGGBB` | não | `#2563eb` | Indicador informativo |

### theme

**Obrigatório.** Define claro/escuro.

```json
{ "mode": "light" }
{ "mode": "dark" }
```

### typography

Define fontes. Opcional.

```json
{
  "fontFamily": "Inter, system-ui, sans-serif",
  "fontDisplay": "Fraunces, Georgia, Times New Roman, serif",
  "style": "modern",
  "size": "medium"
}
```

Valores válidos:
- `style`: `"modern" | "classic" | "minimal"`
- `size`: `"small" | "medium" | "large"`

### logo

Configuração da logo. Opcional.

```json
{ "url": null, "fallback": "F", "radius": "12px" }
```

### sidebar

Aparência da barra lateral. Se `background` omitido, usa `palette.primary`.

```json
{
  "background": "#002f59",
  "textColor": "#ffffff",
  "textMuted": "rgba(255,255,255,0.55)",
  "activeBg": "rgba(255,255,255,0.14)",
  "style": "solid",
  "width": "280px",
  "collapsedWidth": "72px",
  "hoverBg": "rgba(255,255,255,0.08)",
  "divider": "rgba(255,255,255,0.1)"
}
```

Valores válidos para `style`: `"solid" | "minimal" | "dark" | "glass"`

### header

Cabeçalho mobile. Se `background` omitido, usa `palette.primary`.

```json
{ "background": "#002f59", "textColor": "#ffffff", "style": "solid", "height": "64px" }
```

Valores válidos para `style`: `"solid" | "glass" | "minimal"`

### cards / buttons / inputs

```json
{ "background": "#ffffff", "radius": "12px", "style": "raised", "shadow": "0 2px 8px rgba(0,47,89,0.05)" }
{ "radius": "12px", "primaryBg": "#002f59", "primaryText": "#ffffff", "secondaryBg": "#e8f0f7", "secondaryText": "#002f59", "style": "rounded", "height": "44px" }
{ "background": "#ffffff", "border": "#edeae3", "radius": "12px", "style": "outlined", "focusBorder": "#002f59", "height": "44px" }
```

Valores válidos:
- `cards.style`: `"raised" | "flat" | "glass"`
- `buttons.style`: `"rounded" | "pill" | "sharp"`
- `inputs.style`: `"outlined" | "filled" | "minimal" | "underlined"`

### borderRadius

Sistema de raios de borda.

```json
{ "sm": "8px", "md": "12px", "lg": "16px", "xl": "24px", "full": "9999px", "style": "rounded" }
```

Valores válidos para `style`: `"rounded" | "sharp" | "pill"`

### shadows

Sombras em CSS `box-shadow`.

```json
{
  "sm": "0 1px 2px rgba(0,47,89,0.04)",
  "md": "0 2px 8px rgba(0,47,89,0.05)",
  "lg": "0 8px 24px rgba(0,47,89,0.08)",
  "intensity": "subtle"
}
```

Valores válidos para `intensity`: `"none" | "subtle" | "medium" | "strong"`

### spacing

Sistema de espaçamento (reservado para uso futuro).

```json
{ "unit": 4, "cardPadding": "24px", "sectionGap": "24px", "density": "comfortable" }
```

Valores válidos para `density`: `"compact" | "comfortable" | "spacious"`

### animations

Controle de animações (reservado para uso futuro).

```json
{ "enabled": true, "speed": "normal", "duration": "200ms", "easing": "ease-out" }
```

Valores válidos para `speed`: `"slow" | "normal" | "fast"`

### planOverrides

Sobrescritas visuais por plano (apenas admin).

```json
{
  "pro": {
    "modules": { "palette": { "glowPrimary": "rgba(37,99,235,0.12)" } },
    "logoColors": { "blue": "#1e40af", "green": "#14532d", "teal": "#0d9488", "check": "#6ee7b7" }
  },
  "premium": {
    "modules": { "palette": { "planGold": "#D4AF6A" } }
  }
}
```

---

## Exemplo mínimo

```json
{
  "schemaVersion": "1.0.0",
  "modules": {
    "palette": {
      "primary": "#14532d",
      "secondary": "#dcfce7",
      "accent": "#16a34a"
    },
    "theme": { "mode": "light" }
  }
}
```

---

## Exemplo completo

```json
{
  "schemaVersion": "1.0.0",
  "modules": {
    "palette": {
      "primary": "#7f1d1d",
      "secondary": "#fee2e2",
      "accent": "#dc2626",
      "bgPage": "#0a1628",
      "bgCard": "#13243d",
      "bgInput": "#13243d",
      "textMain": "#e8edf2",
      "textSub": "#8ba0b5",
      "border": "#1e3450",
      "mode": "dark"
    },
    "theme": { "mode": "dark" },
    "typography": {
      "fontFamily": "Plus Jakarta Sans, system-ui, sans-serif",
      "fontDisplay": "Cabinet Grotesk, sans-serif"
    },
    "sidebar": {
      "background": "#7f1d1d",
      "textColor": "#ffffff",
      "textMuted": "rgba(255,255,255,0.55)",
      "activeBg": "rgba(255,255,255,0.14)",
      "style": "solid"
    },
    "header": {
      "background": "#7f1d1d",
      "textColor": "#ffffff"
    },
    "buttons": {
      "radius": "8px",
      "primaryBg": "#dc2626",
      "primaryText": "#ffffff",
      "style": "rounded"
    },
    "borderRadius": {
      "sm": "6px",
      "md": "10px",
      "lg": "14px",
      "xl": "20px"
    },
    "animations": {
      "enabled": true,
      "speed": "normal"
    }
  }
}
```

---

## Versionamento

O campo `schemaVersion` garante compatibilidade futura.

| Versão | Data | Mudanças |
|---|---|---|
| 1.0.0 | 2026-07-07 | Versão inicial (formato flat) |
| 1.1.0 | 2026-07-12 | Migração para formato modular (`modules.*`) |

**Regra:** toda versão futura deve ser compatível com versões anteriores quando possível. Quebras de compatibilidade devem ser documentadas e justificadas.

---

## Limitações conhecidas

- O sistema atualmente aplica `modules.palette.primary/secondary/accent` e `modules.theme.mode` imediatamente.
- Os demais módulos são armazenados mas aplicados progressivamente em versões futuras.
- A IA não deve modificar `schemaVersion`.
- Toda cor hexadecimal deve ter exatamente 6 caracteres após `#`.
- O campo `brandName` (agora opcional no nível raiz) é limitado a 60 caracteres.

---

## Formato Legado (Flat) — Depreciado

O formato flat anterior (`palette.primary`, `theme.mode` no nível raiz) é **depreciado** e não deve mais ser usado. O sistema ainda aceita para compatibilidade, mas converte automaticamente para o formato modular. Sempre retorne o formato modular documentado acima.