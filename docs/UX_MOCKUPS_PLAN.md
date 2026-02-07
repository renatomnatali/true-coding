# Plano UX Completo - Mockups True Coding

**Versao:** 1.0
**Data:** 2026-01-28
**Autor:** UX Planning Agent

---

## A. Resumo do Problema e Objetivos

### Problema de Negocio
True Coding e uma plataforma SaaS para criar aplicacoes web profissionais a partir de linguagem natural. O usuario conversa com uma AI que gera codigo automaticamente, passando por 6 fases ate o deploy.

### Problemas Identificados nos Mockups Atuais

| # | Problema | Impacto | Severidade |
|---|----------|---------|------------|
| 1 | Progress bar mostra "Fase 2 de 6" quando deveria mostrar progresso DENTRO da fase | Usuario nao sabe quantas perguntas faltam | Alta |
| 2 | "Voltar ao Dashboard" esta acima do logo | Hierarquia visual quebrada, confuso | Alta |
| 3 | Sidebar: identacao de sub-itens confusa | Dificil entender hierarquia das fases | Media |
| 4 | Chat colapsado: workspace nao ganha espaco util | Layout desperdicado | Media |
| 5 | Faltam secoes: Integracoes e Recursos | Navegacao incompleta | Media |
| 6 | Falta Dashboard com CRUD de projetos | Fluxo incompleto | Alta |
| 7 | Faltam estados: loading, error, empty, success | UX incompleta | Alta |

### Objetivos do Plano

1. **Dashboard funcional**: CRUD completo de projetos
2. **Jornada completa**: 6 fases com todos os estados
3. **Navegacao clara**: Hierarquia visual correta
4. **Progress indicators corretos**: Jornada global vs progresso local
5. **Layout responsivo**: Desktop e mobile
6. **Estados completos**: Loading, error, empty, success para cada tela

---

## B. Premissas e Restricoes

### Fatos Confirmados
- Stack: Next.js 15, React 19, TypeScript, Tailwind, Prisma, Clerk
- 6 fases: Ideacao, Planejamento, Conexao, Geracao, Deploy, Online
- Fase Planejamento tem 3 sub-etapas: Negocio, Tecnico, UX
- Tokens ja definidos em `mockups/css/tokens.css`
- Layout base existe em `mockups/v2/css/v2-layout.css`

### Hipoteses (a validar)
- Usuario quer ver progresso granular dentro de cada fase
- Chat colapsado deve ser estado menos comum (usuario engajado conversa)
- Mobile: usuarios acessam mais para revisar do que para criar

### Restricoes
- Mockups estaticos HTML/CSS (com JS minimo para simular estados)
- Nao implementar backend funcional
- Seguir tokens visuais existentes
- WCAG 2.2 AA para acessibilidade

---

## C. Personas

### Persona Primaria: Empreendedor Tecnico (Bruno)

**Contexto:**
- 32 anos, fundador de startup early-stage
- Sabe programar mas nao quer gastar tempo com boilerplate
- Trabalha de coworking, alterna entre desktop e mobile

**JTBD:**
- "Quando tenho uma ideia de produto, quero validar rapidamente com um MVP funcional, para testar com usuarios antes de investir em desenvolvimento completo."

**Pain Points:**
1. Configurar projeto do zero demora demais
2. Ferramentas de AI geram codigo "que funciona" mas sem qualidade
3. Precisa explicar a mesma coisa varias vezes para a AI

**Gatilhos:**
- Ideia de novo produto
- Cliente pediu feature nova
- Quer testar hipotese de mercado

**Barreiras:**
- Tempo limitado (maximo 30 min para validar)
- Ceticismo com qualidade do codigo gerado
- Medo de ficar preso em ferramenta proprietaria

**Linguagem:**
- Direto, tecnico mas nao expert
- "Preciso de um MVP", "quanto tempo leva?", "posso customizar depois?"

**Acessibilidade:**
- Sem necessidades especiais identificadas

### Persona Secundaria: Desenvolvedor Junior (Camila)

**Contexto:**
- 24 anos, 2 anos de experiencia
- Quer aprender boas praticas vendo codigo gerado
- Usa principalmente no trabalho (desktop)

**JTBD:**
- "Quando preciso criar um projeto novo, quero ver como um sênior estruturaria o codigo, para aprender e evitar erros comuns."

**Pain Points:**
1. Nao sabe configurar CI/CD do zero
2. Incerteza sobre estrutura de pastas "correta"
3. Code reviews sempre apontam os mesmos erros

**Acessibilidade:**
- Preferencia por textos maiores (usa zoom 110%)

---

## D. Jornadas Detalhadas

### Jornada 1: Criar Primeiro Projeto (Bruno)

```
TRIGGER: Bruno tem ideia de app para gerenciar entregas de restaurante
CONTEXTO: Notebook no coworking, 45 min disponiveis
OBJETIVO: Ter URL funcionando para mostrar ao socio
```

