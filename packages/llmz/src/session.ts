import type { CognitiveMessage, CognitiveToolCall } from '@botpress/cognitive'
import { ulid } from 'ulid'

import { Memory } from './memory.js'
import { type Transcript, TranscriptArray, isVoiceMessage } from './transcript.js'

/** A native message plus opaque adapter fields, preserved without interpreting them. */
export type SessionMessage = CognitiveMessage & Record<string, unknown>

export type SessionIteration = {
  id: string
  number: number
  turn: number
  turnId: string
  timestamp: number
}

type HistoryGroup = {
  id: string
  turn: number
  iteration?: SessionIteration
  settled: boolean
  messages: SessionMessage[]
}

type AssistantResponse = {
  output: string
  toolCalls?: CognitiveToolCall[]
  assistantMessage?: CognitiveMessage
  continuation?: unknown
}

export namespace Session {
  export type JSON = {
    version: 1
    id: string
    turn: number
    turnId: string
    iteration: number
    groups: HistoryGroup[]
    memory: ReturnType<Memory['serialize']>
    transcript: Transcript.Message[]
    unacknowledgedAssistantText: string[]
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
  #transcript: Transcript.Message[] = []
  #unacknowledgedAssistantText: string[] = []
  #locked = false

  public constructor(options: { variables?: Record<string, unknown>; maxBytes?: number } = {}) {
    this.id = `session_${ulid()}`
    this.memory = new Memory(options)
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
    return clone(this.#groups.flatMap((group) => group.messages))
  }

  public get retainedIterationIds(): string[] {
    return this.#groups.flatMap((group) => (group.iteration ? [group.iteration.id] : []))
  }

  public get pendingCalls(): Array<{ iterationId: string; callId: string }> {
    return this.#groups.flatMap((group) => pendingCallIds(group).map((callId) => ({ iterationId: group.id, callId })))
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

  /** Accept one logical user/event/worker turn. Tool roundtrips do not call this. */
  public beginTurn(options: { messages?: CognitiveMessage[]; transcript?: Transcript.Message[] } = {}): void {
    if (this.pendingCalls.length) {
      throw new Error('Cannot accept a new turn while native calls are pending. Resolve or reject the snapshot first.')
    }

    const input = options.messages ?? []

    for (const message of input) {
      validateInputMessage(message)
    }

    const messages = input.map(asSessionMessage)
    const previous = { turn: this.#turn, turnId: this.#turnId }
    this.#turn++
    this.#turnId = `turn_${ulid()}`

    try {
      if (options.transcript) {
        this.reconcileTranscript(options.transcript)
      }

      if (messages.length) {
        this.#appendInput(messages)
      }
    } catch (error) {
      this.#turn = previous.turn
      this.#turnId = previous.turnId
      throw error
    }
  }

  /**
   * Ingest a host's full chat projection. A delivered assistant answer already in
   * canonical history is acknowledged, not inserted again. Repeated snapshots
   * and a host that drops an old prefix are both supported.
   */
  public reconcileTranscript(transcript: Transcript.Message[]): void {
    const validated = [...new TranscriptArray(transcript)]
    const overlap = overlappingPrefix(this.#transcript, validated)
    const additions = validated.slice(overlap)
    const assistantText = [...this.#unacknowledgedAssistantText]
    const messages: SessionMessage[] = []

    for (const message of additions) {
      if (message.role === 'assistant') {
        const matched = assistantText.indexOf(message.content)

        if (matched >= 0) {
          assistantText.splice(matched, 1)
          continue
        }
      }

      messages.push(transcriptMessage(message))
    }

    if (messages.length && this.pendingCalls.length) {
      throw new Error('Cannot insert transcript input between a native call and its pending result.')
    }

    if (messages.length) {
      this.#appendInput(messages)
    }

    this.#transcript = clone(validated)
    this.#unacknowledgedAssistantText = assistantText
  }

  public nextIteration(id = `iteration_${ulid()}`): SessionIteration {
    if (this.pendingCalls.length) {
      throw new Error('Cannot generate another iteration while a native call has no result.')
    }

    if (this.#groups.some((group) => group.id === id)) {
      throw new Error(`Duplicate iteration id: ${id}`)
    }

    if (!this.#turn) {
      this.beginTurn()
    }

    const iteration = { id, number: ++this.#iteration, turn: this.#turn, turnId: this.#turnId, timestamp: Date.now() }
    this.#groups.push({ id, turn: this.#turn, iteration, settled: false, messages: [] })

    return { ...iteration }
  }

  public appendAssistant(iterationId: string, response: AssistantResponse): void {
    const group = this.#getIteration(iterationId)

    if (group.settled || group.messages.length) {
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

    // Host chat projections normally store delivered text, not native tool calls.
    if (response.output) {
      this.#unacknowledgedAssistantText.push(response.output)
    }
  }

  public appendToolResult(iterationId: string, callId: string, content: string): void {
    const group = this.#getIteration(iterationId)

    if (group.settled) {
      throw new Error('Cannot add a result to a settled iteration.')
    }

    if (!pendingCallIds(group).includes(callId)) {
      throw new Error(`Native call ${callId} is unknown or already has a result.`)
    }

    group.messages.push({ role: 'user', type: 'tool_result', toolResultCallId: callId, content })
  }

  public settleIteration(iterationId: string): void {
    const group = this.#getIteration(iterationId)
    const pending = pendingCallIds(group)

    if (pending.length) {
      throw new Error(`Cannot settle iteration with unresolved native calls: ${pending.join(', ')}`)
    }

    group.settled = true
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
    options: { memory?: boolean | string; now?: number; maxMemoryChars?: number } = {}
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
        : this.memory.render({
            turn: this.#turn,
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

    for (const group of this.#groups) {
      if (group.iteration && !retained.has(group.id) && !group.settled) {
        throw new Error(`Cannot compact pending iteration ${group.id}.`)
      }
    }

    const retainedTurns = new Set(this.#groups.filter((g) => g.iteration && retained.has(g.id)).map((g) => g.turn))
    retainedTurns.add(this.#turn)
    const groups = this.#groups.filter((group) =>
      group.iteration ? retained.has(group.id) : retainedTurns.has(group.turn)
    )
    this.memory.compact(groups.flatMap((group) => (group.iteration ? [group.id] : [])))
    this.#groups = groups
  }

  public toJSON(): Session.JSON {
    return {
      version: 1,
      id: this.id,
      turn: this.#turn,
      turnId: this.#turnId,
      iteration: this.#iteration,
      groups: clone(this.#groups),
      memory: this.memory.serialize(),
      transcript: clone(this.#transcript),
      unacknowledgedAssistantText: [...this.#unacknowledgedAssistantText],
    }
  }

  public static fromJSON(state: Session.JSON): Session {
    if (state.version !== 1) {
      throw new Error(`Unsupported LLMz session version: ${state.version}`)
    }

    const session = new Session()
    Object.defineProperty(session, 'id', { value: state.id, enumerable: true })
    Object.defineProperty(session, 'memory', { value: Memory.restore(state.memory), enumerable: true })
    session.#turn = state.turn
    session.#turnId = state.turnId
    session.#iteration = state.iteration
    session.#groups = clone(state.groups)
    session.#transcript = clone(state.transcript)
    session.#unacknowledgedAssistantText = [...state.unacknowledgedAssistantText]
    validateRestoredHistory(state, session.memory)

    const pendingGroup = session.#groups.findIndex((group) => pendingCallIds(group).length)

    if (pendingGroup >= 0 && pendingGroup !== session.#groups.length - 1) {
      throw new Error('An unresolved native call must be the final history group.')
    }

    return session
  }

  #getIteration(id: string): HistoryGroup {
    const group = this.#groups.find((group) => group.iteration?.id === id)

    if (!group) {
      throw new Error(`Unknown iteration: ${id}`)
    }

    return group
  }

  #appendInput(messages: SessionMessage[]): void {
    this.#groups.push({ id: `input_${ulid()}`, turn: this.#turn, settled: true, messages })
  }
}

function asSessionMessage(message: CognitiveMessage): SessionMessage {
  return clone(message) as SessionMessage
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
  if (message.role === 'system') {
    throw new Error('Session input cannot contain system messages. Supply execute instructions instead.')
  }

  if (message.toolCalls?.length || message.type === 'tool_result' || message.toolResultCallId) {
    throw new Error(
      'New session input cannot contain tool calls/results. Restore a serialized Session to continue native history.'
    )
  }

  assertPersistableData(message)
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

  if (group.settled && ids.size) {
    throw new Error('A settled iteration contains pending native calls.')
  }
}

/** Persisted counters, native identities, and exact values must describe one history. */
function validateRestoredHistory(state: Session.JSON, memory: Memory): void {
  if (
    !Number.isSafeInteger(state.turn) ||
    state.turn < 0 ||
    !Number.isSafeInteger(state.iteration) ||
    state.iteration < 0
  ) {
    throw new Error('Session turn and iteration counters must be non-negative safe integers')
  }

  const groupIds = new Set<string>()
  const callIds = new Set<string>()
  const iterations = new Map<string, SessionIteration>()
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
    validateGroup(group)

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
    iterations.set(iteration.id, iteration)
  }

  let previousMemoryIteration = Number.POSITIVE_INFINITY

  for (const entry of memory.iterations) {
    const iteration = iterations.get(entry.id)
    if (!iteration) {
      throw new Error(`Memory references an iteration absent from retained history: ${entry.id}`)
    }

    if (
      entry.number !== iteration.number ||
      entry.turn !== iteration.turn ||
      entry.turnId !== iteration.turnId ||
      entry.number >= previousMemoryIteration
    ) {
      throw new Error(`Memory provenance disagrees with retained iteration ${entry.id}`)
    }

    previousMemoryIteration = entry.number
  }
}

/** Overlap is positional, so identical user messages in new turns stay distinct. */
function overlappingPrefix(previous: Transcript.Message[], next: Transcript.Message[]): number {
  const before = previous.map((message) => JSON.stringify(message))
  const after = next.map((message) => JSON.stringify(message))

  for (let count = Math.min(before.length, after.length); count > 0; count--) {
    if (before.slice(-count).every((value, index) => value === after[index])) {
      return count
    }
  }

  if (previous.length && next.length) {
    throw new Error(
      'Host transcript changed without an overlapping retained prefix. Use explicit new messages or a new Session.'
    )
  }

  return 0
}

function transcriptMessage(message: Transcript.Message): SessionMessage {
  let content: string

  if (message.role === 'event') {
    content = `External event ${JSON.stringify(message.name)}:\n${JSON.stringify(message.payload)}`
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
