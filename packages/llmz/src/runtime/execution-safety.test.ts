import { z } from '@bpinternal/zui'
import { describe, expect, it, vi } from 'vitest'
import { Chat, type MessageDelta } from '../chat.js'
import { Component } from '../component.js'
import { SnapshotSignal } from '../errors.js'
import { Exit } from '../exit.js'
import { Session } from '../session.js'
import { Snapshot } from '../snapshots.js'
import { Tool } from '../tool.js'
import type { Transcript } from '../transcript.js'
import { executeContext } from './execute.js'
import { NativeClient, NativeStreamClient, javascript, nativeCall, response } from './fixtures/native-client.js'

const done = new Exit({ name: 'complete', description: 'Complete the work', schema: z.object({ ok: z.boolean() }) })
const finish = () => javascript('return exit("complete", { ok: true });')
const toolResults = (client: NativeClient, request: number) =>
  client.requests[request]!.messages.filter((message) => message.type === 'tool_result')

describe('native execution safety', () => {
  it('a policy hook can abort before a business handler starts', async () => {
    const action = vi.fn(async () => ({ charged: true }))
    const after = vi.fn()
    const client = new NativeClient([javascript('return await charge();')])
    const result = await executeContext({
      client,
      tools: [new Tool({ name: 'charge', handler: action })],
      exits: [done],
      onBeforeTool: async ({ controller }) => {
        controller.abort('Policy rejected payment')
      },
      onAfterTool: after,
    })

    expect(result.isError()).toBe(true)
    expect(action).not.toHaveBeenCalled()
    expect(after).not.toHaveBeenCalled()
    expect(result.session.pendingCalls).toHaveLength(0)
    expect(client.requests).toHaveLength(1)
  })

  it('correlates inner handlers, hooks, and traces with the enclosing native call', async () => {
    const seen: Array<string | undefined> = []
    const handler = vi.fn(async (_input, context) => {
      seen.push(context.nativeCallId)

      return true
    })
    const outer = nativeCall('run_javascript', { code: 'return await operation();' }, 'outer-call')
    const result = await executeContext({
      client: new NativeClient([response('', [outer]), finish()]),
      tools: [new Tool({ name: 'operation', handler })],
      exits: [done],
      onBeforeTool: async (event) => {
        seen.push(event.nativeCallId)
      },
      onAfterTool: async (event) => {
        seen.push(event.nativeCallId)
      },
    })

    expect(result.isSuccess()).toBe(true)
    expect(seen).toEqual(['outer-call', 'outer-call', 'outer-call'])
    expect(result.iterations[0]?.traces.find((trace) => trace.type === 'tool_call')).toMatchObject({
      native_call_id: 'outer-call',
      success: true,
    })
  })

  it('an observational trace error cannot turn a successful action into failed work', async () => {
    const action = vi.fn(async () => ({ charged: true }))
    const client = new NativeClient([javascript('const payment = await charge(); return payment;'), finish()])
    const result = await executeContext({
      client,
      tools: [new Tool({ name: 'charge', handler: action })],
      exits: [done],
      onTrace: ({ trace }) => {
        if (trace.type === 'tool_call') {
          throw new Error('Metrics transport failed')
        }
      },
    })

    expect(result.isSuccess()).toBe(true)
    expect(action).toHaveBeenCalledOnce()
    expect(result.session.memory.variables.payment).toEqual({ charged: true })
    expect(result.session.memory.getBindings().$return).toEqual({ charged: true })
    expect(toolResults(client, 1)[0]?.content).toContain('RETURN')
  })

  it('retracts provisional text when a completed response has an invalid native batch', async () => {
    const deltas: MessageDelta[] = []
    const handler = vi.fn()
    const business = vi.fn()
    const chat = new Chat({
      components: [],
      handler,
      onMessageDelta: (delta) => {
        deltas.push(delta)
      },
    })
    const client = new NativeStreamClient([
      response('The action is complete.', [
        nativeCall('run_javascript', { code: 'await action()' }),
        nativeCall('listen'),
      ]),
      javascript('return exit();'),
    ])
    const result = await executeContext({ client, chat, tools: [new Tool({ name: 'action', handler: business })] })

    expect(result.isSuccess()).toBe(true)
    expect(deltas.some((delta) => !delta.restart)).toBe(true)
    expect(deltas.filter((delta) => delta.restart)).toHaveLength(1)
    expect(handler).not.toHaveBeenCalled()
    expect(business).not.toHaveBeenCalled()
    expect(toolResults(client, 1)).toHaveLength(2)
  })

  it('does not replay earlier successful presentation after a later delivery or exit fails', async () => {
    const card = new Component({
      name: 'Card',
      type: 'leaf',
      description: 'Card',
      leaf: { props: z.object({ id: z.string() }) },
    })
    const displayed: string[] = []
    const handler = vi.fn((message) => {
      displayed.push(message.props.id)

      if (message.props.id === 'uncertain') {
        throw new Error('Connection failed after send')
      }
    })
    const client = new NativeClient([
      javascript(`return chat.present({
        messages: [
          { component: "Card", props: { id: "delivered" } },
          { component: "Card", props: { id: "uncertain" } },
          { component: "Card", props: { id: "skipped" } }
        ]
      });`),
      javascript('return exit();'),
    ])
    const result = await executeContext({ client, chat: new Chat({ components: [card], handler }) })

    expect(result.isSuccess()).toBe(true)
    expect(displayed).toEqual(['delivered', 'uncertain'])
    const feedback = toolResults(client, 1)

    expect(feedback).toHaveLength(1)
    expect(feedback[0]?.content).toContain('delivered')
    expect(feedback[0]?.content).toContain('uncertain')
    expect(feedback[0]?.content).toContain('Later messages were skipped')
  })

  it('retains matched failure feedback when an after-tool hook throws after the effect', async () => {
    const effect = vi.fn(async () => ({ receipt: 'paid' }))
    const client = new NativeClient([javascript('return await pay();'), finish()])
    const result = await executeContext({
      client,
      tools: [new Tool({ name: 'pay', handler: effect })],
      exits: [done],
      onAfterTool: () => {
        throw new Error('Result decoration failed')
      },
    })

    expect(result.isSuccess()).toBe(true)
    expect(effect).toHaveBeenCalledOnce()
    expect(toolResults(client, 1)[0]?.content).toContain('Result decoration failed')
    expect(result.session.pendingCalls).toEqual([])
  })

  it('records iteration hook errors as runtime context without fabricated native results', async () => {
    const client = new NativeClient([finish()])
    let hooks = 0
    const result = await executeContext({
      client,
      exits: [done],
      onIterationStart: () => {
        if (hooks++ === 0) {
          throw new Error('Context fetch failed temporarily')
        }
      },
    })

    expect(result.isSuccess()).toBe(true)
    expect(client.requests).toHaveLength(1)
    expect(client.requests[0]!.messages.some((message) => message.type === 'tool_result')).toBe(false)
    expect(JSON.stringify(client.requests[0]!.messages)).toContain('Context fetch failed temporarily')
  })

  it('rejects new transcript input on snapshot resume instead of silently discarding it', async () => {
    const history: Transcript.Message[] = [{ role: 'user', content: 'Start my job' }]
    const chat = new Chat({ components: [], transcript: () => history, handler: () => {} })
    const first = await executeContext({
      chat,
      client: new NativeClient([javascript('const job = await pause();')]),
      tools: [
        new Tool({
          name: 'pause',
          handler: () => {
            throw new SnapshotSignal('Running')
          },
        }),
      ],
    })

    if (!first.isInterrupted()) {
      throw new Error('Expected a pending snapshot')
    }

    const snapshot = Snapshot.fromJSON(JSON.parse(JSON.stringify(first.snapshot)))
    snapshot.resolve({ id: 'job-1' })
    history.push({ role: 'user', content: 'Cancel the job instead' })
    const client = new NativeClient([javascript('return exit();')])
    const resumed = await executeContext({ snapshot, chat, client })

    expect(resumed.isError()).toBe(true)
    expect(client.requests).toHaveLength(0)
    expect(snapshot.status.type).toBe('resolved')
  })

  it('snapshot rejection preserves the previous return and pairs the original outer call', async () => {
    const tools = [
      new Tool({
        name: 'pause',
        handler: () => {
          throw new SnapshotSignal('Waiting')
        },
      }),
    ]
    const first = await executeContext({
      client: new NativeClient([javascript('return 17;'), javascript('const task = await pause(); return 99;')]),
      tools,
      exits: [done],
    })

    if (!first.isInterrupted()) {
      throw new Error('Expected interrupted result')
    }

    const pendingId = first.snapshot.pendingCall!.callId
    first.snapshot.reject(new Error('Remote job failed'))
    const client = new NativeClient([finish()])
    const result = await executeContext({ snapshot: first.snapshot, tools, client, exits: [done] })

    expect(result.isSuccess()).toBe(true)
    expect(result.session.memory.getBindings().$return).toBe(17)
    expect(result.session.memory.variables).not.toHaveProperty('task')
    expect(client.requests[0]!.messages.find((message) => message.toolResultCallId === pendingId)?.content).toContain(
      'failed'
    )
    expect(result.session.pendingCalls).toEqual([])
  })

  it('cannot resume the same snapshot object twice after accepting its pending result', async () => {
    const tools = [
      new Tool({
        name: 'pause',
        handler: async () => {
          throw new SnapshotSignal('Waiting')
        },
      }),
    ]
    const first = await executeContext({
      client: new NativeClient([javascript('await pause();')]),
      tools,
      exits: [done],
    })

    if (!first.isInterrupted()) {
      throw new Error('Expected interrupted result')
    }

    first.snapshot.resolve(true)
    const resumed = await executeContext({
      snapshot: first.snapshot,
      tools,
      client: new NativeClient([finish()]),
      exits: [done],
    })
    const repeatedClient = new NativeClient([finish()])
    const repeated = await executeContext({ snapshot: first.snapshot, tools, client: repeatedClient, exits: [done] })

    expect(resumed.isSuccess()).toBe(true)
    expect(repeated.isError()).toBe(true)
    expect(repeatedClient.requests).toHaveLength(0)
  })

  it('prevents concurrent executions from changing one retained session', async () => {
    const session = new Session()
    let release!: () => void
    let started = false
    const client = new NativeClient([finish()])
    const realGenerate = client.generateText.bind(client)
    client.generateText = async (input) => {
      started = true
      await new Promise<void>((resolve) => {
        release = resolve
      })

      return realGenerate(input)
    }
    const first = executeContext({ session, client, exits: [done] })
    await vi.waitFor(() => expect(started).toBe(true))
    const competing = new NativeClient([finish()])
    const second = await executeContext({ session, client: competing, exits: [done] })

    expect(second.isError()).toBe(true)
    expect(competing.requests).toHaveLength(0)
    expect(session.turn).toBe(1)
    release()

    expect((await first).isSuccess()).toBe(true)
  })
})
