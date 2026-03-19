import { RuntimeError } from '@botpress/sdk'
import { exchangeCodeForOAuthCredentials, setOAuthCredentials } from '../../auth'
import * as bp from '.botpress'

export const isOAuthCallback = (props: bp.HandlerProps): boolean => props.req.path.startsWith('/oauth')

export const handleOAuthCallback: bp.IntegrationProps['handler'] = async ({ client, ctx, req }) => {
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

  await client.configureIntegration({
    identifier: ctx.webhookId,
  })
}
