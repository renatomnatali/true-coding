import type {
  AssessmentResult,
  IterationPlanItem,
} from '@/types/development'
import type {
  AgentExecutionContext,
  AgentExecutionResult,
  GeneratedIterationPlan,
} from './types'
import { toFeatureTag } from './utils'
import { z } from 'zod'
import {
  isClaudeAgentRuntimeEnabled,
  runClaudeAgent,
} from './agent-runtime'

function sanitizeIterationSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

interface TechnicalPlanLike {
  pages?: Array<{ name?: string; path?: string }>
  components?: Array<{ name?: string }>
  apiEndpoints?: Array<{
    category?: string
    endpoints?: Array<{ method?: string; path?: string }>
  }>
  database?: { prismaSchema?: string }
  integrations?: Array<{ name?: string }>
}

function normalizeTechnicalPlan(snapshot: AgentExecutionContext['snapshot']): TechnicalPlanLike {
  return (snapshot.technicalPlan ?? {}) as TechnicalPlanLike
}

function calculateAssessment(snapshot: AgentExecutionContext['snapshot']): AssessmentResult {
  const technical = normalizeTechnicalPlan(snapshot)
  const pages = technical.pages?.length ?? 0
  const components = technical.components?.length ?? 0
  const endpoints =
    technical.apiEndpoints?.reduce(
      (acc, group) => acc + (group.endpoints?.length ?? 0),
      0
    ) ?? 0
  const hasDatabase = Boolean(technical.database?.prismaSchema)
  const integrations = technical.integrations?.length ?? 0

  const factors = [
    {
      name: 'Pages',
      score: Math.min(pages, 5),
      maxScore: 5,
      detail: `${pages} páginas previstas`,
    },
    {
      name: 'Components',
      score: Math.min(Math.ceil(components / 2), 5),
      maxScore: 5,
      detail: `${components} componentes`,
    },
    {
      name: 'API',
      score: Math.min(Math.ceil(endpoints / 2), 5),
      maxScore: 5,
      detail: `${endpoints} endpoints`,
    },
    {
      name: 'Database',
      score: hasDatabase ? 5 : 1,
      maxScore: 5,
      detail: hasDatabase ? 'Schema Prisma presente' : 'Sem schema dedicado',
    },
    {
      name: 'Integrations',
      score: Math.min(integrations, 5),
      maxScore: 5,
      detail: `${integrations} integrações externas`,
    },
  ]

  const weightedScore = factors.reduce((acc, f) => acc + f.score, 0)
  const complexityScore = Math.round((weightedScore / 25) * 100)
  const complexityLevel =
    complexityScore >= 66 ? 'complex' : complexityScore >= 33 ? 'medium' : 'simple'
  const recommendedIterations =
    complexityLevel === 'complex' ? 4 : complexityLevel === 'medium' ? 3 : 2

  return {
    complexityScore,
    complexityLevel,
    factors,
    recommendedIterations,
  }
}

