# CI Root Cause — Run #49 (2c62896)

**Job:** Lint + Typecheck (job ID 88634464644)
**Failed step:** `Run npm ci`
**Error code:** EUSAGE

## Exact error

```
npm error code EUSAGE
npm error
npm error `npm ci` can only install packages when your package.json and
package-lock.json or npm-shrinkwrap.json are in sync. Please update your
lock file with `npm install` before continuing.
npm error
npm error Missing: esbuild@0.28.1 from lock file
npm error Missing: @esbuild/aix-ppc64@0.28.1 from lock file
npm error Missing: @esbuild/android-arm@0.28.1 from lock file
npm error Missing: @esbuild/android-arm64@0.28.1 from lock file
npm error Missing: @esbuild/android-x64@0.28.1 from lock file
npm error Missing: @esbuild/darwin-arm64@0.28.1 from lock file
npm error Missing: @esbuild/darwin-x64@0.28.1 from lock file
npm error Missing: @esbuild/freebsd-arm64@0.28.1 from lock file
npm error Missing: @esbuild/freebsd-x64@0.28.1 from lock file
npm error Missing: @esbuild/linux-arm@0.28.1 from lock file
npm error Missing: @esbuild/linux-arm64@0.28.1 from lock file
npm error Missing: @esbuild/linux-ia32@0.28.1 from lock file
npm error Missing: @esbuild/linux-loong64@0.28.1 from lock file
npm error Missing: @esbuild/linux-mips64el@0.28.1 from lock file
npm error Missing: @esbuild/linux-ppc64@0.28.1 from lock file
npm error Missing: @esbuild/linux-riscv64@0.28.1 from lock file
npm error Missing: @esbuild/linux-s390x@0.28.1 from lock file
npm error Missing: @esbuild/linux-x64@0.28.1 from lock file
npm error Missing: @esbuild/netbsd-arm64@0.28.1 from lock file
npm error Missing: @esbuild/netbsd-x64@0.28.1 from lock file
npm error Missing: @esbuild/openbsd-arm64@0.28.1 from lock file
npm error Missing: @esbuild/openbsd-x64@0.28.1 from lock file
npm error Missing: @esbuild/openharmony-arm64@0.28.1 from lock file
npm error Missing: @esbuild/sunos-x64@0.28.1 from lock file
npm error Missing: @esbuild/win32-arm64@0.28.1 from lock file
npm error Missing: @esbuild/win32-ia32@0.28.1 from lock file
npm error Missing: @esbuild/win32-x64@0.28.1 from lock file
```

## Root cause

`package.json` lists `esbuild@0.28.1` (or a dependency that requires it), but `package-lock.json` was **not regenerated** after this change. `npm ci` requires exact lockfile sync and refuses to proceed.

Additionally, `@supabase/*` packages (`@supabase/auth-js@2.110.2`, `@supabase/functions-js@2.110.2`, etc.) and `rollup-plugin-visualizer@7.0.1` all require `node >=22`, while CI is pinned to Node 20 — but these are only warnings, not the blocker.

**Fix:** Run `npm install` locally and commit the updated `package-lock.json`.
