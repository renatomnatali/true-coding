# ADR-0009 — Arquitetura de jornada em duas fases operacionais (Especificação → Gestão) com módulos progressivos

**Data**: 2026-04-14
**Status**: Aceita
**Substitui parcialmente**: ADR-0007 (execução in-process da pipeline)

## Contexto

Três decisões estratégicas tomadas no mesmo dia alteram a arquitetura do produto:

1. **Pivô Spec-as-a-Service**: a geração autônoma de código se mostrou estruturalmente mais cara do que o estimado — competir com Claude Code / Cursor Agents / Devin exigiria 6+ meses de trabalho só para chegar em paridade. A parte de especificação (Discovery + 3 planos) já funciona e tem diferenciação real.

2. **Posicionamento como plataforma**: True Coding passa de "gerador de specs descartáveis" para "plataforma de gestão de produto com módulos progressivos". Primeiro módulo é geração de especificação (hoje); próximos são geração de código e gestão de publicação.

3. **Arquitetura de jornada**: introduz duas fases operacionais distintas na vida de um projeto, separadas por transição manual explícita:
   - **Fase Especificação**: planos em refinamento, editáveis livremente
   - **Fase Gestão**: planos v1 congelados como snapshot referência, com tabs persistentes de Decision Log / Risk Log / Feature Registry e versionamento semântico (Modelo B — Flexível)

Essas três decisões estão registradas no Decision Log do Notion como `✅ Aceita`. Este ADR é o registro técnico correspondente no repositório.

## Decisão

### Máquina de estados expandida

`Project.status` passa a ter os seguintes estados (evolução sobre o modelo atual):

```
IDEATION → PLANNING → CONNECTING → READY_FOR_DEVELOPMENT → IN_MANAGEMENT
                                       ↑                         ↓
                                       └─── (reversível) ────────┘
```

- `READY_FOR_DEVELOPMENT`: fim da Fase Especificação; planos aprovados, pode exportar
- `IN_MANAGEMENT`: Fase Gestão ativa; plano v1 congelado
- Transição entre esses dois estados é **manual e reversível** (CTA "Exportar v1 e abrir gestão" / "Voltar para Especificação")

O status `GENERATING` (Phase 4 original) é preservado em código mas **ocultado atrás de feature flag** (`ENABLE_CODE_GENERATION`, default `false` em produção). Ver ADR-0007.

### Shell de workspace evoluído

O atual `WorkspacePanel` (switch por `status`) **não serve** para a Fase Gestão. Decision Log, Risk Log e Feature Registry são **seções persistentes em paralelo**, não fases exclusivas do ciclo.

O `WorkspacePanel` evolui para **shell com tab bar**. Na Fase Especificação, mantém o modelo atual (conteúdo único por fase); na Fase Gestão, renderiza tabs: *Planos v1 | Decisões | Riscos | Features | Iterações*.

**Pré-requisito obrigatório**: extração das fases atuais inline como componentes independentes (padrão `ConnectionPhase`). Ver épico TRC-08 no Notion.

### Versionamento de planos (Modelo B)

Ao transicionar para `IN_MANAGEMENT`, um snapshot dos 3 planos aprovados é persistido como `plan_version` (v1.0). A partir daí:

- Edições diretas no plano continuam permitidas (Modelo B — Flexível)
- Todo change gera entrada de changelog automático com diff + timestamp + autor
- Usuário pode **promover** manualmente uma edição a Decision formal (botão "Registrar como decisão")
- Decision aprovada gera nova versão (v1.1 para edição menor → v2.0 para decision estrutural)

Modelo A (Contrato Imutável — sem edição direta) fica registrado como Feature Registry no Notion, não implementado no MVP.

### Separação de módulos (plataforma)

Os três módulos do produto ficam organizados como:

- **Módulo 1 — Especificação**: hoje (jornada muda pouco)
- **Módulo 2 — Geração de código**: futuro (via MCP delegation a IAs externas, não reinventando orquestrador)
- **Módulo 3 — Gestão de publicação**: futuro

Cada módulo é consumível de forma independente. O código de orchestrator / agents / quality-gates permanece no repositório sob flag off, não é deletado, aguardando descongelamento sob nova arquitetura (MCP delegation em vez de in-process execution).

## Consequências

### Impacto em dados

- Nova migration: `Project.status` enum expandido com `READY_FOR_DEVELOPMENT` e `IN_MANAGEMENT`
- Nova tabela `plan_version` com snapshot versionado
- Nova tabela `plan_changelog_entry` para diffs automáticos
- Novos campos em `User`: respostas do onboarding (2 perguntas)
- Nova tabela `agency_waitlist`

### Impacto em código

- `src/components/project/WorkspacePanel.tsx` (1962 linhas) refatorado em shell + fases + tabs
- Novo diretório `src/components/project/sections/` para tabs persistentes
- Novo diretório `src/components/project/phases/` com `PlanningPhase`, `GeneratingPhase` (sob flag), `DeployingPhase`, `LivePhase` alinhados com `ConnectionPhase`
- Novos endpoints: `/api/projects/[id]/transition-to-management`, `/transition-back`, `/export`
- `src/config/features.ts` ganha `ENABLE_CODE_GENERATION` (default false)
- Código existente de orchestrator / agents / quality-gates / release / deploy **preservado** sob flag

### Impacto em testes

- `docs/specifications/generation.feature` marcada com tag `@frozen` — cenários continuam documentados mas não fazem parte do MVP ativo
- `docs/specifications/deploy.feature` na mesma situação
- Novos `.feature` para: transição entre fases, versionamento de planos, tabs persistentes
- Suite de testes de Generation continua rodando na CI (detecção precoce de apodrecimento do código congelado)

### Impacto em documentação

- `docs/development/*.md` precisam aviso no topo: "Esta documentação cobre a Fase de Generation, atualmente congelada atrás de flag"
- Novo `docs/ROADMAP.md` com lançamentos 1 (Spec MVP) e 2 (Fase Gestão)

## Alternativas consideradas

- **Fase única sempre imutável** (plano aprovado = plano congelado) — descartada: atrito inaceitável para quem só quer spec sem gestão contínua
- **Gatilho automático ao aprovar 3 planos** — descartada: precoce, usuário ainda quer ajustar depois de aprovar
- **Detecção externa** (primeiro commit no GitHub dispara Fase Gestão) — descartada: inviável de implementar confiavelmente
- **Manter switch puro em `WorkspacePanel`** + modelar Decision Log como um status novo — descartada: quebra o modelo de exclusividade do status; Decision Log precisa estar disponível em paralelo a qualquer status do ciclo

## Referências

- Decision Log (Notion): *Pivô: separar Spec-as-a-Service do Code Generation*
- Decision Log (Notion): *True Coding é plataforma de gestão de produto com módulos progressivos*
- Decision Log (Notion): *Arquitetura da jornada: duas fases (Especificação → Gestão) com transição manual reversível*
- Épicos TRC-05 (Pivô Spec MVP), TRC-07 (Congelar Generation), TRC-08 (Extrair PlanningPhase), TRC-09 (Shell com tabs), TRC-10 (Versionamento), TRC-11 (Transição)
- ADR-0007 (execução in-process da pipeline) — superado parcialmente; pipeline continua válida mas sob flag off no MVP
- ADR-0008 (stack única MVP) — mantido
- Document Hub (Notion): *Caminho crítico do MVP — épicos TRC e dependências*
