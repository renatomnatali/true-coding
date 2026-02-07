# Modelo Iterativo de Implementação - True Coding

## Visão Geral

O True Coding usa um modelo híbrido que combina prototipação completa upfront com implementação iterativa baseada em complexidade. Este documento especifica como avaliar projetos e planejar iterações de desenvolvimento.

## Princípios Fundamentais

1. **Protótipo Completo Primeiro**: Sempre gerar protótipo HTML/CSS navegável completo antes de qualquer código funcional
2. **Validação Barata**: Ajustar HTML é 10x mais rápido que refatorar React
3. **Implementação Incremental**: Codificar em iterações permite feedback contínuo
4. **Revisão Permitida**: Usuário pode revisar protótipo entre iterações
5. **Entregáveis Funcionando**: Cada iteração resulta em código deployado e testável

## Fluxo Completo

```
FASE 1: IDEATION
  → Discovery (5 perguntas)
  → Business Plan gerado

FASE 2: PLANNING
  → Technical Plan completo
  → UX Plan completo

FASE 3: PROTOTYPING
  → Gera protótipo HTML/CSS navegável COMPLETO
  → Usuário navega em TODAS as telas
  → Ajustes no protótipo até aprovação

FASE 4: COMPLEXITY ASSESSMENT
  → Analisa protótipo aprovado
  → Calcula score de complexidade
  → Define estratégia de iterações

FASE 5: IMPLEMENTATION (iterativa)
  → Iteração 1: Implementa parte 1
    ✓ Gera código
    ✓ Commit no GitHub
    ✓ Deploy na Vercel
    ✓ Testa online
    ✓ (Opcional) Ajusta protótipo se necessário

  → Iteração 2: Implementa parte 2
    ✓ Gera código incremental
    ✓ Commit no GitHub
    ✓ Deploy na Vercel
    ✓ Testa online
    ✓ (Opcional) Ajusta protótipo

  → ... continua até concluir

FASE 6: ONLINE
  → Todas as iterações concluídas
  → App completo funcionando
```

---

## Avaliação de Complexidade

### Critérios de Avaliação

#### 1. Complexidade do Schema (Peso: 35%)

| Pontos | Critério |
|--------|----------|
| 1 | 1-2 entidades (User, Post) |
| 2 | 3-4 entidades com relações simples |
| 3 | 5-7 entidades com relações médias |
| 4 | 8-12 entidades com múltiplas relações |
| 5 | 13+ entidades com relações complexas (many-to-many, self-referential) |

**Exemplos:**
- **1 ponto**: Blog pessoal (User, Post)
- **3 pontos**: E-commerce (User, Product, Order, Cart, Category)
- **5 pontos**: Marketplace (User, Product, Order, Review, Store, Category, Shipping, Payment, Notification)

#### 2. Integrações Externas (Peso: 25%)

| Pontos | Critério |
|--------|----------|
| 0 | Nenhuma integração |
| 1 | 1 integração simples (Clerk, Stripe básico) |
| 2 | 2-3 integrações (Auth + Payment + Email) |
| 3 | 4-5 integrações com APIs complexas |
| 4 | 6+ integrações ou APIs com webhooks |

**Exemplos:**
- **0 pontos**: App offline, CRUD puro
- **2 pontos**: Clerk (auth) + Stripe (checkout) + Resend (email)
- **4 pontos**: Auth + Payment + Shipping API + SMS + Push Notifications + Analytics

#### 3. Features Real-Time (Peso: 20%)

| Pontos | Critério |
|--------|----------|
| 0 | Nenhuma feature real-time |
| 2 | Notifications simples (polling) |
| 3 | Chat ou tracking com WebSocket/Pusher |
| 4 | Múltiplas features real-time (chat + notifications + live updates) |

**Exemplos:**
- **0 pontos**: Blog, portfolio, CRUD básico
- **3 pontos**: Delivery tracking (mapa ao vivo)
- **4 pontos**: Chat + notifications + collaborative editing

#### 4. Complexidade de UI (Peso: 15%)

