import { Models, SttModels } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { ulid } from 'ulid'
import { Chat } from './chat/chat.js'
import { assertValidComponent, createComponentRegistry, type ComponentRegistry } from './chat/component.js'
import { resolveResponse, type ResolvedResponse } from './chat/response.js'
import {
  describeError,
  InternalError,
  InvalidConfigurationError,
  isLLMzError,
  LoopExceededError,
  ReservedIdentifierError,
  Signals,
  type ErrorDetails,
  type LLMzFailure,
} from './errors.js'

import { Exit } from './exit.js'
import { getValue, ValueOrGetter } from './getter.js'
import { createInspector, type Inspector, type OnInspect } from './inspection.js'
import { ObjectInstance } from './objects.js'
import { getNativeSystemMessage } from './prompts/native.js'
import { LLMzPrompts } from './prompts/prompt.js'
import { RESERVED_RUNTIME_NAMES } from './runtime-names.js'
import { Session } from './session/session.js'
import { Tool } from './tool.js'
import { DEFAULT_TOOL_RESULT_MAX_TOKENS } from './truncate.js'
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
  /** Native execution rules documenting components and exits. */
  protocol: number
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
   * `min(options.maxTokens, smallest configured model input limit)`. Use it to compute the
   * percentage of context used (e.g. `context.total / limit`).
   * Undefined until the LLM call starts.
   */
  limit?: number
  /** Measured context size by part of the request after compaction. */
  context: ContextTokens
}

