import type { CognitiveRequest, CognitiveResponse, CognitiveStreamChunk } from '@botpress/cognitive'
import { describe, expect, it, vi } from 'vitest'

import type { Context, Iteration } from '../context.js'
import { MAX_PREAMBLE_LENGTH, MAX_TRAILER_LENGTH } from '../message-stream/response-parser.js'
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
  const iterations: Iteration[] = []
  const ctx = { version: DualModePrompt, iterations } as Context
  const generateText = vi.fn(async (_input: CognitiveRequest): Promise<CognitiveResponse> => {
    throw new Error('Provider boundary reached')
  })
  const getModelDetails = vi.fn(async (name: string) => ({
    id: name,
    input: { maxTokens: limits[Number(name.split('-').at(-1))], costPer1MTokens: 1 },
    // Each fallback model has its own output price: model-0 costs 1, model-1 costs 2, ...
    output: { maxTokens: 2000, costPer1MTokens: Number(name.split('-').at(-1)) + 1 },
  }))
  const cognitive = { getModelDetails, generateText } as unknown as RuntimeCognitive
  const controller = new AbortController()
  const run = () => generateCode({ iteration, ctx, cognitive, controller }).catch((error: unknown) => error)
  return { run, ctx, controller, generateText, cognitive, iteration }
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

const metadata = {
  provider: 'test',
  model: 'model-0',
  stopReason: 'stop' as const,
  cost: 0,
  usage: { inputTokens: 10, outputTokens: 10, inputCost: 0, outputCost: 0 },
}

/** Streams `head`, then keeps writing `junk` until the client closes the stream. */
function streaming(head: string, junk?: string, tail?: CognitiveStreamChunk, limits?: number[]) {
  const probe = fixture('Compute a result', limits)
  let reads = 0
  async function* stream(signal: AbortSignal): AsyncGenerator<CognitiveStreamChunk> {
    if (limits && limits.length > 1) {
      yield { created: 0, output: '■start\n■run\nreturn' }
      yield {
        created: 0,
        restart: { attempt: 2, fromModel: 'model-0', toModel: 'model-1', reason: 'first model failed' },
      }
    }
    yield { created: 0, output: head }
    if (tail) {
      yield tail
      return
    }
    while (!signal.aborted) {
      if (!junk) {
        // A provider that stopped writing but never closed the connection.
        await new Promise((resolve) => signal.addEventListener('abort', resolve))
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 1))
      reads++
      yield { created: reads, output: junk }
    }
  }
  Object.assign(probe.cognitive, {
    generateTextStream: (_input: CognitiveRequest, { signal }: { signal: AbortSignal }) => stream(signal),
  })
  return { ...probe, reads: () => reads }
}

describe('streams that ignore the ■end stop sequence', () => {
  const envelope = '■start\n■run\nreturn 42;\n■end'

  it('keeps the provider metadata when the stream ends after ■end', async () => {
    const probe = streaming(`${envelope}\n`, undefined, { created: 1, output: '', metadata })
    expect(await probe.run()).toBeUndefined()
    expect(probe.iteration.llm).toMatchObject({ status: 'success', model: 'test:model-0' })
  })

  it('stops reading junk after ■end and estimates usage', async () => {
    const probe = streaming(envelope, '\\\n'.repeat(50))
    expect(await probe.run()).toBeUndefined()
    expect(probe.iteration.code).toContain('return 42')
    expect(probe.iteration.llm).toMatchObject({ status: 'success' })
    expect(probe.iteration.llm!.usage.inputTokens).toBeGreaterThan(0)
    expect(probe.iteration.llm!.usage.outputTokens).toBeGreaterThan(0)
    expect(probe.iteration.llm!.diagnostics).toContainEqual(
      expect.objectContaining({ message: 'Discarded content after ■end' })
    )
    expect(probe.reads()).toBeLessThan(MAX_TRAILER_LENGTH / 100 + 5)
  })

  it('estimates usage with the model that survived a fallback restart', async () => {
    const probe = streaming(envelope, '\\\n'.repeat(50), undefined, [32_000, 32_000])
    probe.ctx.midStreamFallback = true
    expect(await probe.run()).toBeUndefined()
    const { usage } = probe.iteration.llm!
    expect(probe.iteration.llm!.model).toContain('model-1')
    expect(usage.outputCost).toBeCloseTo((usage.outputTokens * 2) / 1_000_000)
  })

  it('stops waiting for a stream that goes silent after ■end', async () => {
    const probe = streaming(envelope)
    const startedAt = Date.now()
    expect(await probe.run()).toBeUndefined()
    expect(Date.now() - startedAt).toBeLessThan(5_000)
    expect(probe.iteration.code).toContain('return 42')
  })

  it('gives up on junk that never opens the envelope', async () => {
    const probe = streaming('', 'junk '.repeat(100))
    expect(await probe.run()).toBeUndefined()
    expect(probe.iteration.code).toBeUndefined()
    expect(probe.iteration.llm!.diagnostics).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('no response envelope within') })
    )
    expect(probe.reads()).toBeLessThan(MAX_PREAMBLE_LENGTH / 500 + 5)
  })
})
