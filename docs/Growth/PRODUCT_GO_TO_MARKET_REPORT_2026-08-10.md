# FinanciaBR.me — Product & Go-to-Market Report

**Ciclo:** auditoria autônoma de produto, UX e mercado  
**Data:** 2026-08-10  
**Escopo:** vitrine pública, cadastro, onboarding observado em código, monetização e oportunidade de parceria

## 1. Status Executivo

- **Technical readiness:** alto no caminho público observado. Produção respondeu `200`, assets carregaram, console não apresentou erro de aplicação e Lighthouse snapshot marcou 94 em acessibilidade, 100 em boas práticas, 100 em SEO e 100 em agentic browsing, em desktop e mobile.
- **Product readiness:** médio. O produto comunica gestão de vendas, despesas, estoque e caixa, mas a promessa ainda é ampla para um primeiro segmento.
- **UX readiness:** médio-alto na vitrine e cadastro. O CTA abre diretamente o cadastro; o formulário exige nome, e-mail, telefone, senha e aceite legal. O onboarding posterior é em etapas, pode ser pulado e persiste progresso localmente.
- **Market readiness:** não comprovado. Não há dados de conversão, ativação, retenção, entrevistas ou clientes pagantes apresentados nesta auditoria.
- **Commercial readiness:** parcial. Existem planos Free, Pro a R$ 49,90/mês e Premium a R$ 99,90/mês no código e na landing, mas os termos públicos ainda exibem R$ 70,00 e somente dois planos.
- **Sales readiness:** inicial. Há CTA para WhatsApp, mas não há demo guiada, caso real verificável, roteiro comercial ou material de objeções.
- **Partnership readiness:** hipótese promissora, não validada. O produto tem personalização visual e pacote white-label no código, mas não foi verificada uma operação de parceiro com domínio, painel, suporte, comissão e SLA.

**Principal descoberta:** a maior ameaça imediata à conversão é confiança, não estética. A seção “Quem já usa” apresentava números, nomes, cidades e citações sem evidência verificável nesta auditoria. Isso foi removido e substituído por casos de uso explicitamente descritivos.

**Maior gargalo:** não existe evidência de que o visitante alcance o primeiro valor e retorne. O funil está instrumentado de forma insuficiente para distinguir problema de mensagem, cadastro, onboarding ou retenção.

**Maior oportunidade:** testar uma oferta estreita para pequenos negócios que vendem presencialmente e sofrem com conexão instável, começando por um segmento local e medindo primeira venda e retorno em 7 dias.

## 2. Produto Real

### Existe e está exposto

- Vendas/ganhos, despesas, estoque/perdas, relatórios, comunicação administrativa, configurações, planos e branding aparecem na navegação e/ou código (`src/lib/constants.js:176-184`, `src/features/dashboard/Dashboard.jsx:111-155`).
- O Dashboard destaca resultado líquido, receitas, despesas, saldo, previsão de caixa, insights de IA, limites do plano e movimentações (`src/features/dashboard/Dashboard.jsx:207-283`).
- O plano Free limita 50 transações, 20 produtos e 10 perdas; Pro e Premium são ilimitados nesses itens (`src/lib/constants.js:4-8`).
- A landing promete operação offline, sincronização, PWA, celular e PC. A produção carregou `sw.js` e `manifest.webmanifest` com `200`.
- O pacote white-label está modelado como pagamento único de R$ 497, com logo, cores, APK Android e executável Windows (`src/lib/constants.js:88-101`).

### O que funciona observado

- `https://financiabr.me/` carregou em desktop e viewport mobile de 390x844.
- O CTA “Criar conta grátis” abriu a aba de cadastro, sem mandar o visitante para um login genérico.
- O cadastro expôs nome, e-mail, telefone, senha, aceite de Política/Termos e botão desabilitado até os requisitos (`src/features/auth/Login.jsx:96-114`, snapshot de produção).
- `/termos` abriu diretamente, mas revelou placeholders e divergência de preço.

### O que falta para vender com evidência

