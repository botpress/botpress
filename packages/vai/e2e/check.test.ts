import { describe, expect, test } from 'vitest'
import { check } from '../src/assertions/check'
import { Context } from '../src/context'
import { AsyncExpectError } from '../src/utils/asyncAssertion'

describe('check (promise)', () => {
  test('simple promise', async () => {
    const { reason, result } = await check('hello', 'is a greeting message')
    expect(reason).toContain('greeting')
    expect(result).toBe(true)
  })
})

describe('check (assert)', { timeout: 30_000 }, () => {
  describe('works with strings and simple conditions', () => {
    test('test truth', () => {
      check('hello', 'is a greeting message').toBe(true)
    })

    test('await expect', async () => {
      Context.swallowErrors()
      const res1 = await check('hello', 'is a greeting message').toBe(false)
      const res2 = await check('hello', 'is a greeting message').toBe(true)
      expect(res1).toBeInstanceOf(AsyncExpectError)
      expect(res2).not.toBeInstanceOf(AsyncExpectError)
    })

    test('two conditions at once', () => {
      // name and age are present
      check('i am 33 years old and my name is sylvain', "the message contains both the user's name and age").toBe(true)

      // age is missing
      check('my name is sylvain', "the message contains both the user's name and age").toBe(false)
    })

    test('false on simple conditions', () => {
      check('hello', 'is not a greeting message').toBe(false)
      check('how much does milk cost?', 'is a greeting message').toBe(false)
    })
  })

  describe('works with objects', () => {
    const SylvainMessage = {
      message: 'hello, how are you?',
      name: 'sylvain',
      age: 33,
      country: 'canada',
    }

    test('simple objects & conditions', () => {
      check(SylvainMessage, 'message is a greeting').toBe(true)
      check(SylvainMessage, 'contains age and name').toBe(true)
      check(SylvainMessage, 'user is named sylvain and is from canada').toBe(true)
      check(SylvainMessage, 'sylvain is above 30 years old').toBe(true)
    })

    test('false checks', () => {
      check(SylvainMessage, 'message says goodbye').toBe(false)
      check(SylvainMessage, 'is missing name and age').toBe(false)
      check(SylvainMessage, 'user is named yann').toBe(false)
      check(SylvainMessage, 'sylvain is above 40 years old').toBe(false)
    })
  })

  describe('works with arrays', () => {
    const messages = [
      { message: 'hello, how are you?', name: 'sylvain', age: 33, country: 'canada' },
      { message: 'goodbye, see you later', name: 'yann', age: 40, country: 'france' },
    ]

    test('simple arrays & conditions', () => {
      check(messages, 'first message is a greeting').toBe(true)
      check(messages, 'first array element contains age and name').toBe(true)
      check(messages, 'second message is a goodbye').toBe(true)
      check(messages, 'second array element misses the age').toBe(false)
    })
  })

  describe('learns from examples', () => {
    test('examples are used to understand how to classify correctly', () => {
      const examples = [
        {
          expected: true,
          value: 'Rasa the chatbot framework',
          reason: 'Rasa is a chatbot framework, so it competes with Botpress',
        },
        {
          expected: false,
          value: 'Rasa the coffee company',
          reason:
            'Since Rasa is a coffee company, it does not compete with Botpress which is not in the coffee business',
        },
      ]

      check('Voiceflow', 'is competitor', { examples }).toBe(true)
      check('Toyota', 'is competitor', { examples }).toBe(false)
    })
  })
})
