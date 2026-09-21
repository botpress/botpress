import { ulid } from 'ulid'
import { InvalidMessageError, SessionStateError } from '../errors.js'

import type { Inspector } from '../inspection.js'
import { resolveCompaction, summarizeMessages, type CompactionOptions, type SummarizeOptions } from './compactor.js'
import {
  compactHistory,
  pendingCallIds,
  validateBatch,
  type HistoryGroup,
  type SessionIteration,
  type SessionIterationRecord,
} from './history.js'
import { assertPersistableData, stableJSON } from './json.js'
import { cloneMemoryValue, freezeMemoryValue, type MemoryValue } from './memory-codec.js'
import { renderMemory } from './memory-render.js'
import { Memory, type MemoryAssignment, type MemoryReport } from './memory.js'
import {
  createAssistantMessage,
  normalizeInput,
  withMemoryOverview,
  type AssistantResponse,
  type SessionInput,
  type SessionMessage,
} from './messages.js'
import {
  restoreGroup,
  resultBytes,
  serializeGroup,
  validateRestoredHistory,
  type PendingInput,
  type SessionState,
} from './serialization.js'
import type { Transcript } from './transcript.js'

export type { SessionIteration, SessionIterationRecord } from './history.js'
export type { SessionInput, SessionMessage } from './messages.js'

export type IterationCapture = MemoryAssignment & {
  id: string
  variables?: Record<string, unknown>
  hasResult?: boolean
  result?: unknown
}

type ActiveIteration = {
  group: HistoryGroup & { iteration: SessionIterationRecord }
  captured: boolean
  following: HistoryGroup[]
}

export namespace Session {
  export type JSON = SessionState
}

export type SessionOptions = {
  variables?: Record<string, unknown>
  maxBytes?: number
  /** Automatic LLM summarization is enabled by default. Set false to preserve history and fail on overflow. */
  compaction?: false | CompactionOptions
}

export type SessionCompaction = {
  summary: Transcript.SummaryMessage
  retainedIterationIds: readonly string[]
  /** Commit only after the final request and all request hooks pass their budget checks. */
  commit(): void
}

/**
 * Owns canonical native conversation history and its exact JavaScript memory.
 * Reuse a Session across execute() calls; persist toJSON(), not prompt previews.
 */
export class Session {
  public readonly id: string
  public readonly memory: Memory
  public readonly compaction: false | ReturnType<typeof resolveCompaction>
  #turn = 0
  #turnId = ''
  #iteration = 0
  #groups: HistoryGroup[] = []
  #activeIteration?: ActiveIteration
  #latestResultId?: string
  #pendingInputs: PendingInput[] = []
  #activeTurn = false
  #locked = false

