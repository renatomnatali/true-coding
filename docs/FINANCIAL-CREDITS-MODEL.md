# Modelo Financeiro - Creditos

> Status: proposta para MVP de monetizacao.
> Data: 08 Fev 2026.

## Objetivo

Definir um modelo financeiro sustentavel para uso de IA com:

- previsibilidade de receita,
- controle de custo por etapa da jornada,
- boa conversao via trial limitado,
- operacao segura de debito/estorno de creditos.

## Estrutura Recomendada

- Modelo principal: compra de pacotes de creditos.
- Trial: creditos gratis limitados e com expiracao curta.
- Consumo: por etapa da jornada (Discovery, Planning, Codegen, etc).
- Transparencia: mostrar custo de creditos antes de cada acao.

## Premissas Financeiras

- COGS por credito: `R$ 0,05` (LLM + infra + observabilidade + buffer operacional).
- Margem bruta alvo: `>= 75%`.
- Consumo de um projeto base (sem muitas iteracoes): `303 creditos`.

Composicao do projeto base:

- Discovery: `8`
- Business Plan (padrao): `45`
- Technical Plan (completo): `70`
- UX Plan (completo): `60`
- Codegen inicial: `120`

## Tabela de Pacotes (BRL)

| SKU | Creditos | Preco | COGS estimado | Margem bruta | Projetos base equiv. |
| --- | ---: | ---: | ---: | ---: | ---: |
| Trial (1x) | 60 | R$ 0 | R$ 3,00 | n/a | 0,20 |
| Start | 300 | R$ 89 | R$ 15,00 | 83,1% | 0,99 |
| Pro | 1.000 | R$ 249 | R$ 50,00 | 79,9% | 3,30 |
| Scale | 3.000 | R$ 599 | R$ 150,00 | 75,0% | 9,90 |

Top-ups opcionais:

- 200 creditos: `R$ 69` (margem ~85,5%)
- 500 creditos: `R$ 159` (margem ~84,3%)
- 1.500 creditos: `R$ 429` (margem ~82,5%)

Formula de recalibracao de preco:

`preco_minimo = (creditos * cogs_por_credito) / (1 - margem_alvo)`

## Consumo por Etapa da Jornada

- Discovery (5 perguntas + resumo): `8`
- Business Plan:
  - minimo: `20`
  - padrao: `45`
  - detalhado: `80`
- Technical Plan (sempre completo): `70`
- UX Plan (sempre completo): `60`
- Codegen inicial: `120`
- Iteracao via chat (ajuste de plano/codigo): `30`
- Deploy assistido: `15`

## Trial e Funcionalidade Simples (Freemium)

Modelo recomendado:

1. Trial unico por conta: `60 creditos`, validade de `7 dias`.
2. Modo simples gratis permanente:
   - Discovery Lite (ate 2 perguntas),
   - resumo curto,
   - sem export,
   - sem Technical/UX/Codegen.

Objetivo: permitir prova de valor sem entregar o valor principal completo de forma gratuita.

## Entitlements por Tier (MVP)

```json
{
  "tiers": {
    "trial": {
      "credits_grant_once": 60,
      "expires_days": 7,
      "max_active_projects": 1,
      "business_levels": ["minimo", "padrao"],
      "technical_plan": false,
      "ux_plan": false,
      "codegen": false,
      "exports": false
    },
    "start": {
      "credits_pack": 300,
      "max_active_projects": 2,
      "business_levels": ["minimo", "padrao", "detalhado"],
      "technical_plan": true,
      "ux_plan": true,
      "codegen": true,
      "exports": true
    },
    "pro": {
      "credits_pack": 1000,
      "max_active_projects": 10,
      "team_members": 3,
      "priority_queue": true
    },
    "scale": {
      "credits_pack": 3000,
      "max_active_projects": 30,
      "team_members": 10,
      "priority_queue": true,
      "sso": true
    }
  }
}
```

## Regras Operacionais de Credito

- Debito por `hold` antes da execucao.
- Captura definitiva (`capture`) somente no sucesso.
- Falha tecnica: estorno automatico (`refund`).
- Ledger imutavel por evento:
  - `grant`
  - `hold`
  - `capture`
  - `refund`
  - `expire`
  - `adjustment`
- Consumo FIFO por lote de credito (respeita validade).

## Regras de UX Obrigatorias

- Mostrar custo antes da acao: "Esta acao custa X creditos".
- Mostrar saldo atual e saldo apos acao.
- Exibir historico de consumo por etapa no projeto.
- Exibir motivo de estorno quando ocorrer.

## Regras Antiabuso

- Trial apenas 1 vez por usuario.
- Rate limit em acoes de alto custo.
- Captcha na criacao de conta e em picos suspeitos.
- Regras de risco para contas com padrao de abuso (device/IP/comportamento).

## CMS Administrativo (escopo)

Blocos para configurar sem alterar codigo:

1. `Credit Catalog`
   - SKUs, creditos, preco, validade.
2. `Journey Pricing`
   - custo por etapa e por nivel.
3. `Tier Entitlements`
   - limites e permissoes por plano.
4. `Trial Policy`
   - elegibilidade, validade, limitacoes.
5. `Billing Rules`
   - hold/capture/refund/expire.

## Instrumentacao e Metricas

Metricas para validar em 30-60 dias:

- conversao trial -> pago,
- custo medio por projeto vs receita media por projeto,
- margem por pacote,
- distribuicao de uso por nivel (minimo/padrao/detalhado),
- taxa de recompra de creditos,
- estornos por falha tecnica.

## Roadmap de Implementacao

Fase 1 (MVP):

- pacotes de creditos,
- trial 60 creditos/7 dias,
- debito por etapa,
- tela de saldo e consumo,
- estorno automatico em falha tecnica.

Fase 2:

- top-ups automaticos,
- descontos por volume/campanha,
- alerta de baixo saldo,
- relatorios financeiros por conta/time.

Fase 3:

- faturamento enterprise (contratos),
- limites por time/projeto,
- aprovacoes internas de gasto.

## Riscos e Mitigacoes

- Risco: custo real por credito subir.
  - Mitigacao: recalibrar precos por formula e revisar consumo por etapa.
- Risco: trial gerar abuso.
  - Mitigacao: restricoes de features + antifraude + limites por conta.
- Risco: friccao por regras complexas.
  - Mitigacao: UX simples com custo claro e previsivel antes da execucao.
