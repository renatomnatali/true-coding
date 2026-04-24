/**
 * Fixtures canônicas — Maria Silva / Cafeteria Beta.
 *
 * Single source of truth para:
 * - `prisma/seed-maria.ts` (TRC-14.7) — popula o DB local/dev.
 * - testes unitários de UI/serviços que precisam de um estado Maria completo.
 *
 * Conteúdo espelha `Spec/Jornada Coleta inicial/src/data.jsx` e
 * `Spec/Jornada Coleta inicial/src/data-risks.jsx` (fonte do produto).
 * Qualquer mudança aqui deve ser refletida também nos mockups — e vice-versa.
 *
 * Regra CLAUDE.md #6: conteúdo em pt-BR acentuado.
 */

import {
  AssumptionCategory,
  BlockStatus,
  DecisionCategory,
  PlanType,
  PlatformTier,
  ProductStage,
  ProjectPhase,
  ReviewCadence,
  RiskCategory,
} from '@prisma/client'

// ----------------------------------------------------------------------------
// User + CreditLedger
// ----------------------------------------------------------------------------

/**
 * clerkId fixo garante idempotência do seed — re-runs atualizam o mesmo User
 * em vez de criar duplicatas.
 */
export const MARIA_CLERK_ID = 'seed-maria-clerk-id'

export const MARIA_USER = {
  clerkId: MARIA_CLERK_ID,
  email: 'maria@cafeteriabeta.example',
  name: 'Maria Silva',
  // PersonaTag definido via seed com type-safety; aqui string literal para
  // manter o arquivo sem imports desnecessários em consumidores de teste.
} as const

/**
 * Estado pós-export v1.0: 1 crédito restante (journey consumiu 59 dos 60
 * disponíveis no trial). Ver CREDIT_STATES.exportar=1 em data.jsx.
 */
export const MARIA_CREDIT_LEDGER = {
  balance: 1,
  tier: PlatformTier.TRIAL,
} as const

// ----------------------------------------------------------------------------
// ProductContext (POLICY-010) — 9 campos da Maria
// ----------------------------------------------------------------------------

export interface MariaProductContext {
  userSegment: string
  primaryJtbd: { situation: string; motivation: string; outcome: string }
  currentAlternative: string
  doNothingImpact: string
  primaryMetric: string
  stage: ProductStage
  strategicBets: string[]
  openAssumptions: Array<{ category: AssumptionCategory; statement: string }>
  reviewCadence: ReviewCadence
}

export const MARIA_PRODUCT_CONTEXT: MariaProductContext = {
  userSegment:
    'Dona de cafeteria de bairro em Campinas com ~180 clientes recorrentes (25-45 anos, 90%+ usa Pix diariamente). Moram ou trabalham a até 600m do ponto.',
  primaryJtbd: {
    situation: 'Quando estou no rush do almoço (11h40-13h30) com o balcão cheio e WhatsApp acumulando',
    motivation: 'preciso parar de perder pedidos de clientes fiéis que desistem por falta de resposta',
    outcome:
      'que o cliente consiga fazer o pedido de retirada, pagar antecipado via Pix e escolher horário, sem depender de eu responder mensagem.',
  },
  currentAlternative:
    'WhatsApp Business manual + atendimento presencial no balcão. Tentativa anterior de resposta automática foi rejeitada pelos clientes.',
  doNothingImpact:
    'Perde 15 a 20 pedidos por semana (ticket médio R$ 28) — estimados R$ 1.800 a R$ 2.240 por mês não capturados.',
  primaryMetric: 'Pedidos por semana capturados fora do balcão',
  stage: ProductStage.PRE_PRODUCT,
  strategicBets: [
    'Estamos apostando que pagamento antecipado via Pix + horário fixo de retirada destravam o rush sem intervenção humana.',
    'Estamos apostando que os clientes fiéis do bairro preferem Pix sem taxa a iFood com comissão.',
    'Estamos apostando que manter a relação direta (sem intermediário) sustenta o posicionamento de cafeteria de bairro.',
  ],
  openAssumptions: [
    {
      category: AssumptionCategory.USER,
      statement: 'Clientes fiéis abrem o link do WhatsApp sem fricção e completam o pedido no mobile.',
    },
    {
      category: AssumptionCategory.PROBLEM,
      statement:
        'O abandono é por falta de resposta rápida (fila na confirmação), não por preço nem por oferta concorrente.',
    },
    {
      category: AssumptionCategory.SOLUTION,
      statement:
        'Código de retirada de 3 dígitos é suficiente para identificar o pedido no balcão sem cadastro do cliente.',
    },
    {
      category: AssumptionCategory.ADOPTION,
      statement: 'Primeira indicação boca-a-boca converte em < 30 segundos, sem login obrigatório.',
    },
  ],
  reviewCadence: ReviewCadence.QUARTERLY,
}

