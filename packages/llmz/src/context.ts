import { type CognitiveMessage, Models, SttModels } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { ulid } from 'ulid'
import { Chat } from './chat.js'
import { assertValidComponent, Component } from './component.js'
import { LoopExceededError, SnapshotSignal } from './errors.js'
import type { Example } from './example.js'
import { Exit } from './exit.js'
import { getValue, ValueOrGetter } from './getter.js'
import { HookedArray } from './handlers.js'
import { ObjectInstance } from './objects.js'
import { getNativeSystemMessage } from './prompts/native.js'
import { LLMzPrompts } from './prompts/prompt.js'
import { createNativeToolCatalogue, type NativeToolCatalogue } from './runtime/native-tools.js'
import { RESERVED_RUNTIME_NAMES } from './runtime-names.js'
import { Session } from './session.js'
import { Snapshot } from './snapshots.js'
import { Tool } from './tool.js'
import { Transcript, TranscriptArray } from './transcript.js'
import { stripTruncationTags } from './truncator.js'
import { ObjectMutation, Serializable, Trace } from './types.js'
import { getTokenizer } from './utils.js'

/**
 * Tokenizer estimate of the final request after compaction, grouped by purpose.
 * Categories sum to the measured request size; provider-reported usage is separate.
 * Media transport URLs and encoded bytes are excluded; media token usage is
 * provider-specific and is not available until the provider reports usage.
 */
export type ContextTokens = {
  /** Total measured request size (sum of all the parts below). */
  total: number
  /** System scaffolding and structured-message overhead not attributed below. */
  framework: number
  /** The identity / instructions section. */
  instructions: number
  /** Callable JavaScript declarations and native tool schemas. */
  tools: number
  /** Always zero in the native protocol; conversation history is included in iterations. */
  transcript: number
  /** Native execution rules documenting components and exits. */
  protocol: number
  /** Consumer few-shot demonstrations, separate from the live transcript. */
  examples: number
  /** Current input, retained native history, tool results, and the memory overview. */
  iterations: number
}

/** Token usage of a single iteration's LLM call. */
export type TokenUsage = {
  /** Input tokens consumed, as reported by the LLM provider. Zero until the call completes. */
  input: number
  /** Output tokens produced, as reported by the LLM provider. Zero until the call completes. */
  output: number
  /** Total tokens (input + output). */
  total: number
  /**
   * The effective context window limit of this call, in tokens:
   * `min(options.maxTokens, model's max input tokens)`. Use it to compute the
   * percentage of context used (e.g. `context.total / limit`).
   * Undefined until the LLM call starts.
   */
  limit?: number
  /** Measured context size by part of the request after compaction. */
  context: ContextTokens
}

export type IterationParameters = {
  chatEnabled?: boolean
  transcript: TranscriptArray
  tools: Tool[]
  objects: ObjectInstance[]
  exits: Exit[]
  instructions?: string
  examples?: Example[]
  components: Component[]
  model: Models | Models[]
  temperature: number
  reasoningEffort?: 'low' | 'medium' | 'high' | 'dynamic' | 'none'
}

export type IterationStatus =
  | IterationStatuses.Pending
  | IterationStatuses.GenerationError
  | IterationStatuses.ExecutionError
  | IterationStatuses.InvalidCodeError
  | IterationStatuses.Thinking
  | IterationStatuses.Callback
  | IterationStatuses.ExitSuccess
  | IterationStatuses.ExitError
  | IterationStatuses.Aborted

export namespace IterationStatuses {
  export type Pending = {
    type: 'pending'
  }

  export type GenerationError = {
    type: 'generation_error'
    generation_error: {
      message: string
    }
  }

  export type InvalidCodeError = {
    type: 'invalid_code_error'
    invalid_code_error: {
      message: string
    }
  }

  export type ExecutionError = {
    type: 'execution_error'
    execution_error: {
      message: string
      stack: string
    }
  }

  export type Thinking = {
    type: 'thinking_requested'
    thinking_requested: {
      reason?: string
      /** The value returned by the executed code (or the context provided by a ThinkSignal). */
      variables: unknown
      metadata?: Record<string, unknown>
      /** A tool paused execution; it did not finish or return normally. */
      interrupted?: boolean
    }
  }

