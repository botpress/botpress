import assert from 'assert'
import { BaseRepository } from './baseRepository'

export class TrelloWebhookRepository extends BaseRepository {
  public async createWebhook(description: string, url: string, modelId: string): Promise<string> {
    try {
      const webhook = await this.trelloClient.webhooks.createWebhook({
        description,
        callbackURL: url,
        idModel: modelId,
      })

      assert(webhook.id, 'Webhook id must be returned by the API')

      return webhook.id
    } catch (error) {
      this.handleError(`createWebhook for model id ${modelId}`, error)
    }
  }

  public async deleteWebhook(id: string): Promise<void> {
    try {
      await this.trelloClient.webhooks.deleteWebhook({
        id,
      })
    } catch (error) {
      this.handleError(`deleteWebhook for webhook id ${id}`, error)
    }
  }
}
