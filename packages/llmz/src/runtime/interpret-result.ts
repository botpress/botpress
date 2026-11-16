import { omit } from 'lodash-es'
import { hasTopLevelReturn } from '../compiler/index.js'
import { Iteration } from '../context.js'
import { CodeExecutionError, InvalidCodeError, SnapshotSignal, ThinkSignal } from '../errors.js'
import { parseExit } from '../exit-parser.js'
import { exceedsResultBudget, getToolCalls, pickResultVariable } from '../prompts/result-budget.js'
import { cleanStackTrace } from '../stack-traces.js'
import { VMExecutionResult } from '../types.js'
import { getErrorMessage } from '../utils.js'
import { ExecutionHooks } from './types.js'

/** An object that only repeats the call's own input plus yes/no flags, as write tools return to confirm what they did */
const isConfirmation = ({ input, output }: { input: unknown; output: unknown }): boolean => {
  if (typeof output !== 'object' || output === null || Array.isArray(output)) {
    return false
  }
  const inputValues = typeof input === 'object' && input !== null ? Object.values(input) : []
  return Object.values(output).every(
    (value) => value === null || typeof value === 'boolean' || inputValues.includes(value)
  )
}

type InterpretVMResultProps = {
  iteration: Iteration
  result: VMExecutionResult
  controller: AbortController
  startedAt: number
  onExit?: ExecutionHooks['onExit']
  /** Variables llmz created earlier in this run to hold too-large results; it may reuse them */
  savedResultVariables?: readonly string[]
  /** False on the last iteration, where a held-back exit could never be emitted again */
  canDeferExit?: boolean
  /** Largest code result shown to the model, in characters */
  maxResultChars?: number
}

export const interpretVMResult = async ({
  iteration,
  result,
  controller,
  startedAt,
  onExit,
  savedResultVariables = [],
  canDeferExit = false,
  maxResultChars,
}: InterpretVMResultProps) => {
  // Preserve locals independently of the returned value. Returning a scalar
  // (or failing after a successful call) must not erase variables needed later.
  Object.assign(
    iteration.variables,
    Object.fromEntries(Object.entries(result.variables ?? {}).filter(([, value]) => value !== '[[non-primitive]]'))
  )

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
        interrupted: true,
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
  // code (no top-level `return` statement) may be combined with a final ■next.
  const codeRequestsInspection = hasTopLevelReturn(iteration.code ?? '')

  // Exit fields written before a tool returned data were guessed without seeing it: hold the exit back
  // so the model checks them against the results, unless no further response is possible.
  // A write's confirmation (like `{ source, destination, moved: true }`) adds nothing new, so it doesn't count as data.
  const exitWrittenBeforeData =
    canDeferExit &&
    !!iteration.next &&
    Object.keys(iteration.next.props).length > 0 &&
    iteration.traces.some(
      (trace) =>
        trace.type === 'tool_call' &&
        trace.success &&
        trace.output !== undefined &&
        !(trace.output instanceof ThinkSignal) &&
        !isConfirmation(trace)
    )

  if (iteration.next && !codeRequestsInspection && !exitWrittenBeforeData) {
    await applyNextExit({ iteration, controller, onExit })
    return
  }

  const localVariables = Object.fromEntries(
    Object.entries(result.variables ?? {}).filter(([, value]) => value !== '[[non-primitive]]')
  )

  const reserved = [
    ...iteration.tools.flatMap((tool) => [tool.name, ...(tool.aliases ?? [])]),
    ...iteration.objects.map((object) => object.name),
  ]

  // A returned value too large to show stays readable by the next code run instead of being lost.
  const fullValueVariable =
    returnValue !== undefined && exceedsResultBudget(returnValue, { fullPreviewHeader: true }, maxResultChars)
      ? pickResultVariable({ variables: iteration.variables, saved: savedResultVariables, reserved })
      : undefined
  if (fullValueVariable) {
    iteration.variables[fullValueVariable] = returnValue
  }

  const heldExit = iteration.next && !codeRequestsInspection ? iteration.next.name : undefined

  // A held exit is checked against tool output previews; outputs the code never assigned stay readable in full.
  const toolCallsVariable = heldExit
    ? pickResultVariable({
        variables: iteration.variables,
        saved: savedResultVariables,
        reserved: fullValueVariable ? [...reserved, fullValueVariable] : reserved,
      })
    : undefined
  if (toolCallsVariable) {
    iteration.variables[toolCallsVariable] = getToolCalls(iteration)
  }
  const ownVariables = [
    ...savedResultVariables,
    ...[fullValueVariable, toolCallsVariable].filter((name) => name !== undefined),
  ]

  iteration.end({
    type: 'thinking_requested',
    thinking_requested: {
      reason: !iteration.next
        ? 'Code execution completed'
        : codeRequestsInspection
          ? `Code execution completed. The ■next=${iteration.next.name} exit was NOT applied because your code returns a value — inspect it below, then end your next response with ■next.`
          : `Code execution completed. The ■next=${iteration.next.name} exit was NOT applied because its fields were written before this code ran. Verify each field against the tool results below, correct anything wrong or missing, then end your next response with ■next.`,
      variables:
        returnValue !== undefined
          ? returnValue
          : Object.keys(localVariables).length
            ? localVariables
            : omit(iteration.variables, ownVariables),
      ...(fullValueVariable ? { fullValueVariable } : {}),
      ...(heldExit ? { heldExit, toolCallsVariable } : {}),
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
  controller,
  onExit,
}: {
  iteration: Iteration
  controller: AbortController
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
    const details = parsedExit.validationErrors?.join('; ')
    const error = [parsedExit.error.split('\n')[0], details].filter(Boolean).join('. ')

    iteration.end({
      type: 'exit_error',
      exit_error: {
        exit: next.name,
        message: `${error}. Received props: ${JSON.stringify(next.props)}. Choose an exit from <exits> and supply its required props as ONE JSON object on the SAME LINE as ■next=${next.name}. Do not use a JavaScript return statement or wrap the fields in "value" or "props".`,
        return_value: returnValue,
      },
    })
    return
  }

  const returnExit = parsedExit.exit

  try {
    await onExit?.(
      {
        exit: returnExit,
        result: parsedExit.value,
      },
      controller
    )
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
