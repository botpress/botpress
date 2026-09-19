import { isTruncated, type TruncatePreserve } from './truncate.js'
import { getTokenizer } from './utils.js'

const SUBTITLE_LN = '--------------'
const TRUNCATION_MARKER = '[truncated]'
const LONG_TEXT_LENGTH = 4096
const MAX_PREVIEW_CHARACTERS = 1_000_000
const MAX_PREVIEW_NODES = 10_000

type PreviewOptions = {
  tokens: number
  /** Maximum characters shown from a string, within the overall token budget. */
  maxStringLength?: number
  /** Render a single-line value without headings or analysis. */
  compact?: boolean
  /** Disable per-value overrides for compact inventories and other fixed budgets. */
  honorTruncation?: boolean
}

const DEFAULT_OPTIONS: PreviewOptions = {
  tokens: 100_000,
}

type PreviewState = {
  characters: number
  nodes: number
  maxDepth: number
  maxEntries: number
  maxStringLength: number
  compact: boolean
  tokens: number
  preserve: TruncatePreserve
  honorTruncation: boolean
  truncated: boolean
  ancestors: WeakSet<object>
}

type PreviewBudget = Pick<ReturnType<typeof getTokenizer>, 'count' | 'truncate'>

function getPreviewBudget(): PreviewBudget {
  try {
    return getTokenizer()
  } catch {
    // Memory can be populated before the tokenizer is initialized. UTF-8 bytes
    // conservatively bound tokens without making inspection depend on init().
    const encoder = new TextEncoder()

    return {
      count: (value: string) => encoder.encode(value).length,
      truncate: (value: string, length: number) => {
        let output = ''
        let bytes = 0

        for (const character of value) {
          bytes += encoder.encode(character).length

          if (bytes > length) {
            break
          }

          output += character
        }

        return output
      },
    }
  }
}

function takeCharacters(value: string, length: number, side: 'top' | 'bottom'): string {
  let output = side === 'top' ? value.slice(0, length) : value.slice(Math.max(0, value.length - length))

  if (output.length < value.length) {
    if (side === 'top' && /[\uD800-\uDBFF]$/.test(output)) {
      output = output.slice(0, -1)
    } else if (side === 'bottom' && /^[\uDC00-\uDFFF]/.test(output)) {
      output = output.slice(1)
    }
  }

  return output
}

function takeTokens(value: string, tokens: number, side: 'top' | 'bottom', budget: PreviewBudget): string {
  let minimum = 0
  let maximum = value.length
  let output = ''

  while (minimum <= maximum) {
    const length = Math.floor((minimum + maximum) / 2)
    const candidate = takeCharacters(value, length, side)

    if (budget.count(candidate) <= tokens) {
      output = candidate
      minimum = length + 1
    } else {
      maximum = length - 1
    }
  }

  return output
}

function limitOutput(output: string, tokens: number, truncated: boolean, preserve: TruncatePreserve = 'top'): string {
  if (tokens === 0) {
    return ''
  }

  const budget = getPreviewBudget()

  if (!truncated && budget.count(output) <= tokens) {
    return output
  }

  const markerTokens = budget.count(TRUNCATION_MARKER)

  if (markerTokens > tokens) {
    return budget.truncate(TRUNCATION_MARKER, tokens)
  }

  const marked = preserve === 'bottom' ? `${TRUNCATION_MARKER} ${output}` : `${output} ${TRUNCATION_MARKER}`

  if (budget.count(marked) <= tokens) {
    return marked
  }

  let available = Math.max(0, tokens - markerTokens - 1)

  while (available > 0) {
    let candidate: string

    if (preserve === 'bottom') {
      const suffix = takeTokens(output, available, 'bottom', budget).trimStart()
      candidate = `${TRUNCATION_MARKER} ${suffix}`
    } else if (preserve === 'both') {
      const topTokens = Math.ceil(available / 2)
      const prefix = takeTokens(output, topTokens, 'top', budget).trimEnd()
      const suffix = takeTokens(output, available - topTokens, 'bottom', budget).trimStart()
      candidate = `${prefix} ${TRUNCATION_MARKER} ${suffix}`
    } else {
      let prefix = budget.truncate(output, available)

      if (!output.startsWith(prefix)) {
        prefix = takeTokens(output, available, 'top', budget)
      }

      candidate = `${prefix.trimEnd()} ${TRUNCATION_MARKER}`
    }

    const count = budget.count(candidate)

    if (count <= tokens) {
      return candidate
    }

    available -= Math.max(1, count - tokens)
  }

  return TRUNCATION_MARKER
}

