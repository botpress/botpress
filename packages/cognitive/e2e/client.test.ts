import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Cognitive } from '../src/client'
import { getTestClient } from './client'
import MODELS from './models.json'
import { RemoteModelProvider } from '../src/models'
import { GenerateContentOutput } from '../src/llm'

const RandomResponse = {
  output: {
    botpress: { cost: 123 },
    choices: [{ role: 'assistant', content: 'This is the LLM response', stopReason: 'stop', index: 1 }],
    id: '123456',
    model: '',
    provider: '',
    usage: { inputCost: 1, inputTokens: 2, outputCost: 3, outputTokens: 4 },
  } satisfies GenerateContentOutput,
  meta: {},
} as const

// Simple mock for the provider
class MockProvider extends RemoteModelProvider {
  fetchModelPreferences = vi.fn().mockResolvedValue(null)
  fetchInstalledModels = vi.fn().mockResolvedValue(MODELS)
  saveModelPreferences = vi.fn().mockResolvedValue(void 0)
}

class TestClient {
  callAction = vi.fn().mockImplementation(() => {
    if (this.axiosInstance.defaults?.signal?.aborted) {
      throw this.axiosInstance.defaults?.signal.reason ?? 'Aborted'
    }
    return Promise.resolve(RandomResponse)
  })
  getBot = vi.fn()
  getFile = vi.fn()
  axiosInstance = {
    defaults: { signal: new AbortController().signal },
  }
  config = { headers: { 'x-bot-id': 'test' } }
  clone = () => this
}

describe('constructor', () => {
  test('valid client', () => {
    // Just check that no error is thrown
    const provider = new MockProvider(getTestClient())
    expect(() => new Cognitive({ client: getTestClient(), provider })).not.toThrow()
  })
})

describe('client', () => {
  let bp: TestClient
  let client: Cognitive
  let provider: MockProvider

  beforeEach(() => {
    vi.clearAllMocks()
    bp = new TestClient()
    provider = new MockProvider(bp)
    client = new Cognitive({ client: bp, provider })
  })

  describe('predict (request)', () => {
    test('fetches models when preferences are not available and saves the preferences', async () => {
      await client.generateContent({ messages: [], model: 'best' })
      expect(provider.fetchModelPreferences).toHaveBeenCalled()
      expect(provider.fetchInstalledModels).toHaveBeenCalled()
      expect(provider.saveModelPreferences).toHaveBeenCalled()
    })

    test('fetches model preferences the first time generateContent is called', async () => {
      await client.generateContent({ messages: [], model: 'fast' })
      // fetchInstalledModels is called because fetchModelPreferences returned null
      expect(provider.fetchInstalledModels).toHaveBeenCalledTimes(1)
      // A second call won't fetch again if preferences are cached
      await client.generateContent({ messages: [], model: 'fast' })
      expect(provider.fetchInstalledModels).toHaveBeenCalledTimes(1)
    })
  })

  describe('predict (fallback)', () => {
    test('when model is unavailable, registers the downtime, saves it, and selects another model', async () => {
      client = new Cognitive({ client: bp, provider })

      bp.callAction.mockRejectedValueOnce({
        isApiError: true,
        code: 400,
        id: '123',
        type: 'Runtime',
        metadata: { subtype: 'UPSTREAM_PROVIDER_FAILED' },
      })

      provider.fetchModelPreferences.mockResolvedValue({
        best: ['a:a', 'b:b'],
      })

      // First generate call triggers fallback
      await client.generateContent({ messages: [], model: 'a:a' })

      expect(bp.callAction).toHaveBeenCalledTimes(2)
      expect(provider.saveModelPreferences).toHaveBeenCalledOnce()
      expect(provider.saveModelPreferences.mock.calls[0]?.[0].best).toMatchObject(['a:a', 'b:b'])
      expect(provider.saveModelPreferences.mock.calls[0]?.[0].downtimes[0].ref).toBe('a:a')
    })
  })

  describe('predict (abort)', () => {
    test('abort request', async () => {
      const ac = new AbortController()
      ac.abort('Manual abort')

      await expect(client.generateContent({ messages: [], signal: ac.signal })).rejects.toMatch('Manual abort')
    })
  })

  describe('predict (response)', () => {
    test('request cost and metrics are returned', async () => {
      const resp = await client.generateContent({ messages: [] })
      expect(resp.meta.cost.input).toBe(1)
      expect(resp.meta.cost.output).toBe(3)
      expect(resp.meta.tokens.input).toBe(2)
      expect(resp.meta.tokens.output).toBe(4)
      expect(resp.output.choices[0]?.content).toBe('This is the LLM response')
    })
  })
})