- Analytics de funil: landing → cadastro iniciado → cadastro concluído → primeira venda → retorno em 7 dias → upgrade.
- Depoimentos, logos ou métricas de clientes que tenham consentimento e fonte verificável.
- Oferta B2B operacional: ICP, pacote, SLA, onboarding, suporte, margem e contrato.
- Prova de valor com dados reais do próprio usuário, não apenas mockups ilustrativos.

## 3. UX/UI

### Evidências

- Hero é claro sobre categoria, público e diferencial offline: “Vendas, despesas e estoque no controle, mesmo offline.”
- A landing tem navegação por Recursos, Planos e FAQ, pricing, FAQ, CTA final e WhatsApp.
- Em mobile, a navegação reduzida preserva logo, Entrar, hero, pricing e CTA; não foi observado overflow no snapshot.
- Lighthouse snapshot: acessibilidade 94, boas práticas 100, SEO 100. Os relatórios indicaram 2 auditorias falhas, mas o detalhe não foi exposto pelo tool; portanto o motivo é **NÃO VERIFICADO**.
- Console: apenas informação do `beforeinstallprompt` preventDefault; nenhum erro de aplicação observado.

### Problemas e impacto

| Problema | Impacto comercial | Estado |
|---|---|---|
| Prova social sem fonte verificável | Pode destruir confiança no primeiro contato | Corrigido nesta entrega |
| Termos com `[DATA]`, `[E-MAIL]`, `[CPF/CNPJ]` e fornecedor placeholder | Bloqueia confiança e lançamento público responsável | Bloqueio humano |
| Termos dizem Pro a R$ 70 e dois planos; produto mostra Pro R$ 49,90 e Premium R$ 99,90 | Objeção, risco de reclamação e inconsistência de checkout | Não alterado sem revisão legal |
| Não há métricas de funil | Impossibilita saber qual gargalo priorizar | Próximo experimento |
| Cadastro pede telefone antes de qualquer valor dentro do app | Pode reduzir conclusão; impacto não medido | Hipótese, testar |

### Alterações realizadas

- A seção “Quem já usa” virou “No dia a dia”, com três casos de uso: caixa, estoque e fechamento.
- Removidos nomes, cidades, citações e resultados financeiros não verificáveis.
- Mockups receberam linguagem “Exemplo ilustrativo” para separar demonstração de dados reais.
- Corrigidas acentuações visíveis em negócio, cartão e crédito.
- Título de pricing passou de “preço justo” para “preço claro”, sem alterar valores.

## 4. Mercado

### Concorrentes verificados

| Produto | Público/posicionamento | Preço observado | Diferencial observado | Fraqueza/oportunidade para Financia |
|---|---|---:|---|---|
| Conta Azul | ERP para empresas segmentado por faturamento | A partir de R$ 239,90/mês no plano MEI anual; R$ 259,90 mensal exibido; teste grátis de 3 dias | ERP amplo, suporte, múltiplos usuários por faixa | Muito mais caro e depende de internet; Financia pode vencer em simplicidade, preço e offline |
| Omie | ERP para PMEs por receita bruta mensal | A partir de R$ 309/mês na página pública | ERP cloud, suporte premium, teste de 7 dias sem cartão | Escopo e preço maiores; não compete pela simplicidade do micro negócio |
| MarketUP | ERP/PDV para micro e pequenas empresas | Grátis; MarketUP+ a partir de R$ 149,99/mês; Ultra R$ 999/mês; app Premium R$ 49,99/mês | Fiscal, NF-e/NFS-e, PDV, estoque e escala de marca | Gratuito e mais completo em fiscal/PDV; Financia precisa vencer por foco, baixa fricção e offline |
| Nibo | Gestão financeira para empresas, contadores e BPO | Preço não capturado na homepage nesta sessão | Fluxo de caixa, cobranças, Open Finance, IA, programa para contadores/BPO | Forte em ecossistema profissional; Financia pode explorar negócio presencial pequeno e implantação simples |

### Leitura competitiva

