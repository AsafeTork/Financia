# CI Run Report

**Date:** 2026-07-21  
**Commit:** `2c62896`  
**Branch:** `main`  
**Author:** AsafeTork

---

## Summary

Two workflow runs were triggered by commit `2c62896`. Both concluded as **FAILURE**.

| Workflow | Run ID | Conclusion |
|----------|--------|-----------|
| Build Release | 29830697235 | failure |
| CI: full pipeline | 29830697441 | failure |

---

## Run 1: Build Release (`#29830697235`)

| Job | Duration | Result |
|-----|----------|--------|
| build-windows | 1m 36s | ✅ passed |
| build-apk | 1m 04s | ✅ passed* |
| create-release | 0m 04s | ❌ failed |

### Failed Job: `create-release`

**Error:**
```
Unable to download artifact(s): Artifact not found for name: release-apk
```

**Root cause:** The APK build step (`./gradlew assembleRelease --no-daemon 2>&1 | tail -20`) in `build-apk` failed silently. Although gradlew exited with BUILD FAILED, the `tail -20` pipe consumed the non-zero exit code, so the step was marked as passed despite the build error. No APK was produced, and the `release-apk` artifact was never uploaded.

**Gradle error (masked):**
```
FAILURE: Build failed with an exception.
* What went wrong:
Execution failed for task ':app:processReleaseResources'.
> A failure occurred while executing com.android.build.gradle.internal.res.LinkApplicationAndroidResourcesTask$TaskAction
   > Android resource linking failed
     AndroidManifest.xml:23: error: resource mipmap/ic_launcher not found.
     error: failed processing manifest.
```

This is a **workflow bug**: the `| tail -20` at the end of the gradle command silences the non-zero exit code. The pipeline should use `./gradlew assembleRelease --no-daemon 2>&1 | tail -20; exit ${PIPESTATUS[0]}`.

### Other Issues (build-apk)
- No files were found in `apk-output/` (no APK was generated)
- Node.js 20 is deprecated on the runner (using Node 24)

---

## Run 2: CI Full Pipeline (`#29830697441`)

All 9 test/check jobs failed at the same step — `npm ci` could not install dependencies.

| Job | Result |
|-----|--------|
| Lint + Typecheck | ❌ failure (npm ci) |
| Unit Tests (1700+) | ❌ failure (npm ci) |
| Build | ❌ failure (npm ci) |
| Security Audit | ❌ failure (npm ci) |
| E2E (chromium) | ❌ failure (npm ci) |
| E2E (firefox) | ❌ failure (npm ci) |
| E2E (webkit) | ❌ failure (npm ci) |
| E2E (mobile-chrome) | ❌ failure (npm ci) |
| E2E (mobile-safari) | ❌ failure (npm ci) |
| Test Summary | ✅ passed (metadata only) |

### Root Cause (all jobs)

```
npm error `npm ci` can only install packages when your package.json
and package-lock.json or npm-shrinkwrap.json are in sync.
npm error Missing: esbuild@0.28.1 from lock file
```

**The `package.json` contains a dependency on `esbuild@0.28.1` (or a dependency that depends on it), but `package-lock.json` does not include it.** This means `package-lock.json` was not regenerated after the most recent `package.json` change.

**Fix:** Run `npm install` locally to update `package-lock.json`, then commit the updated lock file.

No test, lint, typecheck, build, or e2e step was actually executed — all were skipped after `npm ci` failed.

---

## Key Takeaways

1. **Lock file out of sync** — `esbuild@0.28.1` added to `package.json` but missing from `package-lock.json`. This is the primary issue blocking the entire CI pipeline.
2. **Silent gradle failure** — `build-apk` job masks build errors because of `| tail -20` consuming the exit code.
3. **Cascading failure** — the missing APK artifact caused `create-release` to fail; the out-of-sync lock file caused all 9 CI pipeline jobs to fail.
