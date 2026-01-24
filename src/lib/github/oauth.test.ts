import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAuthorizationUrl,
  exchangeCodeForToken,
  generateState,
  getGitHubConfig,
} from './oauth'

describe('GitHub OAuth', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_CLIENT_ID', 'test-client-id')
    vi.stubEnv('GITHUB_CLIENT_SECRET', 'test-client-secret')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.test')
  })

  describe('getGitHubConfig', () => {
    it('should return config when env vars are set', () => {
      const config = getGitHubConfig()
      expect(config.clientId).toBe('test-client-id')
      expect(config.clientSecret).toBe('test-client-secret')
    })

    it('should throw when client ID is missing', () => {
      vi.stubEnv('GITHUB_CLIENT_ID', '')
      expect(() => getGitHubConfig()).toThrow('GitHub OAuth credentials not configured')
    })

    it('should throw when client secret is missing', () => {
      vi.stubEnv('GITHUB_CLIENT_SECRET', '')
      expect(() => getGitHubConfig()).toThrow('GitHub OAuth credentials not configured')
    })
  })

  describe('getAuthorizationUrl', () => {
    it('should generate valid authorization URL', () => {
      const state = 'test-state'
      const url = getAuthorizationUrl(state)

      expect(url).toContain('https://github.com/login/oauth/authorize')
      expect(url).toContain('client_id=test-client-id')
      expect(url).toContain('state=test-state')
      expect(url).toContain('scope=repo+read%3Auser+user%3Aemail')
      expect(url).toContain(encodeURIComponent('https://app.test/api/auth/github/callback'))
    })
  })

  describe('generateState', () => {
    it('should generate 64 character hex string', () => {
      const state = generateState()
      expect(state).toHaveLength(64)
      expect(state).toMatch(/^[0-9a-f]+$/)
    })

    it('should generate unique states', () => {
      const state1 = generateState()
      const state2 = generateState()
      expect(state1).not.toBe(state2)
    })
  })

  describe('exchangeCodeForToken', () => {
    it('should exchange code for tokens', async () => {
      const mockResponse = {
        access_token: 'gho_test_token',
        token_type: 'bearer',
        scope: 'repo,user:email',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await exchangeCodeForToken('test-code')

      expect(fetch).toHaveBeenCalledWith(
        'https://github.com/login/oauth/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
        })
      )

      expect(result.access_token).toBe('gho_test_token')
    })

    it('should throw on HTTP error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })

      await expect(exchangeCodeForToken('test-code')).rejects.toThrow(
        'GitHub OAuth error: 500'
      )
    })

    it('should throw on OAuth error response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            error: 'bad_verification_code',
            error_description: 'The code passed is incorrect or expired.',
          }),
      })

      await expect(exchangeCodeForToken('bad-code')).rejects.toThrow(
        'The code passed is incorrect or expired.'
      )
    })
  })
})
