# Trunk-Based Development (TBD)

Guia de praticas de desenvolvimento para este projeto.

## Por que TBD?

- **Integração contínua real**: Conflitos resolvidos cedo, não acumulados
- **Deploy mais rápido**: Sempre pronto para produção
- **Menos overhead**: Sem gestão de múltiplas branches de longa duração
- **Feedback rápido**: Mudanças pequenas = reviews rápidos

## Workflow Diário

### 1. Começar uma tarefa

```bash
# Sempre começar do main atualizado
git checkout main
git pull origin main

# Criar branch curta
git checkout -b feat/nome-da-feature
```

### 2. Commits frequentes

```bash
# Commits pequenos e frequentes
git add .
git commit -m "feat(api): adiciona validacao de CNPJ"

# Mantenha sincronizado com main
git fetch origin main
git rebase origin/main
```

### 3. Abrir PR cedo

Abra o PR assim que tiver algo funcional, mesmo que incompleto:

```bash
git push -u origin feat/nome-da-feature
gh pr create --title "feat(api): validacao de CNPJ" --body "WIP - falta testes"
```

### 4. Merge rápido

- PR deve ser revisado em < 24h
- Use **squash merge** para manter histórico limpo
- Delete a branch após merge

## Convenções de Commit

```
tipo(escopo): descrição curta

[corpo opcional - explica o "porquê"]

[footer opcional - refs, breaking changes]
```

### Tipos

| Tipo | Uso |
|------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Mudança de código sem alterar comportamento |
| `test` | Adição/modificação de testes |
| `docs` | Documentação |
| `chore` | Tarefas técnicas (deps, configs) |
| `style` | Formatação (não afeta lógica) |
| `perf` | Melhoria de performance |
| `ci` | Mudanças em CI/CD |

### Exemplos

```
feat(calculo): implementa apuracao ICMS-ST

Adiciona logica de calculo do ICMS por substituicao tributaria
conforme legislacao do estado de SP.

Refs: #123
```

```
fix(web): corrige mascara de CNPJ no formulario

O campo estava aceitando mais de 14 digitos.
```

## Feature Flags

Para features que levam mais de 2 dias, use feature flags:

```typescript
// config/features.ts
export const FEATURES = {
  NEW_FEATURE: process.env.FEATURE_NEW === 'true',
};

// uso
if (FEATURES.NEW_FEATURE) {
  return newImplementation.process(data);
}
return legacyImplementation.process(data);
```

### Ciclo de vida

1. **Criar flag** desabilitada
2. **Deploy código** com flag off
3. **Habilitar em staging** para testes
4. **Rollout gradual** em produção (10% → 50% → 100%)
5. **Remover flag** após estabilizar

## Proteção de Branch

A branch `main` tem as seguintes proteções (configure no GitHub):

- [x] Require pull request before merging
- [x] Require status checks (CI deve passar)
- [x] Require conversation resolution
- [ ] ~~Require approvals~~ (opcional para times pequenos)
- [x] Do not allow bypassing the above settings

## CI/CD

Todo PR aciona automaticamente:

1. **Lint**: Verifica estilo de código
2. **Build**: Garante que compila
3. **Test**: Roda suite de testes
4. **PR Checks**: Valida tamanho e formato de commits

## Anti-patterns a Evitar

| Anti-pattern | Por que evitar |
|--------------|----------------|
| Branches > 3 dias | Acumula conflitos, dificulta review |
| PRs > 500 linhas | Impossível revisar com qualidade |
| Merge commits | Polui histórico, dificulta bisect |
| Branch `develop` | Camada desnecessária, atrasa deploy |
| Release branches | Use tags e feature flags |
| Hotfix branches | Corrija no trunk, deploy imediato |

## Referências

- [trunkbaseddevelopment.com](https://trunkbaseddevelopment.com/)
- [Google Engineering Practices](https://google.github.io/eng-practices/)
