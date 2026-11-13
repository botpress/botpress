import { Cognitive, CognitiveResponse } from '@botpress/cognitive'
import { describe, expect, test, vi, type Mock } from 'vitest'

import { Zai } from '../src'

// Offline test: stubs the cognitive client so no network calls are made.
// Asserts that Zai forwards `skipCache` on the request `options` only when enabled,
// so default request bodies stay unchanged.

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

const makeZai = (skipCache?: boolean) => {
  const cognitive = new Cognitive({ botId: 'test', token: 'test-token' })
  const generateText = vi.fn().mockResolvedValue(V2_RESPONSE)
  cognitive.generateText = generateText
  cognitive.clone = () => cognitive
  const zai = new Zai({ client: cognitive, modelId: 'openai:gpt-4o', skipCache })
  return { generateText, zai }
}

const lastCallOptions = (generateText: Mock) => generateText.mock.lastCall?.[0]?.options

describe('skipCache forwarding', { timeout: 10_000, retry: 0 }, () => {
  test('skipCache from config is sent on the request options', async () => {
    const { generateText, zai } = makeZai(true)

    await zai.text('say hi')

    expect(lastCallOptions(generateText)).toEqual({ skipCache: true })
  })

  test('with() scopes skipCache to the derived instance', async () => {
    const { generateText, zai } = makeZai()

    await zai.with({ skipCache: true }).text('say hi')
    expect(lastCallOptions(generateText)).toEqual({ skipCache: true })

    await zai.text('say hi')
    expect(lastCallOptions(generateText)).toBeUndefined()
  })

  test('no skipCache configured sends no options', async () => {
    const { generateText, zai } = makeZai()

    await zai.text('say hi')

    expect(generateText).toHaveBeenCalled()
    expect(lastCallOptions(generateText)).toBeUndefined()
  })
})
