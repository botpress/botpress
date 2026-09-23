import type { CognitiveRequest, CognitiveResponse } from '@botpress/cognitive'
import { describe, expect, it, vi } from 'vitest'

import type { Context, Iteration } from '../context.js'
import { DualModePrompt } from '../prompts/dual-modes.js'
import { generateCode } from './generate.js'
import type { RuntimeCognitive } from './types.js'

// Stop at the provider boundary: no LLM, protocol change, or network required.
function fixture(content: CognitiveRequest['messages'][number]['content'], limits = [32_000]) {
  const iteration = {
    id: 'budget-test',
    model: limits.length > 1 ? limits.map((_, index) => `model-${index}`) : 'model-0',
    messages: [{ role: 'user', content }],
    traces: [],
  } as unknown as Iteration
  const ctx = { version: DualModePrompt } as Context
  const generateText = vi.fn(async (_input: CognitiveRequest): Promise<CognitiveResponse> => {
    throw new Error('Provider boundary reached')
  })
  const getModelDetails = vi.fn(async (name: string) => ({
    id: name,
    input: { maxTokens: limits[Number(name.split('-').at(-1))] },
    output: { maxTokens: 2000 },
  }))
  const cognitive = { getModelDetails, generateText } as unknown as RuntimeCognitive
  const controller = new AbortController()
  const run = () => generateCode({ iteration, ctx, cognitive, controller }).catch((error: unknown) => error)
  return { run, ctx, controller, generateText }
}

function response(stopReason: 'stop' | 'other' = 'stop'): CognitiveResponse {
  return {
    output: '■start\n■run\nreturn 42;\n■end',
    metadata: {
      provider: 'test',
      model: 'model-0',
      stopReason,
      cost: 0,
      usage: { inputTokens: 10, outputTokens: 10, inputCost: 0, outputCost: 0 },
    },
  }
}

describe('request budgets', () => {
  it('rejects text beyond the real model limit, even when the model window is below 8000', async () => {
    const probe = fixture('ordinary text '.repeat(1000), [1000])
    await probe.run()
    expect(probe.generateText).not.toHaveBeenCalled()
  })

  it('fits the smallest explicitly configured fallback model', async () => {
    const probe = fixture('ordinary text '.repeat(1000), [32_000, 1000])
    await probe.run()
    expect(probe.generateText).not.toHaveBeenCalled()
  })

  it('allows a short prompt with a 1000-token configured context cap', async () => {
    const probe = fixture('Hello')
    probe.ctx.maxTokens = 1000
    await probe.run()
    expect(probe.generateText).toHaveBeenCalledOnce()
  })

  it.each(['image', 'audio'] as const)('does not tokenize base64 %s transport bytes as text', async (type) => {
    const url = `data:${type}/${type === 'image' ? 'png' : 'wav'};base64,${'AQID'.repeat(4000)}`
    const probe = fixture([
      { type: 'text', text: 'Describe this attachment.' },
      { type, url },
    ])
    probe.ctx.maxTokens = 4000
    await probe.run()
    expect(probe.generateText).toHaveBeenCalledOnce()
    expect(probe.generateText.mock.calls[0]?.[0].messages[0]?.content).toContainEqual({ type, url })
  })

  it('still counts media-looking text as text', async () => {
    const probe = fixture('data:image/png;base64,' + 'AQID'.repeat(4000))
    probe.ctx.maxTokens = 4000
    await probe.run()
    expect(probe.generateText).not.toHaveBeenCalled()
  })

  it('counts text parts in multipart messages against the context limit', async () => {
    const probe = fixture([{ type: 'text', text: 'ordinary text '.repeat(4000) }])
    probe.ctx.maxTokens = 4000
    await probe.run()
    expect(probe.generateText).not.toHaveBeenCalled()
  })

  it('rejects an abnormal stop reason before accepting an otherwise valid response', async () => {
    const probe = fixture('Compute a result')
    probe.generateText.mockResolvedValue(response('other'))
    expect(await probe.run()).toBeInstanceOf(Error)
  })

  it('accepts the same response after a normal stop', async () => {
    const probe = fixture('Compute a result')
    probe.generateText.mockResolvedValue(response())
    expect(await probe.run()).toBeUndefined()
  })

  it('rejects a non-streaming response when the caller aborted during generation', async () => {
    const probe = fixture('Compute a result')
    probe.generateText.mockImplementation(async () => {
      probe.controller.abort(new Error('Caller cancelled'))
      return response()
    })
    expect(await probe.run()).toBeInstanceOf(Error)
  })
})