  export type Callback = {
    type: 'callback_requested'
    callback_requested: {
      signal: SnapshotSignal
    }
  }

  export type ExitSuccess<T = unknown> = {
    type: 'exit_success'
    exit_success: {
      exit_name: string
      return_value: T
    }
  }

  export type ExitError = {
    type: 'exit_error'
    exit_error: {
      exit: string
      return_value: unknown
      message: string
    }
  }

  export type Aborted = {
    type: 'aborted'
    aborted: {
      reason: string
    }
  }
}

/**
 * Chat completion. JavaScript returns `exit()` or a terminal presentation decision
 * to wait for user input. A plain assistant answer also implies this exit.
 */
export const ListenExit = new Exit({
  name: 'listen',
  description: 'Stop talking and wait for the user to talk next.',
})

/**
 * Worker completion when no custom exits are registered. JavaScript returns
 * `exit('done', { success: true, result })` or
 * `exit('done', { success: false, error })`.
 */
export const DefaultExit = new Exit({
  name: 'done',
  description:
    'Finish when the requested work is complete or no safe, authorized recovery remains. Before reporting failure, address known recoverable causes with available tools without repeating successful actions. Recovery must respect instructions, access requirements, tool-attempt limits, and the remaining response budget.',
  schema: z.discriminatedUnion('success', [
    z.object({
      success: z.literal(true),
      result: z.any().describe('The result of the execution'),
    }),
    z.object({
      success: z.literal(false),
      error: z
        .string()
        .describe(
          'The actual blocker and why available recovery cannot resolve it; a failed tool call alone is insufficient'
        ),
    }),
  ]),
})

export namespace Iteration {
  export type JSON = {
    id: string
    messages: LLMzPrompts.Message[]
    code?: string
    traces: Trace[]
    model: Models | Models[]
    temperature: number
    reasoningEffort?: 'low' | 'medium' | 'high' | 'dynamic' | 'none'
    variables: Record<string, any>
    started_ts: number
    ended_ts?: number
    status: IterationStatus
    mutations: ObjectMutation[]
    llm?: {
      started_at: number
      ended_at: number
      status: 'success' | 'error'
      cached: boolean
      tokens: number
      spend: number
      output: string
      model: string
      time_to_first_token?: number
      time_to_last_token?: number
    }
    tokens?: TokenUsage
    transcript: Transcript.Message[]
    tools: Tool.JSON[]
    objects: ObjectInstance.JSON[]
    exits: Exit.JSON[]
    instructions?: string
    duration?: string
    error?: string | null
    isChatEnabled?: boolean
  }
}

export class Iteration implements Serializable<Iteration.JSON> {
  public id: string
  public messages: LLMzPrompts.Message[]
  public code?: string
  public initialMessages?: CognitiveMessage[]
  public nativeTools?: NativeToolCatalogue
  public sessionInfo?: { id: string; number: number; turn: number; turnId: string; timestamp: number }
  /** Outer native call that owns the current JavaScript execution. */
  public nativeCallId?: string
  public traces: HookedArray<Trace>
  public variables: Record<string, any>

  /**
   * Token usage of this iteration's LLM call. The `context` breakdown is measured
   * when the prompt is assembled; `input`/`output` are filled in once the LLM call
   * completes, from the provider-reported usage.
   */
  public tokens?: TokenUsage

  public started_ts: number
  public ended_ts?: number

  public status: IterationStatus

  private _mutations: Map<string, ObjectMutation>

  public get mutations() {
    return [...this._mutations.values()]
  }

  public trackMutation(mutation: ObjectMutation) {
    this._mutations.set(`${mutation.object ?? 'global'}:${mutation.property}`, mutation)
  }

  private _parameters: IterationParameters

  public get components(): Component[] {
    return this._parameters.components
  }
  public get transcript() {
    return this._parameters.transcript
  }

  public get tools() {
    return this._parameters.tools
  }

  public get objects() {
    return this._parameters.objects
  }

  public get model() {
    return this._parameters.model
  }

  public set model(value: Models | Models[]) {
    this._parameters.model = value
  }

  public get temperature() {
    return this._parameters.temperature
  }

  public get reasoningEffort() {
    return this._parameters.reasoningEffort
  }

  public get exits() {
    const exits = [...this._parameters.exits]

    if (this.isChatEnabled) {
      exits.push(ListenExit)
    }

    return exits
  }

