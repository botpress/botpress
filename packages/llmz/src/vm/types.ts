import type { SourceMapConsumer } from 'source-map-js'

import type { CompiledCode } from '../compiler/index.js'
import type { SnapshotSignal } from '../errors.js'
import type { Trace, VMExecutionResult } from '../types.js'

export type VMContext = Record<string, any>

export type DriverExecutionContext = {
  transformed: CompiledCode
  consumer: SourceMapConsumer
  context: VMContext
  traces: Trace[]
  signal: AbortSignal | null
  timeout: number
  code: string
  lines_executed: Map<number, number>
  variables: Record<string, any>
  currentToolCall: SnapshotSignal['toolCall'] | undefined
}

// Any execution driver (QuickJS, Node, future drivers) must implement this type
export type VMDriver = {
  execute(ctx: DriverExecutionContext): Promise<VMExecutionResult>
}
