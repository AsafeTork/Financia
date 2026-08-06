# TEMPLATE — Bug Report

> Use para documentar bugs que você resolve (memory of future you).

```
# Bug: [título curto e descritivo]

**Data de diagnóstico:** 2026-MM-DD  
**Severity:** Critical | High | Medium | Low  
**Status:** Active | Resolved  
**Reporter:** [Você ou "AI Agent"]  
**Relacionado:** #issue (se houver)

---

## Resumo

[1-2 frases explicando o que quebrou e o impacto]

---

## Passos para Reproduzir

1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

**Expected:** O que deveria acontecer  
**Actual:** O que aconteceu

---

## Ambiente

- **OS:** [Linux / macOS / Windows]
- **Browser:** [Chrome / Firefox / Safari / Edge]
- **Version:** [v5.1.1 ou commit hash]
- **Dispositivo:** [Desktop / Mobile (tamanho: 320px / 375px / 1440px)]

---

## Logs / Evidências

```
[Captura de erro ou stack trace]
```

Ou screenshot (descreva se em texto):

> [Screenshot: descrição do que é visível]

---

## CausaRaiz

[Análise do que causou o bug]

**Exemplo:**
- RLS policy sem `(SELECT auth.uid())` → 19x lento
- Variável `null` não tratada → crash
- Dependency version mismatch → build quebra

---

## Solução

**Arquivos modificados:**
- `src/file.jsx` — o que mudou
- `supabase/migrations/xxx.sql` — se schema mudou

**Comando de validação:**
- `npm run lint` — passando?
- `npm run test -t "bug specific test"` — passando?
- `npm run build` — passando?

---

## Metrology (antes/depois)

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Lighthouse score | 78 | 94 | +16 |
| INP (p75) | 420ms | 185ms | -56% |
| Bundle (gzipped) | 510KB | 290KB | -43% |

---

## Checks de Pronto

- [ ] Bug reproduzível (passos descritos)
- [ ] Feature flag ou canary se aplicável
- [ ] Teste que cobre o caso (unit/e2e)
- [ ] Lighthouse/lint/typecheck passando
- [ ] CHANGELOG.md atualizado
- [ ] Commit conventional

---

**Relacionado:** #issue, @commit  
**Note:** Qualquer informação extra relevante.