import { prisma } from '@/lib/db/prisma'
import { decrypt } from '@/lib/crypto'
import {
  createGitHubClient,
  createPullRequest,
  findOpenPullRequestByHeadBase,
  getRepository,
  mergePullRequest,
} from '@/lib/github/client'
import {
  executeGitCliRelease,
  type GitReleaseCheckpoint,
} from './git-release-cli'

export interface IterationGitReleaseInput {
  projectId: string
  iterationIndex: number
  iterationName: string
  branchName: string
  gherkinPath: string
  gherkinContent: string
  artifacts?: Array<{
    path: string
    content: string
  }>
  onCheckpoint?: (checkpoint: GitReleaseCheckpoint) => Promise<void> | void
}

export interface IterationGitReleaseResult {
  branchName: string
  baseBranch: string
  commitSha: string
  pullRequestNumber: number
  pullRequestUrl: string
  merged: boolean
  mergeCommitSha: string | null
  checkpoints: GitReleaseCheckpoint[]
}

function getReleaseModeFromEnv(): 'git-cli' {
  const configured = (process.env.AUTONOMOUS_DEV_RELEASE_MODE ?? 'git-cli')
    .trim()
    .toLowerCase()

  if (configured !== 'git-cli') {
    throw new Error(`UNSUPPORTED_RELEASE_MODE:${configured}`)
  }

  return 'git-cli'
}

export async function executeIterationGitRelease(
  input: IterationGitReleaseInput
): Promise<IterationGitReleaseResult> {
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: {
      id: true,
      githubRepoOwner: true,
      githubRepoName: true,
      user: {
        select: {
          githubAccessToken: true,
        },
      },
    },
  })

  if (!project?.githubRepoOwner || !project.githubRepoName) {
    throw new Error('GITHUB_NOT_CONNECTED')
  }

  if (!project.user.githubAccessToken) {
    throw new Error('GITHUB_TOKEN_MISSING')
  }

  getReleaseModeFromEnv()

  const accessToken = decrypt(project.user.githubAccessToken)
  const client = createGitHubClient(accessToken)
  const repository = await getRepository(client, project.githubRepoOwner, project.githubRepoName)
  const baseBranch =
    typeof repository.default_branch === 'string' && repository.default_branch.length > 0
      ? repository.default_branch
      : 'main'

  const cloneUrl =
    typeof repository.clone_url === 'string' && repository.clone_url.length > 0
      ? repository.clone_url
      : null
  const htmlUrl =
    typeof repository.html_url === 'string' && repository.html_url.length > 0
      ? repository.html_url
      : `https://github.com/${project.githubRepoOwner}/${project.githubRepoName}`

  if (!cloneUrl) {
    throw new Error('GITHUB_REPOSITORY_CLONE_URL_MISSING')
  }

  const artifacts = [
    {
      path: input.gherkinPath,
      content: input.gherkinContent,
    },
    ...(input.artifacts ?? []).filter((artifact) => (
      artifact.path !== input.gherkinPath && artifact.path.trim().length > 0
    )),
  ]

  const gitCliReleaseResult = await executeGitCliRelease({
    repositoryCloneUrl: cloneUrl,
    repositoryHtmlUrl: htmlUrl,
    baseBranch,
    branchName: input.branchName,
    commitMessage: `feat(iter-${input.iterationIndex}): ${input.iterationName}`,
    artifacts,
    accessToken,
    onCheckpoint: input.onCheckpoint,
  })

  const headRef = `${project.githubRepoOwner}:${input.branchName}`
  let pullRequest: Awaited<ReturnType<typeof createPullRequest>> | Awaited<ReturnType<typeof findOpenPullRequestByHeadBase>> = await findOpenPullRequestByHeadBase(
    client,
    project.githubRepoOwner,
    project.githubRepoName,
    headRef,
    baseBranch
  )

  if (!pullRequest) {
    try {
      pullRequest = await createPullRequest(
        client,
        project.githubRepoOwner,
        project.githubRepoName,
        `feat(iter-${input.iterationIndex}): ${input.iterationName}`,
        input.branchName,
        baseBranch,
        `Iteração ${input.iterationIndex} (${input.iterationName}) automatizada pelo pipeline autônomo.`
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const duplicatedPr = message.toLowerCase().includes('already exists')

      if (!duplicatedPr) {
        throw error
      }

      pullRequest = await findOpenPullRequestByHeadBase(
        client,
        project.githubRepoOwner,
        project.githubRepoName,
        headRef,
        baseBranch
      )
      if (!pullRequest) {
        throw error
      }
    }
  }

  const mergeResult = await mergePullRequest(
    client,
    project.githubRepoOwner,
    project.githubRepoName,
    pullRequest.number,
    'squash'
  )

  return {
    branchName: input.branchName,
    baseBranch,
    commitSha: gitCliReleaseResult.commitSha,
    pullRequestNumber: pullRequest.number,
    pullRequestUrl: pullRequest.html_url ?? '',
    merged: Boolean(mergeResult.merged),
    mergeCommitSha: typeof mergeResult.sha === 'string' ? mergeResult.sha : null,
    checkpoints: gitCliReleaseResult.checkpoints,
  }
}

