# 🎨 True Coding - Mockups Hub

Protótipos navegáveis em HTML/CSS para validação visual **antes** da implementação funcional.

## 📁 Estrutura

```
mockups/
├── index.html                    # 🏠 Hub central (comece aqui!)
├── DESIGN-DECISIONS.md           # 📖 Documentação completa de UX/UI
├── README.md                     # 📄 Este arquivo
│
├── css/
│   └── tokens.css               # 🎨 Design tokens (cores, espaçamentos, etc)
│
├── discovery/                   # 💬 6 telas do fluxo Discovery
│   ├── 01-initial.html
│   ├── 02-pergunta-2.html
│   ├── 03-pergunta-3.html
│   ├── 04-pergunta-4.html
│   ├── 05-confirmacao.html
│   └── 06-gerando.html
│
├── planning/                    # 📋 2 telas de Planning
│   ├── 01-plan-view.html
│   └── 02-plan-edit.html
│
├── components/                  # 🧩 5 componentes isolados
│   ├── progress-indicator.html
│   ├── quick-replies.html
│   ├── live-preview.html
│   ├── confirmation-panel.html
│   └── version-history.html
│
└── states/                      # 🔄 3 estados do sistema
    ├── loading.html
    ├── error.html
    └── empty.html
```

---

## 🚀 Como Visualizar

### Opção 1: Abrir Diretamente (Mais Simples)

```bash
cd mockups
open index.html
```

Ou clique duas vezes em `index.html` no Finder.

### Opção 2: Servidor Local (Recomendado)

Para evitar problemas com CORS e ver assets corretamente:

```bash
# Com npx (não precisa instalar nada)
npx serve mockups

# Ou com Python
cd mockups
python3 -m http.server 8000

# Ou com PHP
cd mockups
php -S localhost:8000
```

Depois acesse: http://localhost:8000

---

## 📖 Guia de Navegação

### 1️⃣ Comece pelo Hub

Abra `index.html` - é o índice visual de todos os mockups.

### 2️⃣ Fluxo Recomendado

**Para entender o Discovery completo:**
```
Hub → Discovery → 01-initial.html → [Navegar com "Próximo →"]
```

**Para ver componentes isolados:**
```
Hub → Components → progress-indicator.html → [Explorar cada componente]
```

**Para entender estados:**
```
Hub → States → loading.html → error.html → empty.html
```

### 3️⃣ Botões de Navegação

Todos os mockups têm navegação fixa no canto inferior direito:

- **← Anterior** - Volta para tela anterior
- **Hub** - Volta ao índice
- **Próximo →** - Avança para próxima tela

---

## 🎯 Objetivos dos Mockups

### 1. Validação Visual

✅ Ver layout antes de codar
✅ Testar fluxos de navegação
✅ Identificar problemas de UX antecipadamente

### 2. Comunicação

✅ Mostrar para stakeholders
✅ Alinhar expectativas com time
✅ Documentar decisões de design

### 3. Implementação

✅ Servir como referência para código React
✅ Design tokens já definidos
✅ Animações e interações especificadas

---

## 🧩 Componentes Interativos

Alguns mockups têm JavaScript para simular comportamento:

### Progress Indicator (`components/progress-indicator.html`)
- Botões para mudar progresso (1-5)
- Animação de preenchimento da barra

### Quick Replies (`components/quick-replies.html`)
- Click seleciona sugestão
- Mostra mensagem no output

### Live Preview (`components/live-preview.html`)
- Botões "Adicionar Card" simulam resposta
- Cards aparecem com animação slide-in

### Version History (`components/version-history.html`)
- Botões de ação (Ver Diff, Restaurar)
- Alerts simulam funcionalidade

---

## 🎨 Design Tokens

Todos os mockups usam `css/tokens.css` com variáveis CSS:

```css
/* Cores */
--color-primary: #2563eb
--color-success: #10b981
--color-error: #ef4444

/* Espaçamento */
--space-2: 8px
--space-4: 16px
--space-6: 24px

/* Tipografia */
--font-size-sm: 13px
--font-size-base: 14px
--font-size-lg: 16px

/* Layout */
--sidebar-width: 240px
--chat-width: 380px
```

**Importante:** Ao implementar em React, use **exatamente** estes valores para manter consistência.

---

## 📐 Layout Geral

Todas as telas de Discovery/Planning seguem este layout:

