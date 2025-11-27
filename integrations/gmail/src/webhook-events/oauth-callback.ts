import { GoogleClient } from '../google-api'
import * as bp from '.botpress'

export const handleOAuthCallback = async ({ req, client, ctx }: bp.HandlerProps) => {
  const searchParams = new URLSearchParams(req.query)
  const authorizationCode = searchParams.get('code')

  if (!authorizationCode) {
    console.error('Error extracting code from url')
    return
  }

  const googleClient = await GoogleClient.createFromAuthorizationCode({
    client,
    ctx,
    authorizationCode,
  })

  const userEmail = await googleClient.getMyEmail()

  if (!userEmail) {
    console.error('Error extracting email from profile')
    return
  }

  await client.configureIntegration({
    identifier: userEmail,
  })
}
