import json
import os
import re
import sys
from datetime import datetime, timezone


def read_file(path, limit=None):
    if not os.path.exists(path):
        return ""
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            content = f.read()
    except Exception:
        return ""
    if limit:
        content = content[:limit]
    return content


def read_last_lines(path, n=40):
    if not os.path.exists(path):
        return ""
    if n <= 0:
        return ""
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            lines = f.read().split("\n")
    except Exception:
        return ""
    return "\n".join(lines[-n:])


def file_contains(path, pattern, flags=re.I):
    content = read_file(path)
    if not content:
        return None
    return bool(re.search(pattern, content, flags))


def gen_report():
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    commit = os.environ.get("GITHUB_SHA", "unknown")
    branch = os.environ.get("GITHUB_REF_NAME", "unknown")

    lint_status = "ok"
    lint_content = read_file("ci-artifacts/lint-output.txt", 5000)
    lint_exists = os.path.exists("ci-artifacts/lint-output.txt")
    if not lint_exists:
        lint_status = "nao executado"
    elif file_contains("ci-artifacts/lint-output.txt", r"error|erro"):
        lint_status = "com erros"

    test_status = "ok"
    test_content = read_last_lines("ci-artifacts/test-output.txt", 40)
    test_exists = os.path.exists("ci-artifacts/test-output.txt")
    if not test_exists:
        test_status = "nao executado"
    elif file_contains("ci-artifacts/test-output.txt", r"fail|falha|erro|x"):
        test_status = "com falhas"

    build_status = "ok"
    build_content = read_last_lines("ci-artifacts/build-output.txt", 30)
    build_exists = os.path.exists("ci-artifacts/build-output.txt")
    if not build_exists:
        build_status = "nao executado"
    elif file_contains("ci-artifacts/build-output.txt", r"error|erro|failed|falha"):
        build_status = "com erros"

    e2e_status = "ok"
    e2e_content = ""
    e2e_exists = os.path.exists("ci-artifacts/e2e-output.txt")
    if e2e_exists:
        e2e_content = read_file("ci-artifacts/e2e-output.txt", 3000)
        if file_contains("ci-artifacts/e2e-output.txt", r"failed|FAIL|fail|erro|error"):
            e2e_status = "com falhas"
    else:
        e2e_status = "nao executado"

    admin_audit = ""
    for path in [
        "ci-artifacts/admin-audit-report-md/admin-audit-report.md",
        "admin-audit-report.md",
    ]:
        if os.path.exists(path):
            admin_audit = read_file(path, 15000)
            break

    admin_metrics = ""
    for admin_json_path in [
        "ci-artifacts/admin-audit-results-json/admin-audit-results.json",
        "admin-audit-results.json",
    ]:
        if os.path.exists(admin_json_path):
            try:
                with open(admin_json_path, encoding="utf-8") as f:
                    aj = json.load(f)
                errs = aj.get("totalErrors", 0)
                warn = aj.get("totalWarnings", 0)
                admin_metrics = (
                    f"| Erros de console | {errs} |\n| Warnings | {warn} |"
                )
            except Exception:
                pass
            break

    prod_metrics = ""
    for prod_json_path in [
        "ci-artifacts/prod-audit/prod-audit-results.json",
        "prod-audit-results.json",
    ]:
        if os.path.exists(prod_json_path):
            try:
                with open(prod_json_path, encoding="utf-8") as f:
                    pj = json.load(f)
                px = pj.get("stats", {}).get("expected", 0)
                ux = pj.get("stats", {}).get("unexpected", 0)
                prod_metrics = f"| Passou | {px} |\n| Falhou | {ux} |"
            except Exception:
                pass
            break

    report = f"""# CI Report

**Gerado:** {timestamp}
**Commit:** `{commit}`
**Branch:** `{branch}`

---

## Status Geral

| Verificacao | Status |
|---|---|
| Lint + Typecheck | {lint_status} |
| Testes Unitarios | {test_status} |
| Build | {build_status} |
| E2E Tests | {e2e_status} |
| Auditoria de Producao | ver resultado abaixo |
| Admin Audit | ver resultado abaixo |

---

## Lint Errors (Top 200 linhas)

```
{lint_content}
```

---

## Test Results (ultimas 40 linhas)

```
{test_content}
```

---

## Build Output (ultimas 30 linhas)

```
{build_content}
```

---

## E2E Tests (chromium)

| Status |
|---|
| {e2e_status} |

```
{e2e_content}
```

---

## Producao Audit (chromium)

| Metric | Valor |
|---|---|
{prod_metrics}

---

## Admin Audit (producao — Firefox/Chromium)

| Metric | Valor |
|---|---|
{admin_metrics}

Relatorio completo admin-audit-report.md disponivel como artifact.

### Resumo do Admin Audit

{admin_audit or "Nenhum relatorio admin gerado."}

---

## Correcoes Aplicadas Recentemente

| Data | Correcao | Commit |
|------|----------|--------|
| {timestamp} | CI report gerado automaticamente | `{commit}` |
"""

    with open("CI_REPORT.md", "w", encoding="utf-8") as f:
        f.write(report)


if __name__ == "__main__":
    try:
        gen_report()
    except Exception:
        sys.exit(1)