| Etapa | Acao | Emocao | Expectativa | Friccao Potencial | Recuperacao |
|-------|------|--------|-------------|-------------------|-------------|
| 1. Dashboard vazio | Ve empty state | Curioso | Instrucao clara | "O que faco aqui?" | CTA "Criar projeto" |
| 2. Cria projeto | Clica + | Ansioso | Processo rapido | Nome obrigatorio? | Placeholder sugestivo |
| 3. Discovery Q1 | Responde "o que voce quer criar?" | Engajado | Pergunta inteligente | Pergunta vaga demais | Quick replies |
| 4. Discovery Q2-5 | Responde perguntas | Fluindo | Perguntas relevantes | "Quantas perguntas faltam?" | Progress indicator |
| 5. Confirma resumo | Revisa plano | Validando | Poder editar | Resumo incompleto | Botao "Ajustar" |
| 6. Gera Plano Negocio | Aguarda geracao | Impaciente | Feedback de progresso | "Travou?" | Progress com etapas |
| 7. Revisa Plano | Le plano gerado | Impressionado | Conteudo util | "Posso mudar isso?" | Botao editar inline |
| 8. Plano Tecnico | AI pergunta stack | Confiante | Sugestoes inteligentes | Opcoes demais | Defaults recomendados |
| 9. Conecta GitHub | OAuth popup | Preocupado | Permissoes minimas | Popup bloqueado | Instrucao de desbloqueio |
| 10. Geracao | Aguarda codigo | Tenso | Ver progresso real-time | "O que esta gerando?" | Log de arquivos |
| 11. Deploy | Aguarda build | Ansioso | Tempo estimado | Build falha | Erro claro + retry |
| 12. Online | Ve URL funcionando | Empolgado | Link funcionando | 404 | Retry automatico |
| 13. Compartilha | Copia URL | Satisfeito | Copiar facil | Link longo demais | Botao "Copiar" |

**Metricas:**
- Tempo total: < 10 minutos
- Taxa de conclusao: > 80%
- Retry por falha: < 2

### Jornada 2: Retomar Projeto em Andamento (Bruno)

```
TRIGGER: Bruno fechou o navegador ontem e quer continuar
CONTEXTO: Mobile no onibus, 5 min disponiveis
OBJETIVO: Ver status e talvez responder uma pergunta
```

| Etapa | Acao | Emocao | Expectativa | Friccao |
|-------|------|--------|-------------|---------|
| 1. Dashboard | Ve lista de projetos | Orientado | Card com status claro | "Qual projeto era?" |
| 2. Abre projeto | Clica no card | Esperando | Voltar exatamente onde parou | "Perdi meu progresso?" |
| 3. Continua chat | Ve ultima pergunta | Aliviado | Contexto preservado | Precisa reler tudo |
| 4. Responde | Usa quick reply | Eficiente | Resposta aceita | Teclado cobre chat |
| 5. Sai | Fecha app | Confiante | Progresso salvo | "Salvou?" |

---

## E. Fluxos e Requisitos

### E.1 Sitemap / Arquitetura de Informacao

```
TRUE CODING
│
├── / (Landing - fora do escopo)
│
├── /dashboard
│   ├── Lista de projetos (cards)
│   ├── [+] Criar novo projeto (modal)
│   ├── [card] → /project/{id}
│   ├── [kebab] Editar nome/descricao (modal)
│   └── [kebab] Excluir projeto (modal confirmacao)
│
└── /project/{id}
    │
    ├── SIDEBAR
    │   ├── [Link] Voltar ao Dashboard
    │   ├── Logo + Nome do Projeto
    │   ├── Indicador Jornada (Fase X de 6)
    │   │
    │   ├── [NAV] Fases da Jornada
    │   │   ├── 1. Ideacao
    │   │   ├── 2. Planejamento
    │   │   │   ├── 2.1 Negocio
    │   │   │   ├── 2.2 Tecnico
    │   │   │   └── 2.3 UX
    │   │   ├── 3. Conexao
    │   │   ├── 4. Geracao
    │   │   ├── 5. Deploy
    │   │   └── 6. Online
    │   │
    │   ├── [SECAO] Integracoes
    │   │   ├── GitHub (conectar/conectado)
    │   │   └── Vercel (conectar/conectado)
    │   │
    │   ├── [SECAO] Recursos
    │   │   ├── Repositorio (link externo)
    │   │   └── Site (link externo)
    │   │
    │   └── FOOTER
    │       └── Avatar + Nome do usuario
    │
    ├── WORKSPACE (conteudo da fase atual)
    │   ├── Breadcrumb
    │   ├── Titulo da fase
    │   ├── Conteudo contextual
    │   └── Acoes
    │
    └── CHAT (colapsavel desktop, drawer mobile)
        ├── Header com titulo da fase
        ├── Progress da fase (Pergunta X de Y)
        ├── Mensagens
        ├── Quick replies
        └── Input
```

### E.2 Fluxo: Dashboard CRUD

