import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'
import { GoogleSheetsClient } from '../client'
import { StoredSheetRow } from '../misc/types'
import { deleteKbFiles } from '../misc/kb'
import { extractSpreadsheetId, extractGidFromUrl } from '../utils'
import { createSemaphore } from '../utils/semaphore'

interface UploadTask {
  storedRow: StoredSheetRow
  fileKey: string
  content: string
}

interface ParsedSheetInfo {
  spreadsheetId: string
  gid: string
  sourceSheet: string
}

const parseSheetInfo = (sheetsUrl: string): ParsedSheetInfo => {
  const spreadsheetId = extractSpreadsheetId(sheetsUrl)
  const gid = extractGidFromUrl(sheetsUrl)
  const sourceSheet = `${spreadsheetId}_${gid}`
  return { spreadsheetId, gid, sourceSheet }
}

const transformRowToStoredData = (
  row: string[],
  headers: string[],
  rowIndex: number,
  sourceSheet: string
): StoredSheetRow => {
  const rowData: Record<string, string | undefined> = {}
  headers.forEach((header, index) => {
    rowData[header] = row[index] || ''
  })

  return {
    id: `row_${rowIndex + 1}`,
    rowIndex: rowIndex + 1,
    data: rowData,
    sourceSheet: sourceSheet,
    updatedAt: new Date().toISOString(),
  }
}

const createUploadTasks = (
  sheetData: { headers: string[]; rows: string[][] },
  sourceSheet: string,
  knowledgeBaseId: string
): UploadTask[] => {
  const uploadTasks: UploadTask[] = []

  for (let i = 0; i < sheetData.rows.length; i++) {
    const row = sheetData.rows[i]
    if (!row || row.length === 0) continue

    const storedRow = transformRowToStoredData(row, sheetData.headers, i, sourceSheet)

    const fileKey = `${knowledgeBaseId}/sheet_row_${i + 1}.txt`
    const content = JSON.stringify(storedRow, null, 2)

    uploadTasks.push({ storedRow, fileKey, content })
  }

  return uploadTasks
}

const createBatchProcessor = (
  client: bp.Client,
  knowledgeBaseId: string,
  { spreadsheetId, gid, sourceSheet }: ParsedSheetInfo,
  logger: bp.Logger
) => {
  const BATCH_SIZE = 150
  const MAX_CONCURRENT_BATCHES = 10

  const createUploadPromise = (task: UploadTask) =>
    client.uploadFile({
      key: task.fileKey,
      content: task.content,
      index: true,
      tags: {
        source: 'knowledge-base',
        kbId: knowledgeBaseId,
        rowId: task.storedRow.id,
        origin: 'google-sheets',
        sourceSheet: sourceSheet,
        spreadsheetId: spreadsheetId,
        gid: gid,
      },
    })

  const uploadWithRetry = async (task: UploadTask, retries = 3): Promise<void> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await createUploadPromise(task)
        return
      } catch (error) {
        if (attempt === retries - 1) throw error
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }

  const processBatch = async (batch: UploadTask[]): Promise<PromiseSettledResult<void>[]> => {
    return Promise.allSettled(batch.map((task) => uploadWithRetry(task)))
  }

  const semaphore = createSemaphore(MAX_CONCURRENT_BATCHES)

  const processBatchWithSemaphore = async (
    batch: UploadTask[],
    batchNumber: number
  ): Promise<PromiseSettledResult<void>[]> => {
    await semaphore.acquire()
    try {
      logger.forBot().info(`Processing batch ${batchNumber} (${batch.length} rows)`)
      const results = await processBatch(batch)
      const successes = results.filter((r) => r.status === 'fulfilled').length
      const failures = results.filter((r) => r.status === 'rejected').length

      if (failures > 0) {
        logger.forBot().warn(`Batch ${batchNumber}: ${successes} successes, ${failures} failures`)
      } else {
        logger.forBot().info(`Batch ${batchNumber}: completed successfully (${successes} rows)`)
      }

      return results
    } finally {
      semaphore.release()
    }
  }

  return { processBatchWithSemaphore, BATCH_SIZE }
}

const processUploadResults = (
  batchResults: PromiseSettledResult<void>[][],
  totalTasks: number,
  logger: bp.Logger
): number => {
  const allResults = batchResults.flat()
  const recordsProcessed = allResults.filter((r) => r.status === 'fulfilled').length

  const totalFailures = allResults.filter((r) => r.status === 'rejected').length

  if (totalFailures > 0) {
    logger.forBot().error(`Upload completed with ${totalFailures} failures out of ${totalTasks} total rows`)
  }

  logger.forBot().info(`Successfully synced ${recordsProcessed} rows to Knowledge Base`)

  return recordsProcessed
}

const syncKb: bp.IntegrationProps['actions']['syncKb'] = async ({ ctx, client, logger }) => {
  const { sheetsUrl } = ctx.configuration
  const knowledgeBaseId = 'kb-default'

  if (!sheetsUrl) {
    throw new sdk.RuntimeError('Missing required configuration: sheetsUrl')
  }

  const sheetsClient = new GoogleSheetsClient()

  try {
    logger.forBot().info('Starting Google Sheets sync to Knowledge Base')

    const sheetInfo = parseSheetInfo(sheetsUrl)

    logger.forBot().info('Deleting existing Google Sheets files from Knowledge Base')
    await deleteKbFiles(knowledgeBaseId, client, logger)

    logger.forBot().info('Fetching data from Google Sheets')
    const sheetData = await sheetsClient.getSheetData(sheetsUrl)

    if (sheetData.headers.length === 0) {
      return {
        success: true,
        message: 'No data found in the sheet',
        recordsProcessed: 0,
      }
    }

    const uploadTasks = createUploadTasks(sheetData, sheetInfo.sourceSheet, knowledgeBaseId)

    const { processBatchWithSemaphore, BATCH_SIZE } = createBatchProcessor(client, knowledgeBaseId, sheetInfo, logger)

    const batches: UploadTask[][] = []
    for (let i = 0; i < uploadTasks.length; i += BATCH_SIZE) {
      batches.push(uploadTasks.slice(i, i + BATCH_SIZE))
    }

    logger.forBot().info(`Starting async upload of ${uploadTasks.length} rows in ${batches.length} batches`)

    const batchPromises = batches.map((batch, index) => processBatchWithSemaphore(batch, index + 1))

    const batchResults = await Promise.all(batchPromises)
    const recordsProcessed = processUploadResults(batchResults, uploadTasks.length, logger)

    return {
      success: true,
      message: `Successfully synced ${recordsProcessed} rows from Google Sheets to Knowledge Base`,
      recordsProcessed,
    }
  } catch (error) {
    logger.forBot().error('Error syncing Google Sheets to Knowledge Base', { error })

    if (error instanceof sdk.RuntimeError) {
      throw error
    }

    throw new sdk.RuntimeError(
      `Failed to sync Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export { syncKb }
