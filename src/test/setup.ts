import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock scrollIntoView (not available in jsdom).
// Guard para testes rodando em ambiente node (sem DOM) — ex: prisma/schema.test.ts.
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn()
}

// TRC-05.1: tests rodam por padrão com a pipeline de Code Generation
// habilitada para exercitar os caminhos completos das rotas e dos
// componentes. O cenário flag=false é coberto por arquivos dedicados
// (`*.flag-off.test.ts(x)`) que mockam @/config/features explicitamente.
process.env.NEXT_PUBLIC_ENABLE_CODE_GENERATION = 'true'
