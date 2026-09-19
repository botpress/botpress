import type { Iteration } from '../context.js'
import { CodeExecutionError, Signals, ThinkSignal } from '../errors.js'
import { inspect } from '../inspect.js'
import type { MemoryChange, MemoryReport } from '../memory.js'
import type { VMExecutionResult } from '../types.js'
import { getErrorMessage } from '../utils.js'

const MAX_REPORTED_CHANGES = 40
const MAX_REPORTED_CALLS = 20
const MAX_OVERRIDE_SOURCE_LENGTH = 3000

export function previewExecutionValue(value: unknown, tokens = 2000): string {
  return inspect(value, undefined, { tokens }) ?? 'undefined'
}

/** Full values live in memory; tool feedback contains bounded, readable previews. */
export function renderExecutionReport(
  iteration: Iteration,
  result: VMExecutionResult,
  report: MemoryReport,
  requestedCode?: string
): string {
  const override = renderExecutionOverride(iteration.code, requestedCode)
  const sections = override ? [override] : []
  sections.push(renderOutcome(iteration, result, report))

  const referenceRecovery = renderReferenceRecovery(result)

  if (referenceRecovery) {
    sections.push(referenceRecovery)
  }

  const completedNormally =
    result.success &&
    !result.signal &&
    (iteration.status.type === 'thinking_requested' || iteration.status.type === 'exit_success')

  if (override && completedNormally && iteration.status.type === 'thinking_requested') {
    sections.push(
      'No exit was applied. The executed program returned an inspection result; use that result for any required completion. Do not call the originally requested business tools merely to compensate for the hook replacement.'
    )
  }

  if (override || !completedNormally) {
    const calls = renderCompletedCalls(iteration)

    if (calls) {
      sections.push(calls)
    }
  }

  const deliveries = renderMessageDeliveries(iteration)

  if (deliveries) {
    sections.push(deliveries)
  }

  appendChanges(sections, 'CREATED', report.created)
  appendChanges(sections, 'UPDATED', report.updated)

  if (report.unavailable.length) {
    const failures = report.unavailable.slice(0, MAX_REPORTED_CHANGES)
    sections.push(`MEMORY UNAVAILABLE\n${failures.map(({ name, reason }) => `- ${name}: ${reason}`).join('\n')}`)
  }

  return sections.join('\n\n')
}

function renderReferenceRecovery(result: VMExecutionResult): string | undefined {
  if (result.success) {
    return undefined
  }

  const error = Signals.maybeDeserializeError(result.error)
  const originalErrorName = error instanceof CodeExecutionError ? error.originalErrorName : error?.name

  if (originalErrorName !== 'ReferenceError') {
    return undefined
  }

  return [
    'REFERENCE RECOVERY',
    'Check the Memory overview and JavaScript API for the missing name. Declare new variables with const or let; assignment alone never creates a variable. If a preceding business call already returned, reuse its acknowledged result rather than repeating the call. Do not invent values or functions for unknown names.',
  ].join('\n')
}

/** Keep the requested assistant call intact while disclosing the source the host actually ran. */
export function renderExecutionOverride(executedCode?: string, requestedCode?: string): string | undefined {
  if (executedCode === undefined || requestedCode === undefined || executedCode === requestedCode) {
    return undefined
  }

  const source = executedCode.slice(0, MAX_OVERRIDE_SOURCE_LENGTH)
  const truncated = source.length < executedCode.length

  return [
    'EXECUTION OVERRIDE',
    'The host onBeforeExecution hook replaced the requested JavaScript. The original assistant tool call records the requested program. Replacement source is shown below; the outcomes report what actually executed.',
    'Continue from the actual results and retained variables. Do not replay the requested program to compensate for this intentional replacement.',
    'Replacement JavaScript (bounded preview):',
    previewExecutionValue(source, 800),
    ...(truncated ? ['The replacement source preview was truncated.'] : []),
  ].join('\n')
}

function renderOutcome(iteration: Iteration, result: VMExecutionResult, report: MemoryReport): string {
  if (iteration.status.type === 'exit_success') {
    const { exit_name: name, return_value: value } = iteration.status.exit_success
    const payload = value === undefined ? '' : `\n${previewExecutionValue(value)}`

    return `EXIT\n${name}${payload}`
  }

  if (result.success && !result.signal && iteration.status.type === 'thinking_requested') {
    const value = report.resultAvailable
      ? previewExecutionValue(result.return_value)
      : 'Unavailable; see memory errors below.'
    return `RETURN\n${value}`
  }

  const signal = result.signal
  const reason = signal instanceof ThinkSignal ? signal.reason : (iteration.error ?? 'Execution interrupted.')
  const explanation =
    iteration.status.type === 'generation_error'
      ? 'The response stream failed after JavaScript started. Earlier actions may have completed, but the terminal decision was not applied. Inspect the recorded outcomes before continuing.'
      : 'Statements after the interruption did not run. Earlier actions may have completed; do not repeat them blindly.'
  const lines = [`INTERRUPTED\n${reason}`, explanation]

  if (signal instanceof ThinkSignal && signal.context !== undefined) {
    // A ThinkSignal often carries retrieval evidence needed for the next response.
    // Keep string evidence intact; the request builder enforces the overall budget.
    const context = typeof signal.context === 'string' ? signal.context : previewExecutionValue(signal.context)
    lines.push(`Context: ${context}`)
  }

  return lines.join('\n\n')
}

function renderMessageDeliveries(iteration: Iteration): string | undefined {
  const deliveries = iteration.traces.filter((trace) => trace.type === 'yield').filter((trace) => trace.message_id)

  if (!deliveries.length) {
    return undefined
  }

  const lines = deliveries.slice(0, MAX_REPORTED_CALLS).map((delivery) => {
    const outcome = delivery.success === false ? `uncertain: ${delivery.error}` : 'delivered'

    return `- ${delivery.message_id}: ${outcome}`
  })

  if (deliveries.length > lines.length) {
    lines.push(`- ${deliveries.length - lines.length} additional deliveries are recorded in the execution traces.`)
  }

  return `MESSAGE DELIVERIES\n${lines.join('\n')}`
}

function appendChanges(sections: string[], label: string, changes: MemoryChange[]): void {
  if (!changes.length) {
    return
  }

  const entries = changes.slice(0, MAX_REPORTED_CHANGES).map(({ name, preview }) => `- ${name}: ${preview}`)

  if (changes.length > entries.length) {
    entries.push(`- ${changes.length - entries.length} more changes are retained in memory.`)
  }

  sections.push(`${label}\n${entries.join('\n')}`)
}

function renderCompletedCalls(iteration: Iteration): string | undefined {
  const calls = iteration.traces.filter((trace) => trace.type === 'tool_call')

  if (!calls.length) {
    return undefined
  }

  const lines = calls.slice(0, MAX_REPORTED_CALLS).map((call) => {
    const name = call.object ? `${call.object}.${call.tool_name}` : call.tool_name
    const outcome = call.success
      ? `returned ${previewExecutionValue(call.output, 150)}`
      : `failed: ${getErrorMessage(call.error)}`
    return `- ${name} (${call.tool_call_id}): ${outcome}`
  })

  if (calls.length > lines.length) {
    lines.push(`- ${calls.length - lines.length} additional calls are recorded in the execution traces.`)
  }

  return `BUSINESS CALL OUTCOMES\n${lines.join('\n')}`
}
