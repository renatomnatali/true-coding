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
  className: string
  textClassName?: string
}

type SwatchGroup = {
  title: string
  description: string
  swatches: Swatch[]
}

const SWATCH_GROUPS: SwatchGroup[] = [
  {
    title: 'Brand',
    description: 'Cores principais da marca True Coding (azul).',
    swatches: [
      {
        name: 'brand-primary',
        hex: '#2563eb',
        className: 'bg-brand-primary',
        textClassName: 'text-white',
      },
      {
        name: 'brand-primary-hover',
        hex: '#1d4ed8',
        className: 'bg-brand-primary-hover',
        textClassName: 'text-white',
      },
      {
        name: 'brand-primary-light',
        hex: '#dbeafe',
        className: 'bg-brand-primary-light',
        textClassName: 'text-brand-primary',
      },
      {
        name: 'brand-primary-lighter',
        hex: '#eff6ff',
        className: 'bg-brand-primary-lighter',
        textClassName: 'text-brand-primary',
      },
    ],
  },
  {
    title: 'Feedback',
    description: 'Cores semânticas para sucesso, alerta e erro.',
    swatches: [
      {
        name: 'feedback-success',
        hex: '#10b981',
        className: 'bg-feedback-success',
        textClassName: 'text-white',
      },
      {
        name: 'feedback-success-hover',
        hex: '#059669',
        className: 'bg-feedback-success-hover',
        textClassName: 'text-white',
      },
      {
        name: 'feedback-success-light',
        hex: '#d1fae5',
        className: 'bg-feedback-success-light',
        textClassName: 'text-feedback-success-hover',
      },
      {
        name: 'feedback-warning',
        hex: '#f59e0b',
        className: 'bg-feedback-warning',
        textClassName: 'text-white',
      },
      {
        name: 'feedback-warning-hover',
        hex: '#b45309',
        className: 'bg-feedback-warning-hover',
        textClassName: 'text-white',
      },
      {
        name: 'feedback-warning-light',
        hex: '#fef3c7',
        className: 'bg-feedback-warning-light',
        textClassName: 'text-feedback-warning-hover',
      },
      {
        name: 'feedback-error',
        hex: '#ef4444',
        className: 'bg-feedback-error',
        textClassName: 'text-white',
      },
      {
        name: 'feedback-error-light',
        hex: '#fee2e2',
        className: 'bg-feedback-error-light',
        textClassName: 'text-feedback-error',
      },
    ],
  },
  {
    title: 'Surface',
    description: 'Planos de fundo: app, canvas, áreas neutras e hover.',
    swatches: [
      {
        name: 'surface',
        hex: '#ffffff',
        className: 'bg-surface',
        textClassName: 'text-ink',
      },
      {
        name: 'surface-canvas',
        hex: '#f9fafb',
        className: 'bg-surface-canvas',
        textClassName: 'text-ink',
      },
      {
        name: 'surface-muted',
        hex: '#f3f4f6',
        className: 'bg-surface-muted',
        textClassName: 'text-ink',
      },
      {
        name: 'surface-hover',
        hex: '#f3f4f6',
        className: 'bg-surface-hover',
        textClassName: 'text-ink',
      },
    ],
  },
  {
    title: 'Ink (texto)',
    description: 'Hierarquia tipográfica do conteúdo textual.',
    swatches: [
      {
        name: 'ink',
        hex: '#111827',
        className: 'bg-ink',
        textClassName: 'text-white',
      },
      {
        name: 'ink-secondary',
        hex: '#4b5563',
        className: 'bg-ink-secondary',
        textClassName: 'text-white',
      },
      {
        name: 'ink-tertiary',
        hex: '#6b7280',
        className: 'bg-ink-tertiary',
        textClassName: 'text-white',
      },
      {
        name: 'ink-quaternary',
        hex: '#9ca3af',
        className: 'bg-ink-quaternary',
        textClassName: 'text-white',
      },
    ],
  },
  {
    title: 'Line (bordas)',
    description: 'Linhas separadoras e bordas dos componentes.',
    swatches: [
      {
        name: 'line',
        hex: '#e5e7eb',
        className: 'bg-line',
        textClassName: 'text-ink',
      },
      {
        name: 'line-strong',
        hex: '#d1d5db',
        className: 'bg-line-strong',
        textClassName: 'text-ink',
      },
    ],
  },
]

const RADIUS_TOKENS: Array<{ name: string; value: string; className: string }> = [
  { name: 'rounded-brand-sm', value: '4px', className: 'rounded-brand-sm' },
  { name: 'rounded-brand-md', value: '6px', className: 'rounded-brand-md' },
  { name: 'rounded-brand-lg', value: '8px', className: 'rounded-brand-lg' },
  { name: 'rounded-brand-xl', value: '12px', className: 'rounded-brand-xl' },
]

const SHADOW_TOKENS: Array<{ name: string; description: string; className: string }> = [
  {
    name: 'shadow-brand-sm',
    description: 'Sombra discreta para cards e chips elevados.',
    className: 'shadow-brand-sm',
  },
  {
    name: 'shadow-brand-md',
    description: 'Sombra padrão para popovers e dropdowns.',
    className: 'shadow-brand-md',
  },
  {
    name: 'shadow-brand-lg',
    description: 'Sombra de painel flutuante (ex: tweaks panel).',
    className: 'shadow-brand-lg',
  },
]

function SectionHeader({
  id,
  title,
  description,
}: {
  id: string
  title: string
  description: string
}) {
  return (
    <header className="mb-6">
      <h2
        id={id}
        className="text-xl font-semibold tracking-tight text-ink"
      >
        {title}
      </h2>
      <p className="mt-1 text-sm text-ink-tertiary">{description}</p>
    </header>
  )
}

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
      <SectionHeader id={id} title={title} description={description} />
      {children}
    </section>
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
                <p className="mt-1 text-xs text-ink-tertiary">
                  {group.description}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {group.swatches.map((swatch) => (
                    <div
                      key={swatch.name}
                      className="overflow-hidden rounded-brand-lg border border-line"
                    >
                      <div
                        className={`flex h-20 items-end p-3 ${swatch.className} ${
                          swatch.textClassName ?? 'text-ink'
                        }`}
                      >
                        <span className="text-xs font-semibold">
                          {swatch.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-surface px-3 py-2 text-[11px] text-ink-tertiary">
                        <code className="text-ink-secondary">{swatch.hex}</code>
                        <code>{swatch.className}</code>
                      </div>
                    </div>
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
            {RADIUS_TOKENS.map((radius) => (
              <div
                key={radius.name}
                className="flex flex-col items-center gap-3 rounded-brand-lg border border-line bg-surface p-4"
              >
                <div
                  className={`h-20 w-20 bg-brand-primary ${radius.className}`}
                  aria-hidden
                />
                <div className="text-center text-xs">
                  <div className="font-semibold text-ink">{radius.name}</div>
                  <div className="text-ink-tertiary">{radius.value}</div>
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
            {SHADOW_TOKENS.map((shadow) => (
              <div
                key={shadow.name}
                className={`flex flex-col gap-2 rounded-brand-lg bg-surface p-5 ${shadow.className}`}
              >
                <div className="text-sm font-semibold text-ink">
                  {shadow.name}
                </div>
                <p className="text-xs text-ink-tertiary">{shadow.description}</p>
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
