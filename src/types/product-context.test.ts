import { describe, it, expect } from 'vitest'
import { computeRiskLevel } from './product-context'

describe('computeRiskLevel (POLICY-007 matriz oficial)', () => {
  it('ALTO x ALTA => CRITICAL', () => {
    expect(computeRiskLevel('ALTO', 'ALTA')).toBe('CRITICAL')
  })

  it('ALTO x MEDIA => HIGH', () => {
    expect(computeRiskLevel('ALTO', 'MEDIA')).toBe('HIGH')
  })

  it('ALTO x BAIXA => MEDIUM', () => {
    expect(computeRiskLevel('ALTO', 'BAIXA')).toBe('MEDIUM')
  })

  it('MEDIO x ALTA => HIGH', () => {
    expect(computeRiskLevel('MEDIO', 'ALTA')).toBe('HIGH')
  })

  it('MEDIO x MEDIA => MEDIUM', () => {
    expect(computeRiskLevel('MEDIO', 'MEDIA')).toBe('MEDIUM')
  })

  it('MEDIO x BAIXA => LOW', () => {
    expect(computeRiskLevel('MEDIO', 'BAIXA')).toBe('LOW')
  })

  it('BAIXO x ALTA => MEDIUM', () => {
    expect(computeRiskLevel('BAIXO', 'ALTA')).toBe('MEDIUM')
  })

  it('BAIXO x MEDIA => LOW', () => {
    expect(computeRiskLevel('BAIXO', 'MEDIA')).toBe('LOW')
  })

  it('BAIXO x BAIXA => LOW', () => {
    expect(computeRiskLevel('BAIXO', 'BAIXA')).toBe('LOW')
  })
})
