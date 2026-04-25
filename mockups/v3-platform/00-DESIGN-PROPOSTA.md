# Design Proposta — True Coding v3 Platform

> Spec visual e estrutural que guia os 3 primeiros mockups HTML da v3 (plataforma de gestão de produto com módulos progressivos). Fonte: decisões herdadas do repositório (`mockups/DESIGN-DECISIONS.md`, `mockups/css/tokens.css`, `mockups/v2/`, `tailwind.config.ts`). Stack Tailwind mantida; tokens já existentes são reutilizados.

---

## 0. Modos de interação do produto

> Seção de abertura (adicionada 14/04/2026). A ordem importa: antes de falar de identidade visual, tokens ou grid, a spec precisa responder **"como o usuário interage com a IA?"**. A omissão dessa pergunta na Onda 1 fez com que 2 mockups fossem refeitos por não considerarem o chat persistente como canal primário. Decisão aceita: a spec começa pelos modos de interação e só depois passa para a camada visual.

### 0.1 Inventário de canais

Todos os canais de interação user ↔ True Coding previstos no produto:

- **Chat persistente** — canal primário user ↔ IA; conversa contextual em todas as telas com projeto carregado.
- **Edição inline** — edição direta de texto em planos e decisões (textarea sobre o próprio conteúdo, salva em patch).
- **Comandos conversacionais** — atalhos `/decisão`, `/risco` (e futuros `/feature`, `/iteração`) digitados dentro do chat para acionar fluxos de captura.
- **Captura conversacional** — botões "Registrar como decisão/risco" e "+ Decisão/+ Risco" abrem **input de texto livre** (componente 4.8), nunca formulário vazio; sistema infere campos.
- **Formulário** — aparece **apenas como fallback** de edição pós-criação ou no modo "Ajustar" do preview; jamais como primeira interação.
- **Efeito colateral** — ações estruturais (exportar v1, reverter versão, transicionar para Gestão) geram registros automáticos sem perguntar ao usuário.

### 0.2 Canal primário user ↔ IA

**Chat persistente.** Comportamento por contexto de tela:

| Contexto | Formato do chat |
|---|---|
| Discovery (5 perguntas iniciais) | **Tela inteira** em formato conversa; sem sidebar nem header comum |
| Planos (rascunho, aprovado, corrente) | **Lateral direito** — 320–400px expandido, colapsa para ícone 48px |
| Tabs de Gestão (Decisões, Riscos, Features, Iterações) | Lateral **colapsado por default**; expansível pelo ícone |
| Inbox de sugestões | Lateral **colapsado por default** |
| Empty dashboard / Novo projeto (pré-Discovery) | **Ausente** — ainda não há projeto com contexto |

### 0.3 Comportamento do chat lateral

- **Estado persistente entre telas**: a última mensagem visível permanece ao navegar — continuidade da conversa é garantia de confiança.
- **Contextual**: o chat sabe em qual tela o usuário está; pode ler e **citar conteúdo** (ex.: "sobre este parágrafo de Monetização que você está vendo…").
- **Ações inline em mensagens da IA**: botões dentro do balão — "Registrar como decisão", "Aplicar mudança ao plano", "Criar risco" — evitam sair do chat para concluir a ação.
- **Histórico**: scroll vertical, infinite scroll para conversas longas; âncora automática na última mensagem ao abrir.
- **Input**: textarea de 2–3 linhas, auto-grow; **placeholder rotativo contextual** ao estado da tela (ex.: em Plano de Negócio aprovado → "Pergunte algo sobre este plano ou peça um ajuste…"; em Decisões → "Descreva uma decisão ou peça um resumo das aprovadas…").

### 0.4 Jornada detalhada — canal de interação + ações por tela

Mapeamento do canal primário e das 3–5 ações disponíveis em cada tela da Onda 1 (existente) e Onda 2 (planejada):

| Tela | Canal primário | Ações disponíveis |
|---|---|---|
| `empty-dashboard.html` | (sem chat) | Criar projeto · Ver exemplo · Acessar ajuda |
| `novo-projeto.html` (Onda 2) | (sem chat) | Nomear projeto · Descrever ideia · Iniciar Discovery · Cancelar |
| `discovery-q*.html` (Onda 2) | Chat ocupando tela | Responder pergunta · Pular pergunta · Voltar · Pedir esclarecimento |
| `business-plan-rascunho.html` (Onda 2) | Chat lateral direito | Editar texto · Refinar via chat · Aprovar · Regerar · Voltar |
| `business-plan-aprovado-espec.html` | Chat lateral direito | Editar plano · Refinar via chat · Iniciar próximo plano · Registrar decisão · Registrar risco |
| `business-plan-corrente-gestao.html` | Chat lateral direito | Editar plano (com changelog) · Refinar via chat · Registrar como decisão · Ver histórico |
| `tab-decisoes.html` | Chat lateral colapsado | Nova decisão (via chat) · Filtrar · Acessar Inbox · Editar decisão · Revogar |
| `inbox-sugestoes.html` | Chat lateral colapsado | Aceitar sugestão · Editar sugestão · Rejeitar · Triagem em lote · Filtrar por origem |

### 0.5 Princípios de captura conversacional

Reforço do que já foi decidido e está detalhado em 4.8–4.10:

- A **captura primária é texto livre**. O usuário descreve em linguagem natural; o sistema infere título, categoria, impacto e status.
- O **formulário é fallback**, não primeira interação. Só aparece ao editar um registro já criado ou no modo "Ajustar" de um preview.
- **Chat + captura conversacional são a mesma família**: comandos `/decisão` no chat abrem o mesmo fluxo de input livre que os botões "+ Decisão" na página de Decisões.
- **Ações disponíveis** em mensagens da IA sempre levam a preview estruturado editável, nunca a gravação silenciosa.

---

## 1. Identidade visual herdada

### 1.1 Paleta (extraída de `mockups/css/tokens.css`)

| Papel | Token | HEX | Uso na v3 |
|---|---|---|---|
| Primary | `--color-primary` | `#2563eb` | CTAs, links ativos, item ativo da sidebar, badges "Em edição" |
| Primary hover | `--color-primary-hover` | `#1d4ed8` | Hover de botões primários |
| Primary light | `--color-primary-light` | `#dbeafe` | Background de item ativo na sidebar, chips informativos |
| Success | `--color-success` | `#10b981` | Badge "Aprovado", ícones de plano v1 congelado |
| Success light | `--color-success-light` | `#d1fae5` | Background do badge "Aprovado" |
| Warning | `--color-warning` | `#f59e0b` | Badge "Em rascunho", alertas de risco médio |
| Warning light | `--color-warning-light` | `#fef3c7` | Background de badge em rascunho |
| Error | `--color-error` | `#ef4444` | Badge "Bloqueador", risco alto, erros |
| Error light | `--color-error-light` | `#fee2e2` | Background de alerta crítico |
| BG primário | `--color-bg-primary` | `#ffffff` | Conteúdo, cards |
| BG secundário | `--color-bg-secondary` | `#f9fafb` | Canvas da página, sidebar |
| BG terciário | `--color-bg-tertiary` | `#f3f4f6` | Hover de linhas, divisores suaves |
| Texto primário | `--color-text-primary` | `#111827` | Títulos, body forte |
| Texto secundário | `--color-text-secondary` | `#4b5563` | Body padrão |
| Texto terciário | `--color-text-tertiary` | `#6b7280` | Labels, metadados, timestamps |
| Borda | `--color-border` | `#e5e7eb` | Todos os divisores e borders de card |

> Dark mode: **fora de escopo v3**. Estrutura HSL de `tailwind.config.ts` (`--background`, `--foreground`, etc.) já suporta futuro dark mode; não gastar ciclos agora.

### 1.2 Tipografia

- **Family**: system fonts (`-apple-system, "Segoe UI", Roboto, sans-serif`) — herdado.
- **Escala**:

| Token | px | Uso v3 |
|---|---|---|
| `xs` | 11 | Labels uppercase, timestamps |
| `sm` | 13 | Metadata, descrição curta de card, item da sidebar |
| `base` | 14 | Body padrão, tabela |
| `lg` | 16 | Nome de projeto, subtítulos |
| `xl` | 18 | Título de seção dentro da página |
| `2xl` | 24 | Título de página (ex: "Plano de Negócio") |
| `3xl` | 30 | Título do dashboard ("Seus projetos") |

