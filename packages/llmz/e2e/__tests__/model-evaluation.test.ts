import { type CognitiveRequest, type CognitiveResponse } from '@botpress/cognitive'
import { afterEach, describe, expect, it, vi } from 'vitest'

const model = 'cerebras:qwen-3.8-27b'
const request: CognitiveRequest = { model, messages: [{ role: 'user', content: 'Test routing.' }] }
const response: CognitiveResponse = {
  output: 'Done.',
  metadata: {
    model,
    provider: 'cerebras',
    cached: false,
    latency: 1,
    cost: 0,
    usage: { inputTokens: 1, outputTokens: 1, inputCost: 0, outputCost: 0 },
  },
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe.each(['text', 'stream'])('%s evaluation routing', (kind) => {
  it.each(['', 'openai:gpt-5.6-luna'])('uses only the requested model and explicit fallbacks %j', async (fallback) => {
    vi.resetModules()
    vi.stubEnv('LLMZ_EVAL_MODELS', model)
    vi.stubEnv('LLMZ_EVAL_FALLBACK_MODELS', fallback)
    const { CachedCognitive } = await import('./cached-cognitive.js')
    // Test the evaluation boundary without recording fixture responses on disk.
    const text = vi.spyOn(CachedCognitive.prototype, 'generateText').mockResolvedValue(response)
    const stream = vi.spyOn(CachedCognitive.prototype, 'generateTextStream').mockImplementation(async function* () {
      yield { created: 1, finished: true, metadata: response.metadata, output: response.output }
    })
    const { client } = await import('./model-evaluation.js')
    if (kind === 'text') {
      await client.generateText(request)
    } else {
      for await (const _chunk of client.generateTextStream(request)) {
        // Drain the stream so route validation runs.
      }
    }
    const expected = fallback ? [model, fallback] : [model]
    expect(kind === 'text' ? text : stream).toHaveBeenCalledWith({ ...request, model: expected }, undefined)
    expect(request.model).toBe(model)
  })
})
