import { z } from '@bpinternal/zui'
import { expect, test, vi } from 'vitest'
import { InvalidConfigurationError } from './errors.js'
import { parseSchemaAsync, parseSchemaSync, schemaInput, toModelSchema } from './schema.js'

test('projects nested effects without running or replacing their validators', () => {
  const normalize = vi.fn((value: string) => value.length)
  const schema = z.object({ size: z.string().trim().transform(normalize) })

  expect(toModelSchema(schema)).toMatchObject({ properties: { size: { type: 'string' } } })
  expect(normalize).not.toHaveBeenCalled()
  expect(parseSchemaSync(schema, { size: ' hello ' }, 'Test')).toMatchObject({ success: true, data: { size: 5 } })
  expect(normalize).toHaveBeenCalledOnce()
})

test('preserves refinements as ordinary validation issues', () => {
  const schema = z.string().refine((value) => value === 'valid', 'Use valid runtime references')
  const result = parseSchemaSync(schema, 'invalid', 'Test')

  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.error.issues[0]?.message).toBe('Use valid runtime references')
  }
})

test('reports async effects on synchronous surfaces as typed configuration errors', () => {
  const schema = z.string().transform(async (value) => value.length)

  expect(() => parseSchemaSync(schema, 'hello', 'Exit "done"')).toThrow(InvalidConfigurationError)
  expect(() => parseSchemaSync(schema, 'hello', 'Exit "done"')).toThrow(
    /asynchronous validation in a tool input schema/
  )
})

test('unwraps root effects only for inspecting their input shape', () => {
  const base = z.object({ name: z.string() })
  const wrapped = base.refine(() => true).transform((value) => value.name)

  expect(schemaInput(wrapped)).toBe(base)
})

test('projects pipeline input without mixing it with a different output type', () => {
  const schema = z.object({
    size: z
      .string()
      .transform((value) => value.length)
      .pipe(z.number().min(2)),
  })

  expect(toModelSchema(schema)).toMatchObject({ properties: { size: { type: 'string' } } })
  expect(schema.parse({ size: 'hello' })).toEqual({ size: 5 })
  expect(() => schema.parse({ size: 'x' })).toThrow()
})

test('reports thrown validator bugs as typed configuration errors', async () => {
  const schema = z.string().transform(() => {
    throw new Error('Broken validator')
  })

  await expect(parseSchemaAsync(schema, 'hello', 'Tool input')).rejects.toBeInstanceOf(InvalidConfigurationError)
})