  public get instructions() {
    return this._parameters.instructions
  }

  public llm?: {
    started_at: number
    ended_at: number
    status: 'success' | 'error'
    cached: boolean
    tokens: number
    spend: number
    output: string
    model: string
    /** Milliseconds between the LLM call start and the first streamed token. Only set on streaming clients. */
    time_to_first_token?: number
    /** Milliseconds between the LLM call start and the last streamed token. Only set on streaming clients. */
    time_to_last_token?: number
    usage: {
      inputCost: number
      outputCost: number
      inputTokens: number
      outputTokens: number
    }
  }

  public hasExited(this: this): this is this & { status: IterationStatuses.ExitSuccess } {
    return (<IterationStatus['type'][]>['exit_success']).includes(this.status.type)
  }

  public hasExitedWith<R>(this: this, exit: Exit<R>): this is { status: IterationStatuses.ExitSuccess<R> } & this {
    return this.status.type === 'exit_success' && this.status.exit_success.exit_name === exit.name
  }

  public isSuccessful(this: this): this is this & {
    status: IterationStatuses.ExitSuccess | IterationStatuses.Callback | IterationStatuses.Thinking
  } {
    return (<IterationStatus['type'][]>['callback_requested', 'exit_success', 'thinking_requested']).includes(
      this.status.type
    )
  }

  public isFailed(this: this): this is this & {
    status:
      | IterationStatuses.GenerationError
      | IterationStatuses.ExecutionError
      | IterationStatuses.InvalidCodeError
      | IterationStatuses.ExitError
      | IterationStatuses.Aborted
  } {
    return (<IterationStatus['type'][]>[
      'generation_error',
      'invalid_code_error',
      'execution_error',
      'exit_error',
      'aborted',
    ]).includes(this.status.type)
  }

  public get duration() {
    const ms = (this.ended_ts ?? Date.now()) - this.started_ts
    const trailing = this.ended_ts ? '' : ' (still running)'
    return ms.toLocaleString('en-US', { style: 'unit', unit: 'millisecond' }) + trailing
  }

  public get error() {
    if (this.status.type === 'generation_error') {
      return `CodeGenerationError: ${this.status.generation_error.message}`
    }

    if (this.status.type === 'invalid_code_error') {
      return `InvalidCodeError: ${this.status.invalid_code_error.message}`
    }

    if (this.status.type === 'execution_error') {
      return `CodeExecutionError: ${this.status.execution_error.message}`
    }

    if (this.status.type === 'exit_error') {
      return `ExitError: ${this.status.exit_error.message}`
    }

    if (this.status.type === 'aborted') {
      return `Aborted: ${this.status.aborted.reason}`
    }

    return null
  }

  public get isChatEnabled() {
    return this._parameters.chatEnabled ?? this._parameters.components.length > 0
  }

  public constructor(props: {
    id: string
    parameters: IterationParameters
    messages: LLMzPrompts.Message[]
    variables: Record<string, any>
  }) {
    this.id = props.id
    this.status = { type: 'pending' }
    this.traces = new HookedArray<Trace>()
    this._mutations = new Map()
    this.messages = props.messages
    this.variables = props.variables
    this._parameters = props.parameters
    this.started_ts = Date.now()
  }

  public end(status: IterationStatus) {
    if (this.status.type !== 'pending') {
      throw new Error(`Iteration ${this.id} has already ended with status ${this.status.type}`)
    }

    this.ended_ts = Date.now()
    this.status = status
  }

  public toJSON() {
    return {
      id: this.id,
      messages: [...this.messages],
      code: this.code,
      model: this.model,
      temperature: this.temperature,
      reasoningEffort: this.reasoningEffort,
      traces: [...this.traces],
      variables: this.variables,
      started_ts: this.started_ts,
      ended_ts: this.ended_ts,
      status: this.status,
      mutations: [...this._mutations.values()],
      llm: this.llm,
      tokens: this.tokens,
      transcript: [...this._parameters.transcript],
      tools: this._parameters.tools.map((tool) => tool.toJSON()),
      objects: this._parameters.objects.map((obj) => obj.toJSON()),
      exits: this._parameters.exits.map((exit) => exit.toJSON()),
      instructions: this._parameters.instructions,
      duration: this.duration,
      error: this.error,
      isChatEnabled: this.isChatEnabled,
    } satisfies Iteration.JSON
  }
}

