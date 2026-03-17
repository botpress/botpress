import { describe, test, expect, vi, beforeEach, type Mock } from 'vitest'
import { Cognitive } from './client'
import { RemoteModelProvider } from './models'
import { GenerateContentOutput } from './schemas.gen'

vi.mock('./cognitive-v2', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    CognitiveBeta: vi.fn(),
  }
})

import { CognitiveBeta } from './cognitive-v2'

const CognitiveBetaMock = CognitiveBeta as unknown as Mock

const INTEGRATION_RESPONSE = {
  output: {
    botpress: { cost: 0.003 },
    choices: [{ role: 'assistant', content: 'integration response', stopReason: 'stop', index: 0 }],
    id: 'int-123',
    model: 'gpt-4o',
    provider: 'openai',
    usage: { inputCost: 0.001, inputTokens: 100, outputCost: 0.002, outputTokens: 50 },
  } satisfies GenerateContentOutput,
  meta: {},
} as const

const V2_RESPONSE = {
  output: 'v2 response',
  metadata: {
    provider: 'openai',
    model: 'gpt-5',
    usage: { inputTokens: 80, inputCost: 0.001, outputTokens: 40, outputCost: 0.002 },
    cost: 0.003,
    cached: false,
    latency: 200,
    stopReason: 'stop' as const,
  },
}

class MockProvider extends RemoteModelProvider {
  fetchModelPreferences = vi
    .fn()
    .mockResolvedValue({ best: ['openai:gpt-4o'], fast: ['openai:gpt-4o-mini'], downtimes: [] })
  fetchInstalledModels = vi.fn().mockResolvedValue([
    {
      ref: 'openai:gpt-4o',
      id: 'gpt-4o',
      name: 'gpt-4o',
      integration: 'openai',
      input: { maxTokens: 128000 },
      output: { maxTokens: 16384 },
    },
    {
      ref: 'openai:gpt-4o-mini',
      id: 'gpt-4o-mini',
      name: 'gpt-4o-mini',
      integration: 'openai',
      input: { maxTokens: 128000 },
      output: { maxTokens: 16384 },
    },
    {
      ref: 'azure-openai:my-gpt4',
      id: 'my-gpt4',
      name: 'my-gpt4',
      integration: 'azure-openai',
      input: { maxTokens: 128000 },
      output: { maxTokens: 16384 },
    },
  ])
  saveModelPreferences = vi.fn().mockResolvedValue(void 0)
}

class TestClient {
  callAction = vi.fn().mockResolvedValue(INTEGRATION_RESPONSE)
  getBot = vi.fn()
  getFile = vi.fn()
  axiosInstance = { defaults: { signal: new AbortController().signal } }
  config = { headers: { 'x-bot-id': 'test' } }
  clone = () => this
}

function mockBetaClient(overrides: { generateText?: Mock; listModels?: Mock } = {}) {
  const instance = {
    generateText: overrides.generateText ?? vi.fn().mockResolvedValue(V2_RESPONSE),
    listModels: overrides.listModels ?? vi.fn().mockResolvedValue([]),
    on: vi.fn(),
  }
  CognitiveBetaMock.mockReturnValue(instance)
  return instance
}

