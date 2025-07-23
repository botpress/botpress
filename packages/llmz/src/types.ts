import { type VMSignal } from './errors.js'

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
        tool_call_id: string
        object?: string
        input: any
        output: any
        ended_at: number
      }
    | {
        success: false
        tool_name: string
        tool_call_id: string
        object?: string
        input: any
        error: any
        ended_at: number
      }
  >

  export type ToolSlow = TraceTemplate<
    'tool_slow',
    { tool_name: string; object?: string; tool_call_id: string; input: any; duration: number }
  >

  export type ThinkSignal = TraceTemplate<
    'think_signal',
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

  export type LLMCallStart = TraceTemplate<'llm_call_started', { model: string }>
  export type LLMCallSuccess = TraceTemplate<'llm_call_success', { model: string; code: string }>

  export type AbortTrace = TraceTemplate<'abort_signal', { reason: string }>
  export type YieldTrace = TraceTemplate<'yield', { value: any }>
  export type InvalidCodeExceptionTrace = TraceTemplate<'invalid_code_exception', { message: string; code: string }>

  export type TraceTemplate<Type, Content> = { type: Type; started_at: number; ended_at?: number } & Content

  export type Trace =
    | Comment
    | Log
    | ToolCall
    | ToolSlow
    | PropertyMutation
    | YieldTrace
    | LLMCallStart
    | LLMCallSuccess
    | ThinkSignal
    | CodeExecution
    | CodeExecutionException
    | InvalidCodeExceptionTrace
    | AbortTrace
}

export type Trace = Traces.Trace
export type VMExecutionResult =
  | {
      success: true
      variables: { [k: string]: any }
      signal?: VMSignal
      error?: Error
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

export type ZuiType<Output = any, Input = Output> = {
  readonly __type__: 'ZuiType'
  readonly _output: Output
  readonly _input: Input
}

export interface Serializable<J = unknown> {
  toJSON(): J
}
