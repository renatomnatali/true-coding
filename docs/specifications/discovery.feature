# language: pt
# encoding: utf-8

Funcionalidade: Discovery - Fluxo de 5 Perguntas Estruturadas
  Como usuário do True Coding
  Quero responder 5 perguntas sobre minha ideia
  Para que a IA gere um Business Plan completo e preciso

  Contexto:
    Dado que existe um usuário autenticado "Bruno"
    E o usuário está na página do projeto

  # ============================================================================
  # CENÁRIOS: INÍCIO DO DISCOVERY
  # ============================================================================

  @happy-path @inicio
  Cenário: Usuário abre projeto novo pela primeira vez
    Dado que o projeto "Meu App" tem status "IDEATION"
    E o projeto NÃO tem businessPlan
    E o projeto NÃO tem conversação de discovery
    Quando o usuário abre a página do projeto
    Então o workspace exibe o card "Discovery"
    E o workspace exibe a lista "O que vamos fazer"
    E o workspace exibe a dica sobre ser específico
    E o chat exibe mensagem inicial "Olá! Vamos criar algo incrível juntos!"
    E o chat exibe pergunta "O que você gostaria de criar?"
    E o chat exibe quick replies da pergunta 0:
      | 📱 App de gestão |
      | 🛒 E-commerce    |
      | 📊 Dashboard     |
      | 🎨 Portfolio     |
    E a barra de progresso mostra "Pergunta 1 de 5"
    E a barra de progresso está em 20%

  # ============================================================================
  # CENÁRIOS: FLUXO DE PERGUNTAS (HAPPY PATH)
  # ============================================================================

  @happy-path @fluxo
  Cenário: Usuário responde pergunta inicial e recebe Q1
    Dado que o projeto está no estado inicial do discovery
    E o chat exibe pergunta inicial "O que você gostaria de criar?"
    Quando o usuário envia "Um app de delivery de comida"
    Então a mensagem do usuário aparece no chat
    E o chat exibe indicador de "digitando..."
    E a IA responde com pergunta Q1 "Qual problema você quer resolver e para quem?"
    E o chat exibe quick replies da pergunta 1:
      | 👥 Pequenas empresas |
      | 🎯 Freelancers       |
      | 🏢 Times remotos     |
      | 🛍️ Lojistas         |
    E a barra de progresso mostra "Pergunta 1 de 5"
    E a barra de progresso está em 20%
    E a conversação é salva no banco com currentQuestion = 1

  @happy-path @fluxo
  Cenário: Usuário completa pergunta 1 e avança para pergunta 2
    Dado que o projeto tem conversação com currentQuestion = 1
    E completedQuestions = []
    Quando o usuário responde "Ajudar restaurantes pequenos a receber pedidos online"
    Então a IA marca Q1 como completada
    E a IA responde com pergunta Q2 "Quais são as 3-5 funcionalidades principais?"
    E o chat exibe quick replies da pergunta 2:
      | 🔐 Login/cadastro  |
      | 📊 Dashboard       |
      | 📝 CRUD completo   |
      | 🔔 Notificações    |
    E a barra de progresso mostra "Pergunta 2 de 5"
    E a barra de progresso está em 40%
    E a conversação é atualizada com:
      | campo              | valor |
      | currentQuestion    | 2     |
      | completedQuestions | [1]   |

  @happy-path @fluxo
  Cenário: Usuário completa pergunta 2 e avança para pergunta 3
    Dado que o projeto tem conversação com currentQuestion = 2
    E completedQuestions = [1]
    Quando o usuário responde "Cardápio digital, carrinho, pagamento online, acompanhamento do pedido"
    Então a IA marca Q2 como completada
    E a IA responde com pergunta Q3 "O que vai diferenciar seu projeto dos concorrentes?"
    E o chat exibe quick replies da pergunta 3
    E a barra de progresso mostra "Pergunta 3 de 5"
    E a barra de progresso está em 60%

  @happy-path @fluxo
  Cenário: Usuário completa pergunta 3 e avança para pergunta 4
    Dado que o projeto tem conversação com currentQuestion = 3
    E completedQuestions = [1, 2]
    Quando o usuário responde "Taxa menor que iFood, foco em restaurantes de bairro"
    Então a IA marca Q3 como completada
    E a IA responde com pergunta Q4 "Quais features seriam nice-to-have para o futuro?"
    E o chat exibe quick replies da pergunta 4
    E a barra de progresso mostra "Pergunta 4 de 5"
    E a barra de progresso está em 80%

  @happy-path @fluxo
  Cenário: Usuário completa pergunta 4 e avança para pergunta 5
    Dado que o projeto tem conversação com currentQuestion = 4
    E completedQuestions = [1, 2, 3]
    Quando o usuário responde "Programa de fidelidade, integração com WhatsApp"
    Então a IA marca Q4 como completada
    E a IA responde com pergunta Q5 "Como pretende monetizar o projeto?"
    E a IA exibe resumo parcial das respostas anteriores
    E o chat exibe quick replies da pergunta 5:
      | 💳 Freemium          |
      | 📅 Assinatura mensal |
      | 🎁 100% gratuito     |
      | 💼 Por usuário       |
    E a barra de progresso mostra "Pergunta 5 de 5"
    E a barra de progresso está em 100%

  @happy-path @fluxo
  Cenário: Usuário completa pergunta 5 e vê confirmação
    Dado que o projeto tem conversação com currentQuestion = 5
    E completedQuestions = [1, 2, 3, 4]
    Quando o usuário responde "Freemium - grátis até 50 pedidos/mês"
    Então a IA marca Q5 como completada
    E a IA exibe resumo completo de todas as respostas
    E a IA pergunta "Confirma essas informações?"
    E o chat NÃO exibe quick replies
    E a barra de progresso mostra "Pergunta 5 de 5"
    E a barra de progresso está em 100%
    E a conversação é atualizada com completedQuestions = [1, 2, 3, 4, 5]

  @happy-path @geracao
  Cenário: Usuário confirma e Business Plan é gerado
    Dado que o projeto tem todas as 5 perguntas respondidas
    E a IA está aguardando confirmação
    Quando o usuário responde "Sim, confirmo!"
    Então o chat exibe overlay "Gerando Business Plan..."
    E a IA gera o Business Plan em formato JSON
    E o Business Plan é salvo no projeto
    E o status do projeto muda para "PLANNING"
    E o chat exibe "Plano gerado com sucesso!"
    E o workspace exibe o Business Plan formatado
    E a conversação é marcada como "COMPLETED"

  # ============================================================================
  # CENÁRIOS: RESTAURAÇÃO DE ESTADO (BUG CRÍTICO)
  # ============================================================================

  @critical @restauracao
  Cenário: Usuário reabre projeto que estava na pergunta 3
    Dado que o projeto "Delivery App" tem status "IDEATION"
    E o projeto NÃO tem businessPlan
    E existe conversação com:
      | campo              | valor     |
      | currentQuestion    | 3         |
      | completedQuestions | [1, 2]    |
      | status             | ACTIVE    |
    E existem mensagens anteriores no chat
    Quando o usuário abre a página do projeto
    Então o workspace exibe o card "Discovery"
    E o chat exibe todas as mensagens anteriores
    E a última mensagem é a pergunta Q3
    E o chat exibe quick replies da pergunta 3
    E a barra de progresso mostra "Pergunta 3 de 5"
    E a barra de progresso está em 60%

  @critical @restauracao
  Cenário: Usuário reabre projeto com plano já gerado
    Dado que o projeto "Delivery App" tem status "PLANNING"
    E o projeto TEM businessPlan válido
    E existe conversação com status "COMPLETED"
    Quando o usuário abre a página do projeto
    Então o workspace exibe o Business Plan formatado
    E o workspace exibe botões "Pedir Ajustes" e "Aprovar e Continuar"
    E o chat exibe mensagem "Plano gerado com sucesso!"
    E o chat NÃO exibe quick replies
    E o chat NÃO exibe "Pergunta 1 de 5"
    E a barra de progresso está em 100%

  @critical @restauracao
  Cenário: Usuário reabre projeto aguardando confirmação
    Dado que o projeto "Delivery App" tem status "IDEATION"
    E o projeto NÃO tem businessPlan
    E existe conversação com:
      | campo              | valor           |
      | currentQuestion    | 5               |
      | completedQuestions | [1, 2, 3, 4, 5] |
      | status             | ACTIVE          |
    E a última mensagem da IA contém "Confirma essas informações?"
    Quando o usuário abre a página do projeto
    Então o chat exibe todas as mensagens anteriores
    E a última mensagem contém o resumo e pedido de confirmação
    E o chat NÃO exibe quick replies
    E a barra de progresso mostra "Pergunta 5 de 5"

  # ============================================================================
  # CENÁRIOS: QUICK REPLIES
  # ============================================================================

  @quick-replies
  Cenário: Quick reply é usada como resposta
    Dado que o chat exibe quick replies da pergunta 2
    Quando o usuário clica em "🔐 Login/cadastro"
    Então a mensagem "🔐 Login/cadastro" é enviada como resposta do usuário
    E o fluxo continua normalmente

  @quick-replies
  Cenário: Quick replies desaparecem durante loading
    Dado que o chat exibe quick replies
    Quando o usuário envia uma mensagem
    Então os quick replies ficam desabilitados
    E o indicador de loading aparece
    Quando a IA termina de responder
    Então novos quick replies aparecem (se aplicável)

  @quick-replies
  Cenário: Quick replies não aparecem após confirmação
    Dado que todas as 5 perguntas foram respondidas
    E a IA está aguardando confirmação
    Então o chat NÃO exibe quick replies

  @quick-replies
  Cenário: Quick replies não aparecem após plano gerado
    Dado que o Business Plan foi gerado
    Então o chat NÃO exibe quick replies

  # ============================================================================
  # CENÁRIOS: BARRA DE PROGRESSO
  # ============================================================================

  @progresso
  Cenário: Barra de progresso reflete estado real
    Dado que a conversação tem completedQuestions = [1, 2]
    E currentQuestion = 3
    Quando o componente ChatPanel é renderizado
    Então a barra de progresso mostra "Pergunta 3 de 5"
    E a barra de progresso está em 60%

  @progresso
  Cenário: Barra de progresso em 100% quando plano está pronto
    Dado que o projeto tem businessPlan
    Quando o componente ChatPanel é renderizado
    Então a barra de progresso está em 100%

  # ============================================================================
  # CENÁRIOS: WORKSPACE E CHAT SINCRONIZADOS
  # ============================================================================

  @sincronizacao
  Cenário: Workspace e Chat mostram mesmo estado
    Dado que o projeto tem businessPlan
    Quando o usuário abre a página do projeto
    Então o workspace exibe o Business Plan
    E o chat exibe estado de "plano pronto"
    E ambos os painéis estão sincronizados

  @sincronizacao
  Cenário: Mudança de estado atualiza ambos os painéis
    Dado que o usuário está na fase de confirmação
    Quando o usuário confirma e o plano é gerado
    Então o workspace atualiza para mostrar o Business Plan
    E o chat atualiza para mostrar "Plano gerado!"
    E a sidebar atualiza o status para "PLANNING"

  # ============================================================================
  # CENÁRIOS: EDGE CASES E ERROS
  # ============================================================================

  @edge-case
  Cenário: Usuário envia resposta vazia
    Dado que o chat está aguardando resposta
    Quando o usuário tenta enviar mensagem vazia
    Então o botão "Enviar" está desabilitado
    E nenhuma mensagem é enviada

  @edge-case
  Cenário: Usuário envia resposta muito curta
    Dado que o chat está aguardando resposta
    Quando o usuário envia "ok"
    Então a IA pede mais detalhes
    E a pergunta atual NÃO é marcada como completada
    E o progresso NÃO avança

  @edge-case
  Cenário: Erro de rede durante envio
    Dado que o chat está aguardando resposta
    E a conexão de rede falha
    Quando o usuário envia uma mensagem
    Então o chat exibe mensagem de erro
    E o usuário pode tentar novamente
    E o estado anterior é preservado

  @edge-case
  Cenário: Usuário quer voltar e corrigir resposta anterior
    Dado que o usuário está na pergunta 4
    Quando o usuário diz "Quero corrigir minha resposta sobre público-alvo"
    Então a IA permite a correção
    E a IA atualiza a resposta da pergunta correspondente
    E o fluxo retoma da pergunta atual

  @edge-case
  Cenário: Timeout na geração do plano
    Dado que todas as perguntas foram respondidas
    E o usuário confirmou
    E a geração do plano demora mais de 30 segundos
    Quando ocorre timeout
    Então o chat exibe mensagem de erro
    E o usuário pode tentar novamente
    E as respostas anteriores são preservadas

  @edge-case
  Cenário: Sessão expira durante o discovery
    Dado que o usuário está respondendo perguntas
    Quando a sessão do usuário expira
    E o usuário faz login novamente
    Então o estado do discovery é restaurado
    E o usuário continua de onde parou

  # ============================================================================
  # CENÁRIOS: AÇÕES DO WORKSPACE APÓS PLANO GERADO
  # ============================================================================

  @pos-plano
  Cenário: Usuário clica em "Pedir Ajustes"
    Dado que o Business Plan foi gerado
    E o workspace exibe o plano
    Quando o usuário clica em "Pedir Ajustes"
    Então o chat é focado
    E o chat exibe "O que você gostaria de ajustar no plano?"

  @pos-plano
  Cenário: Usuário clica em "Aprovar e Continuar" no Business Plan
    Dado que o Business Plan foi gerado
    E o workspace exibe o plano
    Quando o usuário clica em "Aprovar e Continuar"
    Então a IA inicia geração do Technical Plan
    E o chat exibe "Gerando Plano Técnico..."
    E o workspace exibe o Technical Plan quando pronto
    E a sidebar destaca sub-fase "Plano Técnico"

  # ============================================================================
  # CENÁRIOS: TECHNICAL PLAN (Plano de Arquitetura)
  # ============================================================================

  @planning @technical
  Cenário: Technical Plan é exibido após aprovação do Business Plan
    Dado que o Business Plan foi aprovado
    Quando a geração do Technical Plan termina
    Então o workspace exibe o Technical Plan com:
      | seção     | conteúdo                          |
      | Frontend  | Next.js, React, Tailwind          |
      | Backend   | API Routes, Prisma                |
      | Banco     | PostgreSQL                        |
      | Deploy    | Vercel                            |
    E o workspace exibe botões "Ajustar Stack" e "Aprovar Stack"
    E o chat exibe "Plano Técnico gerado! Revise a stack sugerida."

  @planning @technical
  Cenário: Usuário ajusta o Technical Plan
    Dado que o Technical Plan está sendo exibido
    Quando o usuário clica em "Ajustar Stack"
    Então o workspace entra em modo de edição
    E o usuário pode selecionar alternativas de tecnologia
    E o botão muda para "Salvar Alterações"

  @planning @technical
  Cenário: Usuário aprova o Technical Plan
    Dado que o Technical Plan está sendo exibido
    Quando o usuário clica em "Aprovar Stack"
    Então a IA inicia geração do UX Plan
    E o chat exibe "Gerando Plano de UX..."
    E o workspace exibe o UX Plan quando pronto
    E a sidebar destaca sub-fase "Plano de UX"

  # ============================================================================
  # CENÁRIOS: UX PLAN (Plano de Experiência)
  # ============================================================================

  @planning @ux
  Cenário: UX Plan é exibido após aprovação do Technical Plan
    Dado que o Technical Plan foi aprovado
    Quando a geração do UX Plan termina
    Então o workspace exibe o UX Plan com:
      | seção                    | conteúdo                              |
      | Personas                 | Cards com avatar, nome, dores         |
      | Jornadas                 | Steps com emoções (😟 → 😊 → 😃)      |
      | Arquitetura de Informação| Sitemap visual                        |
      | Wireframes               | Esboços das principais telas          |
      | Design Tokens            | Cores, tipografia, espaçamento        |
    E o workspace exibe botões "Pedir Ajustes" e "Aprovar e Continuar"
    E o chat exibe "Plano de UX gerado! Revise personas e jornadas."

  @planning @ux
  Cenário: Usuário ajusta o UX Plan
    Dado que o UX Plan está sendo exibido
    Quando o usuário clica em "Pedir Ajustes"
    Então o chat é focado
    E o chat exibe "O que você gostaria de ajustar no plano de UX?"
    E o usuário pode descrever ajustes em linguagem natural

  @planning @ux
  Cenário: Usuário aprova o UX Plan e avança para Connection
    Dado que o UX Plan está sendo exibido
    Quando o usuário clica em "Aprovar e Continuar"
    Então o status do projeto muda para "CONNECTING"
    E o workspace exibe a tela de conexão GitHub
    E a sidebar atualiza para mostrar fase "Conexão"
    E o chat exibe "Ótimo! Agora vamos conectar seu GitHub."

  # ============================================================================
  # CENÁRIOS: RESTAURAÇÃO DE ESTADO - PLANNING
  # ============================================================================

  @critical @restauracao @planning
  Cenário: Usuário reabre projeto com Technical Plan pendente
    Dado que o projeto tem status "PLANNING"
    E o projeto TEM businessPlan aprovado
    E o projeto TEM technicalPlan gerado
    E o projeto NÃO tem uxPlan
    Quando o usuário abre a página do projeto
    Então o workspace exibe o Technical Plan
    E o workspace exibe botões "Ajustar Stack" e "Aprovar Stack"
    E a sidebar destaca sub-fase "Plano Técnico"

  @critical @restauracao @planning
  Cenário: Usuário reabre projeto com UX Plan pendente
    Dado que o projeto tem status "PLANNING"
    E o projeto TEM businessPlan aprovado
    E o projeto TEM technicalPlan aprovado
    E o projeto TEM uxPlan gerado
    Quando o usuário abre a página do projeto
    Então o workspace exibe o UX Plan
    E o workspace exibe botões "Pedir Ajustes" e "Aprovar e Continuar"
    E a sidebar destaca sub-fase "Plano de UX"
