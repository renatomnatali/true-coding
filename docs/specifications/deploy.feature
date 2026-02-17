# language: pt
@deploy @fase-5
Funcionalidade: Fase de Deploy na Netlify
  Após todas as iterações do pipeline de desenvolvimento serem concluídas
  e mergeadas no GitHub, o sistema deve fazer deploy automático na Netlify
  linkando o site ao repositório GitHub.

  Contexto:
    Dado que o projeto completou todas as iterações com sucesso
    E o repositório GitHub está configurado

  Cenário: Deploy automático após todas iterações mergeadas
    Dado que o projeto tem um site Netlify criado (netlifySiteId presente)
    E o usuário possui token Netlify válido
    Quando o orchestrator finaliza o loop de iterações
    Então o status do projeto muda para "DEPLOYING"
    E o sistema linka o site Netlify ao repositório GitHub
    E o sistema faz polling do estado do deploy a cada 10 segundos
    E quando o deploy atinge estado "ready"
    Então o status do projeto muda para "LIVE"
    E a productionUrl é atualizada com a URL do deploy
    E lastDeployAt é atualizado com a data atual

  Cenário: Deploy falha mostra erro com diagnóstico
    Dado que o projeto tem um site Netlify criado
    E o build na Netlify falha com erro
    Quando o polling detecta estado "error"
    Então o status do projeto muda para "FAILED"
    E o errorSummary contém a mensagem de erro do deploy
    E um evento DEPLOY_STATUS com status "FAILED" é emitido

  Cenário: Projeto sem Netlify conectado pula deploy e vai para LIVE
    Dado que o projeto NÃO tem netlifySiteId configurado
    Quando o orchestrator finaliza o loop de iterações
    Então o deploy é ignorado com evento "SKIPPED"
    E o status do projeto muda para "LIVE"
    E a productionUrl mantém o valor anterior

  Cenário: Polling de deploy respeita timeout de 5 minutos
    Dado que o projeto tem um site Netlify criado
    E o deploy permanece em estado "building" por mais de 5 minutos
    Quando o timeout é atingido
    Então o status do projeto muda para "FAILED"
    E o errorSummary indica que o timeout foi excedido
    E um evento DEPLOY_STATUS com status "TIMEOUT" é emitido

  Cenário: Falha ao linkar repositório ao site Netlify
    Dado que o projeto tem um site Netlify criado
    E a API da Netlify retorna erro ao linkar (ex: 422)
    Quando o sistema tenta linkar o site ao repositório
    Então o status do projeto muda para "FAILED"
    E o errorSummary contém a mensagem de erro da API
    E um evento DEPLOY_STATUS com status "FAILED" é emitido
