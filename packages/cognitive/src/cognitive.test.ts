import { describe, expect, test, vi } from 'vitest'
import { Cognitive } from './index'

describe('Cognitive constructor', () => {
  test('accepts raw props', () => {
    const cognitive = new Cognitive({ apiUrl: 'http://x', botId: 'bot', token: 'tok' })
    expect(Cognitive.isCognitiveClient(cognitive)).toBe(true)
  })

  test('derives configuration from a botpress client', () => {
    const client = {
      callAction: async () => ({}),
      config: {
        apiUrl: 'http://from-client',
        headers: { authorization: 'Bearer tok', 'x-bot-id': 'bot-123' },
        timeout: 12_345,
      },
    }

    const cognitive = new Cognitive({ client })
    expect(cognitive.client).toBe(client)

    const clientOfClone = cognitive.clone().client
    expect(clientOfClone).toBe(client)
  })

  test('unwraps clients nested under _client (sdk-style wrappers)', () => {
    const inner = {
      callAction: async () => ({}),
      config: { apiUrl: 'http://inner', headers: { 'x-bot-id': 'bot' } },
    }

    expect(() => new Cognitive({ client: { _client: inner } })).not.toThrow()
  })

  test('rejects objects that are not botpress clients', () => {
    expect(() => new Cognitive({ client: { foo: 'bar' } })).toThrow(/valid instance/)
  })

  test('recognizes pre-1.0 beta instances via the brand', () => {
    const beta = { ['$$IS_COGNITIVE_BETA']: 'v2' }
    expect(Cognitive.isCognitiveClient(beta)).toBe(true)
    expect(Cognitive.isBetaClient(beta)).toBe(true)
    expect(Cognitive.isCognitiveClient({})).toBe(false)
  })
})

describe('getModelDetails', () => {
  test('resolves well-known models from the static table without network', async () => {
    const cognitive = new Cognitive({ apiUrl: 'http://x' })
    const model = await cognitive.getModelDetails('openai:gpt-4o')
    expect(model.input.maxTokens).toBeGreaterThan(0)
    expect(model.output.maxTokens).toBeGreaterThan(0)
  })

  test('resolves special selectors (auto/best/fast)', async () => {
    const cognitive = new Cognitive({ apiUrl: 'http://x' })
    const model = await cognitive.getModelDetails('auto')
    expect(model.id).toBe('auto')
    expect(model.input.maxTokens).toBeGreaterThan(0)
  })

  test('falls back to a permissive default for unknown models', async () => {
    const cognitive = new Cognitive({ apiUrl: 'http://x' })
    ;(cognitive as any)._httpClient = { get: vi.fn().mockRejectedValue(new Error('offline')) }

    const model = await cognitive.getModelDetails('some:unknown-model')
    expect(model.id).toBe('some:unknown-model')
    expect(model.input.maxTokens).toBe(128_000)
  })

  test('resolves unknown models from the live model list when available', async () => {
    const cognitive = new Cognitive({ apiUrl: 'http://x' })
    const remote = {
      id: 'newprovider:new-model',
      name: 'New Model',
      description: '',
      tags: [],
      lifecycle: 'production',
      aliases: ['new-model-alias'],
      input: { maxTokens: 42_000, costPer1MTokens: 1 },
      output: { maxTokens: 9_000, costPer1MTokens: 2 },
    }
    ;(cognitive as any)._httpClient = { get: vi.fn().mockResolvedValue({ data: { models: [remote] } }) }

    const model = await cognitive.getModelDetails('newprovider:new-model')
    expect(model.input.maxTokens).toBe(42_000)

    const viaAlias = await cognitive.getModelDetails('new-model-alias')
    expect(viaAlias.id).toBe('newprovider:new-model')
  })
})

describe('generateText systemPrompt migration', () => {
  test('systemPrompt becomes a leading system message', async () => {
    const cognitive = new Cognitive({ apiUrl: 'http://x' })
    const post = vi.fn().mockResolvedValue({
      data: {
        output: 'ok',
        metadata: {
          provider: 'p',
          model: 'm',
          usage: { inputTokens: 1, inputCost: 0, outputTokens: 1, outputCost: 0 },
          cost: 0,
        },
      },
    })
    ;(cognitive as any)._httpClient = { post }

    await cognitive.generateText({
      systemPrompt: 'be nice',
      messages: [{ role: 'user', content: 'hi' }],
    })

    const body = post.mock.lastCall?.[1]
    expect(body.systemPrompt).toBeUndefined()
    expect(body.messages).toEqual([
      { role: 'system', content: 'be nice' },
      { role: 'user', content: 'hi' },
    ])
  })

  test('systemPrompt merges into an existing leading system message', async () => {
    const cognitive = new Cognitive({ apiUrl: 'http://x' })
    const post = vi.fn().mockResolvedValue({
      data: {
        output: 'ok',
        metadata: {
          provider: 'p',
          model: 'm',
          usage: { inputTokens: 1, inputCost: 0, outputTokens: 1, outputCost: 0 },
          cost: 0,
        },
      },
    })
    ;(cognitive as any)._httpClient = { post }

    await cognitive.generateText({
      systemPrompt: 'be nice',
      messages: [
        { role: 'system', content: 'be concise' },
        { role: 'user', content: 'hi' },
      ],
    })

    const body = post.mock.lastCall?.[1]
    expect(body.systemPrompt).toBeUndefined()
    expect(body.messages).toEqual([
      { role: 'system', content: 'be nice\n\nbe concise' },
      { role: 'user', content: 'hi' },
    ])
  })
})
