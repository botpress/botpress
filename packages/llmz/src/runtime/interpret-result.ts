import { isPlainObject, omit } from 'lodash-es'

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

  let returnValue: { action: string; value?: unknown } | null =
    result.success && result.return_value ? result.return_value : null

  const returnAction = returnValue?.action

  if (returnAction === 'think') {
    const variables = omit(returnValue ?? {}, 'action')
    if (isPlainObject(variables) && Object.keys(variables).length > 0) {
      iteration.end({
        type: 'thinking_requested',
        thinking_requested: {
          variables,
          reason: 'Thinking requested',
        },
      })
      return
    }

    iteration.end({
      type: 'thinking_requested',
      thinking_requested: {
        reason: 'Thinking requested',
        variables: iteration.variables,
      },
    })
    return
  }

  const parsedExit = parseExit(returnValue, iteration.exits)

  if (!parsedExit.success) {
    iteration.end({
      type: 'exit_error',
      exit_error: {
        exit: returnValue?.action ?? 'n/a',
        message: parsedExit.error,
        return_value: returnValue,
      },
    })
    return
  }

  const returnExit = parsedExit.exit
  returnValue = { action: returnExit.name, value: parsedExit.value }

  try {
    await onExit?.({
      exit: returnExit,
      result: returnValue?.value,
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
      return_value: returnValue?.value,
    },
  })
  return
}
