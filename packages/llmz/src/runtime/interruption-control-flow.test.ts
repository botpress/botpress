import { z } from '@bpinternal/zui'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { SnapshotSignal, ThinkSignal } from '../errors.js'
import { Exit } from '../exit.js'
import { ObjectInstance } from '../objects.js'
import { Snapshot } from '../snapshots.js'
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

  test('preserves the interrupted declaration assignment through a serialized snapshot', async () => {
    const launch = vi.fn(async () => {
      throw new SnapshotSignal('Approval is pending.')
    })
    const after = vi.fn()
    const tools = [new Tool({ name: 'launch', handler: launch }), new Tool({ name: 'after', handler: after })]
    const client = new NativeClient([
      javascript(`
        const saved = 40;
        let phase = 'before';

        try {
          const approval = await launch();
          phase = 'continued';
          await after();
        } catch (error) {
          phase = 'caught';
          await after();
        } finally {
          phase = 'finally';
          await after();
        }

        return exit('done', { value: 0 });
      `),
    ])

    const interrupted = await executeContext({ client, tools, exits: [done], options: { loop: 1 } })

    expect(interrupted.isInterrupted()).toBe(true)
    expect(interrupted.session.memory.variables).toEqual({ saved: 40, phase: 'before' })
    expect(launch).toHaveBeenCalledOnce()
    expect(after).not.toHaveBeenCalled()

    if (!interrupted.isInterrupted()) {
      throw new Error('Expected a pending approval snapshot.')
    }

    const snapshot = Snapshot.fromJSON(JSON.parse(JSON.stringify(interrupted.snapshot)))

    expect(snapshot.toolCall?.assignment).toMatchObject({ type: 'single', left: 'approval' })

    snapshot.resolve({ amount: 2 })

    const resumedClient = new NativeClient([javascript('return exit("done", { value: saved + approval.amount });')])
    const resumed = await executeContext({ client: resumedClient, snapshot, tools, exits: [done] })

    expect(resumed.is(done)).toBe(true)
    expect(resumed.output).toEqual({ value: 42 })
    expect(resumed.session.memory.variables.approval).toEqual({ amount: 2 })
    expect(resumed.session.pendingCalls).toEqual([])
    expect(launch).toHaveBeenCalledOnce()
    expect(after).not.toHaveBeenCalled()
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

  test.each(['return exit("done", { value: saved });', 'return inspect({ value: saved });'])(
    'retains a late snapshot from unawaited work after %s',
    async (completion) => {
      const started = gate()
      const pending = gate()
      const launch = vi.fn(async () => {
        started.release()
        await pending.promise
        throw new SnapshotSignal('The started operation needs approval.')
      })
      const onExit = vi.fn()
      const client = new NativeClient([
        javascript(`
          const saved = 42;
          const request = launch();
          ${completion}
        `),
      ])
      const tools = [new Tool({ name: 'launch', handler: launch })]
      const execution = executeContext({ client, tools, exits: [done], onExit, options: { loop: 1 } })

      await started.promise
      await new Promise<void>((resolve) => setImmediate(resolve))

      expect(onExit).not.toHaveBeenCalled()

      pending.release()

      const interrupted = await execution

      expect(interrupted.isInterrupted()).toBe(true)
      expect(interrupted.session.memory.variables).toEqual({ saved: 42 })
      expect(interrupted.session.memory.getBindings().$return).toBeUndefined()
      expect(onExit).not.toHaveBeenCalled()

      if (!interrupted.isInterrupted()) {
        throw new Error('Expected the pending operation to override program completion.')
      }

      const snapshot = Snapshot.fromJSON(JSON.parse(JSON.stringify(interrupted.snapshot)))

      expect(snapshot.toolCall?.id).toBeTruthy()
      expect(snapshot.toolCall?.assignment).toBeUndefined()

      snapshot.resolve({ approved: true })

      const resumed = await executeContext({
        client: new NativeClient([javascript('return exit("done", { value: saved });')]),
        snapshot,
        tools,
        exits: [done],
      })

      expect(resumed.is(done)).toBe(true)
      expect(resumed.output).toEqual({ value: 42 })
      expect(resumed.session.memory.variables).not.toHaveProperty('request')
      expect(launch).toHaveBeenCalledOnce()
    }
  )

  test('the first snapshot keeps its operation and assignment when an identical sibling also interrupts', async () => {
    const first = gate()
    const second = gate()
    const bothStarted = gate()
    const firstInterrupted = gate()
    const launch = vi.fn(async () => {
      const call = launch.mock.calls.length

      if (call === 2) {
        bothStarted.release()
      }

      await (call === 1 ? first.promise : second.promise)

      if (call === 1) {
        firstInterrupted.release()
      }

      throw new SnapshotSignal('Identical pending operation.')
    })
    const client = new NativeClient([
      javascript(`
        const saved = 40;

        async function firstWork() {
          const firstResult = await launch();
        }

        async function secondWork() {
          const secondResult = await launch();
        }

        const firstPending = firstWork();
        const secondPending = secondWork();
        await Promise.all([firstPending, secondPending]);
      `),
    ])
    const tools = [new Tool({ name: 'launch', handler: launch })]
    const execution = executeContext({ client, tools, exits: [done], options: { loop: 1 } })

    await bothStarted.promise

    first.release()
    await firstInterrupted.promise
    await new Promise<void>((resolve) => setImmediate(resolve))

    second.release()

    const interrupted = await execution

    expect(interrupted.isInterrupted()).toBe(true)
    expect(launch).toHaveBeenCalledTimes(2)

    if (!interrupted.isInterrupted()) {
      throw new Error('Expected the first snapshot to retain ownership.')
    }

    const calls = interrupted.iteration!.traces.filter((trace) => trace.type === 'tool_call')
    const snapshot = Snapshot.fromJSON(JSON.parse(JSON.stringify(interrupted.snapshot)))

    expect(calls).toHaveLength(2)
    expect(snapshot.toolCall?.id).toBe(calls[0]!.tool_call_id)
    expect(snapshot.toolCall?.id).not.toBe(calls[1]!.tool_call_id)
    expect(snapshot.toolCall?.assignment).toMatchObject({ type: 'single', left: 'firstResult' })

    snapshot.resolve({ amount: 2 })

    const resumed = await executeContext({
      client: new NativeClient([javascript('return exit("done", { value: saved + firstResult.amount });')]),
      snapshot,
      tools,
      exits: [done],
    })

    expect(resumed.output).toEqual({ value: 42 })
    expect(resumed.session.memory.variables).not.toHaveProperty('secondResult')
    expect(launch).toHaveBeenCalledTimes(2)
  })
})