```
┌─────────────────────────────────────────────────────────────┐
│                        DASHBOARD                             │
└─────────────────────────────────────────────────────────────┘
         │
         ├── [Nenhum projeto] ──────────────────────────────────┐
         │                                                       │
         │   ┌─────────────────────────────────────────────┐    │
         │   │             EMPTY STATE                      │    │
         │   │  ┌─────────────────────────────────────┐    │    │
         │   │  │  "Voce ainda nao tem projetos"      │    │    │
         │   │  │                                     │    │    │
         │   │  │  [+ Criar meu primeiro projeto]     │────┼────┘
         │   │  └─────────────────────────────────────┘    │
         │   └─────────────────────────────────────────────┘
         │
         ├── [Com projetos] ────────────────────────────────────┐
         │                                                       │
         │   ┌─────────────────────────────────────────────┐    │
         │   │  HEADER: "Meus Projetos" [+ Novo]           │    │
         │   │                                              │    │
         │   │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │    │
         │   │  │ Card 1  │ │ Card 2  │ │ Card 3  │        │    │
         │   │  │ Nome    │ │ Nome    │ │ Nome    │        │    │
         │   │  │ Status  │ │ Status  │ │ Status  │        │    │
         │   │  │ [...]   │ │ [...]   │ │ [...]   │        │    │
         │   │  └────┬────┘ └─────────┘ └─────────┘        │    │
         │   └───────┼────────────────────────────────────-┘    │
         │           │                                           │
         │           ├── [Click card] → /project/{id}           │
         │           │                                           │
         │           └── [Click ...] → Menu contexto            │
         │                    │                                  │
         │                    ├── Editar → Modal Editar         │
         │                    │                                  │
         │                    └── Excluir → Modal Confirmacao   │
         │                              │                        │
         │                              ├── [Confirmar] → Delete │
         │                              └── [Cancelar] → Fecha   │
         │
         └── [Click + Novo] ────────────────────────────────────┐
                                                                 │
             ┌─────────────────────────────────────────────┐    │
             │           MODAL: CRIAR PROJETO              │    │
             │                                              │    │
             │  Nome do projeto: [________________]        │    │
             │                   "Meu App de Delivery"     │    │
             │                                              │    │
             │  Descricao (opcional): [______________]     │    │
             │                                              │    │
             │  [Cancelar]              [Criar projeto]    │    │
             └─────────────────────────────────────────────┘    │
                          │                                      │
                          └── [Criar] → /project/{id} (Fase 1)  │
```

### E.3 Fluxo: Jornada Completa (Happy Path)

```
FASE 1: IDEACAO (Discovery)
┌─────────────────────────────────────────────────────────────┐
│ WORKSPACE: "Vamos comecar!"                                 │
│ CHAT: Pergunta 1 de 5 → "O que voce quer criar?"           │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Usuario responde]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ CHAT: Pergunta 2 de 5 → "Quem vai usar?"                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Usuario responde x3]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ WORKSPACE: Resumo do Discovery                              │
│ CHAT: Pergunta 5 de 5 → "Confirma o resumo?"               │
│ [Ajustar] [Confirmar e Gerar Plano]                        │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Confirmar]
                               ▼
FASE 2: PLANEJAMENTO
┌─────────────────────────────────────────────────────────────┐
│ 2.1 PLANO DE NEGOCIO                                        │
│ WORKSPACE: Loading "Gerando Plano de Negocio..."           │
│ CHAT: Progresso 1/3                                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Geracao completa]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ WORKSPACE: Plano de Negocio (editavel)                     │
│ CHAT: "Revise o plano. Posso ajustar algo?"                │
│ [Editar] [Aprovar e Continuar]                             │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Aprovar]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2.2 PLANO TECNICO                                           │
│ CHAT: "Qual framework prefere?" + Quick replies            │
│ [React+Next.js] [Vue+Nuxt] [Angular] [Svelte]              │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Usuario escolhe]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ WORKSPACE: Loading "Gerando Plano Tecnico..."              │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Geracao completa]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2.3 PLANO UX                                                │
│ WORKSPACE: Loading "Gerando Plano UX..."                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Geracao completa]
                               ▼
FASE 3: CONEXAO
┌─────────────────────────────────────────────────────────────┐
│ WORKSPACE: "Conecte suas contas"                            │
│ [GitHub: Conectar] [Vercel: Conectar]                      │
│ CHAT: "Conecte o GitHub para eu criar o repositorio"       │
└──────────────────────────────┬──────────────────────────────┘
                               │ [OAuth GitHub + Vercel]
                               ▼
FASE 4: GERACAO
┌─────────────────────────────────────────────────────────────┐
│ WORKSPACE: "Gerando codigo..."                              │
│ Progress: Criando repositorio...                           │
│           Gerando package.json...                          │
│           Gerando componentes...                           │
│           Configurando CI/CD...                            │
│ CHAT: Log de arquivos gerados em tempo real                │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Geracao completa]
                               ▼
FASE 5: DEPLOY
┌─────────────────────────────────────────────────────────────┐
│ WORKSPACE: "Deploying..."                                   │
│ Progress: Importando para Vercel...                        │
│           Build em andamento...                            │
│           Otimizando assets...                             │
│ CHAT: Log de deploy                                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ [Deploy completo]
                               ▼
FASE 6: ONLINE
┌─────────────────────────────────────────────────────────────┐
│ WORKSPACE: "Seu projeto esta online!"                      │
│ URL: https://meu-app.vercel.app [Copiar] [Abrir]           │
│ Links: [Ver Repositorio] [Ver Dashboard Vercel]            │
│ CHAT: "Parabens! Seu projeto esta no ar."                  │
└─────────────────────────────────────────────────────────────┘
```

