import { allInRange, computeNorm, scalarMultiply, vectorAdd } from './math'

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

  test('AllInRange', () => {
    expect(allInRange([0.45, 0.55], 0.45, 0.55)).toBeFalsy()
    expect(allInRange([0.44, 0.55], 0.45, 0.55)).toBeFalsy()
    expect(allInRange([0.45, 0.56], 0.45, 0.55)).toBeFalsy()
    expect(allInRange([0.4, 0.6], 0.45, 0.55)).toBeFalsy()
    expect(allInRange([0.46, 0.54], 0.45, 0.55)).toBeTruthy()
    expect(allInRange([0.32, 0.32, 0.35], 0.3, 0.36)).toBeTruthy()
    expect(allInRange([], 0.3, 0.36)).toBeTruthy()
  })
})
