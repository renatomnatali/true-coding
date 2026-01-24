export function getGitHubConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth credentials not configured')
  }
  return { clientId, clientSecret }
}

export function getAuthorizationUrl(state: string): string {
  const { clientId } = getGitHubConfig()

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
    scope: 'repo read:user user:email',
    state,
  })

  return `https://github.com/login/oauth/authorize?${params}`
}

export interface GitHubTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  refresh_token_expires_in?: number
  token_type: string
  scope: string
}

export async function exchangeCodeForToken(
  code: string
): Promise<GitHubTokenResponse> {
  const { clientId, clientSecret } = getGitHubConfig()

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  })

  if (!response.ok) {
    throw new Error(`GitHub OAuth error: ${response.status}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`)
  }

  return data as GitHubTokenResponse
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<GitHubTokenResponse> {
  const { clientId, clientSecret } = getGitHubConfig()

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`GitHub token refresh error: ${response.status}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`GitHub token refresh error: ${data.error_description || data.error}`)
  }

  return data as GitHubTokenResponse
}

export function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
