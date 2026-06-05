import type { SourceMapConsumer } from 'source-map-js'

import { type CompiledCode, Identifiers } from '../compiler/index.js'
import { USER_CODE_START_MARKER } from '../compiler/plugins/async-iterator.js'

const USER_CODE_MARKER_TAG_START = '__LLMZ_USER_CODE_START__'
const USER_CODE_MARKER_TAG_END = '__LLMZ_USER_CODE_END__'
import { Signals, SnapshotSignal } from '../errors.js'
import { createJsxComponent, JsxComponent } from '../jsx.js'
import type { Trace } from '../types.js'
import { VMContext } from './types.js'

// Internal identifiers injected by the compiler — excluded from variable tracking
export const NO_TRACKING = [
  Identifiers.CommentFnIdentifier,
  Identifiers.ToolCallTrackerFnIdentifier,
  Identifiers.ToolTrackerRetIdentifier,
  Identifiers.VariableTrackingFnIdentifier,
  Identifiers.JSXFnIdentifier,
  Identifiers.ConsoleObjIdentifier,
] as const

export type InstrumentationState = {
  currentToolCall: SnapshotSignal['toolCall'] | undefined
}

// Injects tracking functions (comments, lines, variables, tools, console, yield) into the context.
// Shared by both QuickJS and Node drivers.
export function instrumentContext(
  context: VMContext,
  transformed: CompiledCode,
  traces: Trace[],
  variables: Record<string, any>,
  lines_executed: Map<number, number>,
  consumer: SourceMapConsumer,
  userCodeStartLine: number
): InstrumentationState {
  const state: InstrumentationState = { currentToolCall: undefined }

  context[Identifiers.CommentFnIdentifier] = (comment: string, line: number) => {
    if (comment.includes(USER_CODE_MARKER_TAG_START) || comment.includes(USER_CODE_MARKER_TAG_END)) {
      return
    }
    traces.push({ type: 'comment', comment, line, started_at: Date.now() })
  }

  context[Identifiers.LineTrackingFnIdentifier] = (line: number) => {
    const originalLine = consumer.originalPositionFor({ line, column: 0 })
    const mappedLine = originalLine.line ?? line
    const userCodeLine = Math.max(1, mappedLine - userCodeStartLine)
    lines_executed.set(userCodeLine, (lines_executed.get(userCodeLine) ?? 0) + 1)
  }

  context[Identifiers.JSXFnIdentifier] = (tool: string, props: Object, ...children: any[]) =>
    createJsxComponent({ type: tool, props, children })

  context[Identifiers.VariableTrackingFnIdentifier] = (name: string, getter: () => any) => {
    if (NO_TRACKING.includes(name)) {
      return
    }
    variables[name] = () => {
      try {
        const value = getter()
        if (typeof value === 'function') {
          return '[[non-primitive]]'
        }
        return value
      } catch {
        return '[[non-primitive]]'
      }
    }
  }

  context[Identifiers.ToolCallTrackerFnIdentifier] = (callId: number, type: 'start' | 'end', outputOrError?: Error) => {
    const temp = Signals.maybeDeserializeError(outputOrError?.message)
    if (type === 'end' && temp instanceof SnapshotSignal && temp?.toolCall) {
      state.currentToolCall = {
        ...temp.toolCall,
        assignment: transformed.toolCalls.get(callId)?.assignment,
      }
    }
  }

  context[Identifiers.ConsoleObjIdentifier] = {
    log: (...args: any[]) => {
      const message = args.shift()
      traces.push({ type: 'log', message, args, started_at: Date.now() })
    },
  }

  context[Identifiers.AsyncIterYieldFnIdentifier] = async function (value: JsxComponent) {
    const startedAt = Date.now()
    try {
      if (typeof value.type !== 'string' || value.type.trim().length === 0) {
        throw new Error('A yield statement must yield a valid tool')
      }

      const toolName = Object.keys(context).find((x) => x.toUpperCase() === value.type.toUpperCase())

      if (!toolName) {
        throw new Error(`Yield tool "${value.type}", but tool is not found`)
      }

      await context[toolName](value)
    } finally {
      traces.push({ type: 'yield', value, started_at: startedAt, ended_at: Date.now() })
    }
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
