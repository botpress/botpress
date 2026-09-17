import { Client } from '@botpress/client'
import { Cognitive } from '@botpress/cognitive'
import { expect } from 'vitest'
import type { ExecutionResult } from '../../src/index.js'

// Opt-in, one requested model, no explicit fallback chain and no test retries.
// Record actual model metadata: the gateway may still route to another provider.
// Record cache hits so repeated cached responses are not treated as new samples.
export const models = (process.env.LLMZ_EVAL_MODELS ?? '')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean)
export const repeats = Math.max(1, Math.min(100, Number(process.env.LLMZ_EVAL_REPEATS) || 1))
export const withExamples = process.env.LLMZ_EVAL_EXAMPLES !== '0'
export const cases = models.flatMap((model) =>
  Array.from({ length: repeats }, (_, index) => ({ model, run: index + 1 }))
)

export const client = new Cognitive({
  client: new Client({
    apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.cloud',
    botId: process.env.CLOUD_BOT_ID,
    token: process.env.CLOUD_PAT,
  }),
})

export const metrics = (result: ExecutionResult) => ({
  actualModels: [...new Set(result.iterations.map((iteration) => iteration.llm?.model).filter(Boolean))],
  generationMs: result.iterations.reduce(
    (sum, iteration) => sum + ((iteration.llm?.ended_at ?? 0) - (iteration.llm?.started_at ?? 0)),
    0
  ),
  spend: result.iterations.reduce((sum, iteration) => sum + (iteration.llm?.spend ?? 0), 0),
  cachedCalls: result.iterations.filter((iteration) => iteration.llm?.cached).length,
  diagnostics: result.iterations.flatMap((iteration) => iteration.llm?.diagnostics ?? []),
  iterations: result.iterations.map((iteration) => ({ status: iteration.status.type, output: iteration.llm?.output })),
  error: result.isError() ? String(result.error).replace(/bp_pat_[A-Za-z0-9]+/g, '[REDACTED]') : undefined,
})

/** Assert accepted protocol; raw diagnostics remain in metrics for quality analysis. */
export function expectAcceptedProtocol(result: ExecutionResult): void {
  const diagnostics = result.iterations.flatMap((iteration) => iteration.llm?.diagnostics ?? [])

  // These are deliberately ignored/suppressed by the runtime. Behavioral tests
  // still check every delivered message and tool call, including their order.
  const errors = diagnostics.filter(
    (diagnostic) => diagnostic.code !== 'unexpected-text' && diagnostic.code !== 'send-after-run'
  )

  expect(errors).toEqual([])
}
