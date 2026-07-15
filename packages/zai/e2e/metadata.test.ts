import { Cognitive, GenerateContentOutput, RemoteModelProvider } from '@botpress/cognitive'
import { describe, expect, test, vi } from 'vitest'

import { Zai } from '../src'

// Offline test: stubs the Botpress client so no network calls are made.
// Asserts that Zai forwards its configured `metadata` on the request `meta`
// of every cognitive call, where it is recorded on usage events server-side.

const INTEGRATION_RESPONSE = {
  output: {
    botpress: { cost: 0.003 },
    choices: [{ role: 'assistant', content: 'generated text', stopReason: 'stop', index: 0 }],
    id: 'int-123',
    model: 'gpt-4o',
    provider: 'openai',
    usage: { inputCost: 0.001, inputTokens: 100, outputCost: 0.002, outputTokens: 50 },
  } satisfies GenerateContentOutput,
  meta: {},
} as const

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
  ])
  saveModelPreferences = vi.fn().mockResolvedValue(void 0)
}

class StubBotpressClient {
  callAction = vi.fn().mockResolvedValue(INTEGRATION_RESPONSE)
  getBot = vi.fn()
  getFile = vi.fn()
  axiosInstance = { defaults: { signal: new AbortController().signal } }
  config = { headers: { 'x-bot-id': 'test' } }
  clone = () => this
}

const makeZai = (metadata?: Record<string, string>) => {
  const bp = new StubBotpressClient()
  const cognitive = new Cognitive({ client: bp as any, provider: new MockProvider(bp as any) })
  const zai = new Zai({ client: cognitive, modelId: 'openai:gpt-4o', metadata })
  return { bp, zai }
}

const lastCallMeta = (bp: StubBotpressClient) => bp.callAction.mock.lastCall?.[0]?.input?.meta

describe('metadata forwarding', { timeout: 10_000, retry: 0 }, () => {
  test('metadata from config is sent on the request meta', async () => {
    const { bp, zai } = makeZai({ conversationId: 'conv_123', channel: 'webchat' })

    await zai.text('say hi')

    expect(bp.callAction).toHaveBeenCalled()
    expect(lastCallMeta(bp)).toMatchObject({
      integrationName: 'zai',
      metadata: { conversationId: 'conv_123', channel: 'webchat' },
    })
  })

  test('with() scopes metadata to the derived instance', async () => {
    const { bp, zai } = makeZai()

    await zai.with({ metadata: { conversationId: 'conv_456' } }).text('say hi')
    expect(lastCallMeta(bp)?.metadata).toEqual({ conversationId: 'conv_456' })
  })

  test('no metadata configured sends none', async () => {
    const { bp, zai } = makeZai()

    await zai.text('say hi')

    expect(bp.callAction).toHaveBeenCalled()
    expect(lastCallMeta(bp)?.metadata).toBeUndefined()
  })
})
