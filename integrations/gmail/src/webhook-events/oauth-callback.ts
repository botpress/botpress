import { GoogleClient } from '../google-api'
import * as bp from '.botpress'

export const handleOAuthCallback = async ({ req, client, ctx }: bp.HandlerProps) => {
  const searchParams = new URLSearchParams(req.query)
  const authorizationCode = searchParams.get('code')

  if (!authorizationCode) {
    console.error('Error extracting code from url')
    return
  }

  console.info('code', authorizationCode)

  const googleClient = await GoogleClient.createFromAuthorizationCode({
    client,
    ctx,
    authorizationCode,
  })

  const userEmail = await googleClient.getMyEmail()
  console.info('userEmail', userEmail)

  if (!userEmail) {
    console.error('Error extracting email from profile')
    return
  }

  console.info('configureIntegration')
  await client.configureIntegration({
    identifier: userEmail,
  })

  await googleClient.watchIncomingMail()
}
