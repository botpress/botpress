import { getZendeskClient } from './client'
import { uploadArticlesToKb } from './misc/upload-articles-to-kb'
import { deleteKbArticles } from './misc/utils'
import { Triggers } from './triggers'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, webhookUrl, logger }) => {
  try {
    await unregister({ ctx, client, webhookUrl, logger })
  } catch (err) {
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
    triggersCreated.push(
      ...(await Promise.all(
        Triggers.map((trigger) => zendeskClient.createTrigger(trigger.name, subscriptionId, trigger.conditions))
      ))
    )
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

  const { state } = await client.getState({
    id: ctx.integrationId,
    name: 'subscriptionInfo',
    type: 'integration',
  })

  if (state.payload.subscriptionId?.length) {
    await zendeskClient.unsubscribeWebhook(state.payload.subscriptionId).catch((err) => {
      logger.forBot().error('Could not unsubscribe webhook', err)
    })
  }

  if (state.payload.triggerIds?.length) {
    await Promise.all(
      state.payload.triggerIds.map((trigger) =>
        zendeskClient.deleteTrigger(trigger).catch((err) => {
          logger.forBot().error('Could not delete trigger', err)
        })
      )
    )
  }

  const articleWebhooks = await zendeskClient.findWebhooks({
    'filter[name_contains]': `bpc_article_event_${ctx.webhookId}`,
  })

  await Promise.all(
    articleWebhooks.map((webhook) =>
      zendeskClient.deleteWebhook(webhook.id).catch((err) => {
        logger.forBot().error('Could not delete article webhook', err)
      })
    )
  )

  if (ctx.configuration.syncKnowledgeBaseWithBot) {
    if (!ctx.configuration.knowledgeBaseId) {
      logger.forBot().error('Knowledge base id was not provided')
      return
    }
    await deleteKbArticles(ctx.configuration.knowledgeBaseId, client)
  }
}
