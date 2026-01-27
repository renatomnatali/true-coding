# Implementation Guide

**Como transformar os mockups em código React mantendo fidelidade visual**

---

## 🎯 Objetivo

Este guia garante que o código React implementado seja **pixel-perfect** com os mockups HTML/CSS.

---

## 📋 Checklist Pré-Implementação

Antes de começar a codar qualquer componente:

- [ ] Mockup HTML revisado e aprovado
- [ ] Design tokens documentados
- [ ] Estados do componente identificados
- [ ] Animações especificadas
- [ ] Acessibilidade validada
- [ ] Responsividade planejada

---

## 🎨 Design Tokens → Tailwind CSS

### Mapeamento de Cores

**Mockup (CSS Variables):**
```css
--color-primary: #2563eb
--color-success: #10b981
--color-error: #ef4444
--color-warning: #f59e0b
```

**React (Tailwind):**
```tsx
// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: '#2563eb',
    hover: '#1d4ed8',
    light: '#dbeafe',
  },
  success: {
    DEFAULT: '#10b981',
    hover: '#059669',
    light: '#d1fae5',
  },
  // ... etc
}

// Uso:
<button className="bg-primary hover:bg-primary-hover">
```

### Mapeamento de Espaçamento

**Mockup:**
```css
--space-2: 8px
--space-4: 16px
--space-6: 24px
```

**React:**
```tsx
// Tailwind já usa múltiplos de 4px:
space-2 → p-2 (8px)
space-4 → p-4 (16px)
space-6 → p-6 (24px)
```

### Mapeamento de Tipografia

**Mockup:**
```css
--font-size-sm: 13px
--font-size-base: 14px
--font-size-lg: 16px
```

**React:**
```tsx
// tailwind.config.ts
fontSize: {
  xs: '11px',
  sm: '13px',
  base: '14px',
  lg: '16px',
  xl: '18px',
  '2xl': '24px',
  '3xl': '30px',
}

// Uso:
<p className="text-sm">
```

---

## 🧩 Componentes React

### 1. ProgressIndicator

**Mockup:** `components/progress-indicator.html`

**React Component:**
```tsx
// src/components/project/ProgressIndicator.tsx

interface ProgressIndicatorProps {
  current: number;  // 1-5
  total: number;    // sempre 5
}

export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  const percentage = (current / total) * 100;
  const isComplete = current === total;

  return (
    <div className="flex items-center gap-2 text-sm text-secondary">
      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isComplete ? "bg-success" : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn(
        "font-medium whitespace-nowrap",
        isComplete ? "text-success" : "text-primary"
      )}>
        {isComplete ? "Completo!" : `Pergunta ${current} de ${total}`}
      </span>
    </div>
  );
}
```

**Diferenças do mockup:**
- Usar `cn()` helper (shadcn) para classes condicionais
- Usar Tailwind em vez de CSS custom
- Props tipadas com TypeScript

**Fidelidade:**
- ✅ Mesma altura (4px → h-1)
- ✅ Mesma animação (transition-all duration-500)
- ✅ Mesmas cores (bg-primary, bg-success)
- ✅ Mesmo comportamento (percentual calculado)

---

### 2. QuickReplyButtons

**Mockup:** `components/quick-replies.html`

**React Component:**
```tsx
// src/components/project/QuickReplyButtons.tsx

interface QuickReplyButtonsProps {
  suggestions: string[];           // ["📱 App de gestão", "🛒 E-commerce"]
  onSelect: (text: string) => void; // Callback ao clicar
  disabled?: boolean;               // Durante loading
}

export function QuickReplyButtons({
  suggestions,
  onSelect,
  disabled = false
}: QuickReplyButtonsProps) {
  const [selected, setSelected] = React.useState<string | null>(null);

  const handleClick = (text: string) => {
    setSelected(text);
    onSelect(text);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium text-tertiary uppercase tracking-wide">
        Sugestões rápidas
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((text) => (
          <button
            key={text}
            onClick={() => handleClick(text)}
            disabled={disabled}
            className={cn(
              "px-4 py-2 rounded-full text-sm transition-all",
              "border border-border bg-secondary",
              "hover:bg-primary-light hover:border-primary hover:text-primary",
              "active:scale-98",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              selected === text && "bg-primary border-primary text-white font-medium"
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Fidelidade:**
- ✅ Border-radius pill (rounded-full)
- ✅ Hover states (bg, border, text color)
- ✅ Active scale (active:scale-98 = scale(0.98))
- ✅ Disabled state (opacity-50)
- ✅ Selected state (bg-primary, white text)

---

### 3. LivePreviewCard

**Mockup:** `components/live-preview.html`

**React Component:**
```tsx
// src/components/project/LivePreviewCard.tsx

