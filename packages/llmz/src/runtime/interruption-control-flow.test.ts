import { z } from '@bpinternal/zui'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { ThinkSignal } from '../errors.js'
import { Exit } from '../exit.js'
import { ObjectInstance } from '../objects.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { NativeClient, javascript } from './fixtures/native-client.js'

const done = new Exit({
  name: 'done',
  description: 'Finish after interruption handling.',
  schema: z.object({ value: z.number() }),
})

function gate() {
  let release!: () => void
  const promise = new Promise<void>((resolve) => {
    release = resolve
  })

  return { promise, release }
}

describe.each([
  { name: 'Node', quickjs: 'false' },
  { name: 'QuickJS', quickjs: 'true' },
])('host interruption control flow ($name)', ({ quickjs }) => {
  beforeEach(() => {
    vi.stubEnv('USE_QUICKJS', quickjs)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test.each([
    { name: 'direct await', call: 'await pause();' },
    {
      name: 'nested async helper',
      call: `
        async function helper() {
          await pause();
          phase = 'helper continued';
          await after();
        }

        await helper();
      `,
    },
    {
      name: 'promise callback',
      call: `
        await Promise.resolve().then(async () => {
          await pause();
          phase = 'callback continued';
          await after();
        });
      `,
    },
  ])('retains prior memory and skips catch, finally, and later effects after $name', async ({ call }) => {
    const pause = vi.fn(async () => {
      throw new ThinkSignal('Review the completed stage.', { stage: 1 })
    })
    const after = vi.fn()
    const state = new ObjectInstance({
      name: 'State',
      properties: [{ name: 'phase', value: 'before', type: z.string(), writable: true }],
    })
    const client = new NativeClient([
      javascript(`
        const saved = 42;
        let phase = 'before';
        const local = { phase: 'before' };

        try {
          ${call}
          phase = 'continued';
        } catch (error) {
          phase = 'caught';
          local.phase = 'caught';
          await after();
        } finally {
          phase = 'finally';
          local.phase = 'finally';
          State.phase = 'finally';
          await after();
        }

        return exit('done', { value: 0 });
      `),
      javascript('return exit("done", { value: saved });'),
    ])

    const result = await executeContext({
      client,
      exits: [done],
      objects: [state],
      tools: [new Tool({ name: 'pause', handler: pause }), new Tool({ name: 'after', handler: after })],
      options: { loop: 2 },
    })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(pause).toHaveBeenCalledOnce()
    expect(after).not.toHaveBeenCalled()
    expect(result.session.memory.variables).toMatchObject({
      saved: 42,
      phase: 'before',
      local: { phase: 'before' },
    })
    expect(result.session.memory.getObjectPropertyValue('State', 'phase')).toBe('before')
    expect(JSON.stringify(client.requests[1]!.messages)).toContain('Review the completed stage.')
    expect(result.session.pendingCalls).toEqual([])
  })

  test('joins started siblings before another generation without allowing their continuations to run', async () => {
    const pending = gate()
    const interrupting = gate()
    const events: string[] = []
    const slow = vi.fn(async () => {
      events.push('sibling started')
      await pending.promise
      events.push('sibling completed')
      return 7
    })
    const pause = vi.fn(async () => {
      interrupting.release()
      throw new ThinkSignal('Use the completed prefix.')
    })
    const after = vi.fn()
    const client = new NativeClient([
      javascript(`
        const saved = 42;
        let phase = 'before';
        const sibling = slow().then(() => {
          phase = 'sibling continued';
          return after();
        });

        try {
          await pause();
        } catch {
          phase = 'caught';
        }
      `),
      javascript('return exit("done", { value: saved });'),
    ])
    const execution = executeContext({
      client,
      tools: [
        new Tool({ name: 'slow', handler: slow }),
        new Tool({ name: 'pause', handler: pause }),
        new Tool({ name: 'after', handler: after }),
      ],
      exits: [done],
      options: { loop: 2 },
      onIterationStart: () => {
        events.push('generation started')
      },
    })

    await interrupting.promise
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(client.requests).toHaveLength(1)
    expect(events).toEqual(['generation started', 'sibling started'])

    pending.release()

    const result = await execution

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(result.session.memory.variables.phase).toBe('before')
    expect(after).not.toHaveBeenCalled()
    expect(slow).toHaveBeenCalledOnce()
    expect(pause).toHaveBeenCalledOnce()
    expect(events).toEqual(['generation started', 'sibling started', 'sibling completed', 'generation started'])
    expect(JSON.stringify(client.requests[1]!.messages)).toContain('Use the completed prefix.')
  })

  test('ordinary host errors remain catchable', async () => {
    const client = new NativeClient([
      javascript(`
        let value = 0;

        try {
          await fail();
        } catch (error) {
          value = 42;
        }

        return exit('done', { value });
      `),
    ])
    const result = await executeContext({
      client,
      exits: [done],
      tools: [
        new Tool({
          name: 'fail',
          handler: async () => {
            throw new Error('A recoverable business error.')
          },
        }),
      ],
      options: { loop: 1 },
    })

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(client.requests).toHaveLength(1)
  })
})
