import { describe, expect, test, vi } from 'vitest'

import { DefaultExit } from '../context.js'
import { Tool } from '../tool.js'
import { executeContext } from './execute.js'
import { NativeClient, NativeStreamClient, javascript } from './fixtures/native-client.js'

describe('worker failure completion', () => {
  test.each([NativeClient, NativeStreamClient])(
    'allows an explicit failure when the task prohibits retrying (%s)',
    async (Client) => {
      const submit = vi.fn(async () => {
        throw new Error('Submission unavailable')
      })
      const client = new Client([
        javascript(`
          try {
            await submit();
          } catch (error) {
            return exit('done', {
              success: false,
              error: 'Submission unavailable; the task prohibits another attempt.',
            });
          }
        `),
      ])

      const result = await executeContext({
        client,
        instructions: 'Submit once. If submission fails, report the failure without retrying.',
        tools: [new Tool({ name: 'submit', handler: submit })],
        options: { loop: 5 },
      })

      expect(result.is(DefaultExit)).toBe(true)
      expect(result.output).toEqual({
        success: false,
        error: 'Submission unavailable; the task prohibits another attempt.',
      })
      expect(submit).toHaveBeenCalledOnce()
      expect(client.requests).toHaveLength(1)
    }
  )
})
