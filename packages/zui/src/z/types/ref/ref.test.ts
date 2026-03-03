import { test, expect } from 'vitest'
import * as z from '../../index'
import * as assert from '../../assertions.utils.test'

const T = z.ref('T')

test('failing validations', () => {
  expect(() => T.parse(5)).toThrow()
  expect(() => T.parse('5')).toThrow()
  expect(() => T.parse({ data: '5' })).toThrow()
})

test('type inference', () => {
  const schema = z.object({
    description: z.string(),
    data: T,
  })
  type Expected = {
    description: string
    data: NonNullable<unknown>
  }
  type Actual = z.infer<typeof schema>
  assert.assertEqual<Actual, Expected>(true)
})
