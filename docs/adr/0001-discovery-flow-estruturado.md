# 0001. Discovery Flow com 5 Perguntas Estruturadas

**Status:** Aceito

**Data:** 2026-01-27

**Decisores:** Engineering Team, Product Lead

**Tags:** `#ux` `#discovery` `#ai-interaction`

---

## Contexto

O fluxo de Discovery atual tem taxa de conclusão de apenas ~30%. Usuários frequentemente:

- Não sabem quantas perguntas faltam
- Abandonam no meio sem gerar Business Plan
- Ficam confusos sobre o que responder
- Não veem o plano sendo construído (processo é "caixa preta")

**Requisitos:**
- Aumentar taxa de conclusão para >80%
- Dar transparência total sobre progresso
- Garantir que AI obtenha informações suficientes
- Manter experiência conversacional (não parecer formulário)

**Impacto de não resolver:**
- Baixo uso do produto
- Frustração do usuário
- Business Plans incompletos/ruins

## Decisão

Decidimos **implementar um Discovery estruturado com 5 perguntas obrigatórias** em vez de conversa livre, porque precisamos de dados consistentes para gerar Business Plans de qualidade.

### Estrutura das 5 Perguntas:

1. **Problema e Público-Alvo**
   - O que resolver e para quem
   - Exemplo: "Ajudar freelancers a organizar projetos"

2. **Features Core (Must-Have)**
   - 3-5 funcionalidades essenciais
   - Exemplo: "Autenticação, Dashboard, CRUD de tarefas"

3. **Diferenciais**
   - O que torna o projeto único vs concorrentes
   - Exemplo: "Mais simples que Trello, preço acessível"

4. **Nice-to-Have**
   - Features desejadas mas não essenciais
   - Exemplo: "Integrações, app mobile, relatórios"

5. **Monetização**
   - Modelo de negócio
   - Exemplo: "Freemium - grátis até 5 usuários"

### Características do Fluxo:

- ✅ **Indicador de progresso visível** - "Pergunta X de 5"
- ✅ **Quick replies** - Sugestões contextuais por pergunta
- ✅ **Live preview** - Cards aparecem no workspace conforme responde
- ✅ **Confirmação** - Resumo completo antes de gerar plano
- ✅ **Loading transparente** - Overlay mostra steps da geração

## Consequências

### Positivas

- ✅ **Taxa de conclusão >80%** - Usuário sabe exatamente o que falta
- ✅ **Business Plans consistentes** - Sempre contém informações essenciais
- ✅ **Reduz ansiedade** - Transparência sobre processo e tempo
- ✅ **Feedback imediato** - Cards mostram plano sendo construído
- ✅ **Engajamento maior** - Animações e progresso são satisfatórios
- ✅ **Dados estruturados** - Analytics precisos sobre abandono

### Negativas

- ⚠️ **Menos flexível** - Usuário não pode pular perguntas
- ⚠️ **Parecer formulário** - Risco de perder sensação conversacional
- ⚠️ **Complexidade maior** - Precisa rastrear progresso no banco
- ⚠️ **AI pode errar ordem** - Precisa de prompt engineering cuidadoso

### Riscos

- 🔴 **AI não segue estrutura** - Mitigação: Marcadores HTML `<!--Q:N-->` + validação
- 🟡 **Usuário quer voltar** - Mitigação: Permitir editar respostas anteriores
- 🟡 **Perguntas inadequadas** - Mitigação: A/B test com variações

## Alternativas Consideradas

### Opção A: Conversa Livre (Status Quo)

**Descrição:** AI faz perguntas dinamicamente baseado em respostas.

**Prós:**
- Conversacional e natural
- Flexível para diferentes tipos de projeto
- Sem complexidade de tracking

**Contras:**
- Taxa de conclusão baixa (~30%)
- Business Plans inconsistentes
- Usuário não sabe quanto falta
- Difícil de debugar/melhorar

**Por que rejeitada:**
Métricas atuais provam que não funciona. Usuários precisam de estrutura clara.

### Opção B: Formulário Tradicional

**Descrição:** Form com 5 campos obrigatórios, sem chat.

**Prós:**
- Taxa de conclusão alta (>90%)
- Simples de implementar
- Validação fácil

**Contras:**
- Perde "magia" da AI
- Experiência chata e burocrática
- Não educa usuário sobre o processo
- Não diferencia de ferramentas tradicionais

**Por que rejeitada:**
Vai contra a proposta de valor do True Coding (AI-powered). Precisamos manter experiência conversacional.

### Opção C: Híbrida (3 perguntas + conversa livre)

**Descrição:** 3 perguntas obrigatórias, depois AI faz perguntas adicionais se necessário.

**Prós:**
- Mais flexível que 5 fixas
- Mantém estrutura mínima
- Permite adaptação

**Contras:**
- Complexo de implementar (dois modos)
- Usuário confuso sobre quando termina
- Business Plans ainda inconsistentes

**Por que rejeitada:**
Complexidade não justificada. 5 perguntas fixas é suficiente para 90% dos casos.

## Implementação

### Fase 1: Backend (Dia 3)
1. Migration: adicionar `discoveryState`, `currentQuestion`, `completedQuestions`
2. Atualizar prompt com estrutura de 5 perguntas
3. Adicionar marcadores `<!--Q:N-->` nas respostas da AI

### Fase 2: Frontend (Dia 2)
4. Componente `ProgressIndicator` ("Pergunta X de 5")
5. Componente `QuickReplyButtons` (sugestões contextuais)
6. Componente `LivePreviewCard` (preview no workspace)

### Fase 3: Polish (Dia 2)
7. Loading overlay com steps
8. Confirmação com resumo completo
9. Animações e transições

## Métricas de Sucesso

**Curto Prazo (1 semana):**
- Taxa de conclusão Q5: **>70%** (atual: ~30%)
- Taxa de geração de plano após Q5: **>90%**
- Tempo médio de discovery: **<7 min**

**Médio Prazo (1 mês):**
- Taxa de conclusão Q5: **>80%**
- Taxa de geração de plano: **>95%**
- Tempo médio: **<5 min**
- NPS Discovery: **>4.0/5**

**Dados a coletar:**
- Tempo em cada pergunta
- Taxa de uso de quick replies
- Taxa de abandono por pergunta
- Feedback qualitativo (survey pós-discovery)

## Referências

- [UX Plan Original](../../mockups/DESIGN-DECISIONS.md)
- [Mockups de Discovery](../../mockups/discovery/)
- [Research: Why Users Abandon Forms](https://baymard.com/blog/checkout-flow-average-form-fields)
- [Conversational UI Best Practices](https://www.nngroup.com/articles/chatbots/)

## Notas

- Quick replies baseados em análise de 100+ projetos criados no Alpha
- Estrutura de 5 perguntas validada com 10 usuários beta
- Inspiração: Typeform (progresso visual), Intercom (conversa guiada)

---

**Histórico de Mudanças:**

- 2026-01-27: Criado (Status: Proposto)
- 2026-01-27: Aceito após validação com mockups
