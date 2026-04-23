import type { Metadata } from 'next'

import { AnimationPlayground, FocusRingDemo } from './interactive-demos'

/**
 * TRC-14.1 — Página de referência visual dos tokens do design system.
 *
 * Espelha 1:1 os tokens definidos no mockup
 * `/Spec/Jornada Coleta inicial/prototipo.html` (cores, raios, sombras,
 * animações, scrollbar e foco) para inspeção visual em dev.
 *
 * Server component puro: a única parte interativa fica em
 * `interactive-demos.tsx` (animações e focus ring).
 */

export const metadata: Metadata = {
  title: 'Design System — True Coding',
  description:
    'Referência visual dos tokens do design system alinhados ao mockup oficial.',
}

type Swatch = {
  name: string
  hex: string
  textOn: string
}

type SwatchGroup = {
  title: string
  description: string
  swatches: Swatch[]
}

const swatch = (name: string, hex: string, textOn: string): Swatch => ({
  name,
  hex,
  textOn,
})

const SWATCH_GROUPS: SwatchGroup[] = [
  {
    title: 'Brand',
    description: 'Cores principais da marca True Coding (azul).',
    swatches: [
      swatch('brand-primary', '#2563eb', 'text-white'),
      swatch('brand-primary-hover', '#1d4ed8', 'text-white'),
      swatch('brand-primary-light', '#dbeafe', 'text-brand-primary'),
      swatch('brand-primary-lighter', '#eff6ff', 'text-brand-primary'),
    ],
  },
  {
    title: 'Feedback',
    description: 'Cores semânticas para sucesso, alerta e erro.',
    swatches: [
      swatch('feedback-success', '#10b981', 'text-white'),
      swatch('feedback-success-hover', '#059669', 'text-white'),
      swatch('feedback-success-light', '#d1fae5', 'text-feedback-success-hover'),
      swatch('feedback-warning', '#f59e0b', 'text-white'),
      swatch('feedback-warning-hover', '#b45309', 'text-white'),
      swatch('feedback-warning-light', '#fef3c7', 'text-feedback-warning-hover'),
      swatch('feedback-error', '#ef4444', 'text-white'),
      swatch('feedback-error-light', '#fee2e2', 'text-feedback-error'),
    ],
  },
  {
    title: 'Surface',
    description: 'Planos de fundo: app, canvas, áreas neutras e hover.',
    swatches: [
      swatch('surface', '#ffffff', 'text-ink'),
      swatch('surface-canvas', '#f9fafb', 'text-ink'),
      swatch('surface-muted', '#f3f4f6', 'text-ink'),
      swatch('surface-hover', '#f3f4f6', 'text-ink'),
    ],
  },
  {
    title: 'Ink (texto)',
    description: 'Hierarquia tipográfica do conteúdo textual.',
    swatches: [
      swatch('ink', '#111827', 'text-white'),
      swatch('ink-secondary', '#4b5563', 'text-white'),
      swatch('ink-tertiary', '#6b7280', 'text-white'),
      swatch('ink-quaternary', '#9ca3af', 'text-white'),
    ],
  },
  {
    title: 'Line (bordas)',
    description: 'Linhas separadoras e bordas dos componentes.',
    swatches: [
      swatch('line', '#e5e7eb', 'text-ink'),
      swatch('line-strong', '#d1d5db', 'text-ink'),
    ],
  },
]

type RadiusToken = { name: string; value: string }

const RADIUS_TOKENS: RadiusToken[] = [
  { name: 'rounded-brand-sm', value: '4px' },
  { name: 'rounded-brand-md', value: '6px' },
  { name: 'rounded-brand-lg', value: '8px' },
  { name: 'rounded-brand-xl', value: '12px' },
]

type ShadowToken = { name: string; description: string }

const SHADOW_TOKENS: ShadowToken[] = [
  { name: 'shadow-brand-sm', description: 'Sombra discreta para cards e chips elevados.' },
  { name: 'shadow-brand-md', description: 'Sombra padrão para popovers e dropdowns.' },
  { name: 'shadow-brand-lg', description: 'Sombra de painel flutuante (ex: tweaks panel).' },
]

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-brand-xl border border-line bg-surface p-6 shadow-brand-sm"
    >
      <header className="mb-6">
        <h2 id={id} className="text-xl font-semibold tracking-tight text-ink">
          {title}
        </h2>
        <p className="mt-1 text-sm text-ink-tertiary">{description}</p>
      </header>
      {children}
    </section>
  )
}

