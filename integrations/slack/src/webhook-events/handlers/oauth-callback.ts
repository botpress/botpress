import * as sdk from '@botpress/sdk'
import { SlackClient } from 'src/slack-api'
import * as bp from '.botpress'

export const isOAuthCallback = (req: sdk.Request): req is sdk.Request & { path: '/oauth' } => req.path === '/oauth'

export const handleOAuthCallback = async ({ req, client, ctx, logger }: bp.HandlerProps) => {
  logger.forBot().debug('OAuth callback handled in webhook handler, redirecting to end step')
  const query = new URLSearchParams(req.query)
  const code = query.get('code')

  if (!code || typeof code !== 'string') {
    throw new Error('Handler received an empty code')
  }

  const slackClient = await SlackClient.createFromAuthorizationCode({ client, ctx, logger, authorizationCode: code })
  const identifier =
    ctx.configurationType === 'manifestAppCredentials' || ctx.configurationType === 'refreshToken'
      ? slackClient.getBotUserId()
      : slackClient.getTeamId()

  await client.configureIntegration({ identifier })
}
