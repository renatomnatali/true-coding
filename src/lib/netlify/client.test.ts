import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createNetlifySite,
  linkSiteToRepository,
  getLatestDeploy,
  getDeployById,
} from './client'

const TOKEN = 'test-token'

function mockFetchResponse(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  })
}

describe('createNetlifySite', () => {
  beforeEach(() => { vi.stubGlobal('fetch', mockFetchResponse({ id: 'site-1', name: 'my-app-abc', ssl_url: 'https://my-app-abc.netlify.app' })) })
  afterEach(() => { vi.restoreAllMocks() })

  it('creates a site and returns normalized data', async () => {
    const result = await createNetlifySite(TOKEN, { name: 'my-app' })

    expect(result).toEqual({
      id: 'site-1',
      name: 'my-app-abc',
      url: 'https://my-app-abc.netlify.app',
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.netlify.com/api/v1/sites',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    )
  })

  it('throws on API error', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({ message: 'Conflict' }, 409))

    await expect(createNetlifySite(TOKEN, { name: 'dup' }))
      .rejects.toThrow('Netlify API error: 409')
  })
})

describe('linkSiteToRepository', () => {
  afterEach(() => { vi.restoreAllMocks() })

  const linkOptions = {
    repoPath: 'owner/repo',
    branch: 'main',
    buildCmd: 'npm run build',
    publishDir: '.next',
  }

  it('patches site with repo config and returns site data', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({
      id: 'site-1',
      name: 'my-app-abc',
      ssl_url: 'https://my-app-abc.netlify.app',
    }))

    const result = await linkSiteToRepository(TOKEN, 'site-1', linkOptions)

    expect(result).toEqual({
      id: 'site-1',
      name: 'my-app-abc',
      url: 'https://my-app-abc.netlify.app',
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.netlify.com/api/v1/sites/site-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          repo: {
            provider: 'github',
            repo_path: 'owner/repo',
            repo_branch: 'main',
            cmd: 'npm run build',
            dir: '.next',
          },
        }),
      })
    )
  })

  it('throws on 422 unprocessable entity', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({ message: 'Repo not found' }, 422))

    await expect(linkSiteToRepository(TOKEN, 'site-1', linkOptions))
      .rejects.toThrow('Netlify API error: 422 — Repo not found')
  })

  it('throws on 401 unauthorized', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({ error: 'Unauthorized' }, 401))

    await expect(linkSiteToRepository(TOKEN, 'site-1', linkOptions))
      .rejects.toThrow('Netlify API error: 401 — Unauthorized')
  })
})

describe('getLatestDeploy', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('returns the latest deploy with normalized fields', async () => {
    vi.stubGlobal('fetch', mockFetchResponse([
      {
        id: 'deploy-1',
        site_id: 'site-1',
        state: 'ready',
        error_message: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:05:00Z',
        ssl_url: 'https://my-app.netlify.app',
      },
    ]))

    const result = await getLatestDeploy(TOKEN, 'site-1')

    expect(result).toEqual({
      id: 'deploy-1',
      siteId: 'site-1',
      state: 'ready',
      errorMessage: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:05:00Z',
      sslUrl: 'https://my-app.netlify.app',
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.netlify.com/api/v1/sites/site-1/deploys?per_page=1',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    )
  })

  it('returns null when no deploys exist', async () => {
    vi.stubGlobal('fetch', mockFetchResponse([]))

    const result = await getLatestDeploy(TOKEN, 'site-1')
    expect(result).toBeNull()
  })

  it('throws on API error', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({ message: 'Not found' }, 404))

    await expect(getLatestDeploy(TOKEN, 'site-1'))
      .rejects.toThrow('Netlify API error: 404')
  })
})

describe('getDeployById', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('returns deploy data by ID', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({
      id: 'deploy-1',
      site_id: 'site-1',
      state: 'building',
      error_message: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:02:00Z',
      ssl_url: null,
    }))

    const result = await getDeployById(TOKEN, 'deploy-1')

    expect(result).toEqual({
      id: 'deploy-1',
      siteId: 'site-1',
      state: 'building',
      errorMessage: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:02:00Z',
      sslUrl: null,
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.netlify.com/api/v1/deploys/deploy-1',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    )
  })

  it('returns deploy with error state', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({
      id: 'deploy-2',
      site_id: 'site-1',
      state: 'error',
      error_message: 'Build failed: exit code 1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:03:00Z',
      ssl_url: null,
    }))

    const result = await getDeployById(TOKEN, 'deploy-2')

    expect(result.state).toBe('error')
    expect(result.errorMessage).toBe('Build failed: exit code 1')
  })

  it('throws on 404', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({ message: 'Deploy not found' }, 404))

    await expect(getDeployById(TOKEN, 'invalid'))
      .rejects.toThrow('Netlify API error: 404 — Deploy not found')
  })
})
