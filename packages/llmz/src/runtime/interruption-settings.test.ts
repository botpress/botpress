import { z } from '@bpinternal/zui'
import { describe, expect, test, vi } from 'vitest'

import { ThinkSignal } from '../errors.js'
import { Exit } from '../exit.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { NativeClient, NativeStreamClient, javascript } from './fixtures/native-client.js'

const done = new Exit({
  name: 'done',
  description: 'Finish with the completed operation result.',
  schema: z.object({ value: z.string() }),
})

describe('generation settings after a thinking interruption', () => {
  test.each([
    { name: 'non-streaming', Client: NativeClient },
    { name: 'streaming', Client: NativeStreamClient },
  ])(
    'starts another response and recalculates settings even when generated code catches the signal ($name)',
    async ({ Client }) => {
      const events: string[] = []
      const program = `
        let value;

        while (true) {
          try {
            value = await advance();
            break;
          } catch (error) {
            continue;
          }
        }

        return exit('done', { value });
      `
      const client = new Client([javascript(program), javascript(program), javascript(program)])
      const advance = vi.fn(async () => {
        const attempt = advance.mock.calls.length
        events.push(`operation ${attempt}`)

        if (attempt < 3) {
          throw new ThinkSignal(`Stage ${attempt} completed; request the next stage.`)
        }

        return 'Done'
      })
      const result = await executeContext({
        client,
        exits: [done],
        tools: [new Tool({ name: 'advance', output: z.string(), handler: advance })],
        model: (context) => (context.iterations.length === 0 ? 'fast' : 'best'),
        temperature: (context) => (context.iterations.length === 0 ? 0.5 : 1),
        onIterationStart: (_iteration, _controller, context) => {
          events.push(`response ${context.iterations.length}`)
        },
        onIterationEnd: (iteration) => {
          events.push(iteration.status.type)
        },
        options: { loop: 3 },
      })

      expect(result.is(done)).toBe(true)
      expect(result.output).toEqual({ value: 'Done' })
      expect(advance).toHaveBeenCalledTimes(3)
      expect(client.requests.map(({ model }) => model)).toEqual(['fast', 'best', 'best'])
      expect(client.requests.map(({ temperature }) => temperature)).toEqual([0.5, 1, 1])
      expect(events).toEqual([
        'response 1',
        'operation 1',
        'thinking_requested',
        'response 2',
        'operation 2',
        'thinking_requested',
        'response 3',
        'operation 3',
        'exit_success',
      ])
      expect(JSON.stringify(client.requests[1]!.messages)).toContain('Stage 1 completed')
      expect(JSON.stringify(client.requests[2]!.messages)).toContain('Stage 2 completed')
      expect(result.session.pendingCalls).toEqual([])
    }
  )
})