### E.4 Fluxo: Edge Cases e Erros

**Caso: Erro de conexao GitHub**
```
FASE 3 → [OAuth falha]
    │
    └── Modal Erro:
        "Nao foi possivel conectar ao GitHub"
        "Verifique se os popups estao habilitados e tente novamente"
        [Tentar novamente]
```

**Caso: Build falha no deploy**
```
FASE 5 → [Build error]
    │
    ├── WORKSPACE: Erro com detalhes
    │   "Build falhou: Module not found 'xyz'"
    │   [Ver log completo] [Tentar novamente]
    │
    └── CHAT: "Ops! O build falhou. Vou tentar corrigir."
             [Corrigir automaticamente] [Ver detalhes]
```

**Caso: Usuario fecha navegador durante geracao**
```
[Usuario volta]
    │
    └── Dashboard → [Card mostra status]
              │
              └── /project/{id} → Retoma de onde parou
                      │
                      └── CHAT: "Ola de volta! Continuando de onde paramos..."
```

---

## F. Especificacao UX/UI

### F.1 Componentes: Sidebar Navigation

#### Estrutura Hierarquica (CORRIGIDA)

```
┌─────────────────────────────────────────┐
│ ← Dashboard                              │  ← Link discreto, NAO botao
├─────────────────────────────────────────┤
│ [TC] True Coding                        │  ← Logo da plataforma
│                                          │
│ Meu App Delivery                        │  ← Nome do projeto (bold)
│ Fase 2 de 6 · Planejamento              │  ← Status atual
├─────────────────────────────────────────┤
│ JORNADA                                  │  ← Section title
│ ○────●────○────○────○────○              │  ← Visual progress (6 dots)
│                                          │
│ ✓ Ideacao                               │  ← Completed (verde, check)
│ ◐ Planejamento                          │  ← In progress (azul)
│   ├ ✓ Negocio                           │  ← Sub-item completed
│   ├ ◐ Tecnico                           │  ← Sub-item in progress
│   └ ○ UX                                │  ← Sub-item pending
│ ○ Conexao                               │  ← Pending (cinza)
│ ○ Geracao                               │
│ ○ Deploy                                │
│ ○ Online                                │
├─────────────────────────────────────────┤
│ INTEGRACOES                              │
│ ✓ GitHub                      conectado │  ← Verde se conectado
│ ✗ Vercel                      conectar  │  ← Link se nao conectado
├─────────────────────────────────────────┤
│ RECURSOS                                 │
│ ↗ Repositorio                           │  ← Link externo (se existir)
│ ↗ Site                                  │  ← Link externo (se existir)
├─────────────────────────────────────────┤
│ [RN] Renato Natali                      │  ← Avatar + nome
│      renato@email.com                   │
└─────────────────────────────────────────┘
```

#### Estados dos Itens de Navegacao

| Estado | Visual | Comportamento | Cor |
|--------|--------|---------------|-----|
| **Blocked** | Circulo vazio, opacidade 50% | Cursor not-allowed, tooltip "Complete X primeiro" | gray-400 |
| **Pending** | Circulo vazio | Clicavel se available | gray-600 |
| **In Progress** | Circulo meio preenchido | Background azul claro | primary |
| **Completed** | Check verde | Clicavel para revisitar | success |
| **Completed + Selected** | Check, background azul | Esta visualizando | primary |

#### CSS para Sub-itens (CORRIGIDO)

```css
/* Sub-itens devem ter identacao visual clara */
.nav-item.sub-item {
  margin-left: 24px;         /* Identacao */
  padding-left: 16px;
  border-left: 2px solid var(--color-border);  /* Linha conectora */
  font-size: 13px;           /* Menor que item pai */
}

.nav-item.sub-item:last-child {
  border-bottom-left-radius: 2px;
}
```

### F.2 Componentes: Chat Panel

#### Header do Chat (CORRIGIDO)

```
┌─────────────────────────────────────────┐
│ Discovery                        [◀]   │  ← Titulo da FASE, nao subfase
│                                          │
│ ████████░░░░░░░░░░  Pergunta 3 de 5     │  ← Progresso DENTRO da fase
└─────────────────────────────────────────┘
```

**Regra critica:** O progress bar do chat mostra progresso DENTRO da fase atual, NAO "Fase X de 6". O progresso geral da jornada fica na sidebar.

#### Logica de Progresso por Fase

| Fase | Tipo de Progresso | Exemplo |
|------|-------------------|---------|
| Ideacao | Perguntas | "Pergunta 3 de 5" |
| Planejamento | Sub-planos | "Plano 2 de 3" |
| Conexao | Integracoes | "1 de 2 conectadas" |
| Geracao | Arquivos | "23 de 45 arquivos" |
| Deploy | Etapas | "Build em andamento" |
| Online | - | Sem progress (estado final) |

### F.3 Componentes: Cards de Projeto (Dashboard)

