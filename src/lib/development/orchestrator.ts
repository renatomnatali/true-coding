import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import {
  runAssessmentAgent,
  runIterationPlannerAgent,
  runSpecAgent,
  runTestAgent,
  runCodeAgent,
  runReviewAgent,
} from './agents'
import { appendRunEvent } from './events'
import { buildFailedGateSummary, extractPrimaryGateFailureDetail } from './gate-diagnostics'
import { runQualityGates } from './quality-gates'
import {
  isBabyStepModeEnabledFromEnv,
  shouldPauseForBabyStepCheckpoint,
} from './retry-strategy'
import { markRunActive, unmarkRunActive } from './worker-registry'
import { TERMINAL_RUN_STATUSES, toBranchName } from './utils'
import type { PlanSnapshot, GateRunOutput } from './types'
import { executeIterationGitRelease, type IterationGitReleaseResult } from './gitops'
import { executeAgent } from './agent-executor'
import {
  getApprovedPlan,
  type RunContext,
} from './plan-snapshot'
import { executeNetlifyDeploy } from './deploy'
import {
  sanitizeWorkspacePath,
  mergeWorkspaceFiles,
  __extractGeneratedFilesFromAgentOutput,
  __collectWorkspaceArtifactsForCommit,
  writeWorkspaceFiles,
  ensureWorkspaceBootstrap,
  ensureSandbox,
  cleanupSandbox,
  __getFallbackBootstrapFilesForTest,
} from './workspace'

export {
  __extractGeneratedFilesFromAgentOutput,
  __collectWorkspaceArtifactsForCommit,
  __getFallbackBootstrapFilesForTest,
}

const MAX_ITERATION_ATTEMPTS = 3

async function getRunSnapshot(runId: string): Promise<PlanSnapshot> {
  const run = await prisma.developmentRun.findUnique({
    where: { id: runId },
    select: { plansSnapshot: true },
  })

  const snapshot = (run?.plansSnapshot ?? {}) as Record<string, unknown>
  const baseSnapshot: PlanSnapshot = {
    businessPlan: snapshot.businessPlan ?? null,
    technicalPlan: snapshot.technicalPlan ?? null,
    uxPlan: snapshot.uxPlan ?? null,
    approvedAssessment: snapshot.approvedAssessment as PlanSnapshot['approvedAssessment'],
    approvedIterations: snapshot.approvedIterations as PlanSnapshot['approvedIterations'],
  }
  const approvedPlan = getApprovedPlan(baseSnapshot)

  return {
    ...baseSnapshot,
    approvedAssessment: approvedPlan?.assessment ?? null,
    approvedIterations: approvedPlan?.iterations ?? null,
  }
}

async function shouldStopRun(runId: string): Promise<boolean> {
  const run = await prisma.developmentRun.findUnique({
    where: { id: runId },
    select: { status: true },
  })

  if (!run) return true
  if (TERMINAL_RUN_STATUSES.has(run.status)) return true
  return run.status === 'WAITING_CHECKPOINT'
}

async function persistQualityGates(
  runId: string,
  iterationId: string,
  gates: GateRunOutput[]
) {
  for (const gate of gates) {
    const summary = extractPrimaryGateFailureDetail(gate)
    const reason =
      gate.report && typeof gate.report.reason === 'string'
        ? gate.report.reason
        : null
    const skippedByDependency = reason === 'skipped_due_to_previous_failure'

    await prisma.qualityGateRun.upsert({
      where: {
        iterationId_gateType: {
          iterationId,
          gateType: gate.gateType,
        },
      },
      create: {
        iterationId,
        gateType: gate.gateType,
        passed: gate.passed,
        report: gate.report as Prisma.JsonObject | undefined,
        logsRef: gate.logsRef,
        durationMs: gate.durationMs,
        startedAt: new Date(Date.now() - gate.durationMs),
        finishedAt: new Date(),
      },
      update: {
        passed: gate.passed,
        report: gate.report as Prisma.JsonObject | undefined,
        logsRef: gate.logsRef,
        durationMs: gate.durationMs,
        startedAt: new Date(Date.now() - gate.durationMs),
        finishedAt: new Date(),
      },
    })

    await appendRunEvent({
      runId,
      iterationId,
      eventType: 'QUALITY_GATE',
      message: skippedByDependency
        ? `${gate.gateType} gate skipped`
        : `${gate.gateType} gate ${gate.passed ? 'passed' : 'failed'}`,
      payload: {
        gateType: gate.gateType,
        passed: gate.passed,
        durationMs: gate.durationMs,
        logsRef: gate.logsRef,
        ...(skippedByDependency ? { skipped: true } : {}),
        ...(summary ? { summary } : {}),
      },
    })
  }
}

