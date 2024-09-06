import * as sdk from '@botpress/sdk'
import { States } from 'definitions/states'
import { DependencyContainer } from 'tsyringe'
import * as bp from '../.botpress'
import { integrationName } from '../package.json'
import { IWebhookCreationService } from './interfaces/services/IWebhookCreationService'
import { IWebhookDeletionService } from './interfaces/services/IWebhookDeletionService'
import { DIToken } from './iocContainer'

export class WebhookLifecycleManager {
  private ctx: bp.Context
  private client: bp.Client
  private container: DependencyContainer
  private logger: bp.Logger

  public constructor(ctx: bp.Context, client: bp.Client, container: DependencyContainer, logger: bp.Logger) {
    this.ctx = ctx
    this.client = client
    this.container = container
    this.logger = logger
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
    const webhookCreationService = this.container.resolve<IWebhookCreationService>(DIToken.WebhookCreationService)

    this.logger.forBot().info('Registering Trello webhook...')

    try {
      const webhookId = await webhookCreationService.createWebhook(
        integrationName,
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
    const webhookDeletionService = this.container.resolve<IWebhookDeletionService>(DIToken.WebhookDeletionService)

    this.logger.forBot().info(`Unregistering webhook id ${webhookId} on Trello...`)

    try {
      await webhookDeletionService.deleteWebhook(webhookId)
    } catch (_) {
      // We do not care about webhook deletion failures
      this.logger.forBot().warn(`Webhook id ${webhookId} is already unregistered`)
    }

    this.logger.forBot().info(`Webhook id ${webhookId} unregistered`)
    await this.setWebhookId('')
  }
}
