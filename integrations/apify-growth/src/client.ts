import { ApifyClient } from 'apify-client'
import * as bp from '.botpress'
import { CrawlerRunInput } from './misc/types'
import { SyncOrchestrator } from './lib/sync-orchestrator'
import { WebhookManager } from './lib/webhook-manager'

export class ApifyApi {
  private client: ApifyClient
  private syncOrchestrator: SyncOrchestrator
  private webhookManager: WebhookManager
  private logger: bp.Logger

  constructor(apiToken: string, bpClient: bp.Client, logger: bp.Logger, integrationId: string, ctx: bp.Context) {
    this.client = new ApifyClient({
      token: apiToken,
      maxRetries: 8,
      minDelayBetweenRetriesMillis: 500,
      timeoutSecs: 360, // 6 minutes timeout
    })
    this.logger = logger
    this.syncOrchestrator = new SyncOrchestrator(bpClient, logger)
    this.webhookManager = new WebhookManager(bpClient, logger, integrationId, ctx)
  }

  /**
   * Starts a crawler run asynchronously and returns the run ID
   * Use this with webhooks for production crawling
   */
  async startCrawlerRun(input: CrawlerRunInput): Promise<{ runId: string; status: string }> {
    const run = await this.client.actor('apify/website-content-crawler').call(input, { waitSecs: 0 })
    this.logger.forBot().debug(`Crawler run started with ID: ${run.id}, status: ${run.status}`)

    return {
      runId: run.id,
      status: run.status,
    }
  }

  async getRun(runId: string): Promise<{ runId: string; status: string; datasetId?: string }> {
    try {
      const run = await this.client.run(runId).get()
      return {
        runId: run?.id || runId,
        status: run?.status || 'UNKNOWN',
        datasetId: run?.defaultDatasetId,
      }
    } catch (error) {
      this.logger.forBot().error(`Error getting run ${runId}: ${error}`)
      throw error
    }
  }

  async fetchAndSyncStreaming(
    datasetId: string,
    kbId: string,
    timeLimitMs: number = 0,
    startOffset: number = 0
  ): Promise<{ itemsProcessed: number; hasMore: boolean; nextOffset: number; total: number; filesCreated: number }> {
    const dataset = this.client.dataset(datasetId)
    return await this.syncOrchestrator.fetchAndSyncStreaming(
      dataset,
      kbId,
      this.syncOrchestrator.syncContentToBotpress.bind(this.syncOrchestrator),
      timeLimitMs,
      startOffset
    )
  }

  async triggerSyncWebhook(runId: string, kbId: string, offset: number = 0): Promise<void> {
    return await this.webhookManager.triggerSyncWebhook(runId, kbId, offset)
  }
}

export const getClient = (
  apiToken: string,
  bpClient: bp.Client,
  logger: bp.Logger,
  integrationId: string,
  ctx: bp.Context
) => {
  return new ApifyApi(apiToken, bpClient, logger, integrationId, ctx)
}