interface LivePreviewCardProps {
  label: string;       // "PROBLEMA", "FEATURES CORE"
  icon: string;        // "🎯", "⚡"
  title: string;       // "Gestão de Tarefas para Times"
  content: React.ReactNode;  // Texto ou lista
}

export function LivePreviewCard({
  label,
  icon,
  title,
  content
}: LivePreviewCardProps) {
  return (
    <div className="bg-white border border-border rounded-lg p-5 animate-slide-in">
      <div className="text-xs font-medium text-tertiary uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center text-xl">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-primary">
          {title}
        </h3>
      </div>
      <div className="text-base text-primary leading-relaxed">
        {content}
      </div>
    </div>
  );
}
```

**Animação (tailwind.config.ts):**
```ts
keyframes: {
  'slide-in': {
    '0%': { opacity: '0', transform: 'translateY(20px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' }
  }
},
animation: {
  'slide-in': 'slide-in 0.3s ease-out'
}
```

**Fidelidade:**
- ✅ Padding 20px (p-5)
- ✅ Border radius 8px (rounded-lg)
- ✅ Ícone 40x40px (w-10 h-10)
- ✅ Animação slide-in (custom animation)
- ✅ Hierarquia tipográfica (xs, lg, base)

---

### 4. LoadingOverlay

**Mockup:** `discovery/06-gerando.html`

**React Component:**
```tsx
// src/components/project/LoadingOverlay.tsx

interface LoadingStep {
  label: string;
  status: 'pending' | 'current' | 'completed';
}

interface LoadingOverlayProps {
  title: string;
  description: string;
  steps: LoadingStep[];
}

export function LoadingOverlay({ title, description, steps }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-modal flex items-center justify-center animate-fade-in">
      <div className="text-center max-w-lg p-8">
        {/* Spinner */}
        <div className="w-20 h-20 mx-auto mb-6 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />

        {/* Title */}
        <h2 className="text-2xl font-bold text-primary mb-3">
          {title}
        </h2>

        {/* Description */}
        <p className="text-base text-secondary leading-relaxed mb-6">
          {description}
        </p>

        {/* Steps */}
        <div className="bg-secondary rounded-lg p-5 text-left">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-center gap-3 py-3 border-b border-border last:border-b-0"
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-sm",
                step.status === 'completed' && "bg-success-light text-success",
                step.status === 'current' && "bg-primary-light text-primary animate-pulse",
                step.status === 'pending' && "bg-gray-200 text-gray-500"
              )}>
                {step.status === 'completed' ? '✓' : step.status === 'current' ? '⏳' : '○'}
              </div>
              <div className={cn(
                "text-sm text-primary",
                step.status === 'completed' && "text-secondary"
              )}>
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Uso:**
```tsx
<LoadingOverlay
  title="Gerando seu Business Plan"
  description="Analisando suas respostas e criando um plano detalhado. Isso leva cerca de 10-30 segundos."
  steps={[
    { label: 'Analisando problema e público-alvo', status: 'completed' },
    { label: 'Estruturando features e roadmap', status: 'completed' },
    { label: 'Definindo estratégia de monetização', status: 'current' },
    { label: 'Criando documento final', status: 'pending' }
  ]}
/>
```

**Fidelidade:**
- ✅ Backdrop blur (backdrop-blur-sm)
- ✅ Spinner 80x80px (w-20 h-20)
- ✅ Steps com ícones (✓, ⏳, ○)
- ✅ Pulse animation no current step
- ✅ Z-index alto (z-modal)

