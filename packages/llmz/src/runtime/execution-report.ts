import { CodeExecutionError, Signals, UnknownToolError } from '../errors.js'

import { resolveInspectionBudget, type InspectionPolicyLookup } from '../inspect.js'
import { createInspector, type InspectionIdentity, type Inspector } from '../inspection.js'
import type { MemoryChange, MemoryReport } from '../session/memory.js'
import { DEFAULT_TOOL_RESULT_MAX_TOKENS } from '../truncate.js'
import { renderMessageDeliveries, renderToolCalls, type ExecutionActivity } from './execution-activity.js'

import { renderExecutionDiagnostics, renderSourceTrace, reportSection } from './execution-diagnostics.js'

export { renderMessageDeliveries } from './execution-activity.js'

const MAX_REPORTED_CHANGES = 40
const MAX_OVERRIDE_SOURCE_LENGTH = 3000

export type ExecutionOutcome =
  | { type: 'inspect'; value: unknown; available: boolean; explicit: boolean }
  | { type: 'exit'; name: string; value: unknown }
  | { type: 'error'; message: string; error?: unknown; exitName?: string }
  | { type: 'cancelled'; message: string }
  | { type: 'interrupted'; reason: 'stream' | 'thinking'; message?: string; context?: unknown; stacktrace?: string }

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
  const detail = (value: unknown) => inspector(value, { purpose: 'error', maxTokens: 1000, identity })
  const name = (value: string) => inspector(value, { purpose: 'name', maxTokens: 40, identity })
  const resultSection = (tag: string, heading: string, value: unknown) => {
    const budget = resolveInspectionBudget(value, { tokens: maxTokens, policies })
    const body = inspector(value, { purpose: 'result', maxTokens, policies, identity })
    return reportSection(tag, body, budget.tokens, { heading, preserve: budget.preserve })
  }
  const sections = [renderStatus(outcome, memory)]

  if (outcome.type === 'error') {
    sections.push(...renderExecutionDiagnostics(outcome.error, outcome.message, inspector, identity))
    sections.push(
      reportSection(
        'recovery',
        [
          outcome.exitName !== undefined
            ? `Completion through ${outcome.exitName} failed; no exit was applied.`
            : 'Fix the error before continuing.',
          'The iteration did not complete successfully. Review the error and recorded outcomes before continuing.',
          'Use retained variables and acknowledged results. Do not repeat completed actions or messages.',
          'Check uncertain external outcomes before retrying an operation.',
        ].join('\n')
      )
    )
  } else if (outcome.type === 'interrupted') {
    sections.push(
      reportSection('interruption', detail(outcome.message ?? 'The response stream failed after JavaScript started.'))
    )
    if (outcome.stacktrace && /^(?:> | {2})?\d+ \|/m.test(outcome.stacktrace)) {
      sections.push(renderSourceTrace(outcome.stacktrace, inspector, identity))
    }

    sections.push(
      reportSection(
        'recovery',
        outcome.reason === 'thinking'
          ? 'Execution paused at the thinking request. Remaining statements did not run. Review the context below and continue from retained variables and acknowledged results; do not repeat completed actions or messages.'
          : 'The terminal decision was not applied. Earlier actions may have completed. Inspect the recorded outcomes before continuing; do not repeat acknowledged actions or messages.'
      )
    )
  } else if (outcome.type === 'cancelled') {
    sections.push(reportSection('cancellation', detail(outcome.message)))
  }

  const override = renderExecutionOverride(source?.executed, source?.requested, inspector, identity)

  if (override) {
    sections.push(reportSection('execution_override', override))

    if (outcome.type === 'inspect' && requiresExit) {
      sections.push(
        reportSection(
          'recovery',
          'No exit was applied. The executed program returned an inspection result; use that result for any required completion. Do not call the originally requested business tools merely to compensate for the hook replacement.'
        )
      )
    }
  }

  if (outcome.type === 'error' && isReferenceError(outcome.error)) {
    sections.push(
      reportSection(
        'reference_recovery',
        'REFERENCE RECOVERY\nCheck the Memory overview and JavaScript API for the missing name. Declare new variables with const or let; assignment alone never creates a variable. If a preceding business call already returned, reuse its acknowledged result rather than repeating the call. Do not invent values or functions for unknown names.'
      )
    )
  }

  const completed = outcome.type === 'inspect' || outcome.type === 'exit'
  const calls = renderToolCalls(activity, !!override || !completed, inspector, identity)
  const deliveries = renderMessageDeliveries(activity, outcome.type === 'cancelled', inspector, identity)

  if (calls) {
    sections.push(reportSection('tool_calls', calls, 4000))
  }

  if (deliveries) {
    sections.push(reportSection('messages', deliveries, 4000))
  }

  const changes = [renderChanges('Created', memory.created, name), renderChanges('Updated', memory.updated, name)]
    .filter(Boolean)
    .join('\n')

  if (changes) {
    sections.push(reportSection('memory_changes', `Memory changes\n${changes}`))
  }

  if (memory.unavailable.length) {
    const failures = memory.unavailable.slice(0, MAX_REPORTED_CHANGES)
    const entries = failures.map((failure) => `- ${name(failure.name)}: ${detail(failure.reason)}`)

    if (memory.unavailable.length > failures.length) {
      entries.push(`- ${memory.unavailable.length - failures.length} additional values could not be retained.`)
    }

    sections.push(reportSection('memory_errors', `Memory errors\n${entries.join('\n')}`))
  }

  if (outcome.type === 'inspect') {
    const heading = outcome.explicit ? 'inspect() result' : 'Result'
    sections.push(
      outcome.available
        ? resultSection('result', heading, outcome.value)
        : reportSection('result', 'Unavailable; see memory errors above.', maxTokens, { heading })
    )
  } else if (outcome.type === 'exit') {
    sections.push(
      resultSection(
        'completion',
        `Completion\nExit "${outcome.name}" completed.`,
        outcome.value === undefined ? '' : outcome.value
      )
    )
  } else {
    sections.push(
      reportSection('result', 'Not produced; execution did not complete an inspection.', maxTokens, {
        heading: 'inspect() result',
      })
    )

    if (outcome.type === 'interrupted' && outcome.reason === 'thinking' && outcome.context !== undefined) {
      sections.push(resultSection('interruption_context', 'Interruption context', outcome.context))
    }
  }

  return sections.join('\n\n')
}

function renderStatus(outcome: ExecutionOutcome, memory: MemoryReport): string {
  switch (outcome.type) {
    case 'cancelled':
      return 'run_javascript: cancelled'
    case 'interrupted':
      return outcome.reason === 'thinking' ? 'run_javascript: paused' : 'run_javascript: interrupted'
    case 'error':
      return 'run_javascript: failed'
    case 'inspect':
    case 'exit':
      return memory.unavailable.length
        ? 'run_javascript: completed with memory errors\nJavaScript ran successfully, but some values could not be retained.'
        : 'run_javascript: succeeded'
  }
}

function isReferenceError(value: unknown): boolean {
  const error = Signals.maybeDeserializeError(value)
  return (
    UnknownToolError.is(error) ||
    UnknownToolError.is(error?.cause) ||
    (CodeExecutionError.is(error) ? error.originalErrorName : error?.name) === 'ReferenceError'
  )
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