| Pontos | Critério |
|--------|----------|
| 1 | UI simples (formulários, listas) |
| 2 | UI moderada (dashboards, filtros, tabs) |
| 3 | UI complexa (drag-and-drop, modals aninhados) |
| 4 | UI muito complexa (editor visual, canvas, animações avançadas) |

**Exemplos:**
- **1 ponto**: Landing page + formulário de contato
- **2 pontos**: Dashboard com gráficos e filtros
- **4 pontos**: Figma-like editor, Notion-like interface

#### 5. Autenticação e Autorização (Peso: 5%)

| Pontos | Critério |
|--------|----------|
| 0 | Sem autenticação |
| 1 | Auth básico (Clerk single provider) |
| 2 | Multi-provider OAuth + roles básicos |
| 3 | RBAC complexo, multi-tenancy |

### Cálculo do Score Final

```
Score = (Schema × 0.35) + (Integrações × 0.25) + (RealTime × 0.20) + (UI × 0.15) + (Auth × 0.05)

Score normalizado = (Score / 5) × 100  // Convertido para 0-100
```

### Classificação de Complexidade

| Score | Classificação | Estratégia |
|-------|---------------|------------|
| 0-30 | **SIMPLES** | MVP Único (1 iteração) |
| 31-55 | **MÉDIO** | 2-3 iterações |
| 56-75 | **COMPLEXO** | 4-5 iterações |
| 76-100 | **MUITO COMPLEXO** | 6+ iterações ou recomendar simplificação |

---

## Estratégias de Implementação

### SIMPLES (Score 0-30): MVP Único

**Características:**
- Schema: 1-3 entidades
- Integrações: 0-1
- Real-time: Não
- UI: Simples a moderada
- Auth: Básico ou nenhum

**Estratégia:**
- 1 iteração única
- Implementa tudo de uma vez
- Deploy direto após geração
- Duração estimada: 10-15 minutos

**Exemplo - Blog Pessoal:**
```
Iteração Única:
  ✓ Auth (Clerk)
  ✓ Schema (User, Post)
  ✓ CRUD de posts
  ✓ Lista pública de posts
  ✓ UI completa
  ✓ Deploy
```

**Telas do Protótipo:**
- Home (lista de posts)
- Post individual
- Admin (criar/editar post)
- Login

---

### MÉDIO (Score 31-55): 2-3 Iterações

**Características:**
- Schema: 4-7 entidades
- Integrações: 2-3
- Real-time: Opcional
- UI: Moderada a complexa
- Auth: Multi-provider ou RBAC básico

**Estratégia:**
- 2-3 iterações planejadas
- Cada iteração = módulo funcional
- Deploy e teste entre iterações
- Duração estimada: 20-35 minutos total

**Exemplo - E-commerce:**

**Iteração 1 (Fundação):**
```
Duração: ~12 min
  ✓ Auth (Clerk)
  ✓ Schema base (User, Product, Category)
  ✓ Listagem de produtos
  ✓ Detalhes do produto
  ✓ UI básica
  → Deploy e TESTE
```

**Iteração 2 (Transações):**
```
Duração: ~15 min
  ✓ Schema (Cart, Order, OrderItem)
  ✓ Carrinho de compras
  ✓ Checkout flow
  ✓ Integração Stripe (pagamento)
  ✓ Confirmação de pedido
  → Deploy e TESTE
```

**Iteração 3 (Admin):**
```
Duração: ~8 min
  ✓ Dashboard admin
  ✓ Gestão de produtos (CRUD)
  ✓ Visualização de pedidos
  ✓ Relatórios básicos
  → Deploy FINAL
```

**Telas do Protótipo:**
- Home (vitrine)
- Catálogo (filtros, categorias)
- Produto (detalhes, adicionar ao carrinho)
- Carrinho
- Checkout (formulário + Stripe)
- Confirmação
- Minhas compras
- Admin (produtos, pedidos)

---

### COMPLEXO (Score 56-75): 4-5 Iterações

**Características:**
- Schema: 8-12 entidades
- Integrações: 4-5
- Real-time: Sim
- UI: Complexa
- Auth: RBAC + multi-tenancy