---

## 🔄 Estados dos Componentes

### Padrão de Estados

**Mockup mostra 5 estados:**
1. Default
2. Hover
3. Active
4. Disabled
5. Loading

**React deve implementar todos:**
```tsx
<button
  className={cn(
    // Default
    "bg-secondary border-border",

    // Hover
    "hover:bg-primary-light hover:border-primary",

    // Active
    "active:scale-98",

    // Disabled
    "disabled:opacity-50 disabled:cursor-not-allowed",

    // Loading
    isLoading && "cursor-wait opacity-70"
  )}
  disabled={disabled || isLoading}
>
  {isLoading ? <Spinner /> : children}
</button>
```

---

## ✨ Animações

### Mapeamento de Animações

**Mockup usa:**
```css
@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
animation: slideIn 0.3s ease-out;
```

**React (Tailwind):**
```ts
// tailwind.config.ts
keyframes: {
  'slide-in': {
    from: { opacity: '0', transform: 'translateY(20px)' },
    to: { opacity: '1', transform: 'translateY(0)' }
  },
  'fade-in': {
    from: { opacity: '0' },
    to: { opacity: '1' }
  },
  'spin': {
    to: { transform: 'rotate(360deg)' }
  }
},
animation: {
  'slide-in': 'slide-in 0.3s ease-out',
  'fade-in': 'fade-in 0.3s ease-out',
  'spin': 'spin 0.8s linear infinite'
}

// Uso:
<div className="animate-slide-in">...</div>
```

### Regra: Apenas Transform + Opacity

❌ **NUNCA:**
```tsx
// Causa reflow!
<div style={{ marginTop: isOpen ? 0 : -100 }}>
```

✅ **SEMPRE:**
```tsx
// GPU-accelerated
<div className={cn(
  "transition-transform duration-300",
  isOpen ? "translate-y-0" : "-translate-y-full"
)}>
```

---

## 🎭 Responsividade

### Breakpoints Tailwind

**Mockup:** 3 breakpoints
**React:** Usar Tailwind responsive prefixes

```tsx
<div className={cn(
  // Mobile (default)
  "flex-col",

  // Tablet (768px+)
  "md:flex-row md:gap-4",

  // Desktop (1024px+)
  "lg:grid lg:grid-cols-3 lg:gap-6"
)}>
```

### Layout Adaptativo

**Desktop:**
```tsx
<div className="flex h-screen">
  <Sidebar className="w-60" />
  <Workspace className="flex-1" />
  <Chat className="w-96" />
</div>
```

**Mobile:**
```tsx
<div className="flex flex-col h-screen">
  <Workspace className="flex-1" />
  <Chat className="fixed bottom-0 inset-x-0" />
</div>
```

---

## ♿ Acessibilidade

### Focus Rings

**Mockup:**
```css
:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
```

**React:**
```tsx
<input className="
  border border-border
  focus:outline-none
  focus:border-primary
  focus:ring-4
  focus:ring-primary-light
" />
```

### ARIA Attributes

```tsx
// Progress indicator
<div
  role="progressbar"
  aria-valuenow={current}
  aria-valuemin={1}
  aria-valuemax={total}
  aria-label={`Pergunta ${current} de ${total}`}
>

// Loading overlay
<div
  role="status"
  aria-live="polite"
  aria-busy="true"
>

// Botões só com ícone
<button aria-label="Fechar">
  <X />
</button>
```

---

## 🧪 Testes de Fidelidade Visual

### Checklist por Componente

Após implementar, validar:

- [ ] **Cores** - Exatamente as mesmas do mockup
- [ ] **Espaçamentos** - Padding/margin idênticos
- [ ] **Tipografia** - Font-size, weight, line-height
- [ ] **Bordas** - Radius, width, color
- [ ] **Sombras** - Blur, spread, offset, color
- [ ] **Animações** - Duração, easing, propriedades
- [ ] **Estados** - Hover, active, disabled, loading
- [ ] **Responsividade** - Breakpoints funcionando
- [ ] **Acessibilidade** - Focus, ARIA, keyboard nav

