import { describe, expect, test, vi } from 'vitest'

import { DefaultExit, ListenExit } from '../context.js'
import { LoopExceededError } from '../errors.js'
import { Exit } from '../exit.js'
import { ObjectInstance } from '../objects.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { createRecordingChat } from './fixtures/chat.js'
import { NativeClient, javascript } from './fixtures/native-client.js'
import type { ExecutionProps } from './types.js'

async function expectReservedName(name: string, props: Pick<ExecutionProps, 'tools' | 'objects'>): Promise<void> {
  const client = new NativeClient([])
  const result = await executeContext({ client, ...props })

  expect(result.isError()).toBe(true)
  expect(client.requests).toEqual([])

  if (!result.isError()) {
    throw new Error('Expected registration to fail before generation.')
  }

  expect(result.error).toBeInstanceOf(Error)
  expect((result.error as Error).message).toBe(`Runtime name "${name}" is reserved.`)
}

describe.each(['exit', 'chat', 'inspect'])('reserved global binding %s', (name) => {
  test('rejects a canonical business tool name before generation', async () => {
    const handler = vi.fn()

    await expectReservedName(name, { tools: [new Tool({ name, handler })] })

    expect(handler).not.toHaveBeenCalled()
  })

  test('rejects a business tool alias before generation', async () => {
    const handler = vi.fn()

    await expectReservedName(name, {
      tools: [new Tool({ name: 'businessAction', aliases: [name], handler })],
    })

    expect(handler).not.toHaveBeenCalled()
  })

  test('rejects an object namespace before generation', async () => {
    await expectReservedName(name, { objects: [new ObjectInstance({ name })] })
  })

  test('rejects duplicate reserved tool names before normalization can rename them', async () => {
    const tools = [new Tool({ name, handler: vi.fn() }), new Tool({ name, handler: vi.fn() })]

    await expectReservedName(name, { tools })

    expect(tools.map((tool) => tool.name)).toEqual([name, name])
  })
})

test('allows namespaced business methods without shadowing runtime globals', async () => {
  const calls: string[] = []
  const account = new ObjectInstance({
    name: 'Account',
    tools: ['exit', 'chat', 'inspect'].map(
      (name) =>
        new Tool({
          name,
          handler: async () => {
            calls.push(name)
          },
        })
    ),
  })
  const client = new NativeClient([
    javascript(`
      await Account.exit();
      await Account.chat();
      await Account.inspect();
      return exit('listen');
    `),
  ])

  const result = await executeContext({ client, objects: [account], chat: createRecordingChat({ handler: vi.fn() }) })

  expect(result.is(ListenExit)).toBe(true)
  expect(calls).toEqual(['exit', 'chat', 'inspect'])
  expect(client.requests).toHaveLength(1)
})

test('retains the listen exit in chat when custom exits are explicitly empty', async () => {
  const client = new NativeClient([javascript('return exit("listen");')])
  const handler = vi.fn()

  const result = await executeContext({ client, exits: [], chat: createRecordingChat({ handler }) })

  expect(result.is(ListenExit)).toBe(true)
  expect(result.iteration?.exits).toEqual([ListenExit])
  expect(client.requests[0]?.messages[0]?.content).toContain('return exit("listen")')
  expect(handler).not.toHaveBeenCalled()
})

describe('worker exit registration', () => {
  test('provides the default completion exit only when exits are omitted', async () => {
    const client = new NativeClient([javascript('return exit("done", { success: true, result: 42 });')])

    const result = await executeContext({ client })

    expect(result.is(DefaultExit)).toBe(true)
    expect(result.output).toEqual({ success: true, result: 42 })
    expect(client.requests).toHaveLength(1)
  })

  test.each([
    { name: 'an explicit empty array', exits: [] },
    { name: 'an empty dynamic registration', exits: () => [] },
  ])('preserves no exits with $name and stops at the response budget', async ({ exits }) => {
    const client = new NativeClient([javascript('const reviewed = true; return inspect({ reviewed });')])

    const result = await executeContext({ client, exits, options: { loop: 1 } })

    expect(result.isError()).toBe(true)
    expect(result.iteration?.exits).toEqual([])
    expect(result.iteration?.status.type).toBe('thinking_requested')
    expect(result.session.getBindings().$return).toEqual({ reviewed: true })
    expect(result.session.pendingCalls).toEqual([])
    expect(client.requests).toHaveLength(1)

    if (!result.isError()) {
      throw new Error('Expected inspection to consume the response budget without completing.')
    }

    expect(result.error).toBeInstanceOf(LoopExceededError)
  })
})

test('rejects exit aliases that collide with another registered exit', async () => {
  const first = new Exit({ name: 'first', description: 'First outcome.', aliases: ['complete'] })
  const second = new Exit({ name: 'complete', description: 'Second outcome.' })
  const client = new NativeClient([])
  const result = await executeContext({ client, exits: [first, second] })

  expect(result.isError()).toBe(true)
  expect(String(result.isError() && result.error)).toContain('Duplicate exit name or alias')
  expect(client.requests).toHaveLength(0)
})