**Estratégia:**
- 4-5 iterações modulares
- Cada iteração = feature completa
- Revisão de protótipo entre iterações permitida
- Duração estimada: 40-60 minutos total

**Exemplo - App Delivery (True Coding):**

**Iteração 1 (Auth + Base):**
```
Duração: ~10 min
  ✓ Auth multi-role (Clerk)
  ✓ Schema (User, Restaurant, MenuItem, Category)
  ✓ Listagem de restaurantes
  ✓ Menu digital
  ✓ UI base
  → Deploy e TESTE
```

**Iteração 2 (Pedidos):**
```
Duração: ~12 min
  ✓ Schema (Order, OrderItem, Cart)
  ✓ Fluxo de pedido completo
  ✓ Carrinho
  ✓ Confirmação
  ✓ Dashboard de pedidos (restaurante)
  → Deploy e TESTE
```

**Iteração 3 (Pagamentos):**
```
Duração: ~15 min
  ✓ Schema (Payment, Transaction)
  ✓ Integração Stripe (cartão)
  ✓ Integração Mercado Pago (PIX)
  ✓ Webhook handling
  ✓ Confirmação de pagamento
  → Deploy e TESTE
```

**Iteração 4 (Real-Time Tracking):**
```
Duração: ~18 min
  ✓ Schema (DeliveryTracking, Location)
  ✓ Integração Pusher
  ✓ Mapa de rastreamento (Google Maps)
  ✓ Updates em tempo real
  ✓ Notificações
  → Deploy e TESTE
```

**Iteração 5 (Admin + Extras):**
```
Duração: ~10 min
  ✓ Dashboard admin completo
  ✓ Relatórios e analytics
  ✓ Gestão de menu (CRUD avançado)
  ✓ Configurações do restaurante
  → Deploy FINAL
```

**Telas do Protótipo:**
- Home (lista de restaurantes)
- Restaurante (menu completo)
- Carrinho
- Checkout (dados + pagamento)
- Acompanhamento (mapa ao vivo)
- Histórico de pedidos
- Dashboard restaurante (pedidos)
- Editor de menu
- Admin (relatórios, configurações)

---

### MUITO COMPLEXO (Score 76-100): 6+ Iterações

**Características:**
- Schema: 13+ entidades
- Integrações: 6+ APIs
- Real-time: Múltiplas features
- UI: Muito complexa (editores, canvas)
- Auth: RBAC avançado, multi-tenancy

**Estratégia:**
- 6+ iterações ou **recomendar simplificação**
- Avisar usuário sobre duração (60+ minutos)
- Sugerir dividir em 2 projetos separados
- Cada iteração = módulo isolado

**Exemplo - Marketplace Multi-Vendor:**

**Recomendação ao usuário:**
```
⚠️ Projeto Muito Complexo Detectado

Seu projeto tem complexidade score de 82/100.
Isso resultaria em 7+ iterações e ~90 minutos de implementação.

Recomendações:
1. Começar com MVP mais simples (score 40-50)
2. Adicionar features gradualmente em versões futuras
3. Dividir em 2 projetos (Marketplace Cliente + Admin Vendedor)

Quer que eu sugira um escopo reduzido?
```

---

## Decisão de Iterações - Algoritmo

```typescript
interface ComplexityScore {
  schema: number        // 1-5
  integrations: number  // 0-4
  realtime: number      // 0-4
  ui: number           // 1-4
  auth: number         // 0-3
}

function calculateScore(project: ComplexityScore): number {
  const weighted =
    (project.schema * 0.35) +
    (project.integrations * 0.25) +
    (project.realtime * 0.20) +
    (project.ui * 0.15) +
    (project.auth * 0.05)

  return (weighted / 5) * 100  // Normalize to 0-100
}

function determineStrategy(score: number): Strategy {
  if (score <= 30) {
    return {
      classification: 'SIMPLES',
      iterations: 1,
      estimatedTime: '10-15 min',
      strategy: 'mvp-único'
    }
  }

  if (score <= 55) {
    return {
      classification: 'MÉDIO',
      iterations: Math.ceil((score - 30) / 10) + 1,  // 2-3 iterations
      estimatedTime: '20-35 min',
      strategy: 'modular'
    }
  }

  if (score <= 75) {
    return {
      classification: 'COMPLEXO',
      iterations: Math.ceil((score - 55) / 5) + 3,  // 4-5 iterations
      estimatedTime: '40-60 min',
      strategy: 'incremental'
    }
  }

  return {
    classification: 'MUITO COMPLEXO',
    iterations: Math.ceil((score - 75) / 4) + 5,  // 6+ iterations
    estimatedTime: '60+ min',
    strategy: 'recommend-simplification',
    warning: true
  }
}
```

