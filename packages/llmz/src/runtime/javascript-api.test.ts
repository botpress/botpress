import { z } from '@bpinternal/zui'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { DefaultComponents } from '../component.default.js'
import { Component, createComponentRegistry } from '../component.js'
import { Context, ListenExit } from '../context.js'
import { Exit } from '../exit.js'
import { Memory, MemoryCapacityError } from '../memory.js'
import { ObjectInstance } from '../objects.js'
import { Session } from '../session.js'
import { Tool } from '../tool.js'
import { init } from '../utils.js'
import { runAsyncFunction } from '../vm/index.js'
import { VM_PROGRAM_COMPLETE, VM_TERMINATION, type VMContext } from '../vm/types.js'
import { executeContext } from './execute.js'
import { createRecordingChat } from './fixtures/chat.js'
import { NativeClient, javascript } from './fixtures/native-client.js'
import { createJavaScriptApi, type JavaScriptApi } from './javascript-api.js'
import { buildVMContext } from './vm-context.js'

const Buttons = new Component({
  name: 'buttons',
  description: 'Show a button.',
  props: z.array(z.object({ label: z.string().min(1), value: z.string() })).min(1),
})

const Completed = new Exit({
  name: 'completed',
  aliases: ['done'],
  description: 'Finish with an account.',
  schema: z.object({ accountId: z.string() }),
})

function setupApi() {
  const deliver = vi.fn(async () => {})
  const api = createJavaScriptApi({
    iteration: { id: 'iteration-1', nativeCallId: 'call-1' },
    components: createComponentRegistry([Buttons]),
    exits: [ListenExit, Completed],
    deliver,
  })

  return { api, deliver }
}

function apiContext(api: JavaScriptApi): VMContext {
  return {
    ...api.bindings,
    [VM_PROGRAM_COMPLETE]: api.complete,
    [VM_TERMINATION]: {
      isTerminated: () => api.getTerminalOutcome() !== undefined,
      check: api.throwIfTerminated,
    },
  }
}

