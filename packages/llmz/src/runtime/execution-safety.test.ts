import { z } from '@bpinternal/zui'
import { describe, expect, it, vi } from 'vitest'
import { type MessageDelta } from '../chat/chat.js'
import { Component } from '../chat/component.js'
import { Exit } from '../exit.js'
import { ObjectInstance } from '../objects.js'
import { MemoryCapacityError } from '../session/memory.js'
import { Session } from '../session/session.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { createRecordingChat } from './fixtures/chat.js'
import { NativeClient, NativeStreamClient, javascript, nativeCall, response } from './fixtures/native-client.js'

const done = new Exit({ name: 'complete', description: 'Complete the work', schema: z.object({ ok: z.boolean() }) })
const finish = () => javascript('return exit("complete", { ok: true });')
const toolResults = (client: NativeClient, request: number) =>
  client.requests[request]!.messages.filter((message) => message.type === 'tool_result')

describe('native execution safety', () => {
  it('settles a capacity failure without replaying effects or leaving an unsavable session', async () => {
    const session = new Session({ maxBytes: 5000 })
    const receipt = 'x'.repeat(3200)
    const action = vi.fn(async () => receipt)
    const client = new NativeClient([
      javascript('const receipt = await action(); throw new Error("large diagnostic ".repeat(200));'),
    ])
    const result = await executeContext({
      client,
      session,
      tools: [new Tool({ name: 'action', handler: action })],
      exits: [done],
    })

    expect(result.isError()).toBe(true)
    if (result.isError()) {
      expect(result.error).toBeInstanceOf(MemoryCapacityError)
    }

    expect(action).toHaveBeenCalledOnce()
    expect(client.requests).toHaveLength(1)
    expect(session.pendingCalls).toEqual([])
    expect(session.iterations[0]?.outcome).toBe('error')
    expect(session.memory.variables.receipt).toBe(receipt)
    expect(Session.fromJSON(JSON.parse(JSON.stringify(session))).memory.variables.receipt).toBe(receipt)
  })

  it('closes an inspected call when a property update exceeds memory capacity', async () => {
    const session = new Session({ maxBytes: 5000 })
    const action = vi.fn(async () => 'completed')
    const account = new ObjectInstance({
      name: 'account',
      properties: [{ name: 'name', value: 'original', type: z.string(), writable: true }],
    })
    const client = new NativeClient([
      javascript('const receipt = await action(); account.name = "x".repeat(10000); return inspect({ ok: true });'),
    ])
    const result = await executeContext({
      client,
      session,
      objects: [account],
      tools: [new Tool({ name: 'action', handler: action })],
      exits: [done],
    })

    expect(result.isError()).toBe(true)
    if (result.isError()) {
      expect(result.error).toBeInstanceOf(MemoryCapacityError)
    }

    expect(action).toHaveBeenCalledOnce()
    expect(client.requests).toHaveLength(1)
    expect(session.pendingCalls).toEqual([])
    expect(session.iterations[0]?.outcome).toBe('execution_error')
    expect(session.memory.variables.receipt).toBe('completed')
    expect(session.memory.getObjectPropertyValue('account', 'name')).toBe('original')
    expect(session.messages.at(-1)?.content).toContain('Memory limit exceeded')
    expect(() => Session.fromJSON(JSON.parse(JSON.stringify(session)))).not.toThrow()
  })

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
    expect(result.session.getBindings().$return).toEqual({ charged: true })
    expect(toolResults(client, 1)[0]?.content).toContain('Result')
  })

  it('retracts provisional text when a completed response has an invalid native batch', async () => {
    const deltas: MessageDelta[] = []
    const handler = vi.fn()
    const business = vi.fn()
    const chat = createRecordingChat({
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
    const result = await executeContext({
      client,
      chat,
      tools: [new Tool({ name: 'action', handler: business })],
      options: { requireChatResponse: false },
    })

    expect(result.isSuccess()).toBe(true)
    expect(deltas.some((delta) => !delta.restart)).toBe(true)
    expect(deltas.filter((delta) => delta.restart)).toHaveLength(1)
    expect(handler).not.toHaveBeenCalled()
    expect(business).not.toHaveBeenCalled()
    expect(toolResults(client, 1)).toHaveLength(2)
  })

  it('does not replay earlier successful delivery after a later queued delivery fails', async () => {
    const card = new Component({
      name: 'card',

      description: 'Card',
      props: z.object({ id: z.string() }),
    })
    const displayed: string[] = []
    let releaseDelivery!: () => void
    const pendingDelivery = new Promise<void>((resolve) => {
      releaseDelivery = resolve
    })
    const handler = vi.fn(async (message) => {
      displayed.push(message.props.id)

      if (message.props.id === 'uncertain') {
        await pendingDelivery

        throw new Error('Connection failed after send')
      }
    })
    const client = new NativeClient([
      javascript(`
        chat.card({ id: 'delivered' });
        chat.card({ id: 'uncertain' });
        chat.card({ id: 'skipped' });
        return exit();
      `),
      javascript('return exit();'),
    ])
    const onExit = vi.fn()
    const execution = executeContext({ client, chat: createRecordingChat({ components: [card], handler }), onExit })

    try {
      await vi.waitFor(() => expect(displayed).toEqual(['delivered', 'uncertain']))

      expect(client.requests).toHaveLength(1)
      expect(onExit).not.toHaveBeenCalled()
    } finally {
      releaseDelivery()
    }

    const result = await execution

    expect(result.isSuccess()).toBe(true)
    expect(displayed).toEqual(['delivered', 'uncertain'])
    expect(client.requests).toHaveLength(2)
    expect(onExit).toHaveBeenCalledOnce()
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
