import { RuntimeError } from '@botpress/sdk'
import * as crypto from 'crypto'
import { LinkedInOAuthClient } from './linkedin-api'
import { verifyLinkedInWebhook, dispatchWebhookEvent } from './webhook'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, logger } = props

  try {
    if (req.path.startsWith('/oauth')) {
      return await handleOAuthCallback(props)
    }

    if (isWebhookChallenge(req)) {
      return handleWebhookChallenge(props)
    }

    if (req.method === 'POST') {
      const isValid = verifyLinkedInWebhook(props)
      if (!isValid) {
        logger.forBot().error('Webhook signature verification failed')
        return { status: 403 }
      }

      return await dispatchWebhookEvent(props)
    }

    logger.forBot().warn(`Unhandled request: ${req.method} ${req.path}`)
    return { status: 404 }
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().error(`LinkedIn handler failed with error: ${error}`)
    throw thrown
  }
}

const isWebhookChallenge = (req: bp.HandlerProps['req']): boolean => {
  const params = new URLSearchParams(req.query)
  return params.has('challengeCode') && req.method === 'GET'
}

const handleWebhookChallenge = ({ req, ctx, logger }: bp.HandlerProps) => {
  const params = new URLSearchParams(req.query)
  const challengeCode = params.get('challengeCode')

  if (!challengeCode) {
    return { status: 400, body: 'Missing challengeCode' }
  }

  logger.forBot().info('Responding to LinkedIn webhook challenge')

  const clientSecret = ctx.configurationType === 'manual' ? ctx.configuration.clientSecret : bp.secrets.CLIENT_SECRET
  const challengeResponse = crypto.createHmac('sha256', clientSecret).update(challengeCode).digest('hex')

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeCode,
      challengeResponse,
    }),
  }
}

const handleOAuthCallback = async ({ req, client, ctx, logger }: bp.HandlerProps) => {
  logger.forBot().debug('Handling OAuth callback')

  const searchParams = new URLSearchParams(req.query)
  const authorizationCode = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    logger.forBot().error(`LinkedIn OAuth error: ${error} - ${errorDescription}`)
    throw new RuntimeError(`LinkedIn OAuth error: ${error} - ${errorDescription}`)
  }

  if (!authorizationCode) {
    logger.forBot().error('Authorization code not present in OAuth callback')
    throw new RuntimeError('Authorization code not present in OAuth callback')
  }

  const oauthClient = await LinkedInOAuthClient.createFromAuthorizationCode({
    authorizationCode,
    client,
    ctx,
    logger,
  })

  const linkedInUserId = oauthClient.getUserId()
  const grantedScopes = oauthClient.getGrantedScopes()

  logger.forBot().info(`Successfully authenticated LinkedIn user: ${linkedInUserId}`)
  logger.forBot().info(`Granted scopes: ${grantedScopes.join(', ')}`)

  await client.configureIntegration({
    identifier: linkedInUserId,
  })

  return { status: 200 }
}
