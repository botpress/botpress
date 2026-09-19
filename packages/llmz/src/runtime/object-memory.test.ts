import { z } from '@bpinternal/zui'
import { describe, expect, test, vi } from 'vitest'

import { Chat } from '../chat.js'
import { ObjectInstance } from '../objects.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { NativeClient, javascript, response } from './fixtures/native-client.js'

const makeAccount = () =>
  new ObjectInstance({
    name: 'account',
    properties: [
      { name: 'age', value: 40, type: z.number().min(0).max(150), writable: true },
      { name: 'id', value: 'account-1', type: z.string(), writable: false },
    ],
  })

const makeChat = () => new Chat({ handler: () => undefined })

describe('object properties in session memory', () => {
  test('shows schema, value and access in MEMORY and callable methods in the tool section', async () => {
    const account = makeAccount()
    const client = new NativeClient([response('Ready.')])

    const result = await executeContext({ client, chat: makeChat(), objects: [account] })

    expect(result.isSuccess()).toBe(true)
    const system = String(client.requests[0]!.messages.find((message) => message.role === 'system')?.content)
    const memory = String(client.requests[0]!.messages.at(-1)?.content)

    expect(system).not.toContain('account-1')
    expect(memory).toContain('account.age')
    expect(memory).toContain('40')
    expect(memory).toContain('number')
    expect(memory).toContain('writable')
    expect(memory).toContain('account.id')
    expect(memory).toContain('read-only')
  })

  test('retains writable property changes across JavaScript iterations with unchanged host values', async () => {
    const account = makeAccount()
    const client = new NativeClient([
      javascript('account.age = 41; return account.age;'),
      javascript('return account.age;'),
      response('Updated.'),
    ])

    const result = await executeContext({ client, chat: makeChat(), objects: [account] })

    expect(result.isSuccess()).toBe(true)
    expect(result.session.memory.getBindings().$return).toBe(41)
    expect(result.session.memory.getObjectPropertyValue('account', 'age')).toBe(41)
    expect(result.session.memory.variables).toEqual({})
    expect(String(client.requests[1]!.messages.at(-1)?.content)).toContain('UPDATED\n- account.age: 41')
  })

  test.each([
    { code: 'account.id = "replacement";', reason: 'read-only' },
    { code: 'account.age = "forty";', reason: 'Invalid value' },
    { code: 'account.age = 151;', reason: 'Invalid value' },
  ])('enforces access and schema: $code', async ({ code, reason }) => {
    const client = new NativeClient([javascript(code), response('Rejected.')])

    const result = await executeContext({ client, chat: makeChat(), objects: [makeAccount()] })

    expect(result.isSuccess()).toBe(true)
    expect(result.session.memory.getObjectPropertyValue('account', 'age')).toBe(40)
    expect(result.session.memory.getObjectPropertyValue('account', 'id')).toBe('account-1')
    expect(String(client.requests[1]!.messages.at(-1)?.content)).toContain(reason)
  })

  test('reports same-value property assignments as updates', async () => {
    const client = new NativeClient([javascript('account.age = 40;'), response('Saved.')])

    const result = await executeContext({ client, chat: makeChat(), objects: [makeAccount()] })

    expect(result.isSuccess()).toBe(true)
    expect(String(client.requests[1]!.messages.at(-1)?.content)).toContain('UPDATED\n- account.age: 40')
    expect(result.session.memory.render({ turn: result.session.turn })).toContain('this turn')
  })

  test('rejects namespace collisions before business side effects', async () => {
    const record = vi.fn()
    const client = new NativeClient([
      javascript('await record(); const account = { age: 99 }; return account;'),
      response('The namespace is already registered.'),
    ])

    const result = await executeContext({
      client,
      chat: makeChat(),
      objects: [makeAccount()],
      tools: [new Tool({ name: 'record', handler: record })],
    })

    expect(result.isSuccess()).toBe(true)
    expect(record).not.toHaveBeenCalled()
    expect(String(client.requests[1]!.messages.at(-1)?.content)).toContain('object namespace')
  })
})
