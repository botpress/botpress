import { Iteration } from '../context.js'
import { CodeExecutionError, InvalidCodeError, SnapshotSignal, ThinkSignal } from '../errors.js'
import { parseExit } from '../exit-parser.js'
import { cleanStackTrace } from '../stack-traces.js'
import { VMExecutionResult } from '../types.js'
import { getErrorMessage } from '../utils.js'
import { ExecutionHooks } from './types.js'

type InterpretVMResultProps = {
  iteration: Iteration
  result: VMExecutionResult
  controller: AbortController
  startedAt: number
  onExit?: ExecutionHooks['onExit']
}

export const interpretVMResult = async ({
  iteration,
  result,
  controller,
  startedAt,
  onExit,
}: InterpretVMResultProps) => {
  if (result.error && result.error instanceof InvalidCodeError) {
    iteration.end({
      type: 'invalid_code_error',
      invalid_code_error: {
        message: result.error.message,
      },
    })
    return
  }

  iteration.traces.push({
    type: 'code_execution',
    lines_executed: result.lines_executed ?? 0,
    started_at: startedAt,
    ended_at: Date.now(),
  })

  if (controller.signal.aborted) {
    iteration.end({
      type: 'aborted',
      aborted: {
        reason: controller.signal.reason ?? 'The operation was aborted',
      },
    })
    return
  }

  if (result.error && result.error instanceof CodeExecutionError) {
    iteration.end({
      type: 'execution_error',
      execution_error: {
        message: result.error.message,
        stack: cleanStackTrace(result.error.stacktrace ?? result.error.stack ?? 'No stack trace available'),
      },
    })
    return
  }

  if (!result.success) {
    iteration.end({
      type: 'execution_error',
      execution_error: {
        message: result?.error?.message ?? 'Unknown error occurred',
        stack: cleanStackTrace(result.error.stack ?? 'No stack trace available'),
      },
    })
    return
  }

  if (result.signal instanceof ThinkSignal) {
    iteration.end({
      type: 'thinking_requested',
      thinking_requested: {
        variables: result.signal.context,
        reason: result.signal.reason,
        metadata: result.signal.metadata,
      },
    })
    return
  }

  if (result.signal instanceof SnapshotSignal) {
    iteration.end({
      type: 'callback_requested',
      callback_requested: {
        signal: result.signal,
      },
    })
    return
  }

  // The code executed successfully.
  const returnValue = result.return_value

  // An explicit `return` in the code means the model wants to inspect the
  // value before continuing — control goes back to it, and any ■next in the
  // same response is ignored. Models often append a premature ■next (both
  // `listen` and final exits) to code whose outcome they cannot know yet;
  // honoring it would end the turn or the task half-done. Side-effect-only
  // code (no `return` keyword) may be combined with a final ■next.
  const codeRequestsInspection = /\breturn\b/.test(iteration.code ?? '')

  if (iteration.next && !codeRequestsInspection) {
    await applyNextExit({ iteration, onExit })
    return
  }

  const localVariables = Object.fromEntries(
    Object.entries(result.variables ?? {}).filter(([, value]) => value !== '[[non-primitive]]')
  )

  iteration.end({
    type: 'thinking_requested',
    thinking_requested: {
      reason: iteration.next
        ? `Code execution completed. The ■next=${iteration.next.name} exit was NOT applied because your code returns a value — inspect it below, then end your next response with ■next.`
        : 'Code execution completed',
      variables:
        returnValue !== undefined
          ? returnValue
          : Object.keys(localVariables).length
            ? localVariables
            : iteration.variables,
    },
  })
}

/**
 * Applies the `■next=<exit>` block of the current iteration: validates the exit
 * name and props against the available exits, runs the onExit hook, and ends
 * the iteration with exit_success or exit_error.
 */
export const applyNextExit = async ({
  iteration,
  onExit,
}: {
  iteration: Iteration
  onExit?: ExecutionHooks['onExit']
}): Promise<void> => {
  const next = iteration.next

  if (!next) {
    throw new Error('applyNextExit called without a ■next block on the iteration')
  }

  const attempt = (props: Record<string, unknown>) =>
    parseExit(Object.keys(props).length ? { action: next.name, value: props } : { action: next.name }, iteration.exits)

  let parsedExit = attempt(next.props)

  // Leniency: models sometimes wrap the exit props in a superfluous single key
  // (e.g. `■next=done {props: {ticketId: "..."}}`). Retry unwrapped when validation fails.
  const keys = Object.keys(next.props)
  if (!parsedExit.success && keys.length === 1 && ['props', 'value', 'data'].includes(keys[0]!)) {
    const inner = next.props[keys[0]!]
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      const unwrapped = attempt(inner as Record<string, unknown>)
      if (unwrapped.success) {
        parsedExit = unwrapped
      }
    }
  }

  const returnValue = { action: next.name, value: parsedExit.success ? parsedExit.value : next.props }

  if (!parsedExit.success) {
    iteration.end({
      type: 'exit_error',
      exit_error: {
        exit: next.name,
        message: parsedExit.error,
        return_value: returnValue,
      },
    })
    return
  }

  const returnExit = parsedExit.exit

  try {
    await onExit?.({
      exit: returnExit,
      result: parsedExit.value,
    })
  } catch (err) {
    iteration.end({
      type: 'exit_error',
      exit_error: {
        exit: returnExit.name,
        message: `Error executing exit ${returnExit.name}: ${getErrorMessage(err)}`,
        return_value: returnValue,
      },
    })
    return
  }

  iteration.end({
    type: 'exit_success',
    exit_success: {
      exit_name: returnExit.name,
      return_value: parsedExit.value,
    },
  })
}
