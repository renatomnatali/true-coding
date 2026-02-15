import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'

function isMissingSchemaError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2021: table does not exist
    // P2022: column does not exist
    if (error.code === 'P2021' || error.code === 'P2022') {
      return true
    }
  }

  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return (
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('development_runs')
  )
}

/**
 * Preflight check used before autonomous runs.
 * Ensures Prisma tables for autonomous development are available in the target DB.
 */
export async function assertAutonomousDevelopmentSchemaReady() {
  try {
    await prisma.developmentRun.count()
    await prisma.iterationRun.count()
  } catch (error) {
    if (isMissingSchemaError(error)) {
      throw new Error('SCHEMA_NOT_APPLIED')
    }
    throw error
  }
}

