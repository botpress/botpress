import { isApiError } from '@botpress/client'
import * as sdk from '@botpress/sdk'
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
  const subscriptionId = await zendeskClient
    .subscribeWebhook(webhookUrl)
    .catch(_handleError('Failed to create webhook subscription'))

  await zendeskClient
    .createArticleWebhook(webhookUrl, ctx.webhookId)
    .catch(_handleError('Failed to create article webhook'))

  const user = await zendeskClient
    .createOrUpdateUser({
      role: 'end-user',
      external_id: ctx.botUserId,
      name: 'Botpress',
      // FIXME: use a PNG image hosted on the Botpress CDN
      remote_photo_url: 'https://app.botpress.dev/favicon/bp.svg',
    })
    .catch(_handleError('Failed to create or update user'))

  await client
    .updateUser({
      id: ctx.botUserId,
      pictureUrl: 'https://app.botpress.dev/favicon/bp.svg',
      name: 'Botpress',
      tags: {
        id: `${user.id}`,
        role: 'bot-user',
      },
    })
    .catch(_handleError('Failed updating user'))

  const triggersCreated: string[] = []

  try {
    for (const trigger of Triggers) {
      const triggerId = await zendeskClient.createTrigger(trigger.name, subscriptionId, trigger.conditions)
      triggersCreated.push(triggerId)
    }
  } finally {
    await client
      .setState({
        type: 'integration',
        id: ctx.integrationId,
        name: 'subscriptionInfo',
        payload: {
          subscriptionId,
          triggerIds: triggersCreated,
        },
      })
      .catch(_handleError('Failed setting state'))
  }

  if (ctx.configuration.syncKnowledgeBaseWithBot) {
    if (!ctx.configuration.knowledgeBaseId) {
      throw new sdk.RuntimeError('No KB id provided')
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
      const err = thrown instanceof Error ? thrown : new Error(String(thrown))
      throw new sdk.RuntimeError(`Failed to get state : ${err.message}`)
    })

  if (state === null) {
    logger.forBot().warn('Nothing to unregister')
    return
  }

  if (state.payload.subscriptionId?.length) {
    await zendeskClient
      .unsubscribeWebhook(state.payload.subscriptionId)
      .catch(_handleError('Failed to unsubscribe webhook'))
  }

  if (state.payload.triggerIds?.length) {
    await Promise.all(
      state.payload.triggerIds.map((trigger) =>
        zendeskClient.deleteTrigger(trigger).catch(_handleError('Failed to unsubscribe webhook'))
      )
    )
  }

  const articleWebhooks = await zendeskClient
    .findWebhooks({
      'filter[name_contains]': `bpc_article_event_${ctx.webhookId}`,
    })
    .catch(_handleError('Failed to find webhooks'))

  await Promise.all(
    articleWebhooks.map((articleWebhook) =>
      zendeskClient
        .deleteWebhook(articleWebhook.id)
        .catch(_handleError(`Failed to delete webhook ${articleWebhook.name}`))
    )
  )

  if (ctx.configuration.syncKnowledgeBaseWithBot) {
    if (!ctx.configuration.knowledgeBaseId) {
      throw new sdk.RuntimeError('Knowledge base id was not provided')
    }
    await deleteKbArticles(ctx.configuration.knowledgeBaseId, client).catch(
      _handleError('Failed to delete knowledge base articles')
    )
  }
}

const _handleError = (outterMessage: string) => (thrown: unknown) => {
  const innerMessage = (thrown instanceof Error ? thrown : new Error(String(thrown))).message
  const fullMessage = innerMessage ? `${outterMessage}: ${innerMessage}` : outterMessage
  throw new sdk.RuntimeError(fullMessage)
}
