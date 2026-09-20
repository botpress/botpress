import { z } from '@bpinternal/zui'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { Exit } from '../exit.js'
import { ObjectInstance } from '../objects.js'
import { Session } from '../session.js'
import { executeContext } from './execute.js'
import { createRecordingChat } from './fixtures/chat.js'
import { NativeClient, javascript, nativeCall, response } from './fixtures/native-client.js'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe.each(['true', 'false'])('native integration review with USE_QUICKJS=%s', (quickjs) => {
  test('read-only nested object properties cannot be changed through an alias', async () => {
    vi.stubEnv('USE_QUICKJS', quickjs)

    const account = new ObjectInstance({
      name: 'account',
      properties: [
        {
          name: 'profile',
          value: { age: 40 },
          type: z.object({ age: z.number().min(0) }),
          writable: false,
        },
      ],
    })
    const client = new NativeClient([
      javascript('const profile = account.profile; try { profile.age = -1; } catch {} return profile.age;'),
      response('Finished.'),
    ])

    const result = await executeContext({
      client,
      objects: [account],
      chat: createRecordingChat({ handler: () => undefined }),
    })

    expect(result.isSuccess()).toBe(true)
    expect(result.session.getBindings().$return).toBe(40)
    expect(result.session.memory.getObjectPropertyValue('account', 'profile')).toEqual({ age: 40 })
  })
})

describe('native typed exit payloads', () => {
  test.each([z.undefined(), z.void()])('rejects a non-JSON exit schema', (schema) => {
    expect(() => new Exit({ name: 'done', description: 'Complete', schema })).toThrow('JSON-compatible')
  })

  test.each([
    { schema: z.null(), value: null },
    { schema: z.number(), value: 0 },
    { schema: z.boolean(), value: false },
    { schema: z.string(), value: '' },
    { schema: z.array(z.number()), value: [] },
  ])('preserves a nonobject payload $value', async ({ schema, value }) => {
    const done = new Exit<unknown>({ name: 'done', description: 'Complete', schema })
    const client = new NativeClient([javascript(`return exit("done", ${JSON.stringify(value)});`)])
    const onExit = vi.fn()

    const result = await executeContext({ client, exits: [done], onExit })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual(value)
    expect(onExit.mock.calls[0]?.[0].result).toEqual(value)
  })
})

describe('authoritative native history restore', () => {
  test('rejects reused native call identities across retained iterations', () => {
    const session = new Session()

    for (const id of ['first', 'second']) {
      const iteration = session.nextIteration(id)

      session.appendAssistant(iteration.id, {
        output: '',
        toolCalls: [nativeCall('run_javascript', { code: 'return 1;' }, id)],
      })
      session.appendToolResult(iteration.id, id, 'Returned 1.')
      session.settleIteration(iteration.id)
    }

    const state = session.toJSON()
    const second = state.groups.find((group) => group.id === 'second')!

    second.messages[0]!.toolCalls![0]!.id = 'first'
    second.messages[1]!.toolResultCallId = 'first'

    expect(() => Session.fromJSON(state)).toThrow(/duplicate|unique|identity/i)
  })
})
