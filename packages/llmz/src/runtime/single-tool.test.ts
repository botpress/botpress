import type { CognitiveResponse, CognitiveStreamChunk } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { describe, expect, test, vi } from 'vitest'
import { Chat, type MessageDelta, type MessageMetadata } from '../chat.js'
import { DefaultComponents } from '../component.default.js'
import type { RenderedComponent } from '../component.js'
import { ListenExit } from '../context.js'
import type { RuntimeGenerateContentInput } from '../custom-client.js'
import { Exit } from '../exit.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { NativeClient, javascript, nativeCall, nativeMetadata } from './fixtures/native-client.js'

const done = new Exit({
  name: 'done',
  description: 'Complete with the verified value.',
  schema: z.object({ value: z.number() }),
})

function recordingChat(options: { previews?: boolean } = {}) {
  const delivered: Array<{ message: RenderedComponent; metadata: MessageMetadata }> = []
  const chat = new Chat({
    components: [DefaultComponents.Text, DefaultComponents.Button, DefaultComponents.Image],
    handler: (message, metadata) => {
      delivered.push({ message, metadata })
    },
    onMessageDelta: options.previews ? () => {} : undefined,
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

type StreamTail = 'complete' | 'error' | 'restart'

class GatedStreamClient extends NativeClient {
  public firstStreamClosed = false

  public constructor(
    responses: CognitiveResponse[],
    private readonly _tailGate: Promise<void>,
    private readonly _tail: StreamTail = 'complete'
  ) {
    super(responses)
  }

  public async *generateTextStream(input: RuntimeGenerateContentInput): AsyncGenerator<CognitiveStreamChunk> {
    const next = await this.generateText(input)
    const metadata = { ...nativeMetadata, stopReason: 'tool_calls' as const }

    if (this.requests.length > 1) {
      yield { toolCalls: next.toolCalls, metadata, finished: true, created: Date.now() }
      return
    }

    try {
      yield { output: 'Checking ', created: Date.now() }
      yield { toolCalls: next.toolCalls, created: Date.now() }
      yield { output: 'the account.', created: Date.now() }

      await this._tailGate

      if (this._tail === 'error') {
        throw new Error('Transport failed after execution started')
      }

      if (this._tail === 'restart') {
        yield {
          restart: { attempt: 2, fromModel: 'fake', toModel: 'replacement', reason: 'Provider restart' },
          created: Date.now(),
        }
        yield {
          toolCalls: [nativeCall('run_javascript', { code: 'await readAccount(); return exit();' })],
          metadata,
          finished: true,
          created: Date.now(),
        }
        return
      }

      // Provider snapshots can repeat a complete call in the terminal chunk.
      yield { toolCalls: next.toolCalls, metadata, finished: true, created: Date.now() }
    } finally {
      this.firstStreamClosed = true
    }
  }
}

describe('single-tool execution decisions', () => {
  test('reads data and returns a typed exit in one generation without storing the decision as a result', async () => {
    const read = vi.fn(async () => ({ id: 'account-7', total: 42 }))
    const client = new NativeClient([
      javascript('const account = await readAccount(); return exit("done", { value: account.total });'),
    ])

    const result = await executeContext({
      client,
      tools: [new Tool({ name: 'readAccount', handler: read })],
      exits: [done],
      options: { loop: 1 },
    })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(client.requests).toHaveLength(1)
    expect(client.requests[0]?.tools?.map((tool) => tool.name)).toEqual(['run_javascript'])
    expect(read).toHaveBeenCalledOnce()
    expect(result.session.memory.variables.account).toEqual({ id: 'account-7', total: 42 })
    expect(result.session.memory.getBindings().$return).toBeUndefined()
    expect(result.session.memory.iterations[0]?.hasResult).toBe(false)
    expect(result.session.messages.filter((message) => message.type === 'tool_result')).toHaveLength(1)
    expect(result.session.pendingCalls).toEqual([])
  })

  test('unwraps inspect into $return for the next generation and preserves it through completion', async () => {
    const client = new NativeClient([
      javascript('return inspect({ value: 42 });'),
      javascript('return exit("done", { value: $return.value });'),
    ])

    const result = await executeContext({ client, exits: [done], options: { loop: 2 } })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(client.requests).toHaveLength(2)
    expect(result.session.memory.getBindings().$return).toEqual({ value: 42 })
    expect(result.session.memory.iterations[1]).toMatchObject({ hasResult: true, result: { value: 42 } })
    expect(JSON.stringify(client.requests[1]?.messages)).toContain('42')
    expect(JSON.stringify(result.session.toJSON())).not.toContain('__llmz_decision')
  })

  test('exit stops before a later ordinary return value', async () => {
    const onExit = vi.fn()
    const client = new NativeClient([
      javascript('const unused = exit("done", { value: 99 }); return { value: 7 };'),
      javascript('return exit("done", { value: $return.value });'),
    ])

    const result = await executeContext({ client, exits: [done], onExit, options: { loop: 2 } })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 99 })
    expect(result.iterations[0]?.status.type).toBe('exit_success')
    expect(result.session.memory.getBindings().$return).toBeUndefined()
    expect(result.session.memory.variables).not.toHaveProperty('unused')
    expect(client.requests).toHaveLength(1)
    expect(onExit).toHaveBeenCalledOnce()
  })

  test('does not retain decision receipts nested in captured objects or arrays', async () => {
    const client = new NativeClient([
      javascript('const pending = { nested: [inspect({ value: 99 })] }; return inspect({ value: 7 });'),
      javascript('return exit("done", { value: $return.value });'),
    ])

    const result = await executeContext({ client, exits: [done], options: { loop: 2 } })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 7 })
    expect(result.session.memory.variables).not.toHaveProperty('pending')
    expect(JSON.stringify(result.session.toJSON())).not.toContain('__llmz_decision')
    expect(result.session.memory.getBindings().$return).toEqual({ value: 7 })
  })

  test('validates every presentation before delivering the first message', async () => {
    const { chat, delivered } = recordingChat()
    const onExit = vi.fn()
    const client = new NativeClient([
      javascript(`
        return chat.present({
          messages: [
            { component: 'Button', props: { label: 'Valid' } },
            { component: 'Image', props: { url: 42 } },
          ],
        });
      `),
    ])

    const result = await executeContext({ client, chat, onExit, options: { loop: 1 } })

    expect(result.isError()).toBe(true)
    expect(result.iterations[0]?.status.type).toBe('execution_error')
    expect(delivered).toEqual([])
    expect(onExit).not.toHaveBeenCalled()
    expect(result.session.pendingCalls).toEqual([])
  })

  test('constructing a presentation then throwing commits no messages or exit', async () => {
    const { chat, delivered } = recordingChat()
    const onExit = vi.fn()
    const client = new NativeClient([
      javascript(`
        const pending = chat.buttons([{ label: 'Do not deliver' }]);

        throw new Error('Later validation failed');
      `),
    ])

    const result = await executeContext({ client, chat, onExit, options: { loop: 1 } })

    expect(result.isError()).toBe(true)
    expect(result.iterations[0]?.error).toContain('Later validation failed')
    expect(delivered).toEqual([])
    expect(onExit).not.toHaveBeenCalled()
    expect(result.session.memory.variables).not.toHaveProperty('pending')
  })

  test('presents an ordered batch and applies its typed exit in the same generation', async () => {
    const { chat, delivered } = recordingChat()
    const client = new NativeClient([
      javascript(`
        return chat.present({
          messages: [
            { component: 'Button', props: { label: 'First' } },
            { component: 'Button', props: { label: 'Second' } },
          ],
          exit: { name: 'done', payload: { value: 42 } },
        });
      `),
    ])

    const result = await executeContext({
      client,
      chat,
      exits: [done],
      options: { loop: 1 },
      onExit: () => {
        expect(delivered.map(({ message }) => message.props)).toEqual([
          { action: 'say', label: 'First' },
          { action: 'say', label: 'Second' },
        ])
      },
    })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(client.requests).toHaveLength(1)
    expect(new Set(delivered.map(({ metadata }) => metadata.id)).size).toBe(2)
    expect(delivered.every(({ metadata }) => metadata.iterationId === result.iteration?.id)).toBe(true)
    expect(result.session.messages.filter((message) => message.type === 'tool_result')).toHaveLength(1)
    expect(result.session.memory.getBindings().$return).toBeUndefined()
  })

  test('button shorthand completes through listen without a second generation', async () => {
    const { chat, delivered } = recordingChat()
    const client = new NativeClient([javascript('return chat.buttons([{ label: "Standard" }, { label: "Premium" }]);')])

    const result = await executeContext({ client, chat, options: { loop: 1 } })

    expect(result.is(ListenExit)).toBe(true)
    expect(client.requests).toHaveLength(1)
    expect(delivered.map(({ message }) => message.props)).toEqual([
      { action: 'say', label: 'Standard' },
      { action: 'say', label: 'Premium' },
    ])
    expect(result.session.pendingCalls).toEqual([])
  })

  test('rejects an exit with unawaited business work and waits for the started effect to settle', async () => {
    let releaseWrite!: () => void
    let writeCompleted = false
    const gate = new Promise<void>((resolve) => {
      releaseWrite = resolve
    })
    const write = vi.fn(async () => {
      await gate
      writeCompleted = true
    })
    const onExit = vi.fn()
    const client = new NativeClient([javascript('write(); return exit("done", { value: 42 });')])
    let executionSettled = false
    const execution = executeContext({
      client,
      exits: [done],
      tools: [new Tool({ name: 'write', handler: write })],
      onExit,
      options: { loop: 1 },
    }).then((result) => {
      executionSettled = true

      return result
    })

    try {
      await vi.waitFor(() => expect(write).toHaveBeenCalledOnce())
      expect(executionSettled).toBe(false)
      expect(onExit).not.toHaveBeenCalled()
    } finally {
      releaseWrite()
    }

    const result = await execution

    expect(writeCompleted).toBe(true)
    expect(result.isError()).toBe(true)
    expect(result.iterations[0]?.error).toContain('unawaited host operation')
    expect(onExit).not.toHaveBeenCalled()
    expect(write).toHaveBeenCalledOnce()
    expect(result.session.pendingCalls).toEqual([])
  })
})

