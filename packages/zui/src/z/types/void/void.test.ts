import { test, expect } from 'vitest'
import * as z from '../../index'
import { util } from '../utils'

test('void', () => {
  const v = z.void()
  v.parse(undefined)

  expect(() => v.parse(null)).toThrow()
  expect(() => v.parse('')).toThrow()

  type v = z.infer<typeof v>
  util.assertEqual<v, void>(true)
})
