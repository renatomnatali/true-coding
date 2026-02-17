const NETLIFY_API = 'https://api.netlify.com/api/v1'

export interface CreateSiteOptions {
  name: string
}

export interface NetlifySite {
  id: string
  name: string
  url: string
}

export type DeployState = 'new' | 'building' | 'enqueued' | 'uploading' | 'ready' | 'error'

export interface NetlifyDeploy {
  id: string
  siteId: string
  state: DeployState
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  sslUrl: string | null
}

export interface LinkSiteToRepoOptions {
  repoPath: string
  branch: string
  buildCmd: string
  publishDir: string
}

export async function createNetlifySite(
  accessToken: string,
  options: CreateSiteOptions
): Promise<NetlifySite> {
  // Netlify site names are globally unique — add a random suffix to avoid collisions
  const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
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

export async function linkSiteToRepository(
  accessToken: string,
  siteId: string,
  options: LinkSiteToRepoOptions
): Promise<NetlifySite> {
  const response = await fetch(`${NETLIFY_API}/sites/${siteId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repo: {
        provider: 'github',
        repo_path: options.repoPath,
        repo_branch: options.branch,
        cmd: options.buildCmd,
        dir: options.publishDir,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Netlify API error: ${response.status} — ${error.message || error.error || 'Erro ao linkar repositório'}`)
  }

  const data = await response.json()

  return {
    id: data.id,
    name: data.name || data.subdomain,
    url: data.ssl_url || data.url || `https://${data.subdomain}.netlify.app`,
  }
}

export async function getLatestDeploy(
  accessToken: string,
  siteId: string
): Promise<NetlifyDeploy | null> {
  const response = await fetch(`${NETLIFY_API}/sites/${siteId}/deploys?per_page=1`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Netlify API error: ${response.status} — ${error.message || error.error || 'Erro ao buscar deploy'}`)
  }

  const deploys = await response.json()

  if (!Array.isArray(deploys) || deploys.length === 0) {
    return null
  }

  const d = deploys[0]
  return {
    id: d.id,
    siteId: d.site_id,
    state: d.state,
    errorMessage: d.error_message || null,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    sslUrl: d.ssl_url || null,
  }
}

export async function getDeployById(
  accessToken: string,
  deployId: string
): Promise<NetlifyDeploy> {
  const response = await fetch(`${NETLIFY_API}/deploys/${deployId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Netlify API error: ${response.status} — ${error.message || error.error || 'Erro ao buscar deploy'}`)
  }

  const d = await response.json()

  return {
    id: d.id,
    siteId: d.site_id,
    state: d.state,
    errorMessage: d.error_message || null,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    sslUrl: d.ssl_url || null,
  }
}
