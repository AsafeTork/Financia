---
name: code-intent
description: |
  Code quality & correctness packed skill for the Financia stack. Use when: reviewing code or PRs
  (code review, review changes, review diff), simplifying code (simplify, refactor, too complex),
  guaranteeing complete output (no truncation, no placeholders, full implementation, exhaustive),
  verification-first workflows, lint/typecheck/test gates. Combines code-review-skill,
  code-simplifier and full-output-enforcement so quality, simplicity and completeness are enforced
  together in one pass.
license: MIT
---

# Code Intent

Consolidated pack for **code quality, simplification and output completeness**.

Load these subskills from `reference/` (read on demand to save context):

1. **`reference/code-review-skill.md`** — structured PR/change review (4 phases: context → high-level → line-by-line →
   decision), severity labels 🔴/🟡/🟢, architecture/performance/security/quality anti-patterns.
2. **`reference/code-simplifier.md`** — scan for unnecessary complexity, duplication and over-engineering;
   propose minimal rewrites.
3. **`reference/full-output-enforcement.md`** — never ship truncated output or placeholder patterns.

## Application order (use together on the subject in one pass)

1. **Scaffold project rules** — for this repo: AGENTS.md §1 (validation: `validate:fast` / `validate:full`),
   §5 (CSS vars, offline-first Dexie, RLS `(SELECT auth.uid())`), DECISIONS table.
2. **Review** (reference/code-review-skill.md): read the diff / PR, run phase-1→4, output findings with `[blocking]`/`[important]`/`[nit]`.
3. **Simplify** (reference/code-simplifier.md): flag guess → suggest minimal refactor, respect YAGNI.
4. **Verify completeness** (reference/full-output-enforcement.md): no placeholders, no `TODO` deletions losses, no truncated
   code blocks; if the change is complete describe evidence.
5. **Report concise verdict**: `APPROVE` | `REQUEST CHANGES` + findings summary.

## Rules

- Run the repo validation (`npm run validate:fast` for isolated, `validate:full` for broad) and report green before "done".
- Do NOT leave code selecting — quality pack is applied at review, simplification and output stages together.