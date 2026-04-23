/**
 * TRC-14.2 — Componente de marca True Coding.
 *
 * Renderiza o logo inline como <svg> (e nao via <img>) para:
 *   - permitir styling via tokens/currentColor se necessario no futuro;
 *   - evitar flash durante load;
 *   - servir como unica fonte de marca em toda a UI.
 *
 * Os paths espelham 1:1 os arquivos originais do mockup em
 * `Spec/Jornada Coleta inicial/assets/logo-{mark,wordmark}.svg`. A cor da marca
 * (#2563eb) esta hardcoded aqui porque a marca NAO deve mudar com o tema; se
 * algum dia quisermos alternar, trocamos por `currentColor` e aplicamos via
 * className.
 */

type LogoVariant = 'mark' | 'wordmark'

type LogoProps = {
  variant?: LogoVariant
  /** Largura em px. Altura mantem a proporcao do viewBox. */
  size?: number
  className?: string
  'aria-label'?: string
}

const BRAND_PRIMARY = '#2563eb'
const INK = '#111827'

const DEFAULT_SIZE: Record<LogoVariant, number> = {
  mark: 24,
  wordmark: 120,
}

export function Logo({
  variant = 'mark',
  size,
  className,
  'aria-label': ariaLabel = 'True Coding',
}: LogoProps) {
  const width = size ?? DEFAULT_SIZE[variant]

  if (variant === 'wordmark') {
    // Proporcao 320:80 = 4:1
    const height = width / 4
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 320 80"
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        className={className}
      >
        <circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          stroke={BRAND_PRIMARY}
          strokeWidth="2.5"
        />
        <path
          d="M30 28 L44 40 L30 52"
          fill="none"
          stroke={BRAND_PRIMARY}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M41 28 L55 40 L41 52"
          fill="none"
          stroke={BRAND_PRIMARY}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="86"
          y="50"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          fontSize="26"
          fontWeight="600"
          letterSpacing="-0.4"
          fill={INK}
        >
          true
          <tspan fill={BRAND_PRIMARY}>coding</tspan>
        </text>
      </svg>
    )
  }

  // mark — proporcao 80:80 = 1:1
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 80"
      width={width}
      height={width}
      role="img"
      aria-label={ariaLabel}
      className={className}
    >
      <circle
        cx="40"
        cy="40"
        r="36"
        fill="none"
        stroke={BRAND_PRIMARY}
        strokeWidth="3"
      />
      <path
        d="M28 26 L44 40 L28 54"
        fill="none"
        stroke={BRAND_PRIMARY}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 26 L56 40 L40 54"
        fill="none"
        stroke={BRAND_PRIMARY}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
