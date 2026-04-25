# ADR-0025 — Gestão contínua: BOOTSTRAP → ACTIVE permanente

> **Nota de numeração:** ADR local mirror de TRC-ADR-025 (Notion). Numeração local segue a do Notion para facilitar referência cruzada.

**Status:** Aceito
**Data:** 2026-04-24
**Referências no código:** `prisma/schema.prisma` (`Project.stage`, `enum ProjectStage`), `src/test/fixtures/maria-canonical.ts`, `src/components/shell/ProductSidebar.tsx`
**Notion mirror:** TRC-ADR-025

> **Y-Statement:** No contexto da plataforma de gestão de produto da TC, vendo que o modelo anterior (TRC-ADR-012) prometia uma transição manual de "Fase de Especificação" para "Fase de Gestão" e que isso confundia usuários e introduzia dívida de UX (semelhante a "publicação"), decidimos modelar o ciclo de vida com **dois stages permanentes** — `BOOTSTRAP` (Discovery + 3 planos não aprovados) e `ACTIVE` (planos aprovados; gestão contínua) —, sem transição manual nem caminho de volta, para alcançar **gestão como essência do produto desde o dia 1** (Decision Log, Risk Log e Feature Registry vivos desde `BOOTSTRAP`), aceitando que **TRC-ADR-012 e TRC-ADR-017 viram Superseded** e que **TRC-ADR-015 (naming) precisa ser parcialmente revisitada** ("Especificação" sobrevive como nome de área visual; "Gestão" deprecated como rótulo de fase).

---

## Contexto

A combinação de TRC-ADR-008 (pivô **Spec-as-a-Service**), TRC-ADR-012 (duas fases Especificação→Gestão) e TRC-ADR-017 (Decision Log no sidebar) deu origem a um modelo mental do produto em que o projeto **transicionava** de uma "Fase de Especificação" para uma "Fase de Gestão". Isso era visível em:

- `Project.phase: ProjectPhase` no schema, com valores `ESPECIFICACAO` e `GESTAO`.
- Cópia de UI usando "abrir gestão" / "concluir especificação".
- Documentação de jornada em fases sequenciais.

Esse desenho tinha três problemas concretos.

1. **Conflito com TRC-ADR-008**: a TC **exporta** um bundle (`spec.md` + `manifest.json`) que o usuário consome no próprio ambiente; não "publica" nada. "Concluir especificação" e "abrir gestão" sugerem que **algo aconteceu lá fora** quando, na verdade, o projeto continua vivo dentro da TC. O vocabulário lembrava o anti-padrão "publicação" que o pivô justamente removeu.
2. **Confusão sobre quando gestão começa**: quando exatamente a Maria entra na "Fase Gestão"? Após aprovar os 3 planos? Após exportar? Após validar o spec com um terceiro? Cada lugar do produto respondia diferente, e o usuário não tinha modelo mental claro.
3. **Anti-padrão "spec termina, gestão começa"**: a promessa da TC é ser **plataforma de gestão de produto contínua** — Decision Log, Risk Log e Feature Registry deveriam estar vivos desde o primeiro pedido na cadeia de Discovery, não ficar dormentes esperando a "abertura da fase de gestão".

Em 2026-04-24, Renato corrigiu explicitamente: **"TC é plataforma de gestão de produto; gestão é o que o app faz o tempo todo, não tem fase"**. Este ADR formaliza essa correção.

---

## Decisão

O ciclo de vida do projeto na TC tem **dois stages permanentes**, modelados em `Project.stage: ProjectStage` no schema:

### Stage 1 — `BOOTSTRAP`

- **Definição:** Discovery em andamento ou os 3 planos (NEGOCIO/UX/TECNICO) ainda não estão todos aprovados.
- **Disponível desde dia 1:** Decision Log, Risk Log e Feature Registry. Não esperam "abrir gestão".
- **UI:** Sidebar mostra Especificação como área visual ativa; Decision Log, Risk Log e Inbox aparecem normalmente, com volume baixo (drafts auto-gerados pela IA durante Discovery e edição de planos).

### Stage 2 — `ACTIVE`

- **Definição:** Os 3 planos estão aprovados (`businessPlanApproved && uxPlanApproved && technicalPlanApproved`).
- **Transição:** **Automática** quando os 3 atingem aprovação. Sem botão "abrir gestão", sem checkpoint manual.
- **Sem volta:** Não há transição `ACTIVE → BOOTSTRAP`. Refinamentos posteriores em planos acontecem dentro do `stage=ACTIVE` via fluxo normal de edição de PlanBlock + registro de Decision (POLICY-005).

### Export é evento pontual, NÃO transição de stage

- Export (gerar `spec.md` + `manifest.json` para download/MCP delegation) pode ser executado **N vezes** ao longo da vida do projeto.
- Cada export bumpa `Project.version` (v1.0 → v1.1 → v2.0 etc.) mas **não muda o stage**.
- Um projeto pode estar `stage=BOOTSTRAP` e ainda assim ter feito exports prévios de versões parciais (caso edge — não o caminho recomendado, mas tecnicamente permitido).

### Implicações no schema

```prisma
// prisma/schema.prisma (TRC-14.10)
enum ProjectStage {
  BOOTSTRAP
  ACTIVE
}

model Project {
  // ...
  stage    ProjectStage @default(BOOTSTRAP)
  stageKey String       @default("discovery_q1")  // ponto da jornada UI
  version  String       @default("v1.0")           // versão do bundle exportado
}
```

`stageKey` e `stage` respondem a perguntas diferentes:

