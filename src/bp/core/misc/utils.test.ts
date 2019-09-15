import { asBytes } from './utils'

test('asBytes', () => {
  expect(asBytes('5mb')).toEqual(5 * 1024 * 1024)
  expect(asBytes('5   mb')).toEqual(5 * 1024 * 1024)
  expect(asBytes('5.0 MB')).toEqual(5 * 1024 * 1024)
  expect(asBytes('1234')).toEqual(1234)
  expect(asBytes('1234b')).toEqual(1234)
  expect(asBytes('')).toEqual(0)
})