// ----------------------------------------------------------------------------
// Project Cafeteria Beta (estado pós-export v1.0)
// ----------------------------------------------------------------------------

export const MARIA_PROJECT = {
  name: 'Cafeteria Beta Pedidos',
  description:
    'Mini-app web de pedidos de retirada com pagamento Pix antecipado para a Cafeteria Beta (Campinas).',
  phase: ProjectPhase.ESPECIFICACAO,
  stageKey: 'exportar',
  version: 'v1.0',
} as const

// ----------------------------------------------------------------------------
// Discovery Questions (5 perguntas + respostas canônicas)
// Reproduz DISCOVERY_QUESTIONS de Spec/.../data.jsx literalmente.
// ----------------------------------------------------------------------------

export interface MariaDiscoveryQuestion {
  n: number
  prompt: string
  replies: string[]
  answer: string
}

export const MARIA_DISCOVERY_QUESTIONS: MariaDiscoveryQuestion[] = [
  {
    n: 1,
    prompt: 'Oi, Maria. Bora tirar essa ideia da cabeça. Me conta: o que você gostaria de criar?',
    replies: ['📱 App de gestão', '🛒 E-commerce', '📊 Dashboard', '🎨 Portfólio'],
    answer:
      'Tenho uma cafeteria de bairro em Campinas, a Cafeteria Beta. No rush do almoço eu perco 15 a 20 pedidos por semana porque não consigo responder o WhatsApp. Queria um mini-app onde o cliente faz o pedido de retirada, escolhe o horário e paga antecipado via Pix — sem depender de eu responder mensagem.',
  },
  {
    n: 2,
    prompt: 'E quem sente essa dor hoje? Fala um pouco do perfil de quem você quer atender.',
    replies: ['👥 Pequenas empresas', '🎯 Freelancers', '🏢 Times remotos', '🛍️ Lojistas'],
    answer:
      'São meus clientes fiéis — gente que passa na cafeteria entre 12h e 13h pra retirar, mora ou trabalha perto. De 25 a 45 anos, já usa Pix todo dia. Tenho uns 180 clientes recorrentes.',
  },
  {
    n: 3,
    prompt:
      'Legal. Agora me diz: o que esse app precisa fazer no primeiro dia pra valer a pena pra quem usa?',
    replies: ['🔐 Login/cadastro', '📊 Dashboard', '📝 CRUD completo', '🔔 Notificações'],
    answer:
      'Ver o cardápio do dia com foto e preço, montar o pedido, pagar no Pix e escolher horário de retirada em janelas de 15 minutos nas próximas 3 horas.',
  },
  {
    n: 4,
    prompt: 'O que faz seu app ser melhor do que a pessoa já resolvendo isso de outro jeito?',
    replies: ['🎨 Mais simples', '💰 Preço melhor', '⚡ Mais rápido', '🎯 Mais focado'],
    answer:
      'Comparado ao WhatsApp: o cliente paga antes e escolhe horário fixo, sem ficar perguntando "tá pronto?". Comparado ao iFood: não cobro taxa e mantenho a relação direta com o cliente do bairro.',
  },
  {
    n: 5,
    prompt: 'Último ponto: como isso se paga?',
    replies: ['💳 Freemium', '📅 Assinatura mensal', '🎁 100% gratuito', '💼 Por usuário'],
    answer:
      'Grátis pra quem pede. Meu ganho vem das vendas que hoje escapam — estimo uns R$ 1.800 a 2.200 por mês a mais. Não quero cobrar taxa do cliente.',
  },
]

