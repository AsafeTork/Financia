# TEMPLATE — Documento de Refino de Frente (preencher TODAS as seções)

> Este arquivo é o CONTRATO do documento. Todo agente de pesquisa da Fase 1 preenche
> exclusivamente o arquivo `docs/design/REFINE_XX_<Frente>.md` que lhe foi atribuído
> (cabeçalho já criado). Sem criar pastas, sem tocar outros arquivos, sem colar conteúdo no retorno.

## 0. Ficha do agente (preencher no topo do doc)

```yaml
frente: <nome da frente>
agente_data: <data ISO>
buscas_web: <número inteiro REAL executado>
urls_fetched: <número inteiro REAL de URLs lidas>
repo_arquivos_lidos: <número inteiro>
doc_linhas: <número inteiro final>
skills_usadas: <lista de nomes que conseguiu carregar — ou "nenhuma (não disponível)">
```

## 1. Diagnóstico atual (ESTADO REAL, com evidência)

- Para CADA área relevante: o que existe hoje, com `arquivo:linha`.
- O que está ausente/frágil. Sem achismo — cada item referenciado a código lido.

## 2. Benchmark externo (pesquisa web obrigatória)

| # | Referência (nome) | URL real | 2–4 insights específicos "copiáveis" |
|---|-------------------|----------|--------------------------------------|
| 1 | ... | ... | ... |

Regra: mínimo 5 linhas na tabela; fontes relevantes 2025–2026; inglês + pt-BR.

## 3. Oportunidades priorizadas (P0 / P1 / P2)

| Prioridade | Oportunidade | Arquivo(s) alvo | Impacto (percepção/perf/conv) | Esforço | Risco |
|-----------|--------------|-----------------|-------------------------------|---------|-------|
| P0 | ... | ... | alto | baixo | baixo |

Critério P0: alto impacto visível/perf + risco baixo + mudança localizada.

## 4. Especificação técnica aplicável (pronta para implementação)

- Tokens novos/existentes com valores exatos (CSS).
- Estruturas/layout recomendados (JSX/classes), smoking snippets pequenos.
- Estados (hover/focus/pressed/disabled/loading/empty), dark/light.
- Como interage com `--brand` dinâmica e offline-first.

## 5. Dependências & libs (se aplicável)

| Lib/Melhor | Versão (pesquisada) | Por quê | Custo ~KB gzip | Alternativa sem custo |
|---|---|---|---|---|

## 6. Checklist para os 10 implementadores (Fase 2)

- [ ] Passo 1 … (arquivo, o que mudar)
- [ ] Passo 2 …
Incluir: ordem de execução (evitar conflitos entre frentes), comandos de verificação leves,
pontos que NÃO podem quebrar (ver README §Restrições).

## 7. Log de coleta (transparência — auditável)

| # | Tipo (busca/fetch/leitura) | Alvo (query/URL/arquivo) | Conhecimento extraído |
|---|---------------------------|--------------------------|------------------------|
| 1 | ... | ... | ... |

## 8. Fontes completas

- URLs (todas) + arquivos lidos (todos com file:line).

---
## Regras no preencher

- Nunca inventar file:line que não leu.
- Números de contratos reais (não chutados).
- Retorno final ao orquestrador: **≤6 linhas** com métricas (ver README.md §Protocolo).