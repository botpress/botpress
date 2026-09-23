import type { CognitiveMetadata, CognitiveStreamChunk } from '@botpress/cognitive'
import { describe, expect, test, vi } from 'vitest'

import { ListenExit, LoopExceededError, MissingChatResponseError, Session, ThinkSignal, Tool } from '../index.js'
import { executeContext } from './execute.js'
import { createRecordingChat } from './fixtures/chat.js'
import { NativeClient, NativeStreamClient, javascript, nativeMetadata, response } from './fixtures/native-client.js'

const empty = (output = '', stopReason: CognitiveMetadata['stopReason'] = 'stop') => ({
  ...response(output),
  metadata: { ...nativeMetadata, stopReason },
})

describe.each([NativeClient, NativeStreamClient])('normal empty completion (%s)', (Client) => {
  test.each(['', ' \n\t '])('accepts output %j with stop when silent chat is allowed', async (output) => {
    const client = new Client([empty(output)])
    const handler = vi.fn()
    const onExit = vi.fn()
    const result = await executeContext({
      client,
      chat: createRecordingChat({ handler }),
      onExit,
      options: { loop: 1, requireChatResponse: false },
    })

    expect(result.is(ListenExit)).toBe(true)
    expect(result.iterations).toHaveLength(1)
    expect(result.iterations[0]?.errors).toEqual([])
    expect(client.requests).toHaveLength(1)
    expect(onExit).toHaveBeenCalledOnce()
    expect(onExit.mock.calls[0]?.[0].exit).toBe(ListenExit)
    expect(handler).not.toHaveBeenCalled()
    expect(result.iterations[0]?.traces.filter((trace) => trace.type === 'message_delivery')).toEqual([])
    expect(result.session.hasActiveTurn).toBe(false)
    expect(result.session.pendingCalls).toEqual([])
    expect(
      result.session.messages.some((message) => String(message.content).includes('Reply with assistant text'))
    ).toBe(false)
  })

  test('does not repeat an escalation after inspecting its successful result', async () => {
    const escalated = { escalated: true, customerNotified: true }
    const escalate = vi.fn(async () => escalated)
    const handler = vi.fn()
    const onExit = vi.fn()
    const client = new Client([
      javascript('const escalation = await escalate(); return inspect(escalation);'),
      empty(),
      // Detect the extra iteration and repeated side effect caused by rejecting a normal stop.
      javascript('await escalate(); return exit("listen");'),
    ])
    const result = await executeContext({
      client,
      instructions: 'Escalate, inspect the result, then stop without replying when the customer was already notified.',
      tools: [new Tool({ name: 'escalate', handler: escalate })],
      chat: createRecordingChat({ handler }),
      onExit,
      options: { loop: 3, requireChatResponse: false },
    })

    expect(result.is(ListenExit)).toBe(true)
    expect(client.requests).toHaveLength(2)
    expect(escalate).toHaveBeenCalledOnce()
    expect(handler).not.toHaveBeenCalled()
    expect(onExit).toHaveBeenCalledOnce()
    expect(result.session.memory.variables.escalation).toEqual(escalated)
    expect(result.session.getBindings().$return).toEqual(escalated)
    expect(result.iterations.map((iteration) => iteration.status.type)).toEqual(['thinking_requested', 'exit_success'])
    expect(result.iterations.flatMap((iteration) => iteration.errors)).toEqual([])
  })

  test.each(['thrown', 'returned'])('allows silence after a %s ThinkSignal has been inspected', async (delivery) => {
    const escalate = vi.fn(async () => {
      const signal = new ThinkSignal('The customer was notified. Do not send another message.', { escalated: true })
      if (delivery === 'thrown') {
        throw signal
      }

      return signal
    })
    const client = new Client([javascript('const escalation = await escalate(); return exit("listen");'), empty()])
    const handler = vi.fn()
    const onExit = vi.fn()
    const result = await executeContext({
      client,
      tools: [new Tool({ name: 'escalate', handler: escalate })],
      chat: createRecordingChat({ handler }),
      onExit,
      options: { loop: 2, requireChatResponse: false },
    })

    expect(result.is(ListenExit)).toBe(true)
    expect(result.iterations.map((iteration) => iteration.status.type)).toEqual(['thinking_requested', 'exit_success'])
    expect(
      client.requests[1]?.messages.some((message) => String(message.content).includes('<forced_inspection>'))
    ).toBe(true)
    expect(escalate).toHaveBeenCalledOnce()
    expect(onExit).toHaveBeenCalledOnce()
    expect(handler).not.toHaveBeenCalled()
  })

  test.each([undefined, true])(
    'honors requireChatResponse=%s and asks for a message before completing',
    async (requireChatResponse) => {
      const client = new Client([empty(), response('The escalation is complete.')])
      const handler = vi.fn()
      const onExit = vi.fn()
      const result = await executeContext({
        client,
        chat: createRecordingChat({ handler }),
        onExit,
        options: { loop: 2, requireChatResponse },
      })

      expect(result.is(ListenExit)).toBe(true)
      expect(result.iterations[0]?.status.type).toBe('exit_error')
      expect(MissingChatResponseError.is(result.iterations[0]?.exception)).toBe(true)
      expect(JSON.stringify(client.requests[1]?.messages)).toContain(
        'The assistant has not delivered a message since the last user message.'
      )
      expect(handler).toHaveBeenCalledOnce()
      expect(onExit).toHaveBeenCalledOnce()
      expect(client.requests).toHaveLength(2)
    }
  )

  test('allows empty stop with the default guard after an earlier message was delivered', async () => {
    const handler = vi.fn()
    const client = new Client([
      { ...javascript('return inspect({ escalated: true });'), output: 'I have escalated your request.' },
      empty(),
    ])
    const result = await executeContext({ client, chat: createRecordingChat({ handler }), options: { loop: 2 } })
    expect(result.is(ListenExit)).toBe(true)
    expect(handler).toHaveBeenCalledOnce()
    expect(result.iterations.flatMap((iteration) => iteration.errors)).toEqual([])
  })

  test('retains normal onExit rejection and recovery for an implicit listen', async () => {
    const onExit = vi.fn().mockRejectedValueOnce(new Error('Finish the handoff first.')).mockResolvedValue(undefined)
    const client = new Client([empty(), empty()])
    const result = await executeContext({
      client,
      chat: createRecordingChat({ handler: vi.fn() }),
      onExit,
      options: { loop: 2, requireChatResponse: false },
    })
    expect(result.is(ListenExit)).toBe(true)
    expect(onExit).toHaveBeenCalledTimes(2)
    expect(result.iterations[0]?.status.type).toBe('exit_error')
    expect(JSON.stringify(client.requests[1]?.messages)).toContain('Finish the handoff first.')
  })

  test('completes the session turn so new input can start the next turn', async () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Escalate silently.' })
    const chat = createRecordingChat({ handler: vi.fn() })
    const first = await executeContext({
      session,
      chat,
      client: new Client([empty()]),
      options: { loop: 1, requireChatResponse: false },
    })
    expect(first.is(ListenExit)).toBe(true)
    expect(session.hasActiveTurn).toBe(false)
    const restored = Session.fromJSON(session.toJSON())
    restored.append({ role: 'user', content: 'Any updates?' })
    const next = await executeContext({
      session: restored,
      chat,
      client: new Client([response('Still with support.')]),
    })
    expect(next.is(ListenExit)).toBe(true)
    expect(restored.turn).toBe(2)
  })

  test.each([
    ['max_tokens', 'TOKEN_OVERFLOW'],
    ['content_filter', 'GENERATION_FAILED'],
    ['other', 'GENERATION_FAILED'],
    ['tool_calls', 'GENERATION_FAILED'],
  ] as const)('does not treat empty %s as successful completion', async (stopReason, code) => {
    const onExit = vi.fn()
    const result = await executeContext({
      client: new Client([empty('', stopReason)]),
      chat: createRecordingChat({ handler: vi.fn() }),
      onExit,
      options: { loop: 1, requireChatResponse: false },
    })
    expect(result.isError() && result.error.code).toBe(code)
    expect(onExit).not.toHaveBeenCalled()
    expect(result.session.hasActiveTurn).toBe(true)
  })

  test('does not infer stop when stopReason is absent', async () => {
    const onExit = vi.fn()
    const result = await executeContext({
      client: new Client([response('')]),
      chat: createRecordingChat({ handler: vi.fn() }),
      onExit,
      options: { loop: 1, requireChatResponse: false },
    })
    expect(result.isError() && LoopExceededError.is(result.error)).toBe(true)
    expect(onExit).not.toHaveBeenCalled()
  })

  test('still executes actual tool calls accompanying empty text and stop', async () => {
    const handler = vi.fn()
    const run = vi.fn(async () => 'done')
    const client = new Client([
      { ...javascript('await run(); return exit("listen");'), metadata: { ...nativeMetadata, stopReason: 'stop' } },
    ])
    const result = await executeContext({
      client,
      tools: [new Tool({ name: 'run', handler: run })],
      chat: createRecordingChat({ handler }),
      options: { loop: 1, requireChatResponse: false },
    })
    expect(result.is(ListenExit)).toBe(true)
    expect(run).toHaveBeenCalledOnce()
    expect(handler).not.toHaveBeenCalled()
  })

  test('does not complete a worker without its explicit exit', async () => {
    const onExit = vi.fn()
    const result = await executeContext({ client: new Client([empty()]), onExit, options: { loop: 1 } })
    expect(result.isError() && LoopExceededError.is(result.error)).toBe(true)
    expect(onExit).not.toHaveBeenCalled()
  })
})

test.each(['missing finish', 'failure after finish'])('does not accept an empty stream with %s', async (failure) => {
  class BrokenStream extends NativeClient {
    public async *generateTextStream(): AsyncGenerator<CognitiveStreamChunk> {
      yield {
        created: 1,
        metadata: { ...nativeMetadata, stopReason: 'stop' },
        finished: failure === 'failure after finish',
      }
      if (failure === 'failure after finish') {
        throw new Error('Transport failed after its final chunk.')
      }
    }
  }

  const onExit = vi.fn()
  const result = await executeContext({
    client: new BrokenStream([]),
    chat: createRecordingChat({ handler: vi.fn() }),
    onExit,
    options: { loop: 1, requireChatResponse: false },
  })
  expect(result.isError() && result.error.code).toBe('GENERATION_FAILED')
  expect(onExit).not.toHaveBeenCalled()
})
