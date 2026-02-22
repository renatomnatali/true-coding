/**
 * Extracts exported interfaces, types, and function signatures from
 * generated TypeScript files via regex. Produces a compact summary
 * to use as context in subsequent LLM calls (avoiding sending full file content).
 */

export interface InterfaceMapEntry {
  path: string
  exports: string[]
}

export type InterfaceMap = InterfaceMapEntry[]

const EXPORT_PATTERNS = [
  // export interface Foo { ... } → "interface Foo"
  /export\s+interface\s+(\w+)/g,
  // export type Foo = ... → "type Foo"
  /export\s+type\s+(\w+)/g,
  // export function foo(... → "function foo(...)"
  /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g,
  // export const foo = ... → "const foo"
  /export\s+const\s+(\w+)/g,
  // export default function foo → "default function foo"
  /export\s+default\s+function\s+(\w+)/g,
]

/**
 * Extracts a compact list of exported symbols from a single TypeScript source.
 */
export function extractExports(source: string): string[] {
  const exports: string[] = []
  const seen = new Set<string>()

  for (const pattern of EXPORT_PATTERNS) {
    // Reset lastIndex for each fresh scan
    const re = new RegExp(pattern.source, pattern.flags)
    let match: RegExpExecArray | null

    while ((match = re.exec(source)) !== null) {
      const name = match[1]
      if (!name || seen.has(name)) continue
      seen.add(name)

      // Determine the kind from the pattern
      if (pattern.source.includes('interface')) {
        exports.push(`interface ${name}`)
      } else if (pattern.source.includes('type')) {
        exports.push(`type ${name}`)
      } else if (pattern.source.includes('function')) {
        const params = match[2] ?? ''
        const compact = params.replace(/\s+/g, ' ').trim()
        exports.push(`function ${name}(${compact})`)
      } else if (pattern.source.includes('default')) {
        exports.push(`default function ${name}`)
      } else {
        exports.push(`const ${name}`)
      }
    }
  }

  return exports
}

/**
 * Builds an InterfaceMap from a list of generated files.
 * Only includes files that have at least one exported symbol.
 */
export function buildInterfaceMap(
  files: Array<{ path: string; content: string }>
): InterfaceMap {
  const entries: InterfaceMap = []

  for (const file of files) {
    if (!file.path.endsWith('.ts') && !file.path.endsWith('.tsx')) {
      continue
    }

    const exports = extractExports(file.content)
    if (exports.length > 0) {
      entries.push({ path: file.path, exports })
    }
  }

  return entries
}

/**
 * Serializes an InterfaceMap into a compact string for inclusion
 * in LLM prompts. Format:
 *
 * ```
 * // src/types/user.ts
 * interface User
 * type UserRole
 * function createUser(name: string, role: UserRole)
 * ```
 */
export function serializeInterfaceMap(map: InterfaceMap): string {
  if (map.length === 0) return ''

  return map
    .map((entry) => {
      const header = `// ${entry.path}`
      const symbols = entry.exports.join('\n')
      return `${header}\n${symbols}`
    })
    .join('\n\n')
}
