import { describe, it, expect } from 'vitest'
import { collectableGenerator } from './collectable-generator'

describe.concurrent('collectableGenerator', () => {
  it('should make an async generator collectable', async () => {
    // Arrange
    async function* generateNumbers(): AsyncGenerator<number> {
      for (let i = 1; i <= 5; i++) {
        yield i
      }
    }
    const enhancedGenerator = collectableGenerator(generateNumbers)
    const generator = enhancedGenerator()

    // Act
    const result = await generator.collect()

    // Assert
    expect(result).toStrictEqual([1, 2, 3, 4, 5])
  })

  it.each([0, 3, 10, 12])('should respect collection limits (%i)', async (limit) => {
    // Arrange
    async function* generateNumbers(): AsyncGenerator<number> {
      for (let i = 1; i <= 10; i++) {
        yield i
      }
    }
    const enhancedGenerator = collectableGenerator(generateNumbers)
    const generator = enhancedGenerator()

    // Act
    const result = await generator.collect(limit)

    // Assert
    expect(result).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].slice(0, limit))
  })

  it('should preserve original generator functionality', async () => {
    // Arrange
    async function* generateNumbers(): AsyncGenerator<number> {
      for (let i = 1; i <= 3; i++) {
        yield i
      }
      return 'done'
    }
    const enhancedGenerator = collectableGenerator(generateNumbers)
    const generator = enhancedGenerator()

    // Act & Assert (iterative generation)
    expect((await generator.next()).value).toBe(1)
    expect((await generator.next()).value).toBe(2)
    expect((await generator.next()).value).toBe(3)
    expect((await generator.next()).done).toBe(true)
    expect((await generator.next()).value).toBe(undefined)
  })

  it('should pass arguments to the original generator', async () => {
    // Arrange
    async function* generateWithArgs(start: number, count: number): AsyncGenerator<number> {
      for (let i = 0; i < count; i++) {
        yield start + i
      }
    }
    const enhancedGenerator = collectableGenerator(generateWithArgs)

    // Act
    const generator = enhancedGenerator(10, 3)
    const result = await generator.collect()

    // Assert
    expect(result).toEqual([10, 11, 12])
  })

  it('should maintain context when calling the generator', async () => {
    // Arrange
    class NumberGenerator {
      constructor(private _offset: number) {}

      async *generate(count: number): AsyncGenerator<number> {
        for (let i = 0; i < count; i++) {
          yield i + this._offset
        }
      }
    }
    const instance = new NumberGenerator(100)
    const enhancedGenerator = collectableGenerator(instance.generate.bind(instance))

    // Act
    const generator = enhancedGenerator(3)
    const result = await generator.collect()

    // Assert
    expect(result).toEqual([100, 101, 102])
  })

  it('should be able to proxy class generators', async () => {
    // Arrange
    class MyClass {
      private _field = 1 // to ensure we don't lose access to the class context

      public generateNumbers = collectableGenerator(this._generateNumbers)

      private async *_generateNumbers(): AsyncGenerator<number> {
        if (!this._field) {
          throw new Error('Unable to access class context')
        }

        yield 1
        yield 2
        yield 3
      }
    }
    const instance = new MyClass()
    const generator = instance.generateNumbers()

    // Act
    const result = await generator.collect()

    // Assert
    expect(result).toEqual([1, 2, 3])
  })

  it('should handle errors in the generator', async () => {
    // Arrange
    async function* errorGenerator(): AsyncGenerator<number> {
      yield 1
      throw new Error('Generator error')
    }
    const enhancedGenerator = collectableGenerator(errorGenerator)
    const generator = enhancedGenerator()

    // Act & Assert
    await expect(generator.collect()).rejects.toThrow('Generator error')
  })
})