describe('JavaScript completion decisions', () => {
  test('sends buttons synchronously without finishing execution', async () => {
    const { api, deliver } = setupApi()
    const returned = api.bindings.chat.buttons!([
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ])

    expect(returned).toBeUndefined()
    expect(deliver).toHaveBeenCalledOnce()
    expect(api.getTerminalOutcome()).toBeUndefined()
    expect(() => api.assertOpen()).not.toThrow()

    await api.close()

    expect(deliver).toHaveBeenCalledOnce()
    expect(deliver.mock.calls[0]).toMatchObject([
      [
        {
          id: 'call-1:message:1',
          component: {
            type: 'component',
            name: 'buttons',
            props: [
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ],
          },
        },
      ],
    ])
  })

  test('validates typed completion independently from component delivery', async () => {
    const { api, deliver } = setupApi()

    expect(() => api.bindings.exit('completed', { accountId: 42 })).toThrow()
    expect(() => api.bindings.exit('missing')).toThrow(/not available/)
    expect(() => api.bindings.exit('listen', {})).toThrow(/no payload/)

    api.bindings.chat.buttons!([{ label: 'Open account', value: 'account-1' }])

    expect(() => api.bindings.exit('done', { accountId: 'account-1' })).toThrow(/terminated/)

    await api.close()

    expect(deliver).toHaveBeenCalledOnce()
    expect(api.getTerminalOutcome()).toMatchObject({
      type: 'exit',
      exit: Completed,
      value: { accountId: 'account-1' },
    })
  })

  test('keeps the unnamed listen fallback inside the engine', () => {
    const { api } = setupApi()

    expect(() => api.bindings.exit()).toThrow(/terminated/)
    expect(api.getTerminalOutcome()).toEqual({ type: 'exit', exit: ListenExit, value: undefined })
  })

  test('requires a registered listen exit for the internal unnamed fallback', async () => {
    const deliver = vi.fn(async () => {})
    const api = createJavaScriptApi({
      iteration: { id: 'worker-1' },
      components: createComponentRegistry([Buttons]),
      exits: [Completed],
      deliver,
    })

    expect(() => api.bindings.exit()).toThrow(/listen.*not available/)
    expect(api.bindings.chat.buttons!([{ label: 'Yes', value: 'yes' }])).toBeUndefined()

    await api.close()

    expect(deliver).toHaveBeenCalledOnce()
  })

  test('validates a complete buttons array before starting its delivery', async () => {
    const { api, deliver } = setupApi()

    expect(() =>
      api.bindings.chat.buttons!([
        { label: 'Valid', value: 'valid' },
        { label: '', value: 'invalid' },
      ])
    ).toThrow()
    expect(() => api.bindings.chat.buttons!([])).toThrow()

    await api.close()

    expect(deliver).not.toHaveBeenCalled()
  })

  test('exposes only rich component methods and never offers text delivery', async () => {
    const api = createJavaScriptApi({
      iteration: { id: 'iteration-1' },
      components: createComponentRegistry([DefaultComponents.Card, Buttons]),
      exits: [ListenExit],
      deliver: async () => {},
    })

    expect(Object.keys(api.bindings.chat).sort()).toEqual(['buttons', 'card'])
    expect(api.bindings.chat).not.toHaveProperty('present')
    expect(api.bindings.chat).not.toHaveProperty('send')
    expect(api.bindings.chat).not.toHaveProperty('message')
    expect(api.bindings.chat).not.toHaveProperty('text')
    expect(api.bindings.chat).not.toHaveProperty('markdown')
    expect(api.bindings.chat).not.toHaveProperty('speech')

    await api.close()
  })

  test('does not interpret ordinary business objects or receipts from another execution', () => {
    const { api } = setupApi()
    const other = setupApi().api
    const businessValue = { type: 'exit', exit: 'completed', value: { accountId: 'account-1' } }

    expect(api.resolve(businessValue)).toBeUndefined()
    expect(api.resolve({ __llmz_decision: 'guessed' })).toBeUndefined()
    expect(api.resolve(other.bindings.inspect('other execution'))).toBeUndefined()
    expect(api.resolve(api.bindings.inspect(businessValue))).toEqual({ type: 'inspect', value: businessValue })
  })

  test('keeps the first validated exit payload despite subsequent input changes', () => {
    const { api } = setupApi()
    const payload = { accountId: 'account-1' }
    expect(() => api.bindings.exit('completed', payload)).toThrow(/terminated/)
    payload.accountId = 'changed'

    expect(() => api.bindings.exit('completed', payload)).toThrow(/terminated/)
    expect(api.getTerminalOutcome()).toMatchObject({
      type: 'exit',
      value: { accountId: 'account-1' },
    })
  })

  test('joins synchronous component calls in order without requiring await', async () => {
    const { api, deliver } = setupApi()

    api.bindings.chat.buttons!([{ label: 'First', value: 'one' }])
    api.bindings.chat.buttons!([{ label: 'Second', value: 'two' }])

    expect(() => api.assertOpen()).not.toThrow()

    await expect(api.close()).resolves.toBeUndefined()

    expect(deliver).toHaveBeenCalledTimes(2)
    expect(deliver.mock.calls).toMatchObject([[[{ id: 'call-1:message:1' }]], [[{ id: 'call-1:message:2' }]]])
    expect(() => api.bindings.exit()).toThrow(/completed/)
  })

  test.each(['exit', 'inspect', 'chat'])('reserves %s against retained variables', (name) => {
    expect(() => new Memory({ variables: { [name]: 'collision' } })).toThrow(/reserved/)
  })
})

