# Migração: JSON blobs de planos → PlanBlock granular

**Ticket:** TRC-14.6
**Data:** 2026-04
**Script:** `prisma/migrations/scripts/migrate-plans-to-blocks.ts`
**Epic:** TRC-14 — Fundação da plataforma

## O que a migration faz

Converte os campos legados `Project.businessPlan`, `Project.technicalPlan` e `Project.uxPlan` (JSON monolíticos) em blocos canônicos na tabela `PlanBlock`, habilitando o canvas granular consumido por TRC-18.

Para cada `Project` candidato:

1. Lê os três campos JSON legados.
2. Parseia cada plano para um mapa `blockId → body (markdown)` conforme o mapeamento canônico:
   - **Negócio (6 blocos):** `visao`, `problema`, `publico`, `features`, `diferenciais`, `monetizacao`
   - **UX (4 blocos):** `personas`, `jornadas`, `telas`, `tokens`
   - **Técnico (4 blocos):** `stack`, `arquitetura`, `dados`, `integracoes`
3. Cria os `PlanBlock` correspondentes com `status = APPROVED` e `approvedAt = Project.updatedAt`. Planos antigos são considerados já aprovados porque, no modelo legado, o produto só permitia avançar após aprovação explícita (no modelo atual TRC-ADR-025, a aprovação dos 3 planos é o que move o projeto de `stage=BOOTSTRAP` para `stage=ACTIVE`).
4. Preserva o JSON original em `Project.legacyPlans` com um `migratedAt`:
   ```json
   {
     "migratedAt": "2026-04-22T...",
     "businessPlan": { ... JSON original ... },
     "technicalPlan": { ... },
     "uxPlan": { ... }
   }
   ```

### Propriedades

- **Idempotente:** projetos com `legacyPlans` já preenchido são pulados.
- **Transacional:** cada projeto migra num único `$transaction` — ou tudo, ou nada.
- **Seguro com dados malformados:** se um bloco específico não pode ser derivado do JSON, o script usa fallback (dump cru do JSON num bloco do mesmo plano) e loga warning. Nenhum dado é perdido.
- **Seleção:** sem filtro → todos os projetos com algum plano não-null e `legacyPlans = null`. Com `--project-id=<id>`, migra apenas o projeto indicado (útil para testar ou retomar).

### Campos legados que não têm bloco dedicado

Anexados a blocos existentes (sem perda):

- `businessPlan.niceToHaveFeatures` e `businessPlan.successMetrics` → blocos `features` e `diferenciais` respectivamente.
- `technicalPlan.apiEndpoints` e `technicalPlan.realtime` → bloco `integracoes`.
- `uxPlan.informationArchitecture` → bloco `telas`.

### Campos legados NÃO migrados (design deliberado)

Os seguintes campos do shape legacy são **descartados** na migração — ainda ficam preservados no `legacyPlans` cru, mas não aparecem em nenhum `PlanBlock`:

- `technicalPlan.security` — vai virar campo de Risk Log (POLICY-003), que vive permanentemente desde `stage=BOOTSTRAP` (TRC-ADR-025).
- `technicalPlan.performance` — métricas, melhor modeladas como assumptions do Product Context (POLICY-010).
- `technicalPlan.testing` — estratégia de testes não é conteúdo de plano; vira playbook.
- `technicalPlan.deployment` — deploy é responsabilidade de CodeGen congelado (ADR-008).
- `uxPlan.pages` e `uxPlan.components` — sobrepõem `uxPlan.wireframes` (bloco `telas`).

**Se precisar**: `Project.legacyPlans` mantém o JSON completo por 30 dias — é possível extrair esses campos manualmente pra outro destino antes do drop.

## Como rodar

### Dev (local, banco de desenvolvimento)

```bash
# 1. Dry-run (não escreve nada, apenas loga o que faria)
npm run db:migrate:plans-to-blocks -- --dry-run

# 2. Migra apenas um projeto específico (útil para validar)
npm run db:migrate:plans-to-blocks -- --project-id=cm1abc123

# 3. Roda tudo
npm run db:migrate:plans-to-blocks
```

