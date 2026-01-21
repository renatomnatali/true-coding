# CLAUDE.md

Instrucoes para o Claude Code neste projeto.

## Projeto

Este e um projeto TypeScript/Node.js que segue Trunk-Based Development.

## Comandos

```bash
npm test          # Roda testes (vitest)
npm run test:watch  # Testes em modo watch
npm run lint      # Verifica estilo de codigo
```

## Workflow

1. **Sempre rode `npm test` antes de commits**
2. Use convencao de commits: `tipo(escopo): descricao`
3. PRs pequenos (< 400 linhas)
4. Branches curtas (max 2 dias)

Leia `docs/trunk-based-development.md` para detalhes completos.

## Agentes

- `@Code-Reviewer` - Review de PRs seguindo TBD
- `@Coder-TypeScript` - Desenvolvimento de codigo TypeScript

## Estrutura

```
src/           # Codigo fonte
tests/         # Testes
docs/          # Documentacao
.github/       # CI/CD workflows
.claude/       # Configuracao Claude Code
```
