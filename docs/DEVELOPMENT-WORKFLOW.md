# Workflow de Desenvolvimento - True Coding

> **Princípio:** Código profissional exige processo profissional.
> Este documento define o workflow obrigatório para todo desenvolvimento no True Coding.

---

## Visão Geral do Ciclo

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. ESPECIFICAÇÃO          2. DESENVOLVIMENTO      3. PR      │
│   ┌─────────────┐           ┌─────────────┐       ┌─────────┐  │
│   │ Mockup      │           │ TDD         │       │ Tests   │  │
│   │ Gherkin     │ ───────►  │ Red→Green   │ ────► │ Lint    │  │
│   │ States.md   │           │ →Refactor   │       │ Build   │  │
│   └─────────────┘           └─────────────┘       │ Review  │  │
│                                                   └─────────┘  │
│                                                        │       │
│                                                        ▼       │
│                                                   ┌─────────┐  │
│                                                   │ MERGE   │  │
│                                                   └─────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Fase de Especificação

Antes de escrever código, **toda feature deve ter**:

### 1.1 Mockup (Visual)

```
mockups/
└── [fase]/
    └── [tela].html
```

- HTML/CSS estático que define o visual esperado
- Inclui todos os estados (loading, error, success, empty)
- Serve como referência visual para implementação

### 1.2 Gherkin (Comportamento)

```
docs/specifications/
└── [feature].feature
```

- Cenários em formato Gherkin (português)
- Define comportamento esperado, não implementação
- Inclui happy path, edge cases, e restauração de estado

**Exemplo:**
```gherkin
@critical @restauracao
Cenário: Usuário reabre projeto com plano já gerado
  Dado que o projeto "Delivery App" tem status "PLANNING"
  E o projeto TEM businessPlan válido
  Quando o usuário abre a página do projeto
  Então o chat exibe mensagem "Plano gerado com sucesso!"
  E o chat NÃO exibe quick replies
```

### 1.3 Matriz de Estados (STATES.md)

```
docs/ux/
├── STATES.md      # Mapeamento: estado do banco → UI esperada
└── BEHAVIORS.md   # Regras de comportamento por componente
```

- Define a fonte da verdade (banco de dados)
- Mapeia cada combinação de estado para UI esperada
- Previne bugs de estado inconsistente

---

## 2. Fase de Desenvolvimento (TDD)

### 2.1 Red: Escrever teste que falha

```typescript
// tests/unit/chat-panel.test.ts
describe('ChatPanel', () => {
  it('deve mostrar "Plano pronto" quando businessPlan existe', () => {
    render(<ChatPanel initialPlanReady={true} />)
    expect(screen.getByText('Plano gerado com sucesso!')).toBeInTheDocument()
  })
})
```

### 2.2 Green: Implementar código mínimo

Escrever apenas o código necessário para o teste passar.

### 2.3 Refactor: Melhorar mantendo testes verdes

Refatorar código sem quebrar testes existentes.

---

## 3. Fase de PR

### 3.1 Checklist Obrigatório (automatizado via hooks)

```bash
# Executado automaticamente no pre-push
npm run lint        # Zero erros
npm run test        # Todos passando
npm run build       # Build sem erros
```

### 3.2 Criar PR

```bash
# Criar branch
git checkout -b feat/minha-feature

# Commits convencionais
git commit -m "feat(chat): implementar restauração de estado"

# Push (hooks rodam automaticamente)
git push -u origin feat/minha-feature

# Criar PR
gh pr create --title "feat(chat): restauração de estado" --body "..."
```

### 3.3 Code Review

O agente `@Code-Reviewer` analisa automaticamente:
- Aderência ao trunk-based development
- Tamanho do PR (< 400 linhas)
- Cobertura de testes
- Padrões de código

### 3.4 Merge

Somente após:
- [ ] Todos os testes passando
- [ ] Lint sem erros
- [ ] Build sem erros
- [ ] Code review aprovado
- [ ] Sem blockers do Code-Reviewer

---

## 4. Estrutura de Arquivos

```
true-coding/
├── docs/
│   ├── specifications/        # Gherkin features
│   │   ├── discovery.feature
│   │   ├── planning.feature
│   │   └── ...
│   ├── ux/
│   │   ├── STATES.md          # Matriz de estados
│   │   └── BEHAVIORS.md       # Regras de comportamento
│   └── DEVELOPMENT-WORKFLOW.md # Este arquivo
├── mockups/
│   └── project/
│       ├── phase-1-ideation/
│       ├── phase-2-planning/
│       └── ...
├── tests/
│   ├── unit/                  # Testes unitários (vitest)
│   ├── integration/           # Testes de integração
│   └── e2e/                   # Testes E2E (futuro)
│       └── steps/             # Step definitions Gherkin
└── src/
    └── ...
```

---

## 5. Convenções

### 5.1 Commits

Formato: `tipo(escopo): descrição`

| Tipo | Uso |
|------|-----|
| feat | Nova funcionalidade |
| fix | Correção de bug |
| docs | Documentação |
| test | Testes |
| refactor | Refatoração |
| chore | Manutenção |

### 5.2 Branches

- `main` - Produção (protegida)
- `feat/nome` - Features
- `fix/nome` - Correções
- `docs/nome` - Documentação

### 5.3 PRs

- Título claro e conciso
- Descrição com contexto
- Tamanho máximo: 400 linhas
- Duração máxima: 2 dias

---

## 6. Ferramentas

| Ferramenta | Propósito | Comando |
|------------|-----------|---------|
| Vitest | Testes unitários | `npm test` |
| ESLint | Linting | `npm run lint` |
| Husky | Git hooks | Automático |
| gh CLI | PRs | `gh pr create` |

---

## 7. Checklist de Nova Feature

- [ ] Mockup HTML/CSS criado
- [ ] Cenários Gherkin escritos
- [ ] STATES.md atualizado (se aplicável)
- [ ] Testes escritos (TDD)
- [ ] Código implementado
- [ ] Lint passando
- [ ] Testes passando
- [ ] Build passando
- [ ] PR criado
- [ ] Code review aprovado

---

## 8. Referências

- [Gherkin Syntax](https://cucumber.io/docs/gherkin/reference/)
- [Trunk-Based Development](./trunk-based-development.md)
- [Especificação Discovery](./specifications/discovery.feature)
- [Matriz de Estados](./ux/STATES.md)
