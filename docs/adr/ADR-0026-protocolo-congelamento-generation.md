# ADR-0026 — Protocolo de congelamento da pipeline de Generation

**Status:** Aceito
**Data:** 2026-04-24
**Referências no código:** `src/lib/development/*`, `src/lib/codegen/*`, `src/lib/ai/prompts/codegen.ts`, `docs/v2-roadmap/generation-pipeline.md`
**Notion mirror:** TRC-ADR-026

> **Y-Statement:** No contexto do pivô Spec-as-a-Service (TRC-ADR-008), diante de ≈1.000 linhas de código de Generation + ≈200 testes que deixaram de ser caminho crítico mas mantêm valor estratégico, decidimos adotar um protocolo de congelamento documentário em vez de deletar o código ou deixá-lo vivo sem manutenção, para preservar a opção de retomada via MCP delegation a custo baixo, aceitando o custo de manter testes rodando na CI e uma política de preservação de imports.

---

## Contexto

A [ADR-0008](ADR-0008-stack-unica-mvp.md) definiu a stack única Next.js/TypeScript para o MVP v2, que incluía geração autônoma de código. Em 14/04/2026, TRC-ADR-008 (no Notion) pivotou o produto para **Spec-as-a-Service**: TC passa a **exportar** um bundle de especificação para o usuário consumir no seu próprio ambiente (via MCP delegation, por exemplo), em vez de gerar e entregar a aplicação executando em nome do usuário.

Esse pivô foi motivado por:

1. Complexidade de responsabilidade legal (LGPD, tratamento de dados de terceiros) ao executar código em nome do usuário.
2. Custo operacional de manter integrações Netlify/GitHub estáveis.
3. Avaliação de que MCP delegation cobre o "último quilômetro" sem TC precisar operar o runtime.

O pivô, porém, não formalizou **como preservar** o código de Generation. Sem protocolo explícito:

- A suíte de testes vira ruído ("por que isso está no CI se não vai para produção?").
- Refactors vizinhos quebram imports da pipeline sem quem cobre o contrato.
- A documentação desalinha em 2–3 meses e o conhecimento se perde.
- Deletar o código destruiria ≈1.200 linhas de trabalho testado.

A pergunta deste ADR: qual é a política de sustentação mínima que mantém a pipeline como **opção real de retomada** sem torná-la caminho crítico do roadmap atual?

---

## Decisão

Adotar um **protocolo de congelamento documentário** com quatro pilares.

### Pilar 1 — Flag `ENABLE_CODE_GENERATION` como kill-switch

- Default `false` em produção.
- `true` em ambientes de desenvolvimento e teste (para manter a CI e o DX atuais funcionais).
- Implementação concreta da flag é escopo de **TRC-05.1** (este ADR apenas formaliza a decisão).
- Quando `false`, rotas em `src/app/api/projects/[id]/development/*` e `connect/*` retornam `501 Not Implemented` ou equivalente documentado na TRC-05.1.

### Pilar 2 — Suite de testes de Generation permanece na CI

- Todos os testes listados em `docs/v2-roadmap/generation-pipeline.md` (seção "Suites de teste relevantes") continuam executando em `npm test`.
- **SLO:** 100% verde mesmo com a flag desativada em runtime.
- Justificativa: testes são o contrato vivo que garante que o código ainda **compila e se comporta** depois de meses sem uso. Sem isso, retomar custa reescrever.

### Pilar 3 — Política de preservação de imports

- Refactors em módulos compartilhados (`src/lib/ai/`, `src/lib/db/`, `src/types/`) **NÃO podem** quebrar imports usados por `src/lib/development/*`, `src/lib/codegen/*` ou prompts de codegen, sem atualizar esses módulos no mesmo PR.
- Se uma mudança exige quebrar a pipeline congelada, o PR deve documentar no corpo: (a) o motivo, (b) se a pipeline foi atualizada para compilar novamente, (c) se os testes continuam verdes.
- Code-Reviewer deve sinalizar como blocker qualquer PR que deixe a suite de Generation vermelha sem justificativa explícita.

### Pilar 4 — Gatilhos de descongelamento explícitos

A pipeline é reativada **somente** quando pelo menos dois destes forem verdadeiros:

1. **Base legal LGPD resolvida** para TC operar código em nome do usuário (definido em TRC-ADR-008 no Notion).
2. **Sinal de mercado** de que MCP delegation não cobre um nicho relevante validado em descoberta com usuários.
3. **Decisão de produto** de oferecer Generation como feature premium paga, com SLA dedicado.

O descongelamento exige um novo ADR que referencie este e declare o gatilho acionado.

---

## Alternativas consideradas

### A) Deletar a pipeline de Generation

- **Prós:** reduz superfície de manutenção; sem ambiguidade sobre o que é produto ativo.
- **Contras:** destrói ≈1.200 linhas de trabalho testado; recriar custaria semanas de engenharia; elimina a opção de retomada rápida.
- **Por que não:** o custo de manter (CI verde + política de preservação) é marginal; o custo de recriar é alto e concreto.

### B) Deixar o código vivo sem política explícita

- **Prós:** zero trabalho imediato.
- **Contras:** em 2–3 meses a pipeline apodrece — CI vermelho sem contexto, imports quebrados por refactors vizinhos, documentação desalinhada. Retomar exigiria quase tanto trabalho quanto recriar.
- **Por que não:** é o pior caso — paga o custo de carregar o código e perde o valor de preservá-lo.

### C) Congelamento documentário (escolhida)

- **Prós:** preserva o valor estratégico a custo baixo; deixa claro para quem lê o repo "o que é produto" vs. "o que é opção futura"; cria trilho de auditoria para a decisão de retomada.
- **Contras:** custo recorrente de manter a suite verde e revisar imports em refactors vizinhos.
- **Por que sim:** o custo é linear e pequeno; o benefício é manter uma aposta estratégica viva.

---

## Consequências

- **Positivas:**
  - A opção de retomar Generation via MCP delegation fica real, com custo de descongelamento estimado em dias, não em semanas.
  - O repositório comunica intenção explícita ao leitor novo.
  - CI continua atuando como seguro contra regressões silenciosas.

- **Negativas:**
  - Cada PR que mexe em `src/lib/ai/` ou módulos compartilhados paga um pequeno imposto de verificação.
  - A suíte de testes de Generation aumenta o tempo de CI mesmo sem executar a feature em produção (medido em 2026-04-24: ≈3,3s para 155 testes — desprezível).

- **Mitigação:**
  - Doc de overview em `docs/v2-roadmap/generation-pipeline.md` como ponto único de onboarding.
  - Regra 7 (story-goals-antigoals) aplicada a este épico como exemplo de tech-only justificado.

---

## Revisão

Revisar esta ADR no próximo ciclo de planejamento após:

- Qualquer um dos gatilhos do Pilar 4 acionar.
- Ou 6 meses sem acionamento, para decidir se o congelamento continua justificado ou se a opção virou dívida morta.

---

## Referências

- [ADR-0008 Stack Única MVP](ADR-0008-stack-unica-mvp.md)
- [ADR-0007 Execução In-Process](ADR-0007-in-process-pipeline-execution.md)
- [ADR-0006 Extração de JSON](ADR-0006-planning-json-extraction.md)
- [docs/v2-roadmap/generation-pipeline.md](../v2-roadmap/generation-pipeline.md)
- TRC-ADR-008 (Notion) — pivô Spec-as-a-Service.
- TRC-07 — épico pai; TRC-05.1 — implementação da flag.
