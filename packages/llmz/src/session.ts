import type { CognitiveMessage, CognitiveToolCall } from '@botpress/cognitive'
import { ulid } from 'ulid'

import { createInspector, type Inspector } from './inspection.js'
import {
  cloneMemoryValue,
  decodeMemoryValue,
  encodeMemoryValue,
  freezeMemoryValue,
  type EncodedMemoryValue,
  type MemoryValue,
} from './memory-codec.js'
import { renderMemory } from './memory-render.js'
import { Memory, type MemoryAssignment, type MemoryReport } from './memory.js'
import { type Transcript, validateTranscriptMessage, isVoiceMessage } from './transcript.js'

/** A native message plus opaque adapter fields, preserved without interpreting them. */
export type SessionMessage = CognitiveMessage & Record<string, unknown>

export type SessionInput = CognitiveMessage | Transcript.Message

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
  hasResult: boolean
  result?: MemoryValue
  unavailable?: string
}

export type IterationCapture = MemoryAssignment & {
  id: string
  variables?: Record<string, unknown>
  hasResult?: boolean
  result?: unknown
}

type HistoryGroup = {
  id: string
  turn: number
  iteration?: SessionIterationRecord
  messages: SessionMessage[]
}

type SerializedHistoryGroup = Omit<HistoryGroup, 'iteration'> & {
  iteration?: Omit<SessionIterationRecord, 'result'> & { result?: EncodedMemoryValue }
}

type ActiveIteration = {
  group: HistoryGroup & { iteration: SessionIterationRecord }
  captured: boolean
  following: HistoryGroup[]
}

type PendingInput = {
  id: string
  message: SessionMessage
}

type AssistantResponse = {
  output: string
  toolCalls?: CognitiveToolCall[]
  assistantMessage?: CognitiveMessage
  continuation?: unknown
}

export namespace Session {
  export type JSON = {
    version: 3
    id: string
    turn: number
    turnId: string
    iteration: number
    groups: SerializedHistoryGroup[]
    memory: ReturnType<Memory['serialize']>
    pendingInputs: PendingInput[]
    activeTurn: boolean
    latestResultId?: string
  }
}

/**
 * Owns canonical native conversation history and its exact JavaScript memory.
 * Reuse a Session across execute() calls; persist toJSON(), not prompt previews.
 */
export class Session {
  public readonly id: string
  public readonly memory: Memory
  #turn = 0
  #turnId = ''
  #iteration = 0
  #groups: HistoryGroup[] = []
  #activeIteration?: ActiveIteration
  #latestResultId?: string
  #pendingInputs: PendingInput[] = []
  #activeTurn = false
  #locked = false

