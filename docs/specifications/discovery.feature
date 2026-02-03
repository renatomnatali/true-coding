# language: pt
# encoding: utf-8

@discovery @fase-1
Funcionalidade: Fase de Ideação (Discovery)
  Como usuário do True Coding
  Eu quero responder perguntas sobre meu projeto
  Para que a IA gere um Business Plan completo

  Contexto:
    Dado que estou logado no sistema
    E criei um novo projeto "Meu App"

  # ==========================================================================
  # INÍCIO DO DISCOVERY
  # ==========================================================================

  @inicio
  Cenário: Iniciar Discovery em projeto novo
    Dado que o projeto está no status "IDEATION"
    E não existe conversação para o projeto
    Quando acesso a página do projeto
    Então vejo o chat com mensagem inicial da IA
    E a mensagem pergunta "O que você gostaria de criar?"
    E vejo quick replies com sugestões:
      | Sugestão        |
      | 📱 App de gestão |
      | 🛒 E-commerce    |
      | 📊 Dashboard     |
      | 🎨 Portfolio     |
    E a barra de progresso mostra "Pergunta 1 de 5"
    E a barra está em 20%

  @inicio @sidebar
  Cenário: Sidebar mostra estado inicial
    Dado que estou no início do Discovery
    Então a sidebar mostra "Ideação" como "in-progress"
    E a sidebar mostra "Planejamento" como "blocked"
    E vejo "Fase 1/6" no indicador de jornada

  # ==========================================================================
  # FLUXO DE PERGUNTAS (Q1 a Q5)
  # ==========================================================================

  @pergunta-1
  Cenário: Responder pergunta 1 - O que criar
    Dado que estou na pergunta 1
    Quando digito "Um app de delivery para restaurantes"
    E clico em "Enviar"
    Então a mensagem é enviada
    E vejo indicador de "digitando..."
    E a IA responde com a próxima pergunta
    E a barra de progresso avança para 40%
    E mostra "Pergunta 2 de 5"

  @pergunta-1 @quick-reply
  Cenário: Usar quick reply na pergunta 1
    Dado que estou na pergunta 1
    Quando clico no quick reply "📱 App de gestão"
    Então o texto é preenchido no input
    E posso editar antes de enviar
    E clico em "Enviar" para confirmar

  @pergunta-2
  Cenário: Responder pergunta 2 - Público-alvo
    Dado que respondi a pergunta 1
    E a IA perguntou sobre o público-alvo
    Quando respondo "Restaurantes pequenos e médios"
    E clico em "Enviar"
    Então a IA processa a resposta
    E a barra de progresso avança para 60%
    E mostra "Pergunta 3 de 5"

  @pergunta-3
  Cenário: Responder pergunta 3 - Features principais
    Dado que respondi a pergunta 2
    E a IA perguntou sobre funcionalidades
    Quando respondo "Cardápio digital, pedidos online, pagamento integrado"
    E clico em "Enviar"
    Então a IA processa a resposta
    E a barra de progresso avança para 80%
    E mostra "Pergunta 4 de 5"

  @pergunta-4
  Cenário: Responder pergunta 4 - Diferenciais
    Dado que respondi a pergunta 3
    E a IA perguntou sobre diferenciais
    Quando respondo "Interface mais simples que iFood, foco em pequenos restaurantes"
    E clico em "Enviar"
    Então a IA processa a resposta
    E a barra de progresso avança para 100%
    E mostra "Pergunta 5 de 5"

  @pergunta-5
  Cenário: Responder pergunta 5 - Monetização
    Dado que respondi a pergunta 4
    E a IA perguntou sobre monetização
    Quando respondo "Freemium - grátis até 50 pedidos/mês"
    E clico em "Enviar"
    Então a IA processa a resposta
    E o chat NÃO exibe mais quick replies
    E a IA confirma os dados coletados
    E pergunta "Posso gerar o Business Plan?"

  # ==========================================================================
  # CONFIRMAÇÃO E GERAÇÃO DO PLANO
  # ==========================================================================

  @confirmacao
  Cenário: Confirmar geração do Business Plan
    Dado que respondi todas as 5 perguntas
    E a IA perguntou se pode gerar o plano
    Quando respondo "Sim" ou clico em "Gerar Plano"
    Então vejo overlay de loading
    E a mensagem "Gerando Business Plan..."
    E os steps de progresso são mostrados

  @geracao @loading
  Cenário: Loading durante geração do plano
    Dado que confirmei a geração do plano
    Então vejo overlay com spinner
    E vejo os steps:
      | Step                      | Estado    |
      | Analisando respostas      | completed |
      | Estruturando plano        | current   |
      | Definindo features        | pending   |
      | Finalizando               | pending   |
    E vejo "Isso pode levar alguns segundos..."

  @geracao @sucesso
  Cenário: Plano gerado com sucesso
    Dado que a geração do plano terminou
    Então o overlay fecha
    E o chat exibe "Plano gerado com sucesso!"
    E o projeto avança para status "PLANNING"
    E o workspace exibe o Business Plan
    E a barra de progresso mostra "Plano pronto"
    E a sidebar mostra "Ideação" como "completed"
    E a sidebar mostra "Planejamento" como "in-progress"

  # ==========================================================================
  # QUICK REPLIES
  # ==========================================================================

  @quick-replies
  Cenário: Quick replies aparecem por pergunta
    Dado que estou respondendo o Discovery
    Então vejo quick replies contextuais para cada pergunta:
      | Pergunta | Quick Replies                                              |
      | 0        | 📱 App de gestão, 🛒 E-commerce, 📊 Dashboard, 🎨 Portfolio |
      | 1        | 👥 Pequenas empresas, 🎯 Freelancers, 🏢 Times remotos      |
      | 2        | 🔐 Login/cadastro, 📊 Dashboard, 📝 CRUD completo          |
      | 3        | 🎨 Mais simples, 💰 Preço melhor, ⚡ Mais rápido            |
      | 4        | 🔗 Integrações, 📊 Relatórios, 📱 App mobile                |
      | 5        | 💳 Freemium, 📅 Assinatura mensal, 🎁 100% gratuito         |

  @quick-replies @esconder
  Cenário: Quick replies não aparecem após pergunta 5
    Dado que respondi todas as 5 perguntas
    Então o chat NÃO exibe quick replies
    E vejo apenas o input de texto

  @quick-replies @esconder
  Cenário: Quick replies não aparecem com plano pronto
    Dado que o Business Plan foi gerado
    Quando reabro a página do projeto
    Então o chat NÃO exibe quick replies

  # ==========================================================================
  # RESTAURAÇÃO DE ESTADO
  # ==========================================================================

  @restauracao @critico
  Cenário: Restaurar estado na pergunta 3
    Dado que o projeto tem conversação com:
      | Campo              | Valor      |
      | currentQuestion    | 3          |
      | completedQuestions | [1, 2]     |
      | status             | ACTIVE     |
    E o projeto NÃO tem businessPlan
    Quando reabro a página do projeto
    Então o chat exibe todas as mensagens anteriores
    E a barra de progresso mostra "Pergunta 3 de 5"
    E a barra está em 60%
    E vejo quick replies da pergunta 3

  @restauracao @critico
  Cenário: Restaurar estado com plano gerado
    Dado que o projeto tem businessPlan válido
    E a conversação tem status "COMPLETED"
    Quando reabro a página do projeto
    Então a barra de progresso está em 100%
    E mostra "Plano pronto"
    E o chat NÃO exibe quick replies
    E vejo a mensagem "Plano gerado com sucesso!"

  @restauracao
  Cenário: Restaurar mensagens do histórico
    Dado que o projeto tem conversação com 10 mensagens
    Quando reabro a página do projeto
    Então vejo todas as 10 mensagens no chat
    E as mensagens estão na ordem cronológica
    E posso rolar para ver mensagens antigas

  # ==========================================================================
  # WORKSPACE - LIVE PREVIEW
  # ==========================================================================

  @workspace @preview
  Cenário: Preview cards aparecem conforme responde
    Dado que estou no Discovery
    Quando respondo a pergunta 1 sobre "o que criar"
    Então após 1-2 segundos aparece um card no workspace
    E o card mostra o tipo de projeto identificado
    E o card tem animação slide-in

  @workspace @preview
  Cenário: Cards acumulam no workspace
    Dado que respondi 3 perguntas
    Então vejo 3 cards no workspace:
      | Card             | Conteúdo                |
      | Tipo de Projeto  | App de delivery         |
      | Público-Alvo     | Restaurantes pequenos   |
      | Features Core    | Cardápio, Pedidos, etc  |

  # ==========================================================================
  # ERROS
  # ==========================================================================

  @erro @timeout
  Cenário: Timeout na geração do plano
    Dado que confirmei a geração do plano
    E a geração está demorando mais de 60 segundos
    Quando o timeout é atingido
    Então vejo mensagem "A geração demorou mais que o esperado"
    E vejo o botão "Tentar Novamente"
    E as respostas anteriores são preservadas

  @erro @api
  Cenário: Erro na API durante conversa
    Dado que enviei uma mensagem
    E ocorreu erro na API
    Então vejo mensagem "Desculpe, ocorreu um erro. Tente novamente."
    E posso reenviar a mensagem
    E o histórico é preservado

  @erro @validacao
  Cenário: Mensagem muito curta
    Dado que estou na pergunta 1
    Quando digito "a"
    E clico em "Enviar"
    Então vejo mensagem "Por favor, descreva melhor seu projeto"
    E a mensagem não é enviada

  # ==========================================================================
  # CHAT - COMPORTAMENTOS
  # ==========================================================================

  @chat @scroll
  Cenário: Auto-scroll para novas mensagens
    Dado que tenho várias mensagens no chat
    Quando uma nova mensagem é adicionada
    Então o chat rola automaticamente para mostrar a nova mensagem

  @chat @typing
  Cenário: Indicador de digitação da IA
    Dado que enviei uma mensagem
    Então vejo indicador de "digitando..." com animação
    E o indicador desaparece quando a resposta chega

  @chat @enter
  Cenário: Enviar mensagem com Enter
    Dado que digitei uma mensagem
    Quando pressiono Enter
    Então a mensagem é enviada
    E o input é limpo

  @chat @shift-enter
  Cenário: Nova linha com Shift+Enter
    Dado que estou digitando
    Quando pressiono Shift+Enter
    Então uma nova linha é adicionada
    E a mensagem NÃO é enviada
