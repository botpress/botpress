import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'
import { createSemaphore } from '../utils/semaphore'

type FileInfo = bp.ClientResponses['listFiles']['files'][0]

const getAllFiles = async (client: bp.Client, tags: bp.ClientRequests['listFiles']['tags']) => {
  const allFiles: FileInfo[] = []
  let nextToken: string | undefined = undefined

  do {
    const response = await client.listFiles({
      tags,
      nextToken,
    })

    allFiles.push(...response.files)
    nextToken = response.meta.nextToken
  } while (nextToken)

  return allFiles
}

const tryDirectTagFiltering = async (kbId: string, client: bp.Client, logger: bp.Logger) => {
  try {
    return await getAllFiles(client, {
      kbId,
      origin: 'google-sheets',
    })
  } catch (error) {
    logger.forBot().error('Direct tag filtering failed:', error)
    return []
  }
}

const createDeleteBatchProcessor = (client: bp.Client, timeoutMs: number = 110000) => {
  const BATCH_SIZE = 200
  const MAX_CONCURRENT_BATCHES = 20
  const startTime = Date.now()
  const semaphore = createSemaphore(MAX_CONCURRENT_BATCHES)

  const deleteWithRetry = async (file: FileInfo, retries = 2): Promise<void> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await client.deleteFile({ id: file.id })
        return
      } catch (e) {
        if (attempt === retries - 1) throw new sdk.RuntimeError('Failed to delete file after retries')
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 500))
      }
    }
  }

  const processBatchWithSemaphore = async (batch: FileInfo[]): Promise<PromiseSettledResult<void>[]> => {
    if (Date.now() - startTime > timeoutMs) {
      throw new sdk.RuntimeError('Deletion timeout approaching, stopping batch processing')
    }

    await semaphore.acquire()
    try {
      return await Promise.allSettled(batch.map((file) => deleteWithRetry(file)))
    } finally {
      semaphore.release()
    }
  }

  return { processBatchWithSemaphore, BATCH_SIZE }
}

export const deleteKbFiles = async (kbId: string, client: bp.Client, logger: bp.Logger): Promise<void> => {
  const filesToDelete = await tryDirectTagFiltering(kbId, client, logger)

  if (filesToDelete.length === 0) {
    logger.forBot().info('No Google Sheets files found to delete')
    return
  }

  logger.forBot().info(`Preparing to delete ${filesToDelete.length} files`)
  const { processBatchWithSemaphore, BATCH_SIZE } = createDeleteBatchProcessor(client)

  const batches: FileInfo[][] = []
  for (let i = 0; i < filesToDelete.length; i += BATCH_SIZE) {
    batches.push(filesToDelete.slice(i, i + BATCH_SIZE))
  }

  const batchPromises = batches.map((batch) => processBatchWithSemaphore(batch))

  const batchResults = await Promise.all(batchPromises)
  const allResults = batchResults.flat()

  const totalSuccesses = allResults.filter((r) => r.status === 'fulfilled').length
  const totalFailures = allResults.filter((r) => r.status === 'rejected').length

  logger.forBot().info(`File deletion completed: ${totalSuccesses} successes, ${totalFailures} failures`)

  if (totalFailures > 0) {
    const errorMessages = allResults
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as PromiseRejectedResult).reason)
      .slice(0, 5)

    throw new sdk.RuntimeError(
      `Failed to delete ${totalFailures} out of ${filesToDelete.length} Google Sheets files. Sample errors: ${JSON.stringify(errorMessages)}`
    )
  }
}