function previewText(value: string, state: PreviewState): string {
  const length = Math.max(0, Math.min(state.characters, state.maxStringLength))

  if (value.length <= length) {
    state.characters -= value.length
    return value
  }

  state.truncated = true

  if (state.preserve === 'both') {
    const topLength = Math.ceil(length / 2)
    const prefix = takeCharacters(value, topLength, 'top')
    const suffix = takeCharacters(value, length - topLength, 'bottom')
    state.characters -= prefix.length + suffix.length
    return `${prefix}...${suffix}`
  }

  const output = takeCharacters(value, length, state.preserve)
  state.characters -= output.length
  return state.preserve === 'top' ? output + '...' : '...' + output
}

function findNestedBudget(value: unknown): number | undefined {
  const visited = new WeakSet<object>()
  let remaining = MAX_PREVIEW_NODES
  let largest: number | undefined

  function visit(current: unknown, depth: number) {
    if (!current || typeof current !== 'object' || visited.has(current) || remaining <= 0 || depth > 20) {
      return
    }

    visited.add(current)
    remaining--

    if (isTruncated(current)) {
      largest = Math.max(largest ?? 0, current.$$truncate.maxTokens)
      visit(current.value, depth + 1)
      return
    }

    for (const key in current) {
      if (remaining <= 0) {
        break
      }

      if (Object.hasOwn(current, key)) {
        remaining--
        visit(readProperty(current, key), depth + 1)
      }
    }
  }

  visit(value, 0)
  return largest
}

function createState(tokens: number, options: PreviewOptions, explicitPolicy: boolean): PreviewState {
  const compact = options.compact ?? false
  const nodeLimit = explicitPolicy ? 100_000 : MAX_PREVIEW_NODES
  let maxEntries = compact ? 20 : 100

  if (explicitPolicy) {
    maxEntries = Math.min(nodeLimit, Math.max(1, tokens * 2))
  }

  return {
    characters: Math.min(MAX_PREVIEW_CHARACTERS, Math.max(256, tokens * 16)),
    nodes: Math.min(nodeLimit, Math.max(20, tokens * 4)),
    maxDepth: compact ? 4 : 10,
    maxEntries,
    maxStringLength: explicitPolicy ? Infinity : (options.maxStringLength ?? LONG_TEXT_LENGTH),
    compact,
    tokens,
    preserve: 'top',
    honorTruncation: options.honorTruncation ?? true,
    truncated: false,
    ancestors: new WeakSet(),
  }
}

function entryOrder(length: number, limit: number, preserve: TruncatePreserve): number[] {
  const count = Math.min(length, limit)
  const indices: number[] = []

  for (let index = 0; index < count; index++) {
    if (preserve === 'bottom') {
      indices.push(length - index - 1)
    } else if (preserve === 'both') {
      const offset = Math.floor(index / 2)
      indices.push(index % 2 === 0 ? offset : length - offset - 1)
    } else {
      indices.push(index)
    }
  }

  return indices
}

function readProperty(value: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key)

  if (!descriptor) {
    return undefined
  }

  return 'value' in descriptor ? descriptor.value : '[Getter]'
}

function errorDetails(error: Error): Record<string, unknown> {
  let prototype: object | null = error
  let name: unknown

  for (let depth = 0; prototype && depth < 10; depth++) {
    name = readProperty(prototype, 'name')

    if (name !== undefined) {
      break
    }

    prototype = Object.getPrototypeOf(prototype)
  }

  return {
    name: name ?? 'Error',
    message: readProperty(error, 'message') ?? '',
    stack: readProperty(error, 'stack'),
  }
}

function renderTextBlock(text: string, depth: number): string {
  // Literal block notation preserves text without adding a fence that could be
  // left open if the final token budget cuts the preview short.
  const indentation = '  '.repeat(Math.max(2, depth + 1))
  const content = text.replace(/(\r\n|\r|\n)/g, '$1' + indentation)

  return `|\n${indentation}${content}`
}

