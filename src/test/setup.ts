import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock scrollIntoView (not available in jsdom).
// Guard para testes rodando em ambiente node (sem DOM) — ex: prisma/schema.test.ts.
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn()
}
