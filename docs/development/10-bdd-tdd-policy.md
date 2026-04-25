# Política Obrigatória de BDD/TDD

## 1. Ordem Obrigatória (sem exceção)
1. Mockup/Jornada
2. Gherkin
3. Testes (RED)
4. Código
5. Testes (GREEN)

Qualquer mudança de comportamento deve seguir essa ordem.

## 2. Gherkin é Fonte de Verdade
- Antes de codar, leia o `.feature` correspondente em `docs/specifications/`.
- Se comportamento mudou, atualize Gherkin primeiro.
- Código e testes devem refletir o Gherkin atualizado.

## 3. Definição de RED
RED válido quando:
- teste novo foi escrito para o escopo da iteração.
- o teste falha antes da implementação do `CodeAgent`.

## 4. Definição de GREEN
GREEN válido quando:
- `BUILD` passa
- `UNIT` passa
- `BDD` passa
- revisão e segurança passam

## 5. Critérios para Merge da Iteração
A iteração só pode seguir para merge quando:
- fluxo BDD/TDD foi seguido
- gates aprovados
- release real fez commit/push/PR/merge
- timeline e banco estão consistentes

## 6. Checklist de PR (fase desenvolvimento)
- [ ] mockup/jornada atualizados quando houve mudança de UX
- [ ] Gherkin atualizado
- [ ] testes cobrindo cenários de sucesso e erro
- [ ] implementação limitada ao escopo da iteração
- [ ] gates passando
- [ ] evidência de release real no GitHub

## 7. Anti-padrões Proibidos
- codar antes de atualizar Gherkin/testes
- executar "go horse" sem RED/GREEN verificável
- mostrar progresso visual sem persistência real no backend
- ignorar cenários de erro e checkpoint
- reabrir run automaticamente sem confirmação explícita do usuário

## 8. Aplicação na Operação Diária
Para cada bug de jornada/status:
1. reproduzir
2. formalizar cenário em Gherkin
3. escrever teste de regressão (falhando)
4. corrigir código
5. validar teste + gates