describe('generateContent routing', () => {
  let bp: TestClient
  let provider: MockProvider

  beforeEach(() => {
    vi.clearAllMocks()
    bp = new TestClient()
    provider = new MockProvider(bp)
  })

  test('useBeta=false always uses integration path', async () => {
    const betaInstance = mockBetaClient()
    const client = new Cognitive({ client: bp, provider, __experimental_beta: false })

    await client.generateContent({ messages: [{ role: 'user', content: 'hi' }], model: 'openai:gpt-4o' })

    expect(betaInstance.generateText).not.toHaveBeenCalled()
    expect(bp.callAction).toHaveBeenCalled()
  })

  test('useBeta=true + known v2 provider uses v2 path', async () => {
    const betaInstance = mockBetaClient()
    const client = new Cognitive({ client: bp, provider, __experimental_beta: true })

    const result = await client.generateContent({ messages: [{ role: 'user', content: 'hi' }], model: 'openai:gpt-5' })

    expect(betaInstance.generateText).toHaveBeenCalled()
    expect(bp.callAction).not.toHaveBeenCalled()
    expect(result.output.choices[0]?.content).toBe('v2 response')
  })

  test('useBeta=true + custom/unknown provider skips v2, uses integration', async () => {
    const betaInstance = mockBetaClient()
    const client = new Cognitive({ client: bp, provider, __experimental_beta: true })

    await client.generateContent({ messages: [{ role: 'user', content: 'hi' }], model: 'azure-openai:my-gpt4' })

    expect(betaInstance.generateText).not.toHaveBeenCalled()
    expect(bp.callAction).toHaveBeenCalled()
  })

  test('useBeta=true + no model uses v2 path', async () => {
    const betaInstance = mockBetaClient()
    const client = new Cognitive({ client: bp, provider, __experimental_beta: true })

    await client.generateContent({ messages: [{ role: 'user', content: 'hi' }] })

    expect(betaInstance.generateText).toHaveBeenCalled()
    expect(bp.callAction).not.toHaveBeenCalled()
  })

  test.each(['auto', 'best', 'fast'] as const)('useBeta=true + special tag "%s" uses v2 path', async (tag) => {
    const betaInstance = mockBetaClient()
    const client = new Cognitive({ client: bp, provider, __experimental_beta: true })

    await client.generateContent({ messages: [{ role: 'user', content: 'hi' }], model: tag as any })

    expect(betaInstance.generateText).toHaveBeenCalled()
    expect(bp.callAction).not.toHaveBeenCalled()
  })

  test('useBeta=true + v2 fails falls back to integration', async () => {
    const betaInstance = mockBetaClient({
      generateText: vi.fn().mockRejectedValue(new Error('v2 is down')),
    })
    const client = new Cognitive({ client: bp, provider, __experimental_beta: true })

    const result = await client.generateContent({ messages: [{ role: 'user', content: 'hi' }], model: 'openai:gpt-5' })

    expect(betaInstance.generateText).toHaveBeenCalled()
    expect(bp.callAction).toHaveBeenCalled()
    expect(result.output.choices[0]?.content).toBe('integration response')
  })

  test('useBeta=true + aborted signal does not fall back', async () => {
    mockBetaClient({
      generateText: vi.fn().mockRejectedValue(new Error('aborted')),
    })
    const client = new Cognitive({ client: bp, provider, __experimental_beta: true })

    const ac = new AbortController()
    ac.abort('Manual abort')

    await expect(
      client.generateContent({ messages: [{ role: 'user', content: 'hi' }], model: 'openai:gpt-5', signal: ac.signal })
    ).rejects.toThrow()
    expect(bp.callAction).not.toHaveBeenCalled()
  })

  test('v2 fallback does not send mutated input to integration path', async () => {
    mockBetaClient({
      generateText: vi.fn().mockRejectedValue(new Error('v2 is down')),
    })
    const client = new Cognitive({ client: bp, provider, __experimental_beta: true })

    const input = {
      messages: [{ role: 'user' as const, content: 'hi' }],
      model: 'openai:gpt-5',
      systemPrompt: 'You are helpful',
    } as any

    await client.generateContent(input)

    // Original input should still have systemPrompt (not mutated by v2 path)
    expect(input.systemPrompt).toBe('You are helpful')
    expect(input.messages).toHaveLength(1)
  })
})

