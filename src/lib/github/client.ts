import { Octokit } from '@octokit/rest'

export function createGitHubClient(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken })
}

export interface CreateRepoOptions {
  name: string
  description: string
  isPrivate?: boolean
}

export async function createRepository(
  octokit: Octokit,
  options: CreateRepoOptions
) {
  const { data: repo } = await octokit.repos.createForAuthenticatedUser({
    name: options.name,
    description: options.description,
    private: options.isPrivate ?? false,
    auto_init: true,
    has_issues: true,
    has_wiki: false,
  })

  return repo
}

export async function getAuthenticatedUser(octokit: Octokit) {
  const { data: user } = await octokit.users.getAuthenticated()
  return user
}

export async function listUserRepos(octokit: Octokit, perPage = 30, page = 1) {
  const { data: repos } = await octokit.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: perPage,
    page,
  })

  return repos
}

export async function getRepository(
  octokit: Octokit,
  owner: string,
  repo: string
) {
  const { data } = await octokit.repos.get({ owner, repo })
  return data
}

export interface FileToCommit {
  path: string
  content: string
}

export async function createCommit(
  octokit: Octokit,
  owner: string,
  repo: string,
  files: FileToCommit[],
  message: string,
  branch = 'main'
) {
  // 1. Get current branch reference
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  })

  const latestCommitSha = ref.object.sha

  // 2. Get the tree from the latest commit
  const { data: commit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: latestCommitSha,
  })

  // 3. Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64',
      })
      return { path: file.path, sha: blob.sha }
    })
  )

  // 4. Create a new tree
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: commit.tree.sha,
    tree: blobs.map((blob) => ({
      path: blob.path,
      mode: '100644' as const,
      type: 'blob' as const,
      sha: blob.sha,
    })),
  })

  // 5. Create a new commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: tree.sha,
    parents: [latestCommitSha],
  })

  // 6. Update the branch reference
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  })

  return newCommit
}

export async function createBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branchName: string,
  fromBranch = 'main'
) {
  // Get the SHA of the source branch
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${fromBranch}`,
  })

  // Create new branch
  const { data: newRef } = await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: ref.object.sha,
  })

  return newRef
}

export async function createPullRequest(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  head: string,
  base = 'main',
  body?: string
) {
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body,
  })

  return data
}

export async function findOpenPullRequestByHeadBase(
  octokit: Octokit,
  owner: string,
  repo: string,
  head: string,
  base: string
) {
  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state: 'open',
    head,
    base,
    per_page: 1,
  })

  return data[0] ?? null
}

export async function mergePullRequest(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  mergeMethod: 'merge' | 'squash' | 'rebase' = 'squash'
) {
  const { data } = await octokit.pulls.merge({
    owner,
    repo,
    pull_number: pullNumber,
    merge_method: mergeMethod,
  })

  return data
}
