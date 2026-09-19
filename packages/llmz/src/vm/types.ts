import type { SourceMapConsumer } from 'source-map-js'
import type { CompiledCode } from '../compiler/index.js'
import type { SnapshotSignal, VMSignal } from '../errors.js'
import type { Trace, VMExecutionResult } from '../types.js'

/** Host-only lifecycle hook; symbols are not copied into the generated program's globals. */
export const VM_PROGRAM_COMPLETE = Symbol('llmz.programComplete')
export const VM_TERMINATION = Symbol('llmz.termination')

export type VMTermination = {
  isTerminated(): boolean
  check(): void
  /** Host-owned signal; guest errors are never used to select a latched interruption. */
  getSignal?(): VMSignal | undefined
}

export type VMContext = Record<string, any> & {
  [VM_PROGRAM_COMPLETE]?: () => void
  [VM_TERMINATION]?: VMTermination
}
export type DriverExecutionContext = {
  transformed: CompiledCode
  memoryNames: string[]
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