function SwatchCard({ swatch: s }: { swatch: Swatch }) {
  return (
    <div className="overflow-hidden rounded-brand-lg border border-line">
      <div className={`flex h-20 items-end bg-${s.name} p-3 ${s.textOn}`}>
        <span className="text-xs font-semibold">{s.name}</span>
      </div>
      <div className="flex items-center justify-between bg-surface px-3 py-2 text-[11px] text-ink-tertiary">
        <code className="text-ink-secondary">{s.hex}</code>
        <code>bg-{s.name}</code>
      </div>
    </div>
  )
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-surface-canvas text-ink">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-2">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-primary-light px-3 py-1 text-xs font-medium text-brand-primary">
            TRC-14.1
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Design System — referência visual
          </h1>
          <p className="max-w-2xl text-sm text-ink-secondary">
            Esta página expõe os tokens do mockup oficial
            <code className="mx-1 rounded-brand-sm bg-surface-muted px-1.5 py-0.5 text-[12px] text-ink">
              /Spec/Jornada Coleta inicial/prototipo.html
            </code>
            já disponíveis no Tailwind. Use-a para validar visualmente cores,
            raios, sombras, animações, foco e scrollbar antes de construir as
            primitivas em TRC-14.3.
          </p>
        </header>

        <Section
          id="cores"
          title="Cores"
          description="Swatches de cada token disponível no Tailwind, agrupados por família."
        >
          <div className="flex flex-col gap-8">
            {SWATCH_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.04em] text-ink-tertiary">
                  {group.title}
                </h3>
                <p className="mt-1 text-xs text-ink-tertiary">{group.description}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {group.swatches.map((s) => (
                    <SwatchCard key={s.name} swatch={s} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="raios"
          title="Raios"
          description="Raios de canto reutilizáveis. shadcn mantém rounded-sm/md/lg; brand-* são do mockup."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {RADIUS_TOKENS.map((r) => (
              <div
                key={r.name}
                className="flex flex-col items-center gap-3 rounded-brand-lg border border-line bg-surface p-4"
              >
                <div className={`h-20 w-20 bg-brand-primary ${r.name}`} aria-hidden />
                <div className="text-center text-xs">
                  <div className="font-semibold text-ink">{r.name}</div>
                  <div className="text-ink-tertiary">{r.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="sombras"
          title="Sombras"
          description="Elevações do design system para cartões e camadas flutuantes."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {SHADOW_TOKENS.map((sh) => (
              <div
                key={sh.name}
                className={`flex flex-col gap-2 rounded-brand-lg bg-surface p-5 ${sh.name}`}
              >
                <div className="text-sm font-semibold text-ink">{sh.name}</div>
                <p className="text-xs text-ink-tertiary">{sh.description}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="animacoes"
          title="Animações"
          description="Cinco animações equivalentes às keyframes do mockup. Clique em um botão para reproduzir."
        >
          <AnimationPlayground />
        </Section>

        <Section
          id="foco"
          title="Anel de foco"
          description="O anel azul de 2px (offset 2px) é aplicado globalmente a campos focados via teclado."
        >
          <FocusRingDemo />
        </Section>

        <Section
          id="scrollbar"
          title="Scrollbar custom"
          description="Scrollbar fina com thumb cinza e track transparente. Role o conteúdo abaixo."
        >
          <div className="rounded-brand-lg border border-line bg-surface">
            <div className="max-h-48 overflow-auto p-4">
              <div className="space-y-2 text-sm text-ink-secondary">
                {Array.from({ length: 24 }).map((_, index) => (
                  <p key={index}>
                    Linha {index + 1} — conteúdo de exemplo só para forçar
                    rolagem e revelar o scrollbar customizado do design system.
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <footer className="pt-2 text-center text-xs text-ink-quaternary">
          TRC-14.1 · Tokens alinhados ao mockup oficial em{' '}
          <code>/Spec/Jornada Coleta inicial/prototipo.html</code>
        </footer>
      </div>
    </div>
  )
}
