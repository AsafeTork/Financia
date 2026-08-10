# FinanciaBR.me — Commercial Playbook

## Pitch de 30 segundos

O Financia é um app simples para pequenos negócios registrarem vendas, despesas e estoque, mesmo sem internet. Ele sincroniza quando a conexão volta e mostra o resultado do negócio em uma visão só. Comece grátis, sem cartão.

**FATO:** a operação offline, os módulos e os planos existem no produto.
**NÃO É CLAIM:** não afirmar economia, quantidade de clientes ou resultado financeiro sem evidência real.

## Cliente inicial recomendado

Pequeno negócio presencial com estoque leve e conectividade irregular: salão, loja de bairro ou oficina.

**HIPÓTESE:** esse perfil percebe mais rapidamente o valor de registrar a venda no momento em que ela acontece.

## Roteiro de demonstração em 5 minutos

1. **Contexto, 30s:** “Como você registra vendas e despesas hoje? O que acontece quando fica sem internet?”
2. **Venda, 60s:** abrir Vendas/Ganhos, registrar uma venda e mostrar o retorno ao Dashboard.
3. **Estoque, 60s:** cadastrar um produto, mostrar custo/quantidade e explicar a baixa associada à venda.
4. **Resultado, 60s:** abrir Dashboard e Relatório, mostrar entradas, despesas, resultado líquido e previsão de caixa quando houver dados.
5. **Offline, 45s:** em ambiente de teste, desligar a rede, registrar uma ação e religar; explicar que a sincronização depende da reconexão.
6. **Oferta, 45s:** mostrar Free, Pro e Premium, confirmar qual limite ou necessidade existe e propor cadastro assistido.

Não usar dados de clientes reais na demo sem autorização. Os números da landing são ilustrativos.

## Oferta para usuário final

- **Grátis:** testar o hábito com até 50 transações, 20 produtos e 10 perdas.
- **Pro:** R$ 49,90/mês, para uso ilimitado e relatórios/exportação.
- **Premium:** R$ 99,90/mês, para equipes e recursos avançados.

Esses valores seguem `supabase/functions/_shared/stripe.ts` (`PLAN_PRICES`) e `src/lib/constants.js`. Os Termos ainda exigem revisão jurídica antes de serem tratados como documento definitivo.

## Objeções e respostas honestas

| Objeção | Resposta |
|---|---|
| “Já uso planilha.” | “Você pode testar sem abandonar nada: registre apenas as vendas desta semana e veja se o fechamento fica mais simples.” |
| “Preciso de internet?” | “O produto foi projetado para registrar vendas offline e sincronizar depois. A sincronização depende de a conexão voltar.” |
| “É sistema fiscal/contábil?” | “Não. O Financia organiza vendas, despesas, estoque e resultado; não substitui contador nem emissão fiscal.” |
| “Posso testar?” | “Sim. O plano Grátis não exige cartão e tem limites explícitos.” |
| “Meus dados ficam seguros?” | “A conta usa isolamento por usuário e conexão criptografada. Consulte a Política de Privacidade para detalhes e confirme os dados legais publicados.” |
| “Vocês têm muitos clientes?” | “Não vou afirmar um número sem fonte. Podemos mostrar o produto e resultados reais somente quando autorizados e verificados.” |

## Experimento de primeiro cliente

### Hipótese

Pequenos negócios presenciais com estoque leve demonstram interesse quando a oferta começa por “registrar a venda mesmo sem internet” e termina em “ver o resultado da semana”.

### Público

10 proprietários de salões, lojas de bairro ou oficinas, acessíveis por rede local, indicação ou contato profissional permitido.

### Oferta

Configuração assistida de uma conta Free, cadastro de até cinco produtos e acompanhamento de uma semana. Não prometer desconto, economia ou suporte permanente sem decisão comercial.

### Canal

WhatsApp para contatos já autorizados ou indicação direta; abordagem presencial/local para os primeiros testes. Não disparar mensagens em massa.

### Métricas

- respostas;
- conversas qualificadas;
- demonstrações realizadas;
- cadastros concluídos;
- primeira venda;
- retorno em 7 dias;
- upgrade iniciado;
- pagamento confirmado.

### Critério

- **Validado:** pelo menos 5 demos, 3 primeiras vendas e 1 pagamento sem desconto não aprovado.
- **Inconclusivo:** menos de 5 demos ou usuários que não chegaram à primeira venda; revisar canal e onboarding antes de concluir sobre preço.
- **Invalidado:** 10 conversas qualificadas sem nenhuma demo ou 5 demos sem interesse em continuar, após testar a mensagem com dois segmentos.

## Perguntas de descoberta

- Quantas vendas você registra por dia?
- Onde registra quando está sem internet?
- Como sabe quanto sobrou no fim da semana?
- Você separa dinheiro pessoal e do negócio?
- Quem mais precisa ver estoque ou resultado?
- Qual limite faria você pagar por uma ferramenta?
- O que precisaria estar funcionando para trocar sua planilha?

## Oferta experimental para parceiros

Para contadores, consultores ou agências que já atendem pequenos negócios:

“Estamos validando uma solução simples de vendas, despesas, estoque e caixa offline para seus clientes. Antes de construir um programa de revenda, queremos entender se você venderia uma ferramenta assim, qual suporte esperaria e qual margem justificaria indicar. Podemos fazer uma demonstração de 20 minutos com um cliente-tipo?”

### Qualificação

- atende pelo menos 5 pequenos negócios;
- já recomenda software ou presta BPO/consultoria;
- possui canal recorrente com os clientes;
- aceita testar uma demo e discutir responsabilidades de suporte;
- revela preço/margem esperados sem compromisso.

### Critério de validação

- **Sinal forte:** 10 abordagens, 4 reuniões, 2 pedidos de proposta.
- **Sinal fraco:** respostas positivas genéricas sem reunião.
- **Invalidado por agora:** 10 contatos qualificados sem reunião ou sem problema claro que o white-label resolva.

Não vender white-label como operação pronta: ainda faltam painel de parceiro, domínio customizado, SLA, suporte e contrato.
