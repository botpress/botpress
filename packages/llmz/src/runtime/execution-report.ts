import type { Iteration } from '../context.js'
import { CodeExecutionError, Signals, ThinkSignal } from '../errors.js'
import { inspect } from '../inspect.js'
import type { MemoryChange, MemoryReport } from '../memory.js'
import { DEFAULT_TOOL_RESULT_MAX_TOKENS } from '../truncate.js'
import type { VMExecutionResult } from '../types.js'
import { getExecutionActivity, renderMessageDeliveries, renderToolCalls } from './execution-activity.js'

export { renderMessageDeliveries } from './execution-activity.js'

const MAX_REPORTED_CHANGES = 40
const MAX_OVERRIDE_SOURCE_LENGTH = 3000

export function previewExecutionValue(value: unknown, tokens = DEFAULT_TOOL_RESULT_MAX_TOKENS): string {
  return inspect(value, undefined, { tokens, maxStringLength: Infinity }) ?? 'undefined'
}

function previewDetail(value: unknown, tokens = 100): string {
  return inspect(value, undefined, { tokens, compact: true, honorTruncation: false })
}

function previewName(name: string): string {
  return name.length <= 100 ? name : previewDetail(name, 40)
}

/** Full values live in memory; tool feedback contains bounded, readable previews. */
export function renderExecutionReport(
  iteration: Iteration,
  result: VMExecutionResult,
  report: MemoryReport,
  {
    requestedCode,
    cancelled = iteration.status.type === 'aborted',
    inspected = false,
    maxTokens = DEFAULT_TOOL_RESULT_MAX_TOKENS,
    inspectionValue = result.success ? result.return_value : undefined,
  }: {
    requestedCode?: string
    cancelled?: boolean
    inspected?: boolean
    maxTokens?: number
    inspectionValue?: unknown
  } = {}
): string {
  const activity = getExecutionActivity(iteration)
  const sections = [renderExecutionStatus(iteration, result, report)]
  const override = renderExecutionOverride(iteration.code, requestedCode)

  if (override) {
    sections.push(override)
  }

  const referenceRecovery = renderReferenceRecovery(result)

  if (referenceRecovery) {
    sections.push(referenceRecovery)
  }

  const completedNormally =
    result.success &&
    !result.signal &&
    (iteration.status.type === 'thinking_requested' || iteration.status.type === 'exit_success')

  if (override && completedNormally && iteration.status.type === 'thinking_requested' && iteration.exits.length) {
    sections.push(
      'No exit was applied. The executed program returned an inspection result; use that result for any required completion. Do not call the originally requested business tools merely to compensate for the hook replacement.'
    )
  }

  const calls = renderToolCalls(activity, !!override || !completedNormally)

  if (calls) {
    sections.push(calls)
  }

  const deliveries = renderMessageDeliveries(iteration, cancelled)

  if (deliveries) {
    sections.push(deliveries)
  }

  const changes: string[] = []
  appendChanges(changes, 'Created', report.created)
  appendChanges(changes, 'Updated', report.updated)

  if (changes.length) {
    sections.push(`Memory changes\n${changes.join('\n')}`)
  }

  if (report.unavailable.length) {
    const failures = report.unavailable.slice(0, MAX_REPORTED_CHANGES)
    const entries = failures.map(({ name, reason }) => `- ${previewName(name)}: ${previewDetail(reason)}`)

    if (report.unavailable.length > failures.length) {
      entries.push(`- ${report.unavailable.length - failures.length} additional values could not be retained.`)
    }

    sections.push(`Memory errors\n${entries.join('\n')}`)
  }

  sections.push(renderOutcome(iteration, result, report, { inspected, maxTokens, inspectionValue }))

  return sections.join('\n\n')
}

function renderExecutionStatus(iteration: Iteration, result: VMExecutionResult, report: MemoryReport): string {
  if (result.signal instanceof ThinkSignal) {
    return `run_javascript: paused\nThinking requested: ${previewDetail(result.signal.reason)}. Its remaining statements did not run.`
  }

  if (iteration.status.type === 'aborted') {
    return `run_javascript: cancelled\n${previewDetail(iteration.error ?? 'Execution was cancelled.')}`
  }

  if (iteration.status.type === 'generation_error') {
    return [
      'run_javascript: interrupted',
      'The response stream failed after JavaScript started. Earlier actions may have completed, but the terminal decision was not applied. Inspect the recorded outcomes before continuing.',
      iteration.error ? previewDetail(iteration.error) : undefined,
    ]
      .filter(Boolean)
      .join('\n')
  }

  if (iteration.status.type === 'exit_error') {
    return `run_javascript: failed\nJavaScript ran, but completion through ${previewDetail(iteration.status.exit_error.exit)} failed: ${previewDetail(iteration.status.exit_error.message)}`
  }

  if (!result.success) {
    return [
      'run_javascript: failed',
      previewDetail(iteration.error ?? 'JavaScript execution failed.'),
      'Completed actions below remain valid; do not repeat them blindly.',
    ].join('\n')
  }

  if (report.unavailable.length) {
    return 'run_javascript: completed with memory errors\nJavaScript ran successfully, but some values could not be retained.'
  }

  return 'run_javascript: succeeded'
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

function renderOutcome(
  iteration: Iteration,
  result: VMExecutionResult,
  report: MemoryReport,
  { inspected, maxTokens, inspectionValue }: { inspected: boolean; maxTokens: number; inspectionValue: unknown }
): string {
  if (iteration.status.type === 'exit_success') {
    const { exit_name: name, return_value: value } = iteration.status.exit_success
    const payload = value === undefined ? '' : `\n${previewExecutionValue(value, maxTokens)}`

    return `Completion\nExit ${previewDetail(name)} completed.${payload}`
  }

  if (result.success && !result.signal && iteration.status.type === 'thinking_requested') {
    const value = report.resultAvailable
      ? previewExecutionValue(inspectionValue, maxTokens)
      : 'Unavailable; see memory errors above.'
    return `${inspected ? 'inspect() result' : 'Result'}\n${value}`
  }

  const signal = result.signal
  const lines = ['inspect() result\nNot produced; execution did not complete an inspection.']

  if (signal instanceof ThinkSignal && signal.context !== undefined) {
    lines.push(`Interruption context\n${previewExecutionValue(signal.context, maxTokens)}`)
  }

  return lines.join('\n\n')
}

function appendChanges(sections: string[], label: string, changes: MemoryChange[]): void {
  if (!changes.length) {
    return
  }

  const names = changes.slice(0, MAX_REPORTED_CHANGES).map(({ name }) => previewName(name))
  sections.push(`${label}: ${names.join(', ')}`)

  if (changes.length > names.length) {
    sections.push(`${changes.length - names.length} more changes are retained in memory.`)
  }
}
