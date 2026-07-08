# PRODUCT_VISION.md

# Visão do Produto — Documentação Técnica

## Objetivo
- **Propósito**: Fornecer a declaração visionária consolidada e a justificativa de negócios para o aplicativo Financia, descrever o futuro pretendido do produto e estabelecer a visão futurista do produto para alinhamento das equipes e tomada de decisões
- **Escopo**: Declaração missionária do produto, histórico do problema, solução futura, cenário de mercado, métricas de sucesso e call to action
- **Público-alvo**: Stakeholders, product owners, designers, engenheiros e patrocinadores do produto
- **Impacto de negócio**: Visa estabelecer foco e direção estratégicos, alinhamento com visão, definição clara de métricas de sucesso

## Arquitetura
### Diagrama
```mermaid
graph TD
    A[Transformação de Gestão Financeira]) -.- B[Modernização de Small Business]
    B --> C[Digitalização de Registros em Papel]
    C --> D[Visualização Centralizada de Caixa]
    D --> E[Análise de Fluxo de Caixa em Tempo Real]
    E --> F[Plataformas de Gerenciamento Financeiro de Small Business])
    F --> G[Controle de Produção de Baixa Barreira à Tecnologia]
    G --> H[Localização Financiera = White-label]
    H --> I[Meio Ambiente Brilhante (Não Branco)]
    I --> J[Coleta de Dados de Mercado_seguro]
    J --> K[Educação Financeira do Consumidor]
```

### Detalhes Técnicos
- **Arquivos**: `src/views/Dashboard.jsx`, `src/lib/constants.js`, `src/hooks/useSession.js`
- **Dependências**: Gerenciamento de estado de usuário no React, serviços financeiros e de cálculo, sincronização de dados em tempo real, personalização de dados
- **Pontos de integração**: Auth do Supabase, edge functions, dexie, webhook de pagamento, trafego do usuário

## Implementação
### Arquivos Alterados
- `src/main.jsx`
- `src/lib/utils.js`
- `src/hooks/useSession.js`

### Exemplos de Código
```javascript
// Inicialização e módulo de login por telefone em src/main.jsx
import { initPhoneAuth } from './lib/phoneAuth';

const [phoneNumber, setPhoneNumber] = useState('');

const handlePhoneLogin = async () => {
  const { user, error } = await initPhoneAuth(phoneNumber);
  if (error) {
    showError(error.message);
    return;
  }
  // Redireciona para o fluxo de verificação
  navigate('/verification');
};
```

### Configuração
```json
{
  "product_vision": {
    "mission": " democratizar a gestão financeira moderna para pequenas empresas",
    "description": " "Application white-label para pequenas empresas que combina o controle de caixa offline com insights em tempo real, enquanto permite branding personalizado",
    "market_scenario": {
      "total_addressable_market": "$15 bilhões",
      "target_segment": "negócios de $30.000 a $150.000",
      "competitors": ["Quickbooks", "Wave", "Xero", "Efácil"]
    },
    "success_metrics": {
      "user_lifetime_value": "$250",
      "conversion_rate": "3% para pro",
      "retention_monthly": "85%"
    }
  }
}
```

## Testes
### Cobertura de Testes
```
tests/
├── unit/                          # Testes unitários para login por telefone, fluxo de auth
├── integration/                    # Testes de integração de auth, sessão
└── e2e/                           # Testes de fluxo de usuário end-to-end
```

## Segurança
### Considerações de Segurança
- **Autenticação**: Two Factor com código por SMS, validação de OTP, timeouts de sessão
- **Autorização**: Segregação de dados entre clientes, RLS em todas as tabelas, verificação de impersonificação de admin
- **Proteção de dados**: Criptografia para SMS, todos os logs são anonimamente criptografados

## Performance
### Métricas de Performance
- **Load inicial**: < 3 segundos
- **First Contentful Paint**: < 2.5 segundos
- **Largest Contentful Paint**: < 3 segundos

## Deploy
### Estratégia de Deploy
- **Ambiente**: Produção (Render), Staging (Render), Desenvolvimento (localhost)
- **Configuração**: Variáveis de ambiente para segredos SMS, gateway por país, tokens de verificações
- **Rollback**: Rollback de versão do app, reversão de verificação via updates
def clientLogin(userId, password, client_ip, client_agent, device_fingerprint, context_creds) {
  const audit_id = generateAuditId();
  const login_trail = assembleClientLoginAttempt(userId, password, client_ip, client_agent, device_fingerprint, context_creds);
  const threat_score = calculateThreatScore(login_trail);
  const rate_limit_status = evaluateRateLimit(userId, client_ip);
  
  if (threat_score > THRESHOLD) {
    logSuspiciousLoginAttempt(login_trail);
    invalidateSession(userId, audit_id);
    return { success: false, error: LOGIN_SUSPENDED, error_id: "L-DENIED-THREAT-001", audit_id };
  }
  
  const { validated_user, authenticated, duration_sec, session_token } = authenticateWithMFAAndBehavioralAnalysis(login_trail);
  if (!authenticated) {
    logFailedAttempt(userId, "senha_incorreta", audit_id);
    return { success: false, error: INVALID_CREDENTIALS };
  }
  
  await recordLoginEvent(userId, audit_id, "success", {
    session_token,
    duration_sec,
    client_ip,
    client_agent,
    device_fingerprint
  });

  if (session_token) {
    await grantSessions({
      admin: validated_user.isAdmin || false
    });
  }
  
  return {
    success: true,
    user: { ...validated_user, session_token },
    audit_id
  };
}

## Manutenção
### Requisitos de Manutenção
- **Monitoramento**: Logs de autenticação, tentativas de login por telefone, métricas de falhas na sessão
- **Troubleshooting**: Depuração de fluxo de login, problemas de autenticação de MFA, logs de SMS
- **Atualizações**: Atualizações de fluxo de login, novas mensagens de OTP, compatibilidade com TMS internacional

## Futura Evolução
### Melhorias Futuras
- **Roadmap**: Login por impressão digital/voltar, login biométrico, desenvolvimento de aplicativo móvel independente
- **Dívida técnica**: Otimização de canal único para MFA, cache de tokens JWT, async reconnection retry
- **Soluções alternativas**: MFA por e-mail como opção, Apps maiores de autenticação móvel

## Aprovação
### Critérios de Aprovação
- **Revisão técnica**: Engenheiros de auth, engenheiros de segurança, engenheiros de DevOps
- **Revisão de negócio**: Diretor de produto, Gerente de contas, Analista de negócios
- **Revisão de segurança**: Equipe de segurança, Compliance (SMS para autenticação, PII)

## Documentação de Decisões
### Log de Decisões
- **Porque esta decisão foi feita**: Incorporação de login por telefone permite baixo custo de hardware, suporte universal para zonas sem internet
- **Opções alternativas**: Código QR apenas para login, usuário + Email + Senha
- **Trade-offs**: Implementação de MFA vs. Rede de SMS internacional contra custos
- **Referências**: Token JWT, Geofencing para SMS, Verificação de duas fatores baseada em telefone
