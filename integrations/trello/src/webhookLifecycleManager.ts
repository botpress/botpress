import * as sdk from '@botpress/sdk'
import { States } from 'definitions/states'
import * as bp from '../.botpress'
import { integrationName } from '../package.json'
import { TrelloWebhookRepository } from './repositories'
import { getServices } from './services/servicesContainer'

export class WebhookLifecycleManager {
  private readonly _webhookRepository: TrelloWebhookRepository

  public constructor(
    private readonly _ctx: bp.Context,
    private readonly _client: bp.Client,
    private readonly _logger: bp.Logger
  ) {
    const { webhookRepository } = getServices(_ctx)
    this._webhookRepository = webhookRepository
  }

  public async registerTrelloWebhookIfNotExists(webhookUrl: string) {
    if (!this._ctx.configuration.trelloBoardId) {
      this._logger.forBot().warn('No Trello board id provided. Skipping webhook registration...')
      return
    }

    if (await this._getWebhookId()) {
      this._logger.forBot().debug('Webhook already registered. Skipping registration...')
      return
    }

    await this._registerTrelloWebhook(webhookUrl)
  }

  private async _getWebhookId() {
    try {
      const webhookState = await this._client.getState({
        type: 'integration',
        name: States.webhookState,
        id: this._ctx.integrationId,
      })

      return webhookState.state.payload.trelloWebhookId ?? null
    } catch (_) {
      return null
    }
  }

  private async _registerTrelloWebhook(webhookUrl: string) {
    this._logger.forBot().info('Registering Trello webhook...')

    try {
      const webhookId = await this._webhookRepository.createWebhook(
        integrationName + this._ctx.integrationId,
        webhookUrl,
        this._ctx.configuration.trelloBoardId as string
      )
      await this._setWebhookId(webhookId)
    } catch (error) {
      throw new sdk.RuntimeError(`Unable to register Trello webhook: ${error}`)
    }
  }

  private async _setWebhookId(webhookId: string) {
    await this._client.setState({
      type: 'integration',
      name: States.webhookState,
      id: this._ctx.integrationId,
      payload: {
        trelloWebhookId: webhookId,
      },
    })
  }

  public async unregisterTrelloWebhookIfExists() {
    const webhookId = await this._getWebhookId()

    if (!webhookId) {
      this._logger.forBot().warn('No webhook is currently registered for this integration. Skipping unregistration...')
      return
    }

    await this._unregisterTrelloWebhook(webhookId)
  }

  private async _unregisterTrelloWebhook(webhookId: string) {
    this._logger.forBot().info(`Unregistering webhook id ${webhookId} on Trello...`)

    try {
      await this._webhookRepository.deleteWebhook(webhookId)
    } catch (_) {
      this._logger.forBot().warn(`Webhook id ${webhookId} is already unregistered`)
    }

    this._logger.forBot().info(`Webhook id ${webhookId} unregistered`)
    await this._setWebhookId('')
  }
}