- **DADO:** Conta Azul declara que suas funções dependem de internet; MarketUP se posiciona como ERP online; Financia demonstra offline como diferencial central.
- **DADO:** concorrentes maiores vendem amplitude, fiscal, integrações, suporte ou ecossistema de contadores.
- **INFERÊNCIA:** “gestão financeira para pequenos negócios brasileiros” é amplo demais para diferenciar contra Conta Azul, MarketUP e Nibo.
- **HIPÓTESE:** a combinação “registro de venda offline + estoque simples + visão de lucro em poucos minutos” pode ser uma cunha comercial melhor para negócios presenciais.

## 5. Cliente Prioritário

**Recomendação inicial:** pequenos negócios presenciais com estoque leve e conectividade irregular, começando por um microsegmento como salão, loja de bairro ou oficina, em uma região onde o fundador consiga fazer entrevistas e suporte direto.

- **Problema:** registrar venda e despesa no momento real, separar entradas/saídas e saber o resultado sem manter planilha.
- **Por que importa:** o Sebrae reportou que 61% dos empreendedores brasileiros fazem pagamentos da empresa com a conta pessoal, sinal de dificuldade de separação e controle financeiro.
- **Por que Financia:** offline, PWA, venda/estoque/despesa em um fluxo simples e preço abaixo dos ERPs pesquisados.
- **Por que pagar:** **HIPÓTESE**: economizar tempo e reduzir perdas/decisões no escuro vale uma assinatura quando o usuário tiver dados suficientes para perceber o resultado.
- **Por que agora:** **NÃO VERIFICADO**. Deve ser testado por entrevistas e venda assistida, não assumido.

Pessoa física, contador, empresa maior e agência não são recomendados como ICP inicial: exigem propostas, integrações, suporte ou contratos diferentes e diluem a mensagem.

## 6. Monetização

### Estado atual

- Free sem cartão: 50 transações, 20 produtos, 10 perdas e 1 dispositivo na vitrine.
- Pro: R$ 49,90/mês, ilimitado e relatórios/exportação.
- Premium: R$ 99,90/mês, equipe, sincronização e recursos avançados.
- White-label: pacote de personalização de R$ 497 no código.

### Recomendação

Manter o pricing atual apenas como **hipótese de teste**, sem afirmar que está validado. Prioridade imediata é instrumentar conversão para Pro e medir limite atingido, ativação e cancelamento. Não criar desconto anual ou novo plano antes de existir volume de dados.

### Riscos

- Free pode permitir uso sem chegar ao limite e não gerar upgrade.
- Exigir telefone no cadastro pode reduzir ativação.
- Divergência legal/preço pode invalidar a compra por falta de confiança.
- Não há evidência de willingness-to-pay nesta auditoria.

## 7. Aquisição e Experimentos

1. **Funil mínimo:** medir cadastro iniciado, cadastro concluído, primeira venda, primeira despesa, retorno D7 e upgrade. Critério: identificar a maior queda antes de mudar a interface.
2. **Landing por segmento:** uma variante para salões/oficinas/lojas, mantendo o mesmo produto. Métrica: cadastro concluído e primeira venda por visitante qualificado.
3. **Venda assistida local:** 10 entrevistas, 5 demonstrações e convite para usar por 7 dias. Critério de sinal: pelo menos 3 primeiras vendas e 2 retornos em D7; isso é critério proposto, não resultado observado.
4. **Prova social ética:** solicitar autorização e resultado verificável após uso real; não publicar números antes da confirmação.
5. **WhatsApp:** manter como canal de venda consultiva para casos sob medida, com roteiro de problema, demo, preço, objeção e próximo passo.

## 8. Agências / White-label

### Oportunidade

- **DADO:** Nibo possui programa de parceria para contadores e BPO, com descontos de 30% a 50% por nível e possibilidade de conversão em comissão.
- **DADO:** Wüst anuncia white-label com marca, domínio, painel de parceiro, suporte técnico e comissão recorrente; a página anuncia 40% em um exemplo de painel.
- **INFERÊNCIA:** o mercado compra não apenas branding, mas distribuição, painel, suporte e economia de desenvolvimento.
- **HIPÓTESE:** o white-label do Financia pode interessar mais a consultores/agências que já atendem pequenos negócios do que a agências de marketing genéricas.