- **Pesos**: 400 (body), 500 (labels), 600 (subtítulos e botões), 700 (H1/H2).

### 1.3 Espaçamento e raio

- **Base grid**: 4px. Scale usada: `2, 3, 4, 5, 6, 8, 10, 12` (8, 12, 16, 20, 24, 32, 40, 48 px).
- **Padding padrão de card**: 20–24 px (`space-5` / `space-6`).
- **Gap padrão de grid**: 16 px (`space-4`).
- **Raio**: `md` (6 px) para botões e chips, `lg` (8 px) para cards, `full` para avatares e pills.
- **Sombra**: `sm` em repouso para card elevado, `md` em hover. Sidebar e header sem sombra — usar border apenas.

### 1.4 Breakpoints

- **Desktop-first (v3)**: base 1280 px, max-width de conteúdo 1440 px.
- `md` 768 / `lg` 1024 / `xl` 1280 (Tailwind default).
- Mobile: **fora de escopo v3** (waitlist). Documentar só "colapsa sidebar abaixo de `lg`".

---

## 2. Sidebar permanente — proposta de itens

### 2.1 Comportamento geral

- **Posição**: fixa à esquerda, altura 100vh, `z-index: 40`.
- **Largura**: `256px` expandida, `64px` colapsada.
- **Background**: `--color-bg-secondary` (#f9fafb) com `border-right: 1px solid --color-border`.
- **Estado persistido em `localStorage`** (`sidebar:collapsed = "1"`).
- **Colapso**: botão no rodapé da sidebar (ícone chevron-left/right). Atalho `[`.
- **Item ativo**: background `--color-primary-light`, texto `--color-primary`, border-radius `md`, indicador lateral de 3px à esquerda em `--color-primary`.
- **Hover** em item inativo: background `--color-bg-tertiary`.

### 2.2 Estrutura (topo → base)

| # | Zona | Item | Ícone (lucide) | Visível quando | Razão |
|---|---|---|---|---|---|
| 1 | Header sidebar | Logo "TC · True Coding" | — | Sempre | Identidade; clica → dashboard |
| 2 | — | Botão "+ Novo projeto" (CTA secundário, outline azul) | `plus` | Sempre | Ação principal global; evita esconder em submenu |
| 3 | Seção "Geral" | Projetos | `folder` | Sempre | Dashboard; estado default após login |
| 4 | Seção "Projeto ativo" (header contextual com nome do projeto selecionado, truncado) | Especificação | `file-text` | Projeto selecionado, fase ∈ {Especificação} | Fase 1; some quando avança para Gestão |
| 5 | — | Gestão | `kanban` | Projeto selecionado, fase = Gestão | Fase 2; vira o home do projeto |
| 6 | — | Decisões | `gavel` | Projeto selecionado (qualquer fase) | Decision Log persistente; surge desde a Especificação |
| 7 | — | Riscos | `shield-alert` | Projeto selecionado (qualquer fase) | Risk Log persistente; surge desde a Especificação |
| 7.1 | — | Sugestões (badge contador "N" quando há pendências) | `inbox` | Projeto selecionado (qualquer fase) | Inbox de sugestões de Decisions/Risks capturadas automaticamente ou sob demanda; badge some quando contador = 0. Pertence à família de captura, logo abaixo de Decisões/Riscos. |
| 8 | — | Features | `list-checks` | Projeto em Gestão | Feature Registry só após transição |
| 9 | — | Iterações | `git-branch` | Projeto em Gestão | Acesso rápido à última iteração |
| 10 | — | Configurações do projeto | `settings-2` | Projeto selecionado | Renomear, arquivar, integrações |
| 11 | Rodapé sidebar | Saldo de créditos (chip) | `zap` | Sempre | Transparência do modelo financeiro; clica → página de créditos |
| 12 | — | Ajuda & Feedback | `life-buoy` | Sempre | Link externo/modal |
| 13 | — | Avatar + nome do usuário (menu) | `user` | Sempre | Conta, logout, tema |
| 14 | — | Botão colapsar | `chevron-left` | Sempre | Toggle largura |

> **Item 4 vs 5**: a sidebar reflete a **fase atual do projeto** e mostra apenas uma das duas entradas principais por projeto — "Especificação" **ou** "Gestão", nunca ambas e sem rota intermediária de "Visão geral". Ao congelar v1 dos planos, "Especificação" é substituída por "Gestão" (com tooltip: "Planos v1 congelados em DD/MM"). O snapshot do projeto na fase Gestão vive dentro da tab "Planos v1", evitando duplicidade de dashboards.

> **Itens 6–9 — visibilidade por fase (decisão 14/04/2026)**: Decisões e Riscos aparecem **desde a Fase Especificação** e persistem através da transição (não resetam). Features e Iterações só aparecem na Fase Gestão. Motivação: durante uso real, Decisions e Risks surgem naturalmente desde o onboarding/discovery; esconder até transição cria fricção.

> **Por que sidebar e não tab bar global (Opção A vs B)**: a sidebar já é o eixo de navegação contextual do projeto ("Projeto ativo"); adicionar Decisões/Riscos como itens persistentes reforça que são artefatos do projeto, não da fase. Uma tab bar global persistente (Opção B) duplicaria navegação e confundiria a hierarquia em Especificação, onde há poucas áreas. A tab bar fica confinada ao seu uso legítimo: sub-tabs de "Planos" (Negócio/UX/Técnico) — ver seção 4.5.

### 2.3 Estado colapsado (64px)

- Somente ícones, tooltip aparece no hover (delay 400ms) à direita.
- Chip de saldo vira só ícone `zap` + dot de cor (verde/amarelo/vermelho conforme nível).
- Header contextual do projeto ativo some; avatar do projeto (inicial em círculo) substitui.

### 2.4 Estado free vs paid

- **Saldo de créditos sempre visível** no rodapé da sidebar.
- **Free tier**: chip "3 créditos grátis" em `--color-primary-light`, texto `--color-primary`. Abaixo, link pequeno "Ver planos".
- **Paid tier**: chip "128 créditos · R$ X,XX" em `--color-bg-tertiary`. Em hover mostra "Ver extrato".
- **Saldo zerado**: chip em `--color-warning-light` com texto "Sem créditos · Recarregar". CTA escurece ações que consomem crédito no app.

---

## 3. Grid base e zonas

```
┌──────────┬─────────────────────────────────────────────────┐
│          │  HEADER — 56px (sticky, bg-primary, border-b)   │
│ SIDEBAR  ├─────────────────────────────────────────────────┤
│  256px   │                                                 │
│          │  CONTEÚDO                                       │
│  (100vh) │  padding: 32px 40px (px-10 py-8)                │
│  fixed   │  max-width: 1200px centralizado                 │
│          │  bg: --color-bg-secondary (#f9fafb)             │
│          │                                                 │
└──────────┴─────────────────────────────────────────────────┘
```

- **Gutter externo do conteúdo**: `40px` horizontal, `32px` vertical.
- **Gap entre blocos de seção**: `32px`.
- **Gap dentro de card**: `16–20px`.
- **Container máx de leitura** (textos de plano): `720px`. Acima disso, multi-coluna ou painel lateral.
- **Scroll**: somente a área de conteúdo rola; sidebar e header permanecem fixos.

---

## 4. Componentes-padrão reusáveis

### 4.1 Header (topo do conteúdo, não da sidebar)

- Altura **56px**, `bg-primary` (#fff), `border-b 1px`.
- Slot esquerda: **breadcrumb** (`Projetos / Cafeteria Beta / Gestão`). Texto `sm`, terciário, com separador `/`.
- Slot direita: ações contextuais da tela (ex: "Editar plano", "Nova decisão"), notificações (bell), avatar.
- **Saldo de créditos NÃO vai no header** (fica na sidebar). Evita duplicar.

### 4.2 Card de projeto (dashboard)

```
┌─────────────────────────────────────────┐
│ [Avatar]  Cafeteria Beta                │
│           Sistema de pedidos online     │
│                                         │
│ [Badge Especificação] · Atualizado 2h  │
│                                         │
│ Progresso: ████████░░ 3 de 4 planos    │
└─────────────────────────────────────────┘
```

- Dimensões: width responsivo via grid `repeat(auto-fill, minmax(320px, 1fr))`, altura livre.
- Padding interno: 20px.
- Border: `1px solid --color-border`, raio `lg`.
- Hover: border vira `--color-primary`, shadow `sm` → `md`, cursor pointer.
- **Avatar do projeto**: círculo 40px, cor gerada pelo hash do nome, inicial em branco.

### 4.3 Badge / Status chip

Padrão: `inline-flex`, `gap-1.5`, `px-2 py-0.5`, `rounded-full`, `text-xs`, `font-medium`, dot de 6px à esquerda.

| Badge | BG | Texto | Dot | Uso |
|---|---|---|---|---|
| Aprovado | `--color-success-light` | `--color-success-hover` (#059669) | success | Plano v1 congelado |
| Em edição | `--color-primary-light` | `--color-primary` | primary | Plano sendo refinado |
| Em rascunho | `--color-warning-light` | `--color-warning-hover` | warning | Plano iniciado, sem aprovação |
| Pendente | `--color-bg-tertiary` | `--color-text-tertiary` | gray | Plano não iniciado |
| Bloqueador | `--color-error-light` | `--color-error-hover` | error | Risco alto, decisão urgente |
| Arquivado | `--color-bg-tertiary` | `--color-text-secondary` | gray | Projeto arquivado |

### 4.4 Botões

| Variante | BG | Texto | Border | Uso |
|---|---|---|---|---|
| Primário | `--color-primary` | #fff | — | Ação principal (1 por tela) |
| Primário hover | `--color-primary-hover` | #fff | — | — |
| Secundário | #fff | `--color-text-primary` | `--color-border` | Ações alternativas |
| Ghost | transparente | `--color-text-secondary` | — | Ações tercárias inline |
| Destrutivo | #fff | `--color-error-hover` | `--color-error-light` | Arquivar/deletar |
| Link | — | `--color-primary` | — underline hover | Navegação inline |

- Tamanhos: `sm` (h-8, px-3, text-sm), `md` (h-10, px-4, text-sm), `lg` (h-11, px-5, text-base).
- Focus ring: `outline: 2px solid --color-primary; outline-offset: 2px`.
- Disabled: `opacity 0.5, cursor not-allowed`.

### 4.5 Tab bar (sub-tabs de Planos)

Com a adoção da Opção A (sidebar como eixo de navegação), a tab bar **não é mais usada como navegação primária da Fase Gestão**. Decisões, Riscos, Features e Iterações passam a ser páginas próprias acessadas pela sidebar (itens 6–9 da seção 2.2). A tab bar fica restrita às **sub-tabs internas da página "Planos"** (ou "Planos v1" na Gestão):

- Layout horizontal sob o header da página (fora do header global).
- Container `border-b 1px solid --color-border`, padding-left alinhado com conteúdo.
- Cada tab: `px-4 py-3`, `text-sm`, `font-medium`.
- **Estado default**: texto `--color-text-secondary`.
- **Hover**: texto `--color-text-primary`.
- **Ativa**: texto `--color-text-primary`, border-bottom `2px solid --color-primary` (alinhado com border-b do container; overflow negativo de -1px).
- **Ordem fixa (sub-tabs de Planos)**: Negócio · UX · Técnico.
- **Keyboard**: ArrowLeft/ArrowRight navega, Home/End saltam extremos (role="tablist").

> Nas demais páginas acessadas pela sidebar (Decisões, Riscos, Features, Iterações) **não há tab bar** — o próprio item ativo da sidebar cumpre o papel de indicador de contexto.

### 4.6 Empty state genérico

Estrutura centralizada no contêiner:

```
        [Ícone circular 64px, bg tertiary]

          Título do vazio (xl, semibold)

   Descrição em 1–2 linhas secundárias
   explicando o que este espaço vai virar.

        [ Botão primário contextual ]
        [ Link secundário "Saber mais" ]
```

- Padding vertical: `py-16`.
- Largura máxima do texto: `420px`.
- Usado em: dashboard sem projetos, tab Decisões vazia, tab Riscos vazia, Feature Registry vazio.

### 4.7 Outros componentes secundários (para consistência)

- **Tabela lista** (decisões, riscos, features): header sticky `bg-bg-secondary`, linhas com hover `--color-bg-tertiary`, divisores `border-b --color-border`.
- **Input text / textarea**: h-10, border `--color-border`, focus border `--color-primary` + ring 3px `--color-primary-light`.
- **Toast** (futuro): canto inferior-direito, `bg-gray-900`, texto branco, `rounded-lg`, shadow `lg`.

### 4.8 Captura conversacional (input de texto livre)

Interface **primária** de captura de Decisions e Risks — substitui formulário com campos vazios no caminho feliz.

- **Trigger**: botões globais "+ Decisão" / "+ Risco" (header da página Decisões/Riscos, ou painel lateral em 6.2.A/B), ou comandos `/decisão` · `/risco` no chat do projeto.
- **Layout**:
  - Textarea grande (2–3 linhas de altura inicial, auto-grow até 8 linhas), `border --color-border`, focus border + ring primary.
  - Placeholder rotativo (troca a cada ~4s ou a cada nova abertura): "Anote uma decisão...", "Anote um risco...", "Descreva a ideia naturalmente, o sistema estrutura depois.", "Ex: vamos usar Pix em vez de cartão porque...".
  - Abaixo do textarea: chips contextuais de tipo ("Decisão" / "Risco"), pré-selecionados conforme o trigger; usuário pode trocar.
  - Rodapé: botão primário "Processar" (ou `Cmd/Ctrl + Enter`); ghost "Cancelar" (`Esc`).
- **Fluxo**:
  1. Usuário digita texto livre, envia.
  2. Sistema processa (loading inline ~1–2s: "Estruturando…") e gera **preview estruturado** com título, contexto, categoria, impacto/status inferidos, pré-preenchidos.
  3. Usuário vê o preview com 2 ações: **Aceitar** (primário, 1 clique → registra direto) ou **Ajustar** (abre os campos inline editáveis; salvar confirma).
- **Pré-preenchimento com seleção**: quando acionado pelo botão "Registrar como decisão/risco" sobre um trecho selecionado (6.2.A/B), o textarea já vem com o trecho colado como ponto de partida e um rótulo `xs` terciário acima: "A partir desta seleção em [nome da seção]".
- **Fallback**: se o processamento falhar ou a inferência for insuficiente, preview abre em modo edição com os campos visíveis (é o único caminho em que o formulário tradicional aparece).

### 4.9 Card de sugestão (Inbox)

Usado na página Inbox (6.5) e em listas rápidas de triagem.

- **Layout horizontal**, padding `16px`, border `1px solid --color-border`, raio `lg`, `bg-primary`.
- **Estrutura** (esquerda → direita):
  - Coluna 1 (ícone, 40px): ícone do tipo — `gavel` (Decision) em `--color-primary-light` ou `shield-alert` (Risk) em `--color-warning-light`, círculo.
  - Coluna 2 (flex, conteúdo):
    - Linha 1: **título inferido** (`sm`, `font-semibold`, `--color-text-primary`).
    - Linha 2: snippet de origem em itálico `xs` terciário — `sugerido porque você escreveu: "…trecho original truncado em ~140 chars…"`.
    - Linha 3: meta `xs` terciário — origem (`Chat Discovery` · `Plano Técnico` · `Plano Negócio` · `Plano UX` · `Manual`) + timestamp relativo.
  - Coluna 3 (ações, alinhadas à direita, `gap-2`):
    - **Aceitar** (botão primário `sm`) — registra direto como Decision/Risk com os campos inferidos; card some da Inbox.
    - **Editar** (botão secundário `sm`) — abre modal compacto com os campos pré-preenchidos (mesma UI do preview de 4.8) para ajuste antes de registrar.
    - **Rejeitar** (ghost `sm`, ícone `x`) — remove da Inbox; futuro (v2): alimenta curva de confiança para reduzir falsos positivos.
- **Estados**:
  - Default: como acima.
  - Hover: `bg-bg-tertiary` sutil, border vira `--color-primary`.
  - Processando ação: botão da ação em loading, card bloqueado.
  - Após aceitar/rejeitar: fade out 200ms + collapse vertical; toast "Sugestão registrada em Decisões" / "Sugestão descartada".

### 4.10 Modal de triagem em momento estruturado

Aparece em pontos-chave do fluxo — hoje confirmados para MVP: **aprovar um dos 3 planos** (Negócio/UX/Técnico na Especificação) e **exportar v1** (transição "Exportar v1 e acompanhar o produto" em 6.2.A).

- **Trigger**: clique no CTA estruturado (ex.: "Aprovar plano", "Exportar v1 e acompanhar o produto"). Se a Inbox do projeto estiver **vazia**, o modal **não aparece** (silencioso, ação segue direto).
- **Layout**: modal centralizado `w-[560px]`, padding 24px, raio `lg`.
  - Header: título `xl` — "Antes de [aprovar o plano / exportar v1], revisar N sugestões pendentes?"
  - Subtítulo `sm` secundário: "Elas foram capturadas durante o refino deste projeto. Registre o que fizer sentido agora; o resto fica na Inbox."
  - Corpo: **lista compacta** das sugestões pendentes no projeto — cada linha é uma versão reduzida do card 4.9 (sem ações individuais), com **checkbox à esquerda pré-marcado**. Máx 5 visíveis; se houver mais, scroll interno + contador "+ N sugestões".
  - Footer (botões alinhados à direita):
    - Primário: "Registrar selecionadas e continuar" (N dinâmico: "Registrar 3 e continuar").
    - Secundário: "Pular e continuar" (deixa tudo na Inbox).
    - Ghost (esquerda): "Cancelar" (fecha modal sem executar a ação estruturada original).
- **Comportamento**:
  - Desmarcar todas não bloqueia: botão primário vira secundário "Continuar sem registrar".
  - Ao confirmar, sugestões selecionadas são registradas em lote (como Decisions/Risks) **antes** da ação estruturada original executar.
  - Modal só bloqueia o fluxo em 2 CTAs: aprovar plano e exportar v1. Em demais pontos, a Inbox permanece passiva.

### 4.11 Chat lateral persistente

Canal primário user ↔ IA em todas as telas com projeto carregado (ver 0.2).

- **Layout**: `320px` expandido, `48px` colapsado (somente ícone `message-square`). Fixado à direita, altura `100vh - header`, `border-left 1px solid --color-border`, `bg-primary` (#fff).
- **Estado persistido em `localStorage`** (`chat:collapsed = "0|1"`).
- **Header do chat** (altura 48px, `border-b`):
  - Avatar circular 28px (gradient primary) + nome "True Coding" em `sm font-semibold`.
  - À direita: botão ghost `minimize-2` para colapsar (atalho `]`).
- **Área de mensagens** (scroll vertical, padding `16px`):
  - **Bubble do usuário**: alinhado à direita, `bg-primary-light`, texto `--color-text-primary`, `rounded-lg` (canto inferior-direito `rounded-sm`), `max-w-[85%]`, padding `10px 12px`.
  - **Bubble da IA**: alinhado à esquerda, `bg-bg-tertiary`, texto `--color-text-primary`, `rounded-lg` (canto inferior-esquerdo `rounded-sm`), `max-w-[90%]`, padding `10px 12px`.
  - **Ações inline na mensagem da IA**: botões secundários `sm` empilhados após o texto quando aplicável — "Registrar como decisão", "Aplicar mudança ao plano", "Criar risco".
  - Timestamp `xs` terciário abaixo do bubble (ex.: "há 3min").
- **Footer** (padding `12px`, `border-t`):
  - Textarea 2 linhas iniciais, auto-grow até 6 linhas, `border --color-border`, focus border + ring primary.
  - Botão enviar primário `sm` à direita (`send` icon). Atalho `Cmd/Ctrl + Enter` envia; `Shift + Enter` quebra linha.
  - Placeholder rotativo contextual à tela atual (ver 0.3).
- **Estado vazio** (primeira abertura no projeto): **mensagem proativa contextual** da IA pré-carregada, ex.:
  - Em Plano de Negócio aprovado: "Olá Maria, posso te ajudar a refinar o Plano de Negócio. O que você quer ajustar?"
  - Em Decisões: "Posso resumir as decisões aprovadas ou te ajudar a registrar uma nova. Qual preferência?"
- **Estado colapsado** (48px): somente ícone `message-square`; badge vermelho `6px` sobre o ícone se houver mensagem não lida da IA. Hover → tooltip "Chat do projeto · `]`".
- **Acessibilidade**: `role="log"` + `aria-live="polite"` na área de mensagens; focus ring visível no textarea; navegação por teclado entre mensagens via `Tab` passa pelos botões de ação inline.

---

## 5. Conteúdo de exemplo — "Cafeteria Beta"

### 5.1 Projeto

- **Nome**: Cafeteria Beta
- **Descrição curta**: Sistema de pedidos online para a cafeteria do bairro atender retirada no balcão e entrega local.
- **Criado em**: 02/04/2026
- **Fase atual (ex.)**: Especificação (para tela 2) / Gestão (para tela 3).

> **Nota sobre uso em ambas as fases**: Decisions (seção 5.5) e Risks (seção 5.6) aparecem **desde a Fase Especificação** neste conteúdo de exemplo — use os 3 Decisions / 2 Risks para popular tanto Espec quanto Gestão. Feature Registry (5.7) aparece somente na Fase Gestão.

### 5.2 Business Plan (exemplo curto)

> A Cafeteria Beta é uma cafeteria de bairro com ~120 clientes fiéis que hoje recebe pedidos por WhatsApp e perde vendas em horários de pico por falta de organização. O produto é um mini-site de pedidos com cardápio, retirada agendada e pagamento via Pix, reduzindo tempo do atendimento em ~40% e desbloqueando entrega local num raio de 2km. **Monetização**: interno — a ferramenta é da própria cafeteria; ganho vem do aumento de ticket médio e retenção, não de assinatura.

### 5.3 Technical Plan (exemplo — 4 itens)

1. **Páginas**: Home com cardápio, Carrinho, Checkout Pix, Confirmação e status do pedido, Admin (painel da dona).
2. **Integrações**: Pix via Mercado Pago, WhatsApp Cloud API para enviar confirmação do pedido.
3. **Dados**: catálogo de produtos (editável), pedidos, configuração de horários de funcionamento.
4. **Hospedagem**: Vercel + Postgres (neon); custos previstos < R$ 60/mês.

### 5.4 UX Plan (exemplo — 3 itens)

1. **Personas**: cliente recorrente do bairro (30–55 anos, mobile-first, compra 3x/semana) e a dona da cafeteria (operando do caixa, pouco tempo para gerenciar sistema).
2. **Fluxo principal**: cliente escolhe item no cardápio → adiciona ao carrinho → escolhe retirada ou entrega → paga via Pix → recebe confirmação por WhatsApp.
3. **Acessibilidade**: tamanho mínimo de fonte 14px, contraste AA, botões 44×44 para retirar/entregar.

### 5.5 Decision Log — 3 entradas de exemplo

| ID | Título | Categoria | Status | Criado | Resumo |
|---|---|---|---|---|---|
| DEC-001 | Usar Pix em vez de cartão | Pagamento | Aprovado | 08/04/2026 | Evita taxa de cartão (~3,2%); clientes do bairro já usam Pix. Revisitar se crescer além de 2km. |
| DEC-002 | Entrega apenas raio 2 km na v1 | Operações | Aprovado | 10/04/2026 | Sem frota de entrega; dona faz pessoalmente fora do pico. |
| DEC-003 | Cardápio com fotos obrigatórias | Produto | Em discussão | 12/04/2026 | Aumenta conversão mas exige trabalho de foto. Decisão pendente até testar 10 SKUs. |

### 5.6 Risk Log — 2 entradas de exemplo

| ID | Risco | Impacto | Probabilidade | Mitigação | Status |
|---|---|---|---|---|---|
| RSK-001 | Indisponibilidade do Pix no horário de pico | Alto | Baixa | Mostrar fallback "Pagar no balcão" e reter pedido | Mitigado |
| RSK-002 | Dona não consegue atualizar cardápio sozinha | Médio | Alta | UX do admin simplificado + vídeo de 2 min; suporte por WhatsApp na 1ª semana | Aberto |

### 5.7 Feature Registry — 2 entradas de exemplo

| ID | Feature | Origem | Prioridade | Status |
|---|---|---|---|---|
| FEAT-001 | Programa de fidelidade (5º café grátis) | Feedback cliente recorrente | Alta | Em backlog |
| FEAT-002 | Pré-agendamento de pedido para manhã seguinte | Observação de fluxo de balcão | Média | Proposta |

---

## 6. Padrões visuais para as 3 telas críticas

### 6.1 `empty-dashboard.html` — dashboard sem projetos

**Contexto**: usuário novo, acabou de criar conta, 3 créditos grátis.

**Shell**:
- Sidebar expandida com somente "Projetos" (item ativo), "+ Novo projeto", saldo "3 créditos grátis" no rodapé.
- Header: breadcrumb "Projetos". Ação direita: avatar.

**Conteúdo**:
- Título H1 `3xl`: "Seus projetos".
- Subtítulo `sm` terciário: "Comece criando o primeiro. Você tem 3 créditos grátis para explorar."
- Empty state centralizado (usar componente 4.6):
  - Ícone `folder-plus` em círculo 64px `--color-primary-light`.
  - Título: "Nenhum projeto ainda"
  - Descrição: "Projetos começam pela fase de Especificação. Em ~10 minutos você tem um plano de negócio, de UX e técnico prontos para discutir."
  - Botão primário: "Criar meu primeiro projeto"
  - Link secundário: "Ver exemplo da Cafeteria Beta" (abre modal readonly com conteúdo 5.2–5.4).
- Abaixo (seção separada, `mt-12`, `border-t`), **card educativo** horizontal:
  - Ícone `sparkles`, título "Como funciona", 3 passos: "1. Descreva sua ideia → 2. Refine os 3 planos → 3. Congele a v1 e entre em Gestão". Link "Entenda o fluxo".

**Estados**:
- Loading inicial: skeleton do título + skeleton de um card largo.
- Erro de carregar projetos: banner `--color-error-light` no topo do conteúdo: "Não conseguimos carregar seus projetos. Tentar novamente."

**Microcopy importante**:
- CTA: "Criar meu primeiro projeto" (não "Novo projeto"; reforça primeira vez).
- Nunca dizer "you"; sempre "você".

---

### 6.2.A `business-plan-aprovado-espec.html` — plano aprovado na Fase Especificação

**Contexto**: projeto "Cafeteria Beta" ainda em Especificação. Business Plan foi aprovado pelo usuário mas **ainda não houve transição** para a Fase Gestão. Aprovação aqui é marco de progresso, não congelamento.

**Shell**:
- Sidebar: projeto ativo "Cafeteria Beta", item **"Especificação"** ativo (primary-light).
- Header: breadcrumb "Projetos / Cafeteria Beta / Especificação / Plano de Negócio". Ação direita: avatar.
- **Chat lateral direito** (componente 4.11) — 320px expandido por default nesta tela. O conteúdo central fica `calc(100% - 320px)`. Usuário pode colapsar para 48px via atalho `]`.
- **Sem tab bar** — tabs só existem na Fase Gestão.

**Conteúdo**:

```
Plano de Negócio                            [Badge Aprovado]
Atualizado em 14/04/2026 · por Você

[Botão secundário: Editar]        (funcional, salva direto)
[Botão primário (header direita): Próximo: Plano de UX]   (padrão — estado mais comum)
[Botão primário (header direita): Exportar v1 e acompanhar o produto]  (somente quando os 3 planos estão aprovados)
[Link ghost: Só exportar]  (aparece junto de "Exportar v1...")

─────────────────────────────────────────────────────────

## Resumo executivo
(parágrafo de 5.2)

## Público e problema
...

## Proposta de valor
...

## Monetização
...

## Métricas de sucesso
...
```

**Detalhes visuais**:
- Container de leitura `max-w-[720px]`.
- Badge "Aprovado" (success) ao lado do H1, `ml-3`, `align-middle`.
- Botão "Editar" **funcional** — clica, edita, salva. Não há changelog aqui: a fase Especificação é de refino iterativo, aprovação sinaliza progresso, não congelamento.
- **CTA primário coerente com o estado da tela**:
  - Estado comum (este plano aprovado, mas ainda há planos pendentes): CTA primário é **"Próximo: Plano de UX"** (ou "Próximo: Plano Técnico" se UX já estiver aprovado). O botão leva diretamente para o próximo plano a refinar — a ação natural depois de aprovar um plano é iniciar o próximo.
  - Estado final (os 3 planos aprovados): CTA primário vira **"Exportar v1 e acompanhar o produto"**, com "Só exportar" como link ghost ao lado. Este CTA **não aparece** enquanto há planos pendentes.
- Princípio: **CTA primário reflete o próximo passo mais provável**, não uma ação que ainda não está disponível.
- **Sem tooltip de imutabilidade.**
- **Chat lateral direito (4.11)** substitui o antigo card "Registro do projeto". As sugestões proativas para registrar decisões/riscos chegam como **mensagens da IA no chat**, com botões inline "Registrar como decisão" / "Registrar como risco" (abrem a captura conversacional 4.8 em preview pré-preenchido). Benefício: mantém a captura no canal primário sem duplicar CTAs na tela.
- O único card auxiliar remanescente (opcional, sobre o conteúdo central, **não** na barra direita — a barra direita agora é o chat) é:
  - **Card "Próximos passos"** (discreto, no topo ou pé do conteúdo):
    - Se ainda faltam planos aprovados: "Aprove UX e Técnico para liberar a transição para Gestão."
    - Se os 3 estão aprovados: "Ao clicar 'Exportar v1 e acompanhar o produto', os planos atuais viram a v1.0 publicada e o projeto entra em Gestão. Você continuará podendo editar o plano corrente."
- **Contador de registros e Inbox** não tem mais card dedicado. Fica acessível via:
  - Sidebar: itens Decisões, Riscos e Sugestões (badge contador quando N>0).
  - Chat: mensagens proativas periódicas do tipo "Você já registrou 2 decisões neste projeto. Quer revisar?" com botão inline "Abrir Decisões".

**Comportamento de captura automática (toast proativo)**:
- Ao salvar uma edição de seção (modo edição → "Salvar") cujo texto contenha gatilho claro (palavra-chave como "decidimos", "vamos usar X em vez de Y", "risco de", "pode falhar se"), o sistema mostra **toast proativo** no canto inferior-direito: "Detectamos uma possível decisão. Adicionar à Inbox?" com 2 ações inline: "Adicionar" (primário pequeno) e `x` (ignora, fecha). Toast auto-some em 8s sem ação. Nunca bloqueia o fluxo.
- O botão **"Registrar como decisão"** / **"Registrar como risco"** (disponível em painel lateral ou seleção inline) nunca abre formulário vazio: ele abre o input conversacional de 4.8 com o trecho selecionado pré-preenchido.

**Estados**:
- Aprovado + outros planos pendentes: CTA primário é **"Próximo: Plano de UX"** (ou Técnico conforme o próximo pendente). "Exportar v1 e acompanhar o produto" **não aparece** neste estado (evita CTA disabled que apenas sinaliza restrição).
- Aprovado + 3 planos prontos: CTA primário vira **"Exportar v1 e acompanhar o produto"** (habilitado). **Ao clicar**, se houver sugestões pendentes na Inbox, o **modal de triagem (4.10)** aparece antes da transição; se Inbox vazia, transição acontece direto.
- Aprovar plano (individual, botão "Aprovar" em cada plano): ao clicar, se Inbox pendente, aciona modal 4.10 antes de registrar aprovação.
- Edição ativa: textarea inline, botões "Salvar" / "Cancelar". Após "Salvar", avaliar gatilho e exibir toast proativo se aplicável.

**Microcopy importante**:
- Badge: "Aprovado".
- Data: "Atualizado em 14/04/2026" (refino contínuo).
- CTA primário (estado comum): "Próximo: Plano de UX" (ação natural depois de aprovar).
- CTA primário (estado final, 3 aprovados): "Exportar v1 e acompanhar o produto" (ação explícita, dupla consequência clara).

---

### 6.2.B `business-plan-corrente-gestao.html` — plano corrente na Fase Gestão (editável)

**Contexto**: projeto "Cafeteria Beta" já fez a transição. Os planos foram exportados como snapshot v1.0 e o projeto vive a Fase Gestão. O usuário navegou via Gestão → Planos v1 → Negócio e está vendo o **plano corrente** (iniciado como v1.0, editável, com changelog automático). Segue o **Modelo B (Flexível)** definido no Decision Log.

**Shell**:
- Sidebar: projeto ativo "Cafeteria Beta", item **"Gestão"** ativo (primary-light). Os itens Decisões, Riscos, Features e Iterações aparecem logo abaixo de Gestão.
- Header: breadcrumb "Projetos / Cafeteria Beta / Gestão / Planos v1 / Negócio". Ação direita: avatar.
- **Chat lateral direito** (componente 4.11) — 320px expandido por default. O conteúdo central (incluindo sub-tabs) fica `calc(100% - 320px)`. Colapsável via `]`.
- **Sub-tabs de Planos** (componente 4.5) logo abaixo do header: **Negócio** (ativa) · UX · Técnico. Não há tab bar adicional — Decisões/Riscos/Features/Iterações vivem como páginas próprias via sidebar.
- **Changelog automático**: continua como painel sticky (posicionado no rodapé do conteúdo OU como card pequeno em timeline) — **não** migra para a barra direita, que agora é ocupada pelo chat. Eventos de versionamento (`patch v1.0.2 aplicado`) também podem ecoar como mensagens informativas no chat, mas a fonte visual canônica permanece o painel de changelog.

**Conteúdo**:

```
Plano de Negócio                 [Badge v1.0 publicado]
Versão corrente · última edição há 2h · por Você

[Botão secundário: Editar]            (funcional)
[Botão secundário: Registrar como decisão]
[Botão ghost: Ver histórico de versões]

─────────────────────────────────────────────────────────

## Resumo executivo
(parágrafo de 5.2)

## Público e problema
...

## Monetização
...

─────────────────────────────────────────────────────────

## Changelog automático
v1.0.2 · há 2h · Você ajustou seção "Monetização" (+3 linhas, -1 linha)
v1.0.1 · ontem · Você corrigiu métrica de retenção em "Métricas de sucesso"
v1.0.0 · 14/04/2026 · Publicado a partir da Fase Especificação
```

**Detalhes visuais**:
- Container de leitura `max-w-[720px]`.
- Badge "v1.0 publicado" ao lado do H1 — **não** usar cor success; usar primary neutra ou `--color-bg-tertiary` com texto primário. "Aprovado" virou "Publicado com versão semântica"; não é mesmo significado.
- Botão "Editar" **funcional**. Cada save gera entrada no changelog automático (patch version bump: v1.0.0 → v1.0.1 → v1.0.2).
- Botão "Registrar como decisão" **abre o input conversacional (componente 4.8)**, não formulário. Se houver trecho selecionado no plano, vem pré-preenchido com o trecho e rótulo de origem. Usuário descreve a mudança em texto livre; preview estruturado gera título/contexto/mudança proposta; aceitar cria linha na tab Decisões com status "Em discussão". Quando a Decisão for aprovada, o sistema promove a próxima edição relevante a **v2.0** (minor/major bump segundo a regra semântica do projeto).
- **Toast proativo**: ao salvar edição de seção cujo texto contenha gatilho, mostrar toast "Detectamos uma decisão. Adicionar à Inbox?" (ver 6.2.A). A Inbox acumula sugestões que serão triadas na próxima versão major.
- Botão "Ver histórico de versões" abre drawer direito 480px com timeline: v1.0.2 (corrente) → v1.0.1 → **v1.0.0 publicado** (ponto marcado, readonly puro) → v0.x rascunhos pré-transição.
- Painel changelog abaixo do conteúdo (sticky bottom) OU card pequeno em timeline acima do conteúdo — **não** mais em barra lateral direita (ocupada pelo chat). Exibe as últimas 5 entradas + link "Ver tudo" que abre o mesmo drawer de histórico.

**Estados**:
- Default (corrente editável): como acima.
- Edição ativa: textarea inline, botão "Salvar alteração" primário + "Cancelar" ghost.
- Após salvar: toast "Alteração salva · v1.0.3" + changelog ganha nova linha no topo.
- Drawer histórico aberto: v1.0.0 destacada com ícone `lock` + label "Snapshot histórico · somente leitura" — reforça separação entre plano corrente e snapshot original.
- Modal "Registrar como decisão" aberto: campos título, categoria, contexto, mudança proposta, impacto esperado. CTA "Criar decisão".

**Microcopy importante**:
- Badge: "v1.0 publicado" (não "Aprovado"; versão semântica substitui aprovação como status).
- Data: "última edição há 2h" (ativa, viva).
- Botão: "Registrar como decisão".
- Explicação do botão (tooltip ou helper text abaixo): "Alguma mudança estruturou o plano? Registre como decisão para criar uma nova versão major (v2.0) com rastreabilidade completa."
- Entrada de changelog: "v1.0.2 · há 2h · Você ajustou seção 'Monetização' (+3 linhas, -1 linha)".
- **Não** usar "imutável", "congelado" ou "readonly" no plano corrente.

---

### 6.2.C Nota — histórico v1.0 readonly

A versão **v1.0 original** (snapshot publicado no momento da transição da Fase Especificação para Gestão, sem edições posteriores) **não vira tela autônoma**. Ela fica acessível apenas via drawer "Ver histórico de versões" em 6.2.B, marcada com ícone `lock` e label "Snapshot histórico · somente leitura". Dentro do drawer, o conteúdo é readonly puro (sem botão Editar, sem changelog — é o ponto fixo a partir do qual o plano corrente evoluiu). Isso deixa clara a separação conceitual: **plano corrente (editável, versionado)** vs **snapshot histórico v1.0 (imutável, consultivo)**, sem duplicar rotas de navegação.

---

### 6.3 `tab-decisoes-com-itens.html` — página Decisões (válida em Especificação e Gestão)

**Contexto**: mesmo projeto, usuário clicou em "Decisões" na sidebar.

**Shell**:
- Sidebar idêntica à 6.2, mas com item **"Decisões"** ativo (primary-light).
- Header: breadcrumb "Projetos / Cafeteria Beta / Gestão / Decisões". Ação direita: botão primário "+ Nova decisão" — **expande o chat lateral (4.11) e pré-preenche o input com prompt contextual** ("Descreva a decisão que quer registrar…") alinhado ao princípio de captura conversacional (4.8). Nunca abre formulário vazio. Ao lado, link secundário "Inbox (N)" que leva para 6.5 quando houver sugestões pendentes (some se N=0).
- **Chat lateral direito (4.11) colapsado por default** (48px, somente ícone). Clicar em "+ Nova decisão" expande-o automaticamente.
- **Sem tab bar** na página. O item ativo da sidebar já indica o contexto.

> **Nota sobre reuso em ambas as fases**: o layout do conteúdo desta página é **idêntico na Fase Especificação**. A única diferença é o breadcrumb, que vira "Projetos / Cafeteria Beta / Especificação / Decisões", e o item de sidebar que antecede "Decisões" passa a ser "Especificação" em vez de "Gestão". O mockup materializa o cenário Gestão por ser o mais comum no fluxo documentado; não é necessário criar tela duplicada para Especificação. Os counters de sidebar (ex.: "Decisões 3", "Riscos 2") são os mesmos; Features e Iterações somem da sidebar na Fase Especificação.

**Conteúdo**:

**Barra de filtros** (sticky logo abaixo da tab bar, `py-3`, `border-b`):
- Input busca (`search` icon, placeholder "Buscar por título ou contexto"), `w-[320px]`.
- Select "Status": Todos · Aprovado · Em discussão · Revogado.
- Select "Categoria": Todos · Pagamento · Operações · Produto · UX · Técnica.
- Botão ghost "Limpar filtros" (some se nada selecionado).
- Direita: toggle view "Lista / Kanban" (kanban fora de escopo v3, mostrar desabilitado com tooltip "Em breve").

**Lista** (tabela):

| Coluna | Largura | Conteúdo |
|---|---|---|
| ID | 80px | `DEC-001` em fonte mono, `text-xs`, terciário |
| Título | flex | Título + 1 linha de contexto truncada em terciário |
| Categoria | 120px | Chip cinza neutro |
| Status | 120px | Badge (ver 4.3) |
| Atualizado | 120px | "há 2 dias" em `text-xs` terciário |
| Ações | 40px | `...` menu (Ver, Editar, Revogar) |

**Linhas de exemplo**: as 3 de 5.5.

**Interação**:
- Clicar linha → drawer direito 560px com decisão completa (título, contexto, alternativas, decisão tomada, consequências, quem aprovou, data, planos afetados como chips clicáveis).
- Hover linha: `bg-bg-tertiary`.
- Linha com status "Em discussão": dot amarelo pulsante `animate-pulse` sutil (opcional, marcado como hipótese).

**Estados**:
- Lista cheia: como acima.
- Lista vazia (fallback; não para a tela v3, mas especificar para reuso):
  - Empty state: título "Sem decisões registradas", descrição "Decisões capturam mudanças de rumo que afetam planos congelados. Registre a primeira para manter o histórico.", botão "Registrar primeira decisão".
- Loading: skeleton de 5 linhas.
- Erro: banner `--color-error-light` com "Não conseguimos carregar decisões. Tentar novamente."

**Microcopy importante**:
- CTA: "+ Nova decisão" (não "Adicionar"; verbo que reflete o objeto).
- Estado "Em discussão" (não "Pendente"; mais próximo do vocabulário real de PM).

---

### 6.4 Telas candidatas para Onda 2 — empty states de Decisões e Riscos na Especificação

Propostas de layout descritivo; **ainda não materializar em HTML** nesta iteração. Entram na Onda 2 quando houver capacidade.

#### 6.4.A `empty-decisao-espec.html` — página Decisões, Fase Especificação, lista vazia

**Shell**:
- Sidebar: projeto ativo em Especificação, item **"Decisões"** ativo. Sidebar inclui Especificação · Decisões (ativa) · Riscos · Configurações (sem Features/Iterações nesta fase).
- Header: breadcrumb "Projetos / Cafeteria Beta / Especificação / Decisões". Ação direita: botão primário "+ Nova decisão".
- Sem tab bar.

**Conteúdo** (empty state centralizado, componente 4.6):
- Ícone circular 64px com `gavel` em `--color-primary-light`.
- Título: "Nenhuma decisão registrada ainda".
- Descrição (2 linhas): "Decisões capturam escolhas importantes que moldam o projeto — como tecnologia, escopo ou monetização. Você pode registrá-las desde já; elas persistem quando o projeto entrar em Gestão."
- Botão primário: "Registrar primeira decisão" (abre modal com form: título, categoria, contexto, opções consideradas, decisão tomada, consequências).
- Link secundário: "Ver exemplos de decisões" (abre modal readonly com as 3 decisões da seção 5.5 como inspiração).

**Estados adicionais**:
- Loading: skeleton do empty state (ícone + 2 linhas + botão).
- Erro ao carregar: banner `--color-error-light`.

#### 6.4.B `empty-risco-espec.html` — página Riscos, Fase Especificação, lista vazia

**Shell**: idêntico a 6.4.A mas com item **"Riscos"** ativo e breadcrumb "... / Especificação / Riscos". CTA "+ Novo risco".

**Conteúdo** (empty state centralizado):
- Ícone circular 64px com `shield-alert` em `--color-warning-light` (pela natureza preventiva).
- Título: "Nenhum risco mapeado ainda".
- Descrição: "Riscos são coisas que podem dar errado e impactar o projeto — desde integrações externas até adoção dos usuários. Mapear cedo ajuda a mitigar com tempo; os registros persistem na transição para Gestão."
- Botão primário: "Mapear primeiro risco" (abre modal com form: risco, impacto, probabilidade, mitigação proposta, status).
- Link secundário: "Ver exemplos de riscos" (modal readonly com as 2 entradas da seção 5.6).

**Estados adicionais**: idênticos a 6.4.A (loading skeleton, erro banner).

**Microcopy compartilhado**:
- Nunca usar "Pendente" como status default; usar "Aberto" (riscos) e "Em discussão" (decisões).
- Sempre sinalizar explicitamente a persistência na transição — remove a dúvida comum "vou perder isso quando migrar?".

---

### 6.5 `inbox-sugestoes.html` — Inbox de sugestões (válida em Especificação e Gestão)

**Contexto**: usuário clicou no item "Sugestões" da sidebar (seção 2.2, item 7.1). Página centralizada de triagem de sugestões de Decisions/Risks capturadas automaticamente (sistema detectou padrão) ou sob demanda (usuário iniciou via chat/botão e deixou para revisar depois).

**Shell**:
- Sidebar: projeto ativo, item **"Sugestões"** ativo (primary-light) com badge contador atualizado.
- Header: breadcrumb "Projetos / Cafeteria Beta / [Especificação|Gestão] / Sugestões". Ação direita: avatar.
- **Chat lateral direito (4.11) colapsado por default** (48px). O foco da tela é a triagem das sugestões já capturadas; o chat permanece disponível para perguntar à IA sobre uma sugestão específica ("o que você quis dizer com esta?"), mas não é canal primário aqui.
- Sem tab bar.

**Conteúdo**:

**Cabeçalho da página** (`pb-6`, `border-b`):
- H1 `2xl`: "Sugestões pendentes".
- Subtítulo `sm` terciário: "N sugestões aguardando triagem neste projeto. Registre as que fazem sentido; descarte o resto."

**Sub-tabs de tipo** (logo abaixo do cabeçalho, componente 4.5 simplificado):
- **Todas (N)** · **Decisões (X)** · **Riscos (Y)**.
- Tab ativa por default: "Todas".

**Barra de ações em lote** (sticky, `py-3`, aparece somente se houver ao menos 1 card selecionado):
- Checkbox "Selecionar todos" à esquerda (tri-state: marcado/indeterminado/vazio).
- Contador: "3 selecionadas".
- Ações à direita:
  - Primário: "Aceitar selecionadas" — registra em lote como Decisions/Risks.
  - Secundário destrutivo: "Rejeitar selecionadas".
  - Ghost: "Limpar seleção".

**Filtro lateral opcional** (drawer à direita, toggle via ícone `filter` no topo):
- Filtro por **origem**: Chat Discovery · Plano Técnico · Plano UX · Plano Negócio · Manual · Automático.
- Filtro por **tipo**: Decisão · Risco (redundante com sub-tabs, mas útil se sub-tab = "Todas").
- Botão "Limpar filtros".

**Lista vertical de cards** (componente 4.9), `gap-3`. Ordenação default: mais recentes primeiro. Opção de trocar para "Origem" ou "Tipo".

**Empty state** (quando nenhuma sugestão pendente):
- Ícone circular 64px `inbox` em `--color-primary-light`.
- Título: "Sem sugestões pendentes".
- Descrição: "O sistema sugere automaticamente quando detecta decisões ou riscos no que você escreve. Você também pode registrar manualmente com `+ Decisão` ou `+ Risco`."
- Link secundário: "Ver como funciona" (modal explicativo das 5 modalidades de captura).

**Estados**:
- Lista cheia: como acima.
- Loading: skeleton de 4 cards.
- Erro: banner `--color-error-light` "Não conseguimos carregar as sugestões. Tentar novamente."
- Após ação em lote bem-sucedida: toast "3 sugestões registradas · Ver em Decisões".

**Microcopy importante**:
- Nunca usar "Pendente" no título do card — usar o título inferido da sugestão (o card em si é implicitamente pendente por estar na Inbox).
- Snippet de origem sempre prefixado: "sugerido porque você escreveu: ..." (ou "sugerido a partir de [origem]: ..." quando origem é estruturada).
- CTA de aceitar: "Aceitar" (ação, não "Confirmar" ou "OK").

---

## 7. Checklist de consistência (telas críticas)

- [ ] Todas usam a mesma sidebar (largura, itens, rodapé com saldo) — sem "Visão geral" intermediária.
- [ ] Decisions e Riscos visíveis em ambas as fases (Especificação e Gestão); Features e Iterações só na Gestão.
- [ ] Header global sempre 56px com breadcrumb à esquerda.
- [ ] 6.2.A usa sidebar com "Especificação" ativo e **sem** tab bar; 6.2.B usa "Gestão" ativo **com sub-tabs de Planos** (Negócio/UX/Técnico).
- [ ] 6.2.A mostra badge "Aprovado" (success) e botão Editar funcional; 6.2.B mostra badge "v1.0 publicado" (primary/neutra) e changelog automático.
- [ ] Em nenhum plano corrente aparece tooltip/label de "imutável" ou "congelado" — imutabilidade fica restrita ao snapshot v1.0 dentro do drawer de histórico (6.2.C).
- [ ] Badges seguem exclusivamente a tabela 4.3 (sem cor custom).
- [ ] Todo CTA primário usa `--color-primary`; no máximo 1 por tela.
- [ ] **Cada tela tem 1 CTA primário coerente com o estado atual** — nunca um CTA primário disabled que apenas sinaliza restrição (ex.: em 6.2.A, enquanto há planos pendentes, o primário é "Próximo: Plano de UX", não "Exportar v1 e acompanhar o produto" disabled).
- [ ] Chat lateral (4.11) presente em todas as telas com projeto carregado, respeitando o estado default por contexto (0.2): expandido em planos, colapsado em tabs de gestão e inbox, ausente em dashboard/novo projeto/pré-Discovery.
- [ ] Toda tela tem um empty state definido mesmo que não seja mostrado por default.
- [ ] Textos em pt-BR com acentuação correta.
- [ ] Focus ring visível em todos os focáveis.
- [ ] Contraste mínimo AA nas combinações de texto/bg definidas em 1.1.

### 7.1 Princípios de captura (Decisions/Risks)

- [ ] Captura primária é **conversacional** (componente 4.8), nunca formulário com campos vazios no caminho feliz.
- [ ] **Inbox** (tela 6.5) é destino default; modal inline (4.10) só em momentos estruturados (aprovar plano, exportar v1).
- [ ] Botões "+ Decisão" / "+ Risco" / "Registrar como decisão/risco" estão sempre disponíveis em edições de plano (6.2.A/B) e na página Decisões (6.3).
- [ ] Toda sugestão automática exibe **origem explícita** no card ("sugerido porque você escreveu: ...").
- [ ] Toda sugestão é **editável e removível** (ações Aceitar/Editar/Rejeitar no card 4.9).
- [ ] Triagem em momentos-chave (aprovar plano, exportar v1) processa Inbox acumulada via modal 4.10; se Inbox vazia, modal não aparece.
- [ ] Efeitos colaterais estruturais (exportar v1, reverter versão) geram registro automático **sem** perguntar (não passam pela Inbox).
- [ ] Sidebar expõe **badge contador** no item "Sugestões" quando N>0; silencioso quando 0 (sem push, sem notificação).

---

## 8. Pendências para confirmação

1. ~~**Fase Gestão expõe também "Visão geral"?**~~ **Resolvido**: item "Visão geral" removido da sidebar (seção 2.2). Snapshot do projeto em Gestão vive dentro da tab "Planos v1"; sidebar mostra apenas "Especificação" **ou** "Gestão" por projeto, conforme a fase atual.
2. ~~**Visibilidade de Decisions/Risks por fase?**~~ **Resolvido (14/04/2026)**: Decisions e Risks visíveis desde a Fase Especificação e persistem na transição. Features e Iterações só na Gestão. Navegação via sidebar (Opção A). Ver seções 2.2 e 4.5.
3. **Ícone do produto (logo)**: não há SVG no repo além de "TC" text-based. Proposto manter "TC" em quadrado azul até haver marca definitiva.
4. **Counters nos itens de sidebar (ex.: "Decisões 3")**: performance/UX ok para v3, mas precisa confirmar se queries são baratas. Se não, esconder counters atrás de toggle de config.
5. **Sub-tabs "Planos" vs "Planos v1"**: nomenclatura difere entre fases (Especificação usa "Planos"; Gestão usa "Planos v1"). Confirmar se mantém divergência ou padroniza em "Planos" sempre, com badge de versão ao lado na Gestão.
6. **Notificação da Inbox**: confirmar se MVP usa apenas badge silencioso no item de sidebar (proposta atual, alinhado com princípio "não bloqueia fluxo") ou se há toast/notificação push quando uma nova sugestão é capturada automaticamente. Recomendação: começar só com badge; introduzir toast apenas se telemetria mostrar baixa taxa de descoberta da Inbox.
7. **Gatilhos de detecção automática (MVP)**: lista inicial de palavras-chave/padrões que disparam toast proativo precisa ser definida fora deste documento (responsabilidade do time de produto + Gherkin específico). Decision Log já registra que **NLP no chat do Discovery fica para v2**; no MVP, detecção automática vive apenas em **edições de plano** (6.2.A/B), não no chat.
8. **Mensagens proativas iniciais do chat por contexto**: definir a primeira mensagem que a IA envia ao usuário ao abrir o chat em cada tela (primeira abertura no projeto e aberturas subsequentes). Lista inicial proposta em 4.11 (Plano Negócio aprovado, Decisões) precisa ser expandida para: Discovery, Plano Rascunho, Plano Corrente (Gestão), Riscos, Features, Iterações, Inbox. Responsabilidade: copywriter + PM, com revisão do time de UX.

---

## 9. Observações do revisor (iteração 14/04/2026 — Decisions/Risks desde Especificação)

- **Opção escolhida**: A (sidebar). Motivo em 3 linhas: a sidebar já organiza artefatos do projeto ativo; Decisions/Risks são artefatos (não fases), logo pertencem à sidebar. Opção B criaria dupla camada de navegação (sidebar + tab bar global) e deixaria a Fase Especificação subutilizada (poucas tabs). A tab bar fica confinada ao papel de sub-navegação dentro de "Planos".
- **Conflito potencial com seção 3 (grid)**: a sidebar cresceu de ~7 para ~11 itens contextuais quando há projeto ativo em Gestão. Na altura 100vh a 1280×800 ainda cabe confortavelmente, mas em viewports curtos (≤720px altura) pode forçar scroll interno na sidebar. Não ajustado nesta iteração; sinalizar se virar problema em teste.
- **Ambiguidade residual — 6.2.A card "Registro do projeto"**: se o projeto ainda está em rascunho (planos não aprovados), faz sentido mostrar CTAs "Registrar decisão/risco"? Proposta atual diz sim (persistência é sempre útil), mas pode poluir a tela no estágio mais inicial. Validar em usability test.
- **Tela 6.3 reaproveitada**: optado por não duplicar mockup para Especificação. Se em Onda 2 o empty state das telas 6.4.A/B for muito divergente do layout da 6.3 quando cheia, pode fazer sentido extrair um componente de "lista/empty" compartilhado antes de gerar os HTMLs.
- **Ícones sugeridos (`gavel`, `shield-alert`, `list-checks`)**: Lucide tem todos; confirmar consistência com os ícones já usados nos mockups v2 antes de finalizar.

### 9.1 Observações do revisor (iteração — captura híbrida Decisions/Risks)

- **Decisão aceita no Decision Log do Notion**: "Captura híbrida (automática + sob demanda) com UX conversacional e Inbox como destino default". Incorporado em 2.2 (item 7.1), 4.8–4.10, 6.2.A/B, 6.3 e 6.5. Princípio crítico reforçado: **conversa > formulário** no caminho feliz.
- **Conflito menor com seção 9 original**: o card "Registro do projeto" em 6.2.A originalmente falava em "abre modal com form"; atualizado para abrir captura conversacional (4.8). Formulário tradicional agora só aparece como fallback de edição pós-criação ou no modo "Ajustar" do preview.
- **Hipótese marcada como pendência 7**: lista de gatilhos de detecção automática de Decisions/Risks no MVP depende de Gherkin específico que não está neste documento. Proposta de escopo MVP: detecção só em edições de plano (6.2.A/B), não no chat do Discovery (este fica para v2 conforme Decision Log).
- **Sidebar comportou bem o novo item**: "Sugestões" entrou como 7.1 (entre Riscos e Features), preservando a lógica de famílias (captura: Decisões/Riscos/Sugestões; gestão: Features/Iterações). Total de itens contextuais passa de ~11 para ~12 em Gestão — ainda cabe a 1280×800. Ver alerta do parágrafo "Conflito potencial com seção 3" acima.
- **Não alterado nesta iteração**: conteúdo de exemplo (5.x), empty states de Onda 2 (6.4.A/B), e tela 6.3 cheia. Se em iteração futura a Inbox popular esses mockups, revisitar.

---

Pronto para o próximo fluxo/tela. Indique qual persona e qual jornada quer detalhar agora.
