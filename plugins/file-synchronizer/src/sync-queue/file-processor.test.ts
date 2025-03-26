import * as sdk from '@botpress/sdk'
import { describe, it, expect, vi, type Mocked, type Mock } from 'vitest'
import { processQueueFile, type ProcessFileProps } from './file-processor'
import type * as types from '../types'
import { MAX_FILE_SIZE_BYTES } from '../consts'

const FILE_1 = {
  id: 'file1',
  type: 'file',
  name: 'file1.txt',
  absolutePath: '/path/to/file1.txt',
  sizeInBytes: 100,
  lastModifiedDate: '2025-01-01T00:00:00Z',
  contentHash: 'hash1',
  status: 'pending',
  parentId: 'abcde',
} as const satisfies types.SyncQueueItem

const FILE_2 = {
  id: 'file2',
  type: 'file',
  name: 'file2.txt',
  absolutePath: '/path/to/file2.txt',
  sizeInBytes: 200,
  lastModifiedDate: '2025-01-02T00:00:00Z',
  contentHash: 'hash2',
  status: 'pending',
  parentId: 'abcde',
} as const satisfies types.SyncQueueItem

const EXISTING_FILE = 'dummy-id'
const FUTURE_DATE = '9999-01-01T00:00:00Z'
const PAST_DATE = '0000-01-01T00:00:00Z'
const DIFFERENT_HASH = 'different-hash'

