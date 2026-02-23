import { describe, expect, test, beforeEach } from 'vitest'
import { useBooleanGenerator } from './boolean-generator'

describe('Boolean Generator', () => {
  test.each([0, -10, 101, NaN])('Should throw error for invalid percentage: %p', (percentage) => {
    expect(() => useBooleanGenerator(percentage)).toThrow('Percentage must be a number between 1 and 100')
  })

  test.each([0.01, 1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99].map((p) => ({ percentage: p })))(
    '$percentage%% probability, should be true approximately $percentage%% the time',
    ({ percentage }) => {
      const CYCLES = 1000000
      /** In percentage */
      const TOLERANCE = 1

      let shouldAllow = useBooleanGenerator(percentage)
      let trueCount = 0
      for (let i = 0; i < CYCLES; i++) {
        if (shouldAllow()) {
          trueCount++
        }
      }

      const truthyPercentage = (trueCount / CYCLES) * 100
      expect(truthyPercentage).toBeGreaterThan(percentage - TOLERANCE)
      expect(truthyPercentage).toBeLessThan(percentage + TOLERANCE)
    }
  )

  test('100% probability, should be true all the time', () => {
    const CYCLES = 10000

    let shouldAllow = useBooleanGenerator(100)
    let trueCount = 0
    for (let i = 0; i < CYCLES; i++) {
      if (shouldAllow()) {
        trueCount++
      }
    }

    const truthyPercentage = (trueCount / CYCLES) * 100
    expect(truthyPercentage).toBe(100)
  })
})
