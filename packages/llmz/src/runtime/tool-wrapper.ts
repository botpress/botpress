import ms from 'ms'
import { ulid } from 'ulid'

import { Chat } from '../chat.js'
import { Iteration } from '../context.js'
import { Signals, SnapshotSignal, ThinkSignal } from '../errors.js'
import { type Tool } from '../tool.js'
import { Trace } from '../types.js'
import { ExecutionHooks } from './types.js'

const SLOW_TOOL_WARNING = ms('15s')

type ToolWrapperProps = {
  chat?: Chat
  tool: Tool
  object?: string
  traces: Trace[]
  iteration: Iteration
  beforeHook?: ExecutionHooks['onBeforeTool']
  afterHook?: ExecutionHooks['onAfterTool']
  controller: AbortController
}

export function wrapTool({
  chat,
  tool,
  traces,
  object,
  iteration,
  beforeHook,
  afterHook,
  controller,
}: ToolWrapperProps) {
  const getToolInput = (input: any) => (tool.zInput as any).safeParse(input).data ?? input

  return async function (input: any) {
    const toolCallId = `tcall_${ulid()}`
    const originalInput = input
    let effectiveInput = input

    const alertSlowTool = setTimeout(
      () =>
        traces.push({
          type: 'tool_slow',
          tool_name: tool.name,
          tool_call_id: toolCallId,
          started_at: Date.now(),
          input: getToolInput(originalInput),
          object,
          duration: SLOW_TOOL_WARNING,
        }),
      SLOW_TOOL_WARNING
    )

    const toolStart = Date.now()
    let output: any
    let error: unknown
    let success = true
    let signalToThrow: ThinkSignal | undefined

    const pushToolCallTrace = () => {
      traces.push({
        type: 'tool_call',
        tool_call_id: toolCallId,
        started_at: toolStart,
        ended_at: Date.now(),
        tool_name: tool.name,
        object,
        input: getToolInput(originalInput),
        output,
        error,
        success,
      })
    }

    const handleSignals = async (err: unknown) => {
      if (output === err) {
        return true
      }

      if (err instanceof SnapshotSignal) {
        err.toolCall = {
          name: tool.name,
          inputSchema: tool.input,
          outputSchema: tool.output,
          input: originalInput,
        }
        err.message = Signals.serializeError(err)
      }

      if (err instanceof ThinkSignal) {
        signalToThrow = err
        traces.push({
          type: 'think_signal',
          started_at: Date.now(),
          line: 0,
          ended_at: Date.now(),
        })
        success = true
        output = err

        const afterRes = await afterHook?.({
          iteration,
          tool,
          input: originalInput,
          output,
          controller,
          object,
          toolCallId,
        })

        if (typeof afterRes?.output !== 'undefined') {
          output = afterRes.output
        }

        return true
      }

      return false
    }

    try {
      const beforeRes = await beforeHook?.({
        iteration,
        tool,
        input: effectiveInput,
        controller,
        object,
        toolCallId,
      })

      if (typeof beforeRes?.input !== 'undefined') {
        effectiveInput = beforeRes.input
      }

      output = await tool.execute(
        effectiveInput,
        {
          callId: toolCallId,
        },
        chat
      )

      const afterRes = await afterHook?.({
        iteration,
        tool,
        input: effectiveInput,
        output,
        controller,
        object,
        toolCallId,
      })

      if (typeof afterRes?.output !== 'undefined') {
        output = afterRes.output
      }
    } catch (err) {
      if (!(await handleSignals(err))) {
        success = false
        error = err
      }
    } finally {
      clearTimeout(alertSlowTool)
      pushToolCallTrace()
    }

    if (!success) {
      throw error
    }

    if (signalToThrow) {
      throw signalToThrow
    }

    return output
  }
}
