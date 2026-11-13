import { isPlainObject } from 'lodash-es'
import { inspect, type PreviewLimits } from '../inspect.js'
import { wrapContent } from '../truncator.js'

/** Largest rendered code result (~37K tokens) sent to the model in one message. */
export const MAX_RESULT_CHARS = 150_000

/** Largest preview of a single tool call input, output or error inside an error message. */
export const MAX_TOOL_CALL_FIELD_CHARS = 2_000

const MIN_TOOL_CALL_FIELD_CHARS = 100
const INSPECT_TOKENS = 100_000

/** Progressively tighter structural limits, tried in order until the rendering fits. */
const SHRINK_LEVELS: PreviewLimits[] = [
  { maxStringLength: 4_000, maxArrayItems: 50, compact: true },
  { maxStringLength: 1_000, maxArrayItems: 20, compact: true },
  { maxStringLength: 200, maxArrayItems: 10, compact: true },
]

const UNBOUNDED_TOOL_CALL_KEYS = new Set(['tool', 'success'])

type Render = (limits: PreviewLimits | undefined) => string

export type CodeResultFormat = {
  /** Keeps the "Full ... Preview" heading above complete object and array previews. */
  fullPreviewHeader: boolean
}

const stringify = (value: unknown): string | undefined =>
  JSON.stringify(value, (_key, item) => (typeof item === 'bigint' ? `${item.toString()}n` : item))

const truncationNotice = (shown: number, total: number) =>
  `[truncated: showing ${shown} of ${total} chars — return a smaller slice or filter to see the rest]`

/**
 * Renders unlimited first, so results within the budget stay byte-identical. Larger results are
 * re-rendered with tighter string/array limits before a final cut, and end with a truncation notice.
 */
export const renderWithinBudget = (render: Render, maxChars: number = MAX_RESULT_CHARS): string => {
  const full = render(undefined)
  if (full.length <= maxChars) {
    return full
  }

  let output = full
  for (const limits of SHRINK_LEVELS) {
    output = render(limits)
    if (output.length <= maxChars) {
      break
    }
  }

  const shown = output.slice(0, maxChars)
  return `${shown}\n${truncationNotice(shown.length, full.length)}`
}

/** Renders a code result (returned value or local variables) with each top-level entry named. */
export const renderCodeResult = (
  value: unknown,
  limits: PreviewLimits | undefined,
  format: CodeResultFormat
): string => {
  // Strings stay whole unless the result budget supplies tighter limits.
  const inspection = { tokens: INSPECT_TOKENS, maxStringLength: Infinity, ...format, ...limits }
  const describe = (item: unknown, name: string, fallback: string) =>
    inspect(item, name, inspection) || `${fallback} is ${wrapContent(JSON.stringify(item, null, 2))}`

  if (isPlainObject(value) && typeof value === 'object' && value !== null) {
    return Object.entries(value)
      .map(([key, item]) => describe(item, key, `Value of ${key}`))
      .join('\n\n')
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => describe(item, `Index ${index}`, `Value at index ${index}`)).join('\n\n')
  }
  if (typeof value === 'string') {
    return value
  }
  return inspect(value, undefined, inspection) ?? JSON.stringify(value, null, 2)
}

/** Inspects a value with the default preview options, bounded to the budget. */
export const inspectWithinBudget = (value: unknown, maxChars: number = MAX_RESULT_CHARS): string =>
  renderWithinBudget(
    (limits) => (limits ? inspect(value, undefined, { tokens: INSPECT_TOKENS, ...limits }) : inspect(value)),
    maxChars
  )

/** Cuts plain text (e.g. an error message) to the budget with a truncation notice. */
export const clipText = (text: string, maxChars: number = MAX_RESULT_CHARS): string =>
  renderWithinBudget(() => text, maxChars)

const clipField = (value: unknown, maxChars: number): unknown => {
  if (typeof value === 'string') {
    return value.length > maxChars ? `${value.slice(0, maxChars)} ... <truncated, ${value.length} chars total>` : value
  }

  const json = stringify(value)
  if (json === undefined || json.length <= maxChars) {
    return value
  }
  return `${json.slice(0, maxChars)} ... <truncated JSON, ${json.length} chars total>`
}

const boundToolCalls = (toolCalls: unknown, maxFieldChars: number): unknown => {
  if (!Array.isArray(toolCalls)) {
    return toolCalls
  }

  return toolCalls.map((call: unknown) => {
    if (!isPlainObject(call) || typeof call !== 'object' || call === null) {
      return call
    }
    return Object.fromEntries(
      Object.entries(call).map(([key, value]) => [
        key,
        UNBOUNDED_TOOL_CALL_KEYS.has(key) ? value : clipField(value, maxFieldChars),
      ])
    )
  })
}

/**
 * Inspects tool calls with each input, output and error preview capped, keeping every call's tool
 * name and success flag. When the section still exceeds the budget, field previews shrink with
 * the number of calls, then long call lists are shortened.
 */
export const inspectToolCallsWithinBudget = (toolCalls: unknown, maxChars: number = MAX_RESULT_CHARS): string => {
  const count = Array.isArray(toolCalls) ? Math.max(toolCalls.length, 1) : 1
  const scaledFieldChars = Math.max(
    MIN_TOOL_CALL_FIELD_CHARS,
    Math.min(MAX_TOOL_CALL_FIELD_CHARS, Math.floor(maxChars / (count * 3)))
  )

  return renderWithinBudget((limits) => {
    if (!limits) {
      return inspect(boundToolCalls(toolCalls, MAX_TOOL_CALL_FIELD_CHARS))
    }
    const fieldChars = Math.min(scaledFieldChars, limits.maxStringLength ?? scaledFieldChars)
    return inspect(boundToolCalls(toolCalls, fieldChars), undefined, {
      tokens: INSPECT_TOKENS,
      maxArrayItems: limits.maxArrayItems,
      compact: limits.compact,
    })
  }, maxChars)
}
