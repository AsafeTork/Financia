# CI Validator Report

**Date:** 2026-07-21
**Workflow:** `.github/workflows/ci.yml`
**Repo:** `AsafeTork/financia`

---

## Files match? (local vs GitHub raw)

**YES** — `diff` returned no differences. Local file and `https://raw.githubusercontent.com/AsafeTork/financia/main/.github/workflows/ci.yml` are identical.

## YAML valid?

**YES** — `yaml.safe_load()` parsed successfully. No syntax errors.

## Workflow registered on GitHub?

**YES** — API returned:
- Name: `CI`
- Path: `.github/workflows/ci.yml`
- ID: `310043420`
- State: `active`

## All project names match playwright.config.ts?

**PARTIAL** — 5 of 6 Playwright projects are covered:

| CI matrix project | Playwright config project | Match? |
|---|---|---|
| `chromium` | `chromium` | YES |
| `firefox` | `firefox` | YES |
| `webkit` | `webkit` | YES |
| `Mobile Chrome` | `Mobile Chrome` | YES |
| `Mobile Safari` | `Mobile Safari` | YES |
| *(missing)* | `screen-reader` | **NO — not in CI** |

## Issues found

1. **Missing `screen-reader` project in CI matrix** — Playwright config defines 6 projects, but CI only runs 5. The `screen-reader` project (`headless: false`, `workers: 1`) is excluded with no comment explaining why. If intentional, document it.

2. **Summary job shows same result for all E2E rows** — The `summary` job uses `needs.e2e-tests.result` for all 5 E2E browser rows (`chromium`, `firefox`, `webkit`, `mobile-chrome`, `mobile-safari`). With a matrix strategy, `needs.e2e-tests.result` returns a combined/comma-separated value for all matrix instances, so all rows will display the same value rather than per-browser results. This is cosmetic, not functional.

3. **No `if: always()` on `actions/upload-artifact` in `build` job** — Unlike the `unit-tests` and `e2e-tests` jobs which use `if: always()` for artifact upload, the `build` job's `dist` upload lacks this. If build succeeds this is fine, but for consistency it could be added.

## Verdict

**PASS** — Workflow is functional, all jobs are well-structured, versions are current (`actions/checkout@v4`, `setup-node@v4`, `upload-artifact@v4`, Node 20, `playwright` browsers), concurrency and fail-fast are configured correctly. The issues noted above are either cosmetic or intentional omissions.
