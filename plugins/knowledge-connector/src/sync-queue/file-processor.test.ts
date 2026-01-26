import * as sdk from '@botpress/sdk'
import { describe, it, expect, vi, type Mocked } from 'vitest'
import { processQueueFile, type ProcessFileProps } from './file-processor'
import type * as types from '../types'

const FILE_1 = {
  id: 'file1',
  type: 'file',
  name: 'file1.txt',
  absolutePath: '/path/to/file1.txt',
  sizeInBytes: 100,
  status: 'pending',
} as const satisfies types.SyncQueueItem

describe.concurrent('processQueue', () => {
  const getMocks = () => ({
    fileRepository: {
      listFiles: vi.fn(),
      deleteFile: vi.fn(),
      updateFileMetadata: vi.fn(),
    } as const satisfies Mocked<ProcessFileProps['fileRepository']>,
    integration: {
      name: 'test-integration',
      alias: 'test-integration-alias',
      transferFileToBotpress: vi.fn(),
    } as const satisfies Mocked<ProcessFileProps['integration']>,
    logger: new sdk.BotLogger(),
  })

  it('should handle errors by modifying the queue item', async () => {
    // Arrange
    const mocks = getMocks()
    mocks.fileRepository.listFiles.mockResolvedValueOnce({ files: [] })

    // First transfer fails, second succeeds:
    mocks.integration.transferFileToBotpress.mockRejectedValueOnce(new Error('Transfer failed'))

    // Act
    const result = processQueueFile({
      fileToSync: FILE_1,
      ...mocks,
    })

    // Assert
    await expect(result).resolves.toMatchObject({ status: 'errored', errorMessage: 'Transfer failed' })
    expect(mocks.integration.transferFileToBotpress).toHaveBeenCalledTimes(1)
    expect(mocks.fileRepository.updateFileMetadata).not.toHaveBeenCalled()
  })

  it('should properly set metadata tags after transferring file', async () => {
    // Arrange
    const mocks = getMocks()
    mocks.fileRepository.listFiles.mockResolvedValueOnce({ files: [] })
    mocks.integration.transferFileToBotpress.mockResolvedValueOnce({ botpressFileId: FILE_1.id })

    // Act
    const result = processQueueFile({
      fileToSync: FILE_1,
      ...mocks,
    })

    // Assert
    await expect(result).resolves.toMatchObject({ status: 'newly-synced' })
    expect(mocks.fileRepository.updateFileMetadata).toHaveBeenCalledWith({
      id: FILE_1.id,
      tags: {
        integrationName: 'test-integration',
        integrationAlias: 'test-integration-alias',
        externalId: FILE_1.id,
        externalSize: FILE_1.sizeInBytes.toString(),
        externalPath: FILE_1.absolutePath,
      },
    })
  })

  it('should assign to kb if needed after transferring file', async () => {
    // Arrange
    const mocks = getMocks()
    mocks.fileRepository.listFiles.mockResolvedValueOnce({ files: [] })
    mocks.integration.transferFileToBotpress.mockResolvedValueOnce({ botpressFileId: FILE_1.id })

    // Act
    const result = processQueueFile({
      fileToSync: { ...FILE_1, addToKbId: 'kb1' },
      ...mocks,
    })

    // Assert
    await expect(result).resolves.toMatchObject({ status: 'newly-synced' })
    expect(mocks.fileRepository.updateFileMetadata).toHaveBeenCalledWith({
      id: FILE_1.id,
      tags: {
        integrationName: 'test-integration',
        integrationAlias: 'test-integration-alias',
        externalId: FILE_1.id,
        externalSize: FILE_1.sizeInBytes.toString(),
        externalPath: FILE_1.absolutePath,
        kbId: 'kb1',
        modalities: '["text"]',
        source: 'knowledge-base',
        title: FILE_1.name,
      },
    })
  })
})