function renderValue(value: unknown, state: PreviewState, depth = 0, pretty = false): string {
  if (state.nodes <= 0 || state.characters <= 0 || depth > state.maxDepth) {
    state.truncated = true
    return '...'
  }

  state.nodes--

  if (isTruncated(value)) {
    if (state.ancestors.has(value)) {
      return '[Circular]'
    }

    state.ancestors.add(value)

    try {
      if (!state.honorTruncation) {
        return renderValue(value.value, state, depth, pretty)
      }

      const tokens = Math.min(state.tokens, value.$$truncate.maxTokens)

      if (tokens === 0) {
        return ''
      }

      const nested = createState(tokens, { tokens, compact: state.compact }, true)
      nested.preserve = value.$$truncate.preserve
      nested.ancestors = state.ancestors
      nested.characters = Math.min(nested.characters, state.characters)
      nested.nodes = Math.min(nested.nodes, state.nodes)
      const characters = nested.characters
      const nodes = nested.nodes
      const output = renderValue(value.value, nested, depth, pretty)
      state.characters -= characters - nested.characters
      state.nodes -= nodes - nested.nodes

      return limitOutput(output, tokens, nested.truncated, nested.preserve)
    } finally {
      state.ancestors.delete(value)
    }
  }

  if (value === null) {
    return 'null'
  }

  if (value === undefined) {
    return 'undefined'
  }

  if (typeof value === 'string') {
    const text = previewText(value, state)

    if (!state.compact && /[\r\n]/.test(text)) {
      return renderTextBlock(text, depth)
    }

    return JSON.stringify(text)
  }

  if (typeof value === 'bigint') {
    return previewText(`${value}n`, state)
  }

  if (typeof value === 'function') {
    const name = JSON.stringify(previewText(value.name || 'anonymous', state))
    return `[Function ${name}]`
  }

  if (typeof value === 'symbol') {
    return JSON.stringify(previewText(String(value), state))
  }

  if (typeof value !== 'object') {
    return previewText(String(value), state)
  }

  if (value instanceof Date) {
    const timestamp = Date.prototype.getTime.call(value)
    return Number.isNaN(timestamp) ? 'Invalid Date' : Date.prototype.toISOString.call(value)
  }

  if (value instanceof RegExp) {
    return previewText(String(value), state)
  }

  if (state.ancestors.has(value)) {
    return '[Circular]'
  }

  state.ancestors.add(value)

  try {
    if (value instanceof Error) {
      return renderValue(errorDetails(value), state, depth + 1, pretty)
    }

    const array = Array.isArray(value)
    const entries: { index: number; preview: string; literal: boolean }[] = []

    const appendEntry = (index: number, item: unknown, label = '') => {
      const preview = renderValue(item, state, depth + 1, pretty)
      entries.push({ index, preview: label + preview, literal: preview.startsWith('|\n') })
    }

    if (array) {
      for (const index of entryOrder(value.length, state.maxEntries, state.preserve)) {
        if (state.nodes <= 0 || state.characters <= 0) {
          break
        }

        appendEntry(index, readProperty(value, String(index)))
      }

      if (entries.length < value.length) {
        state.truncated = true
      }
    } else {
      const keys = Object.keys(value)

      for (const index of entryOrder(keys.length, state.maxEntries, state.preserve)) {
        if (state.nodes <= 0 || state.characters <= 0) {
          break
        }

        const key = keys[index]!
        const clippedKey = previewText(key, state)
        const label = state.compact && /^[A-Za-z_$][\w$]*$/.test(clippedKey) ? clippedKey : JSON.stringify(clippedKey)
        appendEntry(index, readProperty(value, key), `${label}: `)
      }

      if (entries.length < keys.length) {
        state.truncated = true
      }
    }

    entries.sort((left, right) => left.index - right.index)

    const open = array ? '[' : '{'
    const close = array ? ']' : '}'

    if (entries.length === 0) {
      return open + close
    }

    if (!pretty) {
      return `${open} ${entries.map((entry) => entry.preview).join(', ')} ${close}`
    }

    const indentation = '  '.repeat(depth)
    const itemIndentation = indentation + '  '
    const lines = entries.map((entry, index) => {
      const followingEntry = index < entries.length - 1
      const separator = followingEntry && !entry.literal ? ',' : ''
      return itemIndentation + entry.preview + separator
    })

    return `${open}\n${lines.join('\n')}\n${indentation}${close}`
  } finally {
    state.ancestors.delete(value)
  }
}

function previewPrimitive(value: unknown, state: PreviewState): string {
  if (value === null) {
    return '<nil>'
  }

  if (value === undefined) {
    return '<undefined>'
  }

  if (typeof value === 'string') {
    return previewText(value, state)
  }

  const type = extractType(value, false).toLowerCase()
  return `<${type}> ${renderValue(value, state, 0, !state.compact)}`
}