### Ferramenta: Pixel Diff

```bash
# Tirar screenshot do mockup HTML
# Tirar screenshot do componente React
# Comparar pixel-by-pixel

npx pixelmatch mockup.png react.png diff.png
```

---

## 📦 Estrutura de Arquivos

```
src/components/project/
├── ProgressIndicator.tsx      # Barra "Pergunta X de 5"
├── QuickReplyButtons.tsx      # Sugestões contextuais
├── LivePreviewCard.tsx        # Cards no workspace
├── ConfirmationPanel.tsx      # Resumo final
├── LoadingOverlay.tsx         # Overlay com steps
├── VersionHistory.tsx         # Timeline de versões
│
├── ChatPanel.tsx              # Chat principal (já existe)
├── WorkspacePanel.tsx         # Workspace principal (já existe)
├── ProjectSidebar.tsx         # Sidebar de navegação (já existe)
│
└── phases/
    ├── DiscoveryPhase.tsx     # Orquestra discovery
    ├── PlanningPhase.tsx      # Visualiza/edita plano
    └── ...
```

---

## 🚦 Workflow de Implementação

### 1. Criar Component Stub

```tsx
// src/components/project/ProgressIndicator.tsx
export function ProgressIndicator() {
  return <div>TODO: Implement</div>;
}
```

### 2. Adicionar Props + Types

```tsx
interface ProgressIndicatorProps {
  current: number;
  total: number;
}

export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  // ...
}
```

### 3. Implementar Markup

Copiar estrutura HTML do mockup, adaptar para JSX + Tailwind.

### 4. Adicionar Lógica

Estados, event handlers, side effects.

### 5. Testar Fidelidade Visual

Comparar lado-a-lado com mockup.

### 6. Adicionar Testes Unitários

```tsx
// src/components/project/__tests__/ProgressIndicator.test.tsx
describe('ProgressIndicator', () => {
  it('shows correct progress percentage', () => {
    render(<ProgressIndicator current={3} total={5} />);
    expect(screen.getByText('Pergunta 3 de 5')).toBeInTheDocument();
  });
});
```

---

## 🔧 Ferramentas Úteis

### 1. Tailwind CSS IntelliSense (VSCode)

Auto-complete de classes Tailwind.

### 2. Headless UI / Radix UI

Componentes acessíveis sem estilo (já usado no projeto).

### 3. clsx / cn Helper

Juntar classes condicionais:

```tsx
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Uso:
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  disabled && "disabled-classes"
)} />
```

### 4. Framer Motion (Opcional)

Animações complexas:

```tsx
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  {children}
</motion.div>
```

**Nota:** Só usar se necessário, animações Tailwind são suficientes para 90% dos casos.

---

## 📊 Métricas de Fidelidade

### Objetivo: 95%+ de fidelidade visual

**Como medir:**
1. Screenshot mockup vs React component
2. Overlay no Photoshop/Figma
3. Verificar diferenças pixel-by-pixel

**Tolerância:**
- ✅ **0-2px** de diferença em espaçamentos → OK
- ⚠️ **3-5px** → Revisar
- ❌ **>5px** → Incorreto, corrigir

---

## ✅ Checklist Final

Antes de marcar componente como "concluído":

- [ ] Markup HTML/JSX idêntico ao mockup
- [ ] Classes Tailwind mapeadas corretamente
- [ ] Cores exatas (usar tokens)
- [ ] Espaçamentos exatos (p-X, m-X)
- [ ] Tipografia exata (text-X, font-X)
- [ ] Animações implementadas (duration, easing)
- [ ] Todos os estados funcionando (hover, active, disabled)
- [ ] Acessibilidade completa (ARIA, keyboard)
- [ ] Responsividade testada (mobile, tablet, desktop)
- [ ] Testes unitários escritos
- [ ] Screenshot comparado com mockup (diff < 2px)

---

**Documento mantido por:** Claude Code Agent
**Última atualização:** 27 Janeiro 2026
**Versão:** 1.0