---

## Divisão de Features por Iteração

### Princípios de Divisão

1. **Vertical Slicing**: Cada iteração entrega valor end-to-end
2. **Dependências Primeiro**: Features que outras dependem vêm antes
3. **Core First**: Funcionalidades must-have nas primeiras iterações
4. **Testabilidade**: Cada iteração deve ser testável independentemente

### Exemplo de Divisão - App Delivery (Score 62)

**Análise:**
- Schema: 9 entidades (Score: 4)
- Integrações: 4 (Clerk, Stripe, Pusher, Maps) (Score: 3)
- Real-time: Tracking (Score: 3)
- UI: Dashboard + Mapa (Score: 3)
- Auth: Multi-role (Score: 2)

**Score Final:** (4×0.35) + (3×0.25) + (3×0.20) + (3×0.15) + (2×0.05) = 3.1 → 62/100

**Estratégia:** COMPLEXO → 4 iterações

**Iteração 1 - Fundação (Must-Have)**
```
Features:
  - Auth multi-role
  - Listagem de restaurantes
  - Menu digital
  - Adicionar ao carrinho

Schema:
  - User (roles: customer, restaurant)
  - Restaurant
  - MenuItem
  - Category
  - Cart

Deploy: MVP navegável com auth e menu
```

**Iteração 2 - Pedidos (Must-Have)**
```
Features:
  - Fluxo completo de pedido
  - Confirmação
  - Dashboard restaurante (lista pedidos)
  - Status do pedido

Schema:
  - Order
  - OrderItem

Deploy: Usuário pode fazer pedido, restaurante vê pedidos
```

**Iteração 3 - Pagamentos (Should-Have)**
```
Features:
  - Checkout com Stripe
  - Checkout com PIX (Mercado Pago)
  - Confirmação de pagamento
  - Webhook handling

Schema:
  - Payment
  - Transaction

Deploy: Fluxo de pagamento funcionando
```

**Iteração 4 - Tracking (Nice-to-Have)**
```
Features:
  - Mapa de rastreamento
  - Updates em tempo real (Pusher)
  - Notificações de status

Schema:
  - DeliveryTracking
  - Location

Deploy: App completo com tracking ao vivo
```

---

## UI para o Usuário - Complexity Assessment

### Tela de Análise

Após protótipo aprovado, mostrar:

```
┌────────────────────────────────────────────────────┐
│  🔍 Analisando Complexidade do Projeto...         │
│                                                    │
│  ✓ Schema analisado: 9 entidades                  │
│  ✓ Integrações detectadas: 4                      │
│  ✓ Features real-time: Sim (tracking)             │
│  ✓ Complexidade de UI: Moderada                   │
│  ✓ Autenticação: Multi-role                       │
│                                                    │
│  Score de Complexidade: 62/100 (COMPLEXO)         │
│                                                    │
│  📊 Recomendação:                                  │
│  Implementar em 4 iterações incrementais           │
│                                                    │
│  Estimativa: 40-50 minutos                         │
│                                                    │
│  [Ver Plano de Iterações]  [Começar Iteração 1]   │
└────────────────────────────────────────────────────┘
```

### Tela de Plano de Iterações

