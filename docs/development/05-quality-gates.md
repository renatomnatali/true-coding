# Quality Gates

## 1. Objetivo
Garantir que cada iteração só avance para release quando o escopo estiver validado por build, testes e políticas mínimas de qualidade.

## 2. Ordem e Dependência
Ordem fixa de gates:
1. `BUILD`
2. `UNIT`
3. `BDD`
4. `REVIEW`
5. `SECURITY`

Dependências:
- se `BUILD` falhar, `UNIT` e `BDD` são marcados como pulados por dependência.
- se `UNIT` falhar, `BDD` é marcado como pulado por dependência.

## 3. Comandos Permitidos (allowlist)
- Install: `npm install --no-fund --no-audit`
- Build: `npm run build`
- Unit: `npm run test`
- BDD: `npx vitest run tests/e2e/steps`

Qualquer comando fora da allowlist é bloqueado.

## 4. Flags de Execução
- `AUTONOMOUS_DEV_EXECUTE_GATES=true`: executa gates de verdade.
- `AUTONOMOUS_DEV_EXECUTE_GATES=false`: retorna falha controlada em `BUILD/UNIT/BDD` com motivo `execution_disabled`.

## 5. Sincronização de Workspace Antes dos Gates
Antes de rodar gates, o sistema faz correções de compatibilidade no sandbox quando necessário, por exemplo:
- dependência `@testing-library/jest-dom` ausente
- `layout.tsx` importando `next/document`

## 6. Persistência de Resultado
Cada gate gera/atualiza `QualityGateRun` com:
- `gateType`
- `passed`
- `durationMs`
- `logsRef`
- `report`

Também gera evento `QUALITY_GATE` na timeline.

## 7. Política de Tentativas
- Máximo de 3 tentativas por iteração.
- Ao estourar tentativas, run vai para `WAITING_CHECKPOINT`.
- Com `AUTONOMOUS_DEV_BABY_STEPS=true`, pode pausar antes do limite para checkpoint manual.

## 8. Definição de Passagem para Release
Release só inicia quando todos gates estão aprovados para a iteração atual.
