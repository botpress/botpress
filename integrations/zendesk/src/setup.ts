import { isApiError } from '@botpress/client'
import { getZendeskClient } from './client'
import { uploadArticlesToKb } from './misc/upload-articles-to-kb'
import { deleteKbArticles } from './misc/utils'
import { Triggers } from './triggers'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, webhookUrl, logger }) => {
  try {
    await unregister({ ctx, client, webhookUrl, logger })
  } catch {
    // silent catch since if it's the first time, there's nothing to unregister
  }

  const zendeskClient = getZendeskClient(ctx.configuration)
  const subscriptionId = await zendeskClient.subscribeWebhook(webhookUrl)

  if (!subscriptionId) {
    logger.forBot().error('Could not create webhook subscription')
    return
  }

  await zendeskClient.createArticleWebhook(webhookUrl, ctx.webhookId)

  const user = await zendeskClient.createOrUpdateUser({
    role: 'end-user',
    external_id: ctx.botUserId,
    name: 'Botpress',
  })

  await client.updateUser({
    id: ctx.botUserId,
    tags: {
      id: `${user.id}`,
    },
  })

  const triggersCreated: string[] = []

  try {
    for (const trigger of Triggers) {
      const triggerId = await zendeskClient.createTrigger(trigger.name, subscriptionId, trigger.conditions)
      triggersCreated.push(triggerId)
    }
  } finally {
    await client.setState({
      type: 'integration',
      id: ctx.integrationId,
      name: 'subscriptionInfo',
      payload: {
        subscriptionId,
        triggerIds: triggersCreated,
      },
    })
  }

  if (ctx.configuration.syncKnowledgeBaseWithBot) {
    if (!ctx.configuration.knowledgeBaseId) {
      logger.forBot().error('No KB id provided')
      return
    }
    await uploadArticlesToKb({ ctx, client, logger, kbId: ctx.configuration.knowledgeBaseId })
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ ctx, client, logger }) => {
  const zendeskClient = getZendeskClient(ctx.configuration)

  const { state } = await client
    .getState({
      id: ctx.integrationId,
      name: 'subscriptionInfo',
      type: 'integration',
    })
    .catch((thrown) => {
      if (isApiError(thrown) && thrown.type === 'ResourceNotFound') {
        return { state: null }
      }
      logger.forBot().error('Could not get subscription info state', thrown)
      throw thrown
    })

  if (state === null) {
    logger.forBot().warn('Nothing to unregister')
    return
  }

  if (state.payload.subscriptionId?.length) {
    await zendeskClient.unsubscribeWebhook(state.payload.subscriptionId).catch((err) => {
      logger.forBot().error('Could not unsubscribe webhook', err)
    })
  }

  if (state.payload.triggerIds?.length) {
    for (const trigger of state.payload.triggerIds) {
      await zendeskClient.deleteTrigger(trigger).catch((err) => {
        logger.forBot().error('Could not delete trigger', err)
      })
    }
  }

  const articleWebhooks = await zendeskClient.findWebhooks({
    'filter[name_contains]': `bpc_article_event_${ctx.webhookId}`,
  })

  for (const articleWebhook of articleWebhooks) {
    await zendeskClient.deleteWebhook(articleWebhook.id).catch((err) => {
      logger.forBot().error('Could not delete article webhook', err)
    })
  }

  if (ctx.configuration.syncKnowledgeBaseWithBot) {
    if (!ctx.configuration.knowledgeBaseId) {
      logger.forBot().error('Knowledge base id was not provided')
      return
    }
    await deleteKbArticles(ctx.configuration.knowledgeBaseId, client)
  }
}