  public constructor(options: { variables?: Record<string, unknown>; maxBytes?: number } = {}) {
    this.id = `session_${ulid()}`
    this.memory = new Memory({ ...options, additionalBytes: () => this.#resultBytes() })
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
    return clone(this.#allGroups().flatMap((group) => group.messages))
  }

  public get pendingMessages(): SessionMessage[] {
    return clone(this.#pendingInputs.map((input) => input.message))
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
      throw new Error('This session is already executing. Await the active execution before reusing it.')
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
    assertPersistableData(messages)
    const pending = messages.map((message) => ({
      id: `input_${ulid()}`,
      message: normalizeInput(message),
    }))

    this.#pendingInputs.push(...pending)
  }

  /** Claim queued input, or continue the current turn after a failed execution. */
  public beginTurn(): void {
    if (this.pendingCalls.length) {
      throw new Error('Cannot begin a turn while native calls are pending. Await the active execution first.')
    }

    if (this.#activeTurn) {
      return
    }

    this.#turn++
    this.#turnId = `turn_${ulid()}`
    this.#activeTurn = true

    for (const input of this.#pendingInputs) {
      this.#groups.push({ id: input.id, turn: this.#turn, messages: [input.message] })
    }

    this.#pendingInputs = []
  }

  /** Mark the active input batch complete without consuming newly queued input. */
  public completeTurn(): void {
    if (this.#activeIteration) {
      throw new Error('Cannot complete a turn with pending iterations. Await the active execution first.')
    }

    this.#activeTurn = false
  }

  public nextIteration(id = `iteration_${ulid()}`): SessionIteration {
    if (this.#activeIteration) {
      throw new Error('Cannot generate another iteration while an iteration is pending.')
    }

    if (this.#groups.some((group) => group.id === id)) {
      throw new Error(`Duplicate iteration id: ${id}`)
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
      throw new Error('An iteration can contain exactly one assistant response.')
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
      message.continuation = clone(response.continuation)
    }

    if (message.role !== 'assistant') {
      throw new Error('Native generation must produce an assistant message.')
    }

    validateBatch(message)
    const previousIds = new Set(
      this.#groups.flatMap((existing) =>
        existing.messages.flatMap((item) => item.toolCalls?.map((call) => call.id) ?? [])
      )
    )

    if (message.toolCalls?.some((call) => previousIds.has(call.id))) {
      throw new Error('Native call IDs must be unique in retained session history.')
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
        throw new Error('Provider assistant message and normalized tool calls disagree.')
      }
    }

    group.messages.push(message)
  }

  public appendToolResult(iterationId: string, callId: string, content: string): void {
    const group = this.#getIteration(iterationId)

    if (!pendingCallIds(group).includes(callId)) {
      throw new Error(`Native call ${callId} is unknown or already has a result.`)
    }

    group.messages.push({ role: 'user', type: 'tool_result', toolResultCallId: callId, content })
  }

  /** Capture successful writes and the inspection result even when later delivery fails. */
  public commitIteration(input: IterationCapture): MemoryReport {
    const active = this.#getActiveIteration(input.id)

    if (active.captured) {
      throw new Error(`Iteration ${input.id} was already captured`)
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
          throw new Error(captureFailure.reason)
        }

        entry.result = cloneMemoryValue(input.result)
        entry.hasResult = true
        this.memory.assertCapacity()
        delete entry.unavailable
        report.resultAvailable = true
      } catch (error) {
        delete entry.result
        entry.hasResult = false

        if (!report.unavailable.some((item) => item.name === '$return')) {
          report.unavailable.push({
            name: '$return',
            reason: error instanceof Error ? error.message : String(error),
          })
        }
      }

      // An unavailable latest result must never expose an earlier successful result.
      this.#latestResultId = entry.hasResult ? entry.id : undefined
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
      throw new Error(`Cannot settle iteration with unresolved native calls: ${pending.join(', ')}`)
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
      throw new Error('Cannot discard an iteration after generation or execution has started.')
    }

    this.#activeIteration = undefined
  }

  /** Runtime feedback without inventing a tool-call identity or user turn. */
  public appendContext(content: string): void {
    if (this.pendingCalls.length) {
      throw new Error('Runtime context cannot interrupt an unresolved native call batch.')
    }

    this.#appendInput([{ role: 'user', content: `Runtime context (LLMz):\n${content}` }])
  }

  /**
   * Build ephemeral model input. Canonical user text/tool results remain intact;
   * the dynamic inventory is generated once, on the final eligible input only.
   */
  public requestMessages(
    options: { memory?: boolean | string; now?: number; maxMemoryChars?: number; inspector?: Inspector } = {}
  ): SessionMessage[] {
    if (this.pendingCalls.length) {
      throw new Error('Cannot request generation before all native calls have results.')
    }

    const messages = this.messages

    if (options.memory === false) {
      return messages
    }

    const overview =
      typeof options.memory === 'string'
        ? options.memory
        : this.renderMemory({
            inspector: options.inspector,
            now: options.now,
            maxChars: options.maxMemoryChars,
          })
    const footer = `\n\n<runtime-memory>\n${overview}\n</runtime-memory>`
    const last = messages.at(-1)

    if (!last) {
      messages.push({ role: 'user', content: `Begin the task.${footer}` })
    } else if (last.role === 'user' && (!last.type || ['text', 'multipart', 'tool_result'].includes(last.type))) {
      if (Array.isArray(last.content)) {
        last.content.push({ type: 'text', text: footer })
      } else {
        last.content = (last.content ?? '') + footer
      }
    } else {
      // A new worker invocation can follow an assistant-only turn. Preserve its
      // signed/provider fields rather than appending runtime data to that output.
      messages.push({ role: 'user', content: `Runtime context (LLMz):${footer}` })
    }

    return messages
  }

