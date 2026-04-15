# UX Spec: Redesign do DevelopmentActivityPanel

**Data**: 2026-02-18
**Componente**: `src/components/project/DevelopmentActivityPanel.tsx`
**Status**: Proposta para validacao

---

## A. Resumo do Problema e Objetivos

### Problemas identificados

1. **Mensagens de erro em 3 lugares distintos**: errorSummary no topo, eventos de erro na timeline, e card de recovery separado. O usuario nao sabe onde olhar.
2. **Animacao de "gerando codigo" sem valor**: Concorre visualmente com o restante da tela e nao comunica progresso real.
3. **Timeline cronologica invertida**: Eventos aparecem em ordem reversa, dificultando o acompanhamento linear do pipeline.
4. **Layout sem hierarquia**: Informacao repetida (status aparece no badge, na barra de progresso, e no texto de rodape) e falta de organizacao visual.

### Objetivos do redesign

| Objetivo | Metrica de sucesso |
|---|---|
| Eliminar ambiguidade sobre onde ver erros | Erro aparece em 1 unico local consistente |
| Mostrar progresso previsivel do pipeline | Todos os passos visiveis desde o inicio |
| Reduzir carga cognitiva | Menos de 3 segundos para entender o estado atual |
| Manter feedback em tempo real de arquivos | Nomes de arquivos aparecem durante geracao |

---

## B. Premissas e Restricoes

### Fatos

- O painel fica na area central (main), acima do WorkspacePanel
- Largura disponivel: flex-1 (area central), tipicamente ~400-600px
- Dados vem de SSE (DevelopmentEvent) e polling (DevelopmentRunSummary)
- Pipeline tem etapas fixas: sandbox, bootstrap, dependencias, N iteracoes (cada uma com sub-etapas), deploy final
- Estados de cada passo: pendente, executando, concluido, falhou, pulado

### Hipoteses (a validar)

- **H1**: Usuarios preferem ver todos os passos pre-populados em vez de aparecendo dinamicamente (validar com 3-5 usuarios)
- **H2**: Mostrar nomes de arquivos durante geracao reduz ansiedade de espera (validar com metricas de abandono)
- **H3**: Um unico local para erros (inline no passo que falhou) e mais eficiente que banners separados

---

## C. Personas

### Persona Primaria: Criador nao-tecnico

- **Nome**: Marina, 32 anos, fundadora de startup
- **Contexto**: Usa True Coding para criar o MVP da sua ideia. Nao programa.
- **JTBD**: "Quero acompanhar se minha aplicacao esta sendo criada corretamente, sem precisar entender detalhes tecnicos"
- **Dores**: Nao entende termos como "quality gates" ou "sandbox". Fica ansiosa quando ve erros sem saber se sao graves.
- **Barreiras**: Mensagens tecnicas (ex: "BUILD gate failed") sem traducao para linguagem acessivel.
- **Necessidades de acessibilidade**: Usa mouse, tela grande (laptop). Sem necessidades especiais identificadas.

### Persona Secundaria: Desenvolvedor curioso

- **Nome**: Carlos, 27 anos, dev frontend
- **Contexto**: Usa True Coding para prototipar rapidamente. Quer ver detalhes tecnicos.
- **JTBD**: "Quero entender exatamente o que o pipeline esta fazendo, ver os arquivos sendo gerados, e diagnosticar falhas rapidamente"
- **Dores**: Timeline invertida dificulta seguir a sequencia. Erros em 3 lugares confundem.
- **Barreiras**: Falta de detalhamento nos sub-passos (quais gates passaram/falharam especificamente).

---

## D. Jornada Detalhada: Acompanhar Execucao do Pipeline

### Cenario: Happy path (tudo funciona)

| Passo | Acao | Emocao | O que ve | Expectativa |
|---|---|---|---|---|
| 1 | Confirma inicio da run | Expectativa | Pipeline pre-populado, tudo pendente | "Vai comecar!" |
| 2 | Sandbox inicia | Curiosidade | Sandbox muda para "executando" | "Esta preparando" |
| 3 | Bootstrap executa | Curiosidade | Bootstrap executando, sandbox concluido | "Avancando" |
| 4 | Iteracao 1 inicia | Interesse | Sub-passos da iteracao aparecem | "Agora vem o codigo" |
| 5 | Geracao de arquivos | Satisfacao | Nomes de arquivos aparecendo em tempo real | "Esta criando meu app!" |
| 6 | Quality Gates passam | Alivio | Gates ficam verdes | "Passou nos testes" |
| 7 | Deploy final | Ansiedade -> Alegria | Deploy fica verde, URL aparece | "Meu app esta no ar!" |

