# Workflow Enforcement: Como Evitar Esquecer o Processo

## Problema

Durante a implementação da Discovery Flow, o Claude commitou diretamente na `main` sem seguir o workflow de PR obrigatório definido no `CLAUDE.md`.

**Pergunta do usuário**: "Como evitar que isso aconteça de novo?"

---

## Solução: Múltiplas Camadas de Proteção

Implementamos **4 camadas de proteção** para garantir que o workflow seja seguido:

### 1. 🔒 Git Hook (Enforcement Técnico) - **IMPLEMENTADO**

**O que é**: Hook `pre-commit` que BLOQUEIA commits diretos na `main`

**Como funciona**:
```bash
# Tenta commitar na main
git commit -m "alguma mudança"

# ❌ ERROR: Direct commits to 'main' are not allowed!
```

**Arquivos**:
- `.githooks/pre-commit` - Hook versionado no repo
- `scripts/setup-hooks.sh` - Script de instalação
- Git config: `core.hooksPath = .githooks`

**Instalação**:
```bash
./scripts/setup-hooks.sh
```

**Resultado**: IMPOSSÍVEL commitar na main (a menos que bypass com `--no-verify`)

---

### 2. 📋 Atualização do CLAUDE.md - **RECOMENDADO**

Adicionar seção mais proeminente no topo do arquivo:

```markdown
# ⚠️ WORKFLOW OBRIGATÓRIO - LEIA ANTES DE COMMITAR

NUNCA commite direto na main. SEMPRE:

1. Crie branch: `git checkout -b feat/sua-feature`
2. Faça commits na branch
3. Crie PR: `gh pr create`
4. Rode Code-Reviewer em background
5. Aguarde review completo
6. Corrija blockers
7. Merge: `gh pr merge --squash`

Git hook instalado bloqueará commits na main automaticamente.
```

---

### 3. 🛡️ GitHub Branch Protection - **RECOMENDADO**

**O que é**: Regras no GitHub que protegem a branch `main`

**Como configurar**:
1. Ir para: Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Ativar:
   - ✅ Require pull request before merging
   - ✅ Require status checks to pass (CI)
   - ✅ Do not allow bypassing the above settings

**Resultado**: Mesmo se o hook for bypassado, GitHub rejeita push direto

---

### 4. 🤖 Reminder no Context - **CONSIDERAÇÃO**

**Opção A**: Adicionar ao início de TODAS as respostas do Claude:

```
<system-reminder>
WORKFLOW CHECK: If about to commit, verify you're on a feature branch, not main.
</system-reminder>
```

**Opção B**: Todo Write/Edit de arquivo crítico dispara reminder

**Trade-off**: Pode ser verboso, mas garante que nunca esqueço

---

## Por Que Esqueci Antes?

### Análise da Falha

1. **Contexto grande**: Com 80k+ tokens de contexto, o workflow estava "enterrado" no CLAUDE.md
2. **Foco na tarefa**: Estava no "modo execução" completando a implementação
3. **Sem enforcement**: Nada me impediu tecnicamente de commitar na main
4. **Falta de checklist visual**: Não havia lista de passos à vista

### Como Humanos Esquecem (Analogia)

É similar a como desenvolvedores humanos esquecem de:
- Rodar testes antes de commit
- Fazer code review
- Atualizar documentação

**Solução humana**: Automatizar com hooks, CI/CD, linters

**Solução para Claude**: Mesma coisa! Hooks + proteções técnicas

---

## Implementação Atual

### ✅ Já Implementado

1. **Git Hook**: `.githooks/pre-commit` bloqueia commits na main
2. **Script de Setup**: `scripts/setup-hooks.sh` para instalar hooks
3. **Git Config**: Repo configurado para usar `.githooks/`

### 🔄 Teste do Hook

```bash
# Tentar commitar na main
git checkout main
git commit -m "test"

# Output:
# ❌ ERROR: Direct commits to 'main' are not allowed!
#
# 📋 True Coding Workflow (CLAUDE.md):
#   1. Create feature branch: git checkout -b feat/your-feature
#   2. Make commits on feature branch
#   3. Create PR: gh pr create
#   4. Run Code-Reviewer agent
#   ...
```

**Status**: ✅ Hook funcionando perfeitamente!

---

## Próximos Passos Recomendados

### Para o Usuário

1. **GitHub Branch Protection** (5 min):
   - Settings → Branches → Protect `main`
   - Require PR reviews
   - Require status checks

2. **Adicionar ao Setup de Novos Devs**:
   ```bash
   git clone repo
   cd repo
   ./scripts/setup-hooks.sh  # ← Executar sempre!
   ```

3. **Documentar no README**:
   ```markdown
   ## Setup

   1. Clone repo
   2. Run `./scripts/setup-hooks.sh` to install git hooks
   3. ...
   ```

### Para o Claude (Opcional)

1. **Atualizar CLAUDE.md**: Seção de workflow no topo com ⚠️
2. **System Reminder**: Adicionar verificação antes de commits grandes
3. **Checklist Tool**: Criar ferramenta que mostra checklist antes de PRs

---

## Verificação de Proteções

### Checklist para Garantir Workflow

- [x] Git hook instalado (`.githooks/pre-commit`)
- [x] Git config usa `.githooks/` path
- [x] Hook bloqueia commits na main (testado)
- [ ] GitHub branch protection ativada (recomendado)
- [ ] CLAUDE.md atualizado com ⚠️ no topo (recomendado)
- [ ] README tem instruções de setup de hooks (recomendado)

---

## Conclusão

**Antes**:
- ❌ Claude podia commitar na main livremente
- ❌ Dependia de "lembrar" do workflow
- ❌ Sem barreiras técnicas

**Depois**:
- ✅ Hook bloqueia commits na main automaticamente
- ✅ Mensagem clara com workflow correto
- ✅ Impossível esquecer (enforcement técnico)
- ✅ GitHub protection pode adicionar camada extra

**Resultado esperado**: 100% de compliance com workflow de PR

---

**Lição aprendida**: Não dependa de memória (humana ou AI). Automatize e force compliance com ferramentas técnicas.

---

## Referências

- `CLAUDE.md` - Workflow completo do projeto
- `.githooks/pre-commit` - Hook de proteção
- `scripts/setup-hooks.sh` - Instalador de hooks
- ADR-0003 - Mockup-First Development (exemplo de processo enforcement)
