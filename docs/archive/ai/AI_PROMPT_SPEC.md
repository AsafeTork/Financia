# AI Prompt Spec — Financia Brand Studio

## Overview

The Brand Studio generates a prompt automatically when the user clicks "Copy instructions for AI". The prompt follows this structure:

1. System instructions
2. Rules
3. Context (app state, current colors, theme)
4. Available modules (all modules with their semantic fields)
5. Schema in compact JSON format
6. Limitations (JSON size, color format, font restrictions)
7. Full JSON example

## Generation

The prompt is assembled by `src/brandStudio/promptGenerator.js`. It uses:

- `listModules()` from `schemaRegistry` to get all registered modules
- Context from the current brand state (name, primary color, theme)
- Limitations from the user's plan
- A hardcoded example JSON

## Output Format

The prompt is a single markdown string with sections:
- `# FINANCIA — PERSONALIZACAO VISUAL`
- `## Instrucoes`
- `### Regras`
- `### Contexto da Tela` (if available)
- `### Modulos Disponiveis`
- `### Schema (Formato Compacto)`
- `### Limitacoes` (if available)
- `### Exemplo`

## Placeholders

- `{context}`: Current app name, primary color, theme, logo status
- `{limitations}`: Plan-based restrictions

The prompt is always self-contained and never references internal project code or architecture.
