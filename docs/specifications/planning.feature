# language: pt
# encoding: utf-8

@planning @fase-2
Funcionalidade: Fase de Planejamento
  Como usuário do True Coding
  Eu quero revisar e aprovar os planos gerados
  Para garantir que o projeto será construído corretamente

  Contexto:
    Dado que estou logado no sistema
    E tenho um projeto "Meu App Delivery" com businessPlan gerado
    E o projeto está no status "PLANNING"

  # ==========================================================================
  # BUSINESS PLAN - Visualização
  # ==========================================================================

  @business-plan @visualizacao
  Cenário: Visualizar Business Plan gerado
    Dado que o projeto tem um businessPlan válido
    Quando eu acesso a página do projeto
    Então o workspace exibe o Business Plan
    E vejo a seção "Visão Geral" com nome e tagline
    E vejo a seção "Problema" com problemStatement
    E vejo a seção "Público-Alvo" com targetAudience
    E vejo a seção "Features Core" com lista de funcionalidades
    E vejo a seção "Diferenciais" com differentiators
    E vejo a seção "Monetização" com modelo de negócio
    E a sidebar mostra "Plano de Negócio" como "in-progress"
    E a sidebar mostra "Plano Técnico" como "available"
    E a sidebar mostra "Plano de UX" como "available"

  @business-plan @navegacao
  Cenário: Sidebar mostra progresso correto no Business Plan
    Dado que estou visualizando o Business Plan
    Então a sidebar mostra "Ideação" como "completed"
    E a sidebar mostra "Planejamento" como "in-progress"
    E a sidebar mostra "Conexão" como "blocked"
    E a sidebar mostra "Geração" como "blocked"
    E vejo "Fase 2/6" no indicador de jornada

  @business-plan @acoes
  Cenário: Botões de ação no Business Plan
    Dado que estou visualizando o Business Plan
    Então vejo o botão "Editar Plano"
    E vejo o botão "Aprovar e Continuar"
    E o botão "Aprovar e Continuar" está habilitado

  # ==========================================================================
  # BUSINESS PLAN - Edição
  # ==========================================================================

  @business-plan @edicao
  Cenário: Abrir modo de edição do Business Plan
    Dado que estou visualizando o Business Plan
    Quando clico em "Editar Plano"
    Então o workspace entra em modo de edição
    E os campos do plano ficam editáveis
    E vejo o botão "Salvar Alterações"
    E vejo o botão "Cancelar"

  @business-plan @edicao
  Cenário: Salvar alterações no Business Plan
    Dado que estou editando o Business Plan
    E alterei o campo "tagline" para "Entregas rápidas e seguras"
    Quando clico em "Salvar Alterações"
    Então as alterações são salvas no banco de dados
    E volto para o modo de visualização
    E vejo a mensagem "Plano atualizado com sucesso"
    E o campo "tagline" exibe "Entregas rápidas e seguras"

  @business-plan @edicao
  Cenário: Cancelar edição do Business Plan
    Dado que estou editando o Business Plan
    E alterei o campo "tagline" para "Novo valor"
    Quando clico em "Cancelar"
    Então as alterações são descartadas
    E volto para o modo de visualização
    E o campo "tagline" exibe o valor original

  # ==========================================================================
  # BUSINESS PLAN - Aprovação
  # ==========================================================================

  @business-plan @aprovacao
  Cenário: Aprovar Business Plan e avançar para Technical Plan
    Dado que estou visualizando o Business Plan
    Quando clico em "Aprovar e Continuar"
    Então o sistema inicia a geração do Technical Plan
    E vejo o loading "Gerando Plano Técnico..."
    E após a geração, o workspace exibe o Technical Plan
    E a sidebar mostra "Plano de Negócio" como "completed"
    E a sidebar mostra "Plano Técnico" como "in-progress"

  @business-plan @aprovacao @loading
  Cenário: Loading durante geração do Technical Plan
    Dado que cliquei em "Aprovar e Continuar" no Business Plan
    Então vejo um overlay de loading
    E vejo a mensagem "Gerando Plano Técnico..."
    E o botão "Aprovar e Continuar" fica desabilitado
    E não posso navegar para outras seções durante a geração

  # ==========================================================================
  # TECHNICAL PLAN - Visualização
  # ==========================================================================

  @technical-plan @visualizacao
  Cenário: Visualizar Technical Plan gerado
    Dado que o Business Plan foi aprovado
    E o Technical Plan foi gerado
    Quando o workspace exibe o Technical Plan
    Então vejo a seção "Stack de Tecnologia" com:
      | Categoria   | Tecnologia        |
      | Frontend    | Next.js 15        |
      | Backend     | Next.js API       |
      | Database    | PostgreSQL        |
      | ORM         | Prisma            |
      | Auth        | Clerk             |
      | Hosting     | Vercel            |
    E vejo a seção "Arquitetura" com diagrama de componentes
    E vejo a seção "Estrutura de Pastas" com tree do projeto
    E vejo a seção "Modelo de Dados" com entidades principais

  @technical-plan @navegacao
  Cenário: Sidebar mostra progresso correto no Technical Plan
    Dado que estou visualizando o Technical Plan
    Então a sidebar mostra "Plano de Negócio" como "completed"
    E a sidebar mostra "Plano Técnico" como "in-progress"
    E a sidebar mostra "Plano de UX" como "available"

  @technical-plan @acoes
  Cenário: Botões de ação no Technical Plan
    Dado que estou visualizando o Technical Plan
    Então vejo o botão "Editar Stack"
    E vejo o botão "Aprovar e Continuar"

  # ==========================================================================
  # TECHNICAL PLAN - Edição
  # ==========================================================================

  @technical-plan @edicao
  Cenário: Editar stack de tecnologia
    Dado que estou visualizando o Technical Plan
    Quando clico em "Editar Stack"
    Então vejo opções para selecionar tecnologias
    E posso trocar "PostgreSQL" por "MySQL"
    E posso adicionar "Redis" para cache
    E vejo o botão "Salvar Alterações"

  @technical-plan @edicao
  Cenário: Salvar alterações no Technical Plan
    Dado que estou editando o Technical Plan
    E selecionei "MySQL" como database
    Quando clico em "Salvar Alterações"
    Então as alterações são salvas
    E o Technical Plan é regenerado com a nova stack
    E vejo "MySQL" na seção de Database

  # ==========================================================================
  # TECHNICAL PLAN - Aprovação
  # ==========================================================================

  @technical-plan @aprovacao
  Cenário: Aprovar Technical Plan e avançar para UX Plan
    Dado que estou visualizando o Technical Plan
    Quando clico em "Aprovar e Continuar"
    Então o sistema inicia a geração do UX Plan
    E vejo o loading "Gerando Plano de UX..."
    E após a geração, o workspace exibe o UX Plan
    E a sidebar mostra "Plano Técnico" como "completed"
    E a sidebar mostra "Plano de UX" como "in-progress"

  # ==========================================================================
  # UX PLAN - Visualização
  # ==========================================================================

  @ux-plan @visualizacao
  Cenário: Visualizar UX Plan gerado
    Dado que o Technical Plan foi aprovado
    E o UX Plan foi gerado
    Quando o workspace exibe o UX Plan
    Então vejo a seção "Personas" com perfis de usuário
    E vejo a seção "Jornadas" com fluxos do usuário
    E vejo a seção "Wireframes" com esboços das telas
    E vejo a seção "Design Tokens" com cores, fontes e espaçamentos

  @ux-plan @navegacao
  Cenário: Navegação interna no UX Plan
    Dado que estou visualizando o UX Plan
    Então a sidebar mostra sub-navegação:
      | Item          | Estado      |
      | Personas      | in-progress |
      | Jornadas      | available   |
      | Wireframes    | available   |
      | Design Tokens | available   |
    E posso clicar em cada item para navegar

  @ux-plan @navegacao
  Cenário: Sidebar mostra progresso correto no UX Plan
    Dado que estou visualizando o UX Plan
    Então a sidebar mostra "Plano de Negócio" como "completed"
    E a sidebar mostra "Plano Técnico" como "completed"
    E a sidebar mostra "Plano de UX" como "in-progress"

  # ==========================================================================
  # UX PLAN - Edição
  # ==========================================================================

  @ux-plan @edicao
  Cenário: Editar Design Tokens
    Dado que estou visualizando a seção "Design Tokens"
    Quando clico em "Editar"
    Então posso alterar a cor primária
    E posso alterar a fonte principal
    E posso alterar os espaçamentos
    E vejo preview das alterações em tempo real

  @ux-plan @edicao
  Cenário: Salvar alterações no UX Plan
    Dado que estou editando os Design Tokens
    E alterei a cor primária para "#10b981"
    Quando clico em "Salvar Alterações"
    Então as alterações são salvas
    E vejo a nova cor aplicada no preview

  # ==========================================================================
  # UX PLAN - Aprovação (Fim do Planning)
  # ==========================================================================

  @ux-plan @aprovacao
  Cenário: Aprovar UX Plan e avançar para Connection
    Dado que estou visualizando o UX Plan
    Quando clico em "Aprovar e Continuar"
    Então o projeto avança para a fase "CONNECTING"
    E o workspace exibe a tela de conexão GitHub
    E a sidebar mostra "Planejamento" como "completed"
    E a sidebar mostra "Conexão" como "in-progress"
    E vejo "Fase 3/6" no indicador de jornada

  @ux-plan @aprovacao
  Cenário: Todos os planos aprovados - Resumo
    Dado que aprovei o UX Plan
    Então o projeto tem:
      | Campo         | Status    |
      | businessPlan  | aprovado  |
      | technicalPlan | aprovado  |
      | uxPlan        | aprovado  |
    E o status do projeto é "CONNECTING"

  # ==========================================================================
  # RESTAURAÇÃO DE ESTADO
  # ==========================================================================

  @restauracao @business-plan
  Cenário: Restaurar estado no Business Plan
    Dado que fechei o navegador enquanto visualizava o Business Plan
    Quando reabro a página do projeto
    Então o workspace exibe o Business Plan
    E a sidebar mostra o progresso correto
    E não preciso refazer o Discovery

  @restauracao @technical-plan
  Cenário: Restaurar estado no Technical Plan
    Dado que o projeto tem businessPlan aprovado
    E o projeto tem technicalPlan gerado
    Quando acesso a página do projeto
    Então o workspace exibe o Technical Plan
    E a sidebar mostra "Plano de Negócio" como "completed"
    E a sidebar mostra "Plano Técnico" como "in-progress"

  @restauracao @ux-plan
  Cenário: Restaurar estado no UX Plan
    Dado que o projeto tem businessPlan aprovado
    E o projeto tem technicalPlan aprovado
    E o projeto tem uxPlan gerado
    Quando acesso a página do projeto
    Então o workspace exibe o UX Plan
    E a sidebar mostra "Plano de Negócio" como "completed"
    E a sidebar mostra "Plano Técnico" como "completed"
    E a sidebar mostra "Plano de UX" como "in-progress"

  # ==========================================================================
  # NAVEGAÇÃO ENTRE PLANOS
  # ==========================================================================

  @navegacao
  Cenário: Voltar para plano anterior já aprovado
    Dado que estou visualizando o Technical Plan
    E o Business Plan já foi aprovado
    Quando clico em "Plano de Negócio" na sidebar
    Então o workspace exibe o Business Plan
    E vejo os dados aprovados (somente leitura)
    E vejo o badge "Aprovado" no cabeçalho

  @navegacao
  Cenário: Não pode avançar sem aprovar plano atual
    Dado que estou visualizando o Business Plan
    E ainda não aprovei o Business Plan
    Quando tento clicar em "Plano Técnico" na sidebar
    Então o item está desabilitado
    E vejo tooltip "Aprove o Plano de Negócio primeiro"

  # ==========================================================================
  # ERROS
  # ==========================================================================

  @erro @timeout
  Cenário: Timeout na geração do plano
    Dado que cliquei em "Aprovar e Continuar"
    E a geração está demorando mais de 60 segundos
    Quando o timeout é atingido
    Então vejo mensagem de erro "A geração demorou mais que o esperado"
    E vejo o botão "Tentar Novamente"
    E o estado anterior é preservado

  @erro @api
  Cenário: Erro na API durante geração
    Dado que cliquei em "Aprovar e Continuar"
    E ocorreu um erro na API
    Então vejo mensagem de erro "Erro ao gerar plano"
    E vejo detalhes do erro
    E vejo o botão "Tentar Novamente"
    E posso continuar editando o plano atual
