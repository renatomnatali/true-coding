# language: pt
# encoding: utf-8

@discovery @fase-1
Funcionalidade: Fase de Ideação (Discovery)
  Como usuário do True Coding
  Eu quero responder perguntas sobre meu projeto
  Para que a IA gere um Business Plan completo

  # ===========================================================================
  # REGRA DE PROGRESSO (fonte de verdade):
  # - progress% = currentQuestion / total * 100
  # - currentQuestion = pergunta que está sendo EXIBIDA (não respondida ainda)
  # - Início: currentQuestion=1, progress=20%
  # - Após responder Q1: currentQuestion=2, progress=40%
  # - Após responder Q5: currentQuestion=5, completedQuestions=[1,2,3,4,5], progress=100%
  # ===========================================================================

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
      | Sugestão         |
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
  # Ordem das perguntas (conforme DISCOVERY_QUESTIONS no código):
  # Q1: Problema e Público-Alvo
  # Q2: Features Core
  # Q3: Diferenciais
  # Q4: Nice-to-Have
  # Q5: Monetização
  # ==========================================================================

  @pergunta-1
  Cenário: Responder pergunta 1 - Problema e Público-Alvo
    Dado que estou na pergunta 1 (currentQuestion=1, progress=20%)
    Quando digito "Um app de delivery para restaurantes pequenos"
    E clico em "Enviar"
    Então a mensagem é enviada
    E vejo indicador de "digitando..."
    E a IA responde com a pergunta 2
    E a barra de progresso avança para 40%
    E mostra "Pergunta 2 de 5"

  @pergunta-1 @quick-reply
  Cenário: Usar quick reply na pergunta 1
    Dado que estou na pergunta 1
    E vejo quick replies: "👥 Pequenas empresas", "🎯 Freelancers", "🏢 Times remotos", "🛍️ Lojistas"
    Quando clico no quick reply "👥 Pequenas empresas"
    Então o texto completo aparece no input
    E o usuário pode revisar, editar e enviar

  @pergunta-2
  Cenário: Responder pergunta 2 - Features Core
    Dado que respondi a pergunta 1
    E estou na pergunta 2 (currentQuestion=2, progress=40%)
    Quando respondo "Cardápio digital, pedidos online, pagamento integrado"
    E clico em "Enviar"
    Então a IA processa a resposta
    E a barra de progresso avança para 60%
    E mostra "Pergunta 3 de 5"

  @pergunta-3
  Cenário: Responder pergunta 3 - Diferenciais
    Dado que respondi a pergunta 2
    E estou na pergunta 3 (currentQuestion=3, progress=60%)
    Quando respondo "Interface mais simples que iFood, foco em pequenos restaurantes"
    E clico em "Enviar"
    Então a IA processa a resposta
    E a barra de progresso avança para 80%
    E mostra "Pergunta 4 de 5"

  @pergunta-4
  Cenário: Responder pergunta 4 - Nice-to-Have
    Dado que respondi a pergunta 3
    E estou na pergunta 4 (currentQuestion=4, progress=80%)
    Quando respondo "Integrações com iFood e Rappi, relatórios avançados"
    E clico em "Enviar"
    Então a IA processa a resposta
    E a barra de progresso avança para 100%
    E mostra "Pergunta 5 de 5"

  @pergunta-5
  Cenário: Responder pergunta 5 - Monetização
    Dado que respondi a pergunta 4
    E estou na pergunta 5 (currentQuestion=5, progress=100%)
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

  @geracao @loading @regressao
  Cenário: Overlay de geração não abre antes da confirmação
    Dado que respondi todas as 5 perguntas
    E a IA perguntou se pode gerar o plano
    Quando envio uma mensagem sem confirmação de geração
    Então NÃO vejo overlay de loading
    E posso continuar conversando no chat

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
  # Nota: índice 0 é a pergunta inicial "O que criar?" (pré-discovery)
  # Índices 1-5 correspondem às 5 perguntas estruturadas
  # ==========================================================================

  @quick-replies
  Cenário: Quick replies aparecem por pergunta
    Dado que estou respondendo o Discovery
    Então vejo quick replies contextuais:
      | Pergunta | Descrição              | Quick Replies                                                    |
      | 0        | O que criar?           | 📱 App de gestão, 🛒 E-commerce, 📊 Dashboard, 🎨 Portfolio      |
      | 1        | Problema/Público       | 👥 Pequenas empresas, 🎯 Freelancers, 🏢 Times remotos, 🛍️ Lojistas |
      | 2        | Features Core          | 🔐 Login/cadastro, 📊 Dashboard, 📝 CRUD completo, 🔔 Notificações |
      | 3        | Diferenciais           | 🎨 Mais simples, 💰 Preço melhor, ⚡ Mais rápido, 🎯 Mais focado   |
      | 4        | Nice-to-Have           | 🔗 Integrações, 📊 Relatórios, 📱 App mobile, 🤖 Automações       |
      | 5        | Monetização            | 💳 Freemium, 📅 Assinatura mensal, 🎁 100% gratuito, 💼 Por usuário |

  @quick-replies @esconder
  Cenário: Quick replies não aparecem após pergunta 5 respondida
    Dado que respondi todas as 5 perguntas (completedQuestions=[1,2,3,4,5])
    Então o chat NÃO exibe quick replies

  @quick-replies @esconder
  Cenário: Quick replies não aparecem com plano pronto
    Dado que o Business Plan foi gerado
    Quando reabro a página do projeto
    Então o chat NÃO exibe quick replies

  # ==========================================================================
  # RESTAURAÇÃO DE ESTADO
  # Regra: progress% = currentQuestion / 5 * 100
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
    E a barra está em 60% (currentQuestion=3, 3/5=60%)
    E vejo quick replies da pergunta 3

  @restauracao @critico
  Cenário: Restaurar estado com plano gerado
    Dado que o projeto tem businessPlan válido
    E a conversação tem status "COMPLETED"
    E completedQuestions = [1, 2, 3, 4, 5]
    Quando reabro a página do projeto
    Então a barra de progresso está em 100%
    E mostra "Plano pronto"
    E o chat NÃO exibe quick replies

  @restauracao
  Cenário: Restaurar mensagens do histórico
    Dado que o projeto tem conversação com 10 mensagens
    Quando reabro a página do projeto
    Então vejo todas as 10 mensagens no chat
    E as mensagens estão na ordem cronológica

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

  @erro @provider
  Cenário: Erro explícito quando provedor de IA está mal configurado
    Dado que o provider de IA ativo está com credencial ausente ou inválida
    Quando envio uma mensagem no chat de discovery
    Então o stream deve emitir evento de erro
    E o erro deve indicar falha de configuração do provider
    E nenhuma resposta parcial da IA deve ser persistida como mensagem final

  # ==========================================================================
  # CHAT - COMPORTAMENTOS
  # ==========================================================================

  @chat @scroll
  Cenário: Auto-scroll para novas mensagens
    Dado que tenho várias mensagens no chat
    Quando uma nova mensagem é adicionada
    Então o chat rola automaticamente para a nova mensagem

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
