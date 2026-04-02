import { describe, it, expect } from 'vitest'
import { findBatchEndCursor } from './queue-batching'
import { MAX_BATCH_SIZE_BYTES as maxBatchSize } from '../consts'

describe.concurrent('findBatchEndCursor', () => {
  it.each([
    { startCursor: 0, files: [{ sizeInBytes: 100 }, { sizeInBytes: 200 }], expectedEndCursors: [2] },
    { startCursor: 0, files: [{ sizeInBytes: maxBatchSize }, { sizeInBytes: 200 }], expectedEndCursors: [1, 2] },
    { startCursor: 0, files: [{ sizeInBytes: maxBatchSize + 100 }, { sizeInBytes: 200 }], expectedEndCursors: [1, 2] },
    {
      startCursor: 0,
      files: [{ sizeInBytes: 200 }, { sizeInBytes: 200 }, { sizeInBytes: maxBatchSize }, { sizeInBytes: 200 }],
      expectedEndCursors: [2, 3, 4],
    },
    {
      startCursor: 0,
      files: [{ sizeInBytes: 200 }, { sizeInBytes: 200 }, { sizeInBytes: maxBatchSize + 100 }, { sizeInBytes: 200 }],
      expectedEndCursors: [2, 3, 4],
    },
    {
      startCursor: 0,
      files: [{ sizeInBytes: 200 }, { sizeInBytes: 200 }, { sizeInBytes: maxBatchSize - 200 }, { sizeInBytes: 200 }],
      expectedEndCursors: [2, 4],
    },
    {
      startCursor: 2,
      files: [
        { sizeInBytes: 200 },
        { sizeInBytes: 200 },
        { sizeInBytes: 200 },
        { sizeInBytes: 200 },
        { sizeInBytes: maxBatchSize - 200 },
        { sizeInBytes: 200 },
      ],
      expectedEndCursors: [4, 6],
    },
    {
      startCursor: 0,
      files: [{ sizeInBytes: 200 }, { sizeInBytes: 200 }, { sizeInBytes: maxBatchSize + 100 }],
      expectedEndCursors: [2, 3],
    },
  ])(
    'should correctly calculate the end cursors for a batch of files',
    ({ startCursor, files, expectedEndCursors }) => {
      // Act
      const endCursors: number[] = []
      let currentCursor = startCursor

      while (currentCursor < files.length) {
        currentCursor = findBatchEndCursor({ startCursor: currentCursor, files }).endCursor
        endCursors.push(currentCursor)
      }

      // Assert
      expect(endCursors).toStrictEqual(expectedEndCursors)
    }
  )
})
