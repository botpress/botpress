import * as sdk from '@botpress/sdk'
import { States } from 'definitions/states'
import * as bp from '../.botpress'
import { integrationName } from '../package.json'
import { TrelloWebhookRepository } from './repositories'
import { getServices } from './services/servicesContainer'

export class WebhookLifecycleManager {
  private readonly webhookRepository: TrelloWebhookRepository

  public constructor(
    private readonly ctx: bp.Context,
    private readonly client: bp.Client,
    private readonly logger: bp.Logger
  ) {
    const { webhookRepository } = getServices(ctx)
    this.webhookRepository = webhookRepository
  }

  public async registerTrelloWebhookIfNotExists(webhookUrl: string) {
    if (!this.ctx.configuration.trelloBoardId) {
      this.logger.forBot().warn('No Trello board id provided. Skipping webhook registration...')
      return
    }

    if (await this.getWebhookId()) {
      this.logger.forBot().debug('Webhook already registered. Skipping registration...')
      return
    }

    await this.registerTrelloWebhook(webhookUrl)
  }

  private async getWebhookId() {
    try {
      const webhookState = await this.client.getState({
        type: 'integration',
        name: States.webhookState,
        id: this.ctx.integrationId,
      })

      return webhookState.state.payload.trelloWebhookId ?? null
    } catch (_) {
      return null
    }
  }

  private async registerTrelloWebhook(webhookUrl: string) {
    this.logger.forBot().info('Registering Trello webhook...')

    try {
      const webhookId = await this.webhookRepository.createWebhook(
        integrationName + this.ctx.integrationId,
        webhookUrl,
        this.ctx.configuration.trelloBoardId as string
      )
      await this.setWebhookId(webhookId)
    } catch (error) {
      throw new sdk.RuntimeError(`Unable to register Trello webhook: ${error}`)
    }
  }

  private async setWebhookId(webhookId: string) {
    await this.client.setState({
      type: 'integration',
      name: States.webhookState,
      id: this.ctx.integrationId,
      payload: {
        trelloWebhookId: webhookId,
      },
    })
  }

  public async unregisterTrelloWebhookIfExists() {
    const webhookId = await this.getWebhookId()

    if (!webhookId) {
      this.logger.forBot().warn('No webhook is currently registered for this integration. Skipping unregistration...')
      return
    }

    await this.unregisterTrelloWebhook(webhookId)
  }

  private async unregisterTrelloWebhook(webhookId: string) {
    this.logger.forBot().info(`Unregistering webhook id ${webhookId} on Trello...`)

    try {
      await this.webhookRepository.deleteWebhook(webhookId)
    } catch (_) {
      // We do not care about webhook deletion failures
      this.logger.forBot().warn(`Webhook id ${webhookId} is already unregistered`)
    }

    this.logger.forBot().info(`Webhook id ${webhookId} unregistered`)
    await this.setWebhookId('')
  }
}
