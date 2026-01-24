import ts from 'typescript'

export interface ValidationError {
  file: string
  line?: number
  column?: number
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export async function validateGeneratedFiles(
  files: Array<{ path: string; content: string }>
): Promise<ValidationResult> {
  const errors: ValidationError[] = []

  for (const file of files) {
    // Only validate TypeScript/TSX files
    if (!file.path.match(/\.(ts|tsx)$/)) continue

    // Skip test files for now (they might have different expectations)
    if (file.path.includes('.test.')) continue

    const syntaxErrors = validateTypeSyntax(file.path, file.content)
    errors.push(...syntaxErrors)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

function validateTypeSyntax(
  filePath: string,
  content: string
): ValidationError[] {
  const errors: ValidationError[] = []

  try {
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    )

    // Check for syntax errors by walking the AST
    const syntaxErrors = collectSyntaxErrors(sourceFile)
    errors.push(
      ...syntaxErrors.map((e) => ({
        file: filePath,
        line: e.line,
        column: e.column,
        message: e.message,
      }))
    )

    // Check for obvious issues
    const codeIssues = checkCodeIssues(content, filePath)
    errors.push(...codeIssues)
  } catch (error) {
    errors.push({
      file: filePath,
      message: `Failed to parse: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }

  return errors
}

interface SyntaxError {
  line: number
  column: number
  message: string
}

function collectSyntaxErrors(sourceFile: ts.SourceFile): SyntaxError[] {
  const errors: SyntaxError[] = []

  function visit(node: ts.Node) {
    // Check for syntax error nodes
    if (node.kind === ts.SyntaxKind.Unknown) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart()
      )
      errors.push({
        line: line + 1,
        column: character + 1,
        message: 'Unknown syntax at this position',
      })
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return errors
}

function checkCodeIssues(
  content: string,
  filePath: string
): ValidationError[] {
  const errors: ValidationError[] = []

  // Check overall brace balance
  const totalOpenBraces = (content.match(/{/g) || []).length
  const totalCloseBraces = (content.match(/}/g) || []).length

  if (totalOpenBraces !== totalCloseBraces) {
    errors.push({
      file: filePath,
      message: `Unbalanced braces: ${totalOpenBraces} opening, ${totalCloseBraces} closing`,
    })
  }

  return errors
}

export function validateJSON(content: string): ValidationResult {
  try {
    JSON.parse(content)
    return { valid: true, errors: [] }
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          file: 'json',
          message: error instanceof Error ? error.message : 'Invalid JSON',
        },
      ],
    }
  }
}
