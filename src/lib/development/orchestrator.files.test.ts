import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  __collectWorkspaceArtifactsForCommit,
  __extractGeneratedFilesFromAgentOutput,
  __getFallbackBootstrapFilesForTest,
} from './orchestrator'

describe('orchestrator workspace artifacts', () => {
  it('extracts generated files from agent output', () => {
    const files = __extractGeneratedFilesFromAgentOutput({
      files: [
        { path: 'docs/specifications/generated/iter-1.feature', content: '# language: pt' },
        { path: 'src/lib/iterations/iter-1.ts', content: 'export const iter = 1' },
      ],
    })

    expect(files).toEqual([
      {
        path: 'docs/specifications/generated/iter-1.feature',
        content: '# language: pt',
      },
      {
        path: 'src/lib/iterations/iter-1.ts',
        content: 'export const iter = 1',
      },
    ])
  })

  it('rejects invalid generated file paths from agent output', () => {
    expect(() =>
      __extractGeneratedFilesFromAgentOutput({
        files: [
          { path: '../outside.txt', content: 'invalid' },
        ],
      })
    ).toThrow('INVALID_WORKSPACE_PATH')
  })

  it('collects commit artifacts from workspace and excludes runtime directories', async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'tc-orch-artifacts-'))

    await fs.mkdir(path.join(workspace, 'src/app'), { recursive: true })
    await fs.mkdir(path.join(workspace, 'node_modules/pkg'), { recursive: true })
    await fs.mkdir(path.join(workspace, '.next/cache'), { recursive: true })
    await fs.mkdir(path.join(workspace, '.git/objects'), { recursive: true })

    await fs.writeFile(path.join(workspace, 'package.json'), '{"name":"app"}', 'utf-8')
    await fs.writeFile(path.join(workspace, 'src/app/page.tsx'), 'export default function Page(){return null}', 'utf-8')
    await fs.writeFile(path.join(workspace, 'node_modules/pkg/index.js'), 'module.exports = {}', 'utf-8')
    await fs.writeFile(path.join(workspace, '.next/cache/build.txt'), 'cache', 'utf-8')
    await fs.writeFile(path.join(workspace, '.git/objects/object.txt'), 'git', 'utf-8')

    const artifacts = await __collectWorkspaceArtifactsForCommit(workspace)

    expect(artifacts).toEqual([
      {
        path: 'package.json',
        content: '{"name":"app"}',
      },
      {
        path: 'src/app/page.tsx',
        content: 'export default function Page(){return null}',
      },
    ])
  })

  it('provides fallback bootstrap files with mandatory runtime artifacts', () => {
    const files = __getFallbackBootstrapFilesForTest({
      projectName: 'Projeto Teste',
      projectDescription: 'Descrição',
      businessPlan: null,
      technicalPlan: null,
      uxPlan: null,
      approvedAssessment: null,
      approvedIterations: null,
    })

    const paths = files.map((file) => file.path)

    expect(paths).toContain('package.json')
    expect(paths).toContain('tsconfig.json')
    expect(paths).toContain('src/app/layout.tsx')
    expect(paths).toContain('src/app/page.tsx')
    expect(paths).toContain('vitest.config.ts')
  })
})
