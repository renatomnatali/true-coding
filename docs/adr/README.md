# Architecture Decision Records (ADR)

Este diretório contém os **Architecture Decision Records** do projeto True Coding.

## O que é um ADR?

Um ADR documenta uma **decisão significativa de arquitetura ou design** que afeta o projeto. É um registro histórico do **por quê** uma decisão foi tomada, não apenas **o quê** foi decidido.

## Quando criar um ADR?

Crie um ADR quando:

- ✅ Escolher entre múltiplas abordagens técnicas (ex: REST vs GraphQL)
- ✅ Definir padrões de código ou arquitetura
- ✅ Adicionar/remover dependências importantes
- ✅ Mudar fluxos de UX críticos
- ✅ Decisões que têm trade-offs significativos

**NÃO** crie ADR para:

- ❌ Bug fixes simples
- ❌ Refatorings sem mudança de abordagem
- ❌ Mudanças triviais de estilo/lint

## Estrutura de um ADR

Cada ADR deve seguir este template:

```markdown
# [Número]. [Título da Decisão]

**Status:** [Proposto | Aceito | Rejeitado | Substituído | Deprecated]

**Data:** YYYY-MM-DD

**Decisores:** [Nome(s) de quem decidiu]

---

## Contexto

[Por que precisamos tomar esta decisão? Qual problema estamos resolvendo?]

## Decisão

[O que decidimos fazer? Seja específico.]

## Consequências

### Positivas
- [Benefício 1]
- [Benefício 2]

### Negativas
- [Trade-off 1]
- [Trade-off 2]

## Alternativas Consideradas

### Opção A: [Nome]
- **Prós:** ...
- **Contras:** ...
- **Por que rejeitada:** ...

### Opção B: [Nome]
- **Prós:** ...
- **Contras:** ...
- **Por que rejeitada:** ...

## Referências

- [Link para discussão, issue, PR, etc]
```

## Numeração

ADRs são numerados sequencialmente com zero-padding:

- `0000-template.md` - Template de referência
- `0001-primeira-decisao.md`
- `0002-segunda-decisao.md`
- ...

## Status de ADRs

- **Proposto** - Em discussão, não implementado ainda
- **Aceito** - Aprovado e sendo/foi implementado
- **Rejeitado** - Proposto mas não aprovado
- **Substituído** - Substituído por outro ADR (linkar)
- **Deprecated** - Não mais válido

## Como usar

1. Copie `0000-template.md`
2. Renomeie para `XXXX-titulo-kebab-case.md` (próximo número)
3. Preencha todas as seções
4. Abra PR para revisão
5. Após aprovação, atualize status para "Aceito"

## Índice de ADRs

| # | Título | Status | Data |
|---|--------|--------|------|
| [0001](./0001-discovery-flow-estruturado.md) | Discovery Flow com 5 Perguntas Estruturadas | Aceito | 2026-01-27 |
| [0002](./0002-database-enforced-progress-tracking.md) | Database-Enforced Progress Tracking | Aceito | 2026-01-27 |
| [0003](./0003-mockup-first-development.md) | Mockup-First Development Workflow | Aceito | 2026-01-27 |

---

**Mantido por:** Engineering Team
**Última atualização:** 2026-01-27
