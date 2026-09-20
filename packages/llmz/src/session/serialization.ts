import { decodeMemoryValue, encodeMemoryValue, type EncodedMemoryValue } from '../memory-codec.js'
import type { SerializedMemory } from '../memory.js'
import { validateGroup, type HistoryGroup, type SessionIterationRecord } from './history.js'
import { assertPersistableData } from './json.js'
import { validateInputMessage, type SessionMessage } from './messages.js'

type SerializedHistoryGroup = Omit<HistoryGroup, 'iteration'> & {
  iteration?: Omit<SessionIterationRecord, 'result'> & {
    result?: EncodedMemoryValue
  }
}

export type PendingInput = {
  id: string
  message: SessionMessage
}

export type SessionState = {
  version: 3
  id: string
  turn: number
  turnId: string
  iteration: number
  groups: SerializedHistoryGroup[]
  memory: SerializedMemory
  pendingInputs: PendingInput[]
  activeTurn: boolean
  latestResultId?: string
}

/** Persisted counters, native identities, and exact values must describe one history. */
export function validateRestoredHistory(state: SessionState): void {
  assertPersistableData(state)
  if (!state || state.version !== 3) {
    throw new Error(`Unsupported LLMz session version: ${state?.version}`)
  }

  if (typeof state.id !== 'string' || !state.id.trim() || typeof state.turnId !== 'string') {
    throw new Error('Session identities must be strings.')
  }

  if (!Array.isArray(state.groups) || !Array.isArray(state.pendingInputs)) {
    throw new Error('Session history and queued inputs must be arrays.')
  }

  if (
    !Number.isSafeInteger(state.turn) ||
    state.turn < 0 ||
    !Number.isSafeInteger(state.iteration) ||
    state.iteration < 0
  ) {
    throw new Error('Session turn and iteration counters must be non-negative safe integers')
  }

  if (typeof state.activeTurn !== 'boolean' || (state.activeTurn && (!state.turn || !state.turnId))) {
    throw new Error('Session processing state must identify an active turn.')
  }

  const groupIds = new Set<string>()
  const callIds = new Set<string>()
  let previousIteration = 0
  let previousTurn = 0

  for (const group of state.groups) {
    if (!group || typeof group.id !== 'string' || !group.id.trim() || groupIds.has(group.id)) {
      throw new Error(`Missing or duplicate history group: ${group?.id}`)
    }

    if (!Number.isSafeInteger(group.turn) || group.turn < 1 || group.turn < previousTurn || group.turn > state.turn) {
      throw new Error('History groups must retain their original chronological turn numbers')
    }

    groupIds.add(group.id)
    previousTurn = group.turn
    validateGroup(restoreGroup(group))

    for (const message of group.messages) {
      assertPersistableData(message)

      for (const call of message.toolCalls ?? []) {
        if (callIds.has(call.id)) {
          throw new Error(`Duplicate retained native call ID: ${call.id}`)
        }

        callIds.add(call.id)
      }
    }

    if (!group.iteration) {
      continue
    }

    const iteration = group.iteration
    if (
      iteration.id !== group.id ||
      !Number.isSafeInteger(iteration.number) ||
      iteration.number <= previousIteration ||
      iteration.number > state.iteration ||
      iteration.turn !== group.turn ||
      typeof iteration.turnId !== 'string' ||
      !iteration.turnId.trim() ||
      !Number.isFinite(iteration.timestamp) ||
      iteration.timestamp < 0 ||
      (iteration.turn === state.turn && iteration.turnId !== state.turnId)
    ) {
      throw new Error('Retained iteration identities do not match the session counters')
    }

    previousIteration = iteration.number
  }

  for (const input of state.pendingInputs) {
    if (!input || typeof input.id !== 'string' || !input.id.trim() || groupIds.has(input.id)) {
      throw new Error(`Missing or duplicate queued input identity: ${input?.id}`)
    }

    groupIds.add(input.id)
    validateInputMessage(input.message)
  }

  if (
    state.latestResultId &&
    !state.groups.some((group) => group.iteration?.id === state.latestResultId && group.iteration?.hasResult)
  ) {
    throw new Error('Missing latest session result')
  }
}

export function serializeGroup(group: HistoryGroup): SerializedHistoryGroup {
  if (!group.iteration) {
    return structuredClone(group) as SerializedHistoryGroup
  }

  const { result, ...iteration } = group.iteration

  return {
    id: group.id,
    turn: group.turn,
    messages: structuredClone(group.messages),
    iteration: {
      ...iteration,
      ...(iteration.hasResult ? { result: encodeMemoryValue(result) } : {}),
    },
  }
}

export function restoreGroup(group: SerializedHistoryGroup): HistoryGroup {
  if (group.iteration === undefined) {
    return structuredClone(group) as HistoryGroup
  }

  if (!group.iteration || typeof group.iteration !== 'object' || Array.isArray(group.iteration)) {
    throw new Error('Invalid persisted iteration record')
  }

  const { result, ...iteration } = group.iteration
  if (typeof iteration.hasResult !== 'boolean' || typeof iteration.outcome !== 'string') {
    throw new Error('Invalid persisted iteration outcome')
  }

  if (
    iteration.outcome === 'pending' ||
    !iteration.outcome.trim() ||
    (iteration.error !== undefined && typeof iteration.error !== 'string') ||
    (iteration.unavailable !== undefined && typeof iteration.unavailable !== 'string') ||
    (iteration.hasResult && iteration.unavailable !== undefined) ||
    (!iteration.hasResult && result !== undefined)
  ) {
    throw new Error('Invalid persisted iteration outcome')
  }

  if (iteration.hasResult && !result) {
    throw new Error(`Missing result payload for iteration ${iteration.id}`)
  }

  return {
    id: group.id,
    turn: group.turn,
    messages: structuredClone(group.messages),
    iteration: iteration.hasResult
      ? {
          ...iteration,
          hasResult: true,
          result: decodeMemoryValue(result!),
          unavailable: undefined,
        }
      : { ...iteration, hasResult: false },
  }
}

export function resultBytes(records: readonly SessionIterationRecord[]): number {
  const encoded = records.map(({ result, ...record }) => ({
    ...record,
    ...(record.hasResult ? { result: encodeMemoryValue(result) } : {}),
  }))

  return new TextEncoder().encode(JSON.stringify(encoded)).byteLength
}
