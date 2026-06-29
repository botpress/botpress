import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

export class WebhookManager {
  constructor(
    private bpClient: bp.Client,
    private logger: bp.Logger,
    private integrationId: string,
    private ctx: bp.Context
  ) {}

  /**
   * Triggers the sync webhook (for both initial sync and continuations)
   */
  async triggerSyncWebhook(runId: string, kbId: string, offset: number = 0): Promise<void> {
    // webhook payload to trigger continuation
    const webhookPayload = {
      userId: 'synthetic-user',
      createdAt: new Date().toISOString(),
      eventType: 'ACTOR.RUN.SUCCEEDED',
      eventData: {
        actorId: 'apify/website-content-crawler',
        actorRunId: runId,
      },
      resource: {
        id: runId,
        actId: 'apify/website-content-crawler',
        userId: 'synthetic-user',
        status: 'SUCCEEDED',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
      },
    }

    try {
      await this.bpClient.setState({
        type: 'integration',
        id: this.integrationId,
        name: 'syncContinuation',
        payload: {
          runId,
          kbId,
          nextOffset: offset,
          timestamp: Date.now(),
        },
      })
    } catch (error) {
      this.logger.forBot().warn(`Could not store syncContinuation state: ${error}`)
    }

    try {
      const webhookUrl = `https://webhook.botpress.cloud/${this.ctx.webhookId}`
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Botpress-Webhook-Secret': this.ctx.configuration.webhookSecret || '',
        },
        body: JSON.stringify(webhookPayload),
      })

      if (!response.ok && response.status !== 502) {
        const responseText = await response.text()
        throw new RuntimeError(`HTTP ${response.status}: ${response.statusText} - ${responseText}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      if (!errorMsg.includes('502')) {
        throw new RuntimeError(`Failed to trigger webhook: ${error}`)
      }
    }
  }
}