async function ensureIterations(runContext: RunContext) {
  const run = await prisma.developmentRun.findUnique({
    where: { id: runContext.runId },
    include: {
      iterations: true,
    },
  })

  if (!run) {
    throw new Error('RUN_NOT_FOUND')
  }

  if (run.iterations.length > 0) {
    return run.iterations
  }

  const approvedPlan = getApprovedPlan(runContext.snapshot)

  if (approvedPlan) {
    const created = await prisma.$transaction(
      approvedPlan.iterations.map((iteration) =>
        prisma.iterationRun.create({
          data: {
            runId: runContext.runId,
            index: iteration.index,
            name: iteration.name,
            status: 'PENDING',
            scope: iteration.scope as unknown as Prisma.JsonObject,
            gherkinPath: iteration.gherkinPath,
            branchName: toBranchName(runContext.runId, iteration.index, iteration.name),
          },
        })
      )
    )

    await prisma.developmentRun.update({
      where: { id: runContext.runId },
      data: {
        totalIterations: created.length,
        currentIteration: created.length > 0 ? 1 : 0,
      },
    })

    await appendRunEvent({
      runId: runContext.runId,
      eventType: 'INFO',
      message: 'Using approved iteration plan from complexity assessment',
      payload: {
        totalIterations: created.length,
        complexityScore: approvedPlan.assessment.complexityScore,
      },
    })

    return created
  }

  const assessment = await executeAgent({
    runId: runContext.runId,
    agentName: 'AssessmentAgent',
    payload: {
      projectId: runContext.projectId,
      snapshot: runContext.snapshot,
    },
    run: () =>
      runAssessmentAgent({
        runId: runContext.runId,
        projectId: runContext.projectId,
        snapshot: runContext.snapshot,
      }),
  })

  const iterationPlan = await executeAgent({
    runId: runContext.runId,
    agentName: 'IterationPlannerAgent',
    payload: {
      projectId: runContext.projectId,
      assessment: assessment.output,
    },
    run: () =>
      runIterationPlannerAgent(
        {
          runId: runContext.runId,
          projectId: runContext.projectId,
          snapshot: runContext.snapshot,
        },
        assessment.output
      ),
  })

  const created = await prisma.$transaction(
    iterationPlan.output.iterations.map((iteration) =>
      prisma.iterationRun.create({
        data: {
          runId: runContext.runId,
          index: iteration.index,
          name: iteration.name,
          status: 'PENDING',
          scope: iteration.scope as unknown as Prisma.JsonObject,
          gherkinPath: iteration.gherkinPath,
          branchName: toBranchName(runContext.runId, iteration.index, iteration.name),
        },
      })
    )
  )

  await prisma.developmentRun.update({
    where: { id: runContext.runId },
    data: {
      totalIterations: created.length,
      currentIteration: created.length > 0 ? 1 : 0,
    },
  })

  await appendRunEvent({
    runId: runContext.runId,
    eventType: 'INFO',
    message: 'Iteration plan created',
    payload: {
      totalIterations: created.length,
      complexityScore: iterationPlan.output.assessment.complexityScore,
    },
  })

  return created
}

