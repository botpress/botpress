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
  } catch (err: unknown) {
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

/** The top-level shape of a JSON value */
export type JsonKind = 'object' | 'array' | 'primitive'

export function jsonKind(value: unknown): JsonKind {
  if (Array.isArray(value)) {
    return 'array'
  }
  return value !== null && typeof value === 'object' ? 'object' : 'primitive'
}

/** The top-level shape the (possibly broken) text was written as, from its first character */
function writtenKind(content: string): JsonKind {
  const first = content.trimStart()[0]
  return first === '{' ? 'object' : first === '[' ? 'array' : 'primitive'
}

/** Content wrapped in a markdown code fence (```json ... ```), unwrapped; null when it isn't fenced */
function unfence(content: string): string | null {
  const match = /^\s*```[\w-]*[^\S\r\n]*\r?\n([\s\S]*?)\r?\n?[^\S\r\n]*```\s*$/.exec(content)
  return match ? match[1]! : null
}

export type ValidateJsonOptions = {
  /**
   * The top-level shape the JSON must keep (e.g. the shape of the file before it was patched). A repair that changes
   * it (e.g. jsonrepair turning `{"a":1}\n{"b":2}` into an array) is rejected. Defaults to the shape the content
   * starts with.
   */
  kind?: JsonKind
}

/**
 * Validate and optionally repair JSON content.
 *
 * 1. If content is valid JSON, return `{ valid: true, data, repaired: false, content }`.
 * 2. If it is wrapped in a markdown code fence, the fence is removed (`repaired: true`).
 * 3. If invalid, attempt repair with jsonrepair. A repair that changes the top-level shape (object, array or
 *    primitive) is rejected: it means the content is not one JSON value, and guessing would corrupt it.
 * 4. If repair succeeds, return `{ valid: true, data, repaired: true, content }`.
 * 5. If repair fails, return `{ valid: false, error }` where `error` is an
 *    LLM-friendly string with numbered lines and the syntax error highlighted.
 */
export function validateOrRepairJson(content: string, options: ValidateJsonOptions = {}): JsonParseResult {
  const parsed = tryParseJson(content)
  if (parsed.valid === false) {
    return repairOrFail(content, parsed.error, options)
  }
  if (options.kind && jsonKind(parsed.data) !== options.kind) {
    return {
      valid: false,
      error: `JSON Error: the top-level value is ${aKind(jsonKind(parsed.data))}, but it must be ${aKind(options.kind)}.`,
    }
  }
  return { valid: true, data: parsed.data, repaired: false, content } as JsonValidResult
}

function repairOrFail(content: string, parseError: string, options: ValidateJsonOptions): JsonParseResult {
  const fenced = unfence(content)
  if (fenced !== null) {
    const inner = validateOrRepairJson(fenced, options)
    return inner.valid ? ({ ...inner, repaired: true } as JsonValidResult) : inner
  }

  const kind = options.kind ?? writtenKind(content)
  const repaired = repairJson(content)
  if (repaired !== null) {
    const data = JSON.parse(repaired)
    if (jsonKind(data) === kind) {
      return { valid: true, data, repaired: true, content: repaired } as JsonValidResult
    }
  }
  return { valid: false, error: formatError(content, parseError) }
}

const aKind = (kind: JsonKind) => (kind === 'primitive' ? 'a primitive' : `an ${kind}`)
