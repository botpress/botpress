import ms from 'ms'
import { ulid } from 'ulid'

import { Iteration } from '../context.js'
import { callHook } from '../errors/hooks.js'
import { isLLMzError, ThinkSignal, ToolExecutionError } from '../errors.js'

import { type Tool } from '../tool.js'
import type { TruncationPolicy } from '../truncate.js'
import { ExecutionHooks } from './types.js'

const SLOW_TOOL_WARNING = ms('15s')

type ToolWrapperProps = {
  tool: Tool
  object?: string
  iteration: Iteration
  beforeHook?: ExecutionHooks['onBeforeTool']
  afterHook?: ExecutionHooks['onAfterTool']
  onTruncation?: (value: unknown, policy: TruncationPolicy) => void
  onResult?: (value: unknown) => void
  controller: AbortController
}

export function wrapTool({
  tool,
  object,
  iteration,
  beforeHook,
  afterHook,
  onTruncation,
  onResult,
  controller,
}: ToolWrapperProps) {
  return async function (input: any) {
    controller.signal.throwIfAborted()
    const toolCallId = `tcall_${ulid()}`
    const originalInput = input
    let reportedInput = originalInput
    let effectiveInput = input

    const alertSlowTool = setTimeout(
      () =>
        iteration.recordTrace({
          type: 'tool_slow',
          tool_name: tool.name,
          tool_call_id: toolCallId,
          started_at: Date.now(),
          input: reportedInput,
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
      iteration.recordTrace({
        type: 'tool_call',
        tool_call_id: toolCallId,
        native_call_id: iteration.nativeCallId,
        started_at: toolStart,
        ended_at: Date.now(),
        tool_name: tool.name,
        object,
        input: reportedInput,
        output,
        error,
        success,
      })
    }

    const handleSignals = async (err: unknown) => {
      if (output === err) {
        return true
      }

      if (ThinkSignal.is(err)) {
        signalToThrow = err
        iteration.recordTrace({
          type: 'think_signal',
          started_at: Date.now(),
          line: 0,
          ended_at: Date.now(),
        })
        success = true
        output = err

        const afterRes = await callHook(() =>
          afterHook?.({
            iteration,
            tool,
            input: originalInput,
            output,
            controller,
            object,
            toolCallId,
            nativeCallId: iteration.nativeCallId,
          })
        )

        if (typeof afterRes?.output !== 'undefined') {
          output = afterRes.output
        }

        return true
      }

      return false
    }

    try {
      const beforeRes = await callHook(() =>
        beforeHook?.({
          iteration,
          tool,
          input: effectiveInput,
          controller,
          object,
          toolCallId,
          nativeCallId: iteration.nativeCallId,
        })
      )

      if (typeof beforeRes?.input !== 'undefined') {
        effectiveInput = beforeRes.input
      }

      // A policy hook may cancel by aborting rather than throwing. Do not start
      // an irreversible business action after that cancellation was accepted.
      controller.signal.throwIfAborted()

      output = await tool.execute(effectiveInput, {
        callId: toolCallId,
        iterationId: iteration.id,
        nativeCallId: iteration.nativeCallId,
        onTruncation,
        onInput: (parsed) => {
          controller.signal.throwIfAborted()
          // Keep the original argument when a hook replaced it; do not rerun
          // its effects just to produce a trace of an argument we never used.
          if (effectiveInput === originalInput) {
            reportedInput = parsed
          }
        },
      })

      const afterRes = await callHook(() =>
        afterHook?.({
          iteration,
          tool,
          input: effectiveInput,
          output,
          controller,
          object,
          toolCallId,
          nativeCallId: iteration.nativeCallId,
        })
      )

      if (typeof afterRes?.output !== 'undefined') {
        output = afterRes.output
      }
    } catch (err) {
      if (!(await handleSignals(err))) {
        success = false
        error = isLLMzError(err) ? err : new ToolExecutionError(tool.name, err)
        iteration.recordError(error)
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

    onResult?.(output)
    return output
  }
}
