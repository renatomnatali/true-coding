import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { chat } from '@/lib/ai/claude'
import { PLANNING_SYSTEM_PROMPT, UX_PLAN_SYSTEM_PROMPT } from '@/lib/ai/prompts/planning'
import { extractJSON } from '@/lib/ai/parsers'

interface RouteParams {
  params: Promise<{ id: string }>
}

const approveSchema = z.object({
  planType: z.enum(['business', 'technical', 'ux']),
})

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await request.json()
    const { planType } = approveSchema.parse(body)
    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
      include: { user: { select: { clerkId: true } } },
    })

    if (!project) {
      return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
    }

    if (project.user.clerkId !== userId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    if (planType === 'business') {
      return await approveBusiness(id, project.businessPlan)
    }

    if (planType === 'technical') {
      return await approveTechnical(id, project.businessPlan, project.technicalPlan)
    }

    return await approveUx(id)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: error.errors }, { status: 400 })
    }
    console.error('Approve error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// Aprovar Business Plan → gera Technical Plan
async function approveBusiness(projectId: string, businessPlan: unknown) {
  let technicalPlan: unknown
  try {
    const response = await chat({
      phase: 'planning',
      systemPrompt: PLANNING_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Gere o TechnicalPlan para este BusinessPlan:\n\n${JSON.stringify(businessPlan, null, 2)}`,
        },
      ],
    })

    technicalPlan = extractJSON(response)
    if (!technicalPlan) {
      return NextResponse.json({ error: 'GENERATION_ERROR', message: 'Falha ao extrair TechnicalPlan da resposta' }, { status: 500 })
    }
  } catch {
    return NextResponse.json({ error: 'GENERATION_ERROR', message: 'Erro ao gerar Plano Técnico' }, { status: 500 })
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      businessPlanApproved: true,
      technicalPlan: technicalPlan as Parameters<typeof prisma.project.update>[0]['data']['technicalPlan'],
    },
  })

  return NextResponse.json({ technicalPlan })
}

// Aprovar Technical Plan → gera UX Plan
async function approveTechnical(projectId: string, businessPlan: unknown, technicalPlan: unknown) {
  let uxPlan: unknown
  try {
    const response = await chat({
      phase: 'planning',
      systemPrompt: UX_PLAN_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Gere o UXPlan baseado nestes planos:\n\nBusinessPlan:\n${JSON.stringify(businessPlan, null, 2)}\n\nTechnicalPlan:\n${JSON.stringify(technicalPlan, null, 2)}`,
        },
      ],
    })

    uxPlan = extractJSON(response)
    if (!uxPlan) {
      return NextResponse.json({ error: 'GENERATION_ERROR', message: 'Falha ao extrair UXPlan da resposta' }, { status: 500 })
    }
  } catch {
    return NextResponse.json({ error: 'GENERATION_ERROR', message: 'Erro ao gerar Plano de UX' }, { status: 500 })
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      technicalPlanApproved: true,
      uxPlan: uxPlan as Parameters<typeof prisma.project.update>[0]['data']['uxPlan'],
    },
  })

  return NextResponse.json({ uxPlan })
}

// Aprovar UX Plan → avança para CONNECTING
async function approveUx(projectId: string) {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      uxPlanApproved: true,
      status: 'CONNECTING',
    },
  })

  return NextResponse.json({ status: 'CONNECTING' })
}
