import { describe, expect, test, vi } from 'vitest'

import { DefaultComponents, ListenExit, MissingChatResponseError, Session, Tool } from '../index.js'
import { executeContext } from './execute.js'
import { createRecordingChat } from './fixtures/chat.js'
import { NativeClient, javascript, nativeMetadata, response } from './fixtures/native-client.js'

const endings = [
  { name: 'explicit listen', response: () => javascript('return exit("listen");') },
  {
    name: 'empty stop',
    response: () => ({ ...response(''), metadata: { ...nativeMetadata, stopReason: 'stop' as const } }),
  },
]

describe.each(endings)('last speaker policy: $name', (ending) => {
  test.each(['text', 'component'])('allows silence after a previous execution delivered a %s message', async (kind) => {
    const handler = vi.fn()
    const chat = createRecordingChat({ handler, components: [DefaultComponents.Buttons] })
    const session = new Session()
    session.append({ role: 'user', content: 'Escalate my request.' })
    const first = await executeContext({
      session,
      chat,
      client: new NativeClient([
        kind === 'text'
          ? response('Your request has been escalated.')
          : javascript('chat.buttons([{ label: "Contact support" }]); return exit("listen");'),
      ]),
    })
    expect(first.is(ListenExit)).toBe(true)
    expect(handler).toHaveBeenCalledOnce()

    // A background event does not change who last spoke to whom.
    session.append({ role: 'event', name: 'handoff_confirmed', payload: { ticketId: 'ticket-42' } })
    const onExit = vi.fn()
    const client = new NativeClient([ending.response()])
    const result = await executeContext({ session, chat, client, onExit, options: { loop: 1 } })
    expect(result.is(ListenExit)).toBe(true)
    expect(handler).toHaveBeenCalledOnce()
    expect(onExit).toHaveBeenCalledOnce()
    expect(client.requests).toHaveLength(1)
    expect(result.iterations[0]?.errors).toEqual([])
  })

  test('preserves the last speaker through session serialization and a subsequent tool result', async () => {
    const chat = createRecordingChat({ handler: vi.fn() })
    const session = new Session()
    session.append({ role: 'user', content: 'Escalate my request.' })
    await executeContext({ session, chat, client: new NativeClient([response('Your request is with support.')]) })
    const restored = Session.fromJSON(session.toJSON())
    restored.append({ role: 'event', name: 'handoff_confirmed', payload: { ticketId: 'ticket-42' } })
    const lookup = vi.fn(async () => ({ status: 'assigned' }))
    const client = new NativeClient([javascript('return inspect(await lookup());'), ending.response()])
    const result = await executeContext({
      session: restored,
      chat,
      client,
      tools: [new Tool({ name: 'lookup', handler: lookup })],
      options: { loop: 2 },
    })
    expect(result.is(ListenExit)).toBe(true)
    expect(lookup).toHaveBeenCalledOnce()
    expect(result.iterations.flatMap((iteration) => iteration.errors)).toEqual([])
  })

  test('recognizes an assistant message supplied in conversation history', async () => {
    const session = new Session()
    session.append([
      { role: 'user', content: 'Escalate my request.' },
      { role: 'assistant', content: 'Your request is with support.' },
      { role: 'event', name: 'handoff_confirmed', payload: {} },
    ])
    const handler = vi.fn()
    const result = await executeContext({
      session,
      chat: createRecordingChat({ handler }),
      client: new NativeClient([ending.response()]),
      options: { loop: 1 },
    })
    expect(result.is(ListenExit)).toBe(true)
    expect(handler).not.toHaveBeenCalled()
  })

  test.each(['Any updates?', 'External event "handoff_confirmed":\n{}'])(
    'requires a new response after the user says %j, even when an event follows',
    async (content) => {
      const session = new Session()
      session.append([
        { role: 'user', content: 'Escalate my request.' },
        { role: 'assistant', content: 'Your request is with support.' },
        { role: 'user', content },
        { role: 'event', name: 'handoff_confirmed', payload: {} },
      ])
      const onExit = vi.fn()
      const result = await executeContext({
        session,
        chat: createRecordingChat({ handler: vi.fn() }),
        client: new NativeClient([ending.response()]),
        onExit,
        options: { loop: 1 },
      })
      expect(result.isSuccess()).toBe(false)
      expect(MissingChatResponseError.is(result.iterations[0]?.exception)).toBe(true)
      expect(onExit).not.toHaveBeenCalled()
    }
  )

  test('an undelivered assistant response does not change the last speaker across executions', async () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Please answer.' })
    const first = await executeContext({
      session,
      chat: createRecordingChat({
        handler: () => {
          throw new Error('Delivery failed.')
        },
      }),
      client: new NativeClient([response('This was generated but never delivered.')]),
      options: { loop: 1 },
    })
    expect(first.isSuccess()).toBe(false)
    const restored = Session.fromJSON(session.toJSON())
    const onExit = vi.fn()
    const next = await executeContext({
      session: restored,
      chat: createRecordingChat({ handler: vi.fn() }),
      client: new NativeClient([ending.response()]),
      onExit,
      options: { loop: 1 },
    })
    expect(next.isSuccess()).toBe(false)
    expect(MissingChatResponseError.is(next.iterations[0]?.exception)).toBe(true)
    expect(onExit).not.toHaveBeenCalled()
  })

  test('finishes a failed turn without consuming the next user message, then requires its reply', async () => {
    const handler = vi.fn()
    const chat = createRecordingChat({ handler })
    const session = new Session()
    session.append({ role: 'user', content: 'First request.' })
    const failed = await executeContext({
      session,
      chat,
      client: new NativeClient([
        { ...javascript('throw new Error("Finish this turn on retry.");'), output: 'I received your first request.' },
      ]),
      options: { loop: 1 },
    })
    expect(failed.isSuccess()).toBe(false)
    expect(session.hasActiveTurn).toBe(true)
    expect(session.lastSpeaker).toBe('assistant')
    session.append({ role: 'user', content: 'Second request.' })
    const restored = Session.fromJSON(session.toJSON())

    const retry = new NativeClient([ending.response()])
    const resumed = await executeContext({ session: restored, chat, client: retry, options: { loop: 1 } })
    expect(resumed.is(ListenExit)).toBe(true)
    expect(restored.turn).toBe(1)
    expect(restored.status).toBe('pending')
    expect(restored.pendingMessages).toEqual([{ role: 'user', content: 'Second request.' }])
    expect(retry.requests[0]?.messages.some((message) => message.content === 'Second request.')).toBe(false)

    const next = new NativeClient([ending.response(), response('Here is the answer to your second request.')])
    const answered = await executeContext({ session: restored, chat, client: next, options: { loop: 2 } })
    expect(answered.is(ListenExit)).toBe(true)
    expect(MissingChatResponseError.is(answered.iterations[0]?.exception)).toBe(true)
    expect(JSON.stringify(next.requests[0]?.messages)).toContain('Second request.')
    expect(restored.turn).toBe(2)
    expect(restored.status).toBe('idle')
    expect(restored.pendingMessages).toEqual([])
    expect(restored.messages.filter((message) => message.content === 'Second request.')).toHaveLength(1)
    expect(handler.mock.calls.map(([message]) => message)).toEqual([
      { type: 'text', text: 'I received your first request.' },
      { type: 'text', text: 'Here is the answer to your second request.' },
    ])
  })

  test('does not count whitespace-only assistant history as speech', async () => {
    const session = new Session()
    session.append([
      { role: 'user', content: 'Please answer.' },
      { role: 'assistant', content: ' \n\t ' },
    ])
    const result = await executeContext({
      session,
      chat: createRecordingChat({ handler: vi.fn() }),
      client: new NativeClient([ending.response()]),
      options: { loop: 1 },
    })
    expect(result.isSuccess()).toBe(false)
    expect(MissingChatResponseError.is(result.iterations[0]?.exception)).toBe(true)
  })
})
