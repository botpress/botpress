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
    const set6 = mapSet([0.2, 0.1, 0.08, 0.6])
    const set7 = mapSet([0.28, 0.22, 0.14, 0.12])
    const set8 = mapSet([0.8])
    const set9 = mapSet([0.6])
    const set10 = mapSet([0.2, 0.1])
    const set11 = mapSet([0.45, 0.1, 0.05, 0.05, 0.0002, 0.0002, 0.0002, 0.0002, 0.0002, 0.0002, 0.0002])
    const set12 = mapSet([0.65, 0.32, 0.01, 0.0059, 0.0007])

    const res1 = findMostConfidentIntentMeanStd(set1, 0.8)
    const res2 = findMostConfidentIntentMeanStd(set2, 0.8)
    const res3 = findMostConfidentIntentMeanStd(set3, 0.8)
    const res4 = findMostConfidentIntentMeanStd(set4, 0.8)
    const res5 = findMostConfidentIntentMeanStd(set5, 0.8)
    const res6 = findMostConfidentIntentMeanStd(set6, 0.8)
    const res7 = findMostConfidentIntentMeanStd(set7, 0.8)
    const res8 = findMostConfidentIntentMeanStd(set8, 0.8)
    const res9 = findMostConfidentIntentMeanStd(set9, 0.8)
    const res10 = findMostConfidentIntentMeanStd(set10, 0.8)
    const res11 = findMostConfidentIntentMeanStd(set11, 0.8)
    const res12 = findMostConfidentIntentMeanStd(set12, 0.8)

    expect(res1.name).toBe('0')
    expect(res2.name).toBe('0')
    expect(res3.name).toBe('none')
    expect(res4.name).toBe('0')
    expect(res5.name).toBe('none')
    expect(res6.name).toBe('3')
    expect(res7.name).toBe('none')
    expect(res8.name).toBe('0')
    expect(res9.name).toBe('none')
    expect(res10.name).toBe('none')
    expect(res11.name).toBe('0')
    expect(res12.name).toBe('0')
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