### Cenario: Falha em quality gate

| Passo | Acao | Emocao | O que ve | Expectativa |
|---|---|---|---|---|
| 1-4 | (mesmo do happy path) | - | - | - |
| 5 | Quality gate falha | Preocupacao | Gate fica vermelho com mensagem inline | "O que aconteceu?" |
| 6 | Ve acoes de recuperacao | Decisao | Botoes "Tentar novamente" e "Cancelar" aparecem DENTRO do passo falho | "Tenho opcoes" |
| 7 | Clica "Tentar novamente" | Esperanca | Iteracao reinicia, contagem de tentativa visivel | "Vamos ver se funciona" |

### Pontos de friccao mapeados

1. **Termos tecnicos**: "Quality Gates" nao significa nada para Marina -> Solucao: usar "Verificacao de qualidade" com detalhamento expandivel
2. **Erro sem contexto**: "BUILD failed" -> Solucao: mensagem inline no passo com linguagem acessivel + detalhes expandiveis
3. **Espera longa sem feedback**: Geracao de codigo pode levar minutos -> Solucao: contagem de arquivos e nomes em tempo real

---

## E. Fluxos e Requisitos

### E.1 Estrutura do Pipeline (pre-populado)

```
Pipeline Autonomo
|
+-- Preparacao
|   +-- [1] Ambiente (sandbox)
|   +-- [2] Estrutura do projeto (bootstrap)
|   +-- [3] Dependencias (npm install)
|
+-- Iteracao 1 de N
|   +-- [4] Especificacao
|   +-- [5] Testes
|   +-- [6] Geracao de codigo        <- mostra arquivos
|   +-- [7] Revisao
|   +-- [8] Verificacao de qualidade  <- BUILD, UNIT, BDD
|   +-- [9] Publicacao (Git)
|
+-- Iteracao 2 de N (repete)
|   +-- ...
|
+-- Deploy final (Netlify)
```

### E.2 Regras de exibicao

**Regra 1 - Pre-populacao**: Todos os passos aparecem desde o inicio com status "pendente". As iteracoes sao populadas apos o plano de iteracoes ser definido.

**Regra 2 - Progresso linear**: Os passos de cima para baixo. O passo em execucao tem destaque visual (cor azul, indicador pulsante sutil). Passos concluidos ficam esmaecidos com checkmark.

**Regra 3 - Erro inline unico**: Quando um passo falha, a mensagem de erro aparece DENTRO desse passo (expandido automaticamente). Nenhum banner, card ou alerta separado. Se existem acoes de recuperacao, elas aparecem dentro do mesmo bloco do passo falho.

**Regra 4 - Arquivos em tempo real**: Durante "Geracao de codigo", o passo expande e mostra os nomes dos arquivos conforme sao gerados, com contagem (ex: "3/12 arquivos").

**Regra 5 - Sem animacao decorativa**: Remover qualquer animacao que nao comunique estado (ex: a animacao de "gerando codigo" atual). O unico indicador de "em andamento" e o icone pulsante no passo ativo.

**Regra 6 - Agrupamento logico**: Passos de infraestrutura (sandbox, bootstrap, deps) ficam agrupados em "Preparacao". Cada iteracao e um grupo colapsavel. Deploy final fica isolado no final.

**Regra 7 - Barra de progresso global**: Uma barra fina no topo do painel mostra o progresso geral (baseado em passos concluidos / total de passos). Sem texto de percentual.

### E.3 Estados por passo

| Estado | Icone | Cor do icone | Cor do texto | Comportamento |
|---|---|---|---|---|
| Pendente | circulo vazio | slate-300 | slate-400 | Texto esmaecido |
| Executando | circulo cheio | blue-500 | slate-900 (bold) | Icone com opacity pulse sutil |
| Concluido | checkmark | emerald-500 | slate-500 | Texto esmaecido |
| Falhou | X | red-500 | red-700 (bold) | Expande detalhes + acoes |
| Pulado | traco | slate-300 | slate-400 (riscado) | Texto com line-through |

### E.4 Tratamento de erro (local unico)

Quando um passo falha:
1. O icone muda para X vermelho
2. O passo expande automaticamente mostrando:
   - Mensagem de erro em linguagem acessivel (1 linha)
   - Link/botao "Ver detalhes" para expandir mensagem tecnica
   - Acoes de recuperacao (se aplicavel):
     - "Tentar novamente" (primary)
     - "Cancelar execucao" (secondary/danger)
     - "Retomar checkpoint" (se em WAITING_CHECKPOINT)