// ----------------------------------------------------------------------------
// PlanBlocks — 6 NEGOCIO + 4 UX + 4 TECNICO = 14 blocos, todos APPROVED
// Bodies mantidos fiéis a BUSINESS_BLOCKS / UX_BLOCKS / TECH_BLOCKS do mockup.
// ----------------------------------------------------------------------------

export interface MariaPlanBlock {
  planType: PlanType
  blockId: string
  order: number
  title: string
  body: string
}

export const MARIA_BUSINESS_BLOCKS: MariaPlanBlock[] = [
  {
    planType: PlanType.NEGOCIO,
    blockId: 'visao',
    order: 1,
    title: 'Visão geral',
    body: 'Mini-app web de pedidos de retirada para a Cafeteria Beta, cafeteria de bairro em Campinas com 2 anos de operação e cerca de 180 clientes recorrentes. A proposta se chama **Cafeteria Beta Pedidos** com a tagline **"Receba pedidos sem parar de atender o balcão"**.\n\nO escopo é enxuto por decisão: não há entrega, não há cadastro obrigatório, não há fidelidade. Quem pediu, pagou, pegou no horário escolhido. Expansões (encomenda com 48h, cupom via Instagram) ficam para iterações futuras.',
  },
  {
    planType: PlanType.NEGOCIO,
    blockId: 'problema',
    order: 2,
    title: 'Problema',
    body: 'Entre 11h40 e 13h30 o WhatsApp Business acumula mensagens que ninguém tem mão pra ler. Cliente fiel manda "boto o mesmo de ontem?" e, sem resposta, desiste. Maria estima perder **15 a 20 pedidos por semana** (ticket médio R$ 28 → R$ 1.800 a R$ 2.240/mês não capturados).\n\nTentativa anterior com resposta automática foi rejeitada pelos clientes — o problema não é resposta automática, é ter um **canal paralelo** que funciona sem depender da barista estar livre.',
  },
  {
    planType: PlanType.NEGOCIO,
    blockId: 'publico',
    order: 3,
    title: 'Público-alvo',
    body: '**Primário**: base atual de 180 clientes recorrentes — 25 a 45 anos, moram ou trabalham até 600m da cafeteria, passam entre 12h e 13h para retirar. 90%+ usa Pix diariamente.\n\n**Secundário**: "amigo do cliente fiel", que recebe indicação e decide experimentar — razão para manter o fluxo sem login obrigatório.',
  },
  {
    planType: PlanType.NEGOCIO,
    blockId: 'features',
    order: 4,
    title: 'Features core',
    body: '1. Cardápio digital com categorias (café, salgado, doce, combos), foto e preço atualizados por Maria 1×/dia\n2. Carrinho simples com soma automática e observações por item\n3. Pagamento Pix via Mercado Pago (QR code + copia-e-cola)\n4. Seleção de horário de retirada em janelas de 15 min dentro das próximas 3h\n5. Tela de confirmação com código de 3 dígitos para apresentar no balcão\n6. Painel simples para Maria ver pedidos do dia e marcar como pronto',
  },
  {
    planType: PlanType.NEGOCIO,
    blockId: 'diferenciais',
    order: 5,
    title: 'Diferenciais',
    body: 'Comparado ao WhatsApp: cliente paga antes (barista não precisa interromper atendimento presencial) e escolhe horário fixo (elimina o "tá pronto?" repetido).\n\nComparado ao iFood: sem taxa e com relação direta preservada — combina com o posicionamento de cafeteria de bairro.',
  },
  {
    planType: PlanType.NEGOCIO,
    blockId: 'monetizacao',
    order: 6,
    title: 'Monetização',
    body: 'Zero cobrança do cliente final. O ganho vem do aumento de pedidos capturados que hoje escapam.\n\nInfra estimada: Vercel free + Supabase free + Mercado Pago (0,99% por transação) ≈ R$ 40/mês de custo fixo.',
  },
]

