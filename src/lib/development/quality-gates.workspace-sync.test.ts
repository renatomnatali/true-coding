import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { __synchronizeWorkspaceForGatesForTest } from './quality-gates'

const tempDirs: string[] = []

async function createWorkspace(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tc-gates-sync-'))
  tempDirs.push(dir)
  return dir
}

describe('quality gate workspace sync', () => {
  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true }))
    )
  })

  it('adds @testing-library/jest-dom when setup requires it', async () => {
    const workspace = await createWorkspace()
    await fs.mkdir(path.join(workspace, 'src/test'), { recursive: true })

    await fs.writeFile(
      path.join(workspace, 'package.json'),
      JSON.stringify(
        {
          name: 'app',
          private: true,
          devDependencies: {
            vitest: '^3.0.0',
          },
        },
        null,
        2
      ),
      'utf-8'
    )

    await fs.writeFile(
      path.join(workspace, 'src/test/setup.ts'),
      "import '@testing-library/jest-dom/vitest'\n",
      'utf-8'
    )

    const result = await __synchronizeWorkspaceForGatesForTest(workspace)
    const updated = JSON.parse(await fs.readFile(path.join(workspace, 'package.json'), 'utf-8')) as {
      devDependencies?: Record<string, string>
    }

    expect(result.changed).toBe(true)
    expect(result.fixes).toContain('added_dev_dependency:@testing-library/jest-dom')
    expect(updated.devDependencies?.['@testing-library/jest-dom']).toBe('^6.6.0')
  })

  it('rewrites app layout when next/document import is found', async () => {
    const workspace = await createWorkspace()
    await fs.mkdir(path.join(workspace, 'src/app'), { recursive: true })

    await fs.writeFile(
      path.join(workspace, 'src/app/layout.tsx'),
      [
        "import { Html } from 'next/document'",
        '',
        'export default function RootLayout() {',
        '  return <Html lang="pt-BR"><body>ok</body></Html>',
        '}',
      ].join('\n'),
      'utf-8'
    )

    const result = await __synchronizeWorkspaceForGatesForTest(workspace)
    const layout = await fs.readFile(path.join(workspace, 'src/app/layout.tsx'), 'utf-8')

    expect(result.changed).toBe(true)
    expect(result.fixes).toContain('rewrote_layout_without_next_document')
    expect(layout).not.toContain('next/document')
    expect(layout).toContain('<html lang="pt-BR">')
  })
})