  /** Keep complete iterations, pruning their automatic results in the same operation. */
  public compact(retainedIds: Iterable<string>): void {
    const retained = new Set(retainedIds)

    if (this.#activeIteration && !retained.has(this.#activeIteration.group.id)) {
      throw new Error(`Cannot compact pending iteration ${this.#activeIteration.group.id}.`)
    }

    const retainedTurns = new Set(this.#groups.filter((g) => g.iteration && retained.has(g.id)).map((g) => g.turn))
    retainedTurns.add(this.#turn)
    const groups = this.#groups.filter((group) =>
      group.iteration ? retained.has(group.id) : retainedTurns.has(group.turn)
    )
    this.#groups = groups

    if (this.#latestResultId && !retained.has(this.#latestResultId)) {
      this.#latestResultId = undefined
    }
  }

  public toJSON(): Session.JSON {
    if (this.#locked || this.#activeIteration) {
      throw new Error('Cannot serialize a session during an in-flight execution. Await execution before saving it.')
    }

    return {
      version: 3,
      id: this.id,
      turn: this.#turn,
      turnId: this.#turnId,
      iteration: this.#iteration,
      groups: this.#groups.map(serializeGroup),
      memory: this.memory.serialize(),
      pendingInputs: clone(this.#pendingInputs),
      activeTurn: this.#activeTurn,
      latestResultId: this.#latestResultId,
    }
  }

  public static fromJSON(state: Session.JSON): Session {
    if (state.version !== 3) {
      throw new Error(`Unsupported LLMz session version: ${state.version}`)
    }

    assertPersistableData(state)
    const session = new Session()
    Object.defineProperty(session, 'id', { value: state.id, enumerable: true })
    session.#turn = state.turn
    session.#turnId = state.turnId
    session.#iteration = state.iteration
    session.#groups = state.groups.map(restoreGroup)
    session.#pendingInputs = clone(state.pendingInputs)
    session.#activeTurn = state.activeTurn
    session.#latestResultId = state.latestResultId
    Object.defineProperty(session, 'memory', {
      value: Memory.restore(state.memory, () => session.#resultBytes()),
      enumerable: true,
    })
    validateRestoredHistory(session)

    return session
  }

  #getActiveIteration(id: string): ActiveIteration {
    const active = this.#activeIteration

    if (!active || active.group.id !== id) {
      throw new Error(`Unknown or settled iteration: ${id}`)
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

function asSessionMessage(message: CognitiveMessage): SessionMessage {
  return clone(message) as SessionMessage
}

function normalizeInput(message: SessionInput): SessionMessage {
  assertPersistableData(message)

  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    throw new Error('Session input must be a message object.')
  }

  validateInputToolCalls(message as CognitiveMessage)

  const extended =
    message.role === 'event' || message.role === 'summary' || 'attachments' in message || 'modality' in message

  if (!extended) {
    validateInputMessage(message as CognitiveMessage)

    return asSessionMessage(message as CognitiveMessage)
  }

  const transcript = message as Transcript.Message
  validateTranscriptMessage(transcript)

  if (transcript.role === 'event') {
    if (typeof transcript.name !== 'string' || !transcript.name.length || !('payload' in transcript)) {
      throw new Error('Event messages require a name and payload.')
    }
  } else if (typeof transcript.content !== 'string') {
    throw new Error('Transcript message content must be a string.')
  }

  if ('attachments' in transcript && transcript.attachments !== undefined) {
    if (!Array.isArray(transcript.attachments)) {
      throw new Error('Message attachments must be an array.')
    }

    for (const attachment of transcript.attachments) {
      if (
        !attachment ||
        !['image', 'audio'].includes(attachment.type) ||
        typeof attachment.url !== 'string' ||
        !attachment.url.length ||
        (attachment.id !== undefined && typeof attachment.id !== 'string') ||
        (attachment.alt !== undefined && typeof attachment.alt !== 'string')
      ) {
        throw new Error('Message attachments require an image or audio type and a URL.')
      }
    }
  }

  const normalized = transcriptMessage(transcript)
  validateInputMessage(normalized)

  return normalized
}

function createAssistantMessage(response: AssistantResponse): SessionMessage {
  if (response.assistantMessage) {
    return asSessionMessage(response.assistantMessage)
  }

  const message: SessionMessage = {
    role: 'assistant',
    content: response.output || null,
  }

  if (response.toolCalls?.length) {
    message.type = 'tool_calls'
    message.toolCalls = response.toolCalls.map((call) => ({
      id: call.id,
      type: 'function',
      function: {
        name: call.name,
        arguments: clone(call.input),
      },
    }))
  }

  return message
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function stableJSON(value: unknown): string {
  function sortProperties(item: unknown): unknown {
    if (Array.isArray(item)) {
      return item.map(sortProperties)
    }

    if (item && typeof item === 'object') {
      const entries = Object.entries(item).sort(([left], [right]) => left.localeCompare(right))

      return Object.fromEntries(entries.map(([key, child]) => [key, sortProperties(child)]))
    }

    return item
  }

  return JSON.stringify(sortProperties(value))
}

function pendingCallIds(group: HistoryGroup): string[] {
  const calls = group.messages.flatMap((message) => message.toolCalls?.map((call) => call.id) ?? [])
  const results = new Set(
    group.messages.filter((message) => message.type === 'tool_result').map((message) => message.toolResultCallId)
  )

  return calls.filter((id) => !results.has(id))
}

function validateInputMessage(message: CognitiveMessage): void {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    throw new Error('Session input must be a message object.')
  }

  if (message.role === 'system') {
    throw new Error('Session input cannot contain system messages. Supply execute instructions instead.')
  }

  validateInputToolCalls(message)

  if (!['user', 'assistant'].includes(message.role)) {
    throw new Error(`Invalid session message role: ${message.role}`)
  }

  if (message.type !== undefined && !['text', 'multipart'].includes(message.type)) {
    throw new Error(`Invalid session message type: ${message.type}`)
  }

  if (typeof message.content !== 'string' && message.content !== null && !Array.isArray(message.content)) {
    throw new Error('Native message content must be text, multipart content, or null.')
  }

  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (
        !part ||
        (part.type === 'text'
          ? typeof part.text !== 'string'
          : !['image', 'audio'].includes(part.type) || typeof part.url !== 'string' || !part.url.length)
      ) {
        throw new Error('Native content parts require text or an image/audio URL.')
      }
    }
  }

  assertPersistableData(message)
}

function validateInputToolCalls(message: CognitiveMessage): void {
  if (
    message.toolCalls?.length ||
    message.type === 'tool_calls' ||
    message.type === 'tool_result' ||
    message.toolResultCallId
  ) {
    throw new Error(
      'New session input cannot contain tool calls/results. Restore a serialized Session to continue native history.'
    )
  }
}

/** Native provider payloads must survive the advertised JSON persistence API. */
function assertPersistableData(data: unknown): void {
  const seen = new Set<object>()

  function visit(value: unknown): void {
    if (value === undefined || value === null || typeof value === 'string' || typeof value === 'boolean') {
      return
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return
    }

    if (typeof value !== 'object' || seen.has(value)) {
      throw new Error('Native messages and provider continuation must contain finite, acyclic JSON data')
    }

    const array = Array.isArray(value)
    const prototype = Object.getPrototypeOf(value)
    if (!array && prototype !== Object.prototype && prototype !== null) {
      throw new Error(
        'Native provider continuation must use JSON data; encode custom objects or binary data explicitly'
      )
    }

    if (Object.getOwnPropertySymbols(value).length) {
      throw new Error('Native provider continuation cannot contain symbol properties')
    }

    seen.add(value)

    if (array && (Object.keys(value).length !== value.length || value.some((item) => item === undefined))) {
      throw new Error('Native provider continuation arrays must be dense JSON arrays')
    }

    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
      if (array && key === 'length') {
        continue
      }

      if (!descriptor.enumerable || descriptor.get || descriptor.set) {
        throw new Error('Native provider continuation must contain plain JSON data properties')
      }

      visit(descriptor.value)
    }

    seen.delete(value)
  }

  visit(data)
}

function validateBatch(message: CognitiveMessage): void {
  const ids = new Set<string>()

  for (const call of message.toolCalls ?? []) {
    if (!call.id || ids.has(call.id)) {
      throw new Error(`Missing or duplicate native tool call id: ${call.id}`)
    }

    ids.add(call.id)
  }
}

function validateGroup(group: HistoryGroup): void {
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
    if (result.type !== 'tool_result' || !result.toolResultCallId || !ids.delete(result.toolResultCallId)) {
      throw new Error('Session contains an unmatched or duplicate native tool result.')
    }
  }

