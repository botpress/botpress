import { isAnyComponent } from '../component.js'
import type { Iteration } from '../context.js'
import { Signals, ThinkSignal } from '../errors.js'
import { inspect } from '../inspect.js'
import type { Traces } from '../types.js'
import { getTokenizer } from '../utils.js'

const MAX_ENTRIES = 20
const PAYLOAD_PREVIEW_TOKENS = 80
const ERROR_PREVIEW_TOKENS = 60
const NAME_PREVIEW_TOKENS = 16

export type ExecutionActivity = {
  calls: Traces.ToolCall[]
  deliveries: Traces.YieldTrace[]
}

type ToolOutcome = 'succeeded' | 'failed' | 'interrupted'

/** Collect recorded operations, excluding ordinary assistant text delivery. */
export function getExecutionActivity(iteration: Iteration): ExecutionActivity {
  const calls = iteration.traces.filter((trace): trace is Traces.ToolCall => trace.type === 'tool_call')
  const deliveries = iteration.traces.filter(
    (trace): trace is Traces.YieldTrace => trace.type === 'yield' && !!trace.message_id
  )

  return { calls, deliveries }
}

export function renderToolCalls(activity: ExecutionActivity, includeRecoveryValues = false): string | undefined {
  if (!activity.calls.length) {
    return undefined
  }

  const lines = activity.calls.slice(0, MAX_ENTRIES).map((call) => {
    const name = call.object ? `${call.object}.${call.tool_name}` : call.tool_name
    const outcome = getToolOutcome(call)
    const input = call.input === undefined ? '' : preview(call.input)
    const details = [`- ${previewName(name)}(${input}): ${outcome}`]

    if (outcome === 'interrupted') {
      const signal = getInterruption(call)!
      const reason = signal.reason

      details.push(`pending; ${errorPreview(reason)}`)
    } else if (!call.success) {
      details.push(`error: ${errorPreview(call.error)}`)
    } else if (includeRecoveryValues) {
      details.push(`returned ${preview(call.output)}`)
    }

    return details.join('; ')
  })

  if (activity.calls.length > lines.length) {
    lines.push(`- ${activity.calls.length - lines.length} additional calls are recorded in the execution traces.`)
  }

  return `Tools called\n${lines.join('\n')}`
}

export function renderMessageDeliveries(
  iteration: Iteration,
  cancelled = iteration.status.type === 'aborted'
): string | undefined {
  const { deliveries } = getExecutionActivity(iteration)

  if (!deliveries.length) {
    return undefined
  }

  const lines = deliveries.slice(0, MAX_ENTRIES).map((delivery) => {
    const outcome = delivery.success === true ? 'delivered' : 'uncertain'
    const details = [`- ${messagePreview(delivery.value)}: ${outcome}`]

    if (delivery.error !== undefined) {
      details.push(`error: ${errorPreview(delivery.error)}`)
    }

    return details.join('; ')
  })

  if (deliveries.length > lines.length) {
    lines.push(`- ${deliveries.length - lines.length} additional deliveries are recorded in the execution traces.`)
  }

  if (deliveries.some((delivery) => delivery.success === false)) {
    lines.push('Messages queued after the failed delivery were skipped.')
  } else if (cancelled) {
    lines.push('Messages still queued when execution was cancelled were skipped.')
  }

  return `Messages sent\n${lines.join('\n')}`
}

function getInterruption(call: Traces.ToolCall): ThinkSignal | undefined {
  if ('output' in call && call.output instanceof ThinkSignal) {
    return call.output
  }

  if (!call.success) {
    const error = Signals.maybeDeserializeError(call.error)

    if (error instanceof ThinkSignal) {
      return error
    }
  }

  return undefined
}

function getToolOutcome(call: Traces.ToolCall): ToolOutcome {
  if (getInterruption(call)) {
    return 'interrupted'
  }

  return call.success ? 'succeeded' : 'failed'
}

function messagePreview(value: unknown): string {
  if (!isAnyComponent(value)) {
    return preview(value)
  }

  return `${previewName(value.name)} ${preview(value.props)}`
}

function preview(value: unknown): string {
  return inspect(value, undefined, { tokens: PAYLOAD_PREVIEW_TOKENS, compact: true, honorTruncation: false })
}

function previewName(value: string): string {
  if (value.length <= NAME_PREVIEW_TOKENS * 8 && getTokenizer().count(value) <= NAME_PREVIEW_TOKENS) {
    return value
  }

  return inspect(value, undefined, { tokens: NAME_PREVIEW_TOKENS, compact: true, honorTruncation: false })
}

function errorPreview(value: unknown): string {
  const error = Signals.maybeDeserializeError(value)
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error')

  return inspect(message.replace(/\s+/g, ' ').trim(), undefined, {
    tokens: ERROR_PREVIEW_TOKENS,
    compact: true,
    honorTruncation: false,
  })
}
