import { describe, it, expect } from 'vitest'
import { shouldItemBeIgnored } from './glob-matcher'
import type * as models from '../../definitions/models'
import { MAX_FILE_SIZE_BYTES } from '../consts'
import type * as bp from '.botpress'

describe.concurrent('shouldItemBeIgnored', () => {
  const createConfiguration = (
    includeFiles: bp.configuration.Configuration['includeFiles'] = [],
    excludeFiles: bp.configuration.Configuration['excludeFiles'] = []
  ) =>
    ({
      includeFiles,
      excludeFiles,
    }) as const

  describe.concurrent('with file items', () => {
    const createFileItem = (overrides: Readonly<Partial<models.File>> = {}) =>
      ({
        id: 'file-1',
        type: 'file',
        name: 'test-file.txt',
        sizeInBytes: 1000,
        lastModifiedDate: '1965-01-01T00:00:00Z',
        ...overrides,
      }) as const satisfies models.File

    it('should exclude when path matches explicit exclude pattern', () => {
      // Arrange
      const itemPath = 'src/data/excluded-file.txt'
      const configuration = createConfiguration([], [{ pathGlobPattern: '**/excluded-*.txt' }])
      const item = createFileItem({ name: 'excluded-file.txt' })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(true)
    })

    it('should include when path matches include pattern with no restrictions', () => {
      // Arrange
      const itemPath = 'src/data/included-file.txt'
      const configuration = createConfiguration([{ pathGlobPattern: '**/included-*.txt' }], [])
      const item = createFileItem({ name: 'included-file.txt' })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(false)
    })

    it('should exclude when path does not match any patterns', () => {
      // Arrange
      const itemPath = 'src/data/unknown-file.txt'
      const configuration = createConfiguration(
        [{ pathGlobPattern: '**/included-*.txt' }],
        [{ pathGlobPattern: '**/excluded-*.txt' }]
      )
      const item = createFileItem({ name: 'unknown-file.txt' })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(true)
    })

    it('should exclude when file size exceeds maxSizeInBytes', () => {
      // Arrange
      const itemPath = 'src/data/large-file.txt'
      const maxSizeInBytes = 1000
      const configuration = createConfiguration([{ pathGlobPattern: '**/large-*.txt', maxSizeInBytes }], [])
      const item = createFileItem({
        name: 'large-file.txt',
        sizeInBytes: maxSizeInBytes + 1,
      })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(true)
    })

    it('should exclude when file size exceeds MAX_FILE_SIZE_BYTES', () => {
      // Arrange
      const itemPath = 'src/data/large-file.txt'
      const configuration = createConfiguration([{ pathGlobPattern: '**/large-*.txt' }], [])
      const item = createFileItem({
        name: 'large-file.txt',
        sizeInBytes: MAX_FILE_SIZE_BYTES + 1,
      })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(true)
    })

    it('should exclude when modified before modifiedAfter date', () => {
      // Arrange
      const itemPath = 'src/data/old-file.txt'
      const modifiedAfter = '1965-02-01T00:00:00Z'
      const configuration = createConfiguration([{ pathGlobPattern: '**/old-*.txt', modifiedAfter }], [])
      const item = createFileItem({
        name: 'old-file.txt',
        lastModifiedDate: '1965-01-01T00:00:00Z',
      })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(true)
    })

    it('should include when modified after modifiedAfter date', () => {
      // Arrange
      const itemPath = 'src/data/new-file.txt'
      const modifiedAfter = '1965-01-01T00:00:00Z'
      const configuration = createConfiguration([{ pathGlobPattern: '**/new-*.txt', modifiedAfter }], [])
      const item = createFileItem({
        name: 'new-file.txt',
        lastModifiedDate: '1965-02-01T00:00:00Z',
      })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(false)
    })

    it('should include when file meets all requirements', () => {
      // Arrange
      const itemPath = 'src/data/valid-file.txt'
      const maxSizeInBytes = 2000
      const modifiedAfter = '1965-01-01T00:00:00Z'
      const configuration = createConfiguration(
        [
          {
            pathGlobPattern: '**/valid-*.txt',
            maxSizeInBytes,
            modifiedAfter,
          },
        ],
        []
      )
      const item = createFileItem({
        name: 'valid-file.txt',
        sizeInBytes: maxSizeInBytes - 100,
        lastModifiedDate: '1965-02-01T00:00:00Z',
      })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(false)
    })

    it('should handle missing optional properties', () => {
      // Arrange
      const itemPath = 'src/data/included-file.txt'
      const configuration = createConfiguration(
        [
          {
            pathGlobPattern: '**/included-*.txt',
            maxSizeInBytes: 1000,
            modifiedAfter: '1965-01-01T00:00:00Z',
          },
        ],
        []
      )
      const item = createFileItem({
        name: 'included-file.txt',
        sizeInBytes: undefined,
        lastModifiedDate: undefined,
      })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(false)
    })

    it('should handle multiple include patterns', () => {
      // Arrange
      const itemPath = 'src/data/included-file.txt'
      const configuration = createConfiguration(
        [{ pathGlobPattern: '**/not-matching-*.txt' }, { pathGlobPattern: '**/included-*.txt' }],
        []
      )
      const item = createFileItem({ name: 'included-file.txt' })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(false)
    })

    it('should handle multiple include patterns with different restrictions', () => {
      // Arrange
      const itemPath = 'src/data/included-file.txt'
      const configuration = createConfiguration(
        [
          { pathGlobPattern: '**/included-*.txt', maxSizeInBytes: 1 },
          { pathGlobPattern: '**/included-*.txt', maxSizeInBytes: 100 },
        ],
        []
      )
      const item = createFileItem({ name: 'included-file.txt', sizeInBytes: 100 })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(false)
    })

    it('should prioritize excludeFiles over includeFiles', () => {
      // Arrange
      const itemPath = 'src/data/both-match.txt'
      const configuration = createConfiguration(
        [{ pathGlobPattern: '**/both-*.txt' }],
        [{ pathGlobPattern: '**/both-*.txt' }]
      )
      const item = createFileItem({ name: 'both-match.txt' })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(true)
    })

    it('should exclude by default when there are no defined include patterns', () => {
      // Arrange
      const itemPath = 'src/data/any-file.txt'
      const configuration = createConfiguration([], [])
      const item = createFileItem({ name: 'any-file.txt' })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(true)
    })
  })

  describe.concurrent('with folder items', () => {
    const createFolderItem = (overrides: Readonly<Partial<models.Folder>> = {}) =>
      ({
        id: 'folder-1',
        type: 'folder',
        name: 'test-folder',
        ...overrides,
      }) as const satisfies models.Folder

    it('should exclude when path matches explicit exclude pattern', () => {
      // Arrange
      const itemPath = 'src/data/__ignored'
      const configuration = createConfiguration([], [{ pathGlobPattern: '**/__ignored' }])
      const item = createFolderItem({ name: '__ignored' })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(true)
    })

    it('should include when path matches include pattern', () => {
      // Arrange
      const itemPath = 'src/data'
      const configuration = createConfiguration([{ pathGlobPattern: '**/data' }], [])
      const item = createFolderItem({ name: 'data' })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(false)
    })

    it('should exclude when path does not match any patterns', () => {
      // Arrange
      const itemPath = 'src/data/unknown-folder'
      const configuration = createConfiguration(
        [{ pathGlobPattern: '**/included-*' }],
        [{ pathGlobPattern: '**/excluded-*' }]
      )
      const item = createFolderItem({ name: 'unknown-folder' })

      // Act
      const result = shouldItemBeIgnored({ configuration, item, itemPath })

      // Assert
      expect(result).toBe(true)
    })
  })
})
