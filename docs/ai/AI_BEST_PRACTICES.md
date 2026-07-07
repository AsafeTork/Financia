# AI Best Practices — Financia Brand Studio

## Do

- Use semantic values (style, mood, density) whenever possible. The system converts them to concrete CSS.
- Provide a `primary` color at minimum. The system derives secondary and accent automatically.
- Only include modules you want to change. Omitted modules keep their current (or default) values.
- Return clean JSON without markdown formatting when using models that support raw output.

## Don't

- Don't include fields not listed in the schema. They will be rejected.
- Don't return markdown-formatted JSON unless the instruction specifically asks for it.
- Don't return code, HTML, or any non-JSON content.
- Don't use color names ("red", "blue") — always use hex `#RRGGBB`.
- Don't use CSS shorthand values or expressions.

## Color Contrast

WCAG AA requires a contrast ratio of at least 4.5:1 for text and 3:1 for large elements.
The system checks contrast automatically and warns about issues.
When choosing colors:
- Primary + background: ensure enough contrast
- Text + background: minimum 4.5:1 ratio
- Avoid identical primary and secondary colors

## Versioning

Always set `schemaVersion` to the latest version specified in the prompt.
The current version is `1.0.0`.