### O que precisa existir antes de vender a parceiros

- painel do parceiro e separação de clientes;
- domínio customizado e e-mails da marca;
- definição de quem faz suporte L1/L2;
- SLA, onboarding, treinamento e material de venda;
- modelo de margem/comissão validado;
- contrato, proteção de dados e responsabilidade por suporte;
- demonstração real do pacote Android/Windows e ciclo de atualização.

**Conclusão:** oportunidade a validar, não linha de receita pronta. Primeiro experimento: abordar 10 contadores/consultores que já atendem MEIs e medir respostas, reuniões e propostas, sem construir painel novo antes de haver interesse.

## 9. Evidências e Fontes

### Produção e código

- `https://financiabr.me/` — navegação desktop e mobile em 2026-08-10.
- `https://financiabr.me/termos` — placeholders e preço divergente observados diretamente.
- `src/features/landing/Landing.jsx` — proposta, pricing, mockups e CTAs.
- `src/features/auth/Login.jsx` — fluxo de cadastro.
- `src/shared/ui/Onboarding.jsx` — etapas, skip e persistência local.
- `src/features/dashboard/Dashboard.jsx` — primeiro valor, checklist e previsão.
- `src/lib/constants.js` — limites, preços e white-label.

### Mercado e fontes externas

- Conta Azul, planos: https://contaazul.com/planos/ (acesso em 2026-08-10).
- Omie, preços: https://www.omie.com.br/precos/ (acesso em 2026-08-10).
- MarketUP: https://marketup.com/ (acesso em 2026-08-10).
- Nibo: https://www.nibo.com.br/ (acesso em 2026-08-10).
- Nibo, programa de parceria: https://www.nibo.com.br/programa-de-parceria (acesso em 2026-08-10).
- Wüst Software, white-label: https://wustsoftware.com.br/sistema-white-label-para-revenda (acesso em 2026-08-10).
- ANPD, perguntas frequentes LGPD: https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes (acesso em 2026-08-10).
- Sebrae, pesquisa sobre mistura de contas: resultado pesquisado via Agência Sebrae de Notícias; URL direta não foi recuperada pelo fetch nesta sessão. O dado é tratado como fonte externa a confirmar antes de material comercial.

## 10. Decisões

### Fatos

- A vitrine e o cadastro funcionam no caminho público observado.
- Preços públicos do código/landing são R$ 49,90 e R$ 99,90, enquanto os termos ainda dizem R$ 70,00.
- Placeholders legais estão visíveis.
- Depoimentos e números da seção removida não foram verificados.

### Inferências

- Confiança é o maior bloqueio imediato de conversão.
- Offline é uma diferenciação real contra concorrentes cloud, mas não basta sozinho contra ERP gratuito.
- O público inicial precisa ser mais estreito que “pequenos negócios brasileiros”.

### Hipóteses

- Negócios presenciais com internet irregular terão maior ativação.
- R$ 49,90/mês será aceitável depois de uma primeira percepção de valor.
- Consultores/contadores podem ser canal melhor que agências genéricas para white-label.

## 11. Bloqueios Humanos

- **Dados legais:** fornecer nome/razão social do controlador, CPF/CNPJ, cidade/UF, e-mail oficial, DPO/contato se aplicável, foro e data de vigência; revisão jurídica final é necessária.
- **Prova social:** obter autorização e fatos de clientes reais antes de publicar depoimentos, logos ou métricas.
- **Preço/contrato:** confirmar oferta comercial oficial e alinhar termos, Stripe e páginas públicas.

## 12. Próximas Ações por Impacto

1. Corrigir os dados legais e a divergência de planos/preços com decisão do responsável.
2. Instrumentar o funil até primeira venda e retorno D7.
3. Rodar 10 entrevistas e 5 demonstrações com um único microsegmento presencial.
4. Publicar somente prova social verificável.
5. Validar white-label com 10 parceiros antes de construir operação adicional.
