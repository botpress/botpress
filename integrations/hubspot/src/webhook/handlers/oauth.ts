import { RuntimeError } from '@botpress/sdk'
import { exchangeCodeForOAuthCredentials, setOAuthCredentials } from '../../auth'
import { HubspotClient } from '../../hubspot-api'
import * as bp from '.botpress'

export const oauthCallbackHandler = async (props: bp.HandlerProps) => {
  const { req, client, ctx } = props
  const searchParams = new URLSearchParams(req.query)
  const authorizationCode = searchParams.get('code')

  if (!authorizationCode) {
    throw new RuntimeError('Code not present in OAuth callback request')
  }
  const credentials = await exchangeCodeForOAuthCredentials({ code: authorizationCode })
  await setOAuthCredentials({
    client,
    ctx,
    credentials,
  })

  const hsClient = new HubspotClient({ accessToken: credentials.accessToken, client, ctx })
  const hubId = await hsClient.getHubId()

  await client.configureIntegration({
    identifier: hubId,
  })
}