```
┌─────────────────────────────────────────────────┐
│                                          [...]  │
│ Meu App Delivery                                │  ← Nome (16px, semibold)
│ App para gerenciar entregas de restaurante      │  ← Descricao (14px, gray)
│                                                  │
│ ○────●────○────○────○────○  Fase 2/6           │  ← Mini progress
│ Planejamento                                    │  ← Status label
│                                                  │
│ Atualizado ha 2 horas                           │  ← Timestamp (12px, gray)
└─────────────────────────────────────────────────┘
```

#### Estados do Card

| Estado | Border | Background | Indicador |
|--------|--------|------------|-----------|
| Hover | 2px primary | white | Sombra |
| Focus | 2px primary + ring | white | Focus ring |
| Loading | 2px gray | gray-50 | Shimmer |
| Error | 2px error | error-light | Icone erro |

### F.4 Estados Globais

#### Loading State

```
┌─────────────────────────────────────────────────┐
│ ┌─────┐                                         │
│ │ ◠   │  Gerando Plano de Negocio...           │
│ │  ◡  │                                         │
│ └─────┘  Analisando suas respostas              │
│          Identificando requisitos               │
│          Estruturando plano                     │
│                                                  │
│ ████████████░░░░░░░░░░  45%                     │
│                                                  │
│ Tempo estimado: ~30 segundos                    │
└─────────────────────────────────────────────────┘
```

#### Empty State (Dashboard)

```
┌─────────────────────────────────────────────────┐
│                                                  │
│            ┌─────────────────────┐              │
│            │                     │              │
│            │    [Ilustracao]     │              │
│            │                     │              │
│            └─────────────────────┘              │
│                                                  │
│         Voce ainda nao tem projetos             │
│                                                  │
│  Crie seu primeiro projeto e transforme sua    │
│  ideia em codigo profissional em minutos.       │
│                                                  │
│        [+ Criar meu primeiro projeto]           │
│                                                  │
└─────────────────────────────────────────────────┘
```

#### Error State

```
┌─────────────────────────────────────────────────┐
│         ┌───────┐                               │
│         │  ⚠️   │                               │
│         └───────┘                               │
│                                                  │
│  Nao foi possivel conectar ao GitHub            │  ← O que deu errado
│                                                  │
│  Verifique se os popups estao habilitados      │  ← Como resolver
│  no seu navegador e tente novamente.            │
│                                                  │
│  Codigo do erro: GITHUB_OAUTH_POPUP_BLOCKED     │  ← Ref para suporte
│                                                  │
│  [Ver documentacao]    [Tentar novamente]       │
│                                                  │
└─────────────────────────────────────────────────┘
```

#### Success State

```
┌─────────────────────────────────────────────────┐
│         ┌───────┐                               │
│         │  ✓    │  (verde, animado)             │
│         └───────┘                               │
│                                                  │
│        Projeto criado com sucesso!              │
│                                                  │
│  Seu projeto "Meu App Delivery" esta pronto    │
│  para comecar.                                  │
│                                                  │
│            [Ir para o projeto →]                │
│                                                  │
└─────────────────────────────────────────────────┘
```

### F.5 Microcopy Completo

#### Dashboard

| Elemento | Texto | Notas |
|----------|-------|-------|
| Page title | Meus Projetos | - |
| New button | + Novo projeto | Mobile: apenas + |
| Empty title | Voce ainda nao tem projetos | - |
| Empty description | Crie seu primeiro projeto e transforme sua ideia em codigo profissional em minutos. | - |
| Empty CTA | Criar meu primeiro projeto | - |
| Card menu: Edit | Editar | - |
| Card menu: Delete | Excluir | Vermelho |
| Delete confirm title | Excluir projeto? | - |
| Delete confirm body | Tem certeza que deseja excluir "Nome do Projeto"? Esta acao nao pode ser desfeita. | - |
| Delete confirm button | Excluir projeto | Vermelho |
| Delete cancel | Cancelar | - |

#### Chat

| Fase | Pergunta | Quick Replies |
|------|----------|---------------|
| Discovery Q1 | Ola! O que voce gostaria de criar hoje? | "App web", "API", "Landing page" |
| Discovery Q2 | Interessante! Quem vai usar esse produto? | "Consumidores (B2C)", "Empresas (B2B)", "Uso interno" |
| Discovery Q3 | Quais sao as principais funcionalidades? | (texto livre) |
| Discovery Q4 | O que diferencia sua ideia da concorrencia? | (texto livre) |
| Discovery Q5 | Como voce pretende monetizar? | "Assinatura mensal", "Compra unica", "Freemium", "Ainda nao sei" |
| Discovery Confirm | Perfeito! Veja o resumo acima e confirme se esta correto. | "Confirmar e gerar plano", "Preciso ajustar" |
| Planning Tech | Qual framework voce prefere para o frontend? | "React + Next.js", "Vue + Nuxt", "Angular", "Svelte" |
| Connect GitHub | Conecte sua conta do GitHub para eu criar o repositorio do projeto. | "Conectar GitHub" |
| Generate | Estou gerando seu codigo... Voce pode acompanhar o progresso ao lado. | - |
| Deploy | Deploying para Vercel... Quase la! | - |
| Online | Parabens! Seu projeto esta no ar. | "Abrir site", "Ver repositorio" |

