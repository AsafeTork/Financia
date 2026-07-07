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
- O objeto `palette` é **obrigatório** com `primary`, `secondary` e `accent`.
- O objeto `theme` com `mode` é **obrigatório**.
- Todos os demais grupos são **opcionais**.
- Valores omitidos recebem o padrão do sistema.

---

## Estrutura completa

```
/
├── schemaVersion      (obrigatório) string "1.0.0"
├── brandName          (opcional)   string 1-60 caracteres
├── theme              (obrigatório) { mode: "light" | "dark" }
├── palette            (obrigatório) { primary, secondary, accent ... }
├── typography         (opcional)   { fontFamily, fontDisplay }
├── logo               (opcional)   { url, fallback, radius }
├── sidebar            (opcional)   { background, textColor, textMuted, activeBg }
├── header             (opcional)   { background, textColor }
├── cards              (opcional)   { background, radius }
├── buttons            (opcional)   { radius, primaryBg, primaryText }
├── inputs             (opcional)   { background, border, radius }
├── borderRadius       (opcional)   { sm, md, lg, xl, full }
├── shadows            (opcional)   { sm, md, lg }
├── spacing            (opcional)   { unit, cardPadding, sectionGap }
├── animations         (opcional)   { enabled, speed }
├── planOverrides      (opcional)   { pro: { ... }, premium: { ... } }
```

---

## Grupos

### palette

**Obrigatório.** Define as cores do aplicativo.

| Campo | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `primary` | hex `#RRGGBB` | sim | — | Cor principal. Sidebar, botões, navegação |
| `secondary` | hex `#RRGGBB` | sim | — | Cor suave. Badges, tags, fundos de card |
| `accent` | hex `#RRGGBB` | sim | — | Cor de destaque. CTAs, gráficos, progresso |
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
  "fontDisplay": "Fraunces, Georgia, serif"
}
```

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
  "activeBg": "rgba(255,255,255,0.14)"
}
```

### header

Cabeçalho mobile. Se `background` omitido, usa `palette.primary`.

```json
{ "background": "#002f59", "textColor": "#ffffff" }
```

### cards / buttons / inputs

```json
{ "background": "#ffffff", "radius": "12px" }
{ "radius": "12px", "primaryBg": "#002f59", "primaryText": "#ffffff" }
{ "background": "#ffffff", "border": "#edeae3", "radius": "12px" }
```

### borderRadius

Sistema de raios de borda.

```json
{ "sm": "8px", "md": "12px", "lg": "16px", "xl": "24px", "full": "9999px" }
```

### shadows

Sombras em CSS `box-shadow`.

```json
{
  "sm": "0 1px 2px rgba(0,47,89,0.04)",
  "md": "0 2px 8px rgba(0,47,89,0.05)",
  "lg": "0 8px 24px rgba(0,47,89,0.08)"
}
```

### spacing

Sistema de espaçamento (reservado para uso futuro).

```json
{ "unit": 4, "cardPadding": "24px", "sectionGap": "24px" }
```

### animations

Controle de animações (reservado para uso futuro).

```json
{ "enabled": true, "speed": "normal" }
```

### planOverrides

Sobrescritas visuais por plano (apenas admin).

```json
{
  "pro": { "glowPrimary": "rgba(37,99,235,0.12)", "sidebarBg": "linear-gradient(180deg, #1e1b4b 0%, #172554 50%, #1e1b4b 100%)" },
  "premium": { "glowPrimary": "rgba(212,175,106,0.10)", "planGold": "#D4AF6A" }
}
```

---

## Exemplo mínimo

```json
{
  "schemaVersion": "1.0.0",
  "brandName": "Padaria do Joao",
  "theme": { "mode": "light" },
  "palette": {
    "primary": "#14532d",
    "secondary": "#dcfce7",
    "accent": "#16a34a"
  }
}
```

---

## Exemplo completo

```json
{
  "schemaVersion": "1.0.0",
  "brandName": "Oficina Mecanica Silva",
  "theme": { "mode": "dark" },
  "palette": {
    "primary": "#7f1d1d",
    "secondary": "#fee2e2",
    "accent": "#dc2626",
    "bgPage": "#0a1628",
    "bgCard": "#13243d",
    "bgInput": "#13243d",
    "textMain": "#e8edf2",
    "textSub": "#8ba0b5",
    "border": "#1e3450"
  },
  "typography": {
    "fontFamily": "Plus Jakarta Sans, system-ui, sans-serif",
    "fontDisplay": "Cabinet Grotesk, sans-serif"
  },
  "sidebar": {
    "background": "#7f1d1d",
    "textColor": "#ffffff",
    "textMuted": "rgba(255,255,255,0.55)"
  },
  "header": {
    "background": "#7f1d1d",
    "textColor": "#ffffff"
  },
  "buttons": {
    "radius": "8px",
    "primaryBg": "#dc2626",
    "primaryText": "#ffffff"
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
```

---

## Versionamento

O campo `schemaVersion` garante compatibilidade futura.

| Versão | Data | Mudanças |
|---|---|---|
| 1.0.0 | 2026-07-07 | Versão inicial |

**Regra:** toda versão futura deve ser compatível com versões anteriores quando possível. Quebras de compatibilidade devem ser documentadas e justificadas.

---

## Limitações conhecidas

- O sistema atualmente aplica `palette.primary/secondary/accent` e `theme.mode` imediatamente.
- Os demais grupos são armazenados mas aplicados progressivamente em versões futuras.
- A IA não deve modificar `schemaVersion`.
- Toda cor hexadecimal deve ter exatamente 6 caracteres após `#`.
- O campo `brandName` é limitado a 60 caracteres.
