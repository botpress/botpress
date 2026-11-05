import { describe, test, expect, vi } from 'vitest'
import { Cognitive } from './index'

const classifyResponse = {
  output: {
    label: 'billing',
    confidence: 0.92,
    scores: [
      { label: 'billing', probability: 0.92 },
      { label: 'support', probability: 0.08 },
    ],
  },
  metadata: {
    requestId: 'req_1',
    backend: 'jev',
    provider: 'typesafe',
    model: 'typesafe:jev-1.13.0',
    usage: { inputTokens: 42, outputTokens: 0 },
    cost: 0.0001,
    latency: 120,
  },
}

describe('Cognitive.classify', () => {
  test('POSTs to /v2/cognitive/classify and returns parsed body', async () => {
    const cognitive = new Cognitive({ apiUrl: 'http://x', botId: 'b', token: 't' })
    const post = vi.fn().mockResolvedValue({ data: classifyResponse })
    ;(cognitive as any)._httpClient = { post }

    const result = await cognitive.classify({
      input: 'I was charged twice this month',
      labels: [{ name: 'billing', description: 'Payments and invoices' }, { name: 'support' }],
      model: ['jev', 'fast'],
    })

    expect(post).toHaveBeenCalledWith(
      '/v2/cognitive/classify',
      expect.objectContaining({ input: 'I was charged twice this month', model: ['jev', 'fast'] }),
      expect.any(Object)
    )
    expect(result.output.label).toBe('billing')
    expect(result.output.confidence).toBe(0.92)
    expect(result.metadata.backend).toBe('jev')
  })

  test('emits request and response events around the call', async () => {
    const cognitive = new Cognitive({ apiUrl: 'http://x' })
    const post = vi.fn().mockResolvedValue({ data: classifyResponse })
    ;(cognitive as any)._httpClient = { post }

    const onRequest = vi.fn()
    const onResponse = vi.fn()
    cognitive.on('request', onRequest)
    cognitive.on('response', onResponse)

    await cognitive.classify({ input: 'hello', labels: [{ name: 'a' }, { name: 'b' }] })

    expect(onRequest).toHaveBeenCalledTimes(1)
    expect(onResponse).toHaveBeenCalledTimes(1)
    const [req] = onRequest.mock.calls[0]!
    expect(req.type).toBe('classify')
  })

  test('emits error event when the call rejects', async () => {
    const cognitive = new Cognitive({ apiUrl: 'http://x' })
    const post = vi.fn().mockRejectedValue(new Error('boom'))
    ;(cognitive as any)._httpClient = { post }

    const onError = vi.fn()
    cognitive.on('error', onError)

    await expect(cognitive.classify({ input: 'x', labels: [{ name: 'a' }, { name: 'b' }] })).rejects.toThrow('boom')
    expect(onError).toHaveBeenCalledTimes(1)
  })
})
