'use client'

import { useState } from 'react'

/**
 * TRC-14.1 — Demos interativos da página /design-system.
 * Mantém a página principal como server component e isola estado de UI aqui.
 */

type AnimationKey =
  | 'fade-in'
  | 'slide-up'
  | 'slide-in-right'
  | 'pulse-soft'
  | 'typing-bounce'

const ANIMATIONS: Array<{ key: AnimationKey; label: string; description: string }> = [
  {
    key: 'fade-in',
    label: 'fade-in',
    description: 'Entrada suave por opacidade (240ms).',
  },
  {
    key: 'slide-up',
    label: 'slide-up',
    description: 'Sobe 8px com fade (300ms).',
  },
  {
    key: 'slide-in-right',
    label: 'slide-in-right',
    description: 'Entra pela direita com fade (250ms).',
  },
  {
    key: 'pulse-soft',
    label: 'pulse-soft',
    description: 'Pulso suave em loop (2s).',
  },
  {
    key: 'typing-bounce',
    label: 'typing-bounce',
    description: 'Salto curto em loop, usado nos pontos de digitação.',
  },
]

export function AnimationPlayground() {
  const [active, setActive] = useState<AnimationKey>('fade-in')
  // Truque para reiniciar a animação quando o usuário clica no mesmo botão.
  const [tick, setTick] = useState(0)

  const trigger = (key: AnimationKey) => {
    setActive(key)
    setTick((value) => value + 1)
  }

  const animationClass = `animate-${active}`

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
      <div className="flex min-h-[180px] items-center justify-center rounded-brand-lg border border-line bg-surface-canvas p-8">
        <div
          key={`${active}-${tick}`}
          className={`flex h-24 w-48 items-center justify-center rounded-brand-md bg-brand-primary text-sm font-medium text-white shadow-brand-md ${animationClass}`}
        >
          {active}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {ANIMATIONS.map((animation) => {
          const isActive = animation.key === active
          return (
            <button
              key={animation.key}
              type="button"
              onClick={() => trigger(animation.key)}
              className={`rounded-brand-md border px-3 py-2 text-left text-xs font-medium transition-colors ${
                isActive
                  ? 'border-brand-primary bg-brand-primary-light text-brand-primary'
                  : 'border-line bg-surface text-ink-secondary hover:bg-surface-hover'
              }`}
            >
              <span className="block font-semibold">{animation.label}</span>
              <span className="mt-1 block text-[11px] text-ink-tertiary">
                {animation.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function FocusRingDemo() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-2 text-xs font-medium text-ink-secondary">
        Input com foco
        <input
          type="text"
          placeholder="Foque aqui (Tab) para ver o anel"
          className="rounded-brand-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-quaternary"
        />
      </label>
      <label className="flex flex-col gap-2 text-xs font-medium text-ink-secondary">
        Textarea com foco
        <textarea
          rows={3}
          placeholder="Foque aqui para ver o anel"
          className="resize-none rounded-brand-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-quaternary"
        />
      </label>
      <button
        type="button"
        className="rounded-brand-md bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-brand-primary-hover"
      >
        Botão com foco visível
      </button>
      <a
        href="#cores"
        className="inline-flex items-center justify-center rounded-brand-md border border-line bg-surface px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-hover"
      >
        Link com foco visível
      </a>
    </div>
  )
}
