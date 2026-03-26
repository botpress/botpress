import { Webhook } from 'definitions/schemas'
import { INTEGRATION_NAME } from 'integration.definition'
import { TrelloClient } from './trello-api/trello-client'
import * as bp from '.botpress'

const _registerWebhook = async (
  props: bp.CommonHandlerProps,
  webhookUrl: string,
  modelId: string,
  trelloClient = new TrelloClient({ ctx: props.ctx })
): Promise<void> => {
  const { ctx, logger } = props
  logger.forBot().info('Registering Trello webhook...')

  await trelloClient.createWebhook({
    description: INTEGRATION_NAME + ctx.integrationId,
    url: webhookUrl,
    modelId,
  })
}

export const registerTrelloWebhookIfNotExists = async (
  props: bp.CommonHandlerProps,
  webhookUrl: string,
  trelloClient = new TrelloClient({ ctx: props.ctx })
): Promise<void> => {
  const { ctx, logger } = props
  const { trelloBoardId } = ctx.configuration
  if (!trelloBoardId) {
    logger.forBot().warn('No Trello board id provided. Skipping webhook registration...')
    return
  }

  const registeredWebhooks = await trelloClient.listWebhooks()
  const isWebhookRegistered = registeredWebhooks.some(
    (webhook) => webhook.callbackUrl === webhookUrl && webhook.modelId === trelloBoardId
  )
  if (isWebhookRegistered) {
    logger.forBot().debug('Webhook already registered. Skipping registration...')
    return
  }

  await _registerWebhook(props, webhookUrl, trelloBoardId, trelloClient)
}

const _deleteWebhooksInList = async (trelloClient: TrelloClient, webhooks: Webhook[]): Promise<void> => {
  for (const webhook of webhooks) {
    await trelloClient.deleteWebhook({ id: webhook.id })
  }
}

/** Removes webhooks for models that we no longer want to track */
export const cleanupStaleWebhooks = async (
  props: bp.CommonHandlerProps,
  webhookUrl: string,
  trelloClient = new TrelloClient({ ctx: props.ctx })
): Promise<void> => {
  const registeredWebhooks = await trelloClient.listWebhooks()

  const { trelloBoardId } = props.ctx.configuration
  const staleWebhooks = registeredWebhooks.filter((webhook) => {
    return webhook.callbackUrl === webhookUrl && webhook.modelId !== trelloBoardId
  })

  await _deleteWebhooksInList(trelloClient, staleWebhooks)

  if (staleWebhooks.length > 0) {
    props.logger.forBot().info(`Cleaned up ${staleWebhooks.length} stale Trello webhook(s).`)
  }
}

export const unregisterTrelloWebhooks = async (
  props: bp.CommonHandlerProps,
  webhookUrl: string,
  trelloClient = new TrelloClient({ ctx: props.ctx })
) => {
  const registeredWebhooks = await trelloClient.listWebhooks()
  const webhooksToDelete = registeredWebhooks.filter((webhook) => {
    return webhook.callbackUrl === webhookUrl
  })

  await _deleteWebhooksInList(trelloClient, webhooksToDelete)

  if (webhooksToDelete.length > 0) {
    props.logger.forBot().info(`Deleted ${webhooksToDelete.length} Trello webhook(s).`)
  }
}
