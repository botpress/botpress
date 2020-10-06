import { extractVariables, validateVariableName } from './variable-naming'

test('variables extraction', () => {
  expect(extractVariables('give me a $fruit and a gatorade')[0]).toBe('fruit')
  expect(extractVariables('give me a $fruit水果 or a gatorade')[0]).toBe('fruit')

  expect(extractVariables('give me a 5 \\$ or a gatorade').length).toBe(0)

  expect(() => extractVariables('give me a 5 $ or a gatorade')).toThrow()
})

test('variables name validation', () => {
  expect(validateVariableName('fruit')).toBe(true)
  expect(validateVariableName('fruit_5')).toBe(true)
  expect(validateVariableName('fruit-5')).toBe(true)
  expect(validateVariableName('fruit5fruit')).toBe(true)

  expect(validateVariableName('5fruit5fruit')).toBe(false)
  expect(validateVariableName('水果')).toBe(false)
  expect(validateVariableName('fruit水果')).toBe(false)
})
