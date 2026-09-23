import ms from 'ms'
import { ulid } from 'ulid'

import { Iteration } from '../context.js'
import { callHook } from '../errors/hooks.js'
import { HookError, isLLMzError, ThinkSignal, ToolExecutionError } from '../errors.js'
import { snapshotInspectionValue } from '../inspection.js'

import { type Tool } from '../tool.js'
import { isTruncated, unwrapTruncated, type TruncationPolicy } from '../truncate.js'
import type { ForcedInspection } from './forced-inspection.js'
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
  onThink?: (inspection: ForcedInspection) => void
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
  onThink,
}: ToolWrapperProps) {
  return async function (input: any, line?: number) {
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
    const inspections: ForcedInspection[] = []

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

    const unwrapSignal = (value: unknown): unknown => {
      if (!ThinkSignal.is(value)) {
        return value
      }

      const context = value.context
      const output = unwrapTruncated(context)
      if (isTruncated(context)) {
        onTruncation?.(output, context.$$truncate)
      }

      const inspection: ForcedInspection = {
        tool: object ? `${object}.${tool.name}` : tool.name,
        toolCallId,
        line,
        reason: value.reason,
        value: output,
        metadata: value.metadata,
      }
      inspections.push(inspection)
      return output
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

      if (ThinkSignal.is(beforeRes)) {
        throw new HookError(
          'Tool hooks cannot request inspection with ThinkSignal. Return it from the tool handler instead.'
        )
      }

      if (typeof beforeRes?.input !== 'undefined') {
        effectiveInput = beforeRes.input
      }

      // A policy hook may cancel by aborting rather than throwing. Do not start
      // an irreversible business action after that cancellation was accepted.
      controller.signal.throwIfAborted()

      try {
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
      } catch (error) {
        if (!ThinkSignal.is(error)) {
          throw error
        }

        output = error
      }

      output = unwrapSignal(output)

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

      if (ThinkSignal.is(afterRes) || ThinkSignal.is(afterRes?.output)) {
        throw new HookError(
          'Tool hooks cannot request inspection with ThinkSignal. Return it from the tool handler instead.'
        )
      }

      if (typeof afterRes?.output !== 'undefined') {
        output = afterRes.output
      }

      controller.signal.throwIfAborted()
    } catch (err) {
      success = false
      // A rejected output must not reach guest memory, traces, or forced inspection.
      output = undefined
      if (ThinkSignal.is(err)) {
        error = new HookError(
          'Tool hooks cannot request inspection with ThinkSignal. Return it from the tool handler instead.'
        )
      } else {
        error = isLLMzError(err) ? err : new ToolExecutionError(tool.name, err)
      }

      iteration.recordError(error)
    } finally {
      clearTimeout(alertSlowTool)
      for (const inspection of success ? inspections : []) {
        // Hooks may redact or replace a successful result. Inspect the effective
        // value, and snapshot it before guest code can mutate the returned object.
        const value = snapshotInspectionValue(output)
        onThink?.({ ...inspection, value })
        iteration.recordTrace({
          type: 'think_signal',
          started_at: Date.now(),
          ended_at: Date.now(),
          line: line ?? 0,
          tool_name: tool.name,
          tool_call_id: toolCallId,
          object,
          reason: inspection.reason,
          context: value,
          metadata: inspection.metadata,
        })
      }

      pushToolCallTrace()
    }

    if (!success) {
      throw error
    }

    onResult?.(output)
    return output
  }
}
