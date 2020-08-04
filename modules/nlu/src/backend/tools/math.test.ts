import { allInRange } from './math'

describe('Math utils', () => {
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
