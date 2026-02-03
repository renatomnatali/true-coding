import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = vi.fn()
