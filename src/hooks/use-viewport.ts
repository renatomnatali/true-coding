import { useEffect, useState } from 'react'

/**
 * TRC-14.8 — Largura mínima da aplicação autenticada (ver Decision Log no
 * Notion).
 *
 * Abaixo deste ponto, rotas do app devem exibir o banner `ViewportGate`.
 * Landing, onboarding, checkout, emails e status view seguem responsivos e
 * não dependem deste valor.
 */
export const APP_MIN_WIDTH_PX = 1280

export type ViewportState = {
  /** Largura atual do viewport em pixels. Zero no primeiro render (SSR). */
  width: number
  /** `true` se `width >= APP_MIN_WIDTH_PX`. Default `true` durante SSR. */
  isAppSized: boolean
  /** `false` antes do primeiro `useEffect`; `true` após a primeira medição. */
  hasMeasured: boolean
}

/**
 * Estado default antes da primeira medição (SSR/primeiro render).
 * Exportado para testes e para compor o estado inicial do hook.
 */
export const INITIAL_VIEWPORT_STATE: ViewportState = {
  width: 0,
  isAppSized: true,
  hasMeasured: false,
}

/**
 * Hook que reporta a largura atual do viewport e se ela atinge o mínimo do app.
 *
 * Durante SSR/primeiro render assume desktop (`isAppSized: true`) para evitar
 * flash do banner em clientes desktop. Consumidores sensíveis a flashes usam
 * `hasMeasured` para adiar a decisão até a primeira medição real.
 */
export function useViewport(): ViewportState {
  const [state, setState] = useState<ViewportState>(() => INITIAL_VIEWPORT_STATE)

  useEffect(() => {
    function measure() {
      const width = window.innerWidth
      setState({
        width,
        isAppSized: width >= APP_MIN_WIDTH_PX,
        hasMeasured: true,
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return state
}