export namespace Context {
  export type JSON = {
    id: string
    iterations: Iteration.JSON[]
    iteration: number
    timeout: number
    loop: number
    metadata: Record<string, any>
    snapshot?: Snapshot.JSON
    session: Session.JSON
  }
}

export class Context implements Serializable<Context.JSON> {
  public id: string

  public chat?: Chat
  public instructions?: ValueOrGetter<string, Context>
  public examples?: ValueOrGetter<Example[], Context>
  public objects?: ValueOrGetter<ObjectInstance[], Context>
  public tools?: ValueOrGetter<Tool[], Context>
  public exits?: ValueOrGetter<Exit[], Context>
  public model?: ValueOrGetter<Models | Models[], Context>
  public temperature: ValueOrGetter<number, Context>
  public reasoningEffort?: ValueOrGetter<'low' | 'medium' | 'high' | 'dynamic' | 'none', Context>

  public session: Session
  public timeout: number = 60_000 // Default timeout of 60 seconds
  public loop: number
  /**
   * Optional cap on the model's context window. The effective limit is
   * `min(maxTokens, model's max input tokens)`.
   */
  public maxTokens?: number
  /**
   * Maximum time to wait for the first streamed token, in milliseconds,
   * before the cognitive service falls back to the next model/provider.
   */
  public maxTimeToFirstToken?: number
  /**
   * Allow Cognitive to restart a failed stream on another model. Previews remain
   * live and are retracted with a restart delta before replacement output.
   * Completed sends and code always wait for a valid response and successful
   * transport. Streaming-only; defaults to false.
   */
  public midStreamFallback?: boolean
  /**
   * STT model used by the cognitive service to transcribe audio attachments
   * when the target LLM does not support audio natively. Defaults to 'fast'.
   */
  public transcriptionModel?: SttModels
  public metadata: Record<string, any>

  public snapshot?: Snapshot

  public iteration: number = 0
  public iterations: Iteration[]

  public async nextIteration(): Promise<Iteration> {
    if (this.iterations.length >= this.loop) {
      throw new LoopExceededError()
    }

    if (this.snapshot && this.snapshot.status.type === 'pending') {
      throw new Error(
        `Cannot resume execution from a snapshot that is still pending: ${this.snapshot.id}. Please resolve() or reject() it first.`
      )
    }

    const parameters = await this._refreshIterationParameters()
    await this.session.memory.syncObjects(parameters.objects, {
      turn: this.session.turn,
      turnId: this.session.turnId,
      timestamp: Date.now(),
    })
    if (this.session.turn === 0) {
      this.session.beginTurn({ transcript: parameters.transcript })
    } else if (this.chat) {
      this.session.reconcileTranscript(parameters.transcript)
    }

    const { messages, parts } = await this._getIterationMessages(parameters)
    const contextTokens = this._measureContextTokens(messages, parts)

    const availableExits = [...parameters.exits]
    if (this.chat) {
      availableExits.push(ListenExit)
    }

    const nativeTools = createNativeToolCatalogue({ components: parameters.components, exits: availableExits })
    const sessionInfo = this.session.nextIteration()

    try {
      this.session.memory.assertCapacityForIteration(sessionInfo)
    } catch (error) {
      this.session.settleIteration(sessionInfo.id)
      throw error
    }

    const iteration = new Iteration({
      id: sessionInfo.id,
      variables: this.session.memory.getBindings(),
      parameters,
      messages,
    })

    iteration.sessionInfo = sessionInfo
    iteration.nativeTools = nativeTools
    iteration.tokens = { input: 0, output: 0, total: 0, context: contextTokens }

    this.iterations.push(iteration)
    this.iteration = this.iterations.length
    this.snapshot = undefined

    return iteration
  }

