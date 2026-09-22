import { resolveInspectionBudget, type InspectionPolicyLookup } from '../inspect.js'
import type { InspectionIdentity, Inspector } from '../inspection.js'
import { reportSection } from './execution-diagnostics.js'

/** A successful business result that must be shown before this turn may complete. */
export type ForcedInspection = {
  tool: string
  toolCallId: string
  line?: number
  reason: string
  value: unknown
  metadata?: Record<string, unknown>
}

/** Keep attribution and content together, using the same display budgets as inspect(). */
export function renderForcedInspection(
  inspections: readonly ForcedInspection[],
  inspector: Inspector,
  identity: InspectionIdentity,
  maxTokens: number,
  policies?: InspectionPolicyLookup
): string {
  const entries = inspections.map((entry) => {
    const entryIdentity = { ...identity, tool: entry.tool }
    const name = inspector(entry.tool, { purpose: 'name', maxTokens: 80, identity: entryIdentity })
    const reason = inspector(entry.reason, { purpose: 'error', maxTokens: 1000, identity: entryIdentity })
    const budget = resolveInspectionBudget(entry.value, { tokens: maxTokens, policies })
    const result = inspector(entry.value, { purpose: 'result', maxTokens, policies, identity: entryIdentity })
    return [
      `<tool name="${name}" line="${entry.line ?? 'unknown'}">`,
      `<reason>${reason}</reason>`,
      reportSection('result', result, budget.tokens, { preserve: budget.preserve }),
      '</tool>',
    ].join('\n')
  })

  return [
    '<forced_inspection>',
    'Forced inspection: the tools listed below completed successfully and requested review of their results.',
    'This is the equivalent of an inspect() call. Do not repeat these tool calls; use the results below and retained variables.',
    'No exit was applied. Review the evidence before continuing or completing the task.',
    '',
    'Tools requesting inspection (lines refer to the executed JavaScript):',
    ...entries,
    '</forced_inspection>',
  ].join('\n')
}
