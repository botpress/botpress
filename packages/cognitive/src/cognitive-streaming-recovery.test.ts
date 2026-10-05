import { afterEach, describe, expect, test, vi } from 'vitest'
import { Cognitive, type CognitiveRequest, type CognitiveStreamChunk } from './index'

afterEach(() => vi.unstubAllGlobals())

const metadata = {
  provider: 'test',
  model: 'C',
  cost: 0,
  usage: { inputTokens: 1, inputCost: 0, outputTokens: 1, outputCost: 0 },
}

const mockStream = (chunks: CognitiveStreamChunk[]) => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(chunks.map((c) => JSON.stringify(c)).join('\n') + '\n'))

  vi.stubGlobal('fetch', fetchMock)

  const cognitive = new Cognitive({ apiUrl: 'https://cognitive.test' })
  const onResponse = vi.fn()
  const onError = vi.fn()

  cognitive.on('response', onResponse)
  cognitive.on('error', onError)

  return { cognitive, fetchMock, onResponse, onError }
}

const request = { messages: [{ role: 'user' as const, content: 'hi' }] }

const collect = async (cognitive: Cognitive) => {
  const chunks: CognitiveStreamChunk[] = []

  for await (const chunk of cognitive.generateTextStream(request)) {
    chunks.push(chunk)
  }

  return chunks
}

describe('streaming recovery client contract', () => {
  test.each(['generateText', 'generateTextStream'] as const)(
    '%s preserves the idle timeout and restart options through HTTP retries',
    async (method) => {
      const input: CognitiveRequest = {
        ...request,
        options: { maxTimeToFirstToken: 1000, maxIdleTime: 10000, midStreamFallback: true },
      }
      const original = structuredClone(input)
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
        .mockResolvedValueOnce(
          new Response(
            method === 'generateText'
              ? JSON.stringify({ output: 'answer', metadata })
              : JSON.stringify({ created: 1, output: 'answer', finished: true, metadata }) + '\n'
          )
        )

      vi.stubGlobal('fetch', fetchMock)

      const cognitive = new Cognitive({ apiUrl: 'https://cognitive.test' })

      if (method === 'generateText') {
        expect((await cognitive.generateText(input)).output).toBe('answer')
      } else {
        const chunks: CognitiveStreamChunk[] = []

        for await (const chunk of cognitive.generateTextStream(input)) {
          chunks.push(chunk)
        }

        expect(chunks.at(-1)?.finished).toBe(true)
      }

      expect(fetchMock).toHaveBeenCalledTimes(2)

      for (const [, init] of fetchMock.mock.calls) {
        expect(JSON.parse(init.body).options).toEqual(input.options)
      }

      expect(input).toEqual(original)
    }
  )

  test('forwards successive restart frames and reports only the final attempt as the answer', async () => {
    const wire: CognitiveStreamChunk[] = [
      { created: 1, output: 'partial A' },
      { created: 2, restart: { attempt: 2, fromModel: 'A', toModel: 'B', reason: 'CognitiveTimeout' } },
      { created: 3, output: 'partial B' },
      { created: 4, restart: { attempt: 3, fromModel: 'B', toModel: 'C', reason: 'Internal' } },
      { created: 5, output: 'answer C' },
      { created: 6, finished: true, metadata },
    ]

    const { cognitive, onResponse, onError } = mockStream(wire)

    expect(await collect(cognitive)).toEqual(wire)
    expect(onResponse).toHaveBeenCalledWith(expect.anything(), { output: 'answer C', metadata })
    expect(onError).not.toHaveBeenCalled()
  })

  test('throws a terminal error after partial output instead of emitting a successful response event', async () => {
    const { cognitive, fetchMock, onResponse, onError } = mockStream([
      { created: 1, output: 'partial' },
      { created: 2, finished: true, error: 'Generation failed. Discard the partial response.', metadata },
    ])

    await expect(collect(cognitive)).rejects.toThrow('Discard the partial response')
    expect(onResponse).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  test.each([{ chunks: [] }, { chunks: [{ created: 1, output: 'truncated' }] }])(
    'rejects EOF without a terminal completion (%j)',
    async ({ chunks }) => {
      const { cognitive, onResponse, onError } = mockStream(chunks)

      await expect(collect(cognitive)).rejects.toThrow('ended before completion')
      expect(onResponse).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledOnce()
    }
  )

  test('surfaces a broken downstream connection without retrying and duplicating partial output', async () => {
    let pull = 0
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (pull++ === 0) {
          controller.enqueue(new TextEncoder().encode('{"created":1,"output":"partial"}\n'))
        } else {
          controller.error(new TypeError('network connection lost'))
        }
      },
    })
    const fetchMock = vi.fn().mockResolvedValue(new Response(stream))

    vi.stubGlobal('fetch', fetchMock)

    const cognitive = new Cognitive({ apiUrl: 'https://cognitive.test' })

    await expect(collect(cognitive)).rejects.toThrow('network connection lost')
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
