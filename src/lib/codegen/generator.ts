import Anthropic from '@anthropic-ai/sdk'
import { TechnicalPlan } from '@/lib/ai/prompts/planning'
import { CODEGEN_SYSTEM_PROMPT, CODEGEN_PROMPTS } from '@/lib/ai/prompts/codegen'
import {
  loadBaseTemplates,
  TemplateContext,
  GeneratedFile,
  kebabCase,
} from './templates'
import { validateGeneratedFiles, ValidationResult } from './validator'
import { extractJSON } from '@/lib/ai/parsers'

/**
 * Validates and sanitizes a file path to prevent path traversal attacks.
 * Returns null if the path is invalid/malicious.
 */
export function sanitizePath(path: string): string | null {
  // Reject empty paths
  if (!path || path.trim() === '') {
    return null
  }

  // Normalize path and remove leading/trailing whitespace
  let normalized = path.trim()

  // Reject absolute paths
  if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
    return null
  }

  // Reject paths with .. components (path traversal)
  if (normalized.includes('..')) {
    return null
  }

  // Reject paths with null bytes (null byte injection)
  if (normalized.includes('\0')) {
    return null
  }

  // Normalize multiple slashes to single slash
  normalized = normalized.replace(/\/+/g, '/')

  // Remove leading ./ if present
  if (normalized.startsWith('./')) {
    normalized = normalized.slice(2)
  }

  // Ensure path doesn't start with a dot followed by nothing (hidden files at root are ok)
  // but reject paths that are just "." or ".."
  if (normalized === '.' || normalized === '..') {
    return null
  }

  return normalized
}

/**
 * Sanitizes all generated files, filtering out those with invalid paths.
 */
export function sanitizeGeneratedFiles(
  files: GeneratedFile[]
): GeneratedFile[] {
  return files
    .map((file) => {
      const sanitizedPath = sanitizePath(file.path)
      if (!sanitizedPath) {
        console.warn(`Rejecting file with invalid path: ${file.path}`)
        return null
      }
      return { ...file, path: sanitizedPath }
    })
    .filter((file): file is GeneratedFile => file !== null)
}

export interface GenerationEvent {
  type:
    | 'stage'
    | 'file_generated'
    | 'validation_started'
    | 'validation_result'
    | 'error'
    | 'done'
  stage?:
    | 'loading_templates'
    | 'generating_files'
    | 'validating'
    | 'committing'
  file?: GeneratedFile
  validation?: ValidationResult
  error?: string
  files?: GeneratedFile[]
}

export interface ProjectData {
  id: string
  name: string
  description: string
  technicalPlan: TechnicalPlan
  hasAuth: boolean
  hasDatabase: boolean
}

function buildTemplateContext(project: ProjectData): TemplateContext {
  const { technicalPlan } = project

  // Handle both new and legacy TechnicalPlan formats
  const pages = technicalPlan.pages || []
  const entities = technicalPlan.dataModel?.entities || []
  const components = technicalPlan.components || []

  return {
    projectName: project.name,
    projectSlug: kebabCase(project.name),
    description: project.description,
    features: pages.map((p) => p.name),
    hasDatabase: project.hasDatabase,
    hasAuth: project.hasAuth,
    entities: entities.map((e) => ({
      name: e.name,
      fields: e.fields,
    })),
    pages: pages.map((p) => ({
      path: p.path,
      name: p.name,
      components: p.components,
    })),
    components: components,
  }
}

async function generateFileWithAI(
  client: Anthropic,
  prompt: string,
  context: string
): Promise<GeneratedFile[]> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    temperature: 0.2,
    system: CODEGEN_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `${context}\n\n${prompt}\n\nRetorne apenas o JSON com os arquivos gerados, sem texto adicional.`,
      },
    ],
  })

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : ''
  const { data: result } = extractJSON<{ files: GeneratedFile[] }>(responseText)

  // Sanitize all file paths to prevent path traversal attacks
  return sanitizeGeneratedFiles(result?.files ?? [])
}

