import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getWizardStepUrl, isOAuthWizardUrl } from '@botpress/common/src/oauth-wizard'
import { RuntimeError } from '@botpress/sdk'
import { getCredentials } from './api/get-credentials'
import { executeConversationCreated, handleConversationMessage } from './events'
import { getWebhookSecret } from './get-stored-credentials'
import { isSuncoWebhookPayload, isWebhookSignatureValid } from './messaging-events'
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

  for (const event of data.events) {
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

  await client.configureIntegration({
    identifier: credentials.appId,
  })

  await client.setState({ type: 'integration', name: 'credentials', id: ctx.integrationId, payload: credentials })

  return generateRedirection(getWizardStepUrl('start', ctx))
}
