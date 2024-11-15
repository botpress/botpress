import { test, expect } from 'vitest'
import { toTypescript } from '.'
import z from '../../z'

const toTypescriptType = (schema: z.Schema) => toTypescript(schema, { declaration: 'variable' })

test('string', async () => {
  const schema = z.string().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: string')
})
test('string nullable', async () => {
  const schema = z.string().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: string | null')
})
test('string optional', async () => {
  const schema = z.string().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: string | undefined')
})
test('string nullable optional', async () => {
  const schema = z.string().nullable().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: string | null | undefined')
})
test('string optional nullable', async () => {
  const schema = z.string().optional().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: string | undefined | null')
})
test('number', async () => {
  const schema = z.number().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: number')
})
test('number nullable', async () => {
  const schema = z.number().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: number | null')
})
test('number optional', async () => {
  const schema = z.number().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: number | undefined')
})
test('number nullable optional', async () => {
  const schema = z.number().nullable().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: number | null | undefined')
})
test('number optional nullable', async () => {
  const schema = z.number().optional().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: number | undefined | null')
})
test('bigint', async () => {
  const schema = z.bigint().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: number') // should be bigint instead of number
})
test('bigint nullable', async () => {
  const schema = z.bigint().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: number | null') // should be bigint instead of number
})
test('bigint optional', async () => {
  const schema = z.bigint().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: number | undefined') // should be bigint instead of number
})
test('bigint nullable optional', async () => {
  const schema = z.bigint().nullable().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: number | null | undefined') // should be bigint instead of number
})
test('bigint optional nullable', async () => {
  const schema = z.bigint().optional().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: number | undefined | null') // should be bigint instead of number
})
test('boolean', async () => {
  const schema = z.boolean().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: boolean')
})
test('boolean nullable', async () => {
  const schema = z.boolean().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: boolean | null')
})
test('boolean optional', async () => {
  const schema = z.boolean().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: boolean | undefined')
})
test('boolean nullable optional', async () => {
  const schema = z.boolean().nullable().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: boolean | null | undefined')
})
test('boolean optional nullable', async () => {
  const schema = z.boolean().optional().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: boolean | undefined | null')
})
test('date', async () => {
  const schema = z.date().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: Date')
})
test('date nullable', async () => {
  const schema = z.date().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: Date | null')
})
test('date optional', async () => {
  const schema = z.date().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: Date | undefined')
})
test('date nullable optional', async () => {
  const schema = z.date().nullable().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: Date | null | undefined')
})
test('date optional nullable', async () => {
  const schema = z.date().optional().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: Date | undefined | null')
})
test('undefined', async () => {
  const schema = z.undefined().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: undefined')
})
test('undefined nullable', async () => {
  const schema = z.undefined().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: undefined | null')
})
test('undefined optional', async () => {
  const schema = z.undefined().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: undefined | undefined')
})
test('undefined nullable optional', async () => {
  const schema = z.undefined().nullable().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: undefined | null | undefined')
})
test('undefined optional nullable', async () => {
  const schema = z.undefined().optional().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: undefined | undefined | null')
})
test('null', async () => {
  const schema = z.null().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: null')
})
test('null nullable', async () => {
  const schema = z.null().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: null | null')
})
test('null optional', async () => {
  const schema = z.null().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: null | undefined')
})
test('null nullable optional', async () => {
  const schema = z.null().nullable().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: null | null | undefined')
})
test('null optional nullable', async () => {
  const schema = z.null().optional().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: null | undefined | null')
})
test('unknown', async () => {
  const schema = z.unknown().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: unknown')
})
test('unknown nullable', async () => {
  const schema = z.unknown().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: unknown | null')
})
test('unknown optional', async () => {
  const schema = z.unknown().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: unknown | undefined')
})
test('unknown nullable optional', async () => {
  const schema = z.unknown().nullable().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: unknown | null | undefined')
})
test('unknown optional nullable', async () => {
  const schema = z.unknown().optional().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: unknown | undefined | null')
})
test('never', async () => {
  const schema = z.never().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: never')
})
test('never nullable', async () => {
  const schema = z.never().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: never | null')
})
test('never optional', async () => {
  const schema = z.never().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: never | undefined')
})
test('never nullable optional', async () => {
  const schema = z.never().nullable().optional().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: never | null | undefined')
})
test('never optional nullable', async () => {
  const schema = z.never().optional().nullable().title('x')
  const typings: string = toTypescriptType(schema)
  await expect(typings).toMatchWithoutFormatting('declare const x: never | undefined | null')
})
