import { test, expect } from 'vitest'
import * as requireUtils from './require-utils'

test('require js code should do as its name suggests', () => {
  const code = `
    module.exports = {
      foo: 'bar'
    }
  `

  const result = requireUtils.requireJsCode<{ foo: string }>(code)

  expect(result.foo).toBe('bar')
})

const getError = (fn: () => void): Error | undefined => {
  try {
    fn()
    return
  } catch (thrown: unknown) {
    return thrown instanceof Error ? thrown : new Error(`${thrown}`)
  }
}

test('require js code should indicate issue in stack trace', () => {
  const code = `
    var foo = undefined
    module.exports = {
      bar: foo.bar
    }
  `

  const error = getError(() => requireUtils.requireJsCode(code))

  expect(error).toBeDefined()
  expect(error?.message).toContain('bar: foo.bar')
})
