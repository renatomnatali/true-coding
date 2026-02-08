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
    E vejo a seção "Diferenciais"
    E vejo a seção "Monetização"
    E a sidebar mostra "Plano de Negócio" como "in-progress"
    E a sidebar mostra "Plano Técnico" como "available"
    E a sidebar mostra "Plano de UX" como "available"

  @business-plan @navegacao
  Cenário: Sidebar mostra progresso correto no Business Plan
    Dado que estou visualizando o Business Plan
    Então a sidebar mostra "Ideação" como "completed"
    E a sidebar mostra "Planejamento" como "in-progress"
    E a sidebar mostra "Conexão" como "blocked"
    E vejo "Fase 2/6" no indicador de jornada

  @business-plan @acoes
  Cenário: Botões de ação no Business Plan (não aprovado)
    Dado que estou visualizando o Business Plan
    E o Business Plan ainda NÃO foi aprovado
    Então vejo o botão "Editar Plano"
    E vejo o botão "Aprovar e Continuar"
    E ambos os botões estão habilitados

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

  @business-plan @edicao
  Cenário: Cancelar edição do Business Plan
    Dado que estou editando o Business Plan
    E alterei o campo "tagline"
    Quando clico em "Cancelar"
    Então as alterações são descartadas
    E volto para o modo de visualização
    E o campo exibe o valor original

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

  @business-plan @aprovado @readonly
  Cenário: Business Plan aprovado fica somente leitura
    Dado que o Business Plan foi aprovado
    Quando navego para "Plano de Negócio" na sidebar
    Então o workspace exibe o Business Plan
    E vejo o badge "Aprovado" no cabeçalho
    E NÃO vejo o botão "Editar Plano"
    E NÃO vejo o botão "Aprovar e Continuar"

  # ==========================================================================
  # TECHNICAL PLAN - Visualização
  # ==========================================================================

  @technical-plan @visualizacao
  Cenário: Visualizar Technical Plan gerado
    Dado que o Business Plan foi aprovado
    E o Technical Plan foi gerado
    Quando o workspace exibe o Technical Plan
    Então vejo a seção "Stack de Tecnologia"
    E vejo a seção "Arquitetura"
    E vejo a seção "Estrutura de Pastas"
    E vejo a seção "Modelo de Dados"

  @technical-plan @navegacao
  Cenário: Sidebar mostra progresso correto no Technical Plan
    Dado que estou visualizando o Technical Plan
    Então a sidebar mostra "Plano de Negócio" como "completed"
    E a sidebar mostra "Plano Técnico" como "in-progress"
    E a sidebar mostra "Plano de UX" como "available"

  @technical-plan @acoes
  Cenário: Botões de ação no Technical Plan (não aprovado)
    Dado que estou visualizando o Technical Plan
    E o Technical Plan ainda NÃO foi aprovado
    Então vejo o botão "Editar Plano"
    E vejo o botão "Aprovar e Continuar"

  # ==========================================================================
  # TECHNICAL PLAN - Edição
  # ==========================================================================

  @technical-plan @edicao
  Cenário: Editar plano técnico
    Dado que estou visualizando o Technical Plan
    Quando clico em "Editar Plano"
    Então vejo opções para selecionar tecnologias
    E posso trocar o database
    E posso adicionar ferramentas extras
    E vejo o botão "Salvar Alterações"
    E vejo o botão "Cancelar"

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

  @technical-plan @aprovado @readonly
  Cenário: Technical Plan aprovado fica somente leitura
    Dado que o Technical Plan foi aprovado
    Quando navego para "Plano Técnico" na sidebar
    Então vejo o badge "Aprovado" no cabeçalho
    E NÃO vejo o botão "Editar Plano"

  # ==========================================================================
  # UX PLAN - Visualização
  # ==========================================================================

  @ux-plan @visualizacao
  Cenário: Visualizar UX Plan gerado
    Dado que o Technical Plan foi aprovado
    E o UX Plan foi gerado
    Quando o workspace exibe o UX Plan
    Então vejo a seção "Personas"
    E vejo a seção "Jornadas"
    E vejo a seção "Wireframes"
    E vejo a seção "Design Tokens"

  @ux-plan @navegacao
  Cenário: Navegação interna no UX Plan
    Dado que estou visualizando o UX Plan
    Então a sidebar mostra sub-navegação:
      | Item          | Estado      |
      | Personas      | in-progress |
      | Jornadas      | available   |
      | Wireframes    | available   |
      | Design Tokens | available   |

  # ==========================================================================
  # UX PLAN - Edição
  # ==========================================================================

  @ux-plan @edicao
  Cenário: Editar Design Tokens
    Dado que estou visualizando a seção "Design Tokens"
    Quando clico em "Editar"
    Então posso alterar a cor primária
    E posso alterar a fonte principal
    E vejo preview das alterações em tempo real

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

  @ux-plan @aprovado @readonly
  Cenário: UX Plan aprovado fica somente leitura
    Dado que o UX Plan foi aprovado
    Quando navego para "Plano de UX" na sidebar
    Então vejo o badge "Aprovado"
    E NÃO vejo botões de edição

  # ==========================================================================
  # RESTAURAÇÃO DE ESTADO
  # ==========================================================================

  @restauracao @business-plan
  Cenário: Restaurar estado no Business Plan
    Dado que o projeto tem businessPlan gerado
    E o projeto NÃO tem technicalPlan
    Quando acesso a página do projeto
    Então o workspace exibe o Business Plan
    E a sidebar mostra "Plano de Negócio" como "in-progress"

  @restauracao @technical-plan
  Cenário: Restaurar estado no Technical Plan
    Dado que o projeto tem businessPlan aprovado
    E o projeto tem technicalPlan gerado
    E o projeto NÃO tem uxPlan
    Quando acesso a página do projeto
    Então o workspace exibe o Technical Plan
    E a sidebar mostra "Plano de Negócio" como "completed"
    E a sidebar mostra "Plano Técnico" como "in-progress"

  # TODO: Requer migration para adicionar campo uxPlan ao schema.prisma (Sprint 3)
  @restauracao @ux-plan
  Cenário: Restaurar estado no UX Plan
    Dado que o projeto tem businessPlan aprovado
    E o projeto tem technicalPlan aprovado
    E o projeto tem uxPlan gerado
    Quando acesso a página do projeto
    Então o workspace exibe o UX Plan
    E a sidebar mostra todos os planos anteriores como "completed"
    E a sidebar mostra "Plano de UX" como "in-progress"

  # ==========================================================================
  # NAVEGAÇÃO ENTRE PLANOS
  # ==========================================================================

  @navegacao
  Cenário: Não pode avançar sem aprovar plano atual
    Dado que estou visualizando o Business Plan
    E ainda NÃO aprovei o Business Plan
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
    E vejo o botão "Tentar Novamente"
    E posso continuar editando o plano atual

  @erro @geracao-parcial
  Cenário: Falha na geração do próximo plano
    Dado que aprovei o Business Plan
    E a geração do Technical Plan falhou
    Então o Business Plan permanece aprovado
    E vejo mensagem "Erro ao gerar Plano Técnico"
    E vejo o botão "Tentar Novamente"
    E posso tentar gerar novamente sem perder o Business Plan
