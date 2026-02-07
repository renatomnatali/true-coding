# True Coding - Visão Geral do Projeto

> "Esqueça o Vibe Coding, use o True Coding"

## 1. Resumo Executivo

**True Coding** é uma plataforma SaaS que permite usuários criarem aplicações web completas a partir de descrições em linguagem natural. Diferente de ferramentas de "vibe coding", o True Coding gera código profissional com:

- Testes automatizados
- CI/CD configurado
- Trunk-based development
- Deploy automatizado
- Código limpo e documentado

## 2. Problema

Desenvolvedores e empreendedores enfrentam barreiras para transformar ideias em produtos:

1. **Curva de aprendizado**: Setup de projetos, configuração de ferramentas
2. **Boilerplate repetitivo**: Cada projeto novo exige reconfigurar CI/CD, testes, deploy
3. **Qualidade inconsistente**: Ferramentas de IA geram código que "funciona" mas não é production-ready
4. **Falta de boas práticas**: Código gerado sem testes, sem convenções, sem CI

## 3. Solução

Plataforma que:

1. **Entende a ideia** via conversa guiada com IA
2. **Planeja tecnicamente** a implementação
3. **Gera código real** com testes, CI/CD, convenções
4. **Deploya automaticamente** na Vercel
5. **Permite iteração** para adicionar features

## 4. Público-Alvo

| Persona | Necessidade |
|---------|-------------|
| **Empreendedor técnico** | Validar MVPs rapidamente |
| **Desenvolvedor júnior** | Aprender boas práticas vendo código gerado |
| **Freelancer** | Acelerar entrega de projetos |
| **Startup early-stage** | Reduzir tempo de desenvolvimento |

## 5. Proposta de Valor

| Vibe Coding | True Coding |
|-------------|-------------|
| Código que "funciona" | Código production-ready |
| Sem testes | Testes incluídos |
| Copy-paste de prompts | Conversa estruturada |
| Deploy manual | Deploy automatizado |
| Sem versionamento | Git desde o início |
| Sem CI/CD | GitHub Actions configurado |

## 6. Fluxo do Usuário

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. DISCOVERY                                                    │
│    Usuário descreve ideia → IA faz perguntas → BusinessPlan     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. PLANNING                                                     │
│    BusinessPlan → IA gera arquitetura → TechnicalPlan           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CONNECT                                                      │
│    Usuário conecta GitHub (OAuth) + Vercel                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. GENERATE                                                     │
│    Sistema cria repo → Gera código → Configura CI/CD            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. DEPLOY                                                       │
│    Vercel importa repo → Build → Deploy → URL de produção       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. ITERATE                                                      │
│    Usuário solicita feature → Repete fluxo 1-5                  │
└─────────────────────────────────────────────────────────────────┘
```

## 7. Escopo do MVP

### Incluído

- Wizard de discovery (5-10 perguntas)
- Geração de plano de negócio
- Geração de plano técnico
- Conexão GitHub OAuth
- Criação de repositório
- Geração de código Next.js com:
  - TypeScript
  - Tailwind CSS
  - Testes (Vitest)
  - CI/CD (GitHub Actions)
  - ESLint configurado
- Deploy na Vercel
- Dashboard de projetos

### Não Incluído (MVP)

- Múltiplas opções de stack (apenas Next.js)
- Iteração pós-deploy (novas features)
- Outros provedores de deploy
- Colaboração em equipe
- Templates customizados
- Backend com banco de dados

## 8. Métricas de Sucesso

| Métrica | Target MVP |
|---------|------------|
| Taxa de projetos criados com sucesso | > 80% |
| Tempo discovery → deploy | < 10 minutos |
| Código que compila | > 95% |
| Testes passando | > 90% |
| NPS usuários beta | > 40 |

## 9. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Código gerado com erros | Alta | Alto | Validação AST + build antes de commit |
| Custo de API de IA | Média | Médio | Cache + rate limiting + tiers de modelo |
| Rate limits GitHub/Vercel | Baixa | Alto | Filas de processamento + retry |
| Usuários abusivos | Média | Médio | Verificação de email + quotas |

## 10. Timeline

| Fase | Duração | Entregável |
|------|---------|------------|
| 0. Setup | 1 semana | Projeto configurado |
| 1. Core AI | 2 semanas | Discovery wizard funcional |
| 2. GitHub | 1.5 semanas | Integração GitHub completa |
| 3. Code Gen | 2 semanas | Geração de código funcional |
| 4. Deploy | 1 semana | Deploy automático Vercel |
| 5. Polish | 1 semana | MVP pronto para beta |
| **Total** | **8-9 semanas** | |

## 11. Custos Estimados

### Infraestrutura (mensal)

| Serviço | Custo |
|---------|-------|
| Vercel Pro | $20 |
| Neon PostgreSQL | $0-19 |
| Upstash Redis | $0 |
| Claude API | $50-200 |
| Clerk Auth | $0 |
| **Total** | **$70-240/mês** |

### Custo por Projeto Gerado

| Fase | Tokens | Custo |
|------|--------|-------|
| Discovery | ~5k | $0.015 |
| Planning | ~3k | $0.01 |
| Code Gen | ~20k | $0.06 |
| **Total** | **~28k** | **$0.085** |
