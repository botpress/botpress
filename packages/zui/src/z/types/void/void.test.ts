import { test, expect } from 'vitest'
import { util } from '../utils'
import { ZodVoid } from '.'
import { TypeOf } from '../basetype'

test('void', () => {
  const v = ZodVoid.create()
  v.parse(undefined)

  expect(() => v.parse(null)).toThrow()
  expect(() => v.parse('')).toThrow()

  type v = TypeOf<typeof v>
  util.assertEqual<v, void>(true)
})
