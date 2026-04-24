import { ENABLE_CODE_GENERATION } from '@/config/features'

/**
 * Guard reutilizável para rotas dependentes da pipeline de Code Generation
 * (TRC-05.1, ADR-008 + ADR-026).
 *
 * Quando a flag `ENABLE_CODE_GENERATION` está OFF, o MVP Spec-as-a-Service
 * trata as rotas como inexistentes — devolve 404 sem corpo. Quando está ON,
 * a função devolve `null` e o handler segue normalmente.
 *
 * Padrão de uso em route handlers:
 *
 *   export async function GET(req, ctx) {
 *     const guard = codegenFlagGuard()
 *     if (guard) return guard
 *     // ...resto do handler
 *   }
 */
export function codegenFlagGuard(): Response | null {
  if (!ENABLE_CODE_GENERATION) {
    return new Response(null, { status: 404 })
  }
  return null
}
