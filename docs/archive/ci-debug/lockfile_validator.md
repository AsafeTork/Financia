# Lockfile Validator Report

## esbuild Synchronization Check

### Result: PASS

### Details

**esbuild present in package.json?**
- No — esbuild is not listed as a direct dependency in `package.json` (neither in `dependencies` nor `devDependencies`).
- It is a transitive dependency pulled in by `vite` (`^5.4.10` → resolved `5.4.21`).

**esbuild present in package-lock.json?**
- Yes — `node_modules/esbuild` is present at version `0.21.5` (package-lock.json:6205).
- All 24 `@esbuild/*` platform-specific optional dependencies are also at version `0.21.5`.

**Version consistency check:**
- vite declares `esbuild: "^0.21.3"` as a dependency (package-lock.json:12162).
- Lockfile resolves esbuild to `0.21.5`, which satisfies `^0.21.3` (0.21.5 ≥ 0.21.3, < 0.22.0).
- All `@esbuild/*` sub-packages are pinned to `0.21.5`, matching the main package.

**Conclusion:** The lockfile is synchronized. esbuild is correctly resolved at `0.21.5`, satisfying vite's `^0.21.3` requirement. No mismatch detected.

### Summary

| Check | Status |
|-------|--------|
| esbuild in package.json | Not a direct dependency (transitive via vite) |
| esbuild in package-lock.json | Present, version `0.21.5` |
| Version satisfies vite's `^0.21.3` | Yes |
| All `@esbuild/*` sub-packages consistent | Yes (all `0.21.5`) |
| Overall | **PASS** |
