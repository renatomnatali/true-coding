export function getNetlifyConfig() {
  const clientId = process.env.NETLIFY_CLIENT_ID
  const clientSecret = process.env.NETLIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Netlify OAuth credentials not configured')
  }
  return { clientId, clientSecret }
}

export function getAuthorizationUrl(state: string): string {
  const { clientId } = getNetlifyConfig()

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/netlify/callback`,
    state,
  })

  return `https://app.netlify.com/authorize?${params}`
}

export interface NetlifyTokenResponse {
  access_token: string
  token_type: string
}

export async function exchangeCodeForToken(
  code: string
): Promise<NetlifyTokenResponse> {
  const { clientId, clientSecret } = getNetlifyConfig()

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/netlify/callback`,
  })

  const response = await fetch('https://api.netlify.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Netlify OAuth error: ${response.status} — ${text}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`Netlify OAuth error: ${data.error_description || data.error}`)
  }

  return data as NetlifyTokenResponse
}

export function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
