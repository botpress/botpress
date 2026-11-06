import { describe, test, expect, vi } from 'vitest'
import { Cognitive } from './index'

const setup = (post: ReturnType<typeof vi.fn>) => {
  const cognitive = new Cognitive({ apiUrl: 'http://x' })
  ;(cognitive as any)._httpClient = { post }
  const events = { request: vi.fn(), response: vi.fn(), error: vi.fn() }
  cognitive.on('request', events.request)
  cognitive.on('response', events.response)
  cognitive.on('error', events.error)
  return { cognitive, events }
}

const input = { input: 'I was charged twice', labels: [{ name: 'billing' }, { name: 'support' }] }

describe('Cognitive.classify', () => {
  test('posts to /v2/cognitive/classify and emits request/response events', async () => {
    const data = { output: { label: 'billing', confidence: 0.9, scores: [] }, metadata: { backend: 'jev' } }
    const { cognitive, events } = setup(vi.fn().mockResolvedValue({ data }))

    await expect(cognitive.classify(input)).resolves.toEqual(data)
    expect((cognitive as any)._httpClient.post).toHaveBeenCalledWith(
      '/v2/cognitive/classify',
      input,
      expect.any(Object)
    )
    expect(events.request).toHaveBeenCalledWith({ type: 'classify', input })
    expect(events.response).toHaveBeenCalledWith({ type: 'classify', input }, data)
  })

  test('emits an error event when the call rejects', async () => {
    const { cognitive, events } = setup(vi.fn().mockRejectedValue(new Error('boom')))

    await expect(cognitive.classify(input)).rejects.toThrow('boom')
    expect(events.error).toHaveBeenCalledTimes(1)
  })
})
