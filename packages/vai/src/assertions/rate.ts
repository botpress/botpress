import { z } from '@bpinternal/zui'

import { Context } from '../context'
import { asyncExpect } from '../utils/asyncAssertion'
import { Input, predictJson } from '../utils/predictJson'
import { makeToMatchInlineSnapshot, toAssertion } from './extension'

export type RatingScore = 1 | 2 | 3 | 4 | 5
export type RateOptions<T> = {
  examples?: { value: T; rating: number; reason: string }[]
}

export function rate<T extends Input>(value: T, condition: string, options?: RateOptions<T>) {
  const schema = z.number().min(1).max(5).describe('Rating score, higher is better (1 is the worst, 5 is the best)')
  const promise = predictJson({
    systemMessage: `Based on the following qualification criteria, you need to rate the given situation from a score of 1 to 5.\nScoring: 1 is the worst score, 5 is the best score possible.\nCriteria: ${condition}`,
    examples: options?.examples?.map(({ value, reason, rating }) => ({
      input: value,
      output: { reason, result: rating },
    })),
    outputSchema: schema,
    model: Context.evaluatorModel,
    input: value,
  }).then((x) => {
    return {
      result: typeof x.result === 'number' ? x.result : parseInt(x.result, 10),
      reason: x.reason,
    }
  })

  return {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    ...toAssertion(promise),
    toBe: (expected: number) => asyncExpect(promise, (expect) => expect.toEqual(expected)),
    toMatchInlineSnapshot: makeToMatchInlineSnapshot(promise),
    toBeGreaterThanOrEqual: (expected: RatingScore) =>
      asyncExpect(promise, (expect) => expect.toBeGreaterThanOrEqual(expected)),
    toBeLessThanOrEqual: (expected: RatingScore) =>
      asyncExpect(promise, (expect) => expect.toBeLessThanOrEqual(expected)),
  }
}