function buildIterationPlan(
  snapshot: AgentExecutionContext['snapshot'],
  assessment: AssessmentResult
): IterationPlanItem[] {
  const technical = normalizeTechnicalPlan(snapshot)
  const pageNames = (technical.pages ?? []).map((p) => p.name || p.path || 'page')
  const endpointPaths = (technical.apiEndpoints ?? []).flatMap((group) =>
    (group.endpoints ?? []).map((e) => `${e.method || 'GET'} ${e.path || '/api/resource'}`)
  )

  const defaultIterations: Array<{ name: string; goals: string[]; risks: string[] }> = [
    {
      name: 'Fundacao',
      goals: [
        'Estrutura base do app e qualidade inicial',
        'Configuração de autenticação e dados principais',
      ],
      risks: ['Acoplamento alto em componentes base'],
    },
    {
      name: 'Core Features',
      goals: [
        'Implementar fluxos principais do usuário',
        'Cobrir endpoints críticos com testes',
      ],
      risks: ['Regras de negócio incompletas no primeiro ciclo'],
    },
    {
      name: 'Stability',
      goals: [
        'Refinar UX principal e estados de erro',
        'Fortalecer observabilidade e robustez de testes',
      ],
      risks: ['Regressões em cenários de borda'],
    },
    {
      name: 'Release',
      goals: [
        'Hardening final para deploy',
        'Ajustes de performance e segurança',
      ],
      risks: ['Ajustes finais de infraestrutura'],
    },
  ]

  const iterationCount = assessment.recommendedIterations

  return defaultIterations.slice(0, iterationCount).map((base, i) => {
    const iterationIndex = i + 1
    const selectedPages = pageNames.slice(i * 2, i * 2 + 2)
    const selectedEndpoints = endpointPaths.slice(i * 2, i * 2 + 3)
    const goals = [...base.goals]

    if (selectedPages.length > 0) {
      goals.push(`Cobrir páginas: ${selectedPages.join(', ')}`)
    }

    if (selectedEndpoints.length > 0) {
      goals.push(`Cobrir APIs: ${selectedEndpoints.join(', ')}`)
    }

    const featureTag = toFeatureTag(base.name)

    return {
      index: iterationIndex,
      name: base.name,
      slug: featureTag.replace('@', ''),
      scope: {
        goals,
        featureTags: [featureTag],
        risks: base.risks,
      },
      gherkinPath: `docs/specifications/generated/iter-${iterationIndex}-${base.name
        .toLowerCase()
        .replace(/\s+/g, '-')}.feature`,
    }
  })
}

const DEVELOPMENT_AGENT_SYSTEM_PROMPT = [
  'Você é um agente especialista em desenvolvimento de software.',
  'Retorne SOMENTE JSON válido, sem markdown, sem explicações extras.',
  'Nunca inclua paths absolutos, ".." ou caracteres nulos em arquivos.',
  'Todo conteúdo de interface deve estar em português brasileiro com acentuação correta.',
].join(' ')

const filePathSchema = z
  .string()
  .min(1)
  .refine((value) => !value.startsWith('/'), 'Path não pode ser absoluto')
  .refine((value) => !value.includes('..'), 'Path não pode conter ..')
  .refine((value) => !value.includes('\0'), 'Path não pode conter caractere nulo')

const generatedFileSchema = z.object({
  path: filePathSchema,
  content: z.string().min(1),
})

const specAgentSchema = z.object({
  gherkinPath: filePathSchema,
  featureTags: z.array(z.string().min(1)).min(1),
  gherkin: z.string().min(1),
  files: z.array(generatedFileSchema).min(1),
})

const testAgentSchema = z.object({
  redStateConfirmed: z.boolean(),
  testTargets: z.array(z.string().min(1)).min(1),
  command: z.string().min(1),
  files: z.array(generatedFileSchema).min(1),
})

const codeAgentSchema = z.object({
  appliedChanges: z.array(z.string().min(1)).min(1),
  branchStrategy: z.string().min(1),
  commitMessage: z.string().min(1),
  files: z.array(generatedFileSchema).min(1),
})

const reviewAgentSchema = z.object({
  approved: z.boolean(),
  checks: z.array(z.string().min(1)).min(1),
  notes: z.string().min(1),
})

function compactJSON(value: unknown, maxLength = 16_000): string {
  const raw = JSON.stringify(value, null, 2)
  if (!raw) return '{}'
  if (raw.length <= maxLength) return raw
  return `${raw.slice(0, maxLength)}\n... [truncated]`
}

function canUseDeterministicFallback(): boolean {
  return process.env.NODE_ENV === 'test'
}

export async function runAssessmentAgent(
  context: AgentExecutionContext
): Promise<AgentExecutionResult<AssessmentResult>> {
  const output = calculateAssessment(context.snapshot)
  return {
    output,
    tokenUsage: 120,
    cost: 0.0009,
  }
}

export async function runIterationPlannerAgent(
  context: AgentExecutionContext,
  assessment: AssessmentResult
): Promise<AgentExecutionResult<GeneratedIterationPlan>> {
  const iterations = buildIterationPlan(context.snapshot, assessment)
  return {
    output: {
      assessment,
      iterations,
    },
    tokenUsage: 220,
    cost: 0.0017,
  }
}

