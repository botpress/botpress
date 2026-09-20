import type { CognitiveStreamChunk } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import type { ChatMessage } from '../chat.js'
import { DefaultComponents } from '../component.default.js'
import { ListenExit } from '../context.js'
import type { RuntimeGenerateContentInput } from '../custom-client.js'
import { Exit } from '../exit.js'
import { ObjectInstance } from '../objects.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { createRecordingChat } from './fixtures/chat.js'
import { NativeClient, javascript, nativeMetadata } from './fixtures/native-client.js'

const done = new Exit({
  name: 'done',
  description: 'Complete with the verified value.',
  schema: z.object({ value: z.number() }),
})

const other = new Exit({
  name: 'other',
  description: 'Complete through the alternate route.',
  schema: z.object({ value: z.number() }),
})

function recordingChat() {
  const delivered: ChatMessage[] = []
  const chat = createRecordingChat({
    components: [DefaultComponents.Buttons],
    handler: (message) => {
      delivered.push(message)
    },
  })

  return { chat, delivered }
}

function createGate() {
  let release!: () => void
  const promise = new Promise<void>((resolve) => {
    release = resolve
  })

  return { promise, release }
}

class ExitStreamClient extends NativeClient {
  public streamClosed = false

  public constructor(
    code: string,
    private readonly _tailGate: Promise<void>,
    private readonly _failAfterCall = false
  ) {
    super([javascript(code)])
  }

  public async *generateTextStream(input: RuntimeGenerateContentInput): AsyncGenerator<CognitiveStreamChunk> {
    const next = await this.generateText(input)

    try {
      yield { toolCalls: next.toolCalls, created: Date.now() }

      await this._tailGate

      if (this._failAfterCall) {
        throw new Error('Response stream failed after exit was requested.')
      }

      yield {
        toolCalls: next.toolCalls,
        metadata: { ...nativeMetadata, stopReason: 'tool_calls' },
        finished: true,
        created: Date.now(),
      }
    } finally {
      this.streamClosed = true
    }
  }
}

