import { z } from '@bpinternal/zui'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { CodeExecutionError, Signals } from '../errors.js'
import { Exit } from '../exit.js'
import { Session } from '../session.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { NativeClient, javascript } from './fixtures/native-client.js'

const done = new Exit({
  name: 'done',
  description: 'Complete after deleting the confirmed order.',
  schema: z.object({ orderId: z.string() }),
})

function orderTools() {
  const fetchOrder = vi.fn(async () => 'order-42')
  const confirmOrder = vi.fn(async () => true)
  const deleteOrder = vi.fn(async () => undefined)

  return {
    fetchOrder,
    confirmOrder,
    deleteOrder,
    tools: [
      new Tool({ name: 'fetchOrder', output: z.string(), handler: fetchOrder }),
      new Tool({
        name: 'confirmOrder',
        input: z.object({ orderId: z.string() }),
        output: z.boolean(),
        handler: confirmOrder,
      }),
      new Tool({
        name: 'deleteOrder',
        input: z.object({ orderId: z.string() }),
        handler: deleteOrder,
      }),
    ],
  }
}

function feedback(client: NativeClient, requestIndex: number): string {
  const message = client.requests[requestIndex]?.messages
    .slice()
    .reverse()
    .find((message) => message.type === 'tool_result')

  return String(message?.content ?? '')
}

