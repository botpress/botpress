import { CodeExecutionError, Signals } from '../errors.js'
import type { InspectionPolicyLookup } from '../inspect.js'
import { createInspector, type InspectionIdentity, type Inspector } from '../inspection.js'
import type { MemoryChange, MemoryReport } from '../session/memory.js'
import { DEFAULT_TOOL_RESULT_MAX_TOKENS } from '../truncate.js'
import { renderMessageDeliveries, renderToolCalls, type ExecutionActivity } from './execution-activity.js'

export { renderMessageDeliveries } from './execution-activity.js'

const MAX_REPORTED_CHANGES = 40
const MAX_OVERRIDE_SOURCE_LENGTH = 3000

export type ExecutionOutcome =
  | { type: 'inspect'; value: unknown; available: boolean; explicit: boolean }
  | { type: 'exit'; name: string; value: unknown }
  | { type: 'error'; message: string; error?: unknown; exitName?: string }
  | { type: 'cancelled'; message: string }
  | { type: 'interrupted'; reason: 'stream' | 'thinking'; message?: string; context?: unknown }

export type ExecutionReport = {
  outcome: ExecutionOutcome
  activity: ExecutionActivity
  memory: MemoryReport
  source?: { requested?: string; executed?: string }
  requiresExit?: boolean
  iteration?: number
  identity?: InspectionIdentity
  inspector?: Inspector
  maxTokens?: number
  policies?: InspectionPolicyLookup
}

/** Format one settled outcome; execution is responsible for deciding what happened. */
export function renderExecutionReport({
  outcome,
  activity,
  memory,
  source,
  requiresExit = false,
  iteration,
  identity = { iteration },
  inspector = createInspector(),
  maxTokens = DEFAULT_TOOL_RESULT_MAX_TOKENS,
  policies,
}: ExecutionReport): string {
  const detail = (value: unknown) => inspector(value, { purpose: 'error', maxTokens: 100, compact: true, identity })
  const name = (value: string) => inspector(value, { purpose: 'name', maxTokens: 40, identity })
  const result = (value: unknown) => inspector(value, { purpose: 'result', maxTokens, policies, identity })
  const sections = [renderStatus(outcome, memory, detail)]
  const override = renderExecutionOverride(source?.executed, source?.requested, inspector, identity)

  if (override) {
    sections.push(override)

    if (outcome.type === 'inspect' && requiresExit) {
      sections.push(
        'No exit was applied. The executed program returned an inspection result; use that result for any required completion. Do not call the originally requested business tools merely to compensate for the hook replacement.'
      )
    }
  }

  if (outcome.type === 'error' && isReferenceError(outcome.error)) {
    sections.push(
      'REFERENCE RECOVERY\nCheck the Memory overview and JavaScript API for the missing name. Declare new variables with const or let; assignment alone never creates a variable. If a preceding business call already returned, reuse its acknowledged result rather than repeating the call. Do not invent values or functions for unknown names.'
    )
  }

  const completed = outcome.type === 'inspect' || outcome.type === 'exit'
  const calls = renderToolCalls(activity, !!override || !completed, inspector, identity)
  const deliveries = renderMessageDeliveries(activity, outcome.type === 'cancelled', inspector, identity)

  if (calls) {
    sections.push(calls)
  }

  if (deliveries) {
    sections.push(deliveries)
  }

  const changes = [renderChanges('Created', memory.created, name), renderChanges('Updated', memory.updated, name)]
    .filter(Boolean)
    .join('\n')

  if (changes) {
    sections.push(`Memory changes\n${changes}`)
  }

  if (memory.unavailable.length) {
    const failures = memory.unavailable.slice(0, MAX_REPORTED_CHANGES)
    const entries = failures.map((failure) => `- ${name(failure.name)}: ${detail(failure.reason)}`)

    if (memory.unavailable.length > failures.length) {
      entries.push(`- ${memory.unavailable.length - failures.length} additional values could not be retained.`)
    }

    sections.push(`Memory errors\n${entries.join('\n')}`)
  }

  if (outcome.type === 'inspect') {
    const value = outcome.available ? result(outcome.value) : 'Unavailable; see memory errors above.'
    sections.push(`${outcome.explicit ? 'inspect() result' : 'Result'}\n${value}`)
  } else if (outcome.type === 'exit') {
    const payload = outcome.value === undefined ? '' : `\n${result(outcome.value)}`
    sections.push(`Completion\nExit ${detail(outcome.name)} completed.${payload}`)
  } else {
    sections.push('inspect() result\nNot produced; execution did not complete an inspection.')

    if (outcome.type === 'interrupted' && outcome.reason === 'thinking' && outcome.context !== undefined) {
      sections.push(`Interruption context\n${result(outcome.context)}`)
    }
  }

  return sections.join('\n\n')
}