async function generatePageWithAI(
  client: Anthropic,
  page: NonNullable<TechnicalPlan['pages']>[0],
  context: TemplateContext
): Promise<GeneratedFile[]> {
  const prompt = CODEGEN_PROMPTS.pageComponent
    .replace('{pageName}', page.name)
    .replace('{pagePath}', page.path)
    .replace('{description}', page.description)
    .replace('{components}', page.components.join(', '))
    .replace('{dataFetching}', page.dataFetching)

  const contextStr = `Projeto: ${context.projectName}\nDescricao: ${context.description}`

  return generateFileWithAI(client, prompt, contextStr)
}

async function generateComponentWithAI(
  client: Anthropic,
  component: NonNullable<TechnicalPlan['components']>[0],
  context: TemplateContext
): Promise<GeneratedFile[]> {
  const prompt = CODEGEN_PROMPTS.uiComponent
    .replace('{componentName}', component.name)
    .replace('{description}', component.description)
    .replace('{props}', JSON.stringify(component.props))

  const contextStr = `Projeto: ${context.projectName}\nDescricao: ${context.description}`

  return generateFileWithAI(client, prompt, contextStr)
}

// Helper type for flat endpoint (extracted from grouped structure)
interface FlatEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  description: string
}

// Extract flat endpoints from grouped structure
function flattenApiEndpoints(
  apiEndpoints: TechnicalPlan['apiEndpoints']
): FlatEndpoint[] {
  return apiEndpoints.flatMap((group) =>
    group.endpoints.map((ep) => ({
      method: ep.method,
      path: ep.path,
      description: ep.description,
    }))
  )
}

async function generateAPIRouteWithAI(
  client: Anthropic,
  endpoint: FlatEndpoint,
  context: TemplateContext
): Promise<GeneratedFile[]> {
  const prompt = CODEGEN_PROMPTS.apiRoute
    .replace('{method}', endpoint.method)
    .replace('{path}', endpoint.path)
    .replace('{requestBody}', '{}')
    .replace('{responseBody}', '{}')
    .replace('{authentication}', 'Sim')

  const contextStr = `Projeto: ${context.projectName}\nDescricao: ${context.description}`

  return generateFileWithAI(client, prompt, contextStr)
}

export async function* generateProject(
  project: ProjectData
): AsyncGenerator<GenerationEvent> {
  const client = new Anthropic()
  const context = buildTemplateContext(project)
  const allFiles: GeneratedFile[] = []

  try {
    // 1. Load base templates
    yield { type: 'stage', stage: 'loading_templates' }
    const baseFiles = await loadBaseTemplates(context)
    allFiles.push(...baseFiles)

    for (const file of baseFiles) {
      yield { type: 'file_generated', file }
    }

    // 2. Generate custom files via AI
    yield { type: 'stage', stage: 'generating_files' }

    // Generate pages (skip root page as it's in templates)
    for (const page of project.technicalPlan.pages ?? []) {
      if (page.path === '/') continue // Already generated from template

      const pageFiles = await generatePageWithAI(client, page, context)
      for (const file of pageFiles) {
        allFiles.push(file)
        yield { type: 'file_generated', file }
      }
    }

    // Generate components
    for (const component of project.technicalPlan.components ?? []) {
      const componentFiles = await generateComponentWithAI(
        client,
        component,
        context
      )
      for (const file of componentFiles) {
        allFiles.push(file)
        yield { type: 'file_generated', file }
      }
    }

    // Generate API routes (flatten grouped endpoints)
    const flatEndpoints = flattenApiEndpoints(project.technicalPlan.apiEndpoints)
    for (const endpoint of flatEndpoints) {
      const routeFiles = await generateAPIRouteWithAI(client, endpoint, context)
      for (const file of routeFiles) {
        allFiles.push(file)
        yield { type: 'file_generated', file }
      }
    }

    // 3. Validate generated code
    yield { type: 'stage', stage: 'validating' }
    yield { type: 'validation_started' }

    const validation = await validateGeneratedFiles(allFiles)
    yield { type: 'validation_result', validation }

    if (!validation.valid) {
      yield {
        type: 'error',
        error: `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
      }
      return
    }

    // 4. Done
    yield { type: 'done', files: allFiles }
  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function generateProjectFiles(
  project: ProjectData
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = []

  for await (const event of generateProject(project)) {
    if (event.type === 'file_generated' && event.file) {
      files.push(event.file)
    }
    if (event.type === 'done' && event.files) {
      return event.files
    }
    if (event.type === 'error') {
      throw new Error(event.error)
    }
  }

  return files
}
