/**
 * TRC-14.3 — Barrel das primitivas do design system True Coding.
 *
 * Re-exporta apenas as primitivas novas (Brand*) criadas em TRC-14.3. Os
 * componentes shadcn (Button, toast) continuam sendo importados direto dos
 * seus módulos para evitar alterar imports existentes no repo.
 */

export { BrandButton } from './brand-button'
export type { BrandButtonProps } from './brand-button'
export { Chip } from './chip'
export type { ChipProps } from './chip'
export { Dot } from './dot'
export type { DotProps } from './dot'
export { ProgressBar } from './progress-bar'
export type { ProgressBarProps } from './progress-bar'
export { TypingDots } from './typing-dots'
export type { TypingDotsProps } from './typing-dots'
export { Callout } from './callout'
export type { CalloutProps } from './callout'
