import { type CognitiveMetadata, type CognitiveRequest, type CognitiveStreamChunk } from '@botpress/cognitive'
import { expect } from 'vitest'

import type { ExecutionResult } from '../../src/index.js'
import { CachedCognitive, cacheMode } from './cached-cognitive.js'

// One requested model per case and no test retries. Fallbacks require explicit configuration.
// A one-element array disables the gateway's automatic fallback ladder.
// Record actual model metadata so routing changes remain visible.
// Refresh mode bypasses caches; ordinary runs replay recorded responses and preserve route assertions.
export const models = (process.env.LLMZ_EVAL_MODELS ?? 'openai:gpt-5.6-luna, cerebras:qwen-3.8-27b')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean)

export const fallbackModels = (process.env.LLMZ_EVAL_FALLBACK_MODELS ?? '')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean)

function prepareEvaluationRequest(input: CognitiveRequest): CognitiveRequest {
  const request: CognitiveRequest = { ...input }

  if (typeof input.model === 'string' && models.includes(input.model)) {
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

class EvaluationCognitive extends CachedCognitive {
  public override async generateText(
    input: CognitiveRequest,
    options?: Parameters<CachedCognitive['generateText']>[1]
  ) {
    const response = await super.generateText(prepareEvaluationRequest(input), options)

    reportModelRouteMismatch(input, response.metadata)

    return response
  }

  public override async *generateTextStream(
    input: CognitiveRequest,
    options?: Parameters<CachedCognitive['generateTextStream']>[1]
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

  if (cacheMode() === 'refresh') {
    expect(metadata?.cached).toBe(false)
  }

  if (!fallbackModels.length) {
    expect(metadata?.fallbackPath ?? []).toEqual([])
  } else {
    for (const attempted of metadata?.fallbackPath ?? []) {
      expect(allowed).toContain(attempted)
    }
  }
}

/** Verify every route; explicit fresh evaluations must never pass using cached samples. */
export function expectRuntimeModelRoute(result: ExecutionResult, requestedModel: string): void {
  const allowed = [requestedModel, ...fallbackModels]

  expect(result.iterations.length).toBeGreaterThan(0)

  for (const iteration of result.iterations) {
    const label = `Iteration ${iteration.id}`

    expect(iteration.llm, `${label} must include generation metadata`).toBeDefined()
    expect(allowed, `${label} used an unexpected model`).toContain(iteration.llm?.model)
    if (cacheMode() === 'refresh') {
      expect(iteration.llm?.cached, `${label} must be a fresh provider sample`).toBe(false)
    }
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
export const cases = models.flatMap((model) =>
  Array.from({ length: repeats }, (_, index) => ({ model, run: index + 1 }))
)

export const client = new EvaluationCognitive({
  apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.cloud',
  botId: process.env.CLOUD_BOT_ID,
  token: process.env.CLOUD_PAT,
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
