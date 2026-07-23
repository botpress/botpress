import { Cognitive, CognitiveResponse } from '@botpress/cognitive'
import { describe, expect, test, vi, type Mock } from 'vitest'

import { Zai } from '../src'

// Offline test: stubs the cognitive client so no network calls are made.
// Asserts that Zai forwards its configured `metadata` on the request `meta`
// of every cognitive call, where it is recorded on usage events server-side.

const V2_RESPONSE: CognitiveResponse = {
  output: 'generated text',
  metadata: {
    provider: 'openai',
    model: 'gpt-4o',
    usage: { inputTokens: 100, inputCost: 0.001, outputTokens: 50, outputCost: 0.002 },
    cost: 0.003,
    cached: false,
    latency: 5,
  },
}

const makeZai = (metadata?: Record<string, string>) => {
  const cognitive = new Cognitive({ botId: 'test', token: 'test-token' })
  const generateText = vi.fn().mockResolvedValue(V2_RESPONSE)
  cognitive.generateText = generateText
  cognitive.clone = () => cognitive
  const zai = new Zai({ client: cognitive, modelId: 'openai:gpt-4o', metadata })
  return { generateText, zai }
}

const lastCallMeta = (generateText: Mock) => generateText.mock.lastCall?.[0]?.meta

describe('metadata forwarding', { timeout: 10_000, retry: 0 }, () => {
  test('metadata from config is sent on the request meta', async () => {
    const { generateText, zai } = makeZai({ conversationId: 'conv_123', channel: 'webchat' })

    await zai.text('say hi')

    expect(generateText).toHaveBeenCalled()
    expect(lastCallMeta(generateText)).toMatchObject({
      integrationName: 'zai',
      metadata: { conversationId: 'conv_123', channel: 'webchat' },
    })
  })

  test('with() scopes metadata to the derived instance', async () => {
    const { generateText, zai } = makeZai()

    await zai.with({ metadata: { conversationId: 'conv_456' } }).text('say hi')
    expect(lastCallMeta(generateText)?.metadata).toEqual({ conversationId: 'conv_456' })
  })

  test('no metadata configured sends none', async () => {
    const { generateText, zai } = makeZai()

    await zai.text('say hi')

    expect(generateText).toHaveBeenCalled()
    expect(lastCallMeta(generateText)?.metadata).toBeUndefined()
  })
})
