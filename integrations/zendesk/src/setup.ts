import { isApiError } from '@botpress/client'
import * as sdk from '@botpress/sdk'
import { getZendeskClient } from './client'
import { uploadArticlesToKb } from './misc/upload-articles-to-kb'
import { deleteKbArticles } from './misc/utils'
import { Triggers } from './triggers'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async (props) => {
  const { client: bpClient, ctx, webhookUrl, logger } = props
  try {
    await _unsubscribeWebhooks(props)
  } catch {
    // silent catch since if it's the first time, there's nothing to unregister
  }

  const zendeskClient = await getZendeskClient(bpClient, ctx)
  const subscriptionId = await zendeskClient
    .subscribeWebhook(webhookUrl)
    .catch(_throwRuntimeError('Failed to create webhook subscription'))

  if (!subscriptionId) {
    throw new sdk.RuntimeError('Failed to create webhook subscription')
  }

  await zendeskClient
    .createArticleWebhook(webhookUrl, ctx.webhookId)
    .catch(_throwRuntimeError('Failed to create article webhook'))

  const user = await zendeskClient
    .createOrUpdateUser({
      role: 'end-user',
      external_id: ctx.botUserId,
      name: 'Botpress',
      // FIXME: use a PNG image hosted on the Botpress CDN
      remote_photo_url: 'https://app.botpress.dev/favicon/bp.svg',
    })
    .catch(_throwRuntimeError('Failed to create or update user'))

  await bpClient
    .updateUser({
      id: ctx.botUserId,
      pictureUrl: 'https://app.botpress.dev/favicon/bp.svg',
      name: 'Botpress',
      tags: {
        id: `${user.id}`,
        role: 'bot-user',
      },
    })
    .catch(_throwRuntimeError('Failed updating user'))

  const triggersCreated: string[] = []

  try {
    for (const trigger of Triggers) {
      const triggerId = await zendeskClient.createTrigger(trigger.name, subscriptionId, trigger.conditions)
      triggersCreated.push(triggerId)
    }
  } finally {
    await bpClient
      .setState({
        type: 'integration',
        id: ctx.integrationId,
        name: 'subscriptionInfo',
        payload: {
          subscriptionId,
          triggerIds: triggersCreated,
        },
      })
      .catch(_throwRuntimeError('Failed setting state'))
  }

  if (ctx.configuration.syncKnowledgeBaseWithBot) {
    if (!ctx.configuration.knowledgeBaseId) {
      throw new sdk.RuntimeError('Knowledge base id was not provided')
    }
    await uploadArticlesToKb({ ctx, client: bpClient, logger, kbId: ctx.configuration.knowledgeBaseId }).catch(
      _throwRuntimeError('Failed uploading articles to knowledge base')
    )
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async (props) => {
  const { client: bpClient } = props
  await bpClient.configureIntegration({ identifier: null })
  await _unsubscribeWebhooks(props)
}

type RegisterOrUnregisterProps =
  | Parameters<bp.IntegrationProps['register']>[number]
  | Parameters<bp.IntegrationProps['unregister']>[number]
const _unsubscribeWebhooks = async (props: RegisterOrUnregisterProps) => {
  const { ctx, client: bpClient, logger } = props
  const zendeskClient = await getZendeskClient(bpClient, ctx)

  const { state } = await bpClient
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
      .catch(_logError(logger, 'Failed to unsubscribe webhook'))
  }

  if (state.payload.triggerIds?.length) {
    await Promise.all(
      state.payload.triggerIds.map((trigger) =>
        zendeskClient.deleteTrigger(trigger).catch(_logError(logger, `Failed to delete trigger : ${trigger}`))
      )
    )
  }

  const articleWebhooks = await zendeskClient
    .findWebhooks({
      'filter[name_contains]': `bpc_article_event_${ctx.webhookId}`,
    })
    .catch(_logError(logger, 'Failed to find webhooks'))

  if (articleWebhooks) {
    await Promise.all(
      articleWebhooks.map((articleWebhook) =>
        zendeskClient
          .deleteWebhook(articleWebhook.id)
          .catch(_logError(logger, `Failed to delete webhook : ${articleWebhook.name}`))
      )
    )
  }

  if (ctx.configuration.syncKnowledgeBaseWithBot) {
    if (!ctx.configuration.knowledgeBaseId) {
      logger.forBot().error('Knowledge base id was not provided')
      return
    }
    await deleteKbArticles(ctx.configuration.knowledgeBaseId, bpClient).catch(
      _logError(logger, 'Failed to delete knowledge base articles')
    )
  }
}

const _buildMessage = (outer: string, thrown: unknown) => {
  const inner = (thrown instanceof Error ? thrown : new Error(String(thrown))).message
  return inner ? `${outer} : ${inner}` : outer
}

const _throwRuntimeError = (outer: string) => (thrown: unknown) => {
  throw new sdk.RuntimeError(_buildMessage(outer, thrown))
}

const _logError = (logger: sdk.IntegrationLogger, outer: string) => (thrown: unknown) => {
  logger.forBot().error(_buildMessage(outer, thrown))
}
