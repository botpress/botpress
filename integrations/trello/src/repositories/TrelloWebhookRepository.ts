import 'reflect-metadata'
import assert from 'assert'
import { TrelloClient } from 'trello.js'
import { inject, injectable } from 'tsyringe'
import { IWebhookRepository } from '../interfaces/repositories/IWebhookRepository'
import { DIToken } from '../iocContainer'
import { BaseRepository } from './BaseRepository'

@injectable()
export class TrelloWebhookRepository extends BaseRepository implements IWebhookRepository {
  public constructor(@inject(DIToken.TrelloClient) trelloClient: TrelloClient) {
    super(trelloClient)
  }

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
