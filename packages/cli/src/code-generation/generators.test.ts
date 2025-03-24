import { describe, it, expect } from 'vitest'
import { getFunctionSource } from './generators'

describe('getFunctionSource', () => {
  describe('regular functions', () => {
    it('converts named function declaration to arrow function', () => {
      // Arrange
      function namedFunctionDeclaration(a: number, b: number) {
        return a + b
      }

      // Act
      const result = getFunctionSource(namedFunctionDeclaration)

      // Assert
      expect(result).toContain('(a, b) =>')
      expect(result).toContain('return a + b;')
    })

    it('converts anonymous function expression to arrow function', () => {
      // Arrange
      const anonymousFunctionExpression = function (a: number, b: number) {
        return a + b
      }

      // Act
      const result = getFunctionSource(anonymousFunctionExpression)

      // Assert
      expect(result).toContain('(a, b) =>')
      expect(result).toContain('return a + b;')
    })

    it('converts named function expression to arrow function', () => {
      // Arrange
      const namedFunctionExpression = function add(a: number, b: number) {
        return a + b
      }

      // Act
      const result = getFunctionSource(namedFunctionExpression)

      // Assert
      expect(result).toContain('(a, b) =>')
      expect(result).toContain('return a + b;')
      expect(result).not.toContain('function add')
    })
  })

  describe('arrow functions', () => {
    it('preserves single-line arrow functions', () => {
      // Arrange
      const singleLineArrow = (a: number, b: number) => a + b

      // Act
      const result = getFunctionSource(singleLineArrow)

      // Assert
      expect(result).toBe('(a, b) => a + b')
    })

    it('preserves multi-line arrow functions with curly braces', () => {
      // Arrange
      const multiLineArrow = (a: number, b: number) => {
        const sum = a + b
        return sum
      }

      // Act
      const result = getFunctionSource(multiLineArrow)

      // Assert
      expect(result).toContain('(a, b) => {')
      expect(result).toContain('const sum = a + b;')
      expect(result).toContain('return sum;')
    })
  })

  describe('async functions', () => {
    it('preserves async arrow functions', () => {
      // Arrange
      const asyncArrow = async (url: string) => {
        const data = await Promise.resolve(url)
        return data
      }

      // Act
      const result = getFunctionSource(asyncArrow)

      // Assert
      expect(result).toContain('async (url) =>')
      expect(result).toContain('await Promise.resolve(url)')
    })

    it('converts async function declarations to async arrow functions', () => {
      // Arrange
      async function asyncFunction(url: string) {
        const data = await Promise.resolve(url)
        return data
      }

      // Act
      const result = getFunctionSource(asyncFunction)

      // Assert
      expect(result).toContain('(url) =>')
      expect(result).toContain('await Promise.resolve(url)')
    })
  })

  describe('class methods', () => {
    it('converts instance methods to arrow functions', () => {
      // Arrange
      class TestClass {
        multiply(a: number, b: number) {
          return a * b
        }
      }
      const instance = new TestClass()

      // Act
      const result = getFunctionSource(instance.multiply)

      // Assert
      expect(result).toContain('(a, b) =>')
      expect(result).toContain('return a * b;')
    })

    it('converts static methods to arrow functions', () => {
      // Arrange
      class TestClass {
        static subtract(a: number, b: number) {
          return a - b
        }
      }

      // Act
      const result = getFunctionSource(TestClass.subtract)

      // Assert
      expect(result).toContain('(a, b) =>')
      expect(result).toContain('return a - b;')
    })

    it('converts async class methods to async arrow functions', () => {
      // Arrange
      class TestClass {
        async fetchData(url: string) {
          const data = await Promise.resolve(url)
          return data
        }
      }
      const instance = new TestClass()

      // Act
      const result = getFunctionSource(instance.fetchData)

      // Assert
      expect(result).toContain('async (url) =>')
      expect(result).toContain('await Promise.resolve(url)')
    })
  })

  describe('edge cases', () => {
    it('handles functions with no parameters', () => {
      // Arrange
      const noParams = () => 'result'

      // Act
      const result = getFunctionSource(noParams)

      // Assert
      expect(result).toBe('() => "result"')
    })

    it('handles functions with default parameters', () => {
      // Arrange
      const defaultParams = (a: number, b: number = 1) => a + b

      // Act
      const result = getFunctionSource(defaultParams)

      // Assert
      expect(result).toContain('(a, b = 1) =>')
    })

    it('handles functions with destructured parameters', () => {
      // Arrange
      const destructuredParams = ({ a, b }: { a: number; b: number }) => a + b

      // Act
      const result = getFunctionSource(destructuredParams)

      // Assert
      expect(result).toContain('({ a, b }) =>')
    })
  })

  describe('practical usage', () => {
    it('produces valid exportable arrow function source', () => {
      // Arrange
      const sourceFunction = (a: number, b: number) => a * b

      // Act
      const source = getFunctionSource(sourceFunction)
      const exportedSource = `const exportedFunc = ${source};`

      // Assert
      expect(() => {
        // This would throw if the source was invalid JavaScript
        new Function(exportedSource)
      }).not.toThrow()
    })
  })
})
