import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/crypto', () => ({
  decrypt: vi.fn((val: string) => `decrypted-${val}`),
}))

vi.mock('@/lib/netlify/client', () => ({
  linkSiteToRepository: vi.fn(),
  getLatestDeploy: vi.fn(),
}))

import { prisma } from '@/lib/db/prisma'
import { linkSiteToRepository, getLatestDeploy } from '@/lib/netlify/client'
import { executeNetlifyDeploy, type DeployEvent } from './deploy'

const mockProject = {
  netlifySiteId: 'site-1',
  githubRepoOwner: 'owner',
  githubRepoName: 'repo',
  productionUrl: 'https://old.netlify.app',
  user: { netlifyAccessToken: 'encrypted-token' },
}

function collectEvents() {
  const events: DeployEvent[] = []
  return {
    events,
    onEvent: async (e: DeployEvent) => { events.push(e) },
  }
}

describe('executeNetlifyDeploy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never)
    vi.mocked(linkSiteToRepository).mockResolvedValue({ id: 'site-1', name: 'app', url: 'https://app.netlify.app' })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // Cenário: Deploy automático após todas iterações mergeadas
  it('links repo, polls until ready, and returns success with productionUrl', async () => {
    vi.mocked(getLatestDeploy).mockResolvedValue({
      id: 'deploy-1',
      siteId: 'site-1',
      state: 'ready',
      errorMessage: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:05:00Z',
      sslUrl: 'https://app.netlify.app',
    })

    const { events, onEvent } = collectEvents()
    const resultPromise = executeNetlifyDeploy('project-1', onEvent)

    // Advance past the polling interval
    await vi.advanceTimersByTimeAsync(10_000)

    const result = await resultPromise

    expect(result).toEqual({
      success: true,
      skipped: false,
      productionUrl: 'https://app.netlify.app',
      deployId: 'deploy-1',
      error: null,
    })

    expect(linkSiteToRepository).toHaveBeenCalledWith(
      'decrypted-encrypted-token',
      'site-1',
      { repoPath: 'owner/repo', branch: 'main', buildCmd: 'npm run build', publishDir: '.next' }
    )

    expect(events.some(e => e.payload.status === 'LINKING')).toBe(true)
    expect(events.some(e => e.payload.status === 'READY')).toBe(true)
  })

  // Cenário: Deploy falha mostra erro com diagnóstico
  it('returns failure when deploy reaches error state', async () => {
    vi.mocked(getLatestDeploy).mockResolvedValue({
      id: 'deploy-2',
      siteId: 'site-1',
      state: 'error',
      errorMessage: 'Build failed: exit code 1',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:03:00Z',
      sslUrl: null,
    })

    const { events, onEvent } = collectEvents()
    const resultPromise = executeNetlifyDeploy('project-1', onEvent)

    await vi.advanceTimersByTimeAsync(10_000)

    const result = await resultPromise

    expect(result.success).toBe(false)
    expect(result.error).toBe('Build failed: exit code 1')
    expect(result.deployId).toBe('deploy-2')

    expect(events.some(e => e.payload.status === 'FAILED')).toBe(true)
  })

  // Cenário: Projeto sem Netlify conectado pula deploy e vai para LIVE
  it('skips deploy when netlifySiteId is not set', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      ...mockProject,
      netlifySiteId: null,
    } as never)

    const { events, onEvent } = collectEvents()
    const result = await executeNetlifyDeploy('project-1', onEvent)

    expect(result).toEqual({
      success: true,
      skipped: true,
      productionUrl: 'https://old.netlify.app',
      deployId: null,
      error: null,
    })

    expect(linkSiteToRepository).not.toHaveBeenCalled()
    expect(events.some(e => e.payload.status === 'SKIPPED')).toBe(true)
  })

  // Cenário: Polling de deploy respeita timeout de 5 minutos
  it('returns timeout error after 5 minutes of polling', async () => {
    vi.mocked(getLatestDeploy).mockResolvedValue({
      id: 'deploy-3',
      siteId: 'site-1',
      state: 'building',
      errorMessage: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      sslUrl: null,
    })

    const { events, onEvent } = collectEvents()
    const resultPromise = executeNetlifyDeploy('project-1', onEvent)

    // Advance past the 5 minute timeout (31 polls of 10s = 310s > 300s)
    for (let i = 0; i < 31; i++) {
      await vi.advanceTimersByTimeAsync(10_000)
    }

    const result = await resultPromise

    expect(result.success).toBe(false)
    expect(result.error).toContain('timeout')
    expect(result.skipped).toBe(false)

    expect(events.some(e => e.payload.status === 'TIMEOUT')).toBe(true)
  })

  // Cenário: Falha ao linkar repositório ao site Netlify
  it('returns failure when linkSiteToRepository throws', async () => {
    vi.mocked(linkSiteToRepository).mockRejectedValue(
      new Error('Netlify API error: 422 — Repo not found')
    )

    const { events, onEvent } = collectEvents()
    const result = await executeNetlifyDeploy('project-1', onEvent)

    expect(result.success).toBe(false)
    expect(result.error).toContain('422')
    expect(result.skipped).toBe(false)

    expect(events.some(e => e.payload.status === 'FAILED')).toBe(true)
  })

  it('returns error when project is not found', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null)

    const { onEvent } = collectEvents()
    const result = await executeNetlifyDeploy('nonexistent', onEvent)

    expect(result.success).toBe(false)
    expect(result.error).toContain('não encontrado')
  })

  it('returns error when Netlify token is missing', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      ...mockProject,
      user: { netlifyAccessToken: null },
    } as never)

    const { onEvent } = collectEvents()
    const result = await executeNetlifyDeploy('project-1', onEvent)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Token Netlify')
  })

  it('returns error when GitHub repo is not configured', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      ...mockProject,
      githubRepoOwner: null,
      githubRepoName: null,
    } as never)

    const { onEvent } = collectEvents()
    const result = await executeNetlifyDeploy('project-1', onEvent)

    expect(result.success).toBe(false)
    expect(result.error).toContain('GitHub')
  })

  it('returns failure when getLatestDeploy throws during polling', async () => {
    vi.mocked(getLatestDeploy).mockRejectedValue(
      new Error('Netlify API error: 500 — Internal Server Error')
    )

    const { events, onEvent } = collectEvents()
    const resultPromise = executeNetlifyDeploy('project-1', onEvent)

    await vi.advanceTimersByTimeAsync(10_000)

    const result = await resultPromise

    expect(result.success).toBe(false)
    expect(result.error).toContain('500')
    expect(events.some(e => e.payload.status === 'FAILED')).toBe(true)
  })
})
