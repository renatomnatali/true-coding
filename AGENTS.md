# AGENTS.md

Instruções para agentes de desenvolvimento neste repositório.

## Fonte oficial

Este arquivo replica e operacionaliza as regras do `CLAUDE.md`.

## Projeto

**True Coding** - Plataforma SaaS para criar aplicações web profissionais a partir de linguagem natural.

Stack: Next.js 15, React 19, TypeScript, Tailwind, Prisma, Clerk, Claude API.

## Comandos

```bash
npm run dev
npm run build
npm run lint
npm test
npm run test:watch
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:studio
```

## Workflow obrigatório

1. Rodar `npm test` e `npm run lint` antes de finalizar a tarefa.
2. Manter PRs pequenos (< 400 linhas) e branches curtas.
3. Seguir trunk-based development.
4. Sempre que `prisma/schema.prisma` for alterado, aplicar schema no banco alvo (`prisma db push` ou migration) antes de finalizar.
5. Se a mudança toca desenvolvimento autônomo, executar preflight de schema (consulta em `developmentRun`/`iterationRun`) antes de validar UI/API.

## Gate obrigatório de schema (CI e release)

1. O workflow deve manter o job `db-schema-smoke` como gate obrigatório antes de `test`, `lint` e `build`.
2. Esse gate deve rodar com Postgres efêmero, aplicar `prisma db push` e validar leitura das tabelas de desenvolvimento autônomo.
3. Nenhuma feature de desenvolvimento autônomo deve ser considerada pronta sem esse gate verde.

## Ordem obrigatória BDD/TDD (sem exceção)

1. Atualizar mockups/fluxo de jornada para refletir o comportamento desejado (incluindo sucesso e falhas).
2. Atualizar o Gherkin (`docs/specifications/*.feature`) como fonte de verdade da jornada.
3. Escrever/atualizar testes que validam cada assertiva do Gherkin (falhando primeiro quando aplicável).
4. Implementar ou alterar o código para fazer os testes passarem.
5. Executar regressão (`npm test`) e lint (`npm run lint`).

## Regras de qualidade (replicadas de `CLAUDE.md`)

1. Gherkin é a fonte de verdade para comportamento.
2. Não aplicar sugestão de review cegamente; validar contra Gherkin e intenção do usuário.
3. Testes devem cobrir as assertions de comportamento (não apenas “não crashou”).
4. Todo texto visível ao usuário deve estar em português brasileiro com acentuação correta.
5. Uma tarefa por vez, evitando troca de contexto desnecessária.

## Padrões de UX para status e progresso

1. Seguir heurísticas de Nielsen para visibilidade do estado do sistema: status sempre inequívoco e rastreável.
2. Evitar mensagens contraditórias na mesma tela (ex.: “concluído” e itens “running” sem contexto).
3. Não existe modo simulado para pipeline autônomo: execução é sempre execução real; se bloqueada por ambiente/feature flag, o estado deve ser erro explícito e acionável.
4. Datas/horários inválidos nunca devem aparecer ao usuário; usar fallback legível (`—`).
5. Timeline de execução deve priorizar o último estado por tarefa para reduzir ruído cognitivo.
