import { defaultConfig } from './config'
import { SvmConfig } from './typings'

describe('config utilities', () => {
  test('default config should never overwrite defined parameters', async () => {
    // Arrange
    const one = 1
    const userDefined: Partial<SvmConfig> = {
      C: [one]
    }

    // Act
    const filledWithDefaults = defaultConfig(userDefined)

    // Assert
    expect(filledWithDefaults.C.length).toBe(1)
    expect(filledWithDefaults.C[0]).toBe(one)
  })

  test('default config should always overwrite undefined and null parameters', async () => {
    // Arrange
    const one = 1
    const userDefined: Partial<SvmConfig> = {
      C: undefined,
      kFold: 69,
      gamma: [42],
      cache_size: undefined
    }

    // Act
    const filledWithDefaults = defaultConfig(userDefined)

    // Assert
    expect(filledWithDefaults.C.length).toBeGreaterThanOrEqual(1)
    expect(filledWithDefaults.kFold).toBe(69)
    expect(filledWithDefaults.gamma.length).toBe(1)
    expect(filledWithDefaults.gamma[0]).toBe(42)
    expect(filledWithDefaults.cache_size).toBeDefined()
  })
})
