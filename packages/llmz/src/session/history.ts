import type { CognitiveMessage } from '@botpress/cognitive'
import type { MemoryValue } from '../memory-codec.js'
import { validateInputMessage, validateMessageContent, type SessionMessage } from './messages.js'

export type SessionIteration = {
  id: string
  number: number
  turn: number
  turnId: string
  timestamp: number
}

export type SessionIterationRecord = SessionIteration & {
  outcome: string
  error?: string
} & (
    | { hasResult: true; result: MemoryValue; unavailable?: never }
    | { hasResult: false; result?: never; unavailable?: string }
  )

export type HistoryGroup = {
  id: string
  turn: number
  iteration?: SessionIterationRecord
  messages: SessionMessage[]
}

export function pendingCallIds(group: HistoryGroup): string[] {
  const calls = group.messages.flatMap((message) => message.toolCalls?.map((call) => call.id) ?? [])
  const results = new Set(
    group.messages.filter((message) => message.type === 'tool_result').map((message) => message.toolResultCallId)
  )

  return calls.filter((id) => !results.has(id))
}

export function validateBatch(message: CognitiveMessage): void {
  validateMessageContent(message)
  if (message.toolCalls !== undefined && !Array.isArray(message.toolCalls)) {
    throw new Error('Native tool calls must be an array.')
  }

  const ids = new Set<string>()

  for (const call of message.toolCalls ?? []) {
    if (!call || typeof call.id !== 'string' || !call.id.trim() || ids.has(call.id)) {
      throw new Error(`Missing or duplicate native tool call id: ${call?.id}`)
    }

    if (
      call.type !== 'function' ||
      !call.function ||
      typeof call.function.name !== 'string' ||
      !call.function.name.trim() ||
      (call.function.arguments !== undefined &&
        (call.function.arguments === null ||
          typeof call.function.arguments !== 'object' ||
          Array.isArray(call.function.arguments)))
    ) {
      throw new Error('Native calls require a function name and an arguments object.')
    }

    ids.add(call.id)
  }
}

export function validateGroup(group: HistoryGroup): void {
  if (!Array.isArray(group.messages)) {
    throw new Error('History messages must be an array.')
  }

  if (!group.iteration) {
    for (const message of group.messages) {
      validateInputMessage(message)
    }

    return
  }

  const [assistant, ...results] = group.messages

  if (!assistant) {
    return
  }

  if (assistant.role !== 'assistant') {
    throw new Error('An iteration must start with its assistant message.')
  }

  validateBatch(assistant)
  const ids = new Set(assistant.toolCalls?.map((call) => call.id) ?? [])

  for (const result of results) {
    if (
      !result ||
      result.role !== 'user' ||
      result.type !== 'tool_result' ||
      typeof result.content !== 'string' ||
      result.toolCalls !== undefined ||
      !result.toolResultCallId ||
      !ids.delete(result.toolResultCallId)
    ) {
      throw new Error('Session contains an unmatched or duplicate native tool result.')
    }
  }

  if (ids.size) {
    throw new Error('A settled iteration contains pending native calls.')
  }
}

/** Select whole iterations and the inputs belonging to their turns. */
export function compactHistory(
  groups: readonly HistoryGroup[],
  retained: ReadonlySet<string>,
  currentTurn: number,
  pendingId?: string
): HistoryGroup[] {
  if (pendingId && !retained.has(pendingId)) {
    throw new Error(`Cannot compact pending iteration ${pendingId}.`)
  }

  const turns = new Set(groups.filter((group) => group.iteration && retained.has(group.id)).map((group) => group.turn))
  turns.add(currentTurn)
  return groups.filter((group) => (group.iteration ? retained.has(group.id) : turns.has(group.turn)))
}
