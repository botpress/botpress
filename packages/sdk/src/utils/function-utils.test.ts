import { expect, test } from 'vitest'
import { setName } from './function-utils'

test('setName with an arrow function keeps its name', () => {
  const foo = (x: { a: number }) => ({ b: x.a + 1 })
  const bar = setName(() => foo({ a: 1 }), 'bar')

  expect(foo.name).toBe('foo')
  expect(bar.name).toBe('bar')
})

test('setName with a function expression keeps its name', () => {
  function foo(x: { a: number }) {
    return {
      b: x.a + 1,
    }
  }

  const bar = setName(() => foo({ a: 1 }), 'bar')

  expect(foo.name).toBe('foo')
  expect(bar.name).toBe('bar')
})