#### Erros

| Codigo | Titulo | Descricao | Acao |
|--------|--------|-----------|------|
| GITHUB_OAUTH_POPUP_BLOCKED | Popup bloqueado | Seu navegador bloqueou o popup de login. Habilite popups para este site e tente novamente. | Tentar novamente |
| GITHUB_OAUTH_DENIED | Acesso negado | Voce negou acesso ao GitHub. Precisamos de acesso para criar o repositorio. | Tentar novamente |
| VERCEL_DEPLOY_FAILED | Deploy falhou | O build do projeto falhou. Verifique os logs para mais detalhes. | Ver logs / Tentar novamente |
| AI_GENERATION_TIMEOUT | Tempo esgotado | A geracao demorou mais que o esperado. Por favor, tente novamente. | Tentar novamente |
| NETWORK_ERROR | Sem conexao | Verifique sua conexao com a internet e tente novamente. | Tentar novamente |

### F.6 Acessibilidade

#### Checklist WCAG 2.2 AA

- [ ] **Contraste de cores**: Minimo 4.5:1 para texto, 3:1 para elementos graficos
- [ ] **Focus visible**: Todos elementos interativos tem focus ring visivel
- [ ] **Skip links**: Link "Pular para conteudo" no inicio
- [ ] **Headings hierarquicos**: h1 > h2 > h3 sem pular niveis
- [ ] **Labels em inputs**: Todos inputs tem label associado
- [ ] **Aria-labels**: Botoes de icone tem aria-label descritivo
- [ ] **Role landmarks**: main, nav, aside, header definidos
- [ ] **Error announcements**: Erros anunciados com aria-live
- [ ] **Keyboard navigation**: Tab order logico, Enter/Space ativam
- [ ] **Touch targets**: Minimo 44x44px em mobile

#### Especificacoes de Focus

```css
/* Focus ring padrao */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Focus ring para elementos escuros */
.dark-element:focus-visible {
  outline: 2px solid white;
}
```

---

## G. Estrutura de Arquivos dos Mockups

### G.1 Organizacao de Pastas

```
mockups/
├── css/
│   ├── tokens.css              # Design tokens (existente)
│   ├── layout.css              # Layout base 3 colunas
│   ├── components.css          # Componentes reutilizaveis
│   ├── states.css              # Loading, error, empty, success
│   └── mobile.css              # Estilos responsivos
│
├── js/
│   └── mockup-utils.js         # Funcoes para simular estados
│
├── dashboard/
│   ├── index.html              # Lista de projetos
│   ├── empty.html              # Empty state
│   ├── loading.html            # Loading state
│   ├── error.html              # Error state
│   ├── create-modal.html       # Modal criar projeto
│   ├── edit-modal.html         # Modal editar projeto
│   └── delete-modal.html       # Modal confirmar exclusao
│
├── project/
│   ├── phase-1-ideation/
│   │   ├── 01-start.html       # Primeira pergunta
│   │   ├── 02-question-2.html  # Segunda pergunta
│   │   ├── 03-question-3.html  # Terceira pergunta
│   │   ├── 04-question-4.html  # Quarta pergunta
│   │   ├── 05-confirm.html     # Confirmacao do resumo
│   │   └── 06-generating.html  # Gerando plano
│   │
│   ├── phase-2-planning/
│   │   ├── business/
│   │   │   ├── 01-generating.html   # Loading
│   │   │   ├── 02-review.html       # Plano gerado
│   │   │   └── 03-editing.html      # Editando
│   │   ├── technical/
│   │   │   ├── 01-questions.html    # Perguntas de stack
│   │   │   ├── 02-generating.html   # Loading
│   │   │   └── 03-review.html       # Plano gerado
│   │   └── ux/
│   │       ├── 01-generating.html   # Loading
│   │       └── 02-review.html       # Plano gerado
│   │
│   ├── phase-3-connection/
│   │   ├── 01-connect.html     # Conectar integracoes
│   │   ├── 02-github-error.html    # Erro OAuth
│   │   └── 03-connected.html   # Tudo conectado
│   │
│   ├── phase-4-generation/
│   │   ├── 01-generating.html  # Gerando codigo
│   │   ├── 02-progress.html    # Progresso 50%
│   │   ├── 03-error.html       # Erro de geracao
│   │   └── 04-complete.html    # Geracao completa
│   │
│   ├── phase-5-deploy/
│   │   ├── 01-deploying.html   # Deploy em andamento
│   │   ├── 02-build-error.html # Erro de build
│   │   └── 03-complete.html    # Deploy completo
│   │
│   └── phase-6-online/
│       └── 01-success.html     # Projeto online
│
├── mobile/
│   ├── dashboard.html          # Dashboard mobile
│   ├── project.html            # Projeto mobile
│   ├── sidebar-drawer.html     # Sidebar aberta
│   └── chat-drawer.html        # Chat aberto
│
├── components/
│   ├── sidebar.html            # Sidebar isolada
│   ├── chat-panel.html         # Chat isolado
│   ├── chat-collapsed.html     # Chat colapsado
│   ├── project-card.html       # Card de projeto
│   ├── progress-indicator.html # Indicador de progresso
│   ├── quick-replies.html      # Quick reply buttons
│   ├── modal.html              # Modal base
│   └── toast.html              # Notificacoes
│
└── index.html                  # Hub de navegacao
```