interface ReleaseFailureCheckpointInput {
  runId: string
  iterationId: string
  iterationIndex: number
  step: string
  summary: string
  attempt?: number
}

async function moveRunToReleaseCheckpoint(
  input: ReleaseFailureCheckpointInput
): Promise<void> {
  await prisma.iterationRun.update({
    where: { id: input.iterationId },
    data: {
      status: 'FAILED',
      finishedAt: new Date(),
    },
  })

  await prisma.developmentRun.update({
    where: { id: input.runId },
    data: {
      status: 'WAITING_CHECKPOINT',
      errorSummary: `Iteration ${input.iterationIndex} paused: phase=release step=${input.step} summary=${input.summary}`,
    },
  })

  await appendRunEvent({
    runId: input.runId,
    iterationId: input.iterationId,
    eventType: 'ERROR',
    message: `Release failed at ${input.step}`,
    payload: {
      phase: 'release',
      step: input.step,
      summary: input.summary,
      ...(typeof input.attempt === 'number' ? { attempt: input.attempt } : {}),
    },
  })

  await appendRunEvent({
    runId: input.runId,
    eventType: 'RUN_STATUS',
    message: 'Run waiting checkpoint',
    payload: {
      status: 'WAITING_CHECKPOINT',
      iterationIndex: input.iterationIndex,
      phase: 'release',
      step: input.step,
      ...(typeof input.attempt === 'number' ? { attempt: input.attempt } : {}),
    },
  })
}

export async function __moveRunToReleaseCheckpointForTest(
  input: ReleaseFailureCheckpointInput
) {
  return moveRunToReleaseCheckpoint(input)
}