- `stage`: **em que momento do ciclo de vida o projeto está** (BOOTSTRAP/ACTIVE).
- `stageKey`: **em qual ponto da jornada da UI** o usuário está parado (`discovery_q1`, `negocio`, `exportar`, etc.) — informacional/UX.

---

## Alternativas consideradas

### A) Manter 2 fases com transição manual ("Concluir especificação", "Abrir gestão")

- **Prós:** marco celebratório claro; usuário sabe que "terminou uma etapa".
- **Contras:** confunde com "publicação" (anti-padrão de TRC-ADR-008); cria dívida de UX de definir quando o botão é apresentado e quais consequências disparam; pressupõe que "Gestão" é uma coisa nova quando, na promessa da plataforma, ela já estava acontecendo.
- **Por que não:** o pivô Spec-as-a-Service já removeu o vocabulário "publicar"; manter "abrir gestão" é a mesma armadilha em outro nome.

### B) Manter 2 fases sem transição manual (transição automática)

- **Prós:** automação evita o anti-padrão da Opção A.
- **Contras:** o nome "Fase de Gestão" continua sugerindo que **antes** dela gestão não acontecia. Nomenclatura desacoplada do comportamento real do produto, que é gerir desde dia 1.
- **Por que não:** problema é semântico, não só de UX. Renomear é metade da solução; a outra metade é o modelo de dados refletir o comportamento ("stage permanente" em vez de "fase transicionada").

### C) Stages BOOTSTRAP→ACTIVE permanentes (escolhida)

- **Prós:** alinha schema, vocabulário e modelo mental do usuário; gestão contínua deixa de ser "promessa futura" e vira **comportamento explícito desde dia 1**; remove a dívida UX de "abrir gestão".
- **Contras:** perde-se o marco celebratório explícito da Opção A — há que pensar em micro-celebração compatível (toast "Maria, você acabou de aprovar o último plano — agora seu projeto está em gestão ativa permanente"), mas isso é UX, não modelo de dados.
- **Por que sim:** a única opção que casa o vocabulário com o produto e elimina a dívida sem reintroduzir ambiguidade.

---

## Consequências

### Positivas

- **Schema enxuto:** `Project.stage` substitui `Project.phase` com semântica precisa; o enum tem só 2 valores, ambos com critério de transição claro.
- **Decision/Risk/Feature Registry sempre disponíveis:** TRC-15/16/17/18/19 (refino de Product Context, Decision Log, Risk Log, Feature Registry, Versioning) não precisam mais checar "estamos na fase Gestão" — são parte do produto desde sempre.
- **Sem dívida de "publicação":** alinhado com TRC-ADR-008, o produto não tem mais conceito que evoque "go-live"; export é uma operação técnica de geração de bundle, não um marco de ciclo de vida.

### Negativas

- **TRC-ADR-012 e TRC-ADR-017 viram `Superseded`:** o Decision Log do Notion deve marcar as duas explicitamente. ADR-0017 (Decision Log no sidebar) sobrevive parcialmente: o sidebar continua mostrando Decision Log, mas a justificativa "porque agora estamos na fase Gestão" muda para "porque o Decision Log vive desde dia 1".
- **TRC-ADR-015 (naming) parcialmente válida:** "Especificação" sobrevive como **nome de área visual** (agrupa os 3 planos no sidebar). "Gestão" como rótulo de fase fica deprecated; pode aparecer apenas em copy descritiva ("o seu projeto está em gestão ativa") nunca como label de área ou estado nominal.
- **Migração de dados necessária:** projetos legados com `phase=ESPECIFICACAO` viram `stage=BOOTSTRAP`; `phase=GESTAO` viram `stage=ACTIVE`. Mapeamento realizado em `prisma/migrations/20260424210421_rename_project_phase_to_stage/migration.sql`.

### Mitigação

- **TRC-14.10** entrega o pacote completo: rename `Project.phase → Project.stage` no schema + migration de dados + ADR-0025 mirror + varredura de "publicar" no código fonte.
- **TRC-15..19** já estão modelados com base em `BOOTSTRAP/ACTIVE` (refino confirmado por Renato).
- Documentação de seeds (`docs/seeds/maria.md`) e de migration (`docs/migrations/2026-04-plans-to-blocks.md`) atualizadas para usar a nova nomenclatura.

---

## Revisão

- Revisar quando algum dos seguintes ocorrer:
  - Surgir necessidade de um terceiro stage (ex: `ARCHIVED` para projetos abandonados).
  - Aparecer demanda de "rebobinar" um projeto ACTIVE para BOOTSTRAP (cenário não previsto hoje, mas possível com pivôs de produto severos).
  - Após 6 meses operando com o modelo, validar se a ausência do marco celebratório explícito não está degradando engajamento.

---

## Referências

- [ADR-0008 Stack Única MVP](ADR-0008-stack-unica-mvp.md)
- [ADR-0026 Protocolo de congelamento de Generation](ADR-0026-protocolo-congelamento-generation.md)
- TRC-ADR-008 (Notion) — pivô Spec-as-a-Service.
- TRC-ADR-012 (Notion) — superseded por este ADR.
- TRC-ADR-015 (Notion) — naming, parcialmente revisitada.
- TRC-ADR-017 (Notion) — superseded parcialmente por este ADR.
- TRC-14.10 — chore de migração `Project.phase → Project.stage` + varredura "publicar" + este mirror.
- `prisma/migrations/20260424210421_rename_project_phase_to_stage/migration.sql` — script idempotente da migração de dados.
