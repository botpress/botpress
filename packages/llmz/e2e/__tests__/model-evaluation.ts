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
// Cache bypass and route assertions keep repeated evaluations honest.
export const models = (process.env.LLMZ_EVAL_MODELS ?? '')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean)

export const fallbackModels = (process.env.LLMZ_EVAL_FALLBACK_MODELS ?? '')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean)

function prepareEvaluationRequest(input: CognitiveRequest): CognitiveRequest {
  const request: CognitiveRequest = {
    ...input,
    options: {
      ...input.options,
      skipCache: true,
    },
  }

  if (fallbackModels.length && typeof input.model === 'string' && models.includes(input.model)) {
    request.model = [input.model, ...fallbackModels] as CognitiveRequest['model']
  }

  return request
}

function reportModelRouteMismatch(request: CognitiveRequest, metadata: CognitiveMetadata): void {
  const requestedModel = Array.isArray(request.model) ? request.model[0] : request.model

  if (!requestedModel || metadata.model === requestedModel) {
    return
  }

  const warnings = metadata.warnings?.map((warning) => ({
    type: warning.type,
    message: warning.message.replace(/bp_pat_[A-Za-z0-9]+/g, '[REDACTED]'),
  }))

  console.warn(
    JSON.stringify({
      kind: 'model-route-mismatch',
      requestedModel,
      actualModel: metadata.model ?? null,
      provider: metadata.provider,
      fallbackPath: metadata.fallbackPath ?? [],
      warnings: warnings ?? [],
      requestId: metadata.requestId ?? null,
      cached: metadata.cached ?? null,
    })
  )
}

class EvaluationCognitive extends Cognitive {
  public override async generateText(input: CognitiveRequest, options?: Parameters<Cognitive['generateText']>[1]) {
    const response = await super.generateText(prepareEvaluationRequest(input), options)

    reportModelRouteMismatch(input, response.metadata)

    return response
  }

  public override async *generateTextStream(
    input: CognitiveRequest,
    options?: Parameters<Cognitive['generateTextStream']>[1]
  ) {
    for await (const chunk of super.generateTextStream(prepareEvaluationRequest(input), options)) {
      if (chunk.finished && chunk.metadata) {
        reportModelRouteMismatch(input, chunk.metadata)
      }

      yield chunk
    }
  }
}

export function expectModelRoute(metadata: CognitiveMetadata | undefined, model: string): void {
  const allowed = [model, ...fallbackModels]

  expect(metadata).toBeDefined()
  expect(allowed).toContain(metadata?.model)
  expect(metadata?.cached).toBe(false)

  if (!fallbackModels.length) {
    expect(metadata?.fallbackPath ?? []).toEqual([])
  } else {
    for (const attempted of metadata?.fallbackPath ?? []) {
      expect(allowed).toContain(attempted)
    }
  }
}

/** Verify every generated iteration; full executions must not pass using another model or cached samples. */
export function expectRuntimeModelRoute(result: ExecutionResult, requestedModel: string): void {
  const allowed = [requestedModel, ...fallbackModels]

  expect(result.iterations.length).toBeGreaterThan(0)

  for (const iteration of result.iterations) {
    const label = `Iteration ${iteration.id}`

    expect(iteration.llm, `${label} must include generation metadata`).toBeDefined()
    expect(allowed, `${label} used an unexpected model`).toContain(iteration.llm?.model)
    expect(iteration.llm?.cached, `${label} must be a fresh provider sample`).toBe(false)
  }
}

export function expectAllowedRestart(restart: CognitiveStreamChunk['restart']): void {
  if (!restart) {
    return
  }

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
  invalidResponses: result.iterations.filter((iteration) => iteration.status.type === 'invalid_code_error'),
  iterations: result.iterations.map((iteration) => ({ status: iteration.status.type, output: iteration.llm?.output })),
  error: result.isError() ? String(result.error).replace(/bp_pat_[A-Za-z0-9]+/g, '[REDACTED]') : undefined,
})

/** Native call validation errors remain distinct from model task-quality checks. */
export function expectAcceptedProtocol(result: ExecutionResult): void {
  const errors = result.iterations.filter((iteration) => iteration.status.type === 'invalid_code_error')

  expect(errors).toEqual([])
}
