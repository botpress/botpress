import type * as sdk from '@botpress/sdk'
import type * as models from '../../definitions/models'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { enumerateAllFilesRecursive, type EnumerationState } from './directory-traversal-with-batching'

const _getMocks = () => ({
  logger: {
    debug: vi.fn(),
  } as unknown as sdk.BotLogger,
  integration: {
    listItemsInFolder: vi.fn().mockResolvedValue({ items: [], meta: {} }),
  },
  globMatcher: {
    matchItem: vi.fn().mockReturnValue({ shouldBeIgnored: false, shouldApplyOptions: {} }),
  },
  configuration: {
    includeFiles: [{ pathGlobPattern: '**' }],
    excludeFiles: [],
  },
  pushFilesToQueue: vi.fn(),
})

describe.concurrent('enumerateAllFilesRecursive', () => {
  describe('Basic enumeration', () => {
    it('should enumerate an empty root folder', async () => {
      // Arrange
      const mocks = _getMocks()

      // Act
      const enumerationState = await enumerateAllFilesRecursive(mocks)

      // Assert
      expect(mocks.integration.listItemsInFolder).toHaveBeenCalledTimes(1)
      expect(mocks.integration.listItemsInFolder).toHaveBeenNthCalledWith(1, {
        folderId: undefined,
        nextToken: undefined,
      })
      expect(mocks.pushFilesToQueue).toHaveBeenCalledTimes(1)
      expect(mocks.pushFilesToQueue).toHaveBeenNthCalledWith(1, [])
      expect(enumerationState).toBeUndefined()
    })

    it('should enumerate a single file in root folder', async () => {
      // Arrange
      const mocks = _getMocks()
      const testFile: models.FolderItem = {
        id: 'file1',
        type: 'file',
        name: 'test.txt',
      }

      mocks.integration.listItemsInFolder.mockResolvedValueOnce({
        items: [testFile],
        meta: { nextToken: undefined },
      })

      // Act
      const enumerationState = await enumerateAllFilesRecursive(mocks)

      // Assert
      expect(mocks.integration.listItemsInFolder).toHaveBeenCalledTimes(1)
      expect(mocks.pushFilesToQueue).toHaveBeenNthCalledWith(1, [
        expect.objectContaining({
          ...testFile,
          absolutePath: '/test.txt',
        }),
      ])
      expect(enumerationState).toBeUndefined()
    })
  })

  describe('Recursive folder traversal', () => {
    it('should recursively enumerate files in nested folders', async () => {
      // Arrange
      const mocks = _getMocks()

      // Root folder items:
      mocks.integration.listItemsInFolder.mockResolvedValueOnce({
        items: [
          { id: 'folder1', type: 'folder', name: 'folder1' },
          { id: 'file1', type: 'file', name: 'root-file.txt' },
        ],
        meta: { nextToken: undefined },
      })

      // folder1 items:
      mocks.integration.listItemsInFolder.mockResolvedValueOnce({
        items: [{ id: 'file2', type: 'file', name: 'nested-file.txt' }],
        meta: { nextToken: undefined },
      })

      // Act
      const enumerationState = await enumerateAllFilesRecursive(mocks)

      // Assert
      expect(mocks.integration.listItemsInFolder).toHaveBeenCalledTimes(2)
      expect(mocks.pushFilesToQueue).toHaveBeenCalledTimes(1)
      expect(mocks.pushFilesToQueue).toHaveBeenNthCalledWith(1, [
        expect.objectContaining({
          absolutePath: '/root-file.txt',
        }),
        expect.objectContaining({
          absolutePath: '/folder1/nested-file.txt',
        }),
      ])
      expect(enumerationState).toBeUndefined()
    })

    it('should handle deeply nested folder structures', async () => {
      // Arrange
      const mocks = _getMocks()
      const folderDepth = 100

      // Create a chain of nested folders
      for (let i = 1; i <= folderDepth; i++) {
        mocks.integration.listItemsInFolder.mockResolvedValueOnce(
          i === folderDepth
            ? {
                items: [{ id: 'deepFile', type: 'file', name: 'deepFile.txt' }],
                meta: { nextToken: undefined },
              }
            : {
                items: [{ id: `folder${i}`, type: 'folder', name: `folder${i}` }],
                meta: { nextToken: undefined },
              }
        )
      }

      // Act
      const enumerationState = await enumerateAllFilesRecursive(mocks)

      // Assert
      expect(mocks.integration.listItemsInFolder).toHaveBeenCalledTimes(folderDepth)
      expect(mocks.pushFilesToQueue).toHaveBeenCalledTimes(1)
      expect(mocks.pushFilesToQueue).toHaveBeenNthCalledWith(1, [
        expect.objectContaining({
          absolutePath: `/${Array.from({ length: folderDepth - 1 }, (_, i) => `folder${i + 1}`).join('/')}/deepFile.txt`,
        }),
      ])
      expect(enumerationState).toBeUndefined()
    })
  })

  describe('Pagination handling', () => {
    it('should support pagination within a folder', async () => {
      // Arrange
      const mocks = _getMocks()

      // First page of root folder
      mocks.integration.listItemsInFolder.mockResolvedValueOnce({
        items: [{ id: 'file1', type: 'file', name: 'file1.txt' }],
        meta: { nextToken: 'page2' },
      })

      // Second page of root folder
      mocks.integration.listItemsInFolder.mockResolvedValueOnce({
        items: [{ id: 'file2', type: 'file', name: 'file2.txt' }],
        meta: { nextToken: undefined },
      })

      // Act
      const enumerationState = await enumerateAllFilesRecursive(mocks)

      // Assert
      expect(mocks.integration.listItemsInFolder).toHaveBeenCalledTimes(2)
      expect(mocks.pushFilesToQueue).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'file1',
        }),
        expect.objectContaining({
          id: 'file2',
        }),
      ])
      expect(enumerationState).toBeUndefined()
    })

    it('should resume using an enumeration state', async () => {
      // Arrange
      const mocks = _getMocks()

      const previousEnumerationState: EnumerationState = {
        pendingFolders: [{ absolutePath: '/folder1/', folderId: 'folder1' }],
      }

      mocks.integration.listItemsInFolder.mockResolvedValueOnce({
        items: [{ id: 'file3', type: 'file', name: 'file3.txt' }],
        meta: { nextToken: undefined },
      })

      // Act
      const newEnumerationState = await enumerateAllFilesRecursive({
        ...mocks,
        currentEnumerationState: previousEnumerationState,
      })

      // Assert
      expect(mocks.integration.listItemsInFolder).toHaveBeenCalledTimes(1)
      expect(mocks.integration.listItemsInFolder).toHaveBeenCalledWith({
        folderId: 'folder1',
        nextToken: undefined,
      })
      expect(mocks.pushFilesToQueue).toHaveBeenCalledTimes(1)
      expect(mocks.pushFilesToQueue).toHaveBeenNthCalledWith(1, [
        expect.objectContaining({
          absolutePath: '/folder1/file3.txt',
        }),
      ])
      expect(newEnumerationState).toBeUndefined()
    })
  })

  describe('Glob file filtering', () => {
    it('should properly apply file filtering', async () => {
      // Arrange
      const mocks = _getMocks()

      mocks.integration.listItemsInFolder.mockResolvedValueOnce({
        items: [
          { id: 'file1', type: 'file', name: 'included.txt' },
          { id: 'file2', type: 'file', name: 'excluded.txt' },
        ],
        meta: { nextToken: undefined },
      })

      // First file is included, second is excluded
      mocks.globMatcher.matchItem
        .mockReturnValueOnce({
          shouldBeIgnored: false,
          shouldApplyOptions: { addToKbId: 'kb1' },
        })
        .mockReturnValueOnce({
          shouldBeIgnored: true,
          reason: 'matches-exclude-pattern',
        })

      // Act
      void (await enumerateAllFilesRecursive(mocks))

      // Assert
      expect(mocks.pushFilesToQueue).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'file1',
        }),
      ])
      expect(mocks.logger.debug).toHaveBeenCalledWith('Ignoring item', expect.any(Object))
    })
  })
})

