import { z } from '@bpinternal/zui'
import { describe, expect, test, vi } from 'vitest'
import type { MessageDelta, MessageMetadata, ChatMessage } from '../chat/chat.js'
import { Component } from '../chat/component.js'
import { ListenExit } from '../context.js'
import { ThinkSignal } from '../errors.js'
import { Exit } from '../exit.js'
import { Session } from '../session/session.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { createRecordingChat } from './fixtures/chat.js'
import { NativeClient, NativeStreamClient, javascript, nativeCall, response } from './fixtures/native-client.js'

const makeChat = () => {
  const sent: { message: ChatMessage; metadata: MessageMetadata }[] = []
  const deltas: MessageDelta[] = []
  const chat = createRecordingChat({
    components: [],
    handler: (message, metadata) => {
      sent.push({ message, metadata })
    },
    onMessageDelta: (delta) => {
      deltas.push(delta)
    },
  })
  return { chat, sent, deltas }
}
const feedback = (client: NativeClient, index = 1) =>
  client.requests[index]!.messages.filter((message) => message.type === 'tool_result')
    .map((message) => message.content)
    .join('\n')
const done = new Exit({ name: 'done', description: 'Complete', schema: z.object({ value: z.number() }) })

describe('native execution lifecycle', () => {
  test('rejects removed snapshot input without starting a new execution', async () => {
    const session = new Session()
    session.append({ role: 'user', content: 'A queued request' })
    const client = new NativeClient([response('This response must not be requested.')])
    const props = { session, client, snapshot: {} }
    const result = await executeContext(props)

    expect(result.isError()).toBe(true)
    expect(client.requests).toHaveLength(0)
    expect(session.turn).toBe(0)
    expect(session.pendingMessages).toEqual([{ role: 'user', content: 'A queued request' }])

    if (!result.isError()) {
      throw new Error('Expected the removed snapshot option to be rejected.')
    }

    expect(String(result.error)).toContain('Snapshots and external pause/resume are no longer supported')
  })

  test('rejects removed execute.messages input before claiming queued session input', async () => {
    const session = new Session()
    session.append({ role: 'user', content: 'The supported input path' })
    const client = new NativeClient([response('This response must not be requested.')])
    const props = {
      session,
      client,
      messages: [{ role: 'user', content: 'The removed input path' }],
    }
    const result = await executeContext(props)

    expect(result.isError()).toBe(true)
    expect(client.requests).toHaveLength(0)
    expect(session.turn).toBe(0)

    const { chat } = makeChat()
    const nextClient = new NativeClient([response('The queued input was preserved.')])
    const next = await executeContext({ session, chat, client: nextClient })

    expect(next.isSuccess()).toBe(true)
    expect(JSON.stringify(nextClient.requests[0]!.messages)).toContain('The supported input path')
    expect(JSON.stringify(nextClient.requests[0]!.messages)).not.toContain('The removed input path')
  })

  test.each([NativeClient, NativeStreamClient])('plain assistant text delivers and listens (%s)', async (Client) => {
    const { chat, sent } = makeChat()
    const client = new Client([response('Hello, world.')])
    const result = await executeContext({ client, chat })
    expect(result.is(ListenExit)).toBe(true)
    expect(sent.map((item) => (item.message.type === 'text' ? item.message.text : ''))).toEqual(['Hello, world.'])
    expect(result.session.messages).toEqual([{ role: 'assistant', content: 'Hello, world.' }])
    expect(result.session.iterations[0]?.hasResult).toBe(false)
    expect(client.requests[0]!.tools?.map((tool) => tool.name)).toEqual(['run_javascript'])
    expect(client.requests[0]!.toolControl).toMatchObject({ parallel: false })
    expect(JSON.stringify(client.requests)).not.toContain('■start')
  })

  test('does not start another completed chat turn without new input', async () => {
    const session = new Session()
    const { chat } = makeChat()
    const first = await executeContext({ session, chat, client: new NativeClient([response('Welcome.')]) })
    const client = new NativeClient([response('An unwanted repeated reply.')])
    const repeated = await executeContext({ session, chat, client })

    expect(first.isSuccess()).toBe(true)
    expect(repeated.isError()).toBe(true)
    expect(client.requests).toHaveLength(0)
    expect(session.turn).toBe(1)

    if (!repeated.isError()) {
      throw new Error('Expected missing input to stop the new chat turn.')
    }

    expect(String(repeated.error)).toContain(
      'No pending input. Append a message to the session before starting another chat turn.'
    )

    session.append({ role: 'user', content: 'Continue, please.' })
    const next = await executeContext({ session, chat, client: new NativeClient([response('Continuing.')]) })

    expect(next.isSuccess()).toBe(true)
    expect(session.turn).toBe(2)
  })

  test('allows workers to start subsequent executions without queued input', async () => {
    const session = new Session()

    for (const value of [1, 2]) {
      const client = new NativeClient([javascript(`return exit("done", { value: ${value} });`)])
      const result = await executeContext({ session, client, exits: [done] })

      expect(result.isSuccess()).toBe(true)
      expect(result.output).toEqual({ value })
      expect(client.requests).toHaveLength(1)
      expect(session.turn).toBe(value)
    }
  })

  test('JavaScript returns a value to inspect, then a returned exit completes', async () => {
    const read = vi.fn(async () => ({ age: 40, email: 'a@example.com' }))
    const client = new NativeClient([
      javascript('const account = await readAccount(); return inspect({ age: account.age });'),
      javascript('return exit("done", { value: 40 });'),
    ])
    const result = await executeContext({
      client,
      tools: [new Tool({ name: 'readAccount', handler: read })],
      exits: [done],
    })
    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 40 })
    expect(read).toHaveBeenCalledOnce()
    expect(result.session.memory.variables).toEqual({ account: { age: 40, email: 'a@example.com' } })
    expect(result.session.getBindings().$return).toEqual({ age: 40 })
    expect(feedback(client)).toContain('inspect() result')
    expect(feedback(client)).toContain('Created')
    expect(feedback(client)).toContain('account')
    expect(client.requests[0]!.tools?.map((tool) => tool.name)).not.toContain('readAccount')
    expect(
      client.requests[1]!.messages.some(
        (message) => message.role === 'assistant' && message.toolCalls?.[0]?.function.name === 'run_javascript'
      )
    ).toBe(true)
    expect(client.requests[1]!.messages.filter((message) => message.type === 'tool_result')).toHaveLength(1)
  })

  test('variables and latest result survive across user turns and JSON restore', async () => {
    const { chat } = makeChat()
    const initialSession = new Session()
    initialSession.append({ role: 'user', content: 'Remember my account.' })

    const first = await executeContext({
      chat,
      session: initialSession,
      client: new NativeClient([
        javascript('const account = { age: 40 }; return { saved: true };'),
        response('Remembered.'),
      ]),
    })
    const session = Session.fromJSON(JSON.parse(JSON.stringify(first.session.toJSON())))
    session.append({ role: 'user', content: 'Update it.' })

    const secondClient = new NativeClient([
      javascript(
        'account.age += 1; return { age: account.age, saved: $return.saved, previous: $iterations[0].outcome };'
      ),
      response('Updated.'),
    ])
    const second = await executeContext({
      session,
      chat,
      client: secondClient,
    })
    expect(second.isSuccess()).toBe(true)
    expect(second.session.turn).toBe(2)
    expect(second.session.memory.variables.account).toEqual({ age: 41 })
    expect(second.session.getBindings().$return).toEqual({ age: 41, saved: true, previous: 'exit_success' })
    expect(feedback(secondClient)).toContain('Updated')
    expect(JSON.stringify(second.session.messages)).not.toContain('<runtime-memory>')
    expect(JSON.stringify(secondClient.requests[1]!.messages).match(/<runtime-memory>/g)).toHaveLength(1)
  })

  test('messages appended during execution wait until the next turn', async () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Process the first request' })
    const { chat } = makeChat()
    let release!: () => void
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    const waitForWork = vi.fn(async () => {
      await pending

      return { completed: true }
    })
    const client = new NativeClient([
      javascript('const work = await waitForWork(); return inspect(work);'),
      response('The first request is complete.'),
    ])
    const execution = executeContext({
      session,
      chat,
      client,
      tools: [new Tool({ name: 'waitForWork', handler: waitForWork })],
    })

    try {
      await vi.waitFor(() => expect(waitForWork).toHaveBeenCalledOnce())
      session.append({ role: 'user', content: 'Process the second request' })
    } finally {
      release()
    }

    const first = await execution

    expect(first.isSuccess()).toBe(true)
    expect(client.requests).toHaveLength(2)
    expect(JSON.stringify(client.requests)).not.toContain('Process the second request')
    expect(session.turn).toBe(1)

    const nextClient = new NativeClient([response('The second request is complete.')])
    const second = await executeContext({ session, chat, client: nextClient })

    expect(second.isSuccess()).toBe(true)
    expect(session.turn).toBe(2)
    expect(
      nextClient.requests[0]!.messages.filter(
        (message) => message.role === 'user' && String(message.content).startsWith('Process the first request')
      )
    ).toHaveLength(1)
    expect(
      nextClient.requests[0]!.messages.filter(
        (message) => message.role === 'user' && String(message.content).startsWith('Process the second request')
      )
    ).toHaveLength(1)
    expect(nextClient.requests[0]!.messages.filter((message) => message.type === 'tool_result')).toHaveLength(1)
  })

  test('a failed generation can resume the same input after persisting the session', async () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Keep this request until it succeeds' })
    const { chat } = makeChat()
    const client = new NativeClient([])
    const failed = await executeContext({ session, chat, client, options: { loop: 1 } })

    expect(failed.isError()).toBe(true)
    expect(session.turn).toBe(1)

    const restored = Session.fromJSON(JSON.parse(JSON.stringify(session)))
    restored.append({ role: 'user', content: 'A later request' })
    const retryClient = new NativeClient([response('The original request is complete.')])
    const retried = await executeContext({ session: restored, chat, client: retryClient })

    expect(retried.isSuccess()).toBe(true)
    expect(restored.turn).toBe(1)
    expect(
      retryClient.requests[0]!.messages.filter(
        (message) =>
          message.role === 'user' && String(message.content).startsWith('Keep this request until it succeeds')
      )
    ).toHaveLength(1)
    expect(JSON.stringify(retryClient.requests)).not.toContain('A later request')

    const nextClient = new NativeClient([response('The later request is complete.')])
    const next = await executeContext({ session: restored, chat, client: nextClient })

    expect(next.isSuccess()).toBe(true)
    expect(restored.turn).toBe(2)
    expect(
      nextClient.requests[0]!.messages.filter(
        (message) => message.role === 'user' && String(message.content).startsWith('A later request')
      )
    ).toHaveLength(1)
  })

  test('partial failure retains named variables and never replaces last successful result', async () => {
    const client = new NativeClient([
      javascript('const account = { age: 40 }; return "original";'),
      javascript('account.age = 41; const note = "saved"; throw new Error("failed later");'),
      javascript('return { old: $return, account, note, lastSucceeded: $iterations[0].hasResult };'),
      javascript('return exit("done", { value: 41 });'),
    ])
    const result = await executeContext({ client, exits: [done], options: { loop: 6 } })
    expect(result.isSuccess()).toBe(true)
    expect(result.session.getBindings().$return).toEqual({
      old: 'original',
      account: { age: 41 },
      note: 'saved',
      lastSucceeded: false,
    })
    expect(feedback(client, 2)).toContain('failed later')
    expect(feedback(client, 2)).toContain('Created')
    expect(feedback(client, 2)).toContain('Updated')
  })

  test('successful undefined replaces $return and stays defined as a history result', async () => {
    const client = new NativeClient([
      javascript('return 12;'),
      javascript('const kept = 42;'),
      javascript('return exit("done", { value: 42 });'),
    ])
    const result = await executeContext({ client, exits: [done], options: { loop: 6 } })
    expect(result.isSuccess()).toBe(true)
    expect(result.session.getBindings().$return).toBeUndefined()
    expect(result.session.iterations[1]?.hasResult).toBe(true)
    expect(feedback(client, 2)).toContain('undefined')
  })

  test('synchronous component calls run in order and exit without another generation', async () => {
    const sent: string[] = []
    const card = new Component({
      name: 'card',

      description: 'Card',
      props: z.object({ title: z.string() }),
    })
    const chat = createRecordingChat({
      components: [card],
      handler: (message) => {
        sent.push(((message.type === 'component' ? message.props : {}) as Record<string, unknown>).title as string)
      },
    })
    const client = new NativeClient([
      javascript(`
        chat.card({ title: 'One' });
        chat.card({ title: 'Two' });
        return exit();
      `),
    ])
    const result = await executeContext({
      chat,
      client,
      onExit: () => {
        expect(sent).toEqual(['One', 'Two'])
      },
    })
    expect(result.is(ListenExit)).toBe(true)
    expect(client.requests).toHaveLength(1)
    expect(result.session.messages.filter((message) => message.type === 'tool_result')).toHaveLength(1)
    expect(result.session.iterations[0]?.outcome).toBe('exit_success')
    expect(result.session.iterations[0]?.hasResult).toBe(false)
  })

  test('nonterminal sends request another model response', async () => {
    const card = new Component({
      name: 'card',

      description: 'Card',
      props: z.object({ title: z.string() }),
    })
    const handler = vi.fn()
    const client = new NativeClient([javascript('chat.card({ title: "One" });'), javascript('return exit();')])
    const result = await executeContext({ client, chat: createRecordingChat({ components: [card], handler }) })
    expect(result.isSuccess()).toBe(true)
    expect(handler).toHaveBeenCalledOnce()
    expect(feedback(client)).toContain('Messages sent')
  })

  test('preflights the entire batch before delivering or running any tool', async () => {
    const { chat, sent } = makeChat()
    const action = vi.fn()
    const client = new NativeClient([
      response('Premature claim', [nativeCall('run_javascript', { code: 'await action();' }), nativeCall('listen')]),
      response('Corrected.'),
    ])
    const result = await executeContext({ client, chat, tools: [new Tool({ name: 'action', handler: action })] })
    expect(result.isSuccess()).toBe(true)
    expect(action).not.toHaveBeenCalled()
    expect(sent.map((item) => (item.message.type === 'text' ? item.message.text : ''))).toEqual(['Corrected.'])
    expect(feedback(client)).toContain('at most one run_javascript call')
    expect(result.session.messages.filter((message) => message.type === 'tool_result')).toHaveLength(2)
  })

  test('typed exits validate returned payloads and retry with matched errors', async () => {
    const client = new NativeClient([
      javascript('return exit("done", { value: \'wrong\' });'),
      javascript('return exit("done", { value: 42 });'),
    ])
    const hook = vi.fn()
    const result = await executeContext({ client, exits: [done], onExit: hook })
    expect(result.output).toEqual({ value: 42 })
    expect(hook).toHaveBeenCalledOnce()
    expect(feedback(client)).toContain('value')
  })

  test('onExit rejection is recoverable, and beforeExecution can replace code', async () => {
    const client = new NativeClient([
      javascript('throw new Error("original");'),
      javascript('return exit("done", { value: 2 });'),
      javascript('return exit("done", { value: 3 });'),
    ])
    let calls = 0
    const result = await executeContext({
      client,
      exits: [done],
      onBeforeExecution: async (iteration) => {
        if (iteration.code?.includes('original')) {
          return { code: 'const fixed = true; return 3;' }
        }

        return undefined
      },
      onExit: () => {
        if (!calls++) {
          throw new Error('Use value 3.')
        }
      },
    })
    expect(result.output).toEqual({ value: 3 })
    expect(result.session.memory.variables.fixed).toBe(true)
    expect(feedback(client, 2)).toContain('Use value 3.')
  })

  test('ThinkSignal preserves prior memory and emits explicit interrupted feedback', async () => {
    const pause = new Tool({
      name: 'pause',
      handler: () => {
        throw new ThinkSignal('Inspect this', 'Relevant evidence')
      },
    })
    const client = new NativeClient([
      javascript('return 17;'),
      javascript('const before = 1; await pause(); const after = 2;'),
      javascript('return exit("done", { value: 17 });'),
    ])
    const result = await executeContext({ client, tools: [pause], exits: [done] })
    expect(result.isSuccess()).toBe(true)
    expect(result.session.getBindings().$return).toBe(17)
    expect(result.session.memory.variables).toEqual({ before: 1 })
    expect(feedback(client, 2)).toContain('Relevant evidence')
    expect(feedback(client, 2)).toContain('run_javascript: paused')
  })

  test('session compaction retains named data and clears automatic results by origin', async () => {
    const { chat } = makeChat()
    const first = await executeContext({
      chat,
      client: new NativeClient([javascript('const retained = { n: 42 }; return "discard";'), response('Done.')]),
    })
    first.session.prune([first.iterations[1]!.id])
    expect(first.session.memory.variables.retained).toEqual({ n: 42 })
    expect(first.session.getBindings().$return).toBeUndefined()
    const client = new NativeClient([
      javascript('return { n: retained.n, history: $iterations.length };'),
      response('Done again.'),
    ])
    first.session.append({ role: 'user', content: 'Continue' })

    const second = await executeContext({
      session: first.session,
      chat,
      client,
    })
    expect(second.session.getBindings().$return).toEqual({ n: 42, history: 1 })
    expect(client.requests[0]!.messages.some((message) => message.type === 'tool_result')).toBe(false)
  })

  test('reserved result history cannot be overwritten by model code', async () => {
    const client = new NativeClient([
      javascript('return { n: 1 };'),
      javascript('$return.n = 900;'),
      javascript('return $return.n;'),
      javascript('return exit("done", { value: 1 });'),
    ])
    const result = await executeContext({ client, exits: [done], options: { loop: 6 } })
    expect(result.isSuccess()).toBe(true)
    expect(result.session.getBindings().$return).toBe(1)
  })

  test('cancellation from an iteration hook prevents model and business calls', async () => {
    const action = vi.fn()
    const client = new NativeClient([javascript('await action();')])
    const result = await executeContext({
      client,
      tools: [new Tool({ name: 'action', handler: action })],
      onIterationStart: (_iteration, controller) => {
        controller.abort('Stop')
      },
    })
    expect(result.isError()).toBe(true)
    expect(client.requests).toHaveLength(0)
    expect(action).not.toHaveBeenCalled()
    expect(result.iteration?.status.type).toBe('aborted')
  })

  test.each([NativeClient, NativeStreamClient])('does not accept "Done." as worker completion (%s)', async (Client) => {
    const client = new Client([response('Done.')])
    const result = await executeContext({ client, exits: [done], options: { loop: 1 } })

    expect(client.requests[0]!.toolControl).toEqual({ mode: 'required', parallel: false })
    expect(result.isError()).toBe(true)
    expect(result.is(done)).toBe(false)
  })

  test('worker assistant prose requests an exit instead of silently completing', async () => {
    const client = new NativeClient([response('The answer is 42.'), javascript('return exit("done", { value: 42 });')])

    const result = await executeContext({ client, exits: [done], options: { loop: 6 } })

    expect(result.is(done)).toBe(true)
    expect(client.requests[1]!.messages.at(-1)?.content).toContain(
      'return exit(name, payload) with a registered name and a valid payload'
    )
  })

  test('a failed component delivery preserves earlier deliveries and skips the exit', async () => {
    const shown: string[] = []
    const card = new Component({
      name: 'card',

      description: 'Card',
      props: z.object({ title: z.string() }),
    })
    const client = new NativeClient([
      javascript(`
        chat.card({ title: 'One' });
        chat.card({ title: 'Fails' });
        return exit();
      `),
      javascript('return exit();'),
    ])
    const onExit = vi.fn()
    const result = await executeContext({
      client,
      onExit,
      chat: createRecordingChat({
        components: [card],
        handler: (message) => {
          if (((message.type === 'component' ? message.props : {}) as Record<string, unknown>).title === 'Fails') {
            throw new Error('Delivery unavailable')
          }

          shown.push(((message.type === 'component' ? message.props : {}) as Record<string, unknown>).title as string)
        },
      }),
    })
    expect(result.isSuccess()).toBe(true)
    expect(shown).toEqual(['One'])
    expect(onExit).toHaveBeenCalledOnce()
    expect(feedback(client)).toContain('Messages sent')
    expect(feedback(client)).toContain('Delivery unavailable')
    expect(result.session.pendingCalls).toEqual([])
  })

  test('parallel execution within JavaScript remains supported', async () => {
    const calls: number[] = []
    const read = new Tool({
      name: 'read',
      input: z.number(),
      handler: async (n) => {
        calls.push(n)
        return n * 2
      },
    })
    const client = new NativeClient([
      javascript('const values = await Promise.all([read(1), read(2)]); return values;'),
      javascript('return exit("done", { value: 6 });'),
    ])
    const result = await executeContext({ client, tools: [read], exits: [done] })
    expect(result.isSuccess()).toBe(true)
    expect(calls).toEqual([1, 2])
    expect(result.session.getBindings().$return).toEqual([2, 4])
  })

  test('stream previews correlate with committed text and never commit before completion', async () => {
    const { chat, sent, deltas } = makeChat()
    const client = new NativeStreamClient([response('Streaming answer')], 2, () => {
      expect(sent).toHaveLength(0)
    })
    const result = await executeContext({ client, chat })
    expect(result.isSuccess()).toBe(true)
    expect(deltas.filter((delta) => !delta.restart).every((delta) => delta.id === sent[0]?.metadata.id)).toBe(true)
    expect(result.iteration?.llm?.time_to_first_token).toBeGreaterThanOrEqual(0)
  })
})
