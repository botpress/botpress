import { z } from '@bpinternal/zui'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { Exit } from '../exit.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { createRecordingChat } from './fixtures/chat.js'
import { NativeClient, NativeStreamClient, javascript, nativeCall, response } from './fixtures/native-client.js'

const done = new Exit({
  name: 'done',
  description: 'Finish with the computed value.',
  schema: z.object({ value: z.number() }),
})

function createGate() {
  let release!: () => void
  const promise = new Promise<void>((resolve) => {
    release = resolve
  })

  return { promise, release }
}

describe('progress without a streaming preview consumer', () => {
  test.each([NativeClient, NativeStreamClient])('awaits the announcement before searching (%s)', async (Client) => {
    const accepted = createGate()
    const delivering = createGate()
    const events: string[] = []
    const search = vi.fn(async () => {
      events.push('search')
      return 'The answer is 42.'
    })
    const client = new Client([
      response('Checking the documentation.', [nativeCall('run_javascript', { code: 'return await search();' })]),
      response('The answer is 42.'),
    ])
    const execution = executeContext({
      client,
      tools: [new Tool({ name: 'search', handler: search })],
      chat: createRecordingChat({
        handler: async (message) => {
          const text = message.type === 'text' ? message.text : ''
          events.push(text)

          if (text === 'Checking the documentation.') {
            delivering.release()
            await accepted.promise
            events.push('announcement accepted')
          }
        },
      }),
    })

    try {
      await delivering.promise
      expect(search).not.toHaveBeenCalled()
    } finally {
      accepted.release()
    }

    const result = await execution

    expect(result.isSuccess()).toBe(true)
    expect(events).toEqual(['Checking the documentation.', 'announcement accepted', 'search', 'The answer is 42.'])
    expect(search).toHaveBeenCalledOnce()
  })
})

describe('worker completion guidance', () => {
  test.each([NativeClient, NativeStreamClient])('omits unavailable APIs from worker recovery (%s)', async (Client) => {
    const client = new Client([response('The computed answer is 42.'), javascript('return inspect(42);')])

    const result = await executeContext({ client, exits: [], options: { loop: 2 } })

    expect(result.isError()).toBe(true)
    expect(result.session.getBindings().$return).toBe(42)
    expect(client.requests).toHaveLength(2)

    const correction = String(client.requests[1]!.messages.at(-1)?.content)

    expect(correction).toContain('must explicitly return inspect(value)')
    expect(correction).not.toMatch(/\b(?:exit|listen|chat)\b/)
  })

  test('corrects worker prose with a registered exit request', async () => {
    const client = new NativeClient([
      response('The computed answer is 42.'),
      javascript('return exit("done", { value: 42 });'),
    ])

    const result = await executeContext({ client, exits: [done], options: { loop: 2 } })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(client.requests).toHaveLength(2)
    const correction = String(client.requests[1]?.messages.at(-1)?.content)

    expect(correction).toContain('This is a worker task.')
    expect(correction).toContain('return exit(name, payload) with a registered name')
    expect(correction).not.toContain('Reply with assistant text')
    expect(correction).not.toContain('or an honest final answer')
  })
})

for (const driver of ['true', 'false']) {
  describe(`runtime source diagnostics (QuickJS=${driver})`, () => {
    beforeEach(() => {
      vi.stubEnv('USE_QUICKJS', driver)
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    test.each([NativeClient, NativeStreamClient])('preserves the annotated failing tool call (%s)', async (Client) => {
      const demo = new Tool({
        name: 'demo',
        handler: async () => {
          throw new Error('This is a demo error')
        },
      })
      const code = 'const before = 1;\nawait demo();\nreturn exit("done", { value: before });'
      const client = new Client([javascript(code)])

      const result = await executeContext({ client, tools: [demo], exits: [done], options: { loop: 1 } })

      expect(result.isError()).toBe(true)
      const status = result.iterations[0]?.status
      expect(status?.type).toBe('execution_error')

      if (status?.type !== 'execution_error') {
        throw new Error('Expected an execution error.')
      }

      expect(status.execution_error.message).toContain('This is a demo error')
      expect(status.execution_error.stack).toMatch(/> 002 \| await demo\(\);/)
      expect(status.execution_error.stack).toMatch(/\^+/)
      expect(result.session.memory.variables.before).toBe(1)
    })
  })
}

test('keeps the host stack when an execution hook fails outside the VM', async () => {
  const error = new Error('Host hook failed')
  error.stack = 'Error: Host hook failed\n    at caller (application.ts:10:2)'
  const client = new NativeClient([javascript('return exit("done", { value: 42 });')])

  const result = await executeContext({
    client,
    exits: [done],
    options: { loop: 1 },
    onBeforeExecution: () => {
      throw error
    },
  })

  const status = result.iterations[0]?.status
  expect(status).toMatchObject({
    type: 'execution_error',
    execution_error: { stack: error.stack },
  })
})
