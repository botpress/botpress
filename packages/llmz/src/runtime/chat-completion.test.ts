import { z } from '@bpinternal/zui'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { DefaultComponents } from '../chat/component.default.js'
import { ListenExit } from '../context.js'
import { Exit, LoopExceededError, Session, Tool } from '../index.js'
import { executeContext } from './execute.js'
import { createRecordingChat } from './fixtures/chat.js'
import { NativeClient, NativeStreamClient, javascript, response } from './fixtures/native-client.js'

describe.each(['false', 'true'])('chat completion (QuickJS=%s)', (quickjs) => {
  beforeEach(() => vi.stubEnv('USE_QUICKJS', quickjs))
  afterEach(() => vi.unstubAllEnvs())

  test.each([NativeClient, NativeStreamClient])(
    'rejects a silent listen and recovers without replaying tools (%s)',
    async (Client) => {
      const read = vi.fn(async () => 991)
      const handler = vi.fn()
      const onExit = vi.fn()
      const client = new Client([
        javascript('const answer = await lookup(); return exit("listen");'),
        response('The answer is 991.'),
      ])
      const result = await executeContext({
        client,
        chat: createRecordingChat({ handler }),
        tools: [new Tool({ name: 'lookup', handler: read })],
        onExit,
        options: { loop: 2 },
      })
      expect(result.is(ListenExit)).toBe(true)
      expect(read).toHaveBeenCalledOnce()
      expect(onExit).toHaveBeenCalledOnce()
      expect(handler).toHaveBeenCalledOnce()
      expect(result.session.memory.variables.answer).toBe(991)
      expect(result.iterations[0]?.status.type).toBe('exit_error')
      expect(result.iterations[0]?.errors).toEqual([
        expect.objectContaining({ code: 'MISSING_CHAT_RESPONSE', critical: false }),
      ])
      const feedback = String(client.requests[1]!.messages.find((message) => message.type === 'tool_result')?.content)
      expect(feedback).toContain('The assistant has not delivered a message since the last user message.')
      expect(feedback).toContain('Do not repeat completed tool calls.')
      expect(feedback).toContain('lookup(): succeeded')
    }
  )

  test.each(['', ' \n\t '])('empty text %j cannot satisfy completion', async (output) => {
    const handler = vi.fn()
    const onExit = vi.fn()
    const generated = { ...javascript('return exit("listen");'), output }
    const result = await executeContext({
      client: new NativeClient([generated]),
      chat: createRecordingChat({ handler }),
      onExit,
      options: { loop: 1 },
    })
    expect(result.isSuccess()).toBe(false)
    expect(result.isError() && LoopExceededError.is(result.error)).toBe(true)
    expect(handler).not.toHaveBeenCalled()
    expect(onExit).not.toHaveBeenCalled()
    expect(result.iterations[0]?.errors.some((error) => error.code === 'MISSING_CHAT_RESPONSE')).toBe(true)
  })

  test('allows explicitly opted-out silent completion', async () => {
    const handler = vi.fn()
    const onExit = vi.fn()
    const result = await executeContext({
      client: new NativeClient([javascript('return exit("listen");')]),
      chat: createRecordingChat({ handler }),
      onExit,
      options: { loop: 1, requireChatResponse: false },
    })
    expect(result.is(ListenExit)).toBe(true)
    expect(onExit).toHaveBeenCalledOnce()
    expect(handler).not.toHaveBeenCalled()
  })

  test.each([NativeClient, NativeStreamClient])(
    'allows text accompanying listen after delivery (%s)',
    async (Client) => {
      const events: string[] = []
      const result = await executeContext({
        client: new Client([{ ...javascript('return exit("listen");'), output: 'Here is your answer.' }]),
        chat: createRecordingChat({
          onMessageDelta: vi.fn(),
          handler: () => {
            events.push('sent')
          },
        }),
        onExit: () => {
          events.push('exit')
        },
        options: { loop: 1 },
      })
      expect(result.is(ListenExit)).toBe(true)
      expect(events).toEqual(['sent', 'exit'])
    }
  )

  test('counts text delivered in an earlier iteration', async () => {
    const handler = vi.fn()
    const result = await executeContext({
      client: new NativeClient([
        { ...javascript('return inspect(991);'), output: 'Your answer is ready.' },
        javascript('return exit("listen");'),
      ]),
      chat: createRecordingChat({ handler }),
      options: { loop: 2 },
    })
    expect(result.is(ListenExit)).toBe(true)
    expect(handler).toHaveBeenCalledOnce()
  })

  test('counts a component delivered in an earlier iteration', async () => {
    const handler = vi.fn()
    const result = await executeContext({
      client: new NativeClient([
        javascript('chat.buttons([{ label: "Continue" }]); return inspect("sent");'),
        javascript('return exit("listen");'),
      ]),
      chat: createRecordingChat({ handler, components: [DefaultComponents.Buttons] }),
      options: { loop: 2 },
    })
    expect(result.is(ListenExit)).toBe(true)
    expect(handler).toHaveBeenCalledOnce()
  })

  test.each(['text', 'component'])('failed %s delivery does not count as a sent message', async (kind) => {
    const handler = vi.fn(() => {
      throw new Error('Offline')
    })
    const result = await executeContext({
      client: new NativeClient([
        kind === 'text'
          ? response('Answer that cannot be delivered.')
          : javascript('chat.buttons([{ label: "Continue" }]); return exit("listen");'),
        javascript('return exit("listen");'),
      ]),
      chat: createRecordingChat({ handler, components: [DefaultComponents.Buttons] }),
      options: { loop: 2 },
    })
    expect(result.isSuccess()).toBe(false)
    expect(result.iterations[1]?.errors.some((error) => error.code === 'MISSING_CHAT_RESPONSE')).toBe(true)
  })

  test('a new user message after a previous assistant reply requires a new response', async () => {
    const session = new Session()
    const chat = createRecordingChat({ handler: vi.fn() })
    await executeContext({ client: new NativeClient([response('Previous answer.')]), session, chat })
    session.append({ role: 'user', content: 'Another question.' })
    const result = await executeContext({
      client: new NativeClient([javascript('return exit("listen");')]),
      session,
      chat,
      options: { loop: 1 },
    })
    expect(result.isSuccess()).toBe(false)
    expect(result.iterations[0]?.errors.some((error) => error.code === 'MISSING_CHAT_RESPONSE')).toBe(true)
  })

  test('does not require a chat message for a custom task exit or worker', async () => {
    const done = new Exit({ name: 'done', description: 'Finish the task.', schema: z.number() })
    for (const chat of [undefined, createRecordingChat({ handler: vi.fn() })]) {
      const result = await executeContext({
        client: new NativeClient([javascript('return exit("done", 42);')]),
        chat,
        exits: [done],
        options: { loop: 1 },
      })
      expect(result.is(done)).toBe(true)
      expect(result.output).toBe(42)
    }
  })
})

test('rejects a non-boolean requireChatResponse before generation', async () => {
  const client = new NativeClient([])
  const result = await executeContext({ client, options: { requireChatResponse: 'false' as unknown as boolean } })
  expect(result.isError() && result.error.code).toBe('INVALID_CONFIG')
  expect(client.requests).toHaveLength(0)
})
