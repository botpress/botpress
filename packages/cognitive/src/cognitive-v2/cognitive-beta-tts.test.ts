import { describe, test, expect, vi } from 'vitest'
import { CognitiveBeta } from './index'

describe('CognitiveBeta.generateAudio', () => {
  test('POSTs to /v2/cognitive/generate-audio and returns parsed body', async () => {
    const beta = new CognitiveBeta({ apiUrl: 'http://x', botId: 'b', token: 't' })
    const post = vi.fn().mockResolvedValue({
      data: {
        output: { audioUrl: 'https://x/abc.mp3' },
        metadata: { provider: 'openai', cost: 0.0001 },
      },
    })
    ;(beta as any)._axiosClient = { post }

    const result = await beta.generateAudio({ model: 'auto', input: 'hi', voice: 'alloy' })

    expect(post).toHaveBeenCalledWith(
      '/v2/cognitive/generate-audio',
      expect.objectContaining({ input: 'hi', voice: 'alloy' }),
      expect.any(Object)
    )
    expect(result.output.audioUrl).toBe('https://x/abc.mp3')
    expect(result.metadata.provider).toBe('openai')
  })

  test('emits request and response events around the call', async () => {
    const beta = new CognitiveBeta({ apiUrl: 'http://x' })
    const post = vi.fn().mockResolvedValue({
      data: { output: { audioUrl: 'https://x/y.mp3' }, metadata: { provider: 'openai', cost: 0 } },
    })
    ;(beta as any)._axiosClient = { post }

    const onRequest = vi.fn()
    const onResponse = vi.fn()
    beta.on('request', onRequest)
    beta.on('response', onResponse)

    await beta.generateAudio({ model: 'openai:tts-1', input: 'hello', voice: 'alloy' })

    expect(onRequest).toHaveBeenCalledTimes(1)
    expect(onResponse).toHaveBeenCalledTimes(1)
    const [req] = onRequest.mock.calls[0]!
    expect(req.type).toBe('generateAudio')
  })
})

describe('CognitiveBeta.listVoices', () => {
  test('GETs /v2/cognitive/voices with optional filter', async () => {
    const beta = new CognitiveBeta({ apiUrl: 'http://x' })
    const get = vi.fn().mockResolvedValue({
      data: {
        voices: [{ id: 'alloy', displayName: 'Alloy', provider: 'openai', models: ['tts-1'] }],
      },
    })
    ;(beta as any)._axiosClient = { get }

    const voices = await beta.listVoices({ model: 'openai:tts-1' })

    expect(get).toHaveBeenCalledWith(
      '/v2/cognitive/voices',
      expect.objectContaining({ params: { model: 'openai:tts-1' } })
    )
    expect(voices).toHaveLength(1)
    expect(voices[0]!.id).toBe('alloy')
  })

  test('GETs without params when no filter provided', async () => {
    const beta = new CognitiveBeta({ apiUrl: 'http://x' })
    const get = vi.fn().mockResolvedValue({ data: { voices: [] } })
    ;(beta as any)._axiosClient = { get }

    await beta.listVoices()

    expect(get).toHaveBeenCalledWith('/v2/cognitive/voices', expect.objectContaining({ params: {} }))
  })
})
