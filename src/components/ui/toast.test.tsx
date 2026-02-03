import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast } from './toast'

// Test component that uses the toast hook
function TestComponent() {
  const toast = useToast()

  return (
    <div>
      <button onClick={() => toast.success('Success message')}>Show Success</button>
      <button onClick={() => toast.error('Error message')}>Show Error</button>
      <button onClick={() => toast.warning('Warning message')}>Show Warning</button>
      <button onClick={() => toast.toast('Default message')}>Show Default</button>
    </div>
  )
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render success toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Show Success'))
    })

    expect(screen.getByText('Success message')).toBeInTheDocument()
  })

  it('should render error toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Show Error'))
    })

    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('should render warning toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Show Warning'))
    })

    expect(screen.getByText('Warning message')).toBeInTheDocument()
  })

  it('should auto-dismiss after duration', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Show Success'))
    })

    expect(screen.getByText('Success message')).toBeInTheDocument()

    // Fast-forward past the default duration (5000ms)
    await act(async () => {
      vi.advanceTimersByTime(5100)
    })

    expect(screen.queryByText('Success message')).not.toBeInTheDocument()
  })

  it('should dismiss toast when close button clicked', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Show Success'))
    })

    expect(screen.getByText('Success message')).toBeInTheDocument()

    const closeButton = screen.getByLabelText('Fechar notificacao')
    await act(async () => {
      fireEvent.click(closeButton)
    })

    expect(screen.queryByText('Success message')).not.toBeInTheDocument()
  })

  it('should render multiple toasts', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Show Success'))
      fireEvent.click(screen.getByText('Show Error'))
    })

    expect(screen.getByText('Success message')).toBeInTheDocument()
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })
})