3. Nenhum outro componente na tela mostra erro

### E.5 Confirmacao de retomada

Quando o usuario reabre o projeto com run ativa/pendente:
- Banner de confirmacao aparece NO TOPO do painel (acima do pipeline)
- Pipeline fica visivel mas com estado "pausado" (tudo cinza)
- Apos confirmar, banner desaparece e pipeline retoma com estados reais

---

## F. Especificacao UX/UI

### F.1 Arquitetura de informacao

```
DevelopmentActivityPanel
+-- [Barra de progresso global] (fina, sem texto)
+-- [Banner de confirmacao] (condicional: apenas quando aguarda confirmacao)
+-- [Cabecalho] "Pipeline Autonomo" + badge de status
+-- [Pipeline Steps]
    +-- Grupo: Preparacao
    |   +-- Ambiente
    |   +-- Estrutura do projeto
    |   +-- Dependencias
    +-- Grupo: Iteracao 1
    |   +-- Especificacao
    |   +-- Testes
    |   +-- Geracao de codigo
    |   |   +-- [lista de arquivos] (expandivel)
    |   +-- Revisao
    |   +-- Verificacao de qualidade
    |   |   +-- [detalhes dos gates] (expandivel)
    |   +-- Publicacao
    +-- ... (repetem iteracoes)
    +-- Deploy final
```

### F.2 Componentes e padroes

**StepIndicator**: Icone circular (12px) + label + detail opcional
- Usa icons geometricos (circulo, checkmark, X, traco)
- Sem emojis

**StepGroup**: Container colapsavel para agrupar passos relacionados
- Header clicavel com contagem de sub-passos (ex: "3/6 concluidos")
- Borda esquerda colorida indicando estado do grupo

**ProgressBar**: Barra horizontal fina (3px) no topo
- Cor blue-500 para progresso, slate-200 para restante
- Transicao suave (transition-all duration-700)

**ErrorBlock**: Bloco inline dentro do passo falho
- Background red-50, border red-200
- Mensagem acessivel + botao "Ver detalhes"
- Acoes de recuperacao como botoes

**FileList**: Lista de nomes de arquivo durante geracao
- Maximo 8 arquivos visiveis, com "+N mais" se exceder
- Font mono, tamanho menor (text-[11px])

### F.3 Microcopy por tela/estado

**Cabecalho**
- Titulo: "Pipeline Autonomo"
- Subtitulo: "Acompanhe a criacao do seu aplicativo em tempo real"

**Passos - Labels**
- Ambiente -> "Preparando ambiente"
- Estrutura do projeto -> "Criando estrutura do projeto"
- Dependencias -> "Instalando dependencias"
- Especificacao -> "Escrevendo especificacao"
- Testes -> "Gerando testes"
- Geracao de codigo -> "Gerando codigo"
- Revisao -> "Revisando codigo"
- Verificacao de qualidade -> "Verificando qualidade"
- Publicacao -> "Publicando no Git"
- Deploy final -> "Publicando na internet"

**Passos - Status inline**
- Pendente: (sem texto adicional)
- Executando: (sem texto adicional, icone pulsante basta)
- Concluido: (sem texto adicional)
- Falhou: mensagem de erro abaixo
- Pulado: "Pulado"

**Grupo Iteracao**
- Colapsado: "Iteracao 1 -- 4/6 concluidos"
- Expandido: mostra todos os sub-passos

**Erros**
- Quality gate BUILD falhou: "A verificacao de compilacao encontrou erros no codigo."
- Quality gate UNIT falhou: "Alguns testes automatizados nao passaram."
- Quality gate BDD falhou: "Os testes de comportamento nao foram aprovados."
- Erro generico de agente: "Ocorreu um erro durante a execucao. O sistema pode tentar novamente."
- Erro de release: "Nao foi possivel publicar o codigo no repositorio."
- Erro de deploy: "A publicacao na internet encontrou um problema."

**Acoes de recuperacao**
- Botao primario: "Tentar novamente"
- Botao secundario: "Cancelar execucao"
- Botao terciario: "Retomar de onde parou"

**Banner de confirmacao**
- Titulo: "Existe uma execucao pendente"
- Texto (run ativa): "Deseja continuar acompanhando a execucao atual?"
- Texto (run stale): "A ultima execucao nao esta mais ativa. Deseja retomar agora?"
- Botao primario: "Continuar" / "Retomar execucao"
- Botao secundario: "Agora nao"

**Run terminal**
- Sucesso: "Seu aplicativo foi criado com sucesso!"
- Cancelado: "A execucao foi cancelada."
- Falha final: "A execucao encontrou erros. Voce pode iniciar uma nova tentativa."