### G.2 Navegacao entre Mockups

```
index.html (Hub)
    │
    ├── Dashboard
    │   ├── Lista de projetos → Click card → Projeto Fase X
    │   ├── Empty state → Click CTA → Modal criar
    │   └── Modal criar → Submit → Projeto Fase 1
    │
    └── Projeto
        ├── Fase 1 Q1 → Responder → Q2 → ... → Confirmacao → Fase 2
        ├── Fase 2 Negocio → Aprovar → Tecnico → Aprovar → UX → Aprovar → Fase 3
        ├── Fase 3 Connect → OAuth → Connected → Fase 4
        ├── Fase 4 Generating → Progress → Complete → Fase 5
        ├── Fase 5 Deploying → Complete → Fase 6
        └── Fase 6 Online (fim)

Navegacao auxiliar (em todos os mockups):
├── Sidebar → Click fase → Vai para fase (se disponivel)
├── Sidebar → "Dashboard" → Volta para dashboard
├── Chat collapse → Click → Toggle chat
└── Mobile FAB → Click → Abre chat drawer
```

---

## H. Recomendacoes para Problemas Identificados

### H.1 Problema: "Voltar ao Dashboard" acima do logo

**Analise:**
O problema e hierarquico. O logo da plataforma deveria ser o elemento mais proeminente no topo. Colocar "Voltar" acima quebra a hierarquia visual e confunde o usuario sobre onde ele esta.

**Recomendacao:**
Mover "Voltar ao Dashboard" para ABAIXO do nome do projeto, como um link discreto (nao botao).

```
ANTES (errado):                  DEPOIS (correto):
┌─────────────────────┐          ┌─────────────────────┐
│ ← Voltar ao Dashboard│         │ [TC] True Coding    │
├─────────────────────┤          │                      │
│ [TC] True Coding    │          │ Meu App Delivery    │
│                      │          │ ← Dashboard          │  ← Link discreto
│ Meu App Delivery    │          │                      │
└─────────────────────┘          │ Fase 2 de 6         │
                                  └─────────────────────┘
```

**Alternativa considerada:**
- No footer da sidebar (acima do avatar): Descartada porque o usuario pode nao ver
- Icone no header: Descartada porque nao ha header global

### H.2 Problema: Progress bar mostra "Fase 2 de 6"

**Analise:**
Existem dois niveis de progresso:
1. **Jornada global**: Em qual das 6 fases o projeto esta
2. **Progresso local**: Onde estou DENTRO da fase atual

O chat panel estava mostrando progresso global, que ja aparece na sidebar.

**Recomendacao:**
- **Sidebar**: Mostra progresso GLOBAL (Fase X de 6) com visual de dots/stepper
- **Chat header**: Mostra progresso LOCAL (Pergunta Y de 5, Plano Z de 3, etc)

```
SIDEBAR:                         CHAT HEADER:
┌─────────────────────┐          ┌─────────────────────────────┐
│ JORNADA             │          │ Discovery              [◀] │
│ ○──●──○──○──○──○    │          │ ████████░░░░  Pergunta 3/5  │
│ Fase 2 de 6         │          └─────────────────────────────┘
└─────────────────────┘
```

### H.3 Problema: Sidebar identacao confusa

**Analise:**
Os sub-itens (Negocio, Tecnico, UX) nao tinham diferenciacao visual clara do item pai (Planejamento).

**Recomendacao:**
Adicionar linha conectora vertical e reduzir tamanho de fonte dos sub-itens.

```css
.nav-item.sub-item {
  margin-left: 24px;
  padding-left: 16px;
  border-left: 2px solid var(--color-border);
  font-size: 13px;
}
```

Visual:
```
◐ Planejamento         ← Item pai (14px)
  │
  ├ ✓ Negocio          ← Sub-item (13px)
  ├ ◐ Tecnico
  └ ○ UX
```

### H.4 Problema: Chat colapsado nao libera espaco

**Analise:**
O layout atual usa `width: var(--chat-width)` fixo. Quando colapsado, deveria usar `width: 48px`.

**Recomendacao:**
O workspace ja usa `flex: 1` entao vai expandir automaticamente. O problema e que a implementacao do collapsed nao esta reduzindo o width corretamente.

```css
.chat-collapsed {
  width: 48px;  /* Era 380px no expanded */
}

.workspace {
  flex: 1;      /* Ja esta correto - vai expandir */
}
```

**Adicionar indicador visual de chat pendente:**
```
┌──────┐
│  💬  │  ← Botao azul
│  ●1  │  ← Badge laranja se tem mensagem
│      │
│ CHAT │  ← Label vertical
└──────┘
```

### H.5 Problema: Faltam Integracoes e Recursos na sidebar

**Recomendacao:**
Adicionar duas novas secoes na sidebar:

