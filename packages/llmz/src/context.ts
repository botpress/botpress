import { type Cognitive } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { cloneDeep, isPlainObject } from 'lodash-es'
import { ulid } from 'ulid'
import { Chat } from './chat.js'
import { assertValidComponent, Component, RenderedComponent } from './component.js'
import { LoopExceededError, SnapshotSignal } from './errors.js'
import { Exit } from './exit.js'
import { getValue, ValueOrGetter } from './getter.js'
import { HookedArray } from './handlers.js'
import { ObjectInstance } from './objects.js'
import { DualModePrompt } from './prompts/dual-modes.js'
import { LLMzPrompts, Prompt } from './prompts/prompt.js'
import { Snapshot } from './snapshots.js'
import { Tool } from './tool.js'
import { Transcript, TranscriptArray } from './transcript.js'
import { wrapContent } from './truncator.js'
import { ObjectMutation, Serializable, Trace } from './types.js'

type Model = Parameters<InstanceType<typeof Cognitive>['generateContent']>[0]['model']

export type IterationParameters = {
  transcript: TranscriptArray
  tools: Tool[]
  objects: ObjectInstance[]
  exits: Exit[]
  instructions?: string
  components: Component[]
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
      variables: Record<string, unknown>
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
 * Built-in exit for requesting thinking time during agent execution.
 *
 * The ThinkExit allows agents to pause execution and reflect on the current situation,
 * variables, and context before continuing. There are two ways to trigger thinking:
 *
 * 1. **Agent-initiated**: Agent calls `return { action: 'think' }` to pause and reflect
 * 2. **Tool/Hook-initiated**: Tools or hooks throw `ThinkSignal` to force agent reflection
 *
 * This exit is automatically available in all LLMz executions and is commonly used for:
 * - Complex decision making that requires analysis
 * - Debugging and understanding current variable state
 * - Planning multi-step operations
 * - Tool feedback and result processing
 * - Reflecting on previous iterations and results
 *
 * @example
 * ```typescript
 * // Agent retrieves web search results and decides to think about them
 * const results = await searchWeb(query)
 *
 * // Agent decides it needs to think (look at the search results) before responding
 * return { action: 'think', results }
 * ```
 *
 * Sometimes, as the author of the tool, you may want to always force the agent to think about the results.
 * In this case, you can throw a `ThinkSignal` from the tool handler to trigger thinking.
 *
 * @example
 * ```typescript
 * // Tool-initiated thinking using ThinkSignal
 * import { ThinkSignal } from 'llmz'
 *
 * const searchTool = new Tool({
 *   name: 'search',
 *   handler: async ({ query }) => {
 *     const results = await performSearch(query)
 *
 *     if (!results.length) {
 *       // Force agent to think about alternative approaches
 *       throw new ThinkSignal(
 *         'No search results found',
 *         'No results were found. Consider rephrasing the query or using a different approach.'
 *       )
 *     }
 *
 *     // Provide context for agent to process results
 *     throw new ThinkSignal(
 *       'Search completed with results',
 *       `Found ${results.length} results. Process them carefully and provide citations.`
 *     )
 *   }
 * })
 * ```
 * When an iteration ends with ThinkExit, the agent will automatically loop and start a new iteration to continue processing, unless iteration limit is reached.
 *
 * The thinking process helps agents:
 * - Avoid rushing into incorrect solutions
 * - Better understand complex problems and tool results
 * - Maintain variable state across iterations
 * - Process feedback from tools and hooks
 * - Provide more thoughtful and accurate responses
 */
export const ThinkExit = new Exit({
  name: 'think',
  description: 'Think about the current situation and provide a response',
})

/**
 * Built-in exit for waiting for user input in chat mode.
 *
 * The ListenExit is automatically available when chat mode is enabled (when a Chat
 * instance is provided to execute()). When an agent calls `return { action: 'listen' }`,
 * the execution pauses and waits for user input before continuing the conversation.
 *
 * This exit is essential for interactive conversational agents and is used to:
 * - Wait for user responses in chat interfaces
 * - Pause execution until user provides input
 * - Enable back-and-forth conversation flow
 * - Allow users to guide the conversation direction
 *
 * The ListenExit is only available in chat mode - it will not be present in
 * worker mode executions where no chat interface is provided.
 *
 * @example
 * ```typescript
 * // Agent generated code using ListenExit in chat mode
 * yield <Message>What would you like me to help you with today?</Message>
 * yield <Button action="postback" label="Get Weather" value="weather" />
 * yield <Button action="postback" label="Set Reminder" value="reminder" />
 *
 * // Wait for user to respond
 * return { action: 'listen' }
 * ```
 *
 * @example
 * ```typescript
 * // Standard chat interaction pattern
 * const calculation = 2 + 8
 * yield <Message>The result of `2 + 8` is **{calculation}**.</Message>
 * return { action: 'listen' }
 * ```
 *
 * @example
 * ```typescript
 * // CLI chat example with ListenExit handling
 * const chat = new CLIChat()
 *
 * while (chat.iterate()) {
 *   const result = await execute({
 *     instructions: 'Help the user with their questions',
 *     chat,
 *     client,
 *   })
 *
 *   if (result.is(ListenExit)) {
 *     // CLIChat handles prompting user automatically
 *     continue
 *   } else {
 *     console.log('Conversation ended')
 *     break
 *   }
 * }
 * ```
 *
 * The ListenExit enables natural conversation flow where:
 * - Agent sends messages and waits for responses
 * - User provides input to guide the conversation
 * - Conversation continues iteratively until completion
 * - Chat interface manages the input/output cycle
 */
export const ListenExit = new Exit({
  name: 'listen',
  description: 'Listen to the user and provide a response',
})

/**
 * Default exit used when no custom exits are provided.
 *
 * The DefaultExit is automatically used in worker mode when no custom exits are defined.
 * It provides a standard way to complete execution with either success or failure outcomes.
 * The exit uses a discriminated union schema to ensure type-safe handling of both success
 * and error cases.
 *
 * This exit is commonly used for:
 * - Simple worker mode executions without custom completion logic
 * - Standardized success/failure reporting
 * - Basic task completion with result or error information
 * - Default fallback when no specific exit behavior is needed
 *
 * @example
 * ```typescript
 * // Agent generated code using DefaultExit for successful completion
 * const data = await fetchUserData(userId)
 * const processedResult = processData(data)
 *
 * return {
 *   action: 'done',
 *   success: true,
 *   result: processedResult
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Agent generated code using DefaultExit for error cases
 * try {
 *   const result = await riskyOperation()
 *   return { action: 'done', success: true, result }
 * } catch (error) {
 *   return {
 *     action: 'done',
 *     success: false,
 *     error: `Operation failed: ${error.message}`
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * import { execute, DefaultExit } from 'llmz'
 *
 * // Handling DefaultExit in execution results
 * const result = await execute({
 *   instructions: 'Process the user data and return results',
 *   // No custom exits provided - DefaultExit will be used
 *   client,
 * })
 *
 * if (result.is(DefaultExit)) {
 *   if (result.output.success) {
 *     console.log('Success:', result.output.result)
 *   } else {
 *     console.error('Error:', result.output.error)
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Worker mode execution with automatic DefaultExit
 * const result = await execute({
 *   instructions: 'Calculate fibonacci numbers up to 100',
 *   tools: [mathTools],
 *   client,
 *   // No chat provided = worker mode
 *   // No exits provided = DefaultExit automatically added
 * })
 *
 * // Result will use DefaultExit for completion
 * if (result.isSuccess() && result.is(DefaultExit)) {
 *   const { success, result: data, error } = result.output
 *   // Handle success/failure cases
 * }
 * ```
 *
 * The DefaultExit provides a consistent interface for:
 * - Type-safe success/failure handling
 * - Standardized result reporting across different executions
 * - Automatic fallback behavior when no custom exits are defined
 * - Clear separation between successful results and error conditions
 */
export const DefaultExit = new Exit({
  name: 'done',
  description: 'When the execution is sucessfully completed or when error recovery is not possible',
  schema: z.discriminatedUnion('success', [
    z.object({
      success: z.literal(true),
      result: z.any().describe('The result of the execution'),
    }),
    z.object({
      success: z.literal(false),
      error: z.string().describe('The error message if the execution failed'),
    }),
  ]),
})

export namespace Iteration {
  export type JSON = {
    id: string
    messages: LLMzPrompts.Message[]
    code?: string
    traces: Trace[]
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
    }
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
  public traces: HookedArray<Trace>
  public variables: Record<string, any>

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
  public get transcript() {
    return this._parameters.transcript
  }

  public get tools() {
    return this._parameters.tools
  }

  public get objects() {
    return this._parameters.objects
  }

  public get exits() {
    const exits = [...this._parameters.exits, ThinkExit]

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
    return this._parameters.tools.find((x) => x.name.toLowerCase() === 'message') !== undefined
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
      traces: [...this.traces],
      variables: this.variables,
      started_ts: this.started_ts,
      ended_ts: this.ended_ts,
      status: this.status,
      mutations: [...this._mutations.values()],
      llm: this.llm,
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
    temperature: number
    model?: Model
    metadata: Record<string, any>
    snapshot?: Snapshot.JSON
  }
}

export class Context implements Serializable<Context.JSON> {
  public id: string

  public chat?: Chat
  public instructions?: ValueOrGetter<string, Context>
  public objects?: ValueOrGetter<ObjectInstance[], Context>
  public tools?: ValueOrGetter<Tool[], Context>
  public exits?: ValueOrGetter<Exit[], Context>

  public version: Prompt = DualModePrompt
  public timeout: number = 60_000 // Default timeout of 60 seconds
  public loop: number
  public temperature: number
  public model?: Model
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
    const messages = await this._getIterationMessages(parameters)

    const iteration = new Iteration({
      id: `${this.id}_${this.iterations.length + 1}`,
      variables: this._getIterationVariables(),
      parameters,
      messages,
    })

    this.iterations.push(iteration)
    this.iteration = this.iterations.length
    this.snapshot = undefined

    return iteration
  }

  private _getIterationVariables(): Record<string, any> {
    const lastIteration = this.iterations.at(-1)
    const variables = {}

    if (lastIteration?.status.type === 'thinking_requested') {
      const lastThinkingVariables = lastIteration.status.thinking_requested.variables
      if (isPlainObject(lastThinkingVariables)) {
        Object.assign(variables, cloneDeep(lastThinkingVariables))
      }
    }

    if (isPlainObject(lastIteration?.variables)) {
      Object.assign(variables, cloneDeep(lastIteration?.variables ?? {}))
    }

    return variables
  }

  private async _getIterationMessages(parameters: IterationParameters): Promise<LLMzPrompts.Message[]> {
    const lastIteration = this.iterations.at(-1)

    if (this.snapshot?.status.type === 'resolved') {
      return [
        await this.version.getSystemMessage({
          globalTools: parameters.tools,
          objects: parameters.objects,
          instructions: parameters.instructions,
          transcript: parameters.transcript,
          exits: parameters.exits,
          components: parameters.components,
        }),
        this.version.getSnapshotResolvedMessage({
          snapshot: this.snapshot,
        }),
      ]
    }

    if (this.snapshot?.status.type === 'rejected') {
      return [
        await this.version.getSystemMessage({
          globalTools: parameters.tools,
          objects: parameters.objects,
          instructions: parameters.instructions,
          transcript: parameters.transcript,
          exits: parameters.exits,
          components: parameters.components,
        }),
        this.version.getSnapshotRejectedMessage({
          snapshot: this.snapshot,
        }),
      ]
    }

    // TODO: truncate messages when too many / too long...
    // this can't work with loop = 100 for example
    // so we need to summarize the messages / situation and variables as we go
    // probably we need to check if max tokens is 75% reached and then summarize messages and variables if needed

    if (!lastIteration) {
      return [
        await this.version.getSystemMessage({
          globalTools: parameters.tools,
          objects: parameters.objects,
          instructions: parameters.instructions,
          transcript: parameters.transcript,
          exits: parameters.exits,
          components: parameters.components,
        }),
        await this.version.getInitialUserMessage({
          globalTools: parameters.tools,
          objects: parameters.objects,
          instructions: parameters.instructions,
          transcript: parameters.transcript,
          exits: parameters.exits,
          components: parameters.components,
        }),
      ]
    }

    const lastIterationMessages = [
      await this.version.getSystemMessage({
        globalTools: parameters.tools,
        objects: parameters.objects,
        instructions: parameters.instructions,
        transcript: parameters.transcript,
        exits: parameters.exits,
        components: parameters.components,
      }),
      ...lastIteration.messages.filter((x) => x.role !== 'system'),
    ]

    if (lastIteration?.status.type === 'thinking_requested') {
      return [
        ...lastIterationMessages,
        {
          role: 'assistant',
          content: wrapContent(lastIteration.llm?.output ?? '', { preserve: 'top', flex: 4, minTokens: 25 }),
        },
        await this.version.getThinkingMessage({
          reason: lastIteration.status.thinking_requested.reason,
          variables: lastIteration.status.thinking_requested.variables,
        }),
      ]
    }

    if (lastIteration?.status.type === 'exit_error') {
      return [
        ...lastIterationMessages,
        {
          role: 'assistant',
          content: wrapContent(lastIteration.llm?.output ?? '', { preserve: 'top', flex: 4, minTokens: 25 }),
        },
        await this.version.getInvalidCodeMessage({
          code: lastIteration.code ?? '// No code generated',
          message: `Invalid return statement (action: ${lastIteration.status.exit_error.exit}): ${lastIteration.status.exit_error.message}`,
        }),
      ]
    }

    if (lastIteration?.status.type === 'invalid_code_error') {
      return [
        ...lastIterationMessages,
        {
          role: 'assistant',
          content: wrapContent(lastIteration.llm?.output ?? '', { preserve: 'top', flex: 4, minTokens: 25 }),
        },
        await this.version.getInvalidCodeMessage({
          code: lastIteration.code ?? '// No code generated',
          message: lastIteration.status.invalid_code_error.message,
        }),
      ]
    }

    if (lastIteration?.status.type === 'execution_error') {
      return [
        ...lastIterationMessages,
        {
          role: 'assistant',
          content: wrapContent(lastIteration.llm?.output ?? '', { preserve: 'top', flex: 4, minTokens: 25 }),
        },
        await this.version.getCodeExecutionErrorMessage({
          message: lastIteration.status.execution_error.message,
          stacktrace: lastIteration.status.execution_error.stack,
        }),
      ]
    }

    throw new Error(
      `Unexpected iteration status: ${lastIteration?.status.type}. This is likely a bug, please report it.`
    )
  }

  private async _refreshIterationParameters(): Promise<IterationParameters> {
    const instructions = await getValue(this.instructions, this)
    const transcript = new TranscriptArray(await getValue(this.chat?.transcript ?? [], this))
    const tools = Tool.withUniqueNames((await getValue(this.tools, this)) ?? [])
    const objects = (await getValue(this.objects, this)) ?? []
    const exits = (await getValue(this.exits, this)) ?? []
    const components = await getValue(this.chat?.components ?? [], this)

    if (objects && objects.length > 100) {
      throw new Error('Too many objects. Expected at most 100 objects.')
    }

    if (tools && tools.length > 100) {
      throw new Error('Too many tools. Expected at most 100 tools.')
    }

    for (const component of components) {
      assertValidComponent(component.definition)
    }

    const ReservedToolNames = [
      'think',
      'listen',
      'return',
      'exit',
      'action',
      'function',
      'callback',
      'code',
      'execute',
      'jsx',
      'object',
      'string',
      'number',
      'boolean',
      'array',
    ]

    const MessageTool =
      this.chat && components.length
        ? new Tool({
            name: 'Message',
            description: 'Send a message to the user',
            aliases: Array.from(
              new Set(['message', ...components.flatMap((x) => [x.definition.name, ...(x.definition.aliases ?? [])])])
            ),
            handler: async (message) => await this.chat?.handler?.(message as RenderedComponent),
          })
        : null

    const allTools = MessageTool ? [MessageTool, ...tools] : tools

    for (const tool of tools) {
      for (let name of [...tool.aliases, tool.name]) {
        name = name.toLowerCase()

        if (ReservedToolNames.includes(name)) {
          throw new Error(`Tool name "${name}" (${tool.name}) is reserved. Please choose a different name.`)
        }

        if (
          components.find(
            (x) =>
              x.definition.name.toLowerCase() === name ||
              x.definition.aliases?.map((x) => x.toLowerCase()).includes(name)
          )
        ) {
          throw new Error(
            `Tool name "${name}" (${tool.name}) is already used by a component. Please choose a different name.`
          )
        }

        if (
          exits.find((x) => x.name.toLowerCase() === name) ||
          exits.find((x) => x.aliases?.map((x) => x.toLowerCase()).includes(name))
        ) {
          throw new Error(
            `Tool name "${name}" (${tool.name}) is already used by an exit. Please choose a different name.`
          )
        }
      }
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

    if (!components.length && !exits.length) {
      exits.push(DefaultExit)
    }

    return {
      transcript,
      tools: allTools,
      objects,
      exits,
      instructions,
      components,
    }
  }

  public constructor(props: {
    chat?: Chat
    instructions?: ValueOrGetter<string, Context>
    objects?: ValueOrGetter<ObjectInstance[], Context>
    tools?: ValueOrGetter<Tool[], Context>
    exits?: ValueOrGetter<Exit[], Context>
    loop?: number
    temperature?: number
    model?: Model
    metadata?: Record<string, any>
    snapshot?: Snapshot
    timeout?: number
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
    this.model = props.model
    this.iterations = []
    this.metadata = props.metadata ?? {}
    this.snapshot = props.snapshot

    if (this.loop < 1 || this.loop > 100) {
      throw new Error('Invalid loop. Expected a number between 1 and 100.')
    }

    if (this.temperature < 0 || this.temperature > 2) {
      throw new Error('Invalid temperature. Expected a number between 0 and 2.')
    }
  }

  public toJSON() {
    return {
      id: this.id,
      iterations: this.iterations.map((iteration) => iteration.toJSON()),
      iteration: this.iteration,
      timeout: this.timeout,
      loop: this.loop,
      temperature: this.temperature,
      model: this.model,
      metadata: this.metadata,
      snapshot: this.snapshot?.toJSON(),
    } satisfies Context.JSON
  }
}