O script usa o `DATABASE_URL` configurado em `.env.local`.

### Produção

1. **Snapshot do banco** antes de rodar (responsabilidade do operador).
2. **Dry-run primeiro:** `npm run db:migrate:plans-to-blocks -- --dry-run` e validar logs.
3. **Escolher um projeto piloto:** rodar `--project-id=<id>` e validar manualmente:
   ```sql
   SELECT id, "legacyPlans" IS NOT NULL AS migrated FROM projects WHERE id = '<id>';
   SELECT plan_type, block_id, "order", status FROM plan_blocks WHERE project_id = '<id>' ORDER BY plan_type, "order";
   ```
4. **Rodar migração global** em janela de baixo tráfego.
5. **Validar contagem:** número de projetos migrados deve bater com o esperado.
6. **Smoke test na UI:** abrir um projeto migrado e confirmar que os planos renderizam (TRC-18).

## Plano de rollback

O JSON original está preservado em `Project.legacyPlans`. Para reverter:

### Opção A — Rollback por projeto (simples)

1. Deletar os blocos do projeto:
   ```sql
   DELETE FROM plan_blocks WHERE project_id = '<id>';
   ```
2. Restaurar os campos JSON originais a partir de `legacyPlans`:
   ```sql
   UPDATE projects SET
     "businessPlan" = "legacyPlans"->'businessPlan',
     "technicalPlan" = "legacyPlans"->'technicalPlan',
     "uxPlan" = "legacyPlans"->'uxPlan',
     "legacyPlans" = NULL
   WHERE id = '<id>';
   ```

### Opção B — Rollback global (se um bug for detectado logo após rodar)

Repetir a Opção A numa tabela inteira:

```sql
DELETE FROM plan_blocks
WHERE project_id IN (SELECT id FROM projects WHERE "legacyPlans" IS NOT NULL);

UPDATE projects SET
  "businessPlan" = "legacyPlans"->'businessPlan',
  "technicalPlan" = "legacyPlans"->'technicalPlan',
  "uxPlan" = "legacyPlans"->'uxPlan',
  "legacyPlans" = NULL
WHERE "legacyPlans" IS NOT NULL;
```

> **Nota:** os campos legados `businessPlan/technicalPlan/uxPlan` **não são apagados** por esta migração. Continuam com o valor original no DB durante toda a janela de retenção (ver abaixo), o que torna o rollback trivial. O `legacyPlans` é um backup redundante que só é removido no PR que deleta as colunas.

## Janela de retenção

`Project.legacyPlans` deve permanecer no schema por **30 dias** após a migração em produção. Durante esse período:

- O rollback é imediato (SQL acima).
- Nenhum código da aplicação lê `legacyPlans`.

Após 30 dias sem incidentes:

1. Abrir PR separado que remove `legacyPlans`, `businessPlan`, `technicalPlan`, `uxPlan` do schema (com migration Prisma).
2. Atualizar este documento com a data de remoção.

Esta separação segue TBD: a migração de dados e a remoção das colunas são PRs independentes, permitindo rollback sem revert de código.

## O que **não** está no escopo deste PR

- Deletar colunas legadas `Project.businessPlan/technicalPlan/uxPlan` — ver "Janela de retenção".
- UI consumindo `PlanBlock` — TRC-18.
- Seed da persona Maria — TRC-14.7 (depende desta migração).

## Testes

- `prisma/migrations/scripts/migrate-plans-to-blocks.test.ts` — testes de integração contra o DB configurado em `DATABASE_URL`.
- A suite skipa graciosamente se o DB não estiver acessível, seguindo o padrão de `prisma/schema.test.ts`.
- Cobertura: 3 planos completos → 14 blocos; plano único; idempotência (2 runs); dry-run não persiste; projeto sem planos; dado malformado vai para fallback; filtro global ignora já migrados.
