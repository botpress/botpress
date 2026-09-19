import type { CognitiveMessage, CognitiveRequest } from '@botpress/cognitive'

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

function fastHash(value: string): string {
  let hash = 0

  for (let index = 0; index < value.length; index++) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }

  return (hash >>> 0).toString(16)
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

    return { ...message, content: sections.join('') }
  })
}

/** Ignore runtime-only diagnostic IDs and the non-serializable abort signal, never provider content. */
export function cacheKeyOf(kind: 'text' | 'stream', input: CognitiveRequest): string {
  const { signal: _signal, ...request } = input as CognitiveRequest & { signal?: unknown }
  const messages = normalizeBusinessCallIds(request.messages)

  return fastHash(stringifyWithSortedKeys({ kind, input: { ...request, messages } }))
}
