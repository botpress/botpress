import type { CognitiveToolCall } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { describe, expect, test, vi } from 'vitest'

import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { createRecordingChat } from './fixtures/chat.js'
import { NativeClient, NativeStreamClient, nativeCall, response } from './fixtures/native-client.js'
import { protocolLanguages } from './fixtures/protocol-languages.js'

const makeChat = () => {
  const delivered: string[] = []
  const chat = createRecordingChat({
    components: [],
    handler: (message) => {
      delivered.push(message.type === 'text' ? message.text : '')
    },
  })

  return { chat, delivered }
}

describe('native protocol boundaries', () => {
  test.each(protocolLanguages)('$language: assistant text is preserved in every delivery mode', async ({ reply }) => {
    for (const chunkSize of [0, 1, 7, 100_000]) {
      const { chat, delivered } = makeChat()
      const client = chunkSize
        ? new NativeStreamClient([response(reply)], chunkSize)
        : new NativeClient([response(reply)])

      const result = await executeContext({ client, chat, options: { loop: 1 } })

      expect(result.isSuccess()).toBe(true)
      expect(delivered).toEqual([reply])
      expect(result.session.messages[0]?.content).toBe(reply)
    }
  })

  test.each([
    '■start\n■run\nawait record()\n■end',
    '```javascript\nawait record()\n```',
    '<run>await record()</run>',
    'Here is an example: return await record()',
  ])('plain text is never interpreted as an executable protocol: %s', async (text) => {
    const { chat, delivered } = makeChat()
    const record = vi.fn()

    const result = await executeContext({
      client: new NativeClient([response(text)]),
      chat,
      tools: [new Tool({ name: 'record', handler: record })],
    })

    expect(result.isSuccess()).toBe(true)
    expect(delivered).toEqual([text])
    expect(record).not.toHaveBeenCalled()
  })

  const invalidBatches = [
    {
      name: 'unknown native function',
      calls: () => [nativeCall('record')],
    },
    {
      name: 'extra JavaScript arguments',
      calls: () => [nativeCall('run_javascript', { code: 'await record()', exit: 'listen' })],
    },
    {
      name: 'empty JavaScript source',
      calls: () => [nativeCall('run_javascript', { code: '' })],
    },
    {
      name: 'multiple JavaScript calls',
      calls: () => [
        nativeCall('run_javascript', { code: 'await record()' }),
        nativeCall('run_javascript', { code: 'await record()' }),
      ],
    },
    {
      name: 'JavaScript and listen',
      calls: () => [nativeCall('run_javascript', { code: 'await record()' }), nativeCall('listen')],
    },
    {
      name: 'duplicate exits',
      calls: () => [nativeCall('listen'), nativeCall('listen')],
    },
  ]

  test.each(invalidBatches)('rejects $name before effects and pairs every call result', async ({ calls }) => {
    const { chat, delivered } = makeChat()
    const record = vi.fn()
    const batch = calls()
    const client = new NativeClient([response('', batch), response('Recovered.')])

    const result = await executeContext({
      client,
      chat,
      tools: [new Tool({ name: 'record', handler: record })],
    })

    expect(result.isSuccess()).toBe(true)
    expect(record).not.toHaveBeenCalled()
    expect(delivered).toEqual(['Recovered.'])
    expect(result.session.pendingCalls).toEqual([])

    const errors = client.requests[1]!.messages.filter((message) => message.type === 'tool_result')
    expect(errors.map((message) => message.toolResultCallId)).toEqual(batch.map((call) => call.id))
    expect(errors.every((message) => String(message.content).includes('rejected before execution'))).toBe(true)
  })

  test.each([
    { name: 'empty identity', id: '' },
    { name: 'repeated identity', id: 'duplicate' },
  ])('invalid provider call identity is terminal: $name', async ({ id }) => {
    const record = vi.fn()
    const calls = [nativeCall('run_javascript', { code: 'await record()' }, id)]
    if (id) {
      calls.push(nativeCall('listen', {}, id))
    }

    const client = new NativeClient([response('', calls)])
    const result = await executeContext({
      client,
      tools: [new Tool({ name: 'record', handler: record })],
    })

    expect(result.isError()).toBe(true)
    expect(record).not.toHaveBeenCalled()
    expect(client.requests).toHaveLength(1)
    expect(result.session.messages).toEqual([])
  })

  test('provider arguments must be decoded objects before execution', async () => {
    const record = vi.fn()
    const malformed = {
      id: 'malformed',
      name: 'run_javascript',
      input: '{"code":"await record()"}',
    } as unknown as CognitiveToolCall

    const result = await executeContext({
      client: new NativeClient([response('', [malformed])]),
      tools: [new Tool({ name: 'record', handler: record })],
    })

    expect(result.isError()).toBe(true)
    expect(record).not.toHaveBeenCalled()
  })

  test('business schemas are still enforced inside JavaScript', async () => {
    const record = vi.fn()
    const client = new NativeClient([
      response('', [nativeCall('run_javascript', { code: 'await record({ count: "wrong" })' })]),
      response('The input was rejected.'),
    ])
    const { chat } = makeChat()

    const result = await executeContext({
      client,
      chat,
      tools: [new Tool({ name: 'record', input: z.object({ count: z.number() }), handler: record })],
    })

    expect(result.isSuccess()).toBe(true)
    expect(record).not.toHaveBeenCalled()
    expect(String(client.requests[1]!.messages.at(-1)?.content)).toContain('count')
  })
})
