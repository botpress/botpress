import { describe, test } from 'vitest'
import { rate } from '../src/assertions/rate'

describe('rate', { timeout: 30_000 }, () => {
  describe('works with strings and simple criteria', () => {
    test('good', async () => rate('ghandi', 'is a good person').toBeGreaterThanOrEqual(4))
    test('evil', async () => rate('hitler', 'is a good person').toBe(1))
  })

  describe('works with objects', () => {
    const SylvainMessage = {
      message: 'hello, how are you?',
      name: 'sylvain',
      age: 33,
      country: 'canada',
    }

    test('simple objects & conditions', () => {
      rate(SylvainMessage, 'message is a greeting').toBe(5)
      rate(SylvainMessage, 'contains age and name').toBe(5)
      rate(SylvainMessage, 'the user is old').toBeLessThanOrEqual(3)
      rate(SylvainMessage, 'the user might be a french person').toBeGreaterThanOrEqual(3) // because the user is from canada and name is quite french
      rate(SylvainMessage, 'the user might be a french person').toBeLessThanOrEqual(4) // because it's not a certainty and my message is english
    })

    test('toMatchInlineSnapshot', () => {
      rate(SylvainMessage, 'message is a greeting').toMatchInlineSnapshot(`5`)
    })
  })

  describe('learns from examples', () => {
    const examples = [
      {
        rating: 5,
        value: 'Rasa the chatbot framework',
        reason: 'Rasa is a chatbot framework, so it competes with us (Botpress, a chatbot company)',
      },
      {
        rating: 1,
        value: 'Rasa the coffee company',
        reason:
          'Since Rasa is a coffee company, it does not compete with us (Botpress) because we are not in the coffee business',
      },
    ]

    test('examples are used to understand how to classify correctly', () => {
      rate('Voiceflow', 'is our competitor', { examples }).toBeGreaterThanOrEqual(4)
      rate('Netflix', 'is our competitor', { examples }).toBeLessThanOrEqual(2)
    })
  })
})