describe.each([
  { name: 'Node', quickjs: 'false' },
  { name: 'QuickJS', quickjs: 'true' },
])('variable declaration and recovery ($name)', ({ quickjs }) => {
  beforeEach(() => {
    vi.stubEnv('USE_QUICKJS', quickjs)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('retains declared variables for later confirmation and deletion', async () => {
    const fixture = orderTools()
    const client = new NativeClient([
      javascript('const orderId = await fetchOrder(); return inspect(orderId);'),
      javascript('const confirmed = await confirmOrder({ orderId }); return inspect(confirmed);'),
      javascript(`
        if (confirmed) {
          await deleteOrder({ orderId });
        }

        exit('done', { orderId });
      `),
    ])

    const session = new Session()
    const result = await executeContext({
      client,
      session,
      tools: fixture.tools,
      exits: [done],
      options: { loop: 3 },
      onIterationEnd: (iteration) => {
        if (iteration.status.type === 'execution_error') {
          expect(session.memory.variables).not.toHaveProperty('orderId')
        }
      },
    })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ orderId: 'order-42' })
    expect(result.iterations.map((iteration) => iteration.status.type)).toEqual([
      'thinking_requested',
      'thinking_requested',
      'exit_success',
    ])
    expect(result.session.memory.variables).toMatchObject({ orderId: 'order-42', confirmed: true })
    expect(fixture.fetchOrder).toHaveBeenCalledOnce()
    expect(fixture.confirmOrder).toHaveBeenCalledWith({ orderId: 'order-42' }, expect.anything())
    expect(fixture.deleteOrder).toHaveBeenCalledWith({ orderId: 'order-42' }, expect.anything())
  })

  test('reports an undeclared assignment without hiding it and recovers from the acknowledged result', async () => {
    const fixture = orderTools()
    const client = new NativeClient([
      javascript('orderId = await fetchOrder(); return inspect(orderId);'),
      javascript(`
        const orderId = 'order-42';
        const confirmed = await confirmOrder({ orderId });

        return inspect(confirmed);
      `),
      javascript(`
        if (confirmed) {
          await deleteOrder({ orderId });
        }

        exit('done', { orderId });
      `),
    ])

    const session = new Session()
    const result = await executeContext({
      client,
      session,
      tools: fixture.tools,
      exits: [done],
      options: { loop: 3 },
      onIterationEnd: (iteration) => {
        if (iteration.status.type === 'execution_error') {
          expect(session.memory.variables).not.toHaveProperty('orderId')
        }
      },
    })

    expect(result.iterations[0]?.status.type).toBe('execution_error')
    expect(result.iterations[0]?.error).toContain('not defined')
    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ orderId: 'order-42' })
    expect(result.session.memory.variables).toMatchObject({ orderId: 'order-42', confirmed: true })
    expect(fixture.fetchOrder).toHaveBeenCalledOnce()
    expect(fixture.confirmOrder).toHaveBeenCalledOnce()
    expect(fixture.deleteOrder).toHaveBeenCalledOnce()

    const recovery = feedback(client, 1)

    expect(recovery).toContain('REFERENCE RECOVERY')
    expect(recovery).toContain('Declare new variables with const or let')
    expect(recovery).toContain('reuse its acknowledged result rather than repeating the call')
    expect(recovery).toContain('Tools called')
    expect(recovery).toContain('fetchOrder')
    expect(recovery).toContain('order-42')
  })

  test('keeps existing memory bindings assignable without redeclaration', async () => {
    const client = new NativeClient([
      javascript('let orderId = "old-order"; return inspect(orderId);'),
      javascript('orderId = "new-order"; exit("done", { orderId });'),
    ])

    const result = await executeContext({ client, exits: [done], options: { loop: 2 } })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ orderId: 'new-order' })
    expect(result.session.memory.variables.orderId).toBe('new-order')
    expect(result.iterations.every((iteration) => !iteration.error)).toBe(true)
  })

  test('points unknown callable names back to the documented API without creating fake functions', async () => {
    const fixture = orderTools()
    const client = new NativeClient([
      javascript('await fetchMissingOrder();'),
      javascript('const orderId = await fetchOrder(); exit("done", { orderId });'),
    ])

    const result = await executeContext({ client, tools: fixture.tools, exits: [done], options: { loop: 2 } })

    expect(result.iterations[0]?.status.type).toBe('execution_error')
    expect(feedback(client, 1)).toContain('Check the Memory overview and JavaScript API for the missing name')
    expect(feedback(client, 1)).toContain('Do not invent values or functions for unknown names')
    expect(result.session.memory.variables).not.toHaveProperty('fetchMissingOrder')
    expect(fixture.fetchOrder).toHaveBeenCalledOnce()
    expect(result.is(done)).toBe(true)
  })

  test.each([
    'record is not defined',
    "'record' is not defined",
    'Documentation says x is not defined when a variable is missing.',
  ])('does not classify ordinary Error(%j) by its message', async (message) => {
    const client = new NativeClient([
      javascript(`throw new Error(${JSON.stringify(message)});`),
      javascript('exit("done", { orderId: "none" });'),
    ])

    const result = await executeContext({ client, exits: [done], options: { loop: 2 } })

    expect(result.iterations[0]?.status.type).toBe('execution_error')
    expect(feedback(client, 1)).not.toContain('REFERENCE RECOVERY')
    expect(result.is(done)).toBe(true)
  })

  test('does not classify an ordinary host-tool error by a reference-error message', async () => {
    const lookup = vi.fn(() => {
      throw new Error('record is not defined')
    })
    const client = new NativeClient([javascript('await lookup();'), javascript('exit("done", { orderId: "none" });')])

    const result = await executeContext({
      client,
      tools: [new Tool({ name: 'lookup', handler: lookup })],
      exits: [done],
      options: { loop: 2 },
    })

    expect(result.iterations[0]?.status.type).toBe('execution_error')
    expect(feedback(client, 1)).toContain('record is not defined')
    expect(feedback(client, 1)).not.toContain('REFERENCE RECOVERY')
    expect(lookup).toHaveBeenCalledOnce()
    expect(result.is(done)).toBe(true)
  })
})

describe('execution error category persistence', () => {
  test('preserves the original category through the existing serialized error format', () => {
    const error = new CodeExecutionError('missingName is not defined', 'return missingName;', '', 'ReferenceError')
    const restored = Signals.maybeDeserializeError(error.message)

    expect(restored).toBeInstanceOf(CodeExecutionError)
    expect(restored.message).toBe('missingName is not defined')
    expect(restored.originalErrorName).toBe('ReferenceError')
    expect(restored.code).toBe('return missingName;')
  })

  test('restores older errors without fabricating their original category', () => {
    const restored = Signals.maybeDeserializeError(
      JSON.stringify({
        name: 'CodeExecutionError',
        message: 'record is not defined',
        properties: { code: 'record;', stacktrace: '' },
      })
    )

    expect(restored).toBeInstanceOf(CodeExecutionError)
    expect(restored.message).toBe('record is not defined')
    expect(restored.originalErrorName).toBeUndefined()
  })
})
