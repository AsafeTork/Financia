# AI Brand Schema — Financia Brand Studio

## Schema Version: 1.0.0

The Financia Brand Studio accepts a JSON object describing the visual identity of the application. The JSON must contain:

```json
{
  "schemaVersion": "1.0.0",
  "modules": { ... }
}
```

## Available Modules

Each module is optional. If omitted, defaults are used.

### palette

Colors and theme.

| Field | Type | Description |
|---|---|---|
| primary | `#hex` | Main brand color |
| style | `minimal` `bold` `elegant` `fun` | Visual style intent |
| mood | `professional` `creative` `warm` `playful` | Mood intent |
| mode | `light` `dark` | Color scheme |

### typography

Fonts and text sizing.

| Field | Type | Description |
|---|---|---|
| style | `modern` `classic` `minimal` `playful` | Font style intent |
| size | `small` `medium` `large` | Text size intent |

### sidebar

Navigation sidebar.

| Field | Type | Description |
|---|---|---|
| style | `solid` `glass` `minimal` `dark` | Sidebar style intent |

### header

Top header bar.

| Field | Type | Description |
|---|---|---|
| style | `solid` `transparent` `bordered` | Header style intent |

### cards

Card surfaces.

| Field | Type | Description |
|---|---|---|
| style | `flat` `raised` `outlined` `glass` | Card style intent |

### buttons

Action buttons.

| Field | Type | Description |
|---|---|---|
| style | `rounded` `sharp` `pill` | Button shape intent |

### inputs

Form inputs.

| Field | Type | Description |
|---|---|---|
| style | `outlined` `filled` `underlined` `minimal` | Input style intent |

### borderRadius

Border radius scale.

| Field | Type | Description |
|---|---|---|
| style | `sharp` `rounded` `pill` | Roundness intent |

### spacing

Layout spacing.

| Field | Type | Description |
|---|---|---|
| density | `compact` `comfortable` `spacious` | Spacing density intent |

### shadows

Box shadows.

| Field | Type | Description |
|---|---|---|
| intensity | `none` `subtle` `medium` `strong` | Shadow intensity |

### animations

UI animations.

| Field | Type | Description |
|---|---|---|
| speed | `slow` `normal` `fast` | Animation speed |
| enabled | boolean | Enable/disable animations |

### layout

General layout.

| Field | Type | Description |
|---|---|---|
| sidebarPosition | `left` `right` | Sidebar placement |
| density | `compact` `comfortable` `spacious` | Layout density |

## Rules

1. Return ONLY the JSON object, no markdown, no commentary.
2. `schemaVersion` must be `"1.0.0"`.
3. All hex colors must use `#RRGGBB` format.
4. Use semantic values (style, mood, density, intensity) when possible instead of raw CSS values.
5. Do not invent fields not listed above.
6. If the user doesn't specify something, omit the field or use defaults.
