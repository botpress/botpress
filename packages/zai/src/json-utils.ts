import { jsonrepair } from 'jsonrepair'

/**
 * Check if a file is a JSON file based on its path or name extension.
 */
export function isJsonFile(path: string, name: string): boolean {
  return path.endsWith('.json') || name.endsWith('.json')
}

export type JsonValidResult = { valid: true; data: unknown; repaired: boolean; content: string; error: never }
export type JsonInvalidResult = { valid: false; error: string }
export type JsonParseResult = JsonValidResult | JsonInvalidResult

/**
 * Try to parse a string as JSON.
 */
function tryParseJson(content: string): { valid: true; data: unknown } | { valid: false; error: string } {
  try {
    const data = JSON.parse(content)
    return { valid: true, data }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Attempt to repair invalid JSON using jsonrepair, then validate.
 * Returns the repaired string if successful, or null if repair also fails.
 */
function repairJson(content: string): string | null {
  try {
    const repaired = jsonrepair(content)
    JSON.parse(repaired)
    return repaired
  } catch {
    return null
  }
}

/**
 * Build an LLM-friendly error message with the JSON content,
 * line numbers, and the error location highlighted.
 */
function formatError(content: string, rawError: string): string {
  const lines = content.split(/\r?\n/)

  // Extract character position from V8/Bun error messages ("at position N")
  let errorLine: number | null = null
  let errorCol: number | null = null
  const posMatch = rawError.match(/at position (\d+)/)
  if (posMatch) {
    const position = parseInt(posMatch[1], 10)
    let offset = 0
    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i]!.length + 1
      if (offset + lineLen > position) {
        errorLine = i
        errorCol = position - offset
        break
      }
      offset += lineLen
    }
  }

  let out = `JSON Syntax Error: ${rawError}\n\n`

  const contextRadius = 3
  const startLine = errorLine !== null ? Math.max(0, errorLine - contextRadius) : 0
  const endLine = errorLine !== null ? Math.min(lines.length - 1, errorLine + contextRadius) : lines.length - 1
  const padWidth = String(endLine + 1).length

  for (let i = startLine; i <= endLine; i++) {
    const lineNum = String(i + 1).padStart(padWidth, ' ')
    const marker = i === errorLine ? ' ← ERROR' : ''
    out += `${lineNum}|${lines[i]}${marker}\n`

    if (i === errorLine && errorCol !== null) {
      out += `${' '.repeat(padWidth + 1 + errorCol)}^\n`
    }
  }

  return out
}

/**
 * Validate and optionally repair JSON content.
 *
 * 1. If content is valid JSON, return `{ valid: true, data, repaired: false, content }`.
 * 2. If invalid, attempt repair with jsonrepair.
 * 3. If repair succeeds, return `{ valid: true, data, repaired: true, content }`.
 * 4. If repair fails, return `{ valid: false, error }` where `error` is an
 *    LLM-friendly string with numbered lines and the syntax error highlighted.
 */
export function validateOrRepairJson(content: string): JsonParseResult {
  const parsed = tryParseJson(content)
  if (parsed.valid === false) {
    const repaired = repairJson(content)
    if (repaired !== null) {
      return { valid: true, data: JSON.parse(repaired), repaired: true, content: repaired } as JsonValidResult
    }
    return { valid: false, error: formatError(content, parsed.error) }
  }

  return { valid: true, data: parsed.data, repaired: false, content } as JsonValidResult
}
