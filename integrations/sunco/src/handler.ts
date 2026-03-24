import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getWizardStepUrl, isOAuthWizardUrl } from '@botpress/common/src/oauth-wizard'
import { RuntimeError } from '@botpress/sdk'
import { INTEGRATION_NAME } from '../integration.definition'
import { getCredentials } from './api/get-credentials'
import { getSuncoClient } from './client'
import { executeConversationCreated, handleConversationMessage } from './events'
import { getStoredCredentials, getWebhookSecret } from './get-stored-credentials'
import { getConversation, isSuncoWebhookPayload, isWebhookSignatureValid } from './messaging-events'
import * as wizard from './wizard'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, client, logger, ctx } = props

  if (req.path.startsWith('/oauth')) {
    return await _handleOAuthCallback(props)
  }

  if (!isWebhookSignatureValid(req.headers, await getWebhookSecret(client, ctx))) {
    logger.forBot().warn('Received a request with an invalid webhook secret')
    return
  }

  if (!req.body) {
    console.warn('Handler received an empty body')
    return
  }

  const data = JSON.parse(req.body)

  if (!isSuncoWebhookPayload(data)) {
    logger.forBot().warn('Received an invalid payload from Sunco')
    return
  }

  const credentials = await getStoredCredentials(client, ctx)
  const suncoClient = getSuncoClient(credentials)

  for (const event of data.events) {
    const conversation = getConversation(event)
    const ownerWebhookId = conversation?.metadata?.botpressIntegrationOwner
    if (ownerWebhookId && ownerWebhookId !== ctx.webhookId) {
      logger.forBot().debug(`Ignoring Sunco conversation ${conversation?.id}: owned by ${ownerWebhookId}`)
      continue
    }

    if (conversation?.id) {
      await _updateConversationOwnerIfNeeded(suncoClient, conversation.id, conversation.metadata, ctx.webhookId)
    }

    if (event.type === 'conversation:create') {
      await executeConversationCreated({ event, client, logger })
    } else if (event.type === 'conversation:message') {
      await handleConversationMessage(event, client, logger)
    } else {
      console.warn(`Received an event of type ${event.type}, which is not supported`)
    }
  }
  return {
    status: 200,
  }
}

const _handleOAuthCallback = async ({ req, client, ctx, logger }: bp.HandlerProps) => {
  if (isOAuthWizardUrl(req.path)) {
    return await wizard.handler({ client, ctx, logger, req })
  }

  logger.forBot().debug('Handling OAuth callback')

  const searchParams = new URLSearchParams(req.query)
  const authorizationCode = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    logger.forBot().error(`SunCo OAuth error: ${error} - ${errorDescription}`)
    throw new RuntimeError(`SunCo OAuth error: ${error} - ${errorDescription}`)
  }

  if (!authorizationCode) {
    logger.forBot().error('Authorization code not present in OAuth callback')
    throw new RuntimeError('Authorization code not present in OAuth callback')
  }

  const credentials = await getCredentials({
    authorizationCode,
    logger,
  })

  logger.forBot().info('Successfully authenticated SunCo user')

  await client.setState({ type: 'integration', name: 'credentials', id: ctx.integrationId, payload: credentials })

  const suncoClient = getSuncoClient({ configType: null, ...credentials })
  const globalWebhookUrl = `${new URL(process.env.BP_WEBHOOK_URL!).origin}/integration/global/${INTEGRATION_NAME}`
  const existingWebhooks = await suncoClient.listWebhooks()
  const existingWebhook = existingWebhooks.find((wh) => wh.target === globalWebhookUrl)
  let webhook
  if (existingWebhook?.id) {
    webhook = await suncoClient.updateWebhook(existingWebhook.id, globalWebhookUrl)
  } else {
    webhook = await suncoClient.createWebhook(globalWebhookUrl)
  }
  if (webhook?.id && webhook?.secret) {
    await client.setState({
      type: 'integration',
      name: 'webhook',
      id: ctx.integrationId,
      payload: { id: webhook.id, secret: webhook.secret },
    })
  }

  return generateRedirection(getWizardStepUrl('start', ctx))
}

const _updateConversationOwnerIfNeeded = async (
  suncoClient: ReturnType<typeof getSuncoClient>,
  conversationId: string,
  metadata: Record<string, string> | undefined,
  webhookId: string
) => {
  if (metadata?.botpressIntegrationOwner === webhookId) {
    return
  }
  await suncoClient.updateConversationMetadata(conversationId, { botpressIntegrationOwner: webhookId })
}