export async function runSpecAgent(
  context: AgentExecutionContext,
  iteration: IterationPlanItem
): Promise<AgentExecutionResult<Record<string, unknown>>> {
  if (isClaudeAgentRuntimeEnabled()) {
    const prompt = [
      'Gere o pacote do SpecAgent para a iteração.',
      '',
      'CONTRATO JSON OBRIGATÓRIO:',
      '{',
      '  "gherkinPath": string,',
      '  "featureTags": string[],',
      '  "gherkin": string,',
      '  "files": [{ "path": string, "content": string }]',
      '}',
      '',
      'REGRAS:',
      '- `gherkinPath` deve ser igual ao valor informado da iteração.',
      '- O arquivo de gherkin deve incluir cenário principal + cenário de erro.',
      '- Inclua também um arquivo .notes.md com objetivos da iteração.',
      '- Não retorne nenhum texto fora do JSON.',
      '',
      `RunId: ${context.runId}`,
      `ProjectId: ${context.projectId}`,
      `Iteration: ${JSON.stringify(iteration, null, 2)}`,
      '',
      `BusinessPlan: ${compactJSON(context.snapshot.businessPlan)}`,
      `TechnicalPlan: ${compactJSON(context.snapshot.technicalPlan)}`,
      `UxPlan: ${compactJSON(context.snapshot.uxPlan)}`,
    ].join('\n')

    return runClaudeAgent({
      agentName: 'SpecAgent',
      systemPrompt: DEVELOPMENT_AGENT_SYSTEM_PROMPT,
      userPrompt: prompt,
      schema: specAgentSchema,
      phase: 'codegen',
    })
  } else if (!canUseDeterministicFallback()) {
    throw new Error('AGENT_RUNTIME_DISABLED:SpecAgent')
  }

  const slug = sanitizeIterationSlug(iteration.name) || `iter-${iteration.index}`
  const gherkin = [
    '# language: pt',
    `@autonomous ${iteration.scope.featureTags.join(' ')}`,
    `Funcionalidade: Iteração ${iteration.index} - ${iteration.name}`,
    '  Como usuário da aplicação',
    '  Eu quero executar o fluxo principal da iteração',
    '  Para validar o incremento com segurança',
    '',
    '  Cenário: Escopo da iteração',
    '    Dado que o pipeline está em execução',
    `    Quando a iteração ${iteration.index} é processada`,
    '    Então os critérios de aceite desta iteração devem passar',
  ].join('\n')

  return {
    output: {
      gherkinPath: iteration.gherkinPath,
      featureTags: iteration.scope.featureTags,
      gherkin,
      files: [
        {
          path: iteration.gherkinPath,
          content: gherkin,
        },
        {
          path: `docs/specifications/generated/iter-${iteration.index}-${slug}.notes.md`,
          content: [
            `# Iteração ${iteration.index} - ${iteration.name}`,
            '',
            `Run: ${context.runId}`,
            `Projeto: ${context.projectId}`,
            '',
            '## Objetivos',
            ...iteration.scope.goals.map((goal) => `- ${goal}`),
          ].join('\n'),
        },
      ],
    },
    tokenUsage: 260,
    cost: 0.0021,
  }
}

