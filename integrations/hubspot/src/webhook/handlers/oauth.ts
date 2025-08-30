import { RuntimeError } from '@botpress/sdk'
import { exchangeCodeForOAuthCredentials, getAuthenticatedHubspotClient, setOAuthCredentials } from '../../auth'
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

  const hsClient = await getAuthenticatedHubspotClient({ client, ctx })
  const { hubId } = await hsClient.oauth.accessTokensApi.get(credentials.accessToken)

  await client.configureIntegration({
    identifier: hubId.toString(),
  })
}
