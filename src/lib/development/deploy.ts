import { prisma } from '@/lib/db/prisma'
import { decrypt } from '@/lib/crypto'
import { linkSiteToRepository, getLatestDeploy } from '@/lib/netlify/client'
import type { DeployState } from '@/lib/netlify/client'

const POLL_INTERVAL_MS = 10_000
const DEPLOY_TIMEOUT_MS = 5 * 60 * 1_000

export interface DeployEvent {
  eventType: 'DEPLOY_STATUS'
  message: string
  payload: Record<string, unknown>
}

export interface DeployResult {
  success: boolean
  skipped: boolean
  productionUrl: string | null
  deployId: string | null
  error: string | null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const TERMINAL_DEPLOY_STATES: DeployState[] = ['ready', 'error']

export async function executeNetlifyDeploy(
  projectId: string,
  onEvent: (event: DeployEvent) => Promise<void>
): Promise<DeployResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      netlifySiteId: true,
      githubRepoOwner: true,
      githubRepoName: true,
      productionUrl: true,
      user: {
        select: { netlifyAccessToken: true },
      },
    },
  })

  if (!project) {
    return { success: false, skipped: false, productionUrl: null, deployId: null, error: 'Projeto não encontrado' }
  }

  // Skip deploy if Netlify is not configured
  if (!project.netlifySiteId) {
    await onEvent({
      eventType: 'DEPLOY_STATUS',
      message: 'Netlify não configurado — deploy ignorado',
      payload: { status: 'SKIPPED' },
    })
    return { success: true, skipped: true, productionUrl: project.productionUrl, deployId: null, error: null }
  }

  if (!project.user.netlifyAccessToken) {
    return { success: false, skipped: false, productionUrl: null, deployId: null, error: 'Token Netlify não encontrado' }
  }

  if (!project.githubRepoOwner || !project.githubRepoName) {
    return { success: false, skipped: false, productionUrl: null, deployId: null, error: 'Repositório GitHub não configurado' }
  }

  const accessToken = decrypt(project.user.netlifyAccessToken)
  const repoPath = `${project.githubRepoOwner}/${project.githubRepoName}`

  // Link the Netlify site to the GitHub repo — this triggers the first deploy
  await onEvent({
    eventType: 'DEPLOY_STATUS',
    message: `Linkando site Netlify ao repositório ${repoPath}`,
    payload: { status: 'LINKING', repoPath },
  })

  try {
    await linkSiteToRepository(accessToken, project.netlifySiteId, {
      repoPath,
      branch: 'main',
      buildCmd: 'npm run build',
      publishDir: '.next',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao linkar repositório'
    await onEvent({
      eventType: 'DEPLOY_STATUS',
      message: `Falha ao linkar: ${message}`,
      payload: { status: 'FAILED', error: message },
    })
    return { success: false, skipped: false, productionUrl: null, deployId: null, error: message }
  }

  // Poll for deploy completion
  await onEvent({
    eventType: 'DEPLOY_STATUS',
    message: 'Build iniciado na Netlify — aguardando conclusão',
    payload: { status: 'BUILDING' },
  })

  const startTime = Date.now()

  while (Date.now() - startTime < DEPLOY_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS)

    let deploy
    try {
      deploy = await getLatestDeploy(accessToken, project.netlifySiteId!)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao consultar status do deploy'
      await onEvent({ eventType: 'DEPLOY_STATUS', message: msg, payload: { status: 'FAILED', error: msg } })
      return { success: false, skipped: false, productionUrl: null, deployId: null, error: msg }
    }

    if (!deploy) {
      continue
    }

    if (TERMINAL_DEPLOY_STATES.includes(deploy.state)) {
      if (deploy.state === 'ready') {
        const url = deploy.sslUrl || project.productionUrl
        await onEvent({
          eventType: 'DEPLOY_STATUS',
          message: 'Deploy concluído com sucesso',
          payload: { status: 'READY', deployId: deploy.id, url },
        })
        return { success: true, skipped: false, productionUrl: url, deployId: deploy.id, error: null }
      }

      // deploy.state === 'error'
      const errorMsg = deploy.errorMessage || 'Build falhou na Netlify'
      await onEvent({
        eventType: 'DEPLOY_STATUS',
        message: `Deploy falhou: ${errorMsg}`,
        payload: { status: 'FAILED', deployId: deploy.id, error: errorMsg },
      })
      return { success: false, skipped: false, productionUrl: null, deployId: deploy.id, error: errorMsg }
    }

    // Still in progress — emit progress event
    await onEvent({
      eventType: 'DEPLOY_STATUS',
      message: `Deploy em andamento (${deploy.state})`,
      payload: { status: deploy.state, deployId: deploy.id },
    })
  }

  // Timeout
  const timeoutMsg = `Deploy excedeu o timeout de ${DEPLOY_TIMEOUT_MS / 1000}s`
  await onEvent({
    eventType: 'DEPLOY_STATUS',
    message: timeoutMsg,
    payload: { status: 'TIMEOUT' },
  })
  return { success: false, skipped: false, productionUrl: null, deployId: null, error: timeoutMsg }
}
