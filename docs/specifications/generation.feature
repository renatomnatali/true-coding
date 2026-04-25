# language: pt
# encoding: utf-8

@generation @fase-4
Funcionalidade: Fase de Geracao de Codigo
  Como usuario do True Coding
  Eu quero que a plataforma gere e versione o codigo com feedback real
  Para que eu acompanhe a execucao sem mensagens enganosas

  Contexto:
    Dado que estou logado no sistema
    E tenho um projeto com status "GENERATING"
    E o projeto possui plano tecnico aprovado

  @repo @reuse
  Cenário: Reutilizar repositorio ja conectado
    Dado que o projeto ja tem githubRepoUrl, githubRepoOwner e githubRepoName
    Quando a API POST /api/generate inicia o commit dos arquivos
    Então o sistema NAO cria um novo repositorio
    E o sistema cria commit no repositorio existente

  @erro @commit
  Cenário: Falha de commit marca projeto como FAILED
    Dado que a geracao de arquivos foi concluida
    E o commit no GitHub falha
    Quando a API POST /api/generate trata a excecao
    Então o sistema emite evento SSE do tipo "error"
    E atualiza o status do projeto para "FAILED"

  @erro @stream
  Cenário: Evento SSE fragmentado ainda exibe erro no workspace
    Dado que a API de geração envia evento "error" em múltiplos chunks SSE
    Quando o cliente processa o stream de geração
    Então o workspace mostra o erro completo
    E não marca a geração como concluída

  @ui @erro
  Cenário: Workspace em FAILED mostra retry manual (modo nao autonomo)
    Dado que o projeto esta com status "FAILED"
    E a feature AUTONOMOUS_DEVELOPMENT_V1 esta desativada
    Quando abro o workspace
    Então vejo o estado "Pronto para gerar"
    E vejo o botao "Iniciar geracao"
    E posso clicar em "Tentar novamente" quando houver erro

  @ui @resume
  Cenário: Reabrir projeto em GENERATING exige confirmação para retomar
    Dado que o projeto está com status "GENERATING"
    E não existe run ativa no momento
    Quando o usuário reabre a página do projeto
    Então o sistema NÃO inicia geração automaticamente
    E exibe confirmação para "Retomar operação" ou "Agora não"
    E só inicia a operação após confirmação explícita do usuário

  @ui @resume @stale
  Cenário: Run ativa sem worker exige retomada manual explícita
    Dado que o projeto está com status "GENERATING"
    E existe uma run ativa com status "RUNNING"
    E a run está sem worker ativo (stale)
    Quando o usuário reabre a página do projeto
    Então o sistema não retoma a execução automaticamente
    E exibe estado "Aguardando confirmação"
    E exibe o diagnóstico de execução pendente com última atividade
    E exibe botão "Retomar execução"
    Quando o usuário clica em "Retomar execução"
    Então o cliente chama POST /api/projects/:id/development/runs/:runId/recover
    E a run volta para processamento real
    E a timeline passa a mostrar apenas os eventos da retomada manual

  @ui @resume @idempotencia
  Cenário: Retomar operação com run já ativa não gera erro de conflito
    Dado que o projeto está com status "GENERATING"
    E já existe uma run ativa para este projeto
    Quando o usuário clica em "Retomar operação"
    Então o sistema trata a retomada como sucesso
    E não exibe mensagem de erro "RUN_ALREADY_ACTIVE"
    E o monitoramento da run ativa continua normalmente

  @ui @resume @recover
  Cenário: Continuar execução valida recover antes de anexar stream
    Dado que o projeto está com status "GENERATING"
    E existe uma run ativa com status "RUNNING"
    Quando o usuário clica em "Continuar execução"
    Então o cliente chama POST /api/projects/:id/development/runs/:runId/recover
    E só depois anexa o stream de eventos da run

  @ui @resume @recover @race
  Cenário: Transição para checkpoint durante recover não deve bloquear usuário
    Dado que o projeto está com status "GENERATING"
    E existe uma run ativa com status "RUNNING"
    E antes da resposta do recover a run mudou para "WAITING_CHECKPOINT"
    Quando o usuário clica em "Continuar execução"
    Então o sistema não deve exibir erro técnico de endpoint de recover
    E deve atualizar o estado da run para "WAITING_CHECKPOINT"
    E deve exibir ações "Retomar checkpoint", "Tentar novamente iteração" e "Cancelar execução"

  @ux @consistencia
  Cenário: Aguardando confirmação não pode exibir animação de geração ativa
    Dado que o projeto está com status "GENERATING"
    E o estado da jornada está em "Aguardando confirmação"
    Quando o usuário visualiza o workspace
    Então o sistema exibe a tela de projeto pausado
    E NÃO exibe animação ou título "Gerando Código"

  @ux @consistencia @status-stale
  Cenário: Status GENERATING stale com run terminal não exige confirmação
    Dado que o projeto está com status "GENERATING"
    E a última run está em status terminal "CANCELED"
    Quando o usuário visualiza o painel de construção do projeto
    Então o sistema NÃO exibe "Aguardando confirmação"
    E exibe o botão "Iniciar nova run"
    E sincroniza o status macro do projeto para "FAILED"

  @assessment @integrado
  Cenário: Desenvolvimento usa plano de complexidade aprovado
    Dado que o usuário iniciou o desenvolvimento na tela de conexão
    E o sistema exibiu análise de complexidade e plano de iterações
    Quando o usuário confirma "Continuar para Desenvolvimento →"
    Então a execução usa o mesmo plano aprovado (sem recalcular iterações)

  @ux @transparencia
  Cenário: Painel de pipeline exibe execução com estado consistente
    Dado que a execução do pipeline autônomo está habilitada
    E existe uma run finalizada com status "SUCCEEDED"
    Quando o usuário visualiza o painel de construção do projeto
    Então o status exibido deve ser "Concluído"
    E não deve exibir rótulos ambíguos de modo de execução
    E o usuário não deve ver data inválida na timeline
    E cada agente deve aparecer com o último status conhecido, sem duplicidade conflitante

  @ux @run @reinicio
  Cenário: Run terminal permite iniciar nova execução sem usar console
    Dado que a última run do projeto está em status terminal ("CANCELED" ou "SUCCEEDED")
    Quando o usuário visualiza o painel de construção do projeto
    Então o sistema deve exibir o botão "Iniciar nova run"
    Quando o usuário clica em "Iniciar nova run"
    Então o cliente chama POST /api/projects/:id/development/runs com assessmentConfirmed=true
    E a nova run entra em "QUEUED" ou "RUNNING"

  @ux @checkpoint
  Cenário: Run em WAITING_CHECKPOINT exige ação explícita do usuário
    Dado que existe uma run ativa com status "WAITING_CHECKPOINT"
    E a iteração atual está marcada como falha após retries
    Quando o usuário visualiza o painel de construção do projeto
    Então o sistema deve exibir ações de recuperação
    E devo ver os botões "Retomar checkpoint", "Tentar novamente iteração" e "Cancelar execução"
    E ao clicar em "Tentar novamente iteração" o cliente chama POST /api/projects/:id/development/runs/:runId/retry
    E a timeline deve ocultar os eventos da tentativa anterior para evitar confusão
    E ao recarregar a página, a timeline continua exibindo apenas os eventos da tentativa atual

  @ux @checkpoint @retry
  Cenário: Retomar iteração esgotada reinicia tentativas e evita RUNNING fantasma
    Dado que a iteração atual já consumiu 3 tentativas
    E o usuário solicita retomar checkpoint ou retry da iteração
    Quando o orquestrador prepara a retomada da iteração
    Então o contador de tentativas deve voltar para 0 antes da nova execução
    E o pipeline deve reexecutar SpecAgent, TestAgent e CodeAgent
    E a run não pode permanecer em "RUNNING" sem novos eventos de agente

  @ux @checkpoint @pausa-antecipada
  Cenário: Modo de pausa antecipada envia para checkpoint no primeiro erro
    Dado que AUTONOMOUS_DEV_BABY_STEPS está habilitado
    E uma iteração falhou em pelo menos um quality gate
    Quando o orquestrador concluir a tentativa atual
    Então a run deve entrar em "WAITING_CHECKPOINT" sem consumir retries automáticos
    E a timeline deve registrar que a pausa ocorreu em modo de checkpoint antecipado
    E o resumo de erro deve apontar os gates falhos com causa raiz

  @observabilidade @diagnostico
  Cenário: Resumo de falha de gate deve mostrar causa raiz útil
    Dado que um gate falhou com log extenso
    Quando o orquestrador gerar o resumo de erro da iteração
    Então o resumo não deve priorizar linhas genéricas de comando (ex.: "npm run build")
    E deve priorizar mensagens de causa raiz (ex.: import ausente, erro de prerender)

  @observabilidade @diagnostico @quality-gate-event
  Cenário: Evento QUALITY_GATE preserva detalhes úteis para troubleshooting
    Dado que o gate BUILD falhou durante "npm run build"
    Quando o orquestrador persistir os quality gates
    Então o evento QUALITY_GATE deve incluir um "summary" com causa raiz útil
    E deve incluir o campo "reason" quando o report do gate informar esse motivo
    E deve incluir um trecho técnico do erro para diagnóstico detalhado
    E o summary não deve usar apenas banner de versão do framework

  @observabilidade @diagnostico @preflight
  Cenário: Sistema registra preflight de workspace antes de executar quality gates
    Dado que a iteração está prestes a iniciar os quality gates
    Quando o orquestrador disparar a fase de verificação
    Então deve existir evento INFO com phase "quality_gate_preflight"
    E o payload deve incluir o workspacePath
    E o payload deve informar se package.json está presente no sandbox

  @quality-gates @sequencial
  Cenário: Gates devem executar em sequência e parar no primeiro erro
    Dado que a iteração chegou na etapa de quality gates
    Quando o gate BUILD falhar
    Então os gates UNIT e BDD não devem ser executados
    E devem aparecer como "PULADO" por dependência do gate anterior
    E a run deve ficar em checkpoint com log do primeiro erro real

  @ux @checkpoint @timeline
  Cenário: Timeline deve descartar eventos antigos mesmo sem action explícita no run_status
    Dado que a tentativa anterior exibiu falhas na timeline
    E um novo evento RUN_STATUS com status "RUNNING" chegou após "WAITING_CHECKPOINT"
    E esse evento não possui campo "action" no payload
    Quando o usuário visualiza a timeline após retomar
    Então a timeline deve considerar esse RUN_STATUS como novo boundary de execução
    E deve exibir apenas eventos da tentativa atual

  @ux @chat-feed @realtime
  Cenário: Aba Execução exibe feedback verboso em tempo real no chat
    Dado que existe uma run ativa para o projeto
    E a barra de chat está visível
    Quando o usuário seleciona a aba "Execução"
    Então o sistema deve mostrar o status atual da run no topo
    E deve mostrar a linha "Agora" com a tarefa ou arquivo em processamento
    E deve atualizar a lista de eventos em até alguns segundos sem recarregar a página

  @ux @chat-feed @verbosity
  Cenário: Filtro Resumo/Técnico controla nível de detalhe do feed
    Dado que a aba "Execução" está aberta
    E existem eventos técnicos e eventos de alto nível da run
    Quando o usuário mantém o filtro em "Resumo"
    Então o sistema oculta ruído técnico de baixo valor
    E prioriza marcos de agente, gates e erros
    Quando o usuário alterna para "Técnico"
    Então o sistema exibe todos os eventos recebidos da run

  @ux @chat-feed @diagnostico
  Cenário: Falha de gate mostra motivo e trecho técnico no feed de execução
    Dado que existe um evento QUALITY_GATE com status de falha
    E o payload possui "reason" e "diagnosticSnippet"
    Quando o usuário visualiza a aba "Execução"
    Então o card do gate deve exibir o motivo da falha
    E deve exibir o trecho técnico para troubleshooting

  @infra @checkpoint @sandbox
  Cenário: Retry e resume devem usar sandbox limpo para evitar arquivos stale
    Dado que uma iteração falhou e deixou artefatos antigos no sandbox
    Quando o usuário executa retry ou resume da iteração
    Então o orquestrador remove o sandbox anterior da run
    E cria um novo sandbox para a próxima tentativa
    E os quality gates devem validar apenas artefatos da tentativa atual

  @api @consistencia
  Cenário: Listagem de runs não pode iniciar execução implícita
    Dado que existe run com status "QUEUED" ou "RUNNING"
    Quando o cliente chama GET /api/projects/:id/development/runs
    Então o endpoint apenas retorna dados e metadados da run
    E NÃO enfileira nem retoma execução automaticamente

  @release @gitops
  Cenário: Iteração aprovada cria commit e merge reais no GitHub
    Dado que a execução do pipeline está habilitada
    E o projeto possui repositório GitHub conectado
    Quando uma iteração passa em todos os quality gates
    Então o ReleaseAgent cria branch curta da iteração
    E cria commit real com artefatos da iteração
    E abre PR e faz squash merge na branch main

  @release @gitops @cli
  Cenário: Release usa pipeline git CLI para commit e push
    Dado que AUTONOMOUS_DEV_RELEASE_MODE está configurado como "git-cli"
    E a iteração está com status "GATED"
    Quando o ReleaseAgent iniciar o release da iteração
    Então o sistema executa checkpoints de release na ordem "clone", "checkout", "write", "commit", "push", "pr" e "merge"
    E o commit deve ser criado na branch da iteração
    E o merge deve atualizar a branch "main"

  @release @gitops @pr-reuse
  Cenário: Release reutiliza PR aberto da mesma branch
    Dado que já existe um PR aberto para head "<owner>:<branch>" e base "<default_branch>"
    Quando o ReleaseAgent executar a etapa de PR
    Então o sistema reutiliza o PR existente
    E não tenta abrir PR duplicado
    E continua para etapa de merge automático

  @release @checkpoint
  Cenário: Falha no release entra em WAITING_CHECKPOINT com diagnóstico de etapa
    Dado que a iteração está com status "GATED"
    E ocorre erro na etapa "push" do release
    Quando o orquestrador tratar a falha do ReleaseAgent
    Então a run deve ficar em "WAITING_CHECKPOINT"
    E o resumo do erro deve incluir "phase=release" e "step=push"
    E a UI deve exibir ações "Retomar checkpoint", "Tentar novamente iteração" e "Cancelar execução"

  @agents @runtime
  Cenário: Agentes de spec/test/code/review usam execução com contrato validado
    Dado que a execução do pipeline está habilitada
    E o runtime de agentes está habilitado para Claude
    Quando SpecAgent, TestAgent, CodeAgent e ReviewAgent forem executados
    Então cada agente deve retornar JSON válido no contrato esperado
    E o orquestrador deve persistir input e output de cada tarefa
    E artefatos inválidos devem bloquear avanço da iteração

  @agents @runtime @provider
  Cenário: Runtime de agentes usa o provedor de IA definido por flag
    Dado que a execução do pipeline está habilitada
    E a configuração `AI_PROVIDER` está definida para um provedor suportado
    Quando SpecAgent, TestAgent, CodeAgent e ReviewAgent forem executados
    Então o runtime deve usar o provedor configurado
    E a troca do provider não deve alterar o contrato de saída dos agentes

  @agents @runtime @pipeline-v2
  Cenário: CodeAgent usa geração file-by-file quando PIPELINE_V2 está ativo e o manifest é grande
    Dado que a execução do pipeline está habilitada
    E o runtime de agentes está habilitado para Claude
    E a feature flag "PIPELINE_V2" está ativa
    E o manifest da iteração possui totalEstimatedTokens maior ou igual a 4000
    Quando o CodeAgent for executado
    Então o sistema deve usar geração incremental file-by-file
    E o CodeAgent deve gerar apenas arquivos de implementação (sem arquivos de teste)
    E o resultado final deve manter o contrato "files[]", "commitMessage", "branchStrategy" e "appliedChanges"
    E o caminho single-shot não deve ser usado nessa execução

  @agents @runtime @pipeline-v2
  Cenário: TestAgent usa geração file-by-file para arquivos de teste quando PIPELINE_V2 está ativo
    Dado que a execução do pipeline está habilitada
    E o runtime de agentes está habilitado para Claude
    E a feature flag "PIPELINE_V2" está ativa
    Quando o TestAgent for executado
    Então o sistema deve usar geração incremental file-by-file para arquivos de teste
    E o caminho single-shot não deve ser usado nessa execução

  @agents @runtime @pipeline-v2 @fallback
  Cenário: CodeAgent mantém single-shot quando PIPELINE_V2 está ativo e o manifest é pequeno
    Dado que a execução do pipeline está habilitada
    E o runtime de agentes está habilitado para Claude
    E a feature flag "PIPELINE_V2" está ativa
    E o manifest da iteração possui totalEstimatedTokens menor que 4000
    Quando o CodeAgent for executado
    Então o sistema deve usar o caminho single-shot legado
    E o prompt do CodeAgent deve instruir explicitamente que arquivos de teste não devem ser gerados
    E o contrato de saída deve permanecer compatível com o orquestrador

  @agents @runtime @pipeline-v2 @filegen
  Cenário: FileGen faz retry em planning quando truncar em codegen
    Dado que a geração incremental file-by-file está ativa
    E um arquivo do manifest falha com "AGENT_RESPONSE_TRUNCATED" na fase "codegen"
    Quando o FileGen processar o mesmo arquivo
    Então o sistema deve registrar evento de retry por truncamento
    E deve repetir a geração na fase "planning"
    E deve continuar a iteração se o retry retornar JSON válido

  @agents @runtime @manifest
  Cenário: Manifest de páginas respeita technicalPlan.pages.path
    Dado que o technicalPlan da iteração contém páginas com path "/", "/dashboard" e "/settings/profile"
    Quando o manifest de arquivos for construído
    Então as páginas devem mapear para "src/app/page.tsx", "src/app/dashboard/page.tsx" e "src/app/settings/profile/page.tsx"
    E paths inválidos ou ausentes devem usar fallback pelo nome da página

  @agents @erro
  Cenário: Resposta inválida do agente entra em WAITING_CHECKPOINT com diagnóstico
    Dado que um agente retornou JSON inválido ou incompleto
    Quando o orquestrador tenta validar o contrato do agente
    Então a execução deve registrar erro com causa raiz do contrato
    E a run deve ir para "WAITING_CHECKPOINT"
    E a UI deve exibir ação explícita de retry/checkpoint

  @infra @fallback
  Cenário: Fallback de bootstrap evita run sem package.json
    Dado que o worker não conseguiu carregar templates base do projeto
    Quando o Orchestrator prepara o sandbox da run
    Então o sistema aplica arquivos mínimos de bootstrap
    E garante package.json no workspace antes dos quality gates

  @infra @quality-gates @workspace
  Cenário: Pré-sincronização do workspace corrige pré-requisitos de teste e layout inválido
    Dado que o workspace contém src/test/setup.ts com "@testing-library/jest-dom/vitest"
    E o package.json não possui "@testing-library/jest-dom" em devDependencies
    E src/app/layout.tsx importa "next/document"
    Quando os quality gates iniciarem a execução
    Então o sistema adiciona a dependência ausente no package.json
    E reescreve o layout para padrão compatível com app router
