import { GoogleClient } from 'src/google-api'
import * as bp from '.botpress'

export const oauthCallbackHandler = async ({ client, ctx, req, logger }: bp.HandlerProps) => {
  const searchParams = new URLSearchParams(req.query)
  const authorizationCode = searchParams.get('code')

  if (!authorizationCode) {
    return
  }

  // Note: This handler is deprecated in favor of the OAuth wizard
  // but kept for backward compatibility
  const redirectUri = `${process.env.BP_WEBHOOK_URL}/oauth`

  await GoogleClient.authenticateWithAuthorizationCode({
    client,
    ctx,
    authorizationCode,
    redirectUri,
  })

  await client.configureIntegration({ identifier: ctx.webhookId })

  logger.forBot().info('Successfully authenticated with Google Sheets')
}
