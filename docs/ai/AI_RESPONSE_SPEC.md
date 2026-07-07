# AI Response Spec — Financia Brand Studio

## Expected Response Format

The AI must return a JSON object with this structure:

```json
{
  "schemaVersion": "1.0.0",
  "modules": {
    "moduleName": { ... }
  }
}
```

## Processing Pipeline

After the user pastes the response, the Brand Studio processes it through:

1. **AI Compatibility Layer** — detects the AI model format, adapts if needed
2. **Validation** — checks against the schema, rejects unknown fields
3. **Normalization** — converts semantic values (style, mood, density) to concrete CSS values
4. **Conversion** — maps to internal brand_config format
5. **Diff Summarizer** — compares against current config, generates 3-level summary
6. **Preview** — applies tokens temporarily for visual preview
7. **Validation** — checks contrast, conflicts, incompatibilities
8. **Partial Approval** — user selects which modules to accept
9. **Application** — persists the approved changes

## Compatibility

The AI Compatibility Layer can detect and adapt responses from:
- ChatGPT (format: explanatory text + JSON)
- Claude (format: JSON in markdown code blocks)
- Generic markdown (```json ... ``` blocks)
- Raw JSON (starts with `{`)

## Error Handling

If the response is invalid:
- The system shows specific error messages
- Suggests corrections when possible
- Never applies partial/invalid data
