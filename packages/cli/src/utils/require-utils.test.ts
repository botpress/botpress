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
