import { describe, expect, test, beforeEach } from 'vitest'
import { useBooleanGenerator } from './boolean-generator'

describe('Boolean Generator', () => {
  test.each([0, -1, 1.1, NaN])('Should throw error for invalid ratio: %r', (ratio) => {
    expect(() => useBooleanGenerator(ratio)).toThrow('Ratio must be a number between 0 and 1 (exclusive of 0)')
  })

  test.each([0.01, 0.01, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.099].map((r) => ({ ratio: r })))(
    '$ratio should be true approximately $ratio the time',
    ({ ratio }) => {
      const CYCLES = 1000000
      /** In Ratio */
      const TOLERANCE = 0.01

      let shouldAllow = useBooleanGenerator(ratio)
      let trueCount = 0
      for (let i = 0; i < CYCLES; i++) {
        if (shouldAllow()) {
          trueCount++
        }
      }

      const truthyRatio = trueCount / CYCLES
      expect(truthyRatio).toBeGreaterThan(ratio - TOLERANCE)
      expect(truthyRatio).toBeLessThan(ratio + TOLERANCE)
    }
  )

  test('Ratio of 1 should be true all the time', () => {
    const CYCLES = 10000

    let shouldAllow = useBooleanGenerator(1)
    let trueCount = 0
    for (let i = 0; i < CYCLES; i++) {
      if (shouldAllow()) {
        trueCount++
      }
    }

    const truthyRatio = trueCount / CYCLES
    expect(truthyRatio).toBe(1)
  })
})