function renderStatus(outcome: ExecutionOutcome, memory: MemoryReport, detail: (value: unknown) => string): string {
  switch (outcome.type) {
    case 'cancelled':
      return `run_javascript: cancelled\n${detail(outcome.message)}`

    case 'interrupted':
      if (outcome.reason === 'thinking') {
        return `run_javascript: paused\nThinking requested: ${detail(outcome.message)}. Its remaining statements did not run.`
      }

      return [
        'run_javascript: interrupted',
        'The response stream failed after JavaScript started. Earlier actions may have completed, but the terminal decision was not applied. Inspect the recorded outcomes before continuing.',
        outcome.message ? detail(outcome.message) : undefined,
      ]
        .filter(Boolean)
        .join('\n')

    case 'error':
      if (outcome.exitName !== undefined) {
        return `run_javascript: failed\nJavaScript ran, but completion through ${detail(outcome.exitName)} failed: ${detail(outcome.message)}`
      }

      return [
        'run_javascript: failed',
        detail(outcome.message),
        'Completed actions below remain valid; do not repeat them blindly.',
      ].join('\n')

    case 'inspect':
    case 'exit':
      return memory.unavailable.length
        ? 'run_javascript: completed with memory errors\nJavaScript ran successfully, but some values could not be retained.'
        : 'run_javascript: succeeded'
  }
}

function isReferenceError(value: unknown): boolean {
  const error = Signals.maybeDeserializeError(value)
  return (error instanceof CodeExecutionError ? error.originalErrorName : error?.name) === 'ReferenceError'
}

/** Keep the requested assistant call intact while disclosing the source the host actually ran. */
export function renderExecutionOverride(
  executedCode?: string,
  requestedCode?: string,
  inspector: Inspector = createInspector(),
  identity?: InspectionIdentity
): string | undefined {
  if (executedCode === undefined || requestedCode === undefined || executedCode === requestedCode) {
    return undefined
  }

  const source = executedCode.slice(0, MAX_OVERRIDE_SOURCE_LENGTH)

  return [
    'EXECUTION OVERRIDE',
    'The host onBeforeExecution hook replaced the requested JavaScript. The original assistant tool call records the requested program. Replacement source is shown below; the outcomes report what actually executed.',
    'Continue from the actual results and retained variables. Do not replay the requested program to compensate for this intentional replacement.',
    'Replacement JavaScript (bounded preview):',
    inspector(source, { purpose: 'code', maxTokens: 800, identity }),
    ...(source.length < executedCode.length ? ['The replacement source preview was truncated.'] : []),
  ].join('\n')
}

function renderChanges(label: string, changes: MemoryChange[], name: (value: string) => string): string | undefined {
  if (!changes.length) {
    return undefined
  }

  const names = changes.slice(0, MAX_REPORTED_CHANGES).map((change) => name(change.name))
  const lines = [`${label}: ${names.join(', ')}`]

  if (changes.length > names.length) {
    lines.push(`${changes.length - names.length} more changes are retained in memory.`)
  }

  return lines.join('\n')
}
