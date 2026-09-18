import { Client } from '@botpress/client'
import {
  Cognitive,
  type CognitiveMetadata,
  type CognitiveRequest,
  type CognitiveStreamChunk,
} from '@botpress/cognitive'
import { expect } from 'vitest'
import type { ExecutionResult } from '../../src/index.js'

// Opt-in, one requested model and no test retries. Fallbacks require explicit configuration.
// Record actual model metadata: the gateway may still route to another provider.
// Record cache hits so repeated cached responses are not treated as new samples.
export const models = (process.env.LLMZ_EVAL_MODELS ?? '')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean)
export const fallbackModels = (process.env.LLMZ_EVAL_FALLBACK_MODELS ?? '')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean)

const withFallbacks = (input: CognitiveRequest): CognitiveRequest =>
  fallbackModels.length && typeof input.model === 'string' && models.includes(input.model)
    ? { ...input, model: [input.model, ...fallbackModels] as CognitiveRequest['model'] }
    : input

class EvaluationCognitive extends Cognitive {
  public override generateText(input: CognitiveRequest, options?: Parameters<Cognitive['generateText']>[1]) {
    return super.generateText(withFallbacks(input), options)
  }

  public override generateTextStream(
    input: CognitiveRequest,
    options?: Parameters<Cognitive['generateTextStream']>[1]
  ) {
    return super.generateTextStream(withFallbacks(input), options)
  }
}

export function expectModelRoute(metadata: CognitiveMetadata | undefined, model: string): void {
  const allowed = [model, ...fallbackModels]
  expect(metadata).toBeDefined()
  expect(allowed).toContain(metadata?.model)
  expect(metadata?.cached).toBe(false)
  if (!fallbackModels.length) expect(metadata?.fallbackPath ?? []).toEqual([])
  else for (const attempted of metadata?.fallbackPath ?? []) expect(allowed).toContain(attempted)
}

export function expectAllowedRestart(restart: CognitiveStreamChunk['restart']): void {
  if (!restart) return
  expect(fallbackModels.length).toBeGreaterThan(0)
  expect([...models, ...fallbackModels]).toContain(restart.fromModel)
  expect([...models, ...fallbackModels]).toContain(restart.toModel)
}
export const repeats = Math.max(1, Math.min(100, Number(process.env.LLMZ_EVAL_REPEATS) || 1))
export const withExamples = process.env.LLMZ_EVAL_EXAMPLES !== '0'
export const cases = models.flatMap((model) =>
  Array.from({ length: repeats }, (_, index) => ({ model, run: index + 1 }))
)

export const client = new EvaluationCognitive({
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
