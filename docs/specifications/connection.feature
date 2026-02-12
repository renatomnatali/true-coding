# language: pt
# encoding: utf-8

@connection @fase-3
Funcionalidade: Fase de Conexão (GitHub + Netlify)
  Como usuário do True Coding
  Eu quero conectar meu projeto ao GitHub e Netlify
  Para que o código gerado seja publicado automaticamente

  Contexto:
    Dado que estou logado no sistema
    E tenho um projeto "Meu App Delivery" com todos os planos aprovados
    E o projeto está no status "CONNECTING"

  # ==========================================================================
  # SUB-ESTADO: github — Checkpoint (triagem pré-OAuth)
  # githubRepoUrl === null
  # ==========================================================================

  @github @checkpoint @visualizacao
  Cenário: Exibir checkpoint "Você já tem GitHub?" (estado inicial)
    Dado que o projeto não tem githubRepoUrl
    Quando eu acesso a página do projeto
    Então o workspace exibe o checkpoint "Hora de guardar seu código"
    E vejo texto "Você já tem uma conta no GitHub?"
    E vejo botão "Sim, já tenho" com ícone GitHub
    E vejo botão "Ainda não tenho" com ícone de criação
    E vejo detalhes expansíveis "O que é GitHub?"

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
  # SUB-ESTADO: repo-created — Conectar Netlify (OAuth real)
  # githubRepoUrl !== null && productionUrl === null
  # ==========================================================================

  @netlify @oauth @visualizacao
  Cenário: Botão "Conectar Netlify" redireciona para OAuth da Netlify
    Dado que o projeto tem githubRepoUrl
    E o projeto não tem productionUrl
    Quando o usuário clica "Conectar Netlify →"
    Então o sistema salva o projectId em cookie "netlify_oauth_project_id"
    E redireciona para a URL de autorização da Netlify

  @netlify @oauth @callback
  Cenário: Callback OAuth Netlify bem-sucedido salva token
    Dado que a Netlify retornou com code e state válidos
    E o cookie "netlify_oauth_project_id" contém o ID do projeto
    Quando o callback processa a troca do code por token
    Então o token é salvo no usuário (encrypted)
    E o sistema redireciona para "/project/[id]?netlify=connected"

  @netlify @oauth @callback
  Cenário: Callback OAuth Netlify sem cookie redireciona para dashboard
    Dado que a Netlify retornou com code e state válidos
    E o cookie "netlify_oauth_project_id" NÃO existe
    Quando o callback processa a troca do code por token
    Então o sistema redireciona para "/dashboard?netlify=connected"

  @netlify @connect @criacao
  Cenário: Criar site Netlify após OAuth bem-sucedido
    Dado que o usuário retornou à página com "?netlify=connected"
    E o projeto tem githubRepoUrl mas não tem productionUrl
    Quando o sistema chama POST /api/projects/[id]/connect com { service: "netlify" }
    Então o sistema decriptografa o token do usuário
    E cria um site na Netlify com nome derivado do projeto
    E salva netlifySiteId e productionUrl no projeto
    E atualiza o status do projeto para "GENERATING"
    E retorna os dados do site criado

  # ==========================================================================
  # SUB-ESTADO: connected — Tudo conectado
  # productionUrl !== null
  # ==========================================================================

  @netlify @visualizacao
  Cenário: Visualizar tela de tudo conectado
    Dado que o projeto tem productionUrl
    Quando o workspace renderiza o sub-estado "connected"
    Então vejo alert verde "Tudo Conectado!"
    E vejo cards GitHub ✓ e Netlify ✓
    E vejo card "Pipeline de Deploy" com timeline de 3 passos
    E vejo tip "Tudo pronto para gerar código!"
    E vejo botão "← Voltar"
    E vejo botão "Analisar Complexidade →"

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

  @guard @prerequisito
  Cenário: Endpoint /connect GitHub rejeita quando token não existe
    Dado que o usuário não tem githubAccessToken
    Quando faço POST /api/projects/[id]/connect com { service: "github" }
    Então recebo 409 PREREQUISITE_NOT_MET com mensagem sobre conectar GitHub primeiro

  @guard @prerequisito
  Cenário: Endpoint /connect Netlify rejeita quando GitHub não está conectado
    Dado que o projeto não tem githubRepoUrl
    Quando faço POST /api/projects/[id]/connect com { service: "netlify" }
    Então recebo 409 PREREQUISITE_NOT_MET com mensagem sobre criar repositório primeiro

  @guard @prerequisito
  Cenário: Endpoint /connect Netlify rejeita quando token Netlify não existe
    Dado que o usuário não tem netlifyAccessToken
    Quando faço POST /api/projects/[id]/connect com { service: "netlify" }
    Então recebo 409 PREREQUISITE_NOT_MET com mensagem sobre conectar Netlify primeiro
