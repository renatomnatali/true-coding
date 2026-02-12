const NETLIFY_API = 'https://api.netlify.com/api/v1'

export interface CreateSiteOptions {
  name: string
}

export interface NetlifySite {
  id: string
  name: string
  url: string
}

export async function createNetlifySite(
  accessToken: string,
  options: CreateSiteOptions
): Promise<NetlifySite> {
  // Netlify site names are globally unique — add a random suffix to avoid collisions
  const suffix = Math.random().toString(36).slice(2, 7)
  const siteName = `${options.name}-${suffix}`

  const response = await fetch(`${NETLIFY_API}/sites`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: siteName }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Netlify API error: ${response.status} — ${error.message || error.error || 'Erro ao criar site'}`)
  }

  const data = await response.json()

  return {
    id: data.id,
    name: data.name || data.subdomain,
    url: data.ssl_url || data.url || `https://${data.subdomain}.netlify.app`,
  }
}
