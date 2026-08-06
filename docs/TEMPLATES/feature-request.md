# TEMPLATE — Feature Request

> Use para planejar features antes de implementar (melhor que "just do it").

```
# Feature: [título com o que o usuário ganha]

**Area:** [Dashboard /Transactions /Onboarding /Auth /etc]  
**Prioridade:** P0 (blocking) | P1 (high) | P2 (medium) | P3 (low)  
**Métrica de sucesso:** [ex.: INP < 200ms, WCAG > 90%]  
**Status:** Backlog | In Progress | Ready for Review  
**Solicitado por:** [usuário ou "AI Agent - high-impact initiative"]

---

## Problema

[O que o usuário quer resolver? Qual outoff negative?]

**Exemplo:** "Na tela de transações, não dá para atualizar a lista sem recarregar a página. Isso quebra a fluência do fluxo e exige esforço extra do usuário."

---

## Solução

### O que

[O que exatamente será implementado?]

**Exemplo:** "Pull-to-refresh nativo na lista de transações: o usuário puxa para baixo e a lista atualiza com indicador visual."

### Não incluído (scope)

[O que será deixado para depois?]

**Exemplo:**
- Haptic feedback (vibração)
- Indicador de progresso (countdown)
- Swipe actions later

---

## Escopo Técnico

### Arterefatos

| Arquivo | Tipo | Notas |
|---------|------|-------|
| `src/features/transactions/TxView.jsx` | modify | adicionar pull handler + state |
| `src/features/transactions/sync.ts` | modify | return `true` when manual refresh triggered |
| `tests/transactions/refresh.test.js` | create | test manual refresh flow |
| `docs/CHANGELOG.md` | modify | entry feature |

### Padrões

- [ ] CSS vars (`var(--brand)`, não hex)
- [ ] ARIA accessible (aria-expanded, roles)
- [ ] Mobile responsive (320px, 375px)
- [ ] Dark mode (CSS vars)
- [ ] Offline support (Dexie sync)

### Métricas

| Antes | Depois | Threshold |
|-------|--------|-----------|
| INP (p75) | < 200ms | +15% improvement |
| WCAG compliance | > 90% | +5% improvement |
| Bundle size | < 400KB gzipped | não aumentar |

---

## Design (descritivo)

[Descreva como será visualmente — você pode usar ASCII ou referências]

```
+-------------------------------------+
|  Transações  [pull to refresh ←]   | ← Header
+-------------------------------------+
| [Transaction card 1]                |
| [Transaction card 2]                | ← Lista com pull handle
| [Transaction card 3]                |
+-------------------------------------+
```

Ou:
> "Como o refresh do Mail.app iOS: pulsa ao puxar, indica progresso com badge, termina com fade-in"

---

## Checklist de Pronto

- [ ] Arquitetura proposta aprovada
- [ ] Código implementado (estilo do projeto)
- [ ] Tests (unit + e2e se aplicável)
- [ ] Lighthouse/lint/typecheck passando
- [ ] CHANGELOG.md entry
- [ ] Visual validation (screenshots: light/dark, mobile/desktop)
- [ ] WCAG 2.2 AA (touch targets >= 44px, contrast, keyboard)

---

## Metrology Real (validação)

**Comando:** ```bash npm run validate:full ``` (ou específico)

| Teste | Status | Link/Screenshot |
|-------|--------|-----------------|
| Lighthouse CI | ✅ 94 | [capture.png] |
| Build | ✅ | `vite build` exit 0 |
| Lint | ✅ | 0 errors |
| Tests | ✅ | 471 passed |

---

**Relacionado:** #issue, @commit  
**Note:** Feature flag ou canary se aplicável.