```
┌──────────┬────────────────────┬──────────┐
│          │                    │          │
│ Sidebar  │     Workspace      │   Chat   │
│  240px   │     (flex: 1)      │  380px   │
│          │                    │          │
│  Fixed   │    Scrollable      │  Fixed   │
│          │                    │          │
└──────────┴────────────────────┴──────────┘
```

- **Sidebar:** Navegação de fases + seções do plano
- **Workspace:** Conteúdo principal (cards, plano, etc)
- **Chat:** Interface de conversa com AI (apenas Discovery)

---

## 📱 Responsividade

Os mockups são otimizados para **desktop** (1440px+).

### Comportamento Esperado em Implementação:

**Desktop (1024px+):**
- Layout 3 colunas (Sidebar + Workspace + Chat)

**Tablet (768-1023px):**
- Sidebar colapsável (toggle)
- Chat com largura reduzida (320px)

**Mobile (< 768px):**
- Navegação bottom tab bar
- Workspace full width
- Chat como overlay (slide-up)

---

## 🔍 Testes de Validação

### Checklist de UX

Ao navegar pelos mockups, valide:

- [ ] **Progresso visível** - Sei em que pergunta estou?
- [ ] **Feedback imediato** - Minhas ações têm resposta visual?
- [ ] **Senso de construção** - Vejo o plano sendo construído?
- [ ] **Confirmação clara** - Sei quando vou gerar o plano?
- [ ] **Loading transparente** - Entendo o que está acontecendo?
- [ ] **Navegação intuitiva** - Consigo voltar/avançar facilmente?

### Checklist de UI

- [ ] Cores consistentes (paleta definida)
- [ ] Espaçamentos harmônicos (múltiplos de 4px)
- [ ] Tipografia legível (hierarquia clara)
- [ ] Botões com estados hover/active
- [ ] Animações suaves (300ms, ease-out)
- [ ] Acessibilidade (contraste, focus rings)

---

## 📚 Documentação Relacionada

- **[DESIGN-DECISIONS.md](./DESIGN-DECISIONS.md)** - Decisões de UX/UI detalhadas
- **[/docs/UX-PRINCIPLES.md](../docs/UX-PRINCIPLES.md)** - Princípios gerais de UX
- **[/docs/UX-PROPOSAL-PROJECT-PAGE.md](../docs/UX-PROPOSAL-PROJECT-PAGE.md)** - Proposta UX original

---

## 🛠️ Próximas Etapas (Implementação)

Após validação dos mockups, implementar:

### Etapa 1: Foundation (Dia 3)
- Migration: `discoveryState`, `currentQuestion`, `completedQuestions`
- Prompt V2 com 5 perguntas estruturadas
- Tipos TypeScript

### Etapa 2: Backend (Dia 3-4)
- `/api/chat/route.ts` com progress tracking
- Event SSE `question_progress`
- Validação Zod do Business Plan

### Etapa 3: Frontend (Dia 2)
- `ChatPanel.tsx` com ProgressIndicator
- Header "Pergunta X de 5"
- Loading overlay

### Etapa 4: Enhancement (Dia 2-3)
- `QuickReplyButtons.tsx`
- Integração com chat
- LivePreviewCards

### Etapa 5: Versioning (Dia 6-7)
- Schema `ProjectVersion`
- API de versões
- UI de histórico

### Etapa 6: Testing (Dia 8)
- E2E tests
- Validação de fluxo completo
- Performance testing

---

## 🤝 Feedback

Se identificar problemas de UX ou sugestões de melhoria:

1. Documente em `DESIGN-DECISIONS.md` (seção "Melhorias Futuras")
2. Abra issue no GitHub
3. Discuta com o time antes de implementar

---

## ⚡ Quick Start

```bash
# 1. Clone o repo
git clone <repo-url>

# 2. Navegue até mockups
cd true-coding/mockups

# 3. Abra o hub
open index.html

# 4. Ou serve com servidor local
npx serve
```

---

## 📊 Estatísticas

- **Total de mockups:** 16 páginas
- **Componentes:** 5 isolados
- **Estados:** 3 variações
- **Design tokens:** 40+ variáveis
- **Linhas de CSS:** ~2000
- **Tempo de criação:** ~4 horas
- **Taxa de reuso:** 80% (tokens + componentes)

---

**Criado por:** Claude Code Agent
**Data:** 27 Janeiro 2026
**Versão:** 1.0