describe.concurrent('processQueue', () => {
  const getMocks = () => ({
    fileRepository: {
      listFiles: vi.fn(),
      deleteFile: vi.fn(),
      updateFileMetadata: vi.fn(),
    } as const satisfies Mocked<ProcessFileProps['fileRepository']>,
    integration: {
      name: 'test-integration',
      transferFileToBotpress: vi.fn(),
    } as const satisfies Mocked<ProcessFileProps['integration']>,
    logger: new sdk.BotLogger(),
  })

  it('should skip files that are already synced with identical content hash', async () => {
    // Arrange
    const mocks = getMocks()
    mocks.fileRepository.listFiles.mockResolvedValueOnce({
      files: [
        {
          id: EXISTING_FILE,
          tags: {
            externalContentHash: FILE_1.contentHash,
          },
        },
      ],
    })
    mocks.fileRepository.listFiles.mockResolvedValueOnce({ files: [] })
    mocks.integration.transferFileToBotpress.mockResolvedValueOnce({ botpressFileId: FILE_2.id })

    // Act
    const result = await processQueueFile({
      fileToSync: FILE_1,
      ...mocks,
    })

    // Assert
    expect(result).toMatchObject({ status: 'already-synced' })
    expect(mocks.integration.transferFileToBotpress).not.toHaveBeenCalled()
    expect(mocks.fileRepository.deleteFile).not.toHaveBeenCalled()
  })

  it('should upload file when more recent and content hash is different', async () => {
    // Arrange
    const mocks = getMocks()
    mocks.fileRepository.listFiles.mockResolvedValueOnce({
      files: [
        {
          id: EXISTING_FILE,
          tags: {
            externalId: FILE_1.id,
            externalContentHash: DIFFERENT_HASH,
            externalModifiedDate: PAST_DATE,
          },
        },
      ],
    })
    mocks.fileRepository.listFiles.mockResolvedValueOnce({ files: [] })
    mocks.integration.transferFileToBotpress.mockResolvedValueOnce({ botpressFileId: FILE_1.id })

    // Act
    const result = await processQueueFile({
      fileToSync: FILE_1,
      ...mocks,
    })

    // Assert
    expect(result).toMatchObject({ status: 'newly-synced' })
    expect(mocks.fileRepository.deleteFile).toHaveBeenCalledWith({ id: EXISTING_FILE })
    expect(mocks.integration.transferFileToBotpress).toHaveBeenCalledTimes(1)
  })

  it('should not upload file when existing file is same age', async () => {
    // Arrange
    const mocks = getMocks()
    mocks.fileRepository.listFiles.mockResolvedValueOnce({
      files: [
        {
          id: EXISTING_FILE,
          tags: {
            externalId: FILE_1.id,
            externalContentHash: DIFFERENT_HASH,
            externalModifiedDate: FILE_1.lastModifiedDate,
          },
        },
      ],
    })

    // Act
    const result = await processQueueFile({
      fileToSync: FILE_1,
      ...mocks,
    })

    // Assert
    expect(result).toMatchObject({ status: 'already-synced' })
    expect(mocks.fileRepository.deleteFile).not.toHaveBeenCalled()
    expect(mocks.integration.transferFileToBotpress).not.toHaveBeenCalled()
  })

  it('should not upload file when existing file is more recent', async () => {
    // Arrange
    const mocks = getMocks()
    mocks.fileRepository.listFiles.mockResolvedValueOnce({
      files: [
        {
          id: EXISTING_FILE,
          tags: {
            externalId: FILE_1.id,
            externalContentHash: DIFFERENT_HASH,
            externalModifiedDate: FUTURE_DATE,
          },
        },
      ],
    })

    // Act
    const result = await processQueueFile({
      fileToSync: FILE_1,
      ...mocks,
    })

    // Assert
    expect(result).toMatchObject({ status: 'already-synced' })
    expect(mocks.fileRepository.deleteFile).not.toHaveBeenCalled()
    expect(mocks.integration.transferFileToBotpress).not.toHaveBeenCalled()
  })

  it('should upload file when different hash and missing last modified date', async () => {
    // Arrange
    const mocks = getMocks()
    mocks.fileRepository.listFiles.mockResolvedValueOnce({
      files: [
        {
          id: EXISTING_FILE,
          tags: {
            externalId: FILE_1.id,
            externalContentHash: DIFFERENT_HASH,
            externalModifiedDate: PAST_DATE,
          },
        },
      ],
    })
    mocks.integration.transferFileToBotpress.mockResolvedValueOnce({ botpressFileId: FILE_1.id })

    // Act
    const result = await processQueueFile({
      fileToSync: FILE_1,
      ...mocks,
    })

    // Assert
    expect(result).toMatchObject({ status: 'newly-synced' })
    expect(mocks.fileRepository.deleteFile).toHaveBeenCalledWith({ id: EXISTING_FILE })
    expect(mocks.integration.transferFileToBotpress).toHaveBeenCalledTimes(1)
  })

  it('should handle errors by modifying the queue item', async () => {
    // Arrange
    const mocks = getMocks()
    mocks.fileRepository.listFiles.mockResolvedValueOnce({ files: [] })

    // First transfer fails, second succeeds:
    mocks.integration.transferFileToBotpress.mockRejectedValueOnce(new Error('Transfer failed'))

    // Act
    const result = await processQueueFile({
      fileToSync: FILE_1,
      ...mocks,
    })

    // Assert
    expect(result).toMatchObject({ status: 'errored', errorMessage: 'Transfer failed' })
    expect(mocks.integration.transferFileToBotpress).toHaveBeenCalledTimes(1)
    expect(mocks.fileRepository.updateFileMetadata).not.toHaveBeenCalled()
  })

  it('should properly set metadata tags after transferring file', async () => {
    // Arrange
    const mocks = getMocks()
    mocks.fileRepository.listFiles.mockResolvedValueOnce({ files: [] })
    mocks.integration.transferFileToBotpress.mockResolvedValueOnce({ botpressFileId: FILE_1.id })

    // Act
    await processQueueFile({
      fileToSync: FILE_1,
      ...mocks,
    })

    // Assert
    expect(mocks.fileRepository.updateFileMetadata).toHaveBeenCalledWith({
      id: FILE_1.id,
      tags: {
        integrationName: 'test-integration',
        externalId: FILE_1.id,
        externalModifiedDate: FILE_1.lastModifiedDate,
        externalSize: FILE_1.sizeInBytes.toString(),
        externalContentHash: FILE_1.contentHash,
        externalPath: FILE_1.absolutePath,
        externalParentId: FILE_1.parentId,
      },
    })
  })
})
