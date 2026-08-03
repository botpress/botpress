import { z } from '@bpinternal/zui'

import { Context } from '../context'
import { asyncExpect } from '../utils/asyncAssertion'
import { predictJson } from '../utils/predictJson'
import { makeToMatchInlineSnapshot, toAssertion } from './extension'

export type FilterOptions<T> = {
  examples?: { value: T; reason: string; keep: boolean }[]
}

export function filter<U>(values: U[], condition: string, options?: FilterOptions<U>) {
  const mappedValues = values.map((_, idx) =>
    z.object({
      index: z.literal(idx),
      reason: z.string(),
      keep: z.boolean(),
    })
  )

  const input = values.map((value, idx) => ({
    index: idx,
    value,
  }))

  const schema = z

    .tuple(mappedValues as any)
    .describe(
      'An array of the objects with the index and a boolean value indicating if the object should be kept or not'
    )

  const promise = predictJson({
    systemMessage: `
Based on the following qualification criteria, you need to filter the given list of objects.
Citeria: ${condition}

---
You need to return an array of objects with the index and a boolean value indicating if the object should be kept or not.
`.trim(),
    examples: options?.examples
      ? [
          {
            input: options?.examples?.map((v, index) => ({
              index,
              value: v.value,
            })),
            output: {
              reason: 'Here are some examples',
              result: options?.examples?.map((v, idx) => ({
                index: idx,
                reason: v.reason,
                keep: v.keep,
              })),
            },
          },
        ]
      : undefined,
    outputSchema: schema,
    model: Context.evaluatorModel,
    input,
  }).then((x) => {
    const results = schema.parse(x.result) as { index: number; keep: boolean }[]
    return {
      result: values.filter((_, idx) => results.find((r) => r.index === idx)?.keep),
      reason: x.reason,
    }
  })

  return {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    ...toAssertion(promise),
    toBe: (expected: U[]) => asyncExpect(promise, (expect) => expect.toEqual(expected)),
    toMatchInlineSnapshot: makeToMatchInlineSnapshot(promise),
    toHaveNoneFiltered: () => asyncExpect(promise, (expect) => expect.toEqual(values)),
    toHaveSomeFiltered: () => asyncExpect(promise, (expect) => expect.not.toEqual(values)),
    toBeEmpty: () => asyncExpect(promise, (expect) => expect.toHaveLength(0)),
    length: {
      toBe: (expected: number) => asyncExpect(promise, (expect) => expect.toHaveLength(expected)),
      toBeGreaterThanOrEqual: (expected: number) =>
        asyncExpect(promise, (expect) => expect.length.greaterThanOrEqual(expected)),
      toBeLessThanOrEqual: (expected: number) =>
        asyncExpect(promise, (expect) => expect.length.lessThanOrEqual(expected)),
      toBeBetween: (min: number, max: number) => asyncExpect(promise, (expect) => expect.length.within(min, max)),
    },
  }
}