```
INTEGRACOES
├── GitHub        [✓ conectado]    ou   [→ conectar]
└── Vercel        [✓ conectado]    ou   [→ conectar]

RECURSOS                                (so aparece apos Fase 4)
├── ↗ Repositorio                       [link externo]
└── ↗ Site                              [link externo]
```

---

## I. Ordem de Criacao dos Mockups

### Prioridade 1: Fundacao (Semana 1)

| # | Mockup | Justificativa |
|---|--------|---------------|
| 1 | `css/layout.css` | Base para todos os mockups |
| 2 | `css/components.css` | Componentes reutilizaveis |
| 3 | `css/states.css` | Loading, error, empty |
| 4 | `components/sidebar.html` | Componente critico, corrigir problemas |
| 5 | `components/chat-panel.html` | Corrigir progress bar |
| 6 | `index.html` | Hub de navegacao |

### Prioridade 2: Dashboard (Semana 1)

| # | Mockup | Justificativa |
|---|--------|---------------|
| 7 | `dashboard/index.html` | Entrada principal |
| 8 | `dashboard/empty.html` | Primeiro contato do usuario |
| 9 | `dashboard/create-modal.html` | Fluxo critico |
| 10 | `dashboard/loading.html` | Estado essencial |
| 11 | `dashboard/error.html` | Estado essencial |

### Prioridade 3: Fase 1 - Ideacao (Semana 2)

| # | Mockup | Justificativa |
|---|--------|---------------|
| 12 | `phase-1-ideation/01-start.html` | Primeira tela do fluxo |
| 13 | `phase-1-ideation/05-confirm.html` | Ponto de decisao |
| 14 | `phase-1-ideation/06-generating.html` | Transicao para Fase 2 |

### Prioridade 4: Fase 2 - Planejamento (Semana 2)

| # | Mockup | Justificativa |
|---|--------|---------------|
| 15 | `phase-2/business/01-generating.html` | Loading state |
| 16 | `phase-2/business/02-review.html` | Revisao do plano |
| 17 | `phase-2/technical/01-questions.html` | Perguntas de stack |
| 18 | `phase-2/technical/03-review.html` | Plano tecnico |
| 19 | `phase-2/ux/02-review.html` | Plano UX |

### Prioridade 5: Fases 3-6 (Semana 3)

| # | Mockup | Justificativa |
|---|--------|---------------|
| 20 | `phase-3-connection/01-connect.html` | Conexao OAuth |
| 21 | `phase-3-connection/02-github-error.html` | Error handling |
| 22 | `phase-4-generation/01-generating.html` | Geracao em andamento |
| 23 | `phase-5-deploy/01-deploying.html` | Deploy em andamento |
| 24 | `phase-6-online/01-success.html` | Estado final (celebracao) |

### Prioridade 6: Mobile (Semana 3)

| # | Mockup | Justificativa |
|---|--------|---------------|
| 25 | `mobile/dashboard.html` | Dashboard mobile |
| 26 | `mobile/project.html` | Projeto mobile |
| 27 | `mobile/sidebar-drawer.html` | Drawer navegacao |
| 28 | `mobile/chat-drawer.html` | Drawer chat |

---

## J. Checklist Final de Validacao

### Antes de considerar mockups prontos:

- [ ] Todas as personas tem JTBD claros
- [ ] Jornadas cobrem happy path E edge cases
- [ ] Cada tela tem TODOS os estados (loading/error/empty/success)
- [ ] Microcopy completo e acionavel
- [ ] Links funcionais entre todos os mockups
- [ ] Sidebar corrigida (hierarquia, progress, integracoes)
- [ ] Chat progress bar mostra progresso LOCAL
- [ ] Mobile funciona com drawers
- [ ] Acessibilidade checklist completo
- [ ] Nenhum lorem ipsum (texto real)

### Heuristicas de Nielsen Verificadas

- [ ] 1. Visibilidade do status - Progress indicators em toda transicao
- [ ] 2. Match sistema/mundo real - Linguagem do usuario
- [ ] 3. Controle do usuario - Voltar ao dashboard, cancelar modais
- [ ] 4. Consistencia - Mesmos padroes visuais
- [ ] 5. Prevencao de erros - Confirmacao antes de excluir
- [ ] 6. Reconhecimento > memorizacao - Labels claros
- [ ] 7. Flexibilidade - Quick replies + texto livre
- [ ] 8. Design minimalista - Sem informacao desnecessaria
- [ ] 9. Recuperacao de erros - Mensagens claras com acao
- [ ] 10. Ajuda - Tooltips e contexto

---

## K. Proximos Passos

1. **Validar plano** com stakeholder antes de criar mockups
2. **Criar CSS base** (layout, components, states)
3. **Criar componentes isolados** (sidebar, chat)
4. **Criar dashboard** completo com todos os estados
5. **Criar fluxo completo** Fase 1 a Fase 6
6. **Criar versao mobile**
7. **Testar navegacao** entre todos os mockups
8. **Review de acessibilidade**
9. **Documentar decisoes** para implementacao React

---

**Pronto para o proximo fluxo/tela. Indique qual persona e qual jornada quer detalhar agora.**
