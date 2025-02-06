import { describe, test } from 'vitest'
import { filter } from '../src/assertions/filter'

describe('filter', { timeout: 30_000 }, () => {
  const companies = [
    { name: 'rasa', type: 'chatbot framework' },
    { name: 'voiceflow', type: 'conversational AI software' },
    { name: 'netflix', type: 'streaming service' },
    { name: 'rasa', type: 'coffee company' },
    { name: 'apple', type: 'apple computers' },
  ]

  test('empty list', () => {
    filter([], 'nothing').toBe([])
  })

  test('strings (countries)', () => {
    const countries = ['canada', 'germany', 'usa', 'paris', 'mexico']

    filter(countries, 'is in north america').toBe(['canada', 'usa', 'mexico'])
    filter(countries, 'is the name of a country').toHaveSomeFiltered()
    filter(countries, 'is the name of a country').length.toBe(4)
    filter(countries, 'is the name of a country').length.toBeGreaterThanOrEqual(4)
    filter(countries, 'is the name of a country').length.toBeLessThanOrEqual(4)
    filter(countries, 'is the name of a country').length.toBeBetween(3, 5)
  })

  test('objects (companies)', () => {
    filter(companies, 'is a chatbot company / software').length.toBe(2)
    filter(companies, 'is not a chatbot company / software').length.toBe(3)
  })

  test('toMatchInlineSnapshot', () => {
    filter(companies, 'is a chatbot company or product / software').toMatchInlineSnapshot(`
      [
        {
          "name": "rasa",
          "type": "chatbot framework",
        },
        {
          "name": "voiceflow",
          "type": "conversational AI software",
        },
      ]
    `)
  })

  test('learns from examples', () => {
    const messages = ['-', 'dhgkjh324rwlksfd', 'À la recherche de la paix intérieure', 'Hi my name is Roger']
    const examples = [
      { value: 'Hello how are you?', keep: false, reason: 'The message is not in french, discarding' },
      { value: 'Bonjour, comment allez-vous?', keep: true, reason: 'The message is in french, keeping it' },
      { value: 'Je parle francais', keep: true, reason: 'The message is in french, keeping it' },
      { value: 'Whats up!', keep: false, reason: 'The message is not clearly French, discarding it' },
    ]

    filter(messages, 'keep the messages according to the examples', { examples }).toBe([
      'À la recherche de la paix intérieure',
    ])
  })
})