export const MARIA_UX_BLOCKS: MariaPlanBlock[] = [
  {
    planType: PlanType.UX,
    blockId: 'personas',
    order: 1,
    title: 'Personas',
    body: '**João, cliente fiel** (30 anos, comercial de vendas perto da cafeteria, gasta R$ 32 em média, usa 3×/semana, Pix salvo no celular).\n\n**Ana, cliente de indicação** (28, primeira visita, precisa decidir se confia em 30 segundos — mantém o fluxo sem login obrigatório).\n\n**Maria, dona** (painel separado, login Google, vê pedidos pagos do dia ordenados por horário de retirada).',
  },
  {
    planType: PlanType.UX,
    blockId: 'jornadas',
    order: 2,
    title: 'Jornadas',
    body: '**Jornada crítica (João)**: recebe link via WhatsApp → abre no celular → cardápio do dia → escolhe 2 itens → total → Pagar com Pix → QR/copia-e-cola → paga → volta ao app → confirmação com código 427 para 12h15.\n\n**Jornada secundária (Ana)**: antes do cardápio vê tela opcional "Cafeteria Beta, desde 2024 no bairro Cambuí" com foto da fachada (skip em 1 toque).',
  },
  {
    planType: PlanType.UX,
    blockId: 'telas',
    order: 3,
    title: 'Telas principais',
    body: '**Cliente (6 telas)**: Cardápio · Item detalhe · Carrinho · Pagamento Pix · Confirmação · Pedido pendente (acesso por link).\n\n**Maria (2 telas)**: Painel de pedidos do dia (lista ordenada por horário com chip de status) · Editor de cardápio (toggle de disponibilidade, preço inline).',
  },
  {
    planType: PlanType.UX,
    blockId: 'tokens',
    order: 4,
    title: 'Design tokens',
    body: 'Cor primária **âmbar `#f59e0b`** (herdada do avatar do projeto), neutros cinza-50 a cinza-900, tipografia system fonts, raio 12px em cards (mais acolhedor), sombra suave em cards interativos.\n\nFeedback: verde sucesso, amarelo atenção, vermelho erro. Tokens exportados como JSON para alimentar Tailwind config.',
  },
]

export const MARIA_TECH_BLOCKS: MariaPlanBlock[] = [
  {
    planType: PlanType.TECNICO,
    blockId: 'stack',
    order: 1,
    title: 'Stack',
    body: '**Next.js 15** (App Router) + TypeScript · **Prisma** ORM sobre **Postgres** no Supabase (free tier) · **Tailwind** seguindo tokens de UX · **Mercado Pago SDK Node** para Pix.\n\nHospedagem: Vercel free tier (cobre 400–1.500 pedidos/mês estimados). Sem backend separado — APIs em route handlers do Next.',
  },
  {
    planType: PlanType.TECNICO,
    blockId: 'arquitetura',
    order: 2,
    title: 'Arquitetura',
    body: 'Monolito simples, deploy único. Frontend público (cardápio + pedido) e painel da Maria coexistem no mesmo app. Auth da Maria via **Clerk** (Google SSO). Clientes finais não autenticam — identificação por código de retirada + telefone opcional.\n\nFluxo crítico: cliente confirma → API cria Order(Pending) → MP gera cobrança → webhook confirma → status Paid → painel via SSE.',
  },
  {
    planType: PlanType.TECNICO,
    blockId: 'dados',
    order: 3,
    title: 'Modelo de dados',
    body: 'Entidades: `Store` (modelada multi-tenant), `MenuItem` (nome, descrição, preço, foto, categoria, disponível), `Order` (status, total, horário retirada, código 3 dígitos, pix_id), `OrderItem` (quantidade, observação), `OperatingHour` (dia, abre, fecha).\n\nCardápio do dia = `MenuItem.disponivel = true` + regras de horário opcionais.',
  },
  {
    planType: PlanType.TECNICO,
    blockId: 'integracoes',
    order: 4,
    title: 'Integrações',
    body: '**Mercado Pago** via SDK oficial Node, chave secreta em env Vercel, webhook `/api/mp/webhook` validando assinatura.\n\nNenhuma integração com iFood, Rappi ou WhatsApp no MVP — decisão explícita da Maria para manter foco (registrada no Decision Log).',
  },
]

/** Total canônico: 14 blocos (6 NEGOCIO + 4 UX + 4 TECNICO), todos APPROVED no estado exportado. */
export const MARIA_ALL_BLOCKS: MariaPlanBlock[] = [
  ...MARIA_BUSINESS_BLOCKS,
  ...MARIA_UX_BLOCKS,
  ...MARIA_TECH_BLOCKS,
]

