# CI Validator Report

**Date:** 2026-07-31
**Workflow:** `.github/workflows/ci.yml`
**Repo:** `AsafeTork/financia`

---

## Current Workflow Structure (consolidated)

Single workflow `ci.yml` with 8 jobs:

| Job | Purpose | Artifact |
|-----|---------|----------|
| `lint-typecheck` | ESLint + TypeScript check | `lint-typecheck` |
| `unit-tests` | Vitest unit tests | `unit-tests` |
| `build` | Vite production build | `build` |
| `security-audit` | `npx audit-ci` security scan | `security-audit` |
| `production-audit` | Playwright prod audit (chromium) | `prod-audit` |
| `admin-audit` | Playwright admin audit (chromium) | `admin-audit-report-md`, `admin-audit-results-json` |
| `e2e` | Playwright E2E tests (chromium) | `e2e-tests` |
| `extract-errors` | Download artifacts + generate CI_REPORT.md | `ci-report-md` |
| `summary` | Download CI_REPORT.md + upload summary | `ci-summary-report` |

## Files match? (local vs GitHub raw)

**YES** — `diff` returned no differences. Local file and `https://raw.githubusercontent.com/AsafeTork/financia/main/.github/workflows/ci.yml` are identical.

## YAML valid?

**YES** — parsed successfully. No syntax errors.

## Workflow registered on GitHub?

**YES** — API returned active state.

## Artifact Download Mechanism

**FIXED** — Previously used `actions/download-artifact@v4` with `merge-multiple: true` which failed to find artifacts (all jobs showed "nao executado" in CI_REPORT.md). Fixed by switching to `gh run download ${{ github.run_id }}` which reliably downloads all artifacts from the current run.

## Script File Discovery

**FIXED** — `scripts/generate-ci-report.py` now uses `find_file()` for recursive file discovery in `ci-artifacts/`, handling cases where `actions/download-artifact` places files in subdirectories.

## Issues Found

1. **Missing `screen-reader` project in CI matrix** — Playwright config defines 6 projects, but CI only runs 1 (chromium). The `screen-reader` project is excluded with no comment explaining why. If intentional, document it.

2. **`e2e` job runs redundant `npm run build`** — The e2e job runs `npm run build` at line 247, but the `build` job already produces a build. This duplicates work. Consider adding `needs: [build]` to the e2e job and removing the redundant build step.

3. **`security-audit` uploads `security-output.txt` not read by report** — The security audit artifact is uploaded but never read by `generate-ci-report.py`. The security audit results are invisible in CI_REPORT.md.

4. **`admin-audit` can fail silently** — If `admin-audit-report.md` or `admin-audit-results.json` are not generated (e.g., test failure), the upload-artifact steps fail and the artifacts are missing. The `if: always()` on upload doesn't help if the files don't exist.

## Verdict

**PASS with notes** — Workflow is functional after fixing the artifact download mechanism. The CI_REPORT.md now correctly reflects job statuses. Minor improvements recommended for redundancy and visibility.