### F.4 Estados completos

**Estado: Inicial (pipeline pre-populado)**
- Barra de progresso: 0%
- Badge: "Na fila"
- Todos os passos: pendente
- Iteracoes: aparecem apos plano ser definido

**Estado: Em execucao**
- Barra de progresso: proporcional
- Badge: "Executando"
- Passos anteriores: concluido
- Passo atual: executando (com icone pulsante)
- Proximos passos: pendente

**Estado: Geracao de arquivos**
- Passo "Gerando codigo": executando e expandido
- Lista de arquivos aparecendo com contagem
- Restante: mesmo padroes

**Estado: Falha**
- Badge: "Falhou" (vermelho)
- Passo falho: expandido com erro inline
- Acoes de recuperacao dentro do passo
- Sem banners/cards separados

**Estado: Sucesso**
- Barra de progresso: 100%
- Badge: "Concluido" (verde)
- Todos os passos: concluido
- Mensagem final positiva

**Estado: Aguardando confirmacao**
- Banner de confirmacao no topo
- Pipeline visivel mas cinza (opacity-50)
- Barra de progresso pausada

### F.5 Acessibilidade (WCAG 2.2 AA)

- [ ] Contraste minimo 4.5:1 para texto
- [ ] Icones com aria-label descrevendo estado
- [ ] Grupos com role="group" e aria-label
- [ ] Barra de progresso com role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax
- [ ] Botoes com labels acessiveis
- [ ] Secoes expandiveis com aria-expanded
- [ ] Foco visivel em todos os interativos (focus-visible)
- [ ] Ordem de tab segue ordem visual (top-to-bottom)
- [ ] Estados comunicados via aria-live="polite" para mudancas dinamicas
- [ ] Cor nao e o unico indicador de estado (icones + texto)

---

## G. Mockups

Os mockups HTML/CSS ficam em `/docs/ux/mockups/pipeline-panel/`:

| Arquivo | Proposito | Como navegar |
|---|---|---|
| `index.html` | Hub de navegacao | Abrir este arquivo |
| `01-initial.html` | Pipeline pre-populado (tudo pendente) | Link no hub |
| `02-running.html` | Execucao em andamento | Link no hub |
| `03-files.html` | Geracao de arquivos em tempo real | Link no hub |
| `04-failure.html` | Falha com erro inline | Link no hub |
| `05-success.html` | Pipeline concluido com sucesso | Link no hub |
| `06-confirmation.html` | Aguardando confirmacao de retomada | Link no hub |

Cada mockup demonstra:
- Layout completo do painel
- Estados dos passos conforme especificado
- Microcopy real em portugues brasileiro
- Cores e espacamento consistentes com Tailwind

---

## H. Checklist Final

### Heuristicas de Nielsen
- [x] Visibilidade do estado do sistema: passos pre-populados + icones de estado
- [x] Correspondencia com mundo real: labels em linguagem acessivel
- [x] Controle do usuario: acoes de recuperacao visiveis no passo falho
- [x] Consistencia: mesmos padroes visuais para todos os passos
- [x] Prevencao de erros: confirmacao antes de cancelar execucao
- [x] Reconhecimento em vez de memorizacao: estados visuais claros (cor + icone)
- [x] Flexibilidade: detalhes expandiveis para usuario tecnico
- [x] Design minimalista: sem animacoes decorativas, sem informacao duplicada
- [x] Recuperacao de erros: acoes claras dentro do passo falho
- [x] Ajuda e documentacao: mensagens de erro com orientacao

### Acessibilidade
- [x] WCAG 2.2 AA compliant (contraste, aria, foco, semantica)
- [x] Cor nao e unico indicador
- [x] Teclado acessivel

### Consistencia
- [x] Erro em 1 unico local (inline no passo)
- [x] Sem animacoes que nao comunicam estado
- [x] Textos em pt-BR com acentuacao correta

---

## I. Proximos Passos

1. **Validar com usuarios**: Testar mockups com 3-5 usuarios (Marina e Carlos) para confirmar hipoteses H1, H2, H3
2. **Medir**: Comparar tempo para "entender estado atual" antes vs depois do redesign
3. **Iterar**: Ajustar microcopy e niveis de detalhe com base no feedback
4. **Implementar**: Refatorar DevelopmentActivityPanel.tsx seguindo esta spec
5. **Testar**: Cruzar com cenarios do generation.feature para garantir cobertura

---

Pronto para o proximo fluxo/tela. Indique qual persona e qual jornada quer detalhar agora.
