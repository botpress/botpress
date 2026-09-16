import { afterEach, describe, expect, test, vi } from 'vitest'
import { Cognitive, CognitiveRequest, CognitiveStreamChunk } from './index'

afterEach(() => vi.unstubAllGlobals())

describe('text generation service tier', () => {
  test.each(['generateText', 'generateTextStream'] as const)(
    '%s sends the fast tier through the HTTP transport, including retries',
    async (method) => {
      const metadata = {
        provider: 'openai',
        model: 'gpt-5.4-mini-2026-03-17',
        usage: { inputTokens: 1, inputCost: 0, outputTokens: 1, outputCost: 0 },
        cost: 0,
      }
      const chunks: CognitiveStreamChunk[] = [
        { output: 'pong', created: 1 },
        { finished: true, created: 2, metadata },
      ]
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
        .mockResolvedValueOnce(
          new Response(
            method === 'generateText'
              ? JSON.stringify({ output: 'pong', metadata })
              : chunks.map((chunk) => JSON.stringify(chunk)).join('\n') + '\n'
          )
        )
      vi.stubGlobal('fetch', fetchMock)
      const cognitive = new Cognitive({ apiUrl: 'https://cognitive.test', botId: 'bot', token: 'token' })
      const request: CognitiveRequest = {
        model: ['openai:gpt-5.4-mini', 'openai:gpt-5.6-sol'],
        systemPrompt: 'Be concise.',
        messages: [{ role: 'user', content: 'Ping' }],
        options: { serviceTier: 'fast', skipCache: true, maxTimeToFirstToken: 1000, midStreamFallback: true },
      }
      const original = structuredClone(request)

      if (method === 'generateText') {
        expect((await cognitive.generateText(request)).output).toBe('pong')
      } else {
        const received: CognitiveStreamChunk[] = []
        for await (const chunk of cognitive.generateTextStream(request)) received.push(chunk)
        expect(received).toEqual(chunks)
      }

      expect(fetchMock).toHaveBeenCalledTimes(2)
      for (const [url, init] of fetchMock.mock.calls) {
        expect(url).toBe(
          `https://cognitive.test/v2/cognitive/${method === 'generateText' ? 'generate-text' : 'generate-text-stream'}`
        )
        expect(JSON.parse(init.body)).toEqual({
          model: request.model,
          messages: [{ role: 'system', content: 'Be concise.' }, ...request.messages],
          options: request.options,
          ...(method === 'generateTextStream' ? { stream: true } : {}),
        })
      }
      expect(request).toEqual(original)
    }
  )

  test.each(['generateText', 'generateTextStream'] as const)(
    '%s leaves the tier unset when omitted',
    async (method) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(
          new Response(method === 'generateText' ? '{"output":"pong"}' : '{"output":"pong","created":1}\n')
        )
      vi.stubGlobal('fetch', fetchMock)
      const cognitive = new Cognitive({ apiUrl: 'https://cognitive.test' })
      const request: CognitiveRequest = { messages: [{ role: 'user', content: 'Ping' }], options: { skipCache: true } }
      if (method === 'generateText') {
        await cognitive.generateText(request)
      } else {
        for await (const _chunk of cognitive.generateTextStream(request)) {
          /* consume the response */
        }
      }
      expect(JSON.parse(fetchMock.mock.calls[0]![1].body).options).toEqual({ skipCache: true })
    }
  )
})

describe('refreshed model catalogue', () => {
  test('Mercury 2.5 resolves offline with its production context and output limits', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network should not be used'))
    vi.stubGlobal('fetch', fetchMock)
    const cognitive = new Cognitive()
    expect(await cognitive.getModelDetails('inception:mercury-2.5')).toMatchObject({
      id: 'inception:mercury-2.5',
      name: 'Mercury 2.5',
      input: { maxTokens: 260000 },
      output: { maxTokens: 65536 },
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
