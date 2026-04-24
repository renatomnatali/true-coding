import { describe, it, expect, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import {
  APP_MIN_WIDTH_PX,
  INITIAL_VIEWPORT_STATE,
  useViewport,
} from './use-viewport'

const originalInnerWidth = window.innerWidth

function setInnerWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
}

describe('useViewport', () => {
  afterEach(() => {
    setInnerWidth(originalInnerWidth)
  })

  it('INITIAL_VIEWPORT_STATE assume desktop para evitar flash no SSR', () => {
    // Cobre o estado default do hook antes da primeira medição.
    expect(INITIAL_VIEWPORT_STATE).toEqual({
      width: 0,
      isAppSized: true,
      hasMeasured: false,
    })
  })

  it('após medir com width 1920: isAppSized=true', () => {
    setInnerWidth(1920)
    const { result } = renderHook(() => useViewport())

    expect(result.current.hasMeasured).toBe(true)
    expect(result.current.isAppSized).toBe(true)
    expect(result.current.width).toBe(1920)
  })

  it('após medir com width 1024: isAppSized=false', () => {
    setInnerWidth(1024)
    const { result } = renderHook(() => useViewport())

    expect(result.current.hasMeasured).toBe(true)
    expect(result.current.isAppSized).toBe(false)
    expect(result.current.width).toBe(1024)
  })

  it('no limiar exato (APP_MIN_WIDTH_PX) considera app-sized', () => {
    setInnerWidth(APP_MIN_WIDTH_PX)
    const { result } = renderHook(() => useViewport())

    expect(result.current.isAppSized).toBe(true)
    expect(result.current.width).toBe(APP_MIN_WIDTH_PX)
  })

  it('reage a resize do window (atualiza isAppSized ao cruzar o limiar)', () => {
    setInnerWidth(1440)
    const { result } = renderHook(() => useViewport())
    expect(result.current.isAppSized).toBe(true)

    act(() => {
      setInnerWidth(1024)
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current.isAppSized).toBe(false)
    expect(result.current.width).toBe(1024)

    act(() => {
      setInnerWidth(1440)
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current.isAppSized).toBe(true)
    expect(result.current.width).toBe(1440)
  })
})
