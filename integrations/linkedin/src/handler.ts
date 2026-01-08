import { RuntimeError } from '@botpress/sdk'
import { LinkedInOAuthClient } from './linkedin-api'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, client, ctx, logger }) => {
  if (req.path.startsWith('/oauth')) {
    return handleOAuthCallback({ req, client, ctx, logger })
  }

  logger.forBot().warn(`Unhandled request path: ${req.path}`)
  return { status: 404 }
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
  })

  const linkedInUserId = oauthClient.getUserId()
  const grantedScopes = oauthClient.getGrantedScopes()

  logger.forBot().info(`Successfully authenticated LinkedIn user: ${linkedInUserId}`)
  logger.forBot().info(`Granted scopes: ${grantedScopes.join(', ')}`)

  await client.configureIntegration({
    identifier: linkedInUserId,
  })
}
