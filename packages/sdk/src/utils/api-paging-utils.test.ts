import { describe, it, expect, vi } from 'vitest'
import { createAsyncCollection } from './api-paging-utils'

const getMocks = <T>() => ({
  pageLister: vi.fn<Parameters<typeof createAsyncCollection<T>>[0]>(),
})

describe.concurrent('AsyncCollection', () => {
  describe.concurrent('iteration with for-await-of', () => {
    it('should handle iteration with a single page of items', async () => {
      // Arrange
      const mocks = getMocks<number>()
      mocks.pageLister.mockResolvedValueOnce({
        items: [1, 2, 3],
        meta: {},
      })
      const collection = createAsyncCollection(mocks.pageLister)

      // Act
      const results: number[] = []
      for await (const item of collection) {
        results.push(item)
      }

      // Assert
      expect(results).toStrictEqual([1, 2, 3])
      expect(mocks.pageLister).toHaveBeenCalledTimes(1)
      expect(mocks.pageLister).toHaveBeenCalledWith({ nextToken: undefined })
    })

    it('should handle iteration with multiple pages of items', async () => {
      // Arrange
      const mocks = getMocks<string>()
      mocks.pageLister
        .mockResolvedValueOnce({
          items: ['a', 'b'],
          meta: { nextToken: 'token1' },
        })
        .mockResolvedValueOnce({
          items: ['c', 'd'],
          meta: { nextToken: 'token2' },
        })
        .mockResolvedValueOnce({
          items: ['e'],
          meta: {},
        })
      const collection = createAsyncCollection(mocks.pageLister)

      // Act
      const results: string[] = []
      for await (const item of collection) {
        results.push(item)
      }

      // Assert
      expect(results).toStrictEqual(['a', 'b', 'c', 'd', 'e'])
      expect(mocks.pageLister).toHaveBeenCalledTimes(3)
      expect(mocks.pageLister).toHaveBeenNthCalledWith(1, { nextToken: undefined })
      expect(mocks.pageLister).toHaveBeenNthCalledWith(2, { nextToken: 'token1' })
      expect(mocks.pageLister).toHaveBeenNthCalledWith(3, { nextToken: 'token2' })
    })

    it('should handle iteration with zero items', async () => {
      // Arrange
      const mocks = getMocks<number>()
      mocks.pageLister.mockResolvedValueOnce({
        items: [],
        meta: {},
      })
      const collection = createAsyncCollection(mocks.pageLister)

      // Act
      const results: number[] = []
      for await (const item of collection) {
        results.push(item)
      }

      // Assert
      expect(results).toStrictEqual([])
      expect(mocks.pageLister).toHaveBeenCalledTimes(1)
    })
  })

  describe.concurrent('next()', () => {
    it('should return items one at a time', async () => {
      // Arrange
      const mocks = getMocks<number>()
      mocks.pageLister.mockResolvedValueOnce({
        items: [1, 2, 3],
        meta: {},
      })
      const collection = createAsyncCollection(mocks.pageLister)

      // Act
      const result1 = await collection.next()
      const result2 = await collection.next()
      const result3 = await collection.next()
      const result4 = await collection.next()

      // Assert
      expect(result1).toStrictEqual({ done: false, value: 1 })
      expect(result2).toStrictEqual({ done: false, value: 2 })
      expect(result3).toStrictEqual({ done: false, value: 3 })
      expect(result4).toStrictEqual({ done: true, value: undefined })
    })

    it('should fetch the next page when the buffer is exhausted', async () => {
      // Arrange
      const mocks = getMocks<string>()
      mocks.pageLister
        .mockResolvedValueOnce({
          items: ['a', 'b'],
          meta: { nextToken: 'token1' },
        })
        .mockResolvedValueOnce({
          items: ['c'],
          meta: {},
        })
      const collection = createAsyncCollection(mocks.pageLister)

      // Act
      await collection.next()
      await collection.next()

      // Assert
      expect(mocks.pageLister).toHaveBeenCalledTimes(1)
      expect(mocks.pageLister).toHaveBeenCalledWith({ nextToken: undefined })

      // Act
      await collection.next()

      // Assert
      expect(mocks.pageLister).toHaveBeenCalledTimes(2)
      expect(mocks.pageLister).toHaveBeenNthCalledWith(2, { nextToken: 'token1' })
    })
  })

  describe.concurrent('take()', () => {
    it('should take the specified number of items', async () => {
      // Arrange
      const mocks = getMocks<number>()
      mocks.pageLister.mockResolvedValueOnce({
        items: [1, 2, 3, 4, 5],
        meta: {},
      })
      const collection = createAsyncCollection(mocks.pageLister)

      // Act
      const results = await collection.take(3)

      // Assert
      expect(results).toStrictEqual([1, 2, 3])
      expect(mocks.pageLister).toHaveBeenCalledTimes(1)
    })

    it('should maintain the cursor across multiple take() calls', async () => {
      // Arrange
      const mocks = getMocks<number>()
      mocks.pageLister
        .mockResolvedValueOnce({
          items: [1, 2, 3],
          meta: { nextToken: 'token1' },
        })
        .mockResolvedValueOnce({
          items: [4, 5, 6],
          meta: {},
        })
      const collection = createAsyncCollection(mocks.pageLister)

      // Act
      const first = await collection.take(2)
      const second = await collection.take(2)
      const third = await collection.take(2)
      const fourth = await collection.take(2)

      // Assert
      expect(first).toStrictEqual([1, 2])
      expect(second).toStrictEqual([3, 4])
      expect(third).toStrictEqual([5, 6])
      expect(fourth).toStrictEqual([])
    })
  })

  describe.concurrent('takeAll()', () => {
    it('should take all items from single page', async () => {
      // Arrange
      const mocks = getMocks<number>()
      mocks.pageLister.mockResolvedValueOnce({
        items: [1, 2, 3],
        meta: {},
      })
      const collection = createAsyncCollection(mocks.pageLister)

      // Act
      const results = await collection.takeAll()

      // Assert
      expect(results).toStrictEqual([1, 2, 3])
    })
  })

  describe.concurrent('mixed operations', () => {
    it('should allow mixing operations', async () => {
      // Arrange
      const mocks = getMocks<number>()
      mocks.pageLister
        .mockResolvedValueOnce({
          items: [1, 2, 3, 4, 5],
          meta: { nextToken: 'token1' },
        })
        .mockResolvedValueOnce({
          items: [6, 7, 8, 9, 10],
          meta: {},
        })
      const collection = createAsyncCollection(mocks.pageLister)

      // Act
      const result1 = await collection.next()
      const result2 = await collection.next()
      const result3 = await collection.take(2)

      // Assert
      expect(result1).toStrictEqual({ done: false, value: 1 })
      expect(result2).toStrictEqual({ done: false, value: 2 })
      expect(result3).toStrictEqual([3, 4])

      // Act
      const result4 = await collection.next()

      let count = 0
      const items: number[] = []
      for await (const item of collection) {
        items.push(item)
        count++
        if (count >= 3) {
          break
        }
      }

      // Assert
      expect(result4).toStrictEqual({ done: false, value: 5 })
      expect(items).toStrictEqual([6, 7, 8])

      // Act
      const result5 = await collection.takeAll()

      // Assert
      expect(result5).toStrictEqual([9, 10])
    })
  })
})