describe.sequential('enumerateAllFilesRecursive duration handling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should respect maximum execution time and return state', async () => {
    // Arrange
    const mocks = _getMocks()
    const maximumExecutionTimeMs = 5_000 // 5 seconds

    mocks.integration.listItemsInFolder.mockResolvedValueOnce({
      items: [
        { id: 'file1', type: 'file', name: 'file1.txt' },
        { id: 'file2', type: 'file', name: 'file2.txt' },
        { id: 'file3', type: 'file', name: 'file3.txt' },
      ],
      meta: { nextToken: undefined },
    })

    const resultPromise = enumerateAllFilesRecursive({
      ...mocks,
      maximumExecutionTimeMs,
    })

    // Advance time after the first file is processed:
    vi.advanceTimersByTime(maximumExecutionTimeMs + 100)

    const enumerationState = await resultPromise

    // Assert
    expect(mocks.integration.listItemsInFolder).toHaveBeenCalledTimes(1)
    expect(mocks.pushFilesToQueue).toHaveBeenCalledTimes(1)
    expect(mocks.pushFilesToQueue).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({
        id: 'file1',
      }),
    ]) // Only the first file should be processed
    expect(enumerationState).toBeDefined()
    expect(enumerationState).toStrictEqual({
      pendingFolders: [{ absolutePath: '/' }],
      currentFolderNextToken: undefined,
    })
  })
})
