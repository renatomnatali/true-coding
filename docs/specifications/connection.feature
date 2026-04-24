# language: pt
# encoding: utf-8

@connection @fase-3
Funcionalidade: Fase de Conexão (GitHub opcional; Netlify dormente)
  Como usuário do True Coding
  Eu quero poder conectar meu projeto ao GitHub (opcional)
  Para que eu possa exportar o bundle de especificação no meu repositório

  # TRC-05.2 — Pivô Spec-as-a-Service (TRC-ADR-008 + TRC-ADR-026):
  # - GitHub é opcional. O usuário pode pular a conexão e avançar.
  # - Netlify saiu do fluxo obrigatório porque a Generation foi congelada.
  #   Cenários marcados @netlify @legado @generation-on só são válidos
  #   quando ENABLE_CODE_GENERATION está ON (modo legado de retomada v2).
  # - Em produção, ENABLE_CODE_GENERATION=false: o passo Netlify não
  #   aparece e a rota /api/projects/[id]/connect rejeita Netlify (410).

  Contexto:
    Dado que estou logado no sistema
    E tenho um projeto "Meu App Delivery" com todos os planos aprovados
    E o projeto está no status "CONNECTING"
    E ENABLE_CODE_GENERATION está OFF (default em produção)

  # ==========================================================================
  # SUB-ESTADO: github — Checkpoint (triagem pré-OAuth)
  # ENABLE_CODE_GENERATION=false (default): GitHub é opcional, Netlify some.
  # ==========================================================================

  @github @opcional @visualizacao @trc-05-2
  Cenário: Checkpoint exibe GitHub como opcional e oferece "Pular conexão"
    Dado que o projeto não tem githubRepoUrl
    E ENABLE_CODE_GENERATION está OFF
    Quando eu acesso a página do projeto
    Então o workspace exibe o checkpoint "Hora de guardar seu código"
    E vejo o cabeçalho "Conexão › Preparação (opcional)"
    E vejo a copy enfatizando que GitHub é opcional
    E vejo o botão "Pular conexão por enquanto"
    E vejo a explicação "Você pode conectar GitHub depois quando precisar exportar o código."
    E NÃO vejo nenhum step ou botão de Netlify

  @github @opcional @skip @trc-05-2
  Cenário: Pular a conexão a partir do checkpoint avança para o sub-estado "skipped"
    Dado que estou no checkpoint de GitHub
    E ENABLE_CODE_GENERATION está OFF
    Quando clico em "Pular conexão por enquanto"
    Então o workspace exibe a tela "Conexão dispensada por enquanto"
    E vejo botão "Conectar agora" para desfazer o skip
    E NÃO ocorre redirecionamento para github.com

  @github @opcional @skip @trc-05-2
  Cenário: Pular a conexão também é oferecido na tela de OAuth
    Dado que estou na tela de OAuth "Conectar com GitHub"
    E ENABLE_CODE_GENERATION está OFF
    Então vejo o link "Pular e conectar depois"
    Quando clico em "Pular e conectar depois"
    Então o workspace exibe a tela "Conexão dispensada por enquanto"

  @github @opcional @undo-skip @trc-05-2
  Cenário: Desfazer skip volta ao checkpoint
    Dado que estou na tela "Conexão dispensada por enquanto"
    Quando clico em "Conectar agora"
    Então o workspace volta para o checkpoint "Hora de guardar seu código"

  @github @opcional @repo-created @trc-05-2
  Cenário: Após criar repositório, sub-estado "github-only" substitui "connected"
    Dado que ENABLE_CODE_GENERATION está OFF
    E o projeto tem githubRepoUrl
    Quando o workspace renderiza o estado pós-OAuth
    Então vejo alert verde "GitHub conectado!"
    E vejo o card do repositório com URL e botão "Copiar"
    E NÃO vejo card "Próximo Passo" sobre Netlify
    E NÃO vejo botão "Conectar Netlify"
    E vejo dica "Próximo passo: avance para a fase de Especificação."

  # ==========================================================================
  # CHECKPOINT LEGADO (modo Generation ON — retomada v2)
  # ENABLE_CODE_GENERATION=true habilita o fluxo legado GitHub + Netlify.
  # ==========================================================================

  @github @checkpoint @legado @generation-on
  Cenário: Checkpoint legado "Você já tem GitHub?" (modo Generation ON)
    Dado que o projeto não tem githubRepoUrl
    E ENABLE_CODE_GENERATION está ON
    Quando eu acesso a página do projeto
    Então o workspace exibe o checkpoint "Hora de guardar seu código"
    E vejo texto "Você já tem uma conta no GitHub?"
    E vejo botão "Sim, já tenho" com ícone GitHub
    E vejo botão "Ainda não tenho" com ícone de criação
    E vejo detalhes expansíveis "O que é GitHub?"
    E NÃO vejo botão "Pular conexão por enquanto"

  @github @checkpoint @caminho-sim
  Cenário: Clicar "Sim, já tenho" avança para OAuth
    Dado que estou no checkpoint de GitHub
    Quando clico em "Sim, já tenho"
    Então o workspace exibe a tela de OAuth "Conectar com GitHub"
    E vejo a lista de permissões simplificada
    E vejo o botão "Conectar com GitHub"

  @github @checkpoint @caminho-nao
  Cenário: Clicar "Ainda não tenho" mostra tutorial
    Dado que estou no checkpoint de GitHub
    Quando clico em "Ainda não tenho"
    Então o workspace exibe a tela "Criar sua conta no GitHub"
    E vejo 3 passos numerados para criar conta
    E vejo o botão "Abrir GitHub (nova aba)"
    E vejo o botão "Já criei minha conta, continuar"
    E vejo dica sobre o plano gratuito

  @github @checkpoint @tutorial-continuar
  Cenário: Após criar conta, avançar para OAuth
    Dado que estou na tela "Criar sua conta no GitHub"
    Quando clico em "Já criei minha conta, continuar"
    Então o workspace exibe a tela de OAuth "Conectar com GitHub"

  @github @oauth @navegacao
  Cenário: Sidebar mostra estado correto na fase Conexão
    Dado que estou na tela de conexão GitHub
    Então a sidebar mostra "Planejamento" como "completed"
    E a sidebar mostra "Conexão" como "in-progress"
    E a sidebar mostra "Geração" como "blocked"
    E vejo "Fase 3/6" no indicador de jornada

  # ==========================================================================
  # SUB-ESTADO: github — Fluxo OAuth (após checkpoint)
  # ==========================================================================

  @github @oauth @visualizacao
  Cenário: Visualizar tela de OAuth após checkpoint
    Dado que passei pelo checkpoint clicando "Sim, já tenho"
    Então o workspace exibe a tela "Conectar com GitHub"
    E vejo a lista de permissões: criar repositório, ver perfil, verificar email
    E vejo o botão "Conectar com GitHub"
    E vejo nota "Você será redirecionado para github.com e voltará automaticamente."

  @github @oauth @fluxo
  Cenário: Iniciar fluxo OAuth do GitHub
    Dado que estou na tela de OAuth "Conectar com GitHub"
    Quando clico em "Conectar com GitHub"
    Então o sistema salva o projectId em cookie "github_oauth_project_id"
    E redireciona para a URL de autorização do GitHub
    E a URL contém os scopes: repo, read:user, user:email

  @github @oauth @callback
  Cenário: Callback OAuth bem-sucedido redireciona para o projeto
    Dado que o GitHub retornou com code e state válidos
    E o cookie "github_oauth_project_id" contém o ID do projeto
    Quando o callback processa a troca do code por token
    Então o token é salvo no usuário (encrypted)
    E o sistema redireciona para "/project/[id]?github=connected"

  @github @oauth @callback
  Cenário: Callback OAuth sem cookie de projeto redireciona para dashboard
    Dado que o GitHub retornou com code e state válidos
    E o cookie "github_oauth_project_id" NÃO existe
    Quando o callback processa a troca do code por token
    Então o sistema redireciona para "/dashboard?github=connected"

  # ==========================================================================
  # SUB-ESTADO: github → repo-created — Criação do repositório
  # githubRepoUrl !== null && productionUrl === null
  # ==========================================================================

  @github @repo @loading
  Cenário: Mostrar loading enquanto cria repositório após OAuth
    Dado que o usuário retornou à página com "?github=connected"
    E o projeto não tem githubRepoUrl ainda
    Quando o sistema está criando o repositório
    Então o workspace exibe "Criando seu repositório..."
    E vejo um indicador de progresso (spinner)
    E vejo texto "Conectamos seu GitHub com sucesso. Agora estamos criando o repositório..."
    E NÃO vejo o checkpoint "Você já tem uma conta no GitHub?"

  @github @repo @criacao
  Cenário: Criar repositório após OAuth bem-sucedido
    Dado que o usuário retornou à página com "?github=connected"
    E o projeto não tem githubRepoUrl ainda
    Quando o sistema chama POST /api/projects/[id]/connect com { service: "github" }
    Então o sistema decriptografa o token do usuário
    E cria um repositório no GitHub com nome derivado do projeto
    E salva githubRepoUrl, githubRepoOwner, githubRepoName no projeto
    E retorna os dados do repositório criado

  @github @repo @idempotencia
  Cenário: Vincular repositório existente do mesmo projeto
    Dado que o projeto não tem githubRepoUrl salvo no banco
    E o repositório com o nome esperado já existe no GitHub do usuário
    Quando o sistema chama POST /api/projects/[id]/connect com { service: "github" }
    Então o sistema não cria um novo repositório
    E vincula o repositório existente ao projeto

  @github @repo @visualizacao
  Cenário: Visualizar tela de repositório criado
    Dado que o projeto tem githubRepoUrl
    E o projeto não tem productionUrl
    Quando o workspace renderiza o sub-estado "repo-created"
    Então vejo alert verde "GitHub Conectado com Sucesso!"
    E vejo card com URL do repositório e botão copiar
    E vejo visibilidade como "privado"
    E vejo branch principal como "main"
    E vejo lista de arquivos iniciais gerados pelo auto_init
    E vejo card "Próximo Passo" explicando a conexão com Netlify
    E vejo botão "Ver no GitHub →"
    E vejo botão "Conectar Netlify →"

  @github @repo @sidebar
  Cenário: Sidebar mostra integrações após GitHub conectado
    Dado que o projeto tem githubRepoUrl
    Então a sidebar mostra seção "INTEGRAÇÕES"
    E GitHub exibe com marca de check (✓)
    E Netlify exibe como pendente

  # ==========================================================================
  # SUB-ESTADO: repo-created — Conectar Netlify (LEGADO — Generation ON)
  # githubRepoUrl !== null && productionUrl === null
  # Em produção (ENABLE_CODE_GENERATION=false) este sub-estado é ocultado
  # pelo componente; os cenários abaixo só correm com a flag ON.
  # ==========================================================================

  @netlify @oauth @visualizacao @legado @generation-on
  Cenário: Botão "Conectar Netlify" redireciona para OAuth da Netlify (legado)
    Dado que ENABLE_CODE_GENERATION está ON
    E o projeto tem githubRepoUrl
    E o projeto não tem productionUrl
    Quando o usuário clica "Conectar Netlify →"
    Então o sistema salva o projectId em cookie "netlify_oauth_project_id"
    E redireciona para a URL de autorização da Netlify

  @netlify @oauth @callback @legado @generation-on
  Cenário: Callback OAuth Netlify bem-sucedido salva token (legado)
    Dado que ENABLE_CODE_GENERATION está ON
    E a Netlify retornou com code e state válidos
    E o cookie "netlify_oauth_project_id" contém o ID do projeto
    Quando o callback processa a troca do code por token
    Então o token é salvo no usuário (encrypted)
    E o sistema redireciona para "/project/[id]?netlify=connected"

  @netlify @oauth @callback @legado @generation-on
  Cenário: Callback OAuth Netlify sem cookie redireciona para dashboard (legado)
    Dado que ENABLE_CODE_GENERATION está ON
    E a Netlify retornou com code e state válidos
    E o cookie "netlify_oauth_project_id" NÃO existe
    Quando o callback processa a troca do code por token
    Então o sistema redireciona para "/dashboard?netlify=connected"

  @netlify @connect @criacao @legado @generation-on
  Cenário: Criar site Netlify após OAuth bem-sucedido (legado)
    Dado que ENABLE_CODE_GENERATION está ON
    E o usuário retornou à página com "?netlify=connected"
    E o projeto tem githubRepoUrl mas não tem productionUrl
    Quando o sistema chama POST /api/projects/[id]/connect com { service: "netlify" }
    Então o sistema decriptografa o token do usuário
    E cria um site na Netlify com nome derivado do projeto
    E salva netlifySiteId e productionUrl no projeto
    E mantém o status do projeto em "CONNECTING"
    E retorna os dados do site criado

  @netlify @api @gate @trc-05-2
  Cenário: Endpoint /connect rejeita Netlify quando ENABLE_CODE_GENERATION está OFF
    Dado que ENABLE_CODE_GENERATION está OFF
    E estou logado como dono do projeto
    Quando faço POST /api/projects/[id]/connect com { service: "netlify" }
    Então recebo 410 NETLIFY_DISABLED
    E a mensagem orienta a continuar sem Netlify ou exportar o bundle
    E nenhum site é criado na Netlify

  # ==========================================================================
  # SUB-ESTADO: connected — Tudo conectado (LEGADO — Generation ON)
  # productionUrl !== null
  # ==========================================================================

  @netlify @visualizacao @legado @generation-on
  Cenário: Visualizar tela de tudo conectado (legado)
    Dado que ENABLE_CODE_GENERATION está ON
    E o projeto tem productionUrl
    Quando o workspace renderiza o sub-estado "connected"
    Então vejo alert verde "Tudo Conectado!"
    E vejo cards GitHub ✓ e Netlify ✓
    E vejo card "Pipeline de Deploy" com timeline de 3 passos
    E vejo tip "Tudo pronto para iniciar o desenvolvimento"
    E vejo botão "← Voltar"
    E vejo botão "Iniciar Desenvolvimento →"

  @assessment @analise
  Cenário: Iniciar desenvolvimento executa análise automaticamente
    Dado que o projeto está no sub-estado "connected"
    Quando o usuário clica "Iniciar Desenvolvimento →"
    Então o sistema chama POST /api/projects/[id]/development/assessment
    E exibe feedback visual dos agentes "AssessmentAgent" e "IterationPlannerAgent"
    E exibe score e plano de iterações
    E exibe botão "Continuar para Desenvolvimento →"
    E NÃO inicia geração de código automaticamente

  @assessment @erro
  Cenário: Falha na análise automática de complexidade
    Dado que o projeto está no sub-estado "connected"
    E a API POST /api/projects/[id]/development/assessment retorna erro
    Quando o usuário clica "Iniciar Desenvolvimento →"
    Então o usuário vê mensagem de erro da análise
    E o botão "Continuar para Desenvolvimento →" não é exibido

  @assessment @start
  Cenário: Iniciar desenvolvimento apenas após análise concluída
    Dado que a análise de complexidade foi concluída com sucesso
    E o plano de iterações foi exibido
    Quando o usuário clica "Continuar para Desenvolvimento →"
    Então o sistema chama POST /api/projects/[id]/development/runs
    E envia o plano de iterações confirmado no payload
    E o pipeline autônomo inicia a execução

  @assessment @guard
  Cenário: API bloqueia início sem confirmação de assessment
    Dado que o usuário tenta iniciar desenvolvimento sem confirmar a análise
    Quando chama POST /api/projects/[id]/development/runs
    Então recebe 409 "ASSESSMENT_REQUIRED"

  # ==========================================================================
  # ERRO: Falha na conexão com GitHub
  # ==========================================================================

  @erro @github
  Cenário: Exibir tela de erro quando OAuth falha
    Dado que a URL contém "?error=github_auth_failed"
    Quando o workspace renderiza o estado de erro
    Então vejo card vermelho com título "Erro na Conexão"
    E vejo lista de causas prováveis
    E vejo passos numerados para resolver
    E vejo botão "← Voltar"
    E vejo botão "Reconectar GitHub"
    E vejo seção expandível com informações técnicas

  @erro @github @callback
  Cenário: Callback OAuth com erro redireciona com parâmetro de erro
    Dado que o GitHub retornou com error=access_denied
    E o cookie "github_oauth_project_id" contém o ID do projeto
    Quando o callback processa o erro
    Então o sistema redireciona para "/project/[id]?error=github_auth_failed"

  @erro @github @callback
  Cenário: Callback OAuth com erro sem cookie redireciona para dashboard
    Dado que o GitHub retornou com error=access_denied
    E o cookie "github_oauth_project_id" NÃO existe
    Quando o callback processa o erro
    Então o sistema redireciona para "/dashboard?error=github_auth_failed"

  @erro @github @api
  Cenário: Erro na criação do repositório
    Dado que o sistema tentou criar o repositório no GitHub
    E a API do GitHub retornou erro (ex: nome duplicado)
    Quando o endpoint POST /connect retorna erro
    Então o usuário vê a tela de erro com opção de tentar novamente

  @erro @netlify @callback
  Cenário: Callback OAuth Netlify com erro redireciona com parâmetro de erro
    Dado que a Netlify retornou com error na URL
    E o cookie "netlify_oauth_project_id" contém o ID do projeto
    Quando o callback processa o erro
    Então o sistema redireciona para "/project/[id]?error=netlify_auth_failed"

  @erro @netlify @api
  Cenário: Erro na criação do site Netlify
    Dado que o sistema tentou criar o site na Netlify
    E a API da Netlify retornou erro
    Quando o endpoint POST /connect retorna erro
    Então o usuário vê a tela de erro com opção de tentar novamente

  # ==========================================================================
  # RESTAURAÇÃO DE ESTADO
  # ==========================================================================

  @restauracao @github
  Cenário: Restaurar estado sub-estado "github"
    Dado que o projeto está em CONNECTING
    E não tem githubRepoUrl
    Quando acesso a página do projeto
    Então o workspace exibe a tela de conexão GitHub (sub-estado "github")

  @restauracao @repo-created
  Cenário: Restaurar estado sub-estado "repo-created"
    Dado que o projeto está em CONNECTING
    E tem githubRepoUrl
    E não tem productionUrl
    Quando acesso a página do projeto
    Então o workspace exibe a tela de repositório criado (sub-estado "repo-created")

  @restauracao @connected
  Cenário: Restaurar estado sub-estado "connected"
    Dado que o projeto tem productionUrl
    Quando acesso a página do projeto
    Então o workspace exibe a tela de tudo conectado (sub-estado "connected")

  # ==========================================================================
  # GUARDS: Segurança e validação do endpoint /connect
  # ==========================================================================

  @guard @auth
  Cenário: Endpoint /connect rejeita requisição não autenticada
    Dado que não estou logado
    Quando faço POST /api/projects/[id]/connect
    Então recebo 401 UNAUTHORIZED

  @guard @ownership
  Cenário: Endpoint /connect rejeita usuário que não é dono do projeto
    Dado que estou logado como outro usuário
    Quando faço POST /api/projects/[id]/connect
    Então recebo 403 FORBIDDEN

  @guard @validacao
  Cenário: Endpoint /connect rejeita service inválido
    Dado que estou logado como dono do projeto
    Quando faço POST /api/projects/[id]/connect com { service: "invalid" }
    Então recebo 400 VALIDATION_ERROR
    E a mensagem lista os valores aceitos: "github", "netlify" e "skip"

  @guard @prerequisito
  Cenário: Endpoint /connect GitHub rejeita quando token não existe
    Dado que o usuário não tem githubAccessToken
    Quando faço POST /api/projects/[id]/connect com { service: "github" }
    Então recebo 409 PREREQUISITE_NOT_MET com mensagem sobre conectar GitHub primeiro

  @guard @skip @trc-05-2
  Cenário: Endpoint /connect aceita "skip" como no-op idempotente
    Dado que estou logado como dono do projeto
    E o projeto não tem githubRepoUrl
    Quando faço POST /api/projects/[id]/connect com { service: "skip" }
    Então recebo 200 com payload { skipped: true }
    E o status do projeto continua "CONNECTING"
    E nenhum repositório ou site é criado

  @guard @prerequisito @legado @generation-on
  Cenário: Endpoint /connect Netlify rejeita quando GitHub não está conectado (legado)
    Dado que ENABLE_CODE_GENERATION está ON
    E o projeto não tem githubRepoUrl
    Quando faço POST /api/projects/[id]/connect com { service: "netlify" }
    Então recebo 409 PREREQUISITE_NOT_MET com mensagem sobre criar repositório primeiro

  @guard @prerequisito @legado @generation-on
  Cenário: Endpoint /connect Netlify rejeita quando token Netlify não existe (legado)
    Dado que ENABLE_CODE_GENERATION está ON
    E o usuário não tem netlifyAccessToken
    Quando faço POST /api/projects/[id]/connect com { service: "netlify" }
    Então recebo 409 PREREQUISITE_NOT_MET com mensagem sobre conectar Netlify primeiro
