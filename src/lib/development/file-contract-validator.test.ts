import { describe, expect, it } from 'vitest'
import { validateGeneratedFileContract } from './file-contract-validator'

describe('validateGeneratedFileContract', () => {
  it('detecta payload inválido em NextResponse.json<ApiError>', () => {
    const typeFile = {
      path: 'src/types/iter-1.ts',
      content: `
        export interface ApiError {
          code: string
          message: string
          details?: Record<string, unknown>
        }
      `,
    }

    const apiRoute = `
      import { NextResponse } from 'next/server'
      import type { ApiError } from '@/types/iter-1'

      export async function GET() {
        return NextResponse.json<ApiError>(
          { error: 'Não autorizado', message: 'Token inválido' },
          { status: 401 }
        )
      }
    `

    const violations = validateGeneratedFileContract(
      { path: 'src/app/api/auth-me/route.ts', kind: 'api' },
      apiRoute,
      [typeFile]
    )

    expect(violations).toHaveLength(1)
    expect(violations[0]).toContain('ApiError')
    expect(violations[0]).toContain('error')
    expect(violations[0]).toContain('code')
  })

  it('detecta acesso a campo ausente em body tipado com interface', () => {
    const typeFile = {
      path: 'src/types/iter-1.ts',
      content: `
        export interface RegisterRequest {
          email: string
          name?: string
        }
      `,
    }

    const apiRoute = `
      import { NextRequest, NextResponse } from 'next/server'
      import type { RegisterRequest } from '@/types/iter-1'

      export async function POST(request: NextRequest) {
        const body: RegisterRequest = await request.json()

        if (!body.clerkId) {
          return NextResponse.json({ ok: false }, { status: 400 })
        }

        return NextResponse.json({ ok: true }, { status: 201 })
      }
    `

    const violations = validateGeneratedFileContract(
      { path: 'src/app/api/auth-register/route.ts', kind: 'api' },
      apiRoute,
      [typeFile]
    )

    expect(violations).toHaveLength(1)
    expect(violations[0]).toContain('RegisterRequest')
    expect(violations[0]).toContain('clerkId')
  })

  it('não acusa erro quando contrato está consistente', () => {
    const typeFile = {
      path: 'src/types/iter-1.ts',
      content: `
        export interface ApiError {
          code: string
          message: string
        }

        export interface RegisterRequest {
          email: string
          name?: string
          clerkId: string
        }
      `,
    }

    const apiRoute = `
      import { NextRequest, NextResponse } from 'next/server'
      import type { ApiError, RegisterRequest } from '@/types/iter-1'

      export async function POST(request: NextRequest) {
        const body: RegisterRequest = await request.json()
        if (!body.clerkId) {
          return NextResponse.json<ApiError>(
            { code: 'UNAUTHORIZED', message: 'Token inválido' },
            { status: 401 }
          )
        }
        return NextResponse.json({ ok: true }, { status: 201 })
      }
    `

    const violations = validateGeneratedFileContract(
      { path: 'src/app/api/auth-register/route.ts', kind: 'api' },
      apiRoute,
      [typeFile]
    )

    expect(violations).toEqual([])
  })
})
