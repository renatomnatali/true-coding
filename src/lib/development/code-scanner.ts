import fs from 'node:fs/promises'
import path from 'node:path'

export interface ScanFinding {
  file: string
  line: number
  check: string
  severity: 'fail' | 'warn'
  match: string
}

export interface ScanCheck {
  name: string
  pattern: RegExp
  severity: 'fail' | 'warn'
}

const SCANNABLE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  '.turbo',
  'coverage',
  'dist',
])

async function collectScannableFiles(
  rootPath: string,
  relativePath: string,
  output: string[]
): Promise<void> {
  const absolutePath = path.join(rootPath, relativePath)
  const entries = await fs.readdir(absolutePath, { withFileTypes: true })

  for (const entry of entries) {
    const entryRelative = relativePath
      ? `${relativePath}/${entry.name}`
      : entry.name

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue
      await collectScannableFiles(rootPath, entryRelative, output)
      continue
    }

    if (!entry.isFile()) continue
    const ext = path.extname(entry.name)
    if (!SCANNABLE_EXTENSIONS.has(ext)) continue

    output.push(entryRelative)
  }
}

export async function scanWorkspaceFiles(
  workspacePath: string,
  checks: ScanCheck[]
): Promise<ScanFinding[]> {
  const files: string[] = []
  await collectScannableFiles(workspacePath, '', files)

  const findings: ScanFinding[] = []

  for (const file of files) {
    const absolutePath = path.join(workspacePath, file)
    const content = await fs.readFile(absolutePath, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      for (const check of checks) {
        const match = check.pattern.exec(line)
        if (match) {
          findings.push({
            file,
            line: i + 1,
            check: check.name,
            severity: check.severity,
            match: match[0],
          })
        }
      }
    }
  }

  return findings
}

export async function scanWorkspaceForEnvFiles(
  workspacePath: string
): Promise<ScanFinding[]> {
  const findings: ScanFinding[] = []

  const entries = await fs.readdir(workspacePath, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (entry.name === '.env' || (entry.name.startsWith('.env.') && entry.name !== '.env.example')) {
      findings.push({
        file: entry.name,
        line: 0,
        check: 'env_file_committed',
        severity: 'fail',
        match: entry.name,
      })
    }
  }

  return findings
}
