# Release Real com `git CLI`

## 1. Objetivo
Garantir que a iteração gere commit real no repositório remoto, com PR e merge confiáveis, sem depender da Git Data API para criar árvore/commit.

## 2. Componentes
- Pipeline local: `src/lib/development/git-release-cli.ts`
- Orquestração GitHub (repo/PR/merge): `src/lib/development/gitops.ts`
- Cliente GitHub: `src/lib/github/client.ts`

## 3. Passo a Passo do Release
### 3.1 Pré-release
`executeIterationGitRelease`:
- carrega owner/repo/token do projeto
- resolve `baseBranch` (default branch)
- monta artefatos da iteração (Gherkin + arquivos do workspace)

### 3.2 Release via `git CLI`
`executeGitCliRelease` executa:
1. `clone` da branch base
2. `checkout` da branch da iteração (`-B`, com reuso se já existir)
3. `write` dos artefatos
4. `commit` (`git add`, `git status`, `git commit` se houver mudança)
5. `push` para `origin/<branch>`
6. coleta `commitSha` com `rev-parse HEAD`

Cada etapa gera checkpoint estruturado (`phase=release`, `step`, `summary`, `durationMs`).

### 3.3 PR e Merge
Após push:
- busca PR aberto por `head=<owner>:<branch>` e `base=<default_branch>`.
- se já existir, reusa.
- se não existir, cria PR.
- faz merge squash.

## 4. Segurança e Sigilo
- autenticação com `GIT_ASKPASS` temporário
- `GIT_TERMINAL_PROMPT=0`
- token nunca entra em commit
- logs passam por máscara de segredo (`maskSecretInText`)
- paths dos artefatos são sanitizados (sem path traversal)

## 5. Falhas e Classificação
Falhas de release são lançadas como `GitCliReleaseError` com:
- `phase=release`
- `step` (`clone|checkout|write|commit|push`)
- `summary`
- `details` sanitizado

No orquestrador, falha de release:
- marca iteração como `FAILED`
- pausa run em `WAITING_CHECKPOINT`
- registra `errorSummary` com `phase` e `step`
- emite eventos `ERROR` e `RUN_STATUS` para ação do usuário

## 6. Garantias de Aceite
Uma iteração aprovada por gates só é considerada concluída após:
- commit real em branch
- PR criado/reusado
- merge em `main`
