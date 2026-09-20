import { isAnyComponent } from '../component.js'
import type { Iteration } from '../context.js'
import { Signals, ThinkSignal } from '../errors.js'
import { createInspector, type InspectionIdentity, type Inspector } from '../inspection.js'
import type { Traces } from '../types.js'

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

export function renderToolCalls(
  activity: ExecutionActivity,
  includeRecoveryValues = false,
  inspector: Inspector = createInspector(),
  identity: InspectionIdentity = {}
): string | undefined {
  if (!activity.calls.length) {
    return undefined
  }

  const lines = activity.calls.slice(0, MAX_ENTRIES).map((call) => {
    const name = call.object ? `${call.object}.${call.tool_name}` : call.tool_name
    const outcome = getToolOutcome(call)
    const detailsIdentity = { ...identity, tool: call.tool_name, object: call.object }
    const input =
      call.input === undefined
        ? ''
        : inspector(call.input, {
            purpose: 'tool-input',
            maxTokens: PAYLOAD_PREVIEW_TOKENS,
            compact: true,
            identity: detailsIdentity,
          })
    const label = inspector(name, { purpose: 'name', maxTokens: NAME_PREVIEW_TOKENS, identity: detailsIdentity })
    const details = [`- ${label}(${input}): ${outcome}`]

    if (outcome === 'interrupted') {
      const signal = getInterruption(call)!
      const reason = signal.reason

      details.push(`pending; ${errorPreview(reason, inspector, detailsIdentity)}`)
    } else if (!call.success) {
      details.push(`error: ${errorPreview(call.error, inspector, detailsIdentity)}`)
    } else if (includeRecoveryValues) {
      details.push(
        `returned ${inspector(call.output, { purpose: 'tool-output', maxTokens: PAYLOAD_PREVIEW_TOKENS, compact: true, identity: detailsIdentity })}`
      )
    }

    return details.join('; ')
  })

  if (activity.calls.length > lines.length) {
    lines.push(`- ${activity.calls.length - lines.length} additional calls are recorded in the execution traces.`)
  }

  return `Tools called\n${lines.join('\n')}`
}

export function renderMessageDeliveries(
  { deliveries }: ExecutionActivity,
  cancelled = false,
  inspector: Inspector = createInspector(),
  identity: InspectionIdentity = {}
): string | undefined {
  if (!deliveries.length) {
    return undefined
  }

  const lines = deliveries.slice(0, MAX_ENTRIES).map((delivery) => {
    const outcome = delivery.success === true ? 'delivered' : 'uncertain'
    const details = [`- ${messagePreview(delivery.value, inspector, identity)}: ${outcome}`]

    if (delivery.error !== undefined) {
      details.push(`error: ${errorPreview(delivery.error, inspector, identity)}`)
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

function messagePreview(value: unknown, inspector: Inspector, identity: InspectionIdentity): string {
  const component = isAnyComponent(value) ? value : undefined
  const detailsIdentity = component ? { ...identity, component: component.name } : identity
  const body = inspector(component ? component.props : value, {
    purpose: 'message',
    maxTokens: PAYLOAD_PREVIEW_TOKENS,
    compact: true,
    identity: detailsIdentity,
  })

  if (!component) {
    return body
  }

  const name = inspector(component.name, {
    purpose: 'name',
    maxTokens: NAME_PREVIEW_TOKENS,
    identity: detailsIdentity,
  })

  return `${name} ${body}`
}

function errorPreview(value: unknown, inspector: Inspector, identity: InspectionIdentity): string {
  const error = Signals.maybeDeserializeError(value)
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error')

  return inspector(message.replace(/\s+/g, ' ').trim(), {
    purpose: 'error',
    maxTokens: ERROR_PREVIEW_TOKENS,
    compact: true,
    identity,
  })
}
