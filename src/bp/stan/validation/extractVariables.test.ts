import extractVariables from './extractVariables'

test('variables extraction', () => {
  expect(extractVariables('give me a [banana](fruit)')[0]).toBe('fruit')

  const extracted = extractVariables('give me a [banana](fruit) and a [pizza](thing)')
  expect(extracted[0]).toBe('fruit')
  expect(extracted[1]).toBe('thing')

  expect(extractVariables('give me a fruit').length).toBe(0)
})