  public constructor(options: SessionOptions = {}) {
    this.id = `session_${ulid()}`
    this.memory = new Memory({ ...options, additionalBytes: () => this.#resultBytes() })
    this.compaction = options.compaction === false ? false : resolveCompaction(options.compaction)
  }

  public get turn(): number {
    return this.#turn
  }

  public get turnId(): string {
    return this.#turnId
  }

  public get iteration(): number {
    return this.#iteration
  }

  public get messages(): SessionMessage[] {
    return structuredClone(this.#allGroups().flatMap((group) => group.messages))
  }

  /** Retained conversation plus queued input, preserving event and summary roles. Returns a detached copy. */
  public get transcript(): SessionInput[] {
    return structuredClone([
      ...this.#allGroups().flatMap((group): SessionInput[] => (group.source ? [group.source] : group.messages)),
      ...this.#pendingInputs.map((input) => input.source ?? input.message),
    ])
  }

  public get pendingMessages(): SessionMessage[] {
    return structuredClone(this.#pendingInputs.map((input) => input.message))
  }

  public get hasActiveTurn(): boolean {
    return this.#activeTurn
  }

  public get status(): 'idle' | 'pending' | 'active' {
    if (this.#activeTurn) {
      return 'active'
    }

    return this.#pendingInputs.length ? 'pending' : 'idle'
  }

  public get retainedIterationIds(): string[] {
    return this.#allGroups().flatMap((group) => (group.iteration ? [group.iteration.id] : []))
  }

  public get pendingCalls(): Array<{ iterationId: string; callId: string }> {
    return this.#activeIteration
      ? pendingCallIds(this.#activeIteration.group).map((callId) => ({
          iterationId: this.#activeIteration!.group.id,
          callId,
        }))
      : []
  }

  /** Exact retained execution results, newest first. Each access returns a frozen copy. */
  public get iterations(): readonly SessionIterationRecord[] {
    return freezeMemoryValue(cloneMemoryValue(this.#records()) as SessionIterationRecord[])
  }

  public getBindings(): Record<string, MemoryValue> {
    const history = this.iterations
    const latest = history.find((entry) => entry.id === this.#latestResultId)
    const bindings = this.memory.variables

    Object.defineProperties(bindings, {
      $return: { value: latest?.result, enumerable: true, writable: false, configurable: false },
      $iterations: { value: history, enumerable: true, writable: false, configurable: false },
    })

    return bindings
  }

  public renderMemory(options: { now?: number; maxChars?: number; inspector?: Inspector } = {}): string {
    return renderMemory({
      ...options,
      turn: this.#turn,
      bindings: this.memory.bindings,
      properties: this.memory.objectProperties,
      iterations: this.iterations,
      latestResultId: this.#latestResultId,
    })
  }

  /** Prevent concurrent execute() calls from changing a shared session. */
  public acquire(): () => void {
    if (this.#locked) {
      throw new SessionStateError('This session is already executing. Await the active execution before reusing it.')
    }

    this.#locked = true
    let released = false

    return () => {
      if (!released) {
        this.#locked = false
      }

      released = true
    }
  }

  /**
   * Queue new input for the next turn. Appending during an execution never
   * changes the batch currently being processed. Identical messages stay distinct.
   */
  public append(input: SessionInput | readonly SessionInput[]): void {
    const messages: readonly SessionInput[] = Array.isArray(input) ? input : [input as SessionInput]
    const pending = messages.map((message) => ({
      id: `input_${ulid()}`,
      message: normalizeInput(message),
      ...(message.role === 'event' || message.role === 'summary' ? { source: structuredClone(message) } : {}),
    }))

    try {
      assertPersistableData(messages)
    } catch (cause) {
      throw new InvalidMessageError(cause instanceof Error ? cause.message : String(cause), { cause })
    }

    this.#pendingInputs.push(...pending)
  }

  /** Claim queued input, or continue the current turn after a failed execution. */
  public beginTurn(): void {
    if (this.pendingCalls.length) {
      throw new SessionStateError(
        'Cannot begin a turn while native calls are pending. Await the active execution first.'
      )
    }

    if (this.#activeTurn) {
      return
    }

    this.#turn++
    this.#turnId = `turn_${ulid()}`
    this.#activeTurn = true

    for (const input of this.#pendingInputs) {
      this.#groups.push({
        id: input.id,
        turn: this.#turn,
        messages: [input.message],
        ...(input.source ? { source: input.source } : {}),
      })
    }

    this.#pendingInputs = []
  }

  /** Mark the active input batch complete without consuming newly queued input. */
  public completeTurn(): void {
    if (this.#activeIteration) {
      throw new SessionStateError('Cannot complete a turn with pending iterations. Await the active execution first.')
    }

    this.#activeTurn = false
  }

  public nextIteration(id = `iteration_${ulid()}`): SessionIteration {
    if (this.#activeIteration) {
      throw new SessionStateError('Cannot generate another iteration while an iteration is pending.')
    }

    if (this.#groups.some((group) => group.id === id)) {
      throw new SessionStateError(`Duplicate iteration id: ${id}`)
    }

    this.beginTurn()

    const iteration = { id, number: ++this.#iteration, turn: this.#turn, turnId: this.#turnId, timestamp: Date.now() }
    this.#activeIteration = {
      group: {
        id,
        turn: this.#turn,
        iteration: { ...iteration, outcome: 'pending', hasResult: false },
        messages: [],
      },
      captured: false,
      following: [],
    }

    return { ...iteration }
  }

  public appendAssistant(iterationId: string, response: AssistantResponse): void {
    const group = this.#getIteration(iterationId)

    if (group.messages.length) {
      throw new SessionStateError('An iteration can contain exactly one assistant response.')
    }

    assertPersistableData({
      output: response.output,
      toolCalls: response.toolCalls,
      assistantMessage: response.assistantMessage,
      continuation: response.continuation,
    })
    const calls = response.toolCalls ?? []
    const message = createAssistantMessage(response)

    if (response.continuation !== undefined) {
      message.continuation = structuredClone(response.continuation)
    }

    if (message.role !== 'assistant') {
      throw new SessionStateError('Native generation must produce an assistant message.')
    }

    validateBatch(message)
    const previousIds = new Set(
      this.#groups.flatMap((existing) =>
        existing.messages.flatMap((item) => item.toolCalls?.map((call) => call.id) ?? [])
      )
    )

    if (message.toolCalls?.some((call) => previousIds.has(call.id))) {
      throw new SessionStateError('Native call IDs must be unique in retained session history.')
    }

    if (response.assistantMessage && response.toolCalls !== undefined) {
      const messageCalls = message.toolCalls ?? []

      if (
        calls.length !== messageCalls.length ||
        calls.some((call, index) => {
          const native = messageCalls[index]!

          return (
            call.id !== native.id ||
            call.name !== native.function.name ||
            stableJSON(call.input) !== stableJSON(native.function.arguments ?? {})
          )
        })
      ) {
        throw new SessionStateError('Provider assistant message and normalized tool calls disagree.')
      }
    }

    group.messages.push(message)
  }

  public appendToolResult(iterationId: string, callId: string, content: string): void {
    const group = this.#getIteration(iterationId)

    if (!pendingCallIds(group).includes(callId)) {
      throw new SessionStateError(`Native call ${callId} is unknown or already has a result.`)
    }

    group.messages.push({ role: 'user', type: 'tool_result', toolResultCallId: callId, content })
  }

  /** Capture successful writes and the inspection result even when later delivery fails. */
  public commitIteration(input: IterationCapture): MemoryReport {
    const active = this.#getActiveIteration(input.id)

    if (active.captured) {
      throw new SessionStateError(`Iteration ${input.id} was already captured`)
    }

    const entry = active.group.iteration
    entry.timestamp = input.timestamp ?? Date.now()
    const metadata = { ...input, ...entry }
    active.captured = true
    if (input.hasResult) {
      entry.unavailable = 'Result unavailable; see the execution report.'
    }

    try {
      this.memory.assertCapacity()
    } catch (error) {
      active.captured = false
      throw error
    }

    const report = this.memory.assign(input.variables ?? {}, metadata)

    if (input.hasResult) {
      try {
        const captureFailure = input.captureErrors?.find((item) => item.name === '$return')
        if (captureFailure) {
          throw new SessionStateError(captureFailure.reason)
        }

        active.group.iteration = {
          ...entry,
          hasResult: true,
          result: cloneMemoryValue(input.result),
          unavailable: undefined,
        }
        this.memory.assertCapacity()
        report.resultAvailable = true
      } catch (error) {
        active.group.iteration = { ...entry, hasResult: false, result: undefined }

        if (!report.unavailable.some((item) => item.name === '$return')) {
          report.unavailable.push({
            name: '$return',
            reason: error instanceof Error ? error.message : String(error),
          })
        }
      }

      // An unavailable latest result must never expose an earlier successful result.
      this.#latestResultId = active.group.iteration.hasResult ? entry.id : undefined
    }

    return report
  }

  /** Set the outcome once, after generation, code and delivery have all finished. */
  public settleIteration(
    iterationId: string,
    outcome: { outcome: string; error?: string } = { outcome: 'completed' }
  ): void {
    const active = this.#getActiveIteration(iterationId)
    const group = active.group
    const pending = pendingCallIds(group)

    if (pending.length) {
      throw new SessionStateError(`Cannot settle iteration with unresolved native calls: ${pending.join(', ')}`)
    }

    const previous = group.iteration
    const wasCaptured = active.captured
    group.iteration = {
      ...previous,
      outcome: outcome.outcome,
      ...(outcome.error ? { error: cleanError(outcome.error) } : {}),
    }
    active.captured = true

    try {
      this.memory.assertCapacity()
    } catch (error) {
      group.iteration = previous
      active.captured = wasCaptured
      throw error
    }

    this.#groups.push(group, ...active.following)
    this.#activeIteration = undefined
  }

  /** Reserve failure metadata before model generation or side effects begin. */
  public assertCapacityForIteration(info: SessionIteration): void {
    const active = this.#getActiveIteration(info.id)
    const reservation: SessionIterationRecord = {
      ...info,
      outcome: 'thinking_requested',
      error: 'x'.repeat(2000),
      hasResult: false,
      unavailable: 'Result unavailable; see the execution report.',
    }
    const bytes = resultBytes([reservation])
    this.memory.assertCapacity(bytes - (active.captured ? resultBytes([active.group.iteration]) : 0))
  }

  /** Discard a preflight failure that generated no response and ran no code. */
  public cancelIteration(iterationId: string): void {
    const active = this.#getActiveIteration(iterationId)

    if (active.captured || active.group.messages.length) {
      throw new SessionStateError('Cannot discard an iteration after generation or execution has started.')
    }

    this.#activeIteration = undefined
  }

  /** Runtime feedback without inventing a tool-call identity or user turn. */
  public appendContext(content: string): void {
    if (this.pendingCalls.length) {
      throw new SessionStateError('Runtime context cannot interrupt an unresolved native call batch.')
    }

    this.#appendInput([{ role: 'user', content: `Runtime context (LLMz):\n${content}` }])
  }

  /**
   * Build ephemeral model input. Canonical user text/tool results remain intact;
   * the dynamic inventory is generated once, on the final eligible input only.
   */
  public requestMessages(
    options: {
      memory?: boolean | string
      now?: number
      maxMemoryChars?: number
      inspector?: Inspector
      /** Preview compaction without discarding retained history or results. */
      retainedIterationIds?: Iterable<string>
      /** Preview a prepared summary without changing the transcript. */
      summary?: Transcript.SummaryMessage
    } = {}
  ): SessionMessage[] {
    if (this.pendingCalls.length) {
      throw new SessionStateError('Cannot request generation before all native calls have results.')
    }

    const retained = options.retainedIterationIds === undefined ? undefined : new Set(options.retainedIterationIds)
    const groups = retained
      ? compactHistory(this.#allGroups(), retained, this.#activeTurn ? this.#turn : -1, this.#activeIteration?.group.id)
      : this.#allGroups()
    const messages = groups
      .filter((group) => !options.summary || group.source?.role !== 'summary')
      .flatMap((group) => group.messages)
    if (options.summary) {
      messages.unshift(normalizeInput(options.summary))
    }

    if (options.memory === false) {
      return withMemoryOverview(messages)
    }

    const overview =
      typeof options.memory === 'string'
        ? options.memory
        : renderMemory({
            inspector: options.inspector,
            now: options.now,
            maxChars: options.maxMemoryChars,
            turn: this.#turn,
            bindings: this.memory.bindings,
            properties: this.memory.objectProperties,
            iterations: this.iterations.filter((record) => !retained || retained.has(record.id)),
            latestResultId: this.#latestResultId,
          })
    return withMemoryOverview(messages, overview)
  }

  /** Keep complete iterations, pruning their automatic results in the same operation. */
  public prune(retainedIds: Iterable<string>): void {
    const retained = new Set(retainedIds)

    this.#groups = compactHistory(
      this.#groups,
      retained,
      this.#activeTurn ? this.#turn : -1,
      this.#activeIteration?.group.id
    )

    if (this.#latestResultId && !retained.has(this.#latestResultId)) {
      this.#latestResultId = undefined
    }
  }

  /** Summarize processed conversation without changing it. Queued inputs remain for the next turn. */
  public async summarize(options: SummarizeOptions): Promise<Transcript.SummaryMessage | undefined> {
    const release = this.acquire()
    try {
      if (this.#activeIteration) {
        throw new SessionStateError('Cannot summarize a session with a pending iteration.')
      }

      const messages = this.messages
      if (!messages.length) {
        return undefined
      }

      const config = this.compaction || resolveCompaction()
      return await summarizeMessages(
        messages,
        {
          ...options,
          model: options.model ?? config.model,
          maxTokens: options.maxTokens ?? config.maxSummaryTokens,
        },
        config.summarize
      )
    } finally {
      release()
    }
  }

  /** Replace older complete history with a summary, preserving named memory and queued input. */
  public async compact(
    options: SummarizeOptions & { keepRecentIterations?: number }
  ): Promise<Transcript.SummaryMessage | undefined> {
    const release = this.acquire()
    try {
      if (this.#activeIteration) {
        throw new SessionStateError('Cannot compact a session with a pending iteration.')
      }

      const config = resolveCompaction({
        ...(this.compaction || {}),
        keepRecentIterations: options.keepRecentIterations ?? (this.compaction || {}).keepRecentIterations,
      })
      const ids = this.retainedIterationIds
      const retained = config.keepRecentIterations === 0 ? [] : ids.slice(-config.keepRecentIterations)
      const prepared = await this.prepareCompaction(retained, options)
      options.signal?.throwIfAborted()
      prepared?.commit()
      return prepared?.summary
    } finally {
      release()
    }
  }

  /** @internal Prepare a transactional summary; callers must validate its final request before committing. */
  public async prepareCompaction(
    retainedIds: Iterable<string>,
    options: SummarizeOptions
  ): Promise<SessionCompaction | undefined> {
    const retained = new Set(retainedIds)
    const before = this.#allGroups()
    const selected = compactHistory(
      before,
      retained,
      this.#activeTurn ? this.#turn : -1,
      this.#activeIteration?.group.id
    )
    const kept = new Set(selected.map((group) => group.id))
    const removed = before.filter((group) => !kept.has(group.id))
    const previousSummaries = before.filter((group) => group.source?.role === 'summary')
    if (!removed.length && !previousSummaries.length) {
      return undefined
    }

    const firstKeptIteration = selected.find((group) => group.iteration)?.iteration
    if (
      firstKeptIteration &&
      removed.some((group) => group.iteration && group.iteration.number > firstKeptIteration.number)
    ) {
      throw new SessionStateError(
        'Compaction must remove a prefix of complete iterations, preserving their chronological order.'
      )
    }

    const source = before.filter((group) => !kept.has(group.id) || group.source?.role === 'summary')
    const fingerprint = this.#historyFingerprint()
    const config = this.compaction || resolveCompaction()
    const summary = Object.freeze(
      await summarizeMessages(
        source.flatMap((group) => {
          if (group.messages.length || !group.iteration) {
            return group.messages
          }

          return [
            normalizeInput({
              role: 'event',
              name: 'iteration.completed',
              payload: { id: group.id, outcome: group.iteration.outcome, error: group.iteration.error },
            }),
          ]
        }),
        {
          ...options,
          model: options.model ?? config.model,
          maxTokens: options.maxTokens ?? config.maxSummaryTokens,
        },
        config.summarize
      )
    )
    const summaryGroup: HistoryGroup = {
      id: `summary_${ulid()}`,
      turn: Math.min(...removed.map((group) => group.turn), ...previousSummaries.map((group) => group.turn)),
      source: structuredClone(summary),
      messages: [normalizeInput(summary)],
    }
    let committed = false
    return {
      summary,
      retainedIterationIds: Object.freeze([...retained]),
      commit: () => {
        options.signal?.throwIfAborted()
        if (committed || fingerprint !== this.#historyFingerprint()) {
          throw new SessionStateError('Session history changed while compaction was being prepared.')
        }

        this.prune(retained)
        this.#groups = [summaryGroup, ...this.#groups.filter((group) => group.source?.role !== 'summary')]
        committed = true
      },
    }
  }

  #historyFingerprint(): string {
    return stableJSON({
      groups: this.#allGroups().map(serializeGroup),
      turn: this.#turn,
      activeTurn: this.#activeTurn,
      latestResultId: this.#latestResultId,
    })
  }

  public toJSON(): Session.JSON {
    if (this.#locked || this.#activeIteration) {
      throw new SessionStateError(
        'Cannot serialize a session during an in-flight execution. Await execution before saving it.'
      )
    }

    const compaction = this.compaction === false ? false : { ...this.compaction, summarize: undefined }
    return {
      version: 3,
      id: this.id,
      turn: this.#turn,
      turnId: this.#turnId,
      iteration: this.#iteration,
      groups: this.#groups.map(serializeGroup),
      memory: this.memory.serialize(),
      pendingInputs: structuredClone(this.#pendingInputs),
      activeTurn: this.#activeTurn,
      latestResultId: this.#latestResultId,
      compaction,
    }
  }

  public static fromJSON(state: Session.JSON, options: Pick<SessionOptions, 'compaction'> = {}): Session {
    validateRestoredHistory(state)
    const session = new Session({ compaction: options.compaction ?? state.compaction })
    Object.defineProperty(session, 'id', { value: state.id, enumerable: true })
    session.#turn = state.turn
    session.#turnId = state.turnId
    session.#iteration = state.iteration
    session.#groups = state.groups.map(restoreGroup)
    session.#pendingInputs = structuredClone(state.pendingInputs)
    session.#activeTurn = state.activeTurn
    session.#latestResultId = state.latestResultId
    Object.defineProperty(session, 'memory', {
      value: Memory.restore(state.memory, () => session.#resultBytes()),
      enumerable: true,
    })
    return session
  }

  #getActiveIteration(id: string): ActiveIteration {
    const active = this.#activeIteration

    if (!active || active.group.id !== id) {
      throw new SessionStateError(`Unknown or settled iteration: ${id}`)
    }

    return active
  }

  #getIteration(id: string): HistoryGroup {
    return this.#getActiveIteration(id).group
  }

  #allGroups(): HistoryGroup[] {
    return this.#activeIteration
      ? [...this.#groups, this.#activeIteration.group, ...this.#activeIteration.following]
      : this.#groups
  }

  #records(): SessionIterationRecord[] {
    const records = this.#groups.flatMap((group) => (group.iteration ? [group.iteration] : []))

    if (this.#activeIteration?.captured) {
      records.push(this.#activeIteration.group.iteration)
    }

    return records.reverse()
  }

  #resultBytes(): number {
    return resultBytes(this.#records())
  }

  #appendInput(messages: SessionMessage[]): void {
    const target = this.#activeIteration?.following ?? this.#groups
    target.push({ id: `input_${ulid()}`, turn: this.#turn, messages })
  }
}

function cleanError(error: string): string {
  return error.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, 2000)
}
