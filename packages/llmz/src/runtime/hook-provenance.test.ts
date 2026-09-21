import { z } from '@bpinternal/zui'
import { describe, expect, test, vi } from 'vitest'

import { Exit } from '../exit.js'
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
      expect(feedback).toContain('Tools called')
      expect(feedback).toContain('modified(): succeeded')
      expect(feedback).toContain('modified')
      expect(result.iterations[0]!.code).toBe(replacement)
    }
  )

  test('does not claim replacement for identical source and bounds source previews', () => {
    expect(renderExecutionOverride('return 42;', 'return 42;')).toBeUndefined()
    expect(renderExecutionOverride('return 42;')).toBeUndefined()

    const notice = renderExecutionOverride('const large = "' + 'x'.repeat(20_000) + '";', 'return 42;')!

    expect(notice).toContain('bounded preview')
    expect(notice.length).toBeLessThan(6000)
  })
})