async function processIteration(runContext: RunContext, iterationId: string): Promise<boolean> {
  const iteration = await prisma.iterationRun.findUnique({
    where: { id: iterationId },
  })

  if (!iteration) {
    throw new Error('ITERATION_NOT_FOUND')
  }

  const branchName =
    iteration.branchName ??
    toBranchName(runContext.runId, iteration.index, iteration.name)

  await prisma.iterationRun.update({
    where: { id: iteration.id },
    data: {
      status: 'RUNNING',
      branchName,
      startedAt: iteration.startedAt ?? new Date(),
    },
  })

  await prisma.developmentRun.update({
    where: { id: runContext.runId },
    data: { currentIteration: iteration.index },
  })

  await appendRunEvent({
    runId: runContext.runId,
    iterationId: iteration.id,
    eventType: 'ITERATION_STATUS',
    message: `Iteration ${iteration.index} running`,
    payload: {
      iterationIndex: iteration.index,
      iterationName: iteration.name,
      status: 'RUNNING',
      branchName,
    },
  })

  const scope = (iteration.scope ?? {}) as {
    goals?: string[]
    featureTags?: string[]
    risks?: string[]
  }

  const iterationPlanItem = {
    index: iteration.index,
    name: iteration.name,
    slug: iteration.name.toLowerCase().replace(/\s+/g, '-'),
    scope: {
      goals: scope.goals ?? [],
      featureTags: scope.featureTags ?? [],
      risks: scope.risks ?? [],
    },
    gherkinPath:
      iteration.gherkinPath ??
      `docs/specifications/generated/iter-${iteration.index}-${iteration.name
        .toLowerCase()
        .replace(/\s+/g, '-')}.feature`,
  }

  const startAttempt = iteration.attemptCount + 1

  if (startAttempt > MAX_ITERATION_ATTEMPTS) {
    const message =
      `Iteration ${iteration.index} exceeded max attempts (${iteration.attemptCount}) and requires retry reset`

    await prisma.iterationRun.update({
      where: { id: iteration.id },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
      },
    })

    await prisma.developmentRun.update({
      where: { id: runContext.runId },
      data: {
        status: 'WAITING_CHECKPOINT',
        errorSummary: message,
      },
    })

    await appendRunEvent({
      runId: runContext.runId,
      iterationId: iteration.id,
      eventType: 'ERROR',
      message: `Iteration ${iteration.index} blocked: exhausted attempts`,
      payload: {
        attemptsUsed: iteration.attemptCount,
        maxAttempts: MAX_ITERATION_ATTEMPTS,
      },
    })

    await appendRunEvent({
      runId: runContext.runId,
      eventType: 'RUN_STATUS',
      message: 'Run waiting checkpoint',
      payload: {
        status: 'WAITING_CHECKPOINT',
        iterationIndex: iteration.index,
      },
    })

    return false
  }

  for (let attempt = startAttempt; attempt <= MAX_ITERATION_ATTEMPTS; attempt += 1) {
    if (await shouldStopRun(runContext.runId)) {
      return false
    }

    await prisma.iterationRun.update({
      where: { id: iteration.id },
      data: {
        attemptCount: attempt,
      },
    })

    const agentContext = {
      runId: runContext.runId,
      projectId: runContext.projectId,
      iterationId: iteration.id,
      iterationIndex: iteration.index,
      attempt,
      snapshot: runContext.snapshot,
    }

    const specResult = await executeAgent({
      runId: runContext.runId,
      iterationId: iteration.id,
      agentName: 'SpecAgent',
      payload: { iteration: iterationPlanItem, attempt },
      run: () => runSpecAgent(agentContext, iterationPlanItem),
    })

    await prisma.iterationRun.update({
      where: { id: iteration.id },
      data: {
        gherkinPath:
          typeof specResult.output.gherkinPath === 'string'
            ? specResult.output.gherkinPath
            : iterationPlanItem.gherkinPath,
      },
    })

    const testResult = await executeAgent({
      runId: runContext.runId,
      iterationId: iteration.id,
      agentName: 'TestAgent',
      payload: { iteration: iterationPlanItem, attempt },
      run: () => runTestAgent(agentContext, iterationPlanItem),
    })

    const codeResult = await executeAgent({
      runId: runContext.runId,
      iterationId: iteration.id,
      agentName: 'CodeAgent',
      payload: { iteration: iterationPlanItem, attempt },
      run: () => runCodeAgent(agentContext, iterationPlanItem, attempt),
    })

    const generatedFiles = mergeWorkspaceFiles([
      __extractGeneratedFilesFromAgentOutput(specResult.output),
      __extractGeneratedFilesFromAgentOutput(testResult.output),
      __extractGeneratedFilesFromAgentOutput(codeResult.output),
    ])

    if (generatedFiles.length > 0) {
      await writeWorkspaceFiles(runContext.sandboxPath, generatedFiles)
      await appendRunEvent({
        runId: runContext.runId,
        iterationId: iteration.id,
        eventType: 'INFO',
        message: 'Iteration artifacts written to workspace',
        payload: {
          attempt,
          files: generatedFiles.length,
        },
      })
    }

    await executeAgent({
      runId: runContext.runId,
      iterationId: iteration.id,
      agentName: 'ReviewAgent',
      payload: { iteration: iterationPlanItem, attempt },
      run: () => runReviewAgent(agentContext, iterationPlanItem),
    })

    const gates = await runQualityGates({
      runId: runContext.runId,
      iterationId: iteration.id,
      iterationIndex: iteration.index,
      projectId: runContext.projectId,
      workspacePath: runContext.sandboxPath,
      featureTags: iterationPlanItem.scope.featureTags,
    })

    await persistQualityGates(runContext.runId, iteration.id, gates)

    const failedGateOutputs = gates.filter((gate) => !gate.passed)
    const failedGates = failedGateOutputs.map((gate) => gate.gateType)
    const failedGateSummary =
      buildFailedGateSummary(failedGateOutputs) || failedGates.join(', ')

    if (failedGates.length === 0) {
      await prisma.iterationRun.update({
        where: { id: iteration.id },
        data: { status: 'GATED' },
      })

      await appendRunEvent({
        runId: runContext.runId,
        iterationId: iteration.id,
        eventType: 'ITERATION_STATUS',
        message: `Iteration ${iteration.index} gated`,
        payload: {
          status: 'GATED',
          iterationIndex: iteration.index,
        },
      })

      const gherkinPath =
        typeof specResult.output.gherkinPath === 'string'
          ? sanitizeWorkspacePath(specResult.output.gherkinPath)
          : iterationPlanItem.gherkinPath
      const gherkinContent =
        typeof specResult.output.gherkin === 'string'
          ? specResult.output.gherkin
          : ''

      let gitReleaseResult: IterationGitReleaseResult

      try {
        await appendRunEvent({
          runId: runContext.runId,
          iterationId: iteration.id,
          eventType: 'AGENT_TASK',
          message: 'Executando release...',
          payload: { phase: 'release', status: 'RUNNING' },
        })

        const artifactsForCommit = await __collectWorkspaceArtifactsForCommit(
          runContext.sandboxPath
        )

        gitReleaseResult = await executeIterationGitRelease({
          projectId: runContext.projectId,
          iterationIndex: iteration.index,
          iterationName: iteration.name,
          branchName,
          gherkinPath,
          gherkinContent,
          artifacts: artifactsForCommit,
          onCheckpoint: async (checkpoint) => {
            await appendRunEvent({
              runId: runContext.runId,
              iterationId: iteration.id,
              eventType: 'INFO',
              message: `Release ${checkpoint.step}: ${checkpoint.summary}`,
              payload: {
                phase: checkpoint.phase,
                step: checkpoint.step,
                summary: checkpoint.summary,
                durationMs: checkpoint.durationMs,
                attempt,
              },
            })
          },
        })

        await appendRunEvent({
          runId: runContext.runId,
          iterationId: iteration.id,
          eventType: 'AGENT_TASK',
          message: 'Release concluído',
          payload: {
            phase: 'release',
            status: 'SUCCEEDED',
            artifactsCommitted: artifactsForCommit.length,
          },
        })
      } catch (error) {
        const releaseError = error as Partial<{
          step: string
          summary: string
        }>

        await moveRunToReleaseCheckpoint({
          runId: runContext.runId,
          iterationId: iteration.id,
          iterationIndex: iteration.index,
          step:
            typeof releaseError.step === 'string' && releaseError.step.length > 0
              ? releaseError.step
              : 'unknown',
          summary:
            typeof releaseError.summary === 'string' && releaseError.summary.length > 0
              ? releaseError.summary
              : (error instanceof Error ? error.message : 'release_failed'),
          attempt,
        })

        return false
      }

      await prisma.iterationRun.update({
        where: { id: iteration.id },
        data: { status: 'MERGED' },
      })

      await appendRunEvent({
        runId: runContext.runId,
        iterationId: iteration.id,
        eventType: 'ITERATION_STATUS',
        message: `Iteration ${iteration.index} merged`,
        payload: {
          status: 'MERGED',
          iterationIndex: iteration.index,
          branchName,
          pullRequestNumber:
            typeof gitReleaseResult.pullRequestNumber === 'number'
              ? gitReleaseResult.pullRequestNumber
              : undefined,
          pullRequestUrl:
            typeof gitReleaseResult.pullRequestUrl === 'string'
              ? gitReleaseResult.pullRequestUrl
              : undefined,
          mergeCommitSha:
            typeof gitReleaseResult.mergeCommitSha === 'string'
              ? gitReleaseResult.mergeCommitSha
              : undefined,
        },
      })

      await prisma.project.update({
        where: { id: runContext.projectId },
        data: { status: 'DEPLOYING' },
      })

      await prisma.iterationRun.update({
        where: { id: iteration.id },
        data: {
          status: 'DEPLOYED',
          finishedAt: new Date(),
        },
      })

      await prisma.project.update({
        where: { id: runContext.projectId },
        data: { status: 'GENERATING' },
      })

      await appendRunEvent({
        runId: runContext.runId,
        iterationId: iteration.id,
        eventType: 'DEPLOY_STATUS',
        message: `Iteration ${iteration.index} deployed`,
        payload: {
          status: 'DEPLOYED',
          iterationIndex: iteration.index,
        },
      })

      return true
    }

    await appendRunEvent({
      runId: runContext.runId,
      iterationId: iteration.id,
      eventType: 'INFO',
      message: `Quality gates failed, preparing retry (attempt ${attempt}/${MAX_ITERATION_ATTEMPTS})`,
      payload: {
        failedGates,
        failedGateSummary,
        attempt,
      },
    })

    if (
      shouldPauseForBabyStepCheckpoint({
        babyStepModeEnabled: isBabyStepModeEnabledFromEnv(process.env),
        attempt,
        maxAttempts: MAX_ITERATION_ATTEMPTS,
      })
    ) {
      await prisma.iterationRun.update({
        where: { id: iteration.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
        },
      })

      await prisma.developmentRun.update({
        where: { id: runContext.runId },
        data: {
          status: 'WAITING_CHECKPOINT',
          errorSummary: `Iteration ${iteration.index} pausada em baby steps após tentativa ${attempt}. Failed gates: ${failedGateSummary}`,
        },
      })

      await appendRunEvent({
        runId: runContext.runId,
        iterationId: iteration.id,
        eventType: 'ERROR',
        message: `Iteration ${iteration.index} paused for baby-step checkpoint`,
        payload: {
          failedGates,
          failedGateSummary,
          attempts: attempt,
          mode: 'baby_steps',
        },
      })

      await appendRunEvent({
        runId: runContext.runId,
        eventType: 'RUN_STATUS',
        message: 'Run waiting checkpoint (baby steps)',
        payload: {
          status: 'WAITING_CHECKPOINT',
          iterationIndex: iteration.index,
          action: 'baby_step_pause',
          attempt,
        },
      })

      return false
    }

    if (attempt === MAX_ITERATION_ATTEMPTS) {
      await prisma.iterationRun.update({
        where: { id: iteration.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
        },
      })

      await prisma.developmentRun.update({
        where: { id: runContext.runId },
        data: {
          status: 'WAITING_CHECKPOINT',
          errorSummary: `Iteration ${iteration.index} failed after ${MAX_ITERATION_ATTEMPTS} attempts. Failed gates: ${failedGateSummary}`,
        },
      })

      await appendRunEvent({
        runId: runContext.runId,
        iterationId: iteration.id,
        eventType: 'ERROR',
        message: `Iteration ${iteration.index} failed after retries`,
        payload: {
          failedGates,
          failedGateSummary,
          attempts: MAX_ITERATION_ATTEMPTS,
        },
      })

      await appendRunEvent({
        runId: runContext.runId,
        eventType: 'RUN_STATUS',
        message: 'Run waiting checkpoint',
        payload: {
          status: 'WAITING_CHECKPOINT',
          iterationIndex: iteration.index,
        },
      })

      return false
    }
  }

  return false
}

