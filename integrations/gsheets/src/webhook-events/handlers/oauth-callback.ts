import { GoogleClient } from 'src/google-api'
import * as bp from '.botpress'

export const oauthCallbackHandler = async ({ client, ctx, req, logger }: bp.HandlerProps) => {
  const searchParams = new URLSearchParams(req.query)
  const authorizationCode = searchParams.get('code')

  if (!authorizationCode) {
    return
  }

  await GoogleClient.authenticateWithAuthorizationCode({
    client,
    ctx,
    authorizationCode,
  })

  logger.forBot().info('Successfully authenticated with Google Sheets')
}
