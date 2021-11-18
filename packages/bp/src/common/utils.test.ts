import { sanitize, isValid } from './utils'

test('test invalid paths', () => {
  expect(isValid('../folder', 'path')).toEqual(false)
  expect(isValid('../folder/file.js', 'path')).toEqual(false)
  expect(isValid('folder/file.js', 'path')).toEqual(true)
  expect(isValid('folder/../file.js', 'path')).toEqual(false)
  expect(isValid('file.js', 'path')).toEqual(true)
  expect(isValid('file..js', 'path')).toEqual(true)
})
