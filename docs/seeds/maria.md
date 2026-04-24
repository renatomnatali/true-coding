# Seed: Maria Silva / Cafeteria Beta

**Ticket:** TRC-14.7
**Script:** `prisma/seed-maria.ts`
**Fixtures (single source of truth):** `src/test/fixtures/maria-canonical.ts`
**Epic:** TRC-14 — Fundação da plataforma

## O que este seed cria

Popula o banco com o estado canônico da Maria em modo **"projeto exportado v1.0"** — tudo aprovado, pronto para demo/inspeção da UI:

| Entidade | Qtd | Observação |
| --- | --- | --- |
| `User` | 1 | `clerkId=seed-maria-clerk-id`, `personaTag=FOUNDER`, `workspaceMode=SOLO` |
| `CreditLedger` | 1 | `balance=1`, `tier=TRIAL` (resíduo pós-jornada) |
| `ProductContext` | 1 | 9 campos POLICY-010 preenchidos, 3 bets, 4 assumptions |
| `Project` | 1 | `phase=ESPECIFICACAO`, `stageKey=exportar`, `version=v1.0` |
| `PlanBlock` | 14 | 6 NEGOCIO + 4 UX + 4 TECNICO, todos `APPROVED` |
| `DecisionDraft` | 2 | `CB-DEC-001` e `CB-DEC-002` (pending, Inbox) |
| `RiskDraft` | 2 | `CB-RISK-001` e `CB-RISK-002` (pending, Inbox) |
| `Decision` | 0 | Deliberado — drafts aguardam triagem |
| `Risk` | 0 | Deliberado — drafts aguardam triagem |

Conteúdo vem de `Spec/Jornada Coleta inicial/src/data.jsx` e `data-risks.jsx` (mockups canônicos do produto) — qualquer drift exige atualizar fixture **e** mockup juntos.

## Quando usar

- **Testes manuais** da UI em dev: abrir qualquer tela da Fase Especificação já com 14 blocos, Inbox populada e Product Context completo.
- **Demos internas**: apresentar o produto para stakeholders com dados realistas e consistentes.
- **Reuso em testes unitários**: `src/test/fixtures/maria-canonical.ts` expõe os mesmos objetos consumidos pelo seed — componentes React e serviços podem importar sem precisar tocar no DB.

## Como rodar

### Dev local

```bash
# Pré-requisito: DATABASE_URL apontando para um DB acessível (.env.local).
npm run db:seed:maria
```

Saída esperada (primeira run):

```
User Maria: <cuid> (criado).
Project Cafeteria Beta Pedidos: <cuid> (criado).
Seed Maria concluído: user=<cuid>, project=<cuid>, planBlocksCriados=14/14, decisionDraftsCriados=2/2, riskDraftsCriados=2/2.
```

### Idempotência

Pode rodar N vezes sem duplicar. Todas as entidades usam upsert por chaves estáveis:

- `User` → `clerkId=seed-maria-clerk-id` (unique).
- `CreditLedger` / `ProductContext` → `userId` (unique).
- `Project` → `findFirst({ userId, name })` + create-if-missing.
- `PlanBlock` → `[projectId, planType, blockId]` composite unique.
- `DecisionDraft` / `RiskDraft` → `findFirst({ projectId, title })` + create-if-missing (não há unique no schema; dedup a nível de seed).

Re-runs preservam edições manuais feitas no Prisma Studio (blocos em `update: {}` são no-op).

## Como resetar

O seed não tem `--reset`; use SQL direto para limpar:

```sql
DELETE FROM users WHERE "clerkId" = 'seed-maria-clerk-id';
-- Cascade limpa Project, PlanBlock, DecisionDraft, RiskDraft, ProductContext, CreditLedger.
```

Depois rode `npm run db:seed:maria` novamente para recriar do zero.

## Relação com TRC-14.6

A migração `migrate-plans-to-blocks` (TRC-14.6) converte projetos **existentes** de JSON legado para PlanBlock. Este seed **não usa** aquele script — cria PlanBlocks diretamente a partir das fixtures canônicas, que é o formato final. Os dois coexistem: migração lida com histórico; seed cria estado novo para dev/testes.

## Testes

- `prisma/seed-maria.test.ts` — testes de integração contra o DB configurado.
- Skipa graciosamente se DB não está acessível (padrão de `prisma/schema.test.ts`).
- Cobertura: cria estado completo; idempotência (2 runs, sem duplicação); metadata do Project; PlanBlocks APPROVED e alinhados à fixture byte a byte.

## Limitações conhecidas

- **`CB-RISK-001 Category`**: o mockup `data-risks.jsx` marca a categoria como "Pagamentos", que não existe no enum `RiskCategory` do schema. Mapeamos para `TECNICO` (risco técnico de integração). Se o schema ganhar `PAGAMENTOS` como categoria, atualizar fixture.
- **`CB-RISK-002 Category`**: mockup marca "Operacional", também inexistente no enum. Mapeado para `MERCADO` (reflete a quebra de confiança do cliente).
- Identificadores `CB-DEC-001`, `CB-DEC-002`, `CB-RISK-001`, `CB-RISK-002` ainda não são persistidos — drafts não têm `publicId` no schema, só `Decision`/`Risk` registrados. Os códigos propostos vivem na fixture como `proposedPublicId` para quando forem promovidos.
