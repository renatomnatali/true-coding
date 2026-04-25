import ts from 'typescript'
import type { FileManifestEntry } from './types'

interface GeneratedFileLike {
  path: string
  content: string
}

function isTypeFile(path: string): boolean {
  return /^src\/types\/iter-\d+\.ts$/.test(path)
}

function getNodeLine(sourceFile: ts.SourceFile, node: ts.Node): number {
  const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  return pos.line + 1
}

function extractPropertyName(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name)) return name.text
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
  return null
}

function collectInterfaceContracts(typeFiles: GeneratedFileLike[]): Map<string, Set<string>> {
  const contracts = new Map<string, Set<string>>()

  for (const file of typeFiles) {
    const sourceFile = ts.createSourceFile(
      file.path,
      file.content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    )

    const visit = (node: ts.Node) => {
      if (ts.isInterfaceDeclaration(node)) {
        const interfaceName = node.name.text
        const fields = contracts.get(interfaceName) ?? new Set<string>()

        for (const member of node.members) {
          if (!ts.isPropertySignature(member) || !member.name) continue
          const key = extractPropertyName(member.name)
          if (key) fields.add(key)
        }

        contracts.set(interfaceName, fields)
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
  }

  return contracts
}

function isNextResponseJsonCall(node: ts.CallExpression): boolean {
  if (!ts.isPropertyAccessExpression(node.expression)) return false
  return (
    node.expression.expression.getText() === 'NextResponse' &&
    node.expression.name.text === 'json'
  )
}

function typeArgumentsContain(node: ts.CallExpression, typeName: string): boolean {
  if (!node.typeArguments || node.typeArguments.length === 0) return false
  return node.typeArguments.some((arg) => arg.getText().includes(typeName))
}

function getObjectLiteralKeys(objectLiteral: ts.ObjectLiteralExpression): string[] {
  const keys: string[] = []

  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) continue
    const key = extractPropertyName(property.name)
    if (key) keys.push(key)
  }

  return keys
}

function collectApiErrorPayloadViolations(
  sourceFile: ts.SourceFile,
  contracts: Map<string, Set<string>>
): string[] {
  const apiErrorFields = contracts.get('ApiError')
  if (!apiErrorFields || apiErrorFields.size === 0) {
    return []
  }

  const violations: string[] = []

  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && isNextResponseJsonCall(node) && typeArgumentsContain(node, 'ApiError')) {
      const [firstArg] = node.arguments
      if (firstArg && ts.isObjectLiteralExpression(firstArg)) {
        const payloadKeys = getObjectLiteralKeys(firstArg)
        const unknownKeys = payloadKeys.filter((key) => !apiErrorFields.has(key))

        if (unknownKeys.length > 0) {
          const line = getNodeLine(sourceFile, firstArg)
          const expected = Array.from(apiErrorFields).join(', ')
          violations.push(
            `Linha ${line}: payload de NextResponse.json<ApiError> usa chave(s) inválida(s): ${unknownKeys.join(', ')}. Esperado: ${expected}.`
          )
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  let current = expression

  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isNonNullExpression(current)
  ) {
    current = current.expression
  }

  return current
}

function isAwaitRequestJson(expression: ts.Expression | undefined): boolean {
  if (!expression) return false
  const unwrapped = unwrapExpression(expression)
  if (!ts.isAwaitExpression(unwrapped)) return false

  const awaited = unwrapExpression(unwrapped.expression)
  if (!ts.isCallExpression(awaited)) return false
  if (!ts.isPropertyAccessExpression(awaited.expression)) return false
  return awaited.expression.name.text === 'json'
}

function collectTypedRequestBodyViolations(
  sourceFile: ts.SourceFile,
  contracts: Map<string, Set<string>>
): string[] {
  const requestBodies = new Map<string, string>()
  const violations = new Set<string>()

  const collectTypedBodies = (node: ts.Node) => {
    if (!ts.isVariableDeclaration(node)) {
      ts.forEachChild(node, collectTypedBodies)
      return
    }

    if (!ts.isIdentifier(node.name)) return
    if (!node.type || !ts.isTypeReferenceNode(node.type)) return
    if (!ts.isIdentifier(node.type.typeName)) return
    if (!isAwaitRequestJson(node.initializer)) return

    const interfaceName = node.type.typeName.text
    if (!contracts.has(interfaceName)) return

    requestBodies.set(node.name.text, interfaceName)
  }

  const checkPropertyAccess = (node: ts.Node) => {
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
      const variableName = node.expression.text
      const interfaceName = requestBodies.get(variableName)
      if (!interfaceName) {
        ts.forEachChild(node, checkPropertyAccess)
        return
      }

      const interfaceFields = contracts.get(interfaceName)
      if (!interfaceFields) {
        ts.forEachChild(node, checkPropertyAccess)
        return
      }

      const fieldName = node.name.text
      if (!interfaceFields.has(fieldName)) {
        const line = getNodeLine(sourceFile, node)
        const expected = Array.from(interfaceFields).join(', ')
        violations.add(
          `Linha ${line}: acesso "${variableName}.${fieldName}" não existe no contrato "${interfaceName}". Campos permitidos: ${expected}.`
        )
      }
    }

    ts.forEachChild(node, checkPropertyAccess)
  }

  collectTypedBodies(sourceFile)
  checkPropertyAccess(sourceFile)
  return Array.from(violations)
}

/**
 * Validates generated files against previously generated contracts.
 * Current scope: API route consistency with types file contracts.
 */
export function validateGeneratedFileContract(
  entry: Pick<FileManifestEntry, 'path' | 'kind'>,
  content: string,
  generatedFiles: GeneratedFileLike[]
): string[] {
  if (entry.kind !== 'api') return []

  const typeFiles = generatedFiles.filter((file) => isTypeFile(file.path))
  if (typeFiles.length === 0) return []

  const contracts = collectInterfaceContracts(typeFiles)
  if (contracts.size === 0) return []

  const sourceFile = ts.createSourceFile(
    entry.path,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )

  return [
    ...collectApiErrorPayloadViolations(sourceFile, contracts),
    ...collectTypedRequestBodyViolations(sourceFile, contracts),
  ]
}
