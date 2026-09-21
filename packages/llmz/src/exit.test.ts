import { z } from '@bpinternal/zui'
import { expect, expectTypeOf, test, vi } from 'vitest'
import { Exit, type ExitResult } from './exit.js'

test('accepts authoring schemas while preserving their original validation and normalization', () => {
  const schema = z.object({
    instructions: z
      .string()
      .trim()
      .min(1)
      .refine((value) => value === 'valid', 'Use valid runtime references'),
  })
  const exit = new Exit({ name: 'completeTask', description: 'Finish authoring.', schema })

  expect(exit.schema).toMatchObject({ properties: { instructions: { type: 'string', minLength: 1 } } })
  expect(exit.zSchema).toBe(schema)
  expect(exit.zSchema!.parse({ instructions: ' valid ' })).toEqual({ instructions: 'valid' })
  expect(() => exit.zSchema!.parse({ instructions: 'invalid' })).toThrow('Use valid runtime references')
  expect(exit.clone().zSchema).toBe(schema)
})

test('infers transformed output separately from the accepted input', () => {
  const transform = vi.fn((value: string) => value.length)
  const exit = new Exit({ name: 'done', description: 'Return the length.', schema: z.string().transform(transform) })

  expectTypeOf(exit).toEqualTypeOf<Exit<number>>()
  expectTypeOf<ExitResult<number>['result']>().toEqualTypeOf<number>()
  expect(transform).not.toHaveBeenCalled()
  expect(exit.zSchema!.parse('hello')).toBe(5)
  expectTypeOf(exit.zSchema!.parse).returns.toEqualTypeOf<number>()
  expect(transform).toHaveBeenCalledOnce()
  expectTypeOf(exit.clone()).toEqualTypeOf<Exit<number>>()
})

test('serialization describes the model input without pretending to serialize JavaScript validators', () => {
  const exit = new Exit({ name: 'done', description: 'Done.', schema: z.string().refine((value) => value === 'valid') })
  const json = JSON.parse(JSON.stringify(exit))

  expect(json.schema).toMatchObject({ type: 'string' })
  expect(exit.clone().zSchema!.safeParse('invalid').success).toBe(false)
})
