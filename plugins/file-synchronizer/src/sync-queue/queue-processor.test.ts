import * as sdk from '@botpress/sdk'
import { describe, it, expect, vi, type Mocked, type Mock } from 'vitest'
import { processQueue, type ProcessQueueProps } from './queue-processor'
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

const LARGE_FILE = {
  id: 'largefile',
  type: 'file',
  name: 'largefile.txt',
  absolutePath: '/path/to/largefile.txt',
  sizeInBytes: MAX_FILE_SIZE_BYTES - 200,
  status: 'pending',
  parentId: 'abcde',
} as const satisfies types.SyncQueueItem

describe.concurrent('processQueue', () => {
  const getMocks = () => ({
    fileRepository: {
      listFiles: vi.fn(),
      deleteFile: vi.fn(),
      updateFileMetadata: vi.fn(),
    } as const satisfies Mocked<ProcessQueueProps['fileRepository']>,
    integration: {
      name: 'test-integration',
      transferFileToBotpress: vi.fn(),
    } as const satisfies Mocked<ProcessQueueProps['integration']>,
    updateSyncQueue: vi.fn() as Mock<ProcessQueueProps['updateSyncQueue']>,
    logger: new sdk.BotLogger(),
  })

  it('should process all files in queue when size is within batch limit', async () => {
    // Arrange
    const mocks = getMocks()
    mocks.fileRepository.listFiles.mockResolvedValueOnce({ files: [] })
    mocks.fileRepository.listFiles.mockResolvedValueOnce({ files: [] })
    mocks.integration.transferFileToBotpress.mockResolvedValueOnce({ botpressFileId: FILE_1.id })
    mocks.integration.transferFileToBotpress.mockResolvedValueOnce({ botpressFileId: FILE_2.id })

    // Act
    const result = await processQueue({
      syncQueue: [FILE_1, FILE_2],
      ...mocks,
    })

    // Assert
    expect(result).toEqual({ finished: 'all' })
    expect(mocks.integration.transferFileToBotpress).toHaveBeenCalledTimes(2)
    expect(mocks.fileRepository.updateFileMetadata).toHaveBeenCalledTimes(2)
    expect(mocks.updateSyncQueue).toHaveBeenCalledTimes(1)

    const updatedQueue = mocks.updateSyncQueue.mock.calls[0]?.[0].syncQueue
    expect(updatedQueue?.[0]?.status).toBe('newly-synced')
    expect(updatedQueue?.[1]?.status).toBe('newly-synced')
  })

  it('should process files in batches when size exceeds batch limit', async () => {
    // Arrange
    const mocks = getMocks()
    mocks.fileRepository.listFiles.mockResolvedValueOnce({ files: [] })
    mocks.fileRepository.listFiles.mockResolvedValueOnce({ files: [] })
    mocks.integration.transferFileToBotpress.mockResolvedValueOnce({ botpressFileId: FILE_1.id })
    mocks.integration.transferFileToBotpress.mockResolvedValueOnce({ botpressFileId: LARGE_FILE.id })

    // Act
    const result = await processQueue({
      syncQueue: [FILE_1, LARGE_FILE, FILE_2],
      ...mocks,
    })

    // Assert
    expect(result).toEqual({ finished: 'batch' })
    expect(mocks.integration.transferFileToBotpress).toHaveBeenCalledTimes(2)
    expect(mocks.updateSyncQueue).toHaveBeenCalledTimes(1)

    const updatedQueue = mocks.updateSyncQueue.mock.calls[0]?.[0].syncQueue
    expect(updatedQueue?.[0]?.status).toBe('newly-synced')
    expect(updatedQueue?.[1]?.status).toBe('newly-synced')
    expect(updatedQueue?.[2]?.status).toBe('pending')
  })

  it('should handle errors by continuing to the next file', async () => {
    // Arrange
    const mocks = getMocks()
    mocks.fileRepository.listFiles.mockResolvedValueOnce({ files: [] })
    mocks.fileRepository.listFiles.mockResolvedValueOnce({ files: [] })

    // First transfer fails, second succeeds:
    mocks.integration.transferFileToBotpress.mockRejectedValueOnce(new Error('Transfer failed'))
    mocks.integration.transferFileToBotpress.mockResolvedValueOnce({ botpressFileId: FILE_2.id })

    // Act
    const result = await processQueue({
      syncQueue: [FILE_1, FILE_2],
      ...mocks,
    })

    // Assert
    expect(result).toEqual({ finished: 'all' })
    expect(mocks.integration.transferFileToBotpress).toHaveBeenCalledTimes(2)
    expect(mocks.fileRepository.updateFileMetadata).toHaveBeenCalledTimes(1)

    const updatedQueue = mocks.updateSyncQueue.mock.calls[0]?.[0].syncQueue
    expect(updatedQueue?.[0]?.status).toBe('errored')
    expect(updatedQueue?.[0]?.errorMessage).toContain('Transfer failed')
    expect(updatedQueue?.[1]?.status).toBe('newly-synced')
  })
})
