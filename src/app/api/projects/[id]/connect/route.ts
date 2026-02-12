import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { decrypt } from '@/lib/crypto'
import { createGitHubClient, createRepository } from '@/lib/github/client'
import { createNetlifySite } from '@/lib/netlify/client'

interface ConnectParams {
  params: Promise<{ id: string }>
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100)
}

// POST /api/projects/[id]/connect
// Body: { service: 'github' | 'netlify' }
export async function POST(request: Request, { params }: ConnectParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { id } = await params
    let body: { service?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Invalid JSON body' }, { status: 400 })
    }

    const { service } = body
    if (service !== 'github' && service !== 'netlify') {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'service must be "github" or "netlify"' }, { status: 400 })
    }

    // Fetch project with owner
    const project = await prisma.project.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
    }

    if (project.user.clerkId !== userId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    if (service === 'github') {
      return await connectGitHub(project)
    }

    return await connectNetlify(project)
  } catch (error) {
    console.error('Connect endpoint error:', error)

    // Surface rate-limit errors with a user-friendly message
    const errMsg = error instanceof Error ? error.message : ''
    if (errMsg.includes('secondary rate limit') || errMsg.includes('rate limit')) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'O GitHub bloqueou temporariamente a criação de repositórios. Aguarde alguns minutos e tente novamente.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno ao conectar serviço. Tente novamente.' },
      { status: 500 }
    )
  }
}

async function connectGitHub(project: { id: string; name: string; githubRepoUrl: string | null; githubRepoOwner: string | null; githubRepoName: string | null; user: { githubAccessToken: string | null } }) {
  // Guard: token must exist
  if (!project.user.githubAccessToken) {
    return NextResponse.json(
      { error: 'PREREQUISITE_NOT_MET', message: 'GitHub não está conectado. Conecte seu GitHub primeiro.' },
      { status: 409 }
    )
  }

  // Idempotency: repo already created — return existing data
  if (project.githubRepoUrl) {
    return NextResponse.json({
      githubRepoUrl: project.githubRepoUrl,
      githubRepoOwner: project.githubRepoOwner,
      githubRepoName: project.githubRepoName,
    })
  }

  // Decrypt token
  const accessToken = decrypt(project.user.githubAccessToken)

  // Create repository
  const octokit = createGitHubClient(accessToken)
  const repoName = slugify(project.name) || 'true-coding-project'

  const repo = await createRepository(octokit, {
    name: repoName,
    description: project.name,
    isPrivate: true,
  })

  // Persist repo info
  await prisma.project.update({
    where: { id: project.id },
    data: {
      githubRepoUrl: repo.html_url,
      githubRepoOwner: repo.owner.login,
      githubRepoName: repo.name,
    },
  })

  return NextResponse.json({
    githubRepoUrl: repo.html_url,
    githubRepoOwner: repo.owner.login,
    githubRepoName: repo.name,
  })
}

async function connectNetlify(
  project: {
    id: string
    name: string
    githubRepoUrl: string | null
    productionUrl: string | null
    user: { netlifyAccessToken: string | null }
  },
) {
  // Guard: GitHub repo must exist first
  if (!project.githubRepoUrl) {
    return NextResponse.json(
      { error: 'PREREQUISITE_NOT_MET', message: 'Crie o repositório no GitHub primeiro.' },
      { status: 409 }
    )
  }

  // Guard: Netlify token must exist
  if (!project.user.netlifyAccessToken) {
    return NextResponse.json(
      { error: 'PREREQUISITE_NOT_MET', message: 'Netlify não está conectado. Conecte sua Netlify primeiro.' },
      { status: 409 }
    )
  }

  // Idempotency: already connected — return existing data
  if (project.productionUrl) {
    return NextResponse.json({
      productionUrl: project.productionUrl,
    })
  }

  // Decrypt token
  const accessToken = decrypt(project.user.netlifyAccessToken)

  // Create Netlify site (empty, no GitHub link — deploy will happen in GENERATING phase)
  const siteName = slugify(project.name) || 'true-coding-app'

  const site = await createNetlifySite(accessToken, { name: siteName })

  // Persist site info
  await prisma.project.update({
    where: { id: project.id },
    data: {
      netlifySiteId: site.id,
      productionUrl: site.url,
      status: 'GENERATING',
    },
  })

  return NextResponse.json({ productionUrl: site.url, netlifySiteId: site.id })
}
