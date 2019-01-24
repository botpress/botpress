import * as sdk from 'botpress/sdk'

import { createIntentMatcher, findMostConfidentIntentMeanStd } from './utils'

describe('NLU intent utils', () => {
  test('findMostConfidentIntentMeanStd', () => {
    const mapSet = (n: number[]): sdk.NLU.Intent[] =>
      n.map((x, i) => <sdk.NLU.Intent>{ confidence: x, name: i.toString(), context: 'global' })
    const set1 = mapSet([0.8, 0.1, 0.09, 0.08])
    const set2 = mapSet([0.8, 0.7])
    const set3 = mapSet([])
    const set4 = mapSet([0.45, 0.12, 0.11, 0.08, 0.0002])
    const set5 = mapSet([0.2, 0.12, 0.11, 0.08, 0.0002])

    const res1 = findMostConfidentIntentMeanStd(set1, 0.8, 4)
    const res2 = findMostConfidentIntentMeanStd(set2, 0.8, 4)
    const res3 = findMostConfidentIntentMeanStd(set3, 0.8, 4)
    const res4 = findMostConfidentIntentMeanStd(set4, 0.8, 4)
    const res4b = findMostConfidentIntentMeanStd(set4, 0.8, 5)
    const res5 = findMostConfidentIntentMeanStd(set5, 0.8, 4)
    const res5b = findMostConfidentIntentMeanStd(set5, 0.8, 2)

    expect(res1.name).toBe('0')
    expect(res2.name).toBe('0')
    expect(res3.name).toBe('none')
    expect(res4.name).toBe('0')
    expect(res4b.name).toBe('none')
    expect(res5.name).toBe('none')
    expect(res5b.name).toBe('0')
  })

  describe('matches', () => {
    test('Exact match', () => {
      const matches = createIntentMatcher('faq.hello')
      expect(matches('faq.hello')).toBe(true)
      expect(matches('faq.hello2')).toBe(false)
      expect(matches('faq.hell')).toBe(false)
      expect(matches('faq_hello')).toBe(false)
    })

    test('Wildcard ending', () => {
      const matches = createIntentMatcher('faq.hello')
      expect(matches('faq.hell*')).toBe(true)
      expect(matches('faq.h*')).toBe(true)
      expect(matches('faq.q*')).toBe(false)
      expect(matches('faq.hello*')).toBe(false)
      expect(matches('*')).toBe(true)
      expect(matches('faq.faq.h*')).toBe(false)
    })

    test('Wildcard starting', () => {
      const matches = createIntentMatcher('faq.hello')
      expect(matches('*.hello')).toBe(true)
      expect(matches('*aq.hello')).toBe(true)
      expect(matches('*.nope')).toBe(false)
    })

    test('Wildcard both', () => {
      const matches = createIntentMatcher('faq.hello')
      expect(matches('*.*')).toBe(true)
      expect(matches('*aq.hell*')).toBe(true)
      expect(matches('*.nope*')).toBe(false)
    })

    test('Escaping', () => {
      const matches = createIntentMatcher('faq.hello')
      expect(matches('.+')).toBe(false)
    })
  })
})
