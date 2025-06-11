import { test, expect } from 'vitest'
import * as z from '../../index'
import { util } from '../utils'

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
  util.assertEqual<Actual, Expected>(true)
})