export async function runTestAgent(
  context: AgentExecutionContext,
  iteration: IterationPlanItem
): Promise<AgentExecutionResult<Record<string, unknown>>> {
  if (isClaudeAgentRuntimeEnabled()) {
    const prompt = [
      'Gere o pacote do TestAgent para a iteração.',
      '',
      'CONTRATO JSON OBRIGATÓRIO:',
      '{',
      '  "redStateConfirmed": boolean,',
      '  "testTargets": string[],',
      '  "command": string,',
      '  "files": [{ "path": string, "content": string }]',
      '}',
      '',
      'REGRAS:',
      '- Gerar testes unitários e BDD do escopo da iteração.',
      '- `redStateConfirmed` só pode ser true quando os testes foram escritos para falhar antes do code agent.',
      '- Inclua paths em `src/lib/iterations/*.test.ts` e `tests/e2e/steps/*.test.ts`.',
      '- Não retorne nenhum texto fora do JSON.',
      '',
      `RunId: ${context.runId}`,
      `ProjectId: ${context.projectId}`,
      `Iteration: ${JSON.stringify(iteration, null, 2)}`,
      '',
      `TechnicalPlan: ${compactJSON(context.snapshot.technicalPlan)}`,
      `UxPlan: ${compactJSON(context.snapshot.uxPlan)}`,
    ].join('\n')

    return runClaudeAgent({
      agentName: 'TestAgent',
      systemPrompt: DEVELOPMENT_AGENT_SYSTEM_PROMPT,
      userPrompt: prompt,
      schema: testAgentSchema,
      phase: 'codegen',
    })
  } else if (!canUseDeterministicFallback()) {
    throw new Error('AGENT_RUNTIME_DISABLED:TestAgent')
  }

  const sanitizedTag = toFeatureTag(iteration.name).replace('@', '')
  const unitTestPath = `src/lib/iterations/iter-${iteration.index}.test.ts`
  const bddTestPath = `tests/e2e/steps/iter-${iteration.index}-${sanitizedTag}.test.ts`

  const unitTestContent = [
    "import { describe, it, expect } from 'vitest'",
    `import { describeIteration } from './iter-${iteration.index}'`,
    '',
    `describe('Iteração ${iteration.index} - ${iteration.name}', () => {`,
    "  it('retorna resumo da iteração', () => {",
    '    expect(describeIteration()).toContain(\'Iteração\')',
    `    expect(describeIteration()).toContain('${iteration.name}')`,
    '  })',
    '})',
  ].join('\n')

  const bddTestContent = [
    "import { describe, it, expect } from 'vitest'",
    '',
    `describe('BDD Iteração ${iteration.index} - ${iteration.name}', () => {`,
    "  it('mantém cenário de aceitação válido', () => {",
    `    expect('${iteration.scope.featureTags[0] ?? '@iter'}').toMatch(/^@/)`,
    '  })',
    '})',
  ].join('\n')

  return {
    output: {
      redStateConfirmed: true,
      testTargets: iteration.scope.goals,
      command: 'npm run test -- tests/e2e/steps',
      files: [
        {
          path: unitTestPath,
          content: unitTestContent,
        },
        {
          path: bddTestPath,
          content: bddTestContent,
        },
      ],
    },
    tokenUsage: 180,
    cost: 0.0014,
  }
}

export async function runCodeAgent(
  context: AgentExecutionContext,
  iteration: IterationPlanItem,
  attempt: number
): Promise<AgentExecutionResult<Record<string, unknown>>> {
  if (isClaudeAgentRuntimeEnabled()) {
    const prompt = [
      'Gere o pacote do CodeAgent para a iteração.',
      '',
      'CONTRATO JSON OBRIGATÓRIO:',
      '{',
      '  "appliedChanges": string[],',
      '  "branchStrategy": string,',
      '  "commitMessage": string,',
      '  "files": [{ "path": string, "content": string }]',
      '}',
      '',
      'REGRAS:',
      '- Implementar somente o necessário para satisfazer os testes da iteração.',
      '- `commitMessage` deve seguir `feat(iter-<n>): <escopo>`.',
      '- Não alterar arquivos fora do escopo da iteração.',
      '- Não retorne nenhum texto fora do JSON.',
      '',
      `RunId: ${context.runId}`,
      `ProjectId: ${context.projectId}`,
      `Attempt: ${attempt}`,
      `Iteration: ${JSON.stringify(iteration, null, 2)}`,
      '',
      `TechnicalPlan: ${compactJSON(context.snapshot.technicalPlan)}`,
      `UxPlan: ${compactJSON(context.snapshot.uxPlan)}`,
    ].join('\n')

    return runClaudeAgent({
      agentName: 'CodeAgent',
      systemPrompt: DEVELOPMENT_AGENT_SYSTEM_PROMPT,
      userPrompt: prompt,
      schema: codeAgentSchema,
      phase: 'codegen',
    })
  } else if (!canUseDeterministicFallback()) {
    throw new Error('AGENT_RUNTIME_DISABLED:CodeAgent')
  }

  const implementationPath = `src/lib/iterations/iter-${iteration.index}.ts`
  const implementationContent = [
    `export function describeIteration() {`,
    `  return 'Iteração ${iteration.index} - ${iteration.name}'`,
    '}',
    '',
    `export function getIterationGoals() {`,
    `  return ${JSON.stringify(iteration.scope.goals)}`,
    '}',
  ].join('\n')

  return {
    output: {
      appliedChanges: [
        `Implementação incremental para ${iteration.name}`,
        `Tentativa ${attempt}`,
      ],
      branchStrategy: 'trunk-based-short-branch',
      commitMessage: `feat(iter-${iteration.index}): ${iteration.name}`,
      files: [
        {
          path: implementationPath,
          content: implementationContent,
        },
      ],
    },
    tokenUsage: 520,
    cost: 0.0062,
  }
}

