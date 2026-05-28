import { describe, test, expect, vi } from 'vitest'
import { CognitiveBeta } from './index'

describe('CognitiveBeta.generateImage', () => {
  test('POSTs to /v2/cognitive/generate-image and returns parsed body', async () => {
    const beta = new CognitiveBeta({ apiUrl: 'http://x', botId: 'b', token: 't' })
    const post = vi.fn().mockResolvedValue({
      data: {
        output: { imageUrl: 'https://x/abc.png' },
        metadata: { provider: 'openai', model: 'openai:gpt-image-1', size: '1024x1024', format: 'png', cost: 0.04 },
      },
    })
    ;(beta as any)._axiosClient = { post }

    const result = await beta.generateImage({ prompt: 'a corgi astronaut', size: '1024x1024' })

    expect(post).toHaveBeenCalledWith(
      '/v2/cognitive/generate-image',
      expect.objectContaining({ prompt: 'a corgi astronaut', size: '1024x1024' }),
      expect.any(Object)
    )
    expect(result.output.imageUrl).toBe('https://x/abc.png')
    expect(result.metadata.provider).toBe('openai')
    expect(result.metadata.format).toBe('png')
  })

  test('emits request and response events around the call', async () => {
    const beta = new CognitiveBeta({ apiUrl: 'http://x' })
    const post = vi.fn().mockResolvedValue({
      data: {
        output: { imageUrl: 'https://x/y.png' },
        metadata: { provider: 'openai', model: 'openai:gpt-image-1', size: '1024x1024', format: 'png', cost: 0 },
      },
    })
    ;(beta as any)._axiosClient = { post }

    const onRequest = vi.fn()
    const onResponse = vi.fn()
    beta.on('request', onRequest)
    beta.on('response', onResponse)

    await beta.generateImage({ model: 'openai:gpt-image-1', prompt: 'hello', quality: 'high' })

    expect(onRequest).toHaveBeenCalledTimes(1)
    expect(onResponse).toHaveBeenCalledTimes(1)
    const [req] = onRequest.mock.calls[0]!
    expect(req.type).toBe('generateImage')
  })

  test('emits error event when the call rejects', async () => {
    const beta = new CognitiveBeta({ apiUrl: 'http://x' })
    const post = vi.fn().mockRejectedValue(new Error('boom'))
    ;(beta as any)._axiosClient = { post }

    const onError = vi.fn()
    beta.on('error', onError)

    await expect(beta.generateImage({ prompt: 'x' })).rejects.toThrow('boom')
    expect(onError).toHaveBeenCalledTimes(1)
  })
})