export const MARIA_BLOCK_STATUS: BlockStatus = BlockStatus.APPROVED

// ----------------------------------------------------------------------------
// Decision Drafts (pending, aguardam triagem na Inbox)
// ----------------------------------------------------------------------------

export interface MariaDecisionDraft {
  proposedPublicId: string
  title: string
  yStatement: string
  category: DecisionCategory
  origin: string
  trigger: string
}

export const MARIA_DECISION_DRAFTS: MariaDecisionDraft[] = [
  {
    proposedPublicId: 'CB-DEC-001',
    title: 'Não competir com delivery; foco em pedido agendado',
    yStatement:
      'No contexto do lançamento da **Cafeteria Beta Pedidos**, vendo que o problema central é captura de pedidos no rush (não logística de entrega), decidimos **não implementar delivery próprio nem integração com iFood/Rappi** no MVP, para alcançar **foco no fluxo de retirada agendada com pagamento antecipado**, aceitando que **pedidos fora da área de retirada ficam de fora e que parte da base de clientes pode querer entrega** (reavaliar em 6 meses com dados de demanda real).',
    category: DecisionCategory.PRODUTO,
    origin: 'Plano de Negócio · Visão geral',
    trigger: 'Sugerido porque você escreveu: "sem parar de atender o balcão" e "escolhe o horário de retirada".',
  },
  {
    proposedPublicId: 'CB-DEC-002',
    title: 'Sem cadastro obrigatório para cliente final',
    yStatement:
      'No contexto da jornada de pedido para **amigo do cliente fiel** que recebe indicação, vendo que a primeira visita precisa converter em < 30 segundos, decidimos **não exigir login nem cadastro do cliente final**, para alcançar **fricção mínima na primeira compra**, aceitando **perda de dados de perfil** e **reuso entre pedidos só via telefone opcional no carrinho**.',
    category: DecisionCategory.PRODUTO,
    origin: 'Plano de UX · Personas',
    trigger: 'Sugerido porque você escreveu: "mantenho a relação direta com o cliente do bairro".',
  },
]

// ----------------------------------------------------------------------------
// Risk Drafts (pending, aguardam triagem na Inbox)
// ----------------------------------------------------------------------------

export interface MariaRiskDraft {
  proposedPublicId: string
  title: string
  description: string
  trigger: string
  category: RiskCategory
  origin: string
}

export const MARIA_RISK_DRAFTS: MariaRiskDraft[] = [
  {
    proposedPublicId: 'CB-RISK-001',
    title: 'Falha de confirmação Pix pode travar a fila de retirada',
    description:
      'Se o webhook do Mercado Pago atrasar ou falhar durante o rush do almoço (12h-13h), pedidos pagos não aparecem no painel da Maria — cliente pagou e não tem como retirar, e ela não tem como validar manualmente sem interromper o balcão.',
    trigger:
      'Webhook do MP atrasar > 30s · resposta 4xx/5xx do endpoint /api/mp/webhook · diferença entre pedidos no painel e extrato MP do dia.',
    category: RiskCategory.TECNICO,
    origin: 'Plano Técnico · Integrações',
  },
  {
    proposedPublicId: 'CB-RISK-002',
    title: 'Cardápio desatualizado gera pedidos de itens indisponíveis',
    description:
      'Se a Maria esquecer de atualizar a disponibilidade dos itens no dia (principalmente salgados, que acabam no meio da tarde), clientes vão pedir e pagar por itens que já não existem — gera refund e quebra a confiança na operação.',
    trigger:
      'Pedido pago para item marcado como "disponível" mas já esgotado no balcão · reclamação do cliente chegando por WhatsApp após pagar.',
    // REPUTACAO: o vetor primário é dano de confiança do cliente (quem paga e
    // não recebe), não disputa de mercado. Mockup original usava 'Operacional'
    // (inexistente no enum). Suggestion Code-Reviewer TRC-14.7.
    category: RiskCategory.REPUTACAO,
    origin: 'Plano de UX · Telas principais',
  },
]
