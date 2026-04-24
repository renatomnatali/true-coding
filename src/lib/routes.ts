/**
 * TRC-14.9 — Single source of truth para rotas públicas do app.
 *
 * Consumido por `middleware.ts` (Clerk route matcher) e `AppShellClient.tsx`
 * (filtro de rotas que não renderizam o shell global). Divergência entre os
 * dois quebraria a expectativa: "rota pública não exige auth E não renderiza
 * shell".
 */

// Pra filtro client-side do AppShellClient (startsWith). Mantém /.
export const PUBLIC_ROUTE_PREFIXES = [
  '/',
  '/sign-in',
  '/sign-up',
  '/design-system',
] as const

// Pra createRouteMatcher do Clerk middleware (padrões com glob).
export const MIDDLEWARE_PUBLIC_PATTERNS = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/design-system(.*)',
  '/api/webhooks(.*)',
] as const