async function processRunInternal(runId: string): Promise<void> {
  const run = await prisma.developmentRun.findUnique({
    where: { id: runId },
    select: {
      id: true,
      projectId: true,
      status: true,
      workerSandboxPath: true,
    },
  })

  if (!run) {
    return
  }

  if (TERMINAL_RUN_STATUSES.has(run.status)) {
    return
  }

  if (run.status !== 'RUNNING') {
    await prisma.developmentRun.update({
      where: { id: runId },
      data: {
        status: 'RUNNING',
        startedAt: run.status === 'QUEUED' ? new Date() : undefined,
      },
    })

    await prisma.project.update({
      where: { id: run.projectId },
      data: {
        status: 'GENERATING',
      },
    })

    await appendRunEvent({
      runId,
      eventType: 'RUN_STATUS',
      message: 'Run started',
      payload: { status: 'RUNNING' },
    })
  }

  const snapshot = await getRunSnapshot(runId)
  const sandboxPath = await ensureSandbox(runId, run.workerSandboxPath)

  const context: RunContext = {
    runId,
    projectId: run.projectId,
    snapshot,
    sandboxPath,
  }

  await ensureWorkspaceBootstrap(context)

  const iterations = await ensureIterations(context)

  const sorted = [...iterations].sort((a, b) => a.index - b.index)

  for (const iteration of sorted) {
    if (iteration.status === 'DEPLOYED') {
      continue
    }

    if (await shouldStopRun(runId)) {
      return
    }

    const succeeded = await processIteration(context, iteration.id)
    if (!succeeded) {
      return
    }
  }

  // Deploy to Netlify
  await prisma.project.update({
    where: { id: run.projectId },
    data: { status: 'DEPLOYING' },
  })

  await appendRunEvent({
    runId,
    eventType: 'DEPLOY_STATUS',
    message: 'Iniciando deploy na Netlify',
    payload: { status: 'DEPLOYING' },
  })

  const deployResult = await executeNetlifyDeploy(run.projectId, async (event) => {
    await appendRunEvent({ runId, ...event })
  })

  if (!deployResult.success && !deployResult.skipped) {
    await prisma.developmentRun.update({
      where: { id: runId },
      data: { status: 'FAILED', errorSummary: deployResult.error, finishedAt: new Date() },
    })
    await prisma.project.update({
      where: { id: run.projectId },
      data: { status: 'FAILED' },
    })
    await appendRunEvent({
      runId,
      eventType: 'RUN_STATUS',
      message: 'Run failed — deploy error',
      payload: { status: 'FAILED', error: deployResult.error },
    })
    return
  }

  // Deploy succeeded or was skipped — mark LIVE
  await prisma.developmentRun.update({
    where: { id: runId },
    data: {
      status: 'SUCCEEDED',
      finishedAt: new Date(),
      errorSummary: null,
    },
  })

  await prisma.project.update({
    where: { id: run.projectId },
    data: {
      status: 'LIVE',
      productionUrl: deployResult.productionUrl ?? undefined,
      lastDeployAt: new Date(),
    },
  })

  await appendRunEvent({
    runId,
    eventType: 'RUN_STATUS',
    message: 'Run succeeded',
    payload: { status: 'SUCCEEDED' },
  })
}

