import { z } from '@bpinternal/zui'
import { Context } from '../context'
import { asyncExpect } from '../utils/asyncAssertion'
import { Input, predictJson } from '../utils/predictJson'
import { makeToMatchInlineSnapshot, toAssertion } from './extension'

export type CheckOptions<T> = {
  examples?: { value: T; expected: boolean; reason: string }[]
}

export function check<T extends Input>(value: T, condition: string, options?: CheckOptions<T>) {
  const promise = predictJson({
    systemMessage: `Check that the value meets the condition: ${condition}`,
    examples: options?.examples?.map(({ value, reason, expected }) => ({
      input: value,
      output: { reason, result: expected },
    })),
    outputSchema: z.boolean(),
    model: Context.evaluatorModel,
    input: value,
  })

  return {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    ...toAssertion(promise),
    toBe: (expected: boolean) => asyncExpect(promise, (expect) => expect.toEqual(expected)),
    toMatchInlineSnapshot: makeToMatchInlineSnapshot(promise),
  }
}
