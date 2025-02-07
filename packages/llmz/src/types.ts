import { type Context } from './context.js'
import { type VMInterruptSignal } from './errors.js'
import { type ThinkSignal, type VMSignal } from './errors.js'
import { type OAI } from './openai.js'
import { type Snapshot } from './snapshots.js'

export namespace Traces {
  export type Comment = TraceTemplate<
    'comment',
    {
      comment: string
      line: number
    }
  >

  export type Log = TraceTemplate<
    'log',
    {
      message: string
      args: any[]
    }
  >

  export type ToolCall = TraceTemplate<
    'tool_call',
    | {
        success: true
        tool_name: string
        object?: string
        input: any
        output: any
        ended_at: number
      }
    | {
        success: false
        tool_name: string
        object?: string
        input: any
        error: any
        ended_at: number
      }
  >

  export type ToolSlow = TraceTemplate<
    'tool_slow',
    { tool_name: string; object?: string; input: any; duration: number }
  >

  export type ListenSignal = TraceTemplate<
    'listen_signal',
    {
      line: number
    }
  >

  export type ThinkSignal = TraceTemplate<
    'think_signal',
    {
      line: number
    }
  >

  export type ChainOfThought = TraceTemplate<
    'chain_of_thought',
    {
      thought: string
    }
  >

  export type ExecuteSignal = TraceTemplate<
    'execute_signal',
    {
      line: number
    }
  >

  export type PropertyMutation = TraceTemplate<
    'property',
    {
      object: string
      property: string
      value: any
    }
  >

  export type CodeExecution = TraceTemplate<
    'code_execution',
    {
      lines_executed: [number, number][]
    }
  >

  export type CodeExecutionException = TraceTemplate<
    'code_execution_exception',
    {
      position: [number, number]
      message: string
      stackTrace: string
    }
  >

  export type Introspection = TraceTemplate<'introspection', { title: string; content: string }>
  export type LLMCallTrace = TraceTemplate<'llm_call', { status: 'success' | 'error'; model: string }>
  export type AbortTrace = TraceTemplate<'abort_signal', { reason: string }>
  export type MessageTrace = TraceTemplate<
    'send_message', // TODO: fixme, doesn't belong here
    { message: { type: string } & any; level: 'info' | 'error' | 'success' | 'prompt' }
  >
  export type YieldTrace = TraceTemplate<'yield', { value: any }>
  export type ReturnTrace = TraceTemplate<'return', { value: any }>
  export type InvalidCodeExceptionTrace = TraceTemplate<'invalid_code_exception', { message: string; code: string }>

  export type TraceTemplate<Type, Content> = { type: Type; started_at: number; ended_at?: number } & Content

  export type Trace =
    | Comment
    | Log
    | ToolCall
    | ToolSlow
    | ListenSignal
    | PropertyMutation
    | MessageTrace
    | YieldTrace
    | ReturnTrace
    | Introspection
    | LLMCallTrace
    | ThinkSignal
    | CodeExecution
    | CodeExecutionException
    | InvalidCodeExceptionTrace
    | ExecuteSignal
    | AbortTrace
}

export type Trace = Traces.Trace
export type VMExecutionResult =
  | {
      success: true
      variables: { [k: string]: any }
      signal?: VMSignal
      error?: Error
      traces: Trace[]
      lines_executed: [number, number][]
      return_value?: any
    }
  | {
      success: false
      variables: { [k: string]: any }
      signal?: VMSignal
      error: Error
      traces: Trace[]
      lines_executed: [number, number][]
    }

export type ObjectMutation = {
  object: string
  property: string
  before: any
  after: any
}

export type Iteration = {
  id: string
  messages: OAI.Message[]
  message?: string
  code?: string
  traces: Trace[]
  mutations: ObjectMutation[]
  variables: Record<string, any>
  llm: {
    started_at: number
    ended_at: number
    status: 'success' | 'error'
    cached: boolean
    tokens: number
    spend: number
    output: string
    model: string
  }
  started_ts: number
  ended_ts: number
} & (
  | {
      status: 'success'
      signal?: VMSignal
      return_value?: any
    }
  | {
      status: 'partial'
      signal: ThinkSignal
    }
  | {
      status: 'error'
      error: Error
    }
)

export type SuccessExecutionResult = {
  status: 'success'
  iterations: Iteration[]
  context: Context
}

export type PartialExecutionResult = {
  status: 'interrupted'
  iterations: Iteration[]
  context: Context
  signal: VMInterruptSignal
  snapshot: Snapshot
}

export type ErrorExecutionResult = {
  status: 'error'
  iterations: Iteration[]
  context: Context
  error: Error
}

export type ExecutionResult = SuccessExecutionResult | PartialExecutionResult | ErrorExecutionResult

export function expectStatus<T extends ExecutionResult['status']>(
  execution: ExecutionResult,
  status: T
): asserts execution is Extract<ExecutionResult, { status: T }> {
  if (status !== execution.status) {
    if (execution.status === 'error') {
      throw new Error(`Expected status "${status}" but got error: ${execution.error}`)
    }

    throw new Error(`Expected status "${status}" but got "${execution.status}"`)
  }
}

export type Tool = {
  name: string
  aliases?: string[]
  description?: string
  input?: unknown
  output?: unknown
  metadata?: Record<string, any>
}

export type ObjProperty = { name: string; description?: string; type?: string; value?: unknown; writable?: boolean }
export type Obj = { name: string; description: string; properties: ObjProperty[]; tools: Tool[] }

export type CreateContext = {
  id: `llmz_${string}`
  instructions?: string
  objects: Obj[]
  tools: Tool[]
  loop: number
  temperature: number
  model: string
  transcript: OAI.Message[]
}