export async function processDevelopmentRun(runId: string): Promise<void> {
  if (!markRunActive(runId)) {
    return
  }

  try {
    await processRunInternal(runId)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown orchestrator error'

    await prisma.developmentRun
      .update({
        where: { id: runId },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          errorSummary: message,
        },
      })
      .catch(() => undefined)

    const run = await prisma.developmentRun
      .findUnique({
        where: { id: runId },
        select: { projectId: true },
      })
      .catch(() => null)

    if (run?.projectId) {
      await prisma.project
        .update({
          where: { id: run.projectId },
          data: { status: 'FAILED' },
        })
        .catch(() => undefined)
    }

    await appendRunEvent({
      runId,
      eventType: 'ERROR',
      message: 'Run failed',
      payload: { error: message },
    }).catch(() => undefined)

    await appendRunEvent({
      runId,
      eventType: 'RUN_STATUS',
      message: 'Run failed',
      payload: { status: 'FAILED' },
    }).catch(() => undefined)
  } finally {
    const run = await prisma.developmentRun
      .findUnique({ where: { id: runId }, select: { status: true } })
      .catch(() => null)

    if (run && (TERMINAL_RUN_STATUSES.has(run.status) || run.status === 'WAITING_CHECKPOINT')) {
      await cleanupSandbox(runId).catch(() => undefined)
    }

    unmarkRunActive(runId)
  }
}

export function enqueueDevelopmentRun(runId: string) {
  setTimeout(() => {
    void processDevelopmentRun(runId)
  }, 0)
}