```
┌────────────────────────────────────────────────────┐
│  📋 Plano de Implementação - 4 Iterações           │
│                                                    │
│  Iteração 1 - Fundação                            │
│  ├─ Auth + Restaurantes + Menu                    │
│  ├─ 5 entidades, 0 integrações                    │
│  └─ Duração: ~10 min                              │
│                                                    │
│  Iteração 2 - Pedidos                             │
│  ├─ Fluxo completo de pedido                      │
│  ├─ 2 entidades novas                             │
│  └─ Duração: ~12 min                              │
│                                                    │
│  Iteração 3 - Pagamentos                          │
│  ├─ Stripe + Mercado Pago                         │
│  ├─ 2 entidades, 2 integrações                    │
│  └─ Duração: ~15 min                              │
│                                                    │
│  Iteração 4 - Tracking                            │
│  ├─ Mapa ao vivo + Notificações                   │
│  ├─ 2 entidades, 2 integrações (Pusher, Maps)    │
│  └─ Duração: ~18 min                              │
│                                                    │
│  ℹ️ Entre iterações você pode:                     │
│  • Testar o que já foi implementado               │
│  • Pedir ajustes no protótipo                     │
│  • Continuar quando quiser                        │
│                                                    │
│  [Aprovar Plano]  [Ajustar Escopo]                │
└────────────────────────────────────────────────────┘
```

---

## Revisão de Protótipo Entre Iterações

### Quando Permitir Revisão

Usuário pode revisar protótipo:
- ✅ **Entre iterações**: "Quero mudar o layout do dashboard"
- ✅ **Após deploy de iteração**: "Vi funcionando e quero ajustar o fluxo"
- ❌ **Durante geração**: Não interromper geração em progresso

### Fluxo de Revisão

```
Iteração 1 → Deploy → Teste → [Revisão Protótipo?]
                                    ↓
                              [Sim] → Ajusta protótipo HTML
                                    ↓
                              Iteração 2 usa protótipo atualizado
```

**Exemplo:**

Usuário após Iteração 1:
> "O dashboard de pedidos está confuso. Quero reorganizar."

True Coding:
> "Vou ajustar o protótipo do dashboard. Me mostra como você quer?"

Usuário descreve → True Coding ajusta HTML → Mostra preview

Usuário aprova → Iteração 2 implementa versão atualizada

---

## Benefícios do Modelo Iterativo

### Para Projetos Simples (1 iteração)
- ✅ Rápido (10-15 min do zero ao deploy)
- ✅ Sem overhead de planejamento
- ✅ Ideal para MVPs e testes de hipótese

### Para Projetos Médios (2-3 iterações)
- ✅ Feedback rápido (vê parte funcionando em 15 min)
- ✅ Pode ajustar direção entre iterações
- ✅ Menor risco que implementação única grande
- ✅ Duração total razoável (20-35 min)

### Para Projetos Complexos (4+ iterações)
- ✅ Entregas incrementais de valor
- ✅ Testa hipóteses cedo (auth + core antes de tracking)
- ✅ Pode parar e revisar a qualquer momento
- ✅ Protótipo pode ser ajustado baseado em feedback real
- ✅ Menor chance de "tudo ou nada" (já tem algo funcionando)

---

## Comparação: Modelo Antigo vs Novo

### Modelo Antigo (Sequencial)

```
Discovery → Business Plan → Technical Plan → UX Plan
  → Gera TUDO de uma vez
  → Se erro na metade, perdeu tudo
  → Sem validação intermediária
  → Duração: 30-60 min sem feedback
```

**Problemas:**
- ❌ Alto risco de erro catastrófico
- ❌ Usuário não vê nada até o final
- ❌ Se desistir no meio, zero valor entregue
- ❌ Difícil ajustar após ver funcionando

### Modelo Novo (Iterativo)

```
Discovery → Business Plan → Technical Plan → UX Plan
  → Gera Protótipo HTML COMPLETO
  → Usuário valida TODO o protótipo
  → Aprova
  → Complexity Assessment
  → Iteração 1 (10-15 min) → Deploy → TESTE
  → Iteração 2 (10-15 min) → Deploy → TESTE
  → ...
```

**Vantagens:**
- ✅ Protótipo valida UX antes de codar
- ✅ Cada iteração = algo funcionando
- ✅ Feedback contínuo
- ✅ Pode parar a qualquer momento com valor
- ✅ Ajustes permitidos entre iterações

---

## Casos de Uso Especiais

### Caso 1: Usuário Quer Pausar

**Cenário:** Iteração 1 concluída, usuário quer pausar.