describe('overlapping streaming and JavaScript', () => {
  test.each(['stream', 'execution'] as const)(
    'starts a complete call early and waits for both sides when %s finishes first',
    async (first) => {
      const streamGate = createGate()
      const toolGate = createGate()
      const deltas: MessageDelta[] = []
      let toolFinished = false
      const read = vi.fn(async () => {
        await toolGate.promise
        toolFinished = true

        return { total: 42 }
      })
      const client = new GatedStreamClient(
        [
          javascript('const account = await readAccount(); return inspect(account);'),
          javascript('return exit("done", { value: $return.total });'),
        ],
        streamGate.promise
      )
      const execution = executeContext({
        client,
        tools: [new Tool({ name: 'readAccount', handler: read })],
        exits: [done],
        options: { loop: 2 },
        chat: new Chat({
          components: [DefaultComponents.Text],
          handler: () => {},
          onMessageDelta: (delta) => {
            deltas.push(delta)
          },
        }),
      })

      try {
        await vi.waitFor(() => expect(read).toHaveBeenCalledOnce())
        await vi.waitFor(() => {
          const text = deltas
            .filter((delta) => !delta.restart)
            .map((delta) => delta.delta)
            .join('')

          expect(text).toBe('Checking the account.')
        })

        expect(client.firstStreamClosed).toBe(false)
        expect(client.requests).toHaveLength(1)

        if (first === 'stream') {
          streamGate.release()
          await vi.waitFor(() => expect(client.firstStreamClosed).toBe(true))
          expect(toolFinished).toBe(false)
        } else {
          toolGate.release()
          await vi.waitFor(() => expect(toolFinished).toBe(true))
          expect(client.firstStreamClosed).toBe(false)
        }

        expect(client.requests).toHaveLength(1)
      } finally {
        streamGate.release()
        toolGate.release()
      }

      const result = await execution

      expect(result.is(done)).toBe(true)
      expect(result.output).toEqual({ value: 42 })
      expect(client.requests).toHaveLength(2)
      expect(read).toHaveBeenCalledOnce()
      expect(result.session.memory.variables.account).toEqual({ total: 42 })
      expect(result.session.pendingCalls).toEqual([])
    }
  )

  test.each(['stream', 'execution'] as const)(
    'withholds terminal presentation and exit until both sides finish when %s finishes first',
    async (first) => {
      const streamGate = createGate()
      const toolGate = createGate()
      const { chat, delivered } = recordingChat({ previews: true })
      const onExit = vi.fn()
      let toolFinished = false
      const read = vi.fn(async () => {
        await toolGate.promise
        toolFinished = true

        return { total: 42 }
      })
      const client = new GatedStreamClient(
        [
          javascript(`
          const account = await readAccount();

          return chat.present({
            messages: [{ component: 'Button', props: { label: 'Continue' } }],
            exit: { name: 'done', payload: { value: account.total } },
          });
        `),
        ],
        streamGate.promise
      )
      const execution = executeContext({
        client,
        chat,
        exits: [done],
        tools: [new Tool({ name: 'readAccount', handler: read })],
        onExit,
        options: { loop: 1 },
      })

      try {
        await vi.waitFor(() => expect(read).toHaveBeenCalledOnce())

        if (first === 'stream') {
          streamGate.release()
          await vi.waitFor(() => expect(client.firstStreamClosed).toBe(true))
        } else {
          toolGate.release()
          await vi.waitFor(() => expect(toolFinished).toBe(true))
        }

        expect(delivered.filter(({ message }) => message.type.toLowerCase() === 'button')).toEqual([])
        expect(onExit).not.toHaveBeenCalled()
        expect(client.requests).toHaveLength(1)
      } finally {
        streamGate.release()
        toolGate.release()
      }

      const result = await execution

      expect(result.is(done)).toBe(true)
      expect(result.output).toEqual({ value: 42 })
      expect(delivered.filter(({ message }) => message.type.toLowerCase() === 'button')).toHaveLength(1)
      expect(onExit).toHaveBeenCalledOnce()
      expect(read).toHaveBeenCalledOnce()
      expect(client.requests).toHaveLength(1)
    }
  )

  test.each(['error', 'restart'] as const)(
    'settles started effects and retains their memory without terminal delivery after a stream %s',
    async (tail) => {
      const streamGate = createGate()
      const toolGate = createGate()
      const { chat, delivered } = recordingChat({ previews: true })
      const onExit = vi.fn()
      let toolFinished = false
      let executionFinished = false
      const read = vi.fn(async () => {
        await toolGate.promise
        toolFinished = true

        return { id: 'retained-account', total: 42 }
      })
      const first = javascript(`
        const account = await readAccount();

        return chat.buttons([{ label: 'Never delivered' }]);
      `)
      const client = new GatedStreamClient([first], streamGate.promise, tail)
      const execution = executeContext({
        client,
        chat,
        tools: [new Tool({ name: 'readAccount', handler: read })],
        onExit,
        options: { loop: 3, midStreamFallback: true },
      }).then((result) => {
        executionFinished = true

        return result
      })

      try {
        await vi.waitFor(() => expect(read).toHaveBeenCalledOnce())
        streamGate.release()
        await vi.waitFor(() => expect(client.firstStreamClosed).toBe(true))

        expect(executionFinished).toBe(false)
        expect(toolFinished).toBe(false)
        expect(onExit).not.toHaveBeenCalled()
      } finally {
        streamGate.release()
        toolGate.release()
      }

      const result = await execution
      const results = result.session.messages.filter((message) => message.type === 'tool_result')

      expect(result.isError()).toBe(true)
      expect(toolFinished).toBe(true)
      expect(read).toHaveBeenCalledOnce()
      expect(client.requests).toHaveLength(1)
      expect(delivered).toEqual([])
      expect(onExit).not.toHaveBeenCalled()
      expect(result.session.memory.variables.account).toEqual({ id: 'retained-account', total: 42 })
      expect(result.session.memory.getBindings().$return).toBeUndefined()
      expect(results).toHaveLength(1)
      expect(results[0]?.toolResultCallId).toBe(first.toolCalls?.[0]?.id)
      expect(result.session.pendingCalls).toEqual([])
    }
  )
})
