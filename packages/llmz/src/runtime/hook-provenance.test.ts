import { z } from '@bpinternal/zui'
import { describe, expect, test, vi } from 'vitest'

import { SnapshotSignal } from '../errors.js'
import { Exit } from '../exit.js'
import { Snapshot } from '../snapshots.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { renderExecutionOverride } from './execution-report.js'
import { NativeClient, NativeStreamClient, javascript } from './fixtures/native-client.js'

const done = new Exit({
  name: 'done',
  description: 'Finish with the returned value.',
  schema: z.object({ value: z.string() }),
})

describe('execution hook source provenance', () => {
  test.each([NativeClient, NativeStreamClient])(
    'discloses replacement and nonterminal results without rewriting the requested call (%s)',
    async (Client) => {
      const original = vi.fn(async () => ({ value: 'original' }))
      const modified = vi.fn(async () => ({ value: 'modified' }))
      const requested = 'const result = await original(); return exit("done", result);'
      const replacement = 'const res = await modified(); return { value: res.value };'
      const client = new Client([javascript(requested), javascript('return exit("done", $return);')])
      let replaced = false

      const result = await executeContext({
        client,
        exits: [done],
        tools: [new Tool({ name: 'original', handler: original }), new Tool({ name: 'modified', handler: modified })],
        options: { loop: 2 },
        onBeforeExecution: async () => {
          if (replaced) {
            return
          }

          replaced = true
          return { code: replacement }
        },
      })

      expect(result.is(done)).toBe(true)
      expect(result.output).toEqual({ value: 'modified' })
      expect(original).not.toHaveBeenCalled()
      expect(modified).toHaveBeenCalledOnce()
      expect(client.requests).toHaveLength(2)

      const history = client.requests[1]!.messages
      const requestedCall = history.flatMap((message) => message.toolCalls ?? [])[0]!
      const feedback = history.find((message) => message.toolResultCallId === requestedCall.id)?.content

      expect(requestedCall.function.arguments).toEqual({ code: requested })
      expect(feedback).toContain('EXECUTION OVERRIDE')
      expect(feedback).toContain(replacement)
      expect(feedback).toContain('No exit was applied')
      expect(feedback).toContain('Do not call the originally requested business tools merely to compensate')
      expect(feedback).toContain('BUSINESS CALL OUTCOMES')
      expect(feedback).toContain('modified (')
      expect(feedback).toContain('modified')
      expect(result.iterations[0]!.code).toBe(replacement)
    }
  )

  test('retains override provenance through a persisted snapshot and resume', async () => {
    const original = vi.fn()
    const modified = vi.fn(() => {
      throw new SnapshotSignal('The replacement operation is pending.')
    })
    const requested = 'const result = await original(); return exit("done", result);'
    const replacement = 'const res = await modified(); return { value: res.value };'
    const tools = [new Tool({ name: 'original', handler: original }), new Tool({ name: 'modified', handler: modified })]
    const first = await executeContext({
      client: new NativeClient([javascript(requested)]),
      exits: [done],
      tools,
      onBeforeExecution: async () => ({ code: replacement }),
    })

    if (!first.isInterrupted()) {
      throw new Error('Expected a snapshot from the replacement program.')
    }

    const snapshot = Snapshot.fromJSON(JSON.parse(JSON.stringify(first.snapshot)))
    expect(snapshot.pendingCall?.executionOverride).toContain('EXECUTION OVERRIDE')
    expect(snapshot.pendingCall?.executionOverride).toContain(replacement)
    snapshot.resolve({ value: 'settled replacement' })
    const client = new NativeClient([javascript('return exit("done", res);')])

    const resumed = await executeContext({ client, snapshot, tools, exits: [done] })

    expect(resumed.is(done)).toBe(true)
    expect(resumed.output).toEqual({ value: 'settled replacement' })
    expect(original).not.toHaveBeenCalled()
    expect(modified).toHaveBeenCalledOnce()

    const feedback = client.requests[0]!.messages.find((message) => message.toolResultCallId)?.content

    expect(feedback).toContain('EXECUTION OVERRIDE')
    expect(feedback).toContain('remaining statements did not run')
    expect(feedback).toContain('Do not replay the requested program')
  })

  test('does not claim replacement for identical source and bounds source previews', () => {
    expect(renderExecutionOverride('return 42;', 'return 42;')).toBeUndefined()
    expect(renderExecutionOverride('return 42;')).toBeUndefined()

    const notice = renderExecutionOverride('const large = "' + 'x'.repeat(20_000) + '";', 'return 42;')!

    expect(notice).toContain('bounded preview')
    expect(notice.length).toBeLessThan(6000)
  })
})
