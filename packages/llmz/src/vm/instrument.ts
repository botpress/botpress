import type { SourceMapConsumer } from 'source-map-js'
import { type CompiledCode, Identifiers } from '../compiler/index.js'
import { USER_CODE_START_MARKER } from '../compiler/plugins/async-wrapper.js'
import { TerminationCheckpointIdentifier, TerminationGuardIdentifier } from '../compiler/plugins/termination.js'

const USER_CODE_MARKER_TAG_START = '__LLMZ_USER_CODE_START__'
const USER_CODE_MARKER_TAG_END = '__LLMZ_USER_CODE_END__'
import { Signals, SnapshotSignal } from '../errors.js'
import { cloneMemoryValue, type VariableWrite } from '../memory.js'
import type { Trace, VMExecutionResult } from '../types.js'
import { VM_TERMINATION, type VMContext } from './types.js'
// Internal identifiers injected by the compiler — excluded from variable tracking
export const NO_TRACKING = [
  Identifiers.CommentFnIdentifier,
  Identifiers.ToolCallTrackerFnIdentifier,
  Identifiers.ToolTrackerRetIdentifier,
  Identifiers.VariableTrackingFnIdentifier,
  Identifiers.ConsoleObjIdentifier,
  TerminationCheckpointIdentifier,
  TerminationGuardIdentifier,
] as const
export type InstrumentationState = {
  currentToolCall: SnapshotSignal['toolCall'] | undefined
  memoryNames: Set<string>
  variableWrites: VariableWrite[]
  captureErrors: {
    name: string
    reason: string
  }[]
}

// Injects tracking functions (comments, lines, variables, tools, console) into the context.
// Shared by both QuickJS and Node drivers.
export function instrumentContext(
  context: VMContext,
  transformed: CompiledCode,
  traces: Trace[],
  variables: Record<string, any>,
  lines_executed: Map<number, number>,
  consumer: SourceMapConsumer,
  userCodeStartLine: number,
  memoryNames: string[] = []
): InstrumentationState {
  const state: InstrumentationState = {
    currentToolCall: undefined,
    memoryNames: new Set([...memoryNames, ...transformed.variables]),
    variableWrites: [],
    captureErrors: [],
  }
  context[TerminationGuardIdentifier] = () => context[VM_TERMINATION]?.check()
  context[TerminationCheckpointIdentifier] = (value: unknown) => {
    if (value instanceof Promise) {
      // Observe detached async continuations without changing the promise the
      // program sees. Their terminal rejection must not escape the host process.
      void Promise.prototype.then.call(value, undefined, () => {})
    }

    context[VM_TERMINATION]?.check()
    return value
  }
  context[Identifiers.CommentFnIdentifier] = (comment: string, line: number) => {
    if (comment.includes(USER_CODE_MARKER_TAG_START) || comment.includes(USER_CODE_MARKER_TAG_END)) {
      return
    }

    traces.push({
      type: 'comment',
      comment,
      line,
      started_at: Date.now(),
    })
  }
  context[Identifiers.LineTrackingFnIdentifier] = (line: number) => {
    const originalLine = consumer.originalPositionFor({
      line,
      column: 0,
    })
    const mappedLine = originalLine.line ?? line
    const userCodeLine = Math.max(1, mappedLine - userCodeStartLine)
    lines_executed.set(userCodeLine, (lines_executed.get(userCodeLine) ?? 0) + 1)
  }
  context[Identifiers.VariableTrackingFnIdentifier] = (
    name: string,
    getter: () => any,
    result?: unknown,
    kind: 'assignment' | 'mutation' | 'initialize' | 'read' = 'assignment'
  ) => {
    if (NO_TRACKING.includes(name) || !state.memoryNames.has(name)) {
      return result
    }

    if (kind !== 'initialize' && kind !== 'read') {
      state.variableWrites.push({
        name,
        timestamp: Date.now(),
        kind,
      })
    }

    variables[name] = () => {
      try {
        return getter()
      } catch (err) {
        if (!state.captureErrors.some((entry) => entry.name === name)) {
          state.captureErrors.push({
            name,
            reason: err instanceof Error ? err.message : String(err),
          })
        }

        return undefined
      }
    }
    return result
  }
  context[Identifiers.ToolCallTrackerFnIdentifier] = (
    callId: number,
    type: 'start' | 'end',
    outputOrError?: Error,
    awaited = false
  ) => {
    const temp = Signals.maybeDeserializeError(outputOrError?.message)
    if (type !== 'end' || !(temp instanceof SnapshotSignal) || !temp.toolCall || state.currentToolCall) {
      return
    }

    const interrupted = context[VM_TERMINATION]?.getSignal?.()
    if (interrupted && interrupted.toolCall?.id !== temp.toolCall.id) {
      return
    }

    state.currentToolCall = {
      ...temp.toolCall,
      assignment: awaited ? transformed.toolCalls.get(callId)?.assignment : undefined,
    }
  }
  context[Identifiers.ConsoleObjIdentifier] = {
    log: (...args: any[]) => {
      const message = args.shift()
      traces.push({
        type: 'log',
        message,
        args,
        started_at: Date.now(),
      })
    },
  }
  return state
}

// Locates the __LLMZ_USER_CODE_START__ marker to calculate line offsets for stack traces
export function findUserCodeStartLine(transformed: CompiledCode): number {
  const codeWithMarkers = transformed.codeWithMarkers || transformed.code
  const markerLines = codeWithMarkers.split('\n')
  for (let i = 0; i < markerLines.length; i++) {
    if (markerLines[i]?.includes(USER_CODE_START_MARKER)) {
      return i + 1
    }
  }

  return -1
}

/** Drop unsupported captures explicitly instead of presenting lossy placeholders as data. */
export function finalizeMemoryCapture(result: VMExecutionResult, state: InstrumentationState): VMExecutionResult {
  for (const [name, value] of Object.entries(result.variables)) {
    try {
      result.variables[name] = cloneMemoryValue(value)
    } catch (err) {
      if (!state.captureErrors.some((entry) => entry.name === name)) {
        state.captureErrors.push({
          name,
          reason: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  for (const failure of state.captureErrors) {
    delete result.variables[failure.name]
    if (result.signal?.variables) {
      delete result.signal.variables[failure.name]
    }
  }

  if (result.success && !result.signal) {
    try {
      result.return_value = cloneMemoryValue(result.return_value)
    } catch (err) {
      if (!state.captureErrors.some((entry) => entry.name === '$return')) {
        state.captureErrors.push({
          name: '$return',
          reason: err instanceof Error ? err.message : String(err),
        })
      }

      result.return_value = undefined
    }
  }

  return {
    ...result,
    variableWrites: state.variableWrites,
    captureErrors: state.captureErrors,
  }
}
