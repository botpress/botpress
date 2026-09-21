import type { CognitiveMessage, CognitiveRequest } from '@botpress/cognitive'
import { createHash } from 'node:crypto'

const BUSINESS_CALL_HEADER = 'BUSINESS CALL OUTCOMES\n'
const BUSINESS_CALL_LINE =
  /^(- [\w$]+(?:\.[\w$]+)? \()(tcall_[0-7][0-9A-HJKMNP-TV-Z]{25})(\): (?:returned |failed: ))/gm

export function stringifyWithSortedKeys(value: unknown, space?: number): string {
  function sortKeys(input: unknown): unknown {
    if (Array.isArray(input)) {
      return input.map(sortKeys)
    }

    if (input && typeof input === 'object' && input.constructor === Object) {
      const object = input as Record<string, unknown>

      return Object.fromEntries(
        Object.keys(object)
          .sort()
          .map((key) => [key, sortKeys(object[key])])
      )
    }

    return input
  }

  return JSON.stringify(sortKeys(value), null, space)
}

/** Variable inventory order can vary with millisecond assignment timestamps; its contents cannot. */
function normalizeMemoryInventory(content: string): string {
  const opening = '\n\n<runtime-memory>\n'
  const closing = '\n</runtime-memory>'
  const start = content.lastIndexOf(opening)
  if (start < 0) return content
  const end = content.indexOf(closing, start)
  if (end < 0) return content
  const inventory = content.slice(start, end)
  if (!inventory.startsWith(`${opening}## Memory\nAvailable in JavaScript.`)) return content
  const normalized = inventory.replace(/(\n### Variables\n)((?:- `[^`\n]+`: [^\n]*\n?)+)/, (_match, header, rows) => {
    const trailing = rows.endsWith('\n') ? '\n' : ''
    return header + rows.trimEnd().split('\n').sort().join('\n') + trailing
  })
  return content.slice(0, start) + normalized + content.slice(end)
}

/** Normalize diagnostic labels, preserving repeated IDs and every byte of the reported outcomes. */
function normalizeBusinessCallIds(messages: CognitiveMessage[]): CognitiveMessage[] {
  const executionCalls = new Set<string>()
  const diagnosticIds = new Map<string, string>()

  return messages.map((message) => {
    if (message.role === 'assistant') {
      for (const call of message.toolCalls ?? []) {
        if (call.function.name === 'run_javascript') {
          executionCalls.add(call.id)
        }
      }
    }

    if (
      message.type !== 'tool_result' ||
      !message.toolResultCallId ||
      !executionCalls.has(message.toolResultCallId) ||
      typeof message.content !== 'string'
    ) {
      return message
    }

    const sections = message.content.split(/(\n{2,})/).map((section) => {
      if (!section.startsWith(BUSINESS_CALL_HEADER)) {
        return section
      }

      return section.replace(BUSINESS_CALL_LINE, (_line, prefix: string, id: string, suffix: string) => {
        let normalized = diagnosticIds.get(id)

        if (!normalized) {
          normalized = `<diagnostic-call-${diagnosticIds.size + 1}>`
          diagnosticIds.set(id, normalized)
        }

        return `${prefix}${normalized}${suffix}`
      })
    })

    return { ...message, content: normalizeMemoryInventory(sections.join('')) }
  })
}

/** Ignore runtime-only diagnostic IDs and the non-serializable abort signal, never provider content. */
export function cacheKeyOf(kind: 'text' | 'stream', input: CognitiveRequest): string {
  const { signal: _signal, ...request } = input as CognitiveRequest & { signal?: unknown }
  const { skipCache: _skipCache, ...options } = request.options ?? {}
  const messages = normalizeBusinessCallIds(request.messages)

  return createHash('sha256')
    .update(stringifyWithSortedKeys({ kind, input: { ...request, options, messages } }))
    .digest('hex')
}