export type IterationParameters = {
  chatEnabled: boolean
  tools: Tool[]
  objects: ObjectInstance[]
  exits: Exit[]
  instructions?: string
  components: ComponentRegistry
  response?: ResolvedResponse
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
 * Chat completion. JavaScript uses `return exit('listen')`
 * to wait for user input. A plain assistant answer also implies this exit.
 */
export const ListenExit = new Exit({
  name: 'listen',
  description: 'Stop talking and wait for the user to talk next.',
})

/**
 * Worker completion when exits are omitted. JavaScript returns
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
    code?: string
    traces: Trace[]
    model: Models | Models[]
    temperature: number
    reasoningEffort?: 'low' | 'medium' | 'high' | 'dynamic' | 'none'
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
    duration?: string
    error?: string | null
    exception?: ErrorDetails
    errors: ErrorDetails[]
    isChatEnabled?: boolean
  }
}

export class Iteration implements Serializable<Iteration.JSON> {
  public id: string
  public readonly systemMessage: LLMzPrompts.Message
  public code?: string
  public sessionInfo?: { id: string; number: number; turn: number; turnId: string; timestamp: number }
  /** Outer native call that owns the current JavaScript execution. */
  public nativeCallId?: string
  public traces: Trace[] = []

  private readonly _onTrace?: (trace: Trace) => void

  /** Record a runtime trace and notify the observer without changing execution on observer errors. */
  public recordTrace = (trace: Trace): void => {
    this.traces.push(trace)

    try {
      this._onTrace?.(trace)
    } catch {
      // Trace observers must not change the result of a completed action.
    }
  }

  /**
   * Token usage of this iteration's LLM call. The `context` breakdown is measured
   * when the prompt is assembled; `input`/`output` are filled in once the LLM call
   * completes, from the provider-reported usage.
   */
  public tokens?: TokenUsage

  public started_ts: number
  public ended_ts?: number

  public status: IterationStatus
  /** Original failure for programmatic handling. Execution errors retain their typed cause. */
  public exception?: LLMzFailure
  /** All observed failures, including tool errors caught by generated code. */
  public readonly errors: LLMzFailure[] = []

  public recordError(value: unknown): LLMzFailure {
    const error = Signals.maybeDeserializeError(value)
    const failure = isLLMzError(error)
      ? error
      : new InternalError(error instanceof Error ? error.message : String(error), { cause: error })
    if (!this.errors.includes(failure)) {
      this.errors.push(failure)
    }

    return failure
  }

  private _mutations: Map<string, ObjectMutation>

  public get mutations() {
    return [...this._mutations.values()]
  }

  public trackMutation(mutation: ObjectMutation) {
    this._mutations.set(`${mutation.object ?? 'global'}:${mutation.property}`, mutation)
  }

  private _parameters: IterationParameters

  public get components(): ComponentRegistry {
    return this._parameters.components
  }

  public get response(): ResolvedResponse | undefined {
    return this._parameters.response
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
    return this._parameters.exits
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
    status: IterationStatuses.ExitSuccess | IterationStatuses.Thinking
  } {
    return (<IterationStatus['type'][]>['exit_success', 'thinking_requested']).includes(this.status.type)
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

  /** Human-readable failure summary. Use exception for instanceof checks and structured details. */
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
    return this._parameters.chatEnabled
  }

  public constructor(props: {
    id: string
    parameters: IterationParameters
    systemMessage: LLMzPrompts.Message
    onTrace?: (trace: Trace) => void
  }) {
    this.id = props.id
    this.status = { type: 'pending' }
    this._onTrace = props.onTrace
    this._mutations = new Map()
    this.systemMessage = props.systemMessage
    this._parameters = props.parameters
    this.started_ts = Date.now()
  }

  public end(status: IterationStatus, exception?: unknown) {
    if (this.status.type !== 'pending') {
      throw new InvalidConfigurationError(`Iteration ${this.id} has already ended with status ${this.status.type}`)
    }

    this.ended_ts = Date.now()
    this.status = status
    if (exception !== undefined) {
      this.exception = this.recordError(exception)
    }
  }

  public toJSON() {
    return {
      id: this.id,
      code: this.code,
      model: this.model,
      temperature: this.temperature,
      reasoningEffort: this.reasoningEffort,
      traces: [...this.traces],
      started_ts: this.started_ts,
      ended_ts: this.ended_ts,
      status: this.status,
      mutations: [...this._mutations.values()],
      llm: this.llm,
      tokens: this.tokens,
      duration: this.duration,
      error: this.error,
      exception: this.exception ? describeError(this.exception) : undefined,
      errors: this.errors.map((error) => describeError(error)),
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
    sessionId: string
  }
}

export class Context implements Serializable<Context.JSON> {
  public id: string

  public chat?: Chat
  public instructions?: ValueOrGetter<string, Context>
  public objects?: ValueOrGetter<ObjectInstance[], Context>
  public tools?: ValueOrGetter<Tool[], Context>
  public exits?: ValueOrGetter<Exit[], Context>
  public model?: ValueOrGetter<Models | Models[], Context>
  public temperature: ValueOrGetter<number, Context>
  public reasoningEffort?: ValueOrGetter<'low' | 'medium' | 'high' | 'dynamic' | 'none', Context>

  public session: Session
  public readonly inspector: Inspector
  public timeout: number = 60_000 // Default timeout of 60 seconds
  public loop: number
  /**
   * Optional cap on the model's context window. The effective limit is
   * `min(maxTokens, smallest configured model input limit)`.
   */
  public maxTokens?: number
  /** Default display budget; explicitly wrapped tool results can override it. */
  public toolResultMaxTokens: number = DEFAULT_TOOL_RESULT_MAX_TOKENS
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

  public iteration: number = 0
  public iterations: Iteration[]

  public async nextIteration(onTrace?: (trace: Trace) => void): Promise<Iteration> {
    if (this.iterations.length >= this.loop) {
      throw new LoopExceededError()
    }

    this.session.beginTurn()

    const parameters = await this._refreshIterationParameters()
    await this.session.memory.syncObjects(parameters.objects, {
      turn: this.session.turn,
      turnId: this.session.turnId,
      timestamp: Date.now(),
    })

    const { message, parts } = await this._getIterationMessages(parameters)
    const contextTokens = this._measureContextTokens([message], parts)

    const sessionInfo = this.session.nextIteration()

    try {
      this.session.assertCapacityForIteration(sessionInfo)
    } catch (error) {
      this.session.cancelIteration(sessionInfo.id)
      throw error
    }

    const iteration = new Iteration({
      id: sessionInfo.id,
      parameters,
      systemMessage: message,
      onTrace,
    })

    iteration.sessionInfo = sessionInfo
    iteration.tokens = { input: 0, output: 0, total: 0, context: contextTokens }

    this.iterations.push(iteration)
    this.iteration = this.iterations.length

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

    const countText = (text: string | undefined) => (text?.length ? tokenizer.count(text) : 0)
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
    const protocol = countText(parts.protocol)

    const systemTokens = messages.filter((x) => x.role === 'system').reduce((acc, x) => acc + countMessage(x), 0)
    const otherTokens = messages.filter((x) => x.role !== 'system').reduce((acc, x) => acc + countMessage(x), 0)

    const framework = Math.max(0, systemTokens - instructions - tools - protocol)

    return {
      total: systemTokens + otherTokens,
      framework,
      instructions,
      tools,
      protocol,
      iterations: otherTokens,
    }
  }

  private async _getIterationMessages(parameters: IterationParameters): Promise<LLMzPrompts.SystemMessage> {
    const { message, parts } = await getNativeSystemMessage({
      isChatEnabled: !!this.chat,
      globalTools: parameters.tools,
      objects: parameters.objects,
      instructions: parameters.instructions,
      exits: parameters.exits,
      components: parameters.components,
      response: parameters.response,
    })
    return { message, parts }
  }

  private async _refreshIterationParameters(): Promise<IterationParameters> {
    const instructions = await getValue(this.instructions, this)
    const configuredTools = (await getValue(this.tools, this)) ?? []

    // Check the configured names before duplicate-name normalization can replace them.
    for (const tool of configuredTools) {
      for (const name of [tool.name, ...tool.aliases]) {
        assertNotReservedRuntimeName(name, 'tool')
      }
    }

    const tools = Tool.withUniqueNames(configuredTools)
    const objects = (await getValue(this.objects, this)) ?? []
    const exits = [...((await getValue(this.exits, this)) ?? [])]
    const components = await getValue(this.chat?.components ?? [], this)
    const response = this.chat ? resolveResponse(await getValue(this.chat.response, this)) : undefined
    const model = (await getValue(this.model, this)) ?? 'best'
    const temperature = await getValue(this.temperature, this)
    const reasoningEffort = await getValue(this.reasoningEffort, this)

    if (objects && objects.length > 100) {
      throw new InvalidConfigurationError('Too many objects. Expected at most 100 objects.')
    }

    if (tools && tools.length > 100) {
      throw new InvalidConfigurationError('Too many tools. Expected at most 100 tools.')
    }

    for (const component of components) {
      assertValidComponent(component.definition)

      if (typeof component.handler !== 'function') {
        throw new InvalidConfigurationError(
          `Component "${component.definition.name}" requires a handler. Attach one with withHandler().`
        )
      }
    }

    const occupied = new Set<string>()
    const registerName = (name: string, kind: 'tool' | 'object') => {
      assertNotReservedRuntimeName(name, kind)

      if (occupied.has(name)) {
        throw new InvalidConfigurationError(`Duplicate JavaScript binding "${name}".`)
      }

      if (Object.hasOwn(this.session.memory.variables, name)) {
        throw new InvalidConfigurationError(
          `JavaScript binding "${name}" conflicts with retained memory. Rename or remove it before registering a tool or object.`
        )
      }

      occupied.add(name)
    }

    for (const tool of tools) {
      for (const name of new Set([tool.name, ...tool.aliases])) {
        registerName(name, 'tool')
      }
    }

    for (const object of objects) {
      registerName(object.name, 'object')
    }

    if (exits && exits.length > 100) {
      throw new InvalidConfigurationError('Too many exits. Expected at most 100 exits.')
    }

    if (components && components.length > 100) {
      throw new InvalidConfigurationError('Too many components. Expected at most 100 components.')
    }

    if (instructions && instructions.length > 1_000_000) {
      throw new InvalidConfigurationError('Instructions are too long. Expected at most 1,000,000 characters.')
    }

    if (this.chat) {
      exits.push(ListenExit)
    } else if (!exits.length && this.exits === undefined) {
      exits.push(DefaultExit)
    }

    const exitNames = new Set<string>()

    for (const exit of exits) {
      for (const name of [exit.name, ...exit.aliases]) {
        if (name !== 'exit') {
          assertNotReservedRuntimeName(name, 'exit')
        }
      }

      for (const name of new Set([exit.name, ...exit.aliases].map((name) => name.toLowerCase()))) {
        if (exitNames.has(name)) {
          throw new InvalidConfigurationError(`Duplicate exit name or alias: ${name}`)
        }

        exitNames.add(name)
      }
    }

    if (typeof temperature !== 'number' || isNaN(temperature) || temperature < 0 || temperature > 2) {
      throw new InvalidConfigurationError('Invalid temperature. Expected a number between 0 and 2.')
    }

    const isValidModel = (m: unknown): m is string =>
      typeof m === 'string' && (m === 'best' || m === 'fast' || m === 'auto' || m.includes(':'))

    if (Array.isArray(model)) {
      if (model.length === 0 || !model.every(isValidModel)) {
        throw new InvalidConfigurationError(
          "Invalid model. Expected a non-empty array of model strings ('best'/'fast'/'auto' or 'provider:model')."
        )
      }
    } else if (!isValidModel(model)) {
      throw new InvalidConfigurationError("Invalid model. Expected 'best'/'fast'/'auto' or 'provider:model'.")
    }

    return {
      chatEnabled: !!this.chat,
      tools,
      objects,
      exits,
      instructions,
      components: createComponentRegistry(components),
      response,
      model,
      temperature,
      reasoningEffort,
    }
  }

  public constructor(props: {
    chat?: Chat
    instructions?: ValueOrGetter<string, Context>
    objects?: ValueOrGetter<ObjectInstance[], Context>
    tools?: ValueOrGetter<Tool[], Context>
    exits?: ValueOrGetter<Exit[], Context>
    loop?: number
    temperature?: ValueOrGetter<number, Context>
    reasoningEffort?: ValueOrGetter<'low' | 'medium' | 'high' | 'dynamic' | 'none', Context>
    model?: ValueOrGetter<Models | Models[], Context>
    metadata?: Record<string, any>
    session?: Session
    onInspect?: OnInspect
    timeout?: number
    maxTokens?: number
    toolResultMaxTokens?: number
    maxTimeToFirstToken?: number
    midStreamFallback?: boolean
    transcriptionModel?: SttModels
  }) {
    this.id = `llmz_${ulid()}`
    this.instructions = props.instructions
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
    this.session = props.session ?? new Session()
    const inspectValue = createInspector(props.onInspect)
    this.inspector = (value, options) =>
      inspectValue(value, {
        ...options,
        identity: {
          sessionId: this.session.id,
          turn: this.session.turn,
          turnId: this.session.turnId,
          iterationId: this.iterations.at(-1)?.id,
          iteration: this.iterations.at(-1)?.sessionInfo?.number,
          ...options.identity,
        },
      })
    this.maxTokens = props.maxTokens
    this.toolResultMaxTokens = props.toolResultMaxTokens ?? DEFAULT_TOOL_RESULT_MAX_TOKENS
    this.maxTimeToFirstToken = props.maxTimeToFirstToken
    this.midStreamFallback = props.midStreamFallback
    this.transcriptionModel = props.transcriptionModel

    if (this.loop < 1 || this.loop > 100) {
      throw new InvalidConfigurationError('Invalid loop. Expected a number between 1 and 100.')
    }

    if (this.maxTokens !== undefined && (!Number.isSafeInteger(this.maxTokens) || this.maxTokens < 1)) {
      throw new InvalidConfigurationError('Invalid maxTokens. Expected a positive safe integer.')
    }

    if (
      !Number.isInteger(this.toolResultMaxTokens) ||
      this.toolResultMaxTokens < 0 ||
      this.toolResultMaxTokens > DEFAULT_TOOL_RESULT_MAX_TOKENS
    ) {
      throw new InvalidConfigurationError('Invalid toolResultMaxTokens. Expected an integer between 0 and 2000.')
    }

    if (
      this.maxTimeToFirstToken !== undefined &&
      (!Number.isFinite(this.maxTimeToFirstToken) || this.maxTimeToFirstToken < 1)
    ) {
      throw new InvalidConfigurationError('Invalid maxTimeToFirstToken. Expected a positive number of milliseconds.')
    }

    if (this.midStreamFallback !== undefined && typeof this.midStreamFallback !== 'boolean') {
      throw new InvalidConfigurationError('Invalid midStreamFallback. Expected a boolean.')
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
      sessionId: this.session.id,
    } satisfies Context.JSON
  }
}

function assertNotReservedRuntimeName(name: string, kind: 'tool' | 'object' | 'exit'): void {
  if (RESERVED_RUNTIME_NAMES.has(name) || name.startsWith('__')) {
    throw new ReservedIdentifierError(name, kind)
  }
}
