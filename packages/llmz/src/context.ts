import { type Cognitive } from '@botpress/cognitive'
import { cloneDeep, isPlainObject } from 'lodash-es'
import { ulid } from 'ulid'
import { LoopExceededError } from './errors.js'
import { Exit } from './exit.js'
import { getValue, ValueOrGetter } from './getter.js'
import { HookedArray } from './handlers.js'
import { ObjectInstance } from './objects.js'
import type { OAI } from './openai.js'
import { DualModePrompt } from './prompts/dual-modes.js'
import { Prompt } from './prompts/prompt.js'
import { SnapshotResult } from './snapshots.js'
import { Tool } from './tool.js'
import { TranscriptArray, TranscriptMessage } from './transcript.js'
import { wrapContent } from './truncator.js'
import { ObjectMutation, Trace } from './types.js'

type Model = Parameters<InstanceType<typeof Cognitive>['generateContent']>[0]['model']

export type IterationParameters = {
  transcript: TranscriptArray
  tools: Tool[]
  objects: ObjectInstance[]
  exits: Exit[]
  instructions?: string
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
      reason?: string
      stack: string
    }
  }

  export type ExitSuccess = {
    type: 'exit_success'
    exit_success: {
      exit_name: string
      return_value: unknown
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

const ThinkExit = new Exit({
  name: 'think',
  description: 'Think about the current situation and provide a response',
})

const ListenExit = new Exit({
  name: 'listen',
  description: 'Listen to the user and provide a response',
})

export class Iteration {
  public id: string
  public messages: OAI.Message[]
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

  public get isSuccessful() {
    return (<IterationStatus['type'][]>['callback_requested', 'exit_success', 'thinking_requested']).includes(
      this.status.type
    )
  }

  public get isFailed() {
    return (<IterationStatus['type'][]>[
      'generation_error',
      'invalid_code_error',
      'execution_error',
      'exit_error',
      'aborted',
    ]).includes(this.status.type)
  }

  public get isDone() {
    return (<IterationStatus['type'][]>['callback_requested', 'exit_success']).includes(this.status.type)
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

  // TODO: isExitValid() --> check if exit is valid, check if chat mode, then 'listen' is valid
  // TODO:

  public constructor(props: {
    id: string
    parameters: IterationParameters
    messages: OAI.Message[]
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
}

// TODO: toString()
export class Context {
  public id: string

  public transcript?: ValueOrGetter<TranscriptArray, Context>
  public instructions?: ValueOrGetter<string, Context>
  public objects?: ValueOrGetter<ObjectInstance[], Context>
  public tools?: ValueOrGetter<Tool[], Context>
  public exits?: ValueOrGetter<Exit[], Context>

  public appliedSnapshot?: SnapshotResult // TODO: re-implement me correctly

  public version: Prompt = DualModePrompt
  public loop: number
  public temperature: number
  public model?: Model
  public metadata: Record<string, any>

  public iteration: number = 0
  public iterations: Iteration[]

  public async nextIteration(): Promise<Iteration> {
    if (this.iterations.length >= this.loop) {
      throw new LoopExceededError()
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

  private async _getIterationMessages(parameters: IterationParameters): Promise<OAI.Message[]> {
    const lastIteration = this.iterations.at(-1)

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
        }),
        await this.version.getInitialUserMessage({
          globalTools: parameters.tools,
          objects: parameters.objects,
          instructions: parameters.instructions,
          transcript: parameters.transcript,
          exits: parameters.exits,
        }),
      ]
    }

    if (lastIteration?.status.type === 'thinking_requested') {
      return [
        ...lastIteration.messages,
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
        ...lastIteration.messages,
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
        ...lastIteration.messages,
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
        ...lastIteration.messages,
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
    const transcript = new TranscriptArray((await getValue(this.transcript, this)) ?? [])
    const tools = Tool.withUniqueNames((await getValue(this.tools, this)) ?? [])
    const objects = (await getValue(this.objects, this)) ?? []
    const exits = (await getValue(this.exits, this)) ?? []

    if (objects && objects.length > 100) {
      throw new Error('Too many objects. Expected at most 100 objects.')
    }

    if (tools && tools.length > 100) {
      throw new Error('Too many tools. Expected at most 100 tools.')
    }

    if (exits && exits.length > 100) {
      throw new Error('Too many exits. Expected at most 100 exits.')
    }

    if (instructions && instructions.length > 1_000_000) {
      throw new Error('Instructions are too long. Expected at most 1,000,000 characters.')
    }

    if (transcript && transcript.length > 250) {
      throw new Error('Too many transcript messages. Expected at most 250 messages.')
    }

    if (!tools.find((x) => x.name.toLowerCase() === 'message') && exits.length === 0) {
      throw new Error("When no 'message' tool is present, at least one exit is required.")
    }

    return {
      transcript,
      tools,
      objects,
      exits,
      instructions,
    }
  }

  public constructor(props: {
    instructions?: ValueOrGetter<string, Context>
    objects?: ValueOrGetter<ObjectInstance[], Context>
    tools?: ValueOrGetter<Tool[], Context>
    exits?: ValueOrGetter<Exit[], Context>
    transcript?: ValueOrGetter<TranscriptMessage[], Context>
    loop?: number
    temperature?: number
    model?: Model
    metadata?: Record<string, any>
  }) {
    this.id = `llmz_${ulid()}`
    this.transcript = props.transcript
    this.instructions = props.instructions
    this.objects = props.objects
    this.tools = props.tools
    this.exits = props.exits

    this.loop = props.loop ?? 3
    this.temperature = props.temperature ?? 0.7
    this.model = props.model
    this.iterations = []
    this.metadata = props.metadata ?? {}

    if (this.loop < 1 || this.loop > 100) {
      throw new Error('Invalid loop. Expected a number between 1 and 100.')
    }

    if (this.temperature < 0 || this.temperature > 2) {
      throw new Error('Invalid temperature. Expected a number between 0 and 2.')
    }
  }
}
