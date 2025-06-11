import { test, expect } from 'vitest'
import z from '../index'
import type { SyncParseReturnType } from '../types'

test('parseUtil isInvalid should use structural typing', () => {
  // Test for issue #556: https://github.com/colinhacks/zod/issues/556
  const aborted: SyncParseReturnType = { status: 'aborted' }
  const dirty: SyncParseReturnType = { status: 'dirty', value: 'whatever' }
  const valid: SyncParseReturnType = { status: 'valid', value: 'whatever' }

  expect(z.isAborted(aborted)).toBe(true)
  expect(z.isAborted(dirty)).toBe(false)
  expect(z.isAborted(valid)).toBe(false)

  expect(z.isDirty(aborted)).toBe(false)
  expect(z.isDirty(dirty)).toBe(true)
  expect(z.isDirty(valid)).toBe(false)

  expect(z.isValid(aborted)).toBe(false)
  expect(z.isValid(dirty)).toBe(false)
  expect(z.isValid(valid)).toBe(true)
})
