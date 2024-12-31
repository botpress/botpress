import { States } from 'definitions/states'
import { integrationName } from '../../package.json'
import { TrelloClient } from '../trello-api/trello-client'
import * as bp from '.botpress'

export namespace WebhookLifecycleManager {
  export const registerTrelloWebhookIfNotExists = async ({
    ctx,
    client,
    logger,
    webhookUrl,
  }: {
    ctx: bp.Context
    client: bp.Client
    logger: bp.Logger
    webhookUrl: string
  }): Promise<void> => {
    if (!ctx.configuration.trelloBoardId) {
      logger.forBot().warn('No Trello board id provided. Skipping webhook registration...')
      return
    }

    if (await _getWebhookId(client, ctx)) {
      logger.forBot().debug('Webhook already registered. Skipping registration...')
      return
    }

    await _registerTrelloWebhook(ctx, client, logger, webhookUrl)
  }

  export const unregisterTrelloWebhookIfExists = async ({
    ctx,
    client,
    logger,
  }: {
    ctx: bp.Context
    client: bp.Client
    logger: bp.Logger
  }): Promise<void> => {
    const webhookId = await _getWebhookId(client, ctx)

    if (!webhookId) {
      logger.forBot().warn('No webhook is currently registered for this integration. Skipping unregistration...')
      return
    }

    await _unregisterTrelloWebhook(ctx, client, logger, webhookId)
  }

  const _getWebhookId = async (client: bp.Client, ctx: bp.Context): Promise<string | null> => {
    try {
      const webhookState = await client.getState({
        type: 'integration',
        name: States.webhookState,
        id: ctx.integrationId,
      })

      return webhookState.state.payload.trelloWebhookId ?? null
    } catch {
      return null
    }
  }

  const _registerTrelloWebhook = async (
    ctx: bp.Context,
    client: bp.Client,
    logger: bp.Logger,
    webhookUrl: string
  ): Promise<void> => {
    logger.forBot().info('Registering Trello webhook...')

    const trelloClient = new TrelloClient({ ctx })
    const webhookId = await trelloClient.createWebhook({
      description: integrationName + ctx.integrationId,
      url: webhookUrl,
      modelId: ctx.configuration.trelloBoardId as string,
    })
    await _setWebhookId(client, ctx, webhookId)
  }

  const _setWebhookId = async (client: bp.Client, ctx: bp.Context, webhookId: string): Promise<void> => {
    await client.setState({
      type: 'integration',
      name: States.webhookState,
      id: ctx.integrationId,
      payload: {
        trelloWebhookId: webhookId,
      },
    })
  }

  const _unregisterTrelloWebhook = async (
    ctx: bp.Context,
    client: bp.Client,
    logger: bp.Logger,
    webhookId: string
  ): Promise<void> => {
    logger.forBot().info(`Unregistering webhook id ${webhookId} on Trello...`)

    const trelloClient = new TrelloClient({ ctx })
    await trelloClient.deleteWebhook({ id: webhookId })

    logger.forBot().info(`Webhook id ${webhookId} unregistered`)
    await _setWebhookId(client, ctx, webhookId)
  }
}