  if (ids.size) {
    throw new Error('A settled iteration contains pending native calls.')
  }
}

/** Persisted counters, native identities, and exact values must describe one history. */
function validateRestoredHistory(session: Session): void {
  const state = session.toJSON()
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
    if (!group.id || groupIds.has(group.id)) {
      throw new Error(`Missing or duplicate history group: ${group.id}`)
    }

    if (!Number.isSafeInteger(group.turn) || group.turn < previousTurn || group.turn > state.turn) {
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
      iteration.turn !== group.turn
    ) {
      throw new Error('Retained iteration identities do not match the session counters')
    }

    previousIteration = iteration.number
  }

  for (const input of state.pendingInputs) {
    if (!input.id || groupIds.has(input.id)) {
      throw new Error(`Missing or duplicate queued input identity: ${input.id}`)
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

function transcriptMessage(message: Transcript.Message): SessionMessage {
  let content: string

  if (message.role === 'event') {
    const payload = createInspector()(message.payload, {
      purpose: 'event',
      maxTokens: 5000,
      identity: { name: message.name },
    })
    content = `External event ${JSON.stringify(message.name)}:\n${payload}`
  } else if (message.role === 'summary') {
    content = `Conversation summary:\n${message.content}`
  } else {
    content = message.content
  }

  if (isVoiceMessage(message)) {
    content = `Voice message (transcript):\n${content}`
  }

  const attachments = 'attachments' in message ? (message.attachments ?? []) : []
  const parts: Exclude<CognitiveMessage['content'], string | null> = [{ type: 'text', text: content }]

  for (const attachment of attachments) {
    if (attachment.id || attachment.alt) {
      parts.push({
        type: 'text',
        text: `Attachment ${JSON.stringify(attachment.id ?? '')}${attachment.alt ? `: ${attachment.alt}` : ''}`,
      })
    }

    parts.push({ type: attachment.type, url: attachment.url })
  }

  return {
    role: message.role === 'assistant' ? 'assistant' : 'user',
    ...(attachments.length ? { type: 'multipart' as const, content: parts } : { content }),
  }
}

function cleanError(error: string): string {
  return error.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, 2000)
}

function serializeGroup(group: HistoryGroup): SerializedHistoryGroup {
  if (!group.iteration) {
    return clone(group) as SerializedHistoryGroup
  }

  const { result, ...iteration } = group.iteration

  return {
    id: group.id,
    turn: group.turn,
    messages: clone(group.messages),
    iteration: { ...iteration, ...(iteration.hasResult ? { result: encodeMemoryValue(result) } : {}) },
  }
}

function restoreGroup(group: SerializedHistoryGroup): HistoryGroup {
  if (!group.iteration) {
    return clone(group) as HistoryGroup
  }

  const { result, ...iteration } = group.iteration
  if (typeof iteration.hasResult !== 'boolean' || typeof iteration.outcome !== 'string') {
    throw new Error('Invalid persisted iteration outcome')
  }

  if (iteration.hasResult && !result) {
    throw new Error(`Missing result payload for iteration ${iteration.id}`)
  }

  return {
    id: group.id,
    turn: group.turn,
    messages: clone(group.messages),
    iteration: { ...iteration, ...(iteration.hasResult ? { result: decodeMemoryValue(result!) } : {}) },
  }
}

function resultBytes(records: readonly SessionIterationRecord[]): number {
  const encoded = records.map(({ result, ...record }) => ({
    ...record,
    ...(record.hasResult ? { result: encodeMemoryValue(result) } : {}),
  }))

  return new TextEncoder().encode(JSON.stringify(encoded)).byteLength
}
