import { orderKeys } from './order-keys'

test('order keys with primitive types return input', () => {
  for (const x of [1, '2', true]) {
    expect(orderKeys(x)).toBe(x)
  }
})

test('order keys with flat objects works', () => {
  expect(orderKeys({ d: 'd', b: 'b', a: 'a', c: 'c' })).toEqual({ a: 'a', b: 'b', c: 'c', d: 'd' })
  expect(orderKeys({ a3: 'a', a1: 'b', a5: 'c', a2: 'd' })).toEqual({ a1: 'b', a2: 'd', a3: 'a', a5: 'c' })
})

test('order keys with nested objects works with simple example', () => {
  const x = {
    c: 0,
    a: {
      c: ['c', 'a', 'b'],
      a: 0,
      b: 0
    },
    b: 0
  }

  const expected = {
    a: {
      a: 0,
      b: 0,
      c: ['c', 'a', 'b']
    },
    b: 0,
    c: 0
  }

  const actual = orderKeys(x)
  expect(actual).toEqual(expected)
})

test('order keys with nested objects works with complex example', () => {
  const x = {
    d: 'd',
    b: 'b',
    a: {
      a2: 'd',
      a3: [1, 2, 3, 4, { zozo: 69, yaya: 42 }],
      a5: 'c',
      a1: 'b'
    },
    c: 'c'
  }

  const expected = {
    a: {
      a1: 'b',
      a2: 'd',
      a3: [1, 2, 3, 4, { yaya: 42, zozo: 69 }],
      a5: 'c'
    },
    b: 'b',
    c: 'c',
    d: 'd'
  }

  const actual = orderKeys(x)
  expect(actual).toEqual(expected)
})