function previewDetailed(value: unknown, state: PreviewState): string {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '// Array Is Empty (0 element)'
    }

    const lines = ['// Array Preview', SUBTITLE_LN]
    const entries: { index: number; preview: string }[] = []

    for (const index of entryOrder(value.length, state.maxEntries, state.preserve)) {
      if (state.nodes <= 0 || state.characters <= 0) {
        break
      }

      const item = readProperty(value, String(index))
      const structured = typeof item === 'string' || isTruncated(item)
      const preview = structured ? renderValue(item, state) : previewPrimitive(item, state)
      entries.push({ index, preview })
    }

    if (entries.length < value.length) {
      state.truncated = true
      lines[0] = `// Array Preview (${value.length} items, truncated)`
    }

    entries.sort((left, right) => left.index - right.index)

    for (const entry of entries) {
      lines.push(`[${entry.index}]`.padEnd(15) + `  ${entry.preview}`)
    }

    return lines.join('\n')
  }

  if (value instanceof Error) {
    const details = errorDetails(value)
    return [
      `Error: ${previewPrimitive(details.name, state)}`,
      SUBTITLE_LN,
      previewPrimitive(details.message, state),
      'Stack Trace:',
      SUBTITLE_LN,
      previewPrimitive(details.stack ?? '<no stack trace>', state),
    ].join('\n')
  }

  if (extractType(value, false) === 'object') {
    const output = renderValue(value, state, 0, true)

    if (output === '{}') {
      return '// Empty Object {}'
    }

    const title = state.truncated ? '// Object Preview (truncated)' : '// Object Preview'
    return `${title}\n${SUBTITLE_LN}\n${output}`
  }

  return previewPrimitive(value, state)
}

export function extractType(value: unknown, generic = true): string {
  if (value === null) {
    return 'null'
  }

  if (Array.isArray(value)) {
    if (!generic) {
      return 'Array'
    }

    if (value.length === 0) {
      return 'Array (empty)'
    }

    const types = new Set<string>()

    for (let index = 0; index < Math.min(value.length, 100); index++) {
      types.add(extractType(value[index], false))

      if (types.size > 3) {
        return 'Array'
      }
    }

    return `Array<${Array.from(types).join(' | ')}>`
  }

  if (value instanceof Date) {
    return 'date'
  }

  if (value instanceof RegExp) {
    return 'regexp'
  }

  if (value instanceof Error) {
    return 'error'
  }

  if (typeof value === 'string' && value.length === 0) {
    return '<empty string>'
  }

  return typeof value
}

export const inspect = (value: unknown, name?: string, options: PreviewOptions = DEFAULT_OPTIONS): string => {
  const resolvedOptions = options ?? DEFAULT_OPTIONS
  const requestedTokens = resolvedOptions.tokens ?? DEFAULT_OPTIONS.tokens
  let tokens = Number.isFinite(requestedTokens) ? Math.max(0, Math.floor(requestedTokens)) : DEFAULT_OPTIONS.tokens
  let state = createState(tokens, resolvedOptions, false)

  try {
    const wrapped = isTruncated(value)
    const displayed = wrapped ? value.value : value
    const rootPolicy = wrapped && state.honorTruncation ? value.$$truncate : undefined
    const nestedBudget = state.honorTruncation ? findNestedBudget(displayed) : undefined

    if (rootPolicy) {
      tokens = rootPolicy.maxTokens
    } else if (nestedBudget !== undefined) {
      tokens = Math.max(tokens, nestedBudget)
    }

    if (tokens === 0) {
      return ''
    }

    state = createState(tokens, resolvedOptions, !!rootPolicy || nestedBudget !== undefined)
    state.preserve = rootPolicy?.preserve ?? 'top'
    let header = ''

    if (name) {
      const label = previewText(name, state)
      header = state.compact ? `${JSON.stringify(label)}: ` : `// const ${label}: ${extractType(displayed, false)}\n`
    }

    const output = state.compact ? renderValue(displayed, state) : previewDetailed(displayed, state)
    return limitOutput(header + output, tokens, state.truncated, state.preserve)
  } catch (error) {
    const message = error instanceof Error ? readProperty(error, 'message') : undefined
    const output = typeof message === 'string' ? previewText(message, state) : 'Unable to inspect value'
    return limitOutput(`Error: ${JSON.stringify(output)}`, tokens, state.truncated, state.preserve)
  }
}
