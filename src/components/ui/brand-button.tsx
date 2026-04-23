import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * TRC-14.3 — Primitiva Button do design system True Coding.
 *
 * Espelha 1:1 as classes `.btn`, `.btn-{primary|secondary|ghost|success}` e
 * `.btn-sm` do mockup `Spec/Jornada Coleta inicial/prototipo.html` (linhas
 * 66–83). Convive com o `Button` shadcn (src/components/ui/button.tsx), que
 * segue em uso por componentes legados. A migração é tema de PR próprio.
 */

type BrandButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success'
type BrandButtonSize = 'default' | 'sm'

export type BrandButtonProps = {
  variant?: BrandButtonVariant
  size?: BrandButtonSize
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  'aria-label'?: string
}

// Maps estáticos — evitam interpolação `bg-${variant}` que o JIT do Tailwind
// não consegue descobrir sem safelist.
const VARIANT_CLASSES: Record<BrandButtonVariant, string> = {
  primary: 'bg-brand-primary text-white hover:bg-brand-primary-hover',
  secondary:
    'bg-surface border border-line text-ink hover:bg-surface-hover hover:border-line-strong',
  ghost: 'text-ink-secondary hover:bg-surface-muted hover:text-ink',
  success: 'bg-feedback-success text-white hover:bg-feedback-success-hover',
}

const SIZE_CLASSES: Record<BrandButtonSize, string> = {
  default: 'h-9 px-3.5 text-[13px]',
  sm: 'h-[30px] px-2.5 text-xs',
}

const BASE_CLASSES =
  'inline-flex items-center gap-1.5 rounded-brand-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'

export const BrandButton = React.forwardRef<HTMLButtonElement, BrandButtonProps>(
  function BrandButton(
    {
      variant = 'primary',
      size = 'default',
      icon,
      children,
      className,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          BASE_CLASSES,
          SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
          className,
        )}
        {...rest}
      >
        {icon ? (
          <span className="inline-flex shrink-0 items-center" aria-hidden>
            {icon}
          </span>
        ) : null}
        {children}
      </button>
    )
  },
)