describe.each([
  { name: 'Node', quickjs: 'false' },
  { name: 'QuickJS', quickjs: 'true' },
])('immediate exit control flow ($name)', ({ quickjs }) => {
  beforeEach(() => {
    vi.stubEnv('USE_QUICKJS', quickjs)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test.each(['exit("done", { value: 42 });', 'return exit("done", { value: 42 });'])(
    'completes with and without a return statement: %s',
    async (code) => {
      const onExit = vi.fn()
      const client = new NativeClient([javascript(code)])

      const result = await executeContext({ client, exits: [done], onExit, options: { loop: 1 } })

      expect(result.is(done)).toBe(true)
      expect(result.output).toEqual({ value: 42 })
      expect(client.requests).toHaveLength(1)
      expect(onExit).toHaveBeenCalledOnce()
      expect(result.session.getBindings().$return).toBeUndefined()
      expect(result.session.pendingCalls).toEqual([])
    }
  )

  test('exit without arguments listens immediately and skips subsequent messages', async () => {
    const { chat, delivered } = recordingChat()
    const client = new NativeClient([
      javascript(`
        exit();
        chat.buttons([{ label: 'Never sent' }]);
      `),
    ])

    const result = await executeContext({ client, chat, options: { loop: 1 } })

    expect(result.is(ListenExit)).toBe(true)
    expect(delivered).toEqual([])
    expect(client.requests).toHaveLength(1)
  })

  test('retains completed work and stops later tools, object writes, and local mutations', async () => {
    const read = vi.fn(async () => ({ total: 42 }))
    const after = vi.fn()
    const state = new ObjectInstance({
      name: 'State',
      properties: [{ name: 'value', value: 'initial', type: z.string(), writable: true }],
    })
    const { chat, delivered } = recordingChat()
    const client = new NativeClient([
      javascript(`
        const account = await readAccount();
        let phase = 'before';
        const local = { value: 'before' };
        const history = ['before'];
        State.value = 'before';

        exit('done', { value: account.total });

        phase = 'after';
        local.value = 'after';
        history.push('after');
        State.value = 'after';
        await after();
        chat.buttons([{ label: 'Never sent' }]);
        const createdAfterExit = true;
      `),
    ])

    const result = await executeContext({
      client,
      chat,
      exits: [done],
      objects: [state],
      tools: [new Tool({ name: 'readAccount', handler: read }), new Tool({ name: 'after', handler: after })],
      options: { loop: 1 },
    })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(read).toHaveBeenCalledOnce()
    expect(after).not.toHaveBeenCalled()
    expect(delivered).toEqual([])
    expect(result.session.memory.variables).toMatchObject({
      account: { total: 42 },
      phase: 'before',
      local: { value: 'before' },
      history: ['before'],
    })
    expect(result.session.memory.variables).not.toHaveProperty('createdAfterExit')
    expect(result.session.memory.getObjectPropertyValue('State', 'value')).toBe('before')
  })

  test('catch and finally cannot swallow exit, mutate memory, or replace its payload', async () => {
    const after = vi.fn()
    const { chat, delivered } = recordingChat()
    const state = new ObjectInstance({
      name: 'State',
      properties: [{ name: 'value', value: 'before', type: z.string(), writable: true }],
    })
    const client = new NativeClient([
      javascript(`
        let phase = 'before';
        const local = { value: 'before' };

        try {
          exit('done', { value: 42 });
        } catch (error) {
          phase = 'caught';
          local.value = 'caught';
          await after();
        } finally {
          phase = 'finally';
          local.value = 'finally';
          State.value = 'finally';
          chat.buttons([{ label: 'Never sent' }]);
          await after();
          return exit('other', { value: 99 });
        }
      `),
    ])
    const onExit = vi.fn()

    const result = await executeContext({
      client,
      chat,
      exits: [done, other],
      objects: [state],
      tools: [new Tool({ name: 'after', handler: after })],
      onExit,
      options: { loop: 1 },
    })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(result.session.memory.variables).toMatchObject({ phase: 'before', local: { value: 'before' } })
    expect(result.session.memory.getObjectPropertyValue('State', 'value')).toBe('before')
    expect(after).not.toHaveBeenCalled()
    expect(delivered).toEqual([])
    expect(onExit).toHaveBeenCalledOnce()
  })

  test.each([
    { name: 'destructuring defaults', parameter: "{ missing = (phase = 'catch default') }" },
    { name: 'computed property keys', parameter: "{ [phase = 'catch computed']: missing }" },
  ])('blocks catch parameter $name after a successful exit', async ({ parameter }) => {
    const client = new NativeClient([
      javascript(`
        let phase = 'before';

        try {
          exit('done', { value: 42 });
        } catch (${parameter}) {
          phase = 'catch body';
        }
      `),
    ])

    const result = await executeContext({ client, exits: [done], options: { loop: 1 } })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(result.session.memory.variables.phase).toBe('before')
  })

  test('halts same-line catch and finally code without relying on line tracking', async () => {
    const client = new NativeClient([
      javascript(
        "let phase = 'before'; try { exit('done', { value: 42 }); } catch { phase = 'caught'; } finally { phase = 'finally'; } phase = 'after';"
      ),
    ])

    const result = await executeContext({ client, exits: [done], options: { loop: 1 } })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(result.session.memory.variables.phase).toBe('before')
  })

  test.each([
    {
      name: 'synchronous helper',
      code: `
        function finish() {
          exit('done', { value: 42 });
          phase = 'inside helper';
        }

        finish();
      `,
    },
    {
      name: 'nested asynchronous helper',
      code: `
        async function finish() {
          const account = await readAccount();
          exit('done', { value: account.total });
          phase = 'inside async helper';
        }

        async function outer() {
          await finish();
          phase = 'inside outer helper';
        }

        await outer();
      `,
    },
  ])('propagates terminal control flow out of a $name', async ({ code }) => {
    const after = vi.fn()
    const client = new NativeClient([
      javascript(`
        let phase = 'before';
        ${code}
        phase = 'after';
        await after();
      `),
    ])

    const result = await executeContext({
      client,
      exits: [done],
      tools: [
        new Tool({ name: 'readAccount', handler: async () => ({ total: 42 }) }),
        new Tool({ name: 'after', handler: after }),
      ],
      options: { loop: 1 },
    })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(result.session.memory.variables.phase).toBe('before')
    expect(after).not.toHaveBeenCalled()
    expect(client.requests).toHaveLength(1)
  })

  test('keeps invalid exit payloads catchable and allows valid work afterward', async () => {
    const read = vi.fn(async () => ({ total: 42 }))
    const client = new NativeClient([
      javascript(`
        let rejected = false;

        try {
          exit('done', { value: 'invalid' });
        } catch (error) {
          rejected = true;
        }

        const account = await readAccount();
        exit('done', { value: account.total });
      `),
    ])

    const result = await executeContext({
      client,
      exits: [done],
      tools: [new Tool({ name: 'readAccount', handler: read })],
      options: { loop: 1 },
    })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(result.session.memory.variables.rejected).toBe(true)
    expect(result.session.memory.variables.account).toEqual({ total: 42 })
    expect(read).toHaveBeenCalledOnce()
  })

  test.each([
    {
      name: 'promise callback',
      code: `
        Promise.resolve().then(() => {
          exit('done', { value: 42 });
          phase = 'inside callback';
        });
      `,
    },
    {
      name: 'detached asynchronous helper',
      code: `
        async function finish() {
          await Promise.resolve();
          exit('done', { value: 42 });
          phase = 'inside detached helper';
        }

        const pending = finish();
      `,
    },
  ])('settles an exit from a $name without unhandled rejections', async ({ code }) => {
    const after = vi.fn()
    const unhandled: unknown[] = []
    const recordUnhandled = (error: unknown) => {
      unhandled.push(error)
    }
    const client = new NativeClient([
      javascript(`
        let phase = 'before';
        ${code}
        await Promise.resolve();
        phase = 'after';
        await after();
      `),
    ])

    process.on('unhandledRejection', recordUnhandled)

    try {
      const result = await executeContext({
        client,
        exits: [done],
        tools: [new Tool({ name: 'after', handler: after })],
        options: { loop: 1 },
      })

      // Unhandled rejections are emitted after the promise microtask queue drains.
      await new Promise<void>((resolve) => setImmediate(resolve))

      expect(result.is(done)).toBe(true)
      expect(result.output).toEqual({ value: 42 })
      expect(result.session.memory.variables.phase).toBe('before')
      expect(after).not.toHaveBeenCalled()
      expect(unhandled).toEqual([])
    } finally {
      process.off('unhandledRejection', recordUnhandled)
    }
  })

  test.each([
    {
      name: 'parameter defaults',
      callback: "(value = (phase = 'callback default')) => { phase = 'callback body'; }",
      argument: 'undefined',
    },
    {
      name: 'computed destructuring keys',
      callback: "({ [phase = 'callback computed']: value }) => { phase = 'callback body'; }",
      argument: '{}',
    },
  ])('blocks queued callback $name after a successful exit', async ({ callback, argument }) => {
    const client = new NativeClient([
      javascript(`
        let phase = 'before';
        Promise.resolve(${argument}).then(${callback});
        exit('done', { value: 42 });
      `),
    ])

    const result = await executeContext({ client, exits: [done], options: { loop: 1 } })

    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(result.session.memory.variables.phase).toBe('before')
  })

  test('observes a pending sibling rejection without losing the requested exit', async () => {
    const unhandled: unknown[] = []
    const recordUnhandled = (error: unknown) => {
      unhandled.push(error)
    }
    const client = new NativeClient([
      javascript(`
        const sibling = Promise.reject(new Error('Detached sibling failed'));
        exit('done', { value: 42 });
      `),
    ])

    process.on('unhandledRejection', recordUnhandled)

    try {
      const result = await executeContext({ client, exits: [done], options: { loop: 1 } })

      await new Promise<void>((resolve) => setImmediate(resolve))

      expect(result.is(done)).toBe(true)
      expect(result.output).toEqual({ value: 42 })
      expect(unhandled).toEqual([])
    } finally {
      process.off('unhandledRejection', recordUnhandled)
    }
  })

  test('retains prior inspection results when a later generation exits immediately', async () => {
    const client = new NativeClient([
      javascript('return inspect({ value: 42 });'),
      javascript('exit("done", { value: $return.value });'),
    ])

    const result = await executeContext({ client, exits: [done], options: { loop: 2 } })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(result.session.getBindings().$return).toEqual({ value: 42 })
    expect(client.requests).toHaveLength(2)
  })

  test('settles synchronous component deliveries before applying a typed exit', async () => {
    const { chat, delivered } = recordingChat()
    const client = new NativeClient([
      javascript(`
        chat.buttons([{ label: 'Continue' }]);
        return exit('done', { value: 42 });
      `),
    ])
    const onExit = vi.fn(() => {
      expect(delivered.map((message) => (message.type === 'component' ? message.props : {}))).toEqual([
        [{ action: 'say', label: 'Continue' }],
      ])
    })

    const result = await executeContext({ client, chat, exits: [done], onExit, options: { loop: 1 } })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(onExit).toHaveBeenCalledOnce()
    expect(client.requests).toHaveLength(1)
  })

  test('settles synchronous component deliveries before a bare exit completes', async () => {
    const { chat, delivered } = recordingChat()
    const client = new NativeClient([
      javascript(`
        chat.buttons([{ label: 'Sent before exit' }]);
        exit('done', { value: 42 });
      `),
    ])

    const result = await executeContext({ client, chat, exits: [done], options: { loop: 1 } })

    expect(result.is(done)).toBe(true)
    expect(delivered.map((message) => (message.type === 'component' ? message.props : {}))).toEqual([
      [{ action: 'say', label: 'Sent before exit' }],
    ])
  })

  test.each(['stream', 'execution'] as const)(
    'joins both sides before applying exit when %s finishes first',
    async (first) => {
      const streamGate = createGate()
      const toolGate = createGate()
      const onExit = vi.fn()
      const read = vi.fn(async () => {
        await toolGate.promise

        return { total: 42 }
      })
      const client = new ExitStreamClient(
        'const account = await readAccount(); exit("done", { value: account.total });',
        streamGate.promise
      )
      let executionRecorded = false
      let completed = false
      const execution = executeContext({
        client,
        exits: [done],
        tools: [new Tool({ name: 'readAccount', handler: read })],
        onExit,
        onTrace: ({ trace }) => {
          if (trace.type === 'code_execution') {
            executionRecorded = true
          }
        },
        options: { loop: 1 },
      }).then((result) => {
        completed = true

        return result
      })

      try {
        await vi.waitFor(() => expect(read).toHaveBeenCalledOnce())

        if (first === 'stream') {
          streamGate.release()
          await vi.waitFor(() => expect(client.streamClosed).toBe(true))
          expect(executionRecorded).toBe(false)
        } else {
          toolGate.release()
          await vi.waitFor(() => expect(executionRecorded).toBe(true))
          expect(client.streamClosed).toBe(false)
        }

        expect(completed).toBe(false)
        expect(onExit).not.toHaveBeenCalled()
      } finally {
        streamGate.release()
        toolGate.release()
      }

      const result = await execution

      expect(result.is(done)).toBe(true)
      expect(result.output).toEqual({ value: 42 })
      expect(result.session.memory.variables.account).toEqual({ total: 42 })
      expect(read).toHaveBeenCalledOnce()
      expect(onExit).toHaveBeenCalledOnce()
      expect(client.requests).toHaveLength(1)
    }
  )

  test('withholds an already requested exit after a later stream failure and retains completed work', async () => {
    const streamGate = createGate()
    const read = vi.fn(async () => ({ total: 42 }))
    const after = vi.fn()
    const onExit = vi.fn()
    const client = new ExitStreamClient(
      'const account = await readAccount(); exit("done", { value: account.total }); await after();',
      streamGate.promise,
      true
    )
    let executionRecorded = false
    const execution = executeContext({
      client,
      exits: [done],
      tools: [new Tool({ name: 'readAccount', handler: read }), new Tool({ name: 'after', handler: after })],
      onExit,
      onTrace: ({ trace }) => {
        if (trace.type === 'code_execution') {
          executionRecorded = true
        }
      },
      options: { loop: 3, midStreamFallback: true },
    })

    try {
      await vi.waitFor(() => expect(executionRecorded).toBe(true))
      expect(onExit).not.toHaveBeenCalled()
    } finally {
      streamGate.release()
    }

    const result = await execution

    expect(result.isError()).toBe(true)
    expect(result.session.memory.variables.account).toEqual({ total: 42 })
    expect(result.session.pendingCalls).toEqual([])
    expect(read).toHaveBeenCalledOnce()
    expect(after).not.toHaveBeenCalled()
    expect(onExit).not.toHaveBeenCalled()
    expect(client.requests).toHaveLength(1)
  })
})
