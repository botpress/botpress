import { test, expect } from 'vitest'
import * as z from '../../index'

function checkErrors(a: z.ZodBaseType, bad: any) {
  let expected: z.ZodError | undefined = undefined
  try {
    a.parse(bad)
  } catch (error) {
    expected = error as z.ZodError
  }

  let actual: z.ZodError | undefined = undefined
  try {
    a.optional().parse(bad)
  } catch (error) {
    actual = error as z.ZodError
  }

  const actualErrors = actual?.errors || []
  const expectedErrors = expected?.errors || []

  expect(actualErrors.length).toEqual(expectedErrors.length)
  for (let i = 0; i < expectedErrors.length; i++) {
    expect(actualErrors[i]).toEqual(expectedErrors[i])
  }
}

test('Should have error messages appropriate for the underlying type', () => {
  checkErrors(z.string().min(2), 1)
  z.string().min(2).optional().parse(undefined)
  checkErrors(z.number().gte(2), 1)
  z.number().gte(2).optional().parse(undefined)
  checkErrors(z.boolean(), '')
  z.boolean().optional().parse(undefined)
  checkErrors(z.undefined(), null)
  z.undefined().optional().parse(undefined)
  checkErrors(z.null(), {})
  z.null().optional().parse(undefined)
  checkErrors(z.object({}), 1)
  z.object({}).optional().parse(undefined)
  checkErrors(z.tuple([]), 1)
  z.tuple([]).optional().parse(undefined)
  checkErrors(z.unknown(), 1)
  z.unknown().optional().parse(undefined)
})

test('unwrap', () => {
  const unwrapped = z.string().optional().unwrap()
  expect(unwrapped.typeName).toBe('ZodString')
})
