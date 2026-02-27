import { DatasetItem, ApifyDataset } from '../misc/types'
import { DataTransformer } from '../helpers/data-transformer'
import { BotpressHelper } from '../helpers/botpress-helper'
import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'

export class SyncOrchestrator {
  private dataTransformer: DataTransformer
  private botpressHelper: BotpressHelper

  constructor(
    private bpClient: bp.Client,
    private logger: bp.Logger
  ) {
    this.dataTransformer = new DataTransformer(logger)
    this.botpressHelper = new BotpressHelper(bpClient)
  }

  async fetchAndSyncStreaming(
    dataset: ApifyDataset,
    kbId: string,
    syncFunction: (items: DatasetItem[], kbId: string) => Promise<number>,
    _timeLimitMs: number = 0,
    startOffset: number = 0
  ): Promise<{ itemsProcessed: number; hasMore: boolean; nextOffset: number; total: number; filesCreated: number }> {
    const streamStartTime = Date.now()
    let offset = startOffset
    let total = 0
    let itemsProcessed = 0
    let filesCreated = 0

    // process files one at a time with 100 seconds timeout detection
    const MAX_EXECUTION_TIME = 100000

    while (true) {
      try {
        const elapsed = Date.now() - streamStartTime
        if (elapsed > MAX_EXECUTION_TIME) {
          return { itemsProcessed, hasMore: true, nextOffset: offset, total, filesCreated }
        }

        const { items, total: currentTotal } = await dataset.listItems({ limit: 1, offset })

        if (currentTotal !== undefined) {
          total = currentTotal
        }

        if (items.length > 0) {
          // sync single item
          const syncResult = await syncFunction(items, kbId)
          filesCreated += syncResult
          itemsProcessed++
          offset++

          // check if all items have been processed
          if (total > 0 && offset >= total) {
            return { itemsProcessed, hasMore: false, nextOffset: 0, total, filesCreated }
          }
        } else {
          return { itemsProcessed, hasMore: false, nextOffset: 0, total, filesCreated }
        }
      } catch (error) {
        this.logger.forBot().error(`Error at offset ${offset}:`, error)
        return { itemsProcessed, hasMore: true, nextOffset: offset, total, filesCreated }
      }
    }
  }

  async syncContentToBotpress(items: DatasetItem[], kbId: string): Promise<number> {
    let filesCreated = 0
    let filesSkipped = 0
    let filesFailed = 0

    for (const item of items) {
      const url = item.url || item.metadata?.url || 'unknown'

      try {
        const processedItem = this.dataTransformer.processItemContent(item)
        if (!processedItem) {
          filesSkipped++
          this.logger.forBot().warn(`⏭️  Skipped (no content): ${url}`)
          continue
        }

        const filename = this.dataTransformer.generateFilename(item)

        // retry on 409
        let retries = 5
        let lastError

        // 3 seconds
        const SLEEP_TIME = 3000

        while (retries > 0) {
          try {
            await this.botpressHelper.uploadFile(filename, processedItem.content, processedItem.extension, kbId)
            filesCreated++
            this.logger.forBot().debug(`✓ Uploaded: ${filename} (${url})`)
            break
          } catch (uploadError: any) {
            lastError = uploadError
            if (uploadError?.code === 409 && retries > 1) {
              this.logger.forBot().warn(`⏳ File ${filename} locked, retrying in 3s... (${retries - 1} retries left)`)
              await new Promise((resolve) => setTimeout(resolve, SLEEP_TIME))
              retries--
            } else {
              const errorMsg = uploadError instanceof Error ? uploadError.message : String(uploadError)
              this.logger.forBot().error(`Failed to upload ${filename} after retries: ${errorMsg}`)
              throw new RuntimeError(`Failed to upload file: ${errorMsg}`)
            }
          }
        }
      } catch (error) {
        filesFailed++
        this.logger.forBot().error(`❌ Failed to process: ${url}`, error)
      }
    }

    if (filesSkipped > 0 || filesFailed > 0) {
      this.logger
        .forBot()
        .info(`📊 Batch summary: ${filesCreated} created, ${filesSkipped} skipped (no content), ${filesFailed} failed`)
    }

    return filesCreated
  }
}