describe('memory settlement before completion', () => {
  test('finalizes a terminal history entry when Object settlement exceeds capacity', async () => {
    const handler = vi.fn()
    const action = vi.fn(async () => true)
    const client = new NativeClient([javascript('await action(); account.name = "x".repeat(10000); return exit();')])
    const account = new ObjectInstance({
      name: 'account',
      properties: [{ name: 'name', type: z.string(), value: 'original', writable: true }],
    })

    const result = await executeContext({
      client,
      session: new Session({ maxBytes: 5000 }),
      chat: createRecordingChat({ handler }),
      objects: [account],
      tools: [new Tool({ name: 'action', handler: action })],
    })

    expect(result.isError()).toBe(true)
    expect(client.requests).toHaveLength(1)
    expect(action).toHaveBeenCalledOnce()
    expect(handler).not.toHaveBeenCalled()
    expect(result.session.iterations[0]).toMatchObject({
      outcome: 'execution_error',
      hasResult: false,
    })
    expect(result.session.memory.getObjectPropertyValue('account', 'name')).toBe('original')
  })

  test('settles the outcome without changing a captured result', () => {
    const session = new Session()
    const iteration = session.nextIteration('iteration-1')
    session.commitIteration({ ...iteration, hasResult: true, result: 42 })

    session.settleIteration(iteration.id, { outcome: 'exit_success' })

    expect(session.iterations).toHaveLength(1)
    expect(session.iterations[0]).toMatchObject({ id: 'iteration-1', outcome: 'exit_success', hasResult: true })
    expect(session.getBindings().$return).toBe(42)
  })

  test('rolls back settlement metadata that exceeds memory capacity', () => {
    const session = new Session({ maxBytes: 500 })
    const iteration = session.nextIteration('iteration-1')
    session.commitIteration({ ...iteration, hasResult: false })
    const original = session.iterations

    expect(() => session.settleIteration(iteration.id, { outcome: 'exit_error', error: 'x'.repeat(2000) })).toThrow(
      MemoryCapacityError
    )
    expect(session.iterations).toEqual(original)
    expect(session.getBindings().$return).toBeUndefined()
  })
})

for (const quickjs of ['true', 'false']) {
  describe(`JavaScript API execution (QuickJS=${quickjs})`, () => {
    let previous: string | undefined

    beforeEach(async () => {
      previous = process.env.USE_QUICKJS
      process.env.USE_QUICKJS = quickjs
      await init()
    })

    afterEach(() => {
      if (previous === undefined) {
        delete process.env.USE_QUICKJS
      } else {
        process.env.USE_QUICKJS = previous
      }
    })

    test('stops at exit before a later returned inspection decision', async () => {
      const { api, deliver } = setupApi()
      const result = await runAsyncFunction(
        apiContext(api),
        'exit("completed", { accountId: "unused" }); return inspect({ age: 42 });'
      )

      await api.close()

      expect(result.success).toBe(true)
      expect(api.getTerminalOutcome()).toMatchObject({
        type: 'exit',
        value: { accountId: 'unused' },
      })
      expect(deliver).not.toHaveBeenCalled()
    })

    test('accepts awaited parallel business calls before a terminal decision', async () => {
      const { api } = setupApi()
      const context = apiContext(api)
      context.load = (id: number) => api.track(async () => ({ id }))

      const result = await runAsyncFunction(
        context,
        'const accounts = await Promise.all([load(1), load(2)]); return exit("completed", { accountId: String(accounts[0].id) });'
      )

      await expect(api.close()).resolves.toBeUndefined()
      expect(result.success).toBe(true)
      expect(api.getTerminalOutcome()).toMatchObject({
        type: 'exit',
        value: { accountId: '1' },
      })
    })

    test('rejects outstanding tools and closes later host operations and Object writes', async () => {
      const load = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return 42
      })
      const account = new ObjectInstance({
        name: 'account',
        properties: [{ name: 'age', value: 1, type: z.number(), writable: true }],
      })
      const ctx = new Context({
        chat: createRecordingChat({ handler: async () => {} }),
        tools: [new Tool({ name: 'load', handler: load })],
        objects: [account],
      })
      const iteration = await ctx.nextIteration()
      const { api } = setupApi()
      const context = buildVMContext({ ctx, iteration, controller: new AbortController(), javascriptApi: api })

      const result = await runAsyncFunction(
        context,
        'load().then(() => { try { account.age = 9; } catch {} return load(); }).catch(() => {}); return exit();'
      )

      await expect(api.close()).rejects.toThrow(/unawaited host operation/)
      expect(result.success).toBe(true)
      expect(load).toHaveBeenCalledOnce()
      expect(context.account.age).toBe(1)
      expect(iteration.mutations).toHaveLength(0)
    })

    test('keeps runtime bindings immutable through aliases and dynamic assignment', async () => {
      const { api } = setupApi()
      const result = await runAsyncFunction(
        apiContext(api),
        'const alias = chat; alias.buttons = () => {}; return exit();'
      )

      await api.close()

      expect(result.success).toBe(false)
    })
  })
}
