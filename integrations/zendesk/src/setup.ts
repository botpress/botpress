import { IntegrationProps } from '../.botpress/implementation'
import { getZendeskClient } from './client'
import { syncZendeskArticlesToBotpressKB } from './misc/syncZendeskKbToBpKb'
import { Triggers } from './triggers'
import type { ZendeskApi } from './client'

const createArticleWebhook = async ({
  zendeskClient,
  webhookUrl,
  webhookId,
}: {
  zendeskClient: ZendeskApi
  webhookUrl: string
  webhookId: string
}): Promise<void> => {
  await zendeskClient.makeRequest({
    method: 'post',
    url: '/api/v2/webhooks',
    data: {
      webhook: {
        endpoint: webhookUrl,
        http_method: 'POST',
        name: `bpc_article_published_unpublished_${webhookId}`,
        request_format: 'json',
        status: 'active',
        subscriptions: ['zen:event-type:article.published', 'zen:event-type:article.unpublished'],
      },
    },
  })
}

const deleteArticleWebhook = async (zendeskClient: ZendeskApi, webhookId: string): Promise<void> => {
  const {
    data: { webhooks: articleWebhooks },
  } = await zendeskClient.makeRequest({
    method: 'get',
    url: '/api/v2/webhooks',
    params: {
      'filter[name_contains]': `bpc_article_published_unpublished_${webhookId}`,
    },
  })

  for (const webhook of articleWebhooks) {
    await zendeskClient.makeRequest({
      method: 'delete',
      url: `/api/v2/webhooks/${webhook.id}`,
    })
  }
}

export const register: IntegrationProps['register'] = async ({ client, ctx, webhookUrl, logger }) => {
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
    // await createArticleWebhook({ zendeskClient, webhookUrl, webhookId: ctx.webhookId })
    await syncZendeskArticlesToBotpressKB({ ctx, client, logger })
  }
}

export const unregister: IntegrationProps['unregister'] = async ({ ctx, client, logger }) => {
  const zendeskClient = getZendeskClient(ctx.configuration)

  const { state } = await client.getState({
    id: ctx.integrationId,
    name: 'subscriptionInfo',
    type: 'integration',
  })

  if (state.payload.subscriptionId?.length) {
    await zendeskClient.unsubscribeWebhook(state.payload.subscriptionId)
  }

  if (state.payload.triggerIds?.length) {
    for (const trigger of state.payload.triggerIds) {
      await zendeskClient.deleteTrigger(trigger)
    }
  }

  if (ctx.configuration.syncKnowledgeBaseWithBot) {
    await deleteArticleWebhook(zendeskClient, ctx.webhookId)

    if (!ctx.configuration.knowledgeBaseId) {
      logger.forBot().error('Knowledge base id was not provided')
      return
    }

    const { files } = await client.listFiles({
      tags: {
        kbId: ctx.configuration.knowledgeBaseId,
      },
    })

    for (const file of files) {
      await client.deleteFile({ id: file.id })
    }
  }
}
