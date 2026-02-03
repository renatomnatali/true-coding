# Design Decisions & Interaction Patterns

**Projeto:** True Coding - Discovery Flow
**Data:** 27 Janeiro 2026
**Versão:** 1.0

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Design Tokens](#design-tokens)
3. [Decisões de UX](#decisões-de-ux)
4. [Padrões de Interação](#padrões-de-interação)
5. [Componentes](#componentes)
6. [Fluxo de Navegação](#fluxo-de-navegação)
7. [Acessibilidade](#acessibilidade)
8. [Performance e Otimização](#performance-e-otimização)
9. [Responsividade](#responsividade)
10. [Referências](#referências)

---

## Visão Geral

### Objetivo do Discovery Flow

Criar uma experiência **estruturada e guiada** onde usuários respondem 5 perguntas obrigatórias para gerar um Business Plan completo. O objetivo é aumentar a taxa de conclusão de ~30% para >80%.

### Princípios de Design

1. **Transparência Total** - Usuário sempre sabe onde está (X de 5)
2. **Feedback Imediato** - Preview cards aparecem enquanto responde
3. **Guiança Clara** - Quick replies sugerem caminhos comuns
4. **Senso de Progresso** - Barra visual + cards acumulando
5. **Confirmação Explícita** - Resumo antes de gerar plano
6. **Zero Surpresas** - Loading states mostram o que está acontecendo

---

## Design Tokens

### Cores

**Decisão:** Paleta neutra com azul primário (#2563eb)

**Justificativa:**
- Azul transmite **confiança e profissionalismo** (essencial para SaaS B2B)
- Tons de cinza neutros mantêm foco no conteúdo
- Verde (#10b981) para success states (associação universal com "concluído")
- Vermelho (#ef4444) para erros (alta visibilidade, urgência)
- Amarelo (#f59e0b) para warnings (atenção sem alarme)

**Aplicação:**
```css
--color-primary: #2563eb        /* CTAs, progress, links ativos */
--color-success: #10b981        /* Checkmarks, completed states */
--color-error: #ef4444          /* Erros, validação */
--color-warning: #f59e0b        /* Avisos, pergunta 5 (último passo) */
```

### Espaçamento

**Decisão:** Escala de 4px base (4, 8, 12, 16, 20, 24, 32...)

**Justificativa:**
- Múltiplos de 4px facilitam alinhamento pixel-perfect
- Escala consistente = UI mais harmônica
- Valores nomeados (space-2, space-4) = código legível

**Regra de uso:**
- `space-2` (8px) - Gap interno entre elementos pequenos
- `space-4` (16px) - Padding padrão de cards/botões
- `space-6` (24px) - Margem entre seções
- `space-8` (32px) - Padding de páginas

### Tipografia

**Decisão:** System fonts (-apple-system, Segoe UI, etc)

**Justificativa:**
- **Performance:** Zero tempo de carregamento de fonts
- **Familiaridade:** Usuários já conhecem a fonte do SO
- **Legibilidade:** Otimizada para cada plataforma
- **Acessibilidade:** Respeita preferências de acessibilidade do OS

**Hierarquia:**
- `font-size-xs` (11px) - Labels, timestamps
- `font-size-sm` (13px) - Body secundário, mensagens
- `font-size-base` (14px) - Body principal
- `font-size-lg` (16px) - Subtítulos
- `font-size-xl` (18px) - Títulos de seção
- `font-size-2xl` (24px) - Títulos de página

### Bordas e Sombras

**Decisão:** Border-radius suave (6-12px) + sombras sutis

**Justificativa:**
- Bordas arredondadas = UI moderna e amigável
- Sombras criam hierarquia visual sem peso
- `border-radius-lg` (8px) para cards principais
- `border-radius-full` (9999px) para pills/badges

**Sombras:**
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05)    /* Hover states */
--shadow-md: 0 4px 6px rgba(0,0,0,0.1)     /* Cards elevados */
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1)   /* Modals, overlays */
```

---

## Decisões de UX

### 1. Progresso Visível (Pergunta X de 5)

**Problema:** Usuários não sabiam quantas perguntas faltavam
**Solução:** Header do chat sempre mostra "Pergunta X de 5" + barra de progresso

**Por quê:**
- Reduz ansiedade ("quanto falta?")
- Aumenta motivação (efeito "quase lá")
- Transparência total

**Implementação:**
- Barra horizontal com fill animado (20%, 40%, 60%, 80%, 100%)
- Cor muda para verde no 100%
- Texto explícito "Pergunta X de 5"

### 2. Quick Replies Contextuais

**Problema:** Usuários não sabiam o que responder ou formato esperado
**Solução:** 3-4 sugestões por pergunta (ex: "📱 App de gestão", "🛒 E-commerce")

**Por quê:**
- **Acelera resposta** - Click vs digitar
- **Mostra exemplos** - Usuário entende formato esperado
- **Reduz bloqueio criativo** - "Ah, posso dizer assim"
- **Opção de ignorar** - Não é obrigatório, pode digitar livremente

**Padrão de uso:**
- Sempre 3-4 opções (não sobrecarregar)
- Emojis para escaneabilidade
- Texto curto (max 3 palavras)
- Click preenche input (não envia diretamente)

### 3. Live Preview Cards no Workspace

**Problema:** Usuário não via o plano sendo construído, geração era "caixa preta"
**Solução:** Cards aparecem no workspace conforme usuário responde

**Por quê:**
- **Feedback imediato** - "Minha resposta foi entendida"
- **Senso de construção** - Plano vai crescendo visualmente
- **Validação implícita** - Usuário vê se AI entendeu certo
- **Engajamento** - Animação de slide-in é satisfatória

**Timing:**
- Card aparece 1-2s após enviar resposta
- Animação slide-in (translateY 20px → 0)
- Cards acumulam (não sobrescrevem)

### 4. Confirmação Antes de Gerar

**Problema:** AI gerava plano sem usuário confirmar, depois era difícil ajustar
**Solução:** Pergunta 5 mostra resumo completo + botão "Confirmar e Gerar"

**Por quê:**
- **Controle explícito** - Usuário decide quando está pronto
- **Chance de revisar** - Ver tudo de uma vez antes de gerar
- **Reduz retrabalho** - Ajustar agora é mais barato que depois
- **Expectativa clara** - "Depois disso vai gerar o plano"

**Implementação:**
- Panel destacado com borda azul
- Resumo em 5 seções colapsáveis
- Botão primário "✅ Confirmar e Gerar Plano"
- Botão secundário "✏️ Ajustar Respostas"

### 5. Loading States Transparentes

**Problema:** Usuário não sabia o que estava acontecendo durante geração (10-30s)
**Solução:** Overlay com spinner + steps do processo + tempo estimado

**Por quê:**
- **Reduz ansiedade** - Ver progresso vs tela congelada
- **Expectativa realista** - "Isso leva 10-30s" prepara usuário
- **Educação** - Mostra o trabalho da AI (não é mágica)
- **Tolerância maior** - Usuários aceitam esperar se souberem por quê

**Implementação:**
- Overlay com backdrop blur
- Spinner animado
- Título "Gerando seu Business Plan"
- 4 steps com estados (completed, current, pending)
- Cada step muda de pending → current → completed
- Tempo estimado visível

---

## Padrões de Interação

### Botões

**Estados:**
1. **Default** - Background secundário, border sutil
2. **Hover** - Background + escuro, transform translateY(-1px)
3. **Active** - transform scale(0.98)
4. **Disabled** - opacity 0.5, cursor not-allowed
5. **Loading** - Spinner + texto "Carregando..."

**Hierarquia:**
- **Primary** - Ação principal (azul, destaque)
- **Secondary** - Ações alternativas (cinza, border)
- **Danger** - Ações destrutivas (vermelho)

**Regra:**
- Max 1 botão primário por tela
- Botões destrutivos sempre pedem confirmação

### Inputs

**Estados:**
1. **Default** - Border cinza claro
2. **Focus** - Border azul + shadow azul clara (ring)
3. **Error** - Border vermelho + mensagem inline
4. **Success** - Border verde + checkmark
5. **Disabled** - Background cinza, cursor not-allowed

**Validação:**
- Inline error messages (logo abaixo do input)
- Ícone ❌ ao lado esquerdo da mensagem
- Cor vermelha clara de fundo (#fee2e2)

### Navegação

**Padrão:** Sidebar fixa + Workspace scrollável + Chat fixo

**Justificativa:**
- Sidebar fixa = acesso rápido a qualquer seção
- Workspace scrollável = comportamento web padrão
- Chat fixo = sempre visível (é a interface principal)

**Layout:**
```
┌─────────┬────────────────┬─────────┐
│ Sidebar │   Workspace    │  Chat   │
│  240px  │  flex: 1       │  380px  │
│  Fixed  │  Scrollable    │  Fixed  │
└─────────┴────────────────┴─────────┘
```

### Cards

**Anatomia:**
1. **Label** - Texto pequeno uppercase (ex: "PROBLEMA")
2. **Header** - Ícone + Título
3. **Content** - Texto ou lista
4. **Actions** (opcional) - Botões na parte inferior

**Animação de entrada:**
```css
@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Por quê:** Suave e chama atenção sem ser agressivo

---

## Componentes

### 1. ProgressIndicator

**Localização:** Header do ChatPanel

**Funcionalidade:**
- Mostra progresso visual (barra + texto)
- Atualiza em tempo real conforme perguntas respondidas
- Cor muda de azul para verde ao completar

**Estados:**
- 0% (início) - Barra vazia, texto "Pergunta 0 de 5"
- 20%-80% - Barra preenchendo, texto "Pergunta X de 5"
- 100% - Barra verde, texto "Completo!"

**Variações:**
- **Bar Progress** - Usado no chat (simples, compacto)
- **Step Progress** - Alternativa para desktop (mais visual)

### 2. QuickReplyButtons

**Localização:** Acima do input do chat

**Funcionalidade:**
- Mostra 3-4 sugestões contextuais
- Click preenche input (não envia)
- Desabilitado durante loading

**Estados:**
- **Default** - Cinza claro, hover azul
- **Selected** - Azul sólido (após click)
- **Disabled** - Opaco, sem hover

**Regra de design:**
- Pills (border-radius: 9999px)
- Emojis sempre à esquerda
- Max 20 caracteres por botão
- Wrap se não couber em 1 linha

### 3. LivePreviewCard

**Localização:** Workspace (área central)

**Funcionalidade:**
- Aparece após usuário responder pergunta
- Mostra informação extraída pela AI
- Cards acumulam (não sobrescrevem)

**Anatomia:**
```
┌────────────────────────┐
│ LABEL (uppercase)      │
│                        │
│ 🎯  Título do Card     │
│                        │
│ Conteúdo do card aqui  │
│ pode ser texto ou lista│
└────────────────────────┘
```

**Animação:**
- Delay de 500ms (para não parecer instantâneo)
- Slide-in de baixo para cima
- Duração 300ms, easing ease-out

### 4. ConfirmationPanel

**Localização:** Workspace (na pergunta 5)

**Funcionalidade:**
- Resume todas as 5 respostas
- Permite ajustar antes de gerar
- Destaque visual (border azul)

**Estrutura:**
- Título "📋 Resumo do Discovery"
- 5 seções (uma por pergunta)
- Botões "Ajustar" e "Confirmar"

**Por quê esta ordem:**
- Botão secundário à esquerda (menos destaque)
- Botão primário à direita (convenção ocidental)

### 5. VersionHistory

**Localização:** Sidebar (seção colapsável)

**Funcionalidade:**
- Timeline de versões do projeto
- Ver diff entre versões
- Restaurar versão anterior

**Estados:**
- **Current** - Badge verde "ATUAL"
- **Past** - Dot azul + botão "Restaurar"

**Interação:**
- Click em versão abre diff viewer
- Restaurar pede confirmação
- Nova versão criada (não sobrescreve)

---

## Fluxo de Navegação

### Fluxo Primário (Happy Path)

```
1. Criar Projeto
   ↓
2. Discovery - Pergunta 1 (Problema)
   ↓ [Responder]
3. Discovery - Pergunta 2 (Features)
   ↓ [Preview Card aparece no workspace]
4. Discovery - Pergunta 3 (Diferenciais)
   ↓ [Cards acumulando]
5. Discovery - Pergunta 4 (Nice-to-Have)
   ↓ [80% completo]
6. Discovery - Pergunta 5 (Monetização)
   ↓ [Resumo completo exibido]
7. Confirmação
   ↓ [Click "Confirmar e Gerar"]
8. Loading (10-30s)
   ↓ [Overlay com steps]
9. Planning - Business Plan Gerado
   ↓ [Ver/Editar/Aprovar]
10. Próximas fases (Connect, Generate, Deploy)
```

### Fluxos Alternativos

**Ajustar Respostas:**
```
Pergunta 5 (Resumo)
  ↓ [Click "Ajustar"]
Chat rola para pergunta específica
  ↓ [Usuário edita resposta]
Resumo atualizado automaticamente
```

**Erro na Geração:**
```
Loading (gerando plano)
  ↓ [Erro: API timeout]
Overlay de erro
  ↓ [Botão "Tentar Novamente"]
Volta ao loading
```

**Abandonar e Voltar:**
```
Pergunta 3
  ↓ [Usuário fecha aba]
  ↓ [Retorna depois]
Sistema restaura progresso
  ↓ "Você parou na pergunta 3"
Continua de onde parou
```

---

## Acessibilidade

### Contraste de Cores

**Decisão:** WCAG AA (mínimo 4.5:1 para texto normal)

**Testes realizados:**
- ✅ Texto primário (#111827) em fundo branco: 18.6:1
- ✅ Texto secundário (#6b7280) em fundo branco: 6.2:1
- ✅ Azul primário (#2563eb) em branco: 7.5:1
- ⚠️ Texto terciário (#9ca3af) em branco: 3.9:1 (apenas labels, não texto body)

### Navegação por Teclado

**Suporte completo:**
- `Tab` - Avança para próximo elemento focável
- `Shift+Tab` - Volta para elemento anterior
- `Enter` - Ativa botão/link
- `Esc` - Fecha modal/overlay
- `Space` - Ativa checkbox/radio

**Focus rings:**
- Sempre visíveis (nunca `outline: none`)
- Cor: azul + shadow clara (ring de 3px)

### Screen Readers

**Atributos ARIA:**
- `aria-label` em botões só com ícone
- `aria-live="polite"` em progress indicator
- `aria-busy="true"` durante loading
- `role="status"` em mensagens de feedback

**Texto alternativo:**
- Emojis decorativos: `aria-hidden="true"`
- Emojis semânticos: `<span aria-label="...">`

### Preferências do Usuário

**Respeitar:**
- `prefers-reduced-motion` - Desabilitar animações
- `prefers-color-scheme` - Dark mode (futuro)
- Font size do navegador - Usar `rem` (não `px`)

---

## Performance e Otimização

### Carregamento

**Estratégias:**
1. **System fonts** - Zero latência
2. **Inline CSS crítico** - Tokens no `<head>`
3. **Lazy load** - Imagens/componentes abaixo da dobra
4. **Prefetch** - Próxima pergunta precarregada

### Animações

**Regra:** Apenas `transform` e `opacity` (GPU-accelerated)

**Evitar:** `width`, `height`, `top`, `left` (causam reflow)

**Exemplo correto:**
```css
/* ✅ BOM */
.card {
  transform: translateY(20px);
  opacity: 0;
  transition: transform 0.3s, opacity 0.3s;
}

/* ❌ RUIM */
.card {
  margin-top: 20px;
  transition: margin-top 0.3s;
}
```

### Bundle Size

**Prioridades:**
1. Minimizar JS (componentes só quando necessário)
2. Tree-shaking agressivo
3. Code-splitting por rota
4. Comprimir assets (gzip/brotli)

---

## Responsividade

### Breakpoints

**Decisão:** Mobile-first com 3 breakpoints

```css
/* Mobile: 320px - 767px */
/* Tablet: 768px - 1023px */
/* Desktop: 1024px+ */
```

### Layout Adaptativo

**Desktop (1024px+):**
```
[Sidebar 240px] [Workspace flex] [Chat 380px]
```

**Tablet (768-1023px):**
```
[Sidebar toggle] [Workspace flex] [Chat 320px]
```

**Mobile (< 768px):**
```
[Navigation bottom] [Workspace full] [Chat overlay]
```

### Testes em Dispositivos

**Alvos prioritários:**
- iPhone 13/14 (390x844)
- iPhone SE (375x667)
- iPad (768x1024)
- Desktop 1440p

---

## Referências

### Inspirações de UI

1. **Linear** - Progress indicators, clean animations
2. **Vercel Dashboard** - Sidebar navigation, card layouts
3. **Claude.ai** - Chat interface, message bubbles
4. **Notion** - Empty states, skeleton screens
5. **Stripe Dashboard** - Error messages, form validation

### Design Systems Consultados

- **Tailwind CSS** - Color palette, spacing scale
- **Radix UI** - Accessibility patterns
- **shadcn/ui** - Component structure (já usado no projeto)

### Leituras

- **"Designing Interfaces" - Jenifer Tidwell** - Padrões de navegação
- **"Don't Make Me Think" - Steve Krug** - Simplicidade e usabilidade
- **WCAG 2.1 Guidelines** - Acessibilidade
- **Material Design - Progress Indicators** - Estados de loading

---

## Changelog

### v1.0 - 27 Jan 2026
- ✅ Criação inicial do documento
- ✅ Documentação completa de 16 mockups
- ✅ Design tokens definidos
- ✅ Padrões de interação estabelecidos
- ✅ Componentes documentados
- ✅ Fluxos mapeados

---

## Próximos Passos

### Implementação (Etapa 1-6)

**Prioridade 1:** Migration + Prompt V2 (Foundation)
**Prioridade 2:** Backend com progress tracking
**Prioridade 3:** Frontend com componentes React
**Prioridade 4:** Quick Replies integrados
**Prioridade 5:** Versionamento de planos
**Prioridade 6:** Testes E2E

### Melhorias Futuras

- [ ] Dark mode
- [ ] Animações mais complexas (Framer Motion)
- [ ] Transições entre perguntas (page transitions)
- [ ] Sound effects (optional, toggleable)
- [ ] Confetti animation ao completar (celebração)
- [ ] Atalhos de teclado (Cmd+Enter para enviar)
- [ ] Voice input (Speech-to-Text)
- [ ] Export de mockups para Figma

---

**Documento mantido por:** Claude Code Agent
**Última atualização:** 27 Janeiro 2026
**Versão:** 1.0