**Solução:**
```
✅ Iteração 1 completa e deployada
⏸️ Projeto pausado

Você tem:
• Código no GitHub
• App funcionando em deliverypro.vercel.app
• Auth + Menu digital rodando

Próxima iteração (Pedidos) esperando quando quiser continuar.

[Continuar Agora]  [Voltar Depois]
```

### Caso 2: Erro Durante Iteração

**Cenário:** Iteração 2 falha no meio.

**Solução:**
```
❌ Erro na Iteração 2 (Pedidos)

✅ Iteração 1 ainda funciona:
   deliverypro.vercel.app (Auth + Menu)

Opções:
1. Tentar Iteração 2 novamente
2. Simplificar Iteração 2 (remover features)
3. Pular Iteração 2 e ir para Iteração 3

[Tentar Novamente]  [Simplificar]  [Pular]
```

### Caso 3: Usuário Quer Adicionar Feature

**Cenário:** Após Iteração 2, usuário quer adicionar cupons de desconto.

**Solução:**
```
💡 Nova Feature: Sistema de Cupons

Vou recalcular o plano de iterações:

Plano Original:
  Iteração 3: Pagamentos
  Iteração 4: Tracking

Novo Plano:
  Iteração 3: Pagamentos
  Iteração 4: Cupons (NOVA)
  Iteração 5: Tracking

Isso adiciona +12 min ao total.

[Aprovar Novo Plano]  [Adicionar Depois]
```

---

## Implementação Técnica

### Armazenamento do Plano de Iterações

```prisma
model Project {
  // ... campos existentes

  complexityScore    Int?
  iterationStrategy  String?  // 'mvp-único', 'modular', 'incremental'
  totalIterations    Int?
  currentIteration   Int?     @default(1)
  iterationPlan      Json?    @db.JsonB
}
```

**Estrutura do iterationPlan:**
```json
{
  "score": 62,
  "classification": "COMPLEXO",
  "totalIterations": 4,
  "estimatedTime": "40-50 min",
  "iterations": [
    {
      "number": 1,
      "name": "Fundação",
      "description": "Auth + Restaurantes + Menu",
      "features": ["auth", "restaurant-list", "menu-digital", "cart"],
      "entities": ["User", "Restaurant", "MenuItem", "Category", "Cart"],
      "integrations": ["clerk"],
      "estimatedTime": "10 min",
      "status": "completed",
      "deployUrl": "https://deliverypro-iter1.vercel.app",
      "completedAt": "2026-01-29T14:00:00Z"
    },
    {
      "number": 2,
      "name": "Pedidos",
      "description": "Fluxo completo de pedido",
      "features": ["order-flow", "order-dashboard"],
      "entities": ["Order", "OrderItem"],
      "integrations": [],
      "estimatedTime": "12 min",
      "status": "in_progress",
      "startedAt": "2026-01-29T14:15:00Z"
    },
    {
      "number": 3,
      "name": "Pagamentos",
      "description": "Stripe + Mercado Pago",
      "features": ["stripe-checkout", "pix-payment", "webhooks"],
      "entities": ["Payment", "Transaction"],
      "integrations": ["stripe", "mercadopago"],
      "estimatedTime": "15 min",
      "status": "pending"
    },
    {
      "number": 4,
      "name": "Tracking",
      "description": "Mapa ao vivo + Notificações",
      "features": ["realtime-tracking", "map", "notifications"],
      "entities": ["DeliveryTracking", "Location"],
      "integrations": ["pusher", "google-maps"],
      "estimatedTime": "18 min",
      "status": "pending"
    }
  ]
}
```

---

## Conclusão

O modelo iterativo do True Coding oferece:

1. **Validação Upfront**: Protótipo completo antes de qualquer código
2. **Flexibilidade**: Implementação adaptada à complexidade
3. **Feedback Contínuo**: Deploy e teste entre iterações
4. **Menor Risco**: Valor entregue progressivamente
5. **Revisão Permitida**: Ajustes no protótipo quando necessário

Este modelo maximiza a probabilidade de sucesso enquanto minimiza retrabalho e frustração do usuário.