  /**
   * Measures the token size of each part of the prompt (pre-truncation).
   * The named parts come from the system prompt; everything else in the system
   * message is `framework`. Non-system messages count towards `iterations`,
   * except the very first user message of a fresh execution (task recap),
   * which is prompt scaffolding.
   */
  private _measureContextTokens(messages: LLMzPrompts.Message[], parts: LLMzPrompts.SystemPromptParts): ContextTokens {
    const tokenizer = getTokenizer()

    const countText = (text: string | undefined) => (text?.length ? tokenizer.count(stripTruncationTags(text)) : 0)
    const countMessage = (message: LLMzPrompts.Message): number => {
      if (typeof message.content === 'string') {
        return countText(message.content)
      }

      if (Array.isArray(message.content)) {
        // Images and other non-text parts are not counted
        return message.content.reduce((acc, part) => acc + (part.type === 'text' ? countText(part.text) : 0), 0)
      }

      return 0
    }

    const instructions = countText(parts.instructions)
    const tools = countText(parts.tools)
    const transcript = countText(parts.transcript)
    const protocol = countText(parts.protocol)
    const examples = countText(parts.examples)

    const systemTokens = messages.filter((x) => x.role === 'system').reduce((acc, x) => acc + countMessage(x), 0)
    const otherTokens = messages.filter((x) => x.role !== 'system').reduce((acc, x) => acc + countMessage(x), 0)

    const isFirstIteration = this.iterations.length === 0 && !this.snapshot
    const framework = Math.max(0, systemTokens - (instructions + tools + transcript + protocol + examples))
    const iterations = isFirstIteration ? 0 : otherTokens

    return {
      total:
        framework +
        instructions +
        tools +
        transcript +
        protocol +
        examples +
        iterations +
        (isFirstIteration ? otherTokens : 0),
      framework: framework + (isFirstIteration ? otherTokens : 0),
      instructions,
      tools,
      transcript,
      protocol,
      examples,
      iterations,
    }
  }

  private async _getIterationMessages(
    parameters: IterationParameters
  ): Promise<{ messages: LLMzPrompts.Message[]; parts: LLMzPrompts.SystemPromptParts }> {
    const exits = this.chat ? [...parameters.exits, ListenExit] : parameters.exits
    const { message, parts } = await getNativeSystemMessage({
      isChatEnabled: !!this.chat,
      globalTools: parameters.tools,
      objects: parameters.objects,
      instructions: parameters.instructions,
      examples: parameters.examples,
      transcript: parameters.transcript,
      exits,
      components: parameters.components,
    })
    return { messages: [message, ...this.session.requestMessages()], parts }
  }

  private async _refreshIterationParameters(): Promise<IterationParameters> {
    const instructions = await getValue(this.instructions, this)
    const examples = await getValue(this.examples, this)
    const transcript = new TranscriptArray(await getValue(this.chat?.transcript ?? [], this))
    const tools = Tool.withUniqueNames((await getValue(this.tools, this)) ?? [])
    const objects = (await getValue(this.objects, this)) ?? []
    const exits = (await getValue(this.exits, this)) ?? []
    const components = await getValue(this.chat?.components ?? [], this)
    const model = (await getValue(this.model, this)) ?? 'best'
    const temperature = await getValue(this.temperature, this)
    const reasoningEffort = await getValue(this.reasoningEffort, this)

    if (objects && objects.length > 100) {
      throw new Error('Too many objects. Expected at most 100 objects.')
    }

    if (tools && tools.length > 100) {
      throw new Error('Too many tools. Expected at most 100 tools.')
    }

    for (const component of components) {
      assertValidComponent(component.definition)
    }

    const occupied = new Set<string>()
    const registerName = (name: string) => {
      if (RESERVED_RUNTIME_NAMES.has(name) || name.startsWith('__')) {
        throw new Error(`Runtime name "${name}" is reserved.`)
      }

      if (occupied.has(name)) {
        throw new Error(`Duplicate JavaScript binding "${name}".`)
      }

      if (Object.hasOwn(this.session.memory.variables, name)) {
        throw new Error(
          `JavaScript binding "${name}" conflicts with retained memory. Rename or remove it before registering a tool or object.`
        )
      }

      occupied.add(name)
    }
    for (const tool of tools) {
      for (const name of new Set([tool.name, ...tool.aliases])) {
        registerName(name)
      }
    }

    for (const object of objects) {
      registerName(object.name)
    }

    if (exits && exits.length > 100) {
      throw new Error('Too many exits. Expected at most 100 exits.')
    }

    if (components && components.length > 100) {
      throw new Error('Too many components. Expected at most 100 components.')
    }

    if (instructions && instructions.length > 1_000_000) {
      throw new Error('Instructions are too long. Expected at most 1,000,000 characters.')
    }

    if (transcript && transcript.length > 250) {
      throw new Error('Too many transcript messages. Expected at most 250 messages.')
    }

    if (!this.chat && !exits.length) {
      exits.push(DefaultExit)
    }

    if (typeof temperature !== 'number' || isNaN(temperature) || temperature < 0 || temperature > 2) {
      throw new Error('Invalid temperature. Expected a number between 0 and 2.')
    }

    const isValidModel = (m: unknown): m is string =>
      typeof m === 'string' && (m === 'best' || m === 'fast' || m === 'auto' || m.includes(':'))

    if (Array.isArray(model)) {
      if (model.length === 0 || !model.every(isValidModel)) {
        throw new Error(
          "Invalid model. Expected a non-empty array of model strings ('best'/'fast'/'auto' or 'provider:model')."
        )
      }
    } else if (!isValidModel(model)) {
      throw new Error("Invalid model. Expected 'best'/'fast'/'auto' or 'provider:model'.")
    }

    return {
      chatEnabled: !!this.chat,
      transcript,
      tools,
      objects,
      exits,
      instructions,
      examples,
      components,
      model,
      temperature,
      reasoningEffort,
    }
  }

