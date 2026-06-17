import { describe, test, expect, vi } from 'vitest'
import { CognitiveBeta } from './index'
import { cognitiveFromBeta, buildResponseFromBetaMetadata } from './adapter'
import type { CognitiveMetadata } from './types'

const METADATA: CognitiveMetadata = {
  provider: 'openai',
  model: 'openai:gpt-5',
  usage: { inputTokens: 80, inputCost: 0.001, outputTokens: 40, outputCost: 0.002 },
  cost: 0.003,
  cached: false,
  latency: 200,
  stopReason: 'stop',
}

const streamFromChunks = (chunks: string[], metadata: CognitiveMetadata = METADATA) =>
  vi.fn(async function* () {
    for (const c of chunks) {
      yield { output: c, created: 0 }
    }
    yield { output: '', created: 0, finished: true, metadata }
  })

// A fake beta client exposing only the 3 methods the adapter uses, so we can
// assert the adapter never reaches for anything else (no v1 surface).
function fakeBeta(
  overrides: {
    generateText?: ReturnType<typeof vi.fn>
    generateTextStream?: ReturnType<typeof vi.fn>
    listModels?: ReturnType<typeof vi.fn>
  } = {}
) {
  return {
    generateText: overrides.generateText ?? vi.fn().mockResolvedValue({ output: 'pong', metadata: METADATA }),
    generateTextStream: overrides.generateTextStream ?? streamFromChunks(['po', 'ng']),
    listModels: overrides.listModels ?? vi.fn().mockResolvedValue([]),
  } as unknown as CognitiveBeta
}

describe('CognitiveBeta.isBetaClient', () => {
  test('true for a real CognitiveBeta instance', () => {
    const beta = new CognitiveBeta({ token: 't', botId: 'b' })
    expect(CognitiveBeta.isBetaClient(beta)).toBe(true)
  })

  test('survives clone()', () => {
    const beta = new CognitiveBeta({ token: 't', botId: 'b' })
    expect(CognitiveBeta.isBetaClient(beta.clone())).toBe(true)
  })

  test('does not use instanceof — a structural copy with the brand passes', () => {
    // Simulates a CognitiveBeta from a duplicated copy of the package.
    const fromOtherCopy = { ['$$IS_COGNITIVE_BETA']: 'v2' }
    expect(CognitiveBeta.isBetaClient(fromOtherCopy)).toBe(true)
  })

  test('false for plain objects / null / a lookalike without the brand', () => {
    expect(CognitiveBeta.isBetaClient({})).toBe(false)
    expect(CognitiveBeta.isBetaClient(null)).toBe(false)
    expect(CognitiveBeta.isBetaClient(undefined)).toBe(false)
    expect(CognitiveBeta.isBetaClient({ $$IS_COGNITIVE_BETA: true })).toBe(false)
  })
})

describe('buildResponseFromBetaMetadata', () => {
  test('maps output + metadata into the canonical Response shape', () => {
    const r = buildResponseFromBetaMetadata('hello', METADATA)
    expect(r.output.choices?.[0]?.content).toBe('hello')
    expect(r.output.model).toBe('openai:gpt-5')
    expect(r.output.usage.inputTokens).toBe(80)
    expect(r.output.usage.outputTokens).toBe(40)
    expect(r.meta?.cached).toBe(false)
  })
})

describe('cognitiveFromBeta — generation', () => {
  test('generateContent delegates to beta.generateText and shapes the response', async () => {
    const beta = fakeBeta()
    const cog = cognitiveFromBeta(beta)
    const res = await cog.generateContent({ model: 'best', messages: [{ role: 'user', content: 'ping' }] } as any)
    expect((beta as any).generateText).toHaveBeenCalledOnce()
    expect(res.output.choices?.[0]?.content).toBe('pong')
  })

  test('systemPrompt is folded into a leading system message', async () => {
    const beta = fakeBeta()
    const cog = cognitiveFromBeta(beta)
    await cog.generateContent({
      model: 'best',
      systemPrompt: 'be terse',
      messages: [{ role: 'user', content: 'hi' }],
    } as any)
    const sent = (beta as any).generateText.mock.calls[0][0]
    expect(sent.systemPrompt).toBeUndefined()
    expect(sent.messages[0]).toEqual({ role: 'system', content: 'be terse' })
    expect(sent.messages[1]).toEqual({ role: 'user', content: 'hi' })
  })

  test('generateContentStream yields deltas and returns the final Response', async () => {
    const beta = fakeBeta({ generateTextStream: streamFromChunks(['po', 'ng']) })
    const cog = cognitiveFromBeta(beta)
    const it = cog.generateContentStream({ model: 'best', messages: [{ role: 'user', content: 'x' }] } as any)
    let acc = ''
    let result
    for (;;) {
      const n = await it.next()
      if (n.done) {
        result = n.value
        break
      }
      acc += n.value.output ?? ''
    }
    expect(acc).toBe('pong')
    expect(result!.output.choices?.[0]?.content).toBe('pong')
  })
})

describe('cognitiveFromBeta — getModelDetails (v2-only, no v1)', () => {
  test('resolves best/fast/auto from the static table without hitting listModels', async () => {
    const beta = fakeBeta()
    const cog = cognitiveFromBeta(beta)
    const md = await cog.getModelDetails('best')
    expect(md.ref).toBe('best')
    expect(md.input.maxTokens).toBeGreaterThan(0)
    expect((beta as any).listModels).not.toHaveBeenCalled()
  })

  test('resolves a model the static table lacks from the live v2 list (e.g. Mercury)', async () => {
    const beta = fakeBeta({
      listModels: vi.fn().mockResolvedValue([
        {
          id: 'inception:mercury-2',
          name: 'Mercury 2',
          description: '',
          tags: [],
          lifecycle: 'preview',
          input: { maxTokens: 32_000, costPer1MTokens: 1 },
          output: { maxTokens: 8_000, costPer1MTokens: 1 },
        },
      ]),
    })
    const cog = cognitiveFromBeta(beta)
    const md = await cog.getModelDetails('inception:mercury-2')
    expect(md.ref).toBe('inception:mercury-2')
    expect(md.input.maxTokens).toBe(32_000)
    expect((beta as any).listModels).toHaveBeenCalledOnce()
  })

  test('returns a permissive default for an unknown model instead of throwing or falling back', async () => {
    const beta = fakeBeta({ listModels: vi.fn().mockResolvedValue([]) })
    const cog = cognitiveFromBeta(beta)
    const md = await cog.getModelDetails('some:unknown-model')
    expect(md.ref).toBe('some:unknown-model')
    expect(md.input.maxTokens).toBeGreaterThan(0)
  })

  test('survives a listModels failure with the permissive default (never throws to v1)', async () => {
    const beta = fakeBeta({ listModels: vi.fn().mockRejectedValue(new Error('network')) })
    const cog = cognitiveFromBeta(beta)
    const md = await cog.getModelDetails('xai:grok-9')
    expect(md.ref).toBe('xai:grok-9')
    expect(md.input.maxTokens).toBeGreaterThan(0)
  })
})
