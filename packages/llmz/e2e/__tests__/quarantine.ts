import { it, type TestFunction } from 'vitest'

// Accepted model limitations from the September 23 production evaluation.
// Keep each exception scoped to one model and scenario; all assertions remain active when evaluated.
const exceptions = [
  { model: 'groq:qwen3.8-27b', scenario: 'catalog-tomatoes', reason: 'Leaks a closing thinking tag in the reply.' },
  {
    model: 'cerebras:gpt-oss-120b',
    scenario: 'choice-introduction',
    reason: 'Prints the component call as text instead of delivering buttons.',
  },
  {
    model: 'groq:gpt-oss-120b',
    scenario: 'choice-introduction',
    reason: 'Delivers buttons without the requested text introduction.',
  },
] as const

export function quarantineReason(model: string, scenario: string): string | undefined {
  return exceptions.find((entry) => entry.model === model && entry.scenario === scenario)?.reason
}

export function productionTest(model: string, scenario: string, name: string, body: TestFunction): void {
  const reason = quarantineReason(model, scenario)
  const title = reason ? `${name} [quarantined] ${reason}` : name
  it.skipIf(Boolean(reason) && process.env.LLMZ_E2E_QUARANTINE !== '1')(title, body)
}
