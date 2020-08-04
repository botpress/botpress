import { computeNorm, computeQuantile, scalarMultiply, vectorAdd } from './math'

describe('Math utils', () => {
  const vec0 = []
  const vec1 = [1, 1, 1]
  const vec2 = [2, 2, 2]
  const vec3 = [4, 5, 6]

  test('VectorAdd', () => {
    expect(() => vectorAdd(vec0, vec2)).toThrow()
    expect(vectorAdd(vec1, vec2)).toEqual([3, 3, 3])
    expect(vectorAdd(vec1, vec2)).toEqual([3, 3, 3])
    expect(vectorAdd(vec1, vec3)).toEqual([5, 6, 7])
    expect(vectorAdd(vec1, vec2, vec3)).toEqual([7, 8, 9])
  })

  test('ScalarMultiply', () => {
    expect(scalarMultiply(vec0, 2)).toEqual([])
    expect(scalarMultiply(vec1, 2)).toEqual([2, 2, 2])
  })

  test('ComputeNorm', () => {
    expect(computeNorm(vec0)).toEqual(0)
    expect(computeNorm(vec1)).toBeCloseTo(1.73, 2)
    expect(computeNorm(vec2)).toBeCloseTo(3.46, 2)
    expect(computeNorm(vec3)).toBeCloseTo(8.77, 2)
    expect(computeNorm([22, 21, 59, 4, -5, 36])).toBeCloseTo(75.78, 2)
  })

  // TODO add negative test case
  describe('ComputeQuantile', () => {
    test('Quartile', () => {
      expect(computeQuantile(4, 0, 10)).toEqual(1)
      expect(computeQuantile(4, 1, 10)).toEqual(1)
      expect(computeQuantile(4, 2, 10)).toEqual(1)

      expect(computeQuantile(4, 3, 10)).toEqual(2)
      expect(computeQuantile(4, 4, 10)).toEqual(2)
      expect(computeQuantile(4, 5, 10)).toEqual(2)

      expect(computeQuantile(4, 6, 10)).toEqual(3)
      expect(computeQuantile(4, 7, 10)).toEqual(3)

      expect(computeQuantile(4, 8, 10)).toEqual(4)
      expect(computeQuantile(4, 9, 10)).toEqual(4)
      expect(computeQuantile(4, 10, 10)).toEqual(4)
      expect(computeQuantile(4, 11, 10)).toEqual(4)
    })

    test('Tierce with lower bound', () => {
      expect(computeQuantile(3, 0.5, 2, 0.5)).toEqual(1)
      expect(computeQuantile(3, 0.52, 2, 0.5)).toEqual(1)
      expect(computeQuantile(3, 0.9, 2, 0.5)).toEqual(1)
      expect(computeQuantile(3, 1, 2, 0.5)).toEqual(1)

      expect(computeQuantile(3, 1.2, 2, 0.5)).toEqual(2)
      expect(computeQuantile(3, 1.4, 2, 0.5)).toEqual(2)
      expect(computeQuantile(3, 1.5, 2, 0.5)).toEqual(2)

      expect(computeQuantile(3, 1.7, 2, 0.5)).toEqual(3)
      expect(computeQuantile(3, 2, 2, 0.5)).toEqual(3)
    })
  })
})