describe('getModelDetails routing', () => {
  let bp: TestClient
  let provider: MockProvider

  beforeEach(() => {
    vi.clearAllMocks()
    bp = new TestClient()
    provider = new MockProvider(bp)
  })

  test('useBeta=true + model in static registry returns instantly without remote fetch', async () => {
    const betaInstance = mockBetaClient()
    const client = new Cognitive({ client: bp, provider, __experimental_beta: true })

    // 'openai:gpt-4o-2024-11-20' is in the static registry
    const details = await client.getModelDetails('openai:gpt-4o-2024-11-20')

    expect(details.integration).toBe('cognitive-v2')
    expect(details.id).toBe('openai:gpt-4o-2024-11-20')
    expect(betaInstance.listModels).not.toHaveBeenCalled()
    expect(provider.fetchInstalledModels).not.toHaveBeenCalled()
  })

  test('useBeta=true + model not in static registry fetches remote models', async () => {
    const betaInstance = mockBetaClient({
      listModels: vi.fn().mockResolvedValue([
        {
          id: 'openai:gpt-6',
          name: 'GPT-6',
          description: 'Next gen',
          tags: ['recommended'],
          input: { maxTokens: 200000, costPer1MTokens: 5 },
          output: { maxTokens: 32000, costPer1MTokens: 15 },
          lifecycle: 'production',
        },
      ]),
    })
    const client = new Cognitive({ client: bp, provider, __experimental_beta: true })

    const details = await client.getModelDetails('openai:gpt-6')

    expect(betaInstance.listModels).toHaveBeenCalledOnce()
    expect(details.id).toBe('openai:gpt-6')
    expect(details.integration).toBe('cognitive-v2')
    expect(details.input.maxTokens).toBe(200000)
  })

  test('useBeta=true + remote model with alias is findable by alias', async () => {
    mockBetaClient({
      listModels: vi.fn().mockResolvedValue([
        {
          id: 'fireworks-ai:deepseek-v4',
          name: 'DeepSeek V4',
          description: 'Deep',
          aliases: ['fireworks-ai:accounts/fireworks/models/deepseek-v4'],
          tags: [],
          input: { maxTokens: 128000, costPer1MTokens: 1 },
          output: { maxTokens: 16384, costPer1MTokens: 2 },
          lifecycle: 'production',
        },
      ]),
    })
    const client = new Cognitive({ client: bp, provider, __experimental_beta: true })

    const details = await client.getModelDetails('fireworks-ai:accounts/fireworks/models/deepseek-v4')

    expect(details.id).toBe('fireworks-ai:deepseek-v4')
    expect(details.integration).toBe('cognitive-v2')
  })

  test('useBeta=true + remote fetch fails falls through to integration path', async () => {
    mockBetaClient({
      listModels: vi.fn().mockRejectedValue(new Error('network error')),
    })
    const client = new Cognitive({ client: bp, provider, __experimental_beta: true })

    // Use a model NOT in the static registry so it actually tries remote fetch
    const details = await client.getModelDetails('azure-openai:my-gpt4')

    expect(details.integration).toBe('azure-openai')
    expect(provider.fetchInstalledModels).toHaveBeenCalled()
  })

  test('useBeta=true + remote cache warm does not re-fetch', async () => {
    const betaInstance = mockBetaClient({
      listModels: vi.fn().mockResolvedValue([
        {
          id: 'openai:gpt-6',
          name: 'GPT-6',
          description: 'Next gen',
          tags: [],
          input: { maxTokens: 200000, costPer1MTokens: 5 },
          output: { maxTokens: 32000, costPer1MTokens: 15 },
          lifecycle: 'production',
        },
      ]),
    })
    const client = new Cognitive({ client: bp, provider, __experimental_beta: true })

    await client.getModelDetails('openai:gpt-6')
    await client.getModelDetails('openai:gpt-6')

    expect(betaInstance.listModels).toHaveBeenCalledOnce()
  })

  test('useBeta=false always uses integration path', async () => {
    const betaInstance = mockBetaClient()
    const client = new Cognitive({ client: bp, provider, __experimental_beta: false })

    const details = await client.getModelDetails('openai:gpt-4o')

    expect(betaInstance.listModels).not.toHaveBeenCalled()
    expect(details.integration).toBe('openai')
    expect(provider.fetchInstalledModels).toHaveBeenCalled()
  })
})
