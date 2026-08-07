#!/usr/bin/env bash
# ci-monitor.sh — monitora CI failures (GitHub Actions) do repo Financia.
# Detecta runs com conclusão "failure" na branch main, lista os jobs que falharam
# e imprime o comando para ver os logs. Exit 1 se houver falha (amigável p/ cron).
#
# Uso:
#   ./scripts/ci-monitor.sh                 # verifica últimos 10 runs
#   ./scripts/ci-monitor.sh --limit 25      # mais histórico
#   ./scripts/ci-monitor.sh --watch 60      # loop: re-checa a cada 60s
#
# Cron sugerido (a cada 15 min):
#   */15 * * * * /home/tork/Projetos/financia/scripts/ci-monitor.sh >> /tmp/ci-monitor.log 2>&1

set -euo pipefail

REPO="${CI_MONITOR_REPO:-AsafeTork/Financia}"
LIMIT="${CI_MONITOR_LIMIT:-10}"
WATCH=""
RUN_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --limit) LIMIT="$2"; shift 2 ;;
    --watch) WATCH="$2"; shift 2 ;;
    --run) RUN_ID="$2"; shift 2 ;;
    --help|-h)
      grep '^#' "$0" | head -30
      exit 0
      ;;
    *) echo "opção desconhecida: $1 (use --help)"; exit 2 ;;
  esac
done

check() {
  local failures
  failures=$(gh run list --repo "$REPO" --limit "$LIMIT" --json conclusion,workflowName,displayTitle,headBranch,databaseId,createdAt \
    --jq '.[] | select(.conclusion == "failure") | "\(.databaseId)|\(.workflowName)|\(.displayTitle)|\(.headBranch)|\(.createdAt)"' 2>/dev/null || true)

  if [[ -z "$failures" ]]; then
    echo "[$(date -Is)] CI verde — nenhuma falha nos últimos $LIMIT runs de $REPO"
    return 0
  fi

  echo "[$(date -Is)] CI VERMELHO — falhas detectadas em $REPO:"
  echo
  printf '%-16s %-16s %-28s %s\n' "RUN ID" "WORKFLOW" "BRANCH" "TÍTULO"
  while IFS='|' read -r id wf title branch created; do
    printf '%-16s %-16s %-28s %s\n' "$id" "$wf" "$branch" "$title"
    echo "  log:    gh run view $id --repo $REPO --log-failed"
    echo "  job(s): $(gh run view "$id" --repo "$REPO" --json jobs --jq '[.jobs[] | select(.conclusion==\"failure\") | .name] | join(\", \")' 2>/dev/null)"
    echo
  done <<< "$failures"

  echo "Diagnóstico automático: gh run view <RUN_ID> --repo $REPO --log-failed"
  echo "Auto-fix (agente headless): opencode run --model opencode/deepseek-v4-flash-free"
  echo "  'Investigue e corrija a falha do CI run <RUN_ID> de $REPO. Restrição: não toque migrations/edge functions/secrets. Commits convencionais fix(ci): ou fix(test):'"
  return 1
}

if [[ -n "$RUN_ID" ]]; then
  gh run view "$RUN_ID" --repo "$REPO" --log-failed || true
  exit 0
fi

if [[ -n "$WATCH" ]]; then
  while true; do
    check || true
    echo "  (próxima checagem em ${WATCH}s; Ctrl+C para parar)"
    sleep "$WATCH"
  done
else
  check
fi