  public constructor(props: {
    chat?: Chat
    instructions?: ValueOrGetter<string, Context>
    examples?: ValueOrGetter<Example[], Context>
    objects?: ValueOrGetter<ObjectInstance[], Context>
    tools?: ValueOrGetter<Tool[], Context>
    exits?: ValueOrGetter<Exit[], Context>
    loop?: number
    temperature?: ValueOrGetter<number, Context>
    reasoningEffort?: ValueOrGetter<'low' | 'medium' | 'high' | 'dynamic' | 'none', Context>
    model?: ValueOrGetter<Models | Models[], Context>
    metadata?: Record<string, any>
    snapshot?: Snapshot
    session?: Session
    timeout?: number
    maxTokens?: number
    maxTimeToFirstToken?: number
    midStreamFallback?: boolean
    transcriptionModel?: SttModels
  }) {
    this.id = `llmz_${ulid()}`
    this.instructions = props.instructions
    this.examples = props.examples
    this.objects = props.objects
    this.tools = props.tools
    this.exits = props.exits
    this.chat = props.chat

    this.timeout = Math.min(999_999_999, Math.max(0, props.timeout ?? 60_000)) // Default timeout of 60 seconds
    this.loop = props.loop ?? 3
    this.temperature = props.temperature ?? 0.7
    this.reasoningEffort = props.reasoningEffort
    this.model = props.model ?? 'best'
    this.iterations = []
    this.metadata = props.metadata ?? {}
    this.snapshot = props.snapshot
    this.session = props.session ?? (props.snapshot?.session ? Session.fromJSON(props.snapshot.session) : new Session())
    this.maxTokens = props.maxTokens
    this.maxTimeToFirstToken = props.maxTimeToFirstToken
    this.midStreamFallback = props.midStreamFallback
    this.transcriptionModel = props.transcriptionModel

    if (this.loop < 1 || this.loop > 100) {
      throw new Error('Invalid loop. Expected a number between 1 and 100.')
    }

    if (this.maxTokens !== undefined && (!Number.isFinite(this.maxTokens) || this.maxTokens < 1)) {
      throw new Error('Invalid maxTokens. Expected a positive number.')
    }

    if (
      this.maxTimeToFirstToken !== undefined &&
      (!Number.isFinite(this.maxTimeToFirstToken) || this.maxTimeToFirstToken < 1)
    ) {
      throw new Error('Invalid maxTimeToFirstToken. Expected a positive number of milliseconds.')
    }

    if (this.midStreamFallback !== undefined && typeof this.midStreamFallback !== 'boolean') {
      throw new Error('Invalid midStreamFallback. Expected a boolean.')
    }
  }

  public toJSON() {
    return {
      id: this.id,
      iterations: this.iterations.map((iteration) => iteration.toJSON()),
      iteration: this.iteration,
      timeout: this.timeout,
      loop: this.loop,
      metadata: this.metadata,
      snapshot: this.snapshot?.toJSON(),
      session: this.session.toJSON(),
    } satisfies Context.JSON
  }
}
