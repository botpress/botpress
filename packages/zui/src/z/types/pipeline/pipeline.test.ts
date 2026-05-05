import { test, expect } from 'vitest'
import * as z from '../../index'

test('string to number pipeline', () => {
  const schema = z.string().transform(Number).pipe(z.number())
  expect(schema.parse('1234')).toEqual(1234)
})

test('string to number pipeline async', async () => {
  const schema = z
    .string()
    .transform(async (val) => Number(val))
    .pipe(z.number())
  expect(await schema.parseAsync('1234')).toEqual(1234)
})

test('break if dirty', () => {
  const schema = z
    .string()
    .refine((c) => c === '1234')
    .transform(async (val) => Number(val))
    .pipe(z.number().refine((v) => v < 100))
  const r1 = schema.safeParse('12345') as z.SafeParseError<unknown>
  expect(r1.error.issues.length).toBe(1)
  const r2 = schema.safeParse('3') as z.SafeParseError<unknown>
  expect(r2.error.issues.length).toBe(1)
})