export async function runReviewAgent(
  context: AgentExecutionContext,
  iteration: IterationPlanItem
): Promise<AgentExecutionResult<Record<string, unknown>>> {
  if (isClaudeAgentRuntimeEnabled()) {
    const prompt = [
      'Gere o pacote do ReviewAgent para a iteração.',
      '',
      'CONTRATO JSON OBRIGATÓRIO:',
      '{',
      '  "approved": boolean,',
      '  "checks": string[],',
      '  "notes": string',
      '}',
      '',
      'REGRAS:',
      '- Validar aderência ao escopo da iteração e aos planos técnico/UX.',
      '- Validar riscos de segurança e regressão.',
      '- Se houver bloqueio crítico, `approved` deve ser false e `notes` deve explicar.',
      '- Não retorne nenhum texto fora do JSON.',
      '',
      `RunId: ${context.runId}`,
      `ProjectId: ${context.projectId}`,
      `Iteration: ${JSON.stringify(iteration, null, 2)}`,
      '',
      `TechnicalPlan: ${compactJSON(context.snapshot.technicalPlan)}`,
      `UxPlan: ${compactJSON(context.snapshot.uxPlan)}`,
    ].join('\n')

    return runClaudeAgent({
      agentName: 'ReviewAgent',
      systemPrompt: DEVELOPMENT_AGENT_SYSTEM_PROMPT,
      userPrompt: prompt,
      schema: reviewAgentSchema,
      phase: 'codegen',
    })
  } else if (!canUseDeterministicFallback()) {
    throw new Error('AGENT_RUNTIME_DISABLED:ReviewAgent')
  }

  return {
    output: {
      approved: true,
      checks: ['security-scan', 'regression-review', 'scope-adherence'],
      notes: `Escopo da iteração ${iteration.index} (${iteration.name}) aprovado para gates`,
    },
    tokenUsage: 140,
    cost: 0.0011,
  }
}

export async function runReleaseAgent(
  _context: AgentExecutionContext,
  iteration: IterationPlanItem,
  branchName: string
): Promise<AgentExecutionResult<Record<string, unknown>>> {
  return {
    output: {
      branchName,
      pullRequestTitle: `feat(iter-${iteration.index}): ${iteration.name}`,
      mergeStrategy: 'squash',
      merged: true,
    },
    tokenUsage: 90,
    cost: 0.0007,
  }
}

export async function runRecoveryAgent(
  _context: AgentExecutionContext,
  iteration: IterationPlanItem,
  attempt: number,
  failedGates: string[]
): Promise<AgentExecutionResult<Record<string, unknown>>> {
  return {
    output: {
      nextAttempt: attempt + 1,
      recommendation: `Ajustar implementação da iteração ${iteration.index} para gates: ${failedGates.join(', ')}`,
      fallback: 'checkpoint',
    },
    tokenUsage: 120,
    cost: 0.0009,
  }
}

export async function runDeployAgent(
  _context: AgentExecutionContext,
  iteration: IterationPlanItem
): Promise<AgentExecutionResult<Record<string, unknown>>> {
  return {
    output: {
      deployed: true,
      message: `Deploy concluído para iteração ${iteration.index}`,
      environment: 'production',
    },
    tokenUsage: 80,
    cost: 0.0006,
  }
}
