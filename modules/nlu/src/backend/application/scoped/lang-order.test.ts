import { getLanguageOrder } from './lang-order'

const predictedLanguage = 'zh'
const anticipatedLanguage = 'en'
const defaultLanguage = 'fr'

test('if order is "pad" then we should get predicted, anticipated and default', () => {
  const actual = getLanguageOrder(
    {
      predictedLanguage,
      anticipatedLanguage,
      defaultLanguage
    },
    'pad'
  )

  expect(actual.length).toBe(3)
  expect(actual[0]).toBe(predictedLanguage)
  expect(actual[1]).toBe(anticipatedLanguage)
  expect(actual[2]).toBe(defaultLanguage)
})

test('if order is "apd" then we should get predicted, anticipated and default', () => {
  const actual = getLanguageOrder(
    {
      predictedLanguage,
      anticipatedLanguage,
      defaultLanguage
    },
    'apd'
  )

  expect(actual.length).toBe(3)
  expect(actual[0]).toBe(anticipatedLanguage)
  expect(actual[1]).toBe(predictedLanguage)
  expect(actual[2]).toBe(defaultLanguage)
})

test('if order is "dap" then we should get predicted, anticipated and default', () => {
  const actual = getLanguageOrder(
    {
      predictedLanguage,
      anticipatedLanguage,
      defaultLanguage
    },
    'dap'
  )

  expect(actual.length).toBe(3)
  expect(actual[0]).toBe(defaultLanguage)
  expect(actual[1]).toBe(anticipatedLanguage)
  expect(actual[2]).toBe(predictedLanguage)
})

test('if order is "pad" and predicted is undefined then we should get anticipated and default', () => {
  const actual = getLanguageOrder(
    {
      predictedLanguage: undefined,
      anticipatedLanguage: anticipatedLanguage,
      defaultLanguage: defaultLanguage
    },
    'pad'
  )

  expect(actual.length).toBe(2)
  expect(actual[0]).toBe(anticipatedLanguage)
  expect(actual[1]).toBe(defaultLanguage)
})

test('if order is "pad" and predicted is same as default then we should get predicted and anticipated', () => {
  let tmp = defaultLanguage
  const actual = getLanguageOrder(
    {
      predictedLanguage: tmp,
      anticipatedLanguage,
      defaultLanguage: tmp
    },
    'pad'
  )

  expect(actual.length).toBe(2)
  expect(actual[0]).toBe(tmp)
  expect(actual[1]).toBe(anticipatedLanguage)
})
