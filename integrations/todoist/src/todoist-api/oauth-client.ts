import sdk, { z } from '@botpress/sdk'
import * as bp from '.botpress'

export const exchangeAuthCodeAndSaveRefreshToken = async ({
  ctx,
  client,
  authorizationCode,
}: {
  ctx: bp.Context
  client: bp.Client
  authorizationCode: string
}) => {
  const accessToken = await _exchangeAuthCode({ authorizationCode })

  if (!accessToken) {
    throw new sdk.RuntimeError('Unable to obtain refresh token. Please try the OAuth flow again.')
  }

  await client.setState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'credentials',
    payload: { accessToken },
  })
}

export const getAccessToken = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }) =>
  ctx.configurationType === 'apiToken' ? ctx.configuration.apiToken : await _getOAuthAccessToken({ client, ctx })

async function _getOAuthAccessToken({ client, ctx }: { client: bp.Client; ctx: bp.Context }) {
  const { state } = await client.getState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
  })

  return state.payload.accessToken
}

const _exchangeAuthCode = async ({ authorizationCode }: { authorizationCode: string }) => {
  const response = await fetch('https://todoist.com/oauth/access_token', {
    method: 'POST',
    body: JSON.stringify({
      client_id: bp.secrets.CLIENT_ID,
      client_secret: bp.secrets.CLIENT_SECRET,
      code: authorizationCode,
    }),
    headers: { 'Content-Type': 'application/json' },
  })

  const { access_token } = z.object({ access_token: z.string() }).parse(await response.json())

  return access_token
}
