import * as sdk from '@botpress/sdk'
import { google } from 'googleapis'
import * as bp from '.botpress'

type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>

const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
]
const GLOBAL_OAUTH_ENDPOINT = `${process.env.BP_WEBHOOK_URL}/oauth`

export const exchangeAuthCodeAndSaveRefreshToken = async ({
  ctx,
  client,
  authorizationCode,
}: {
  ctx: bp.Context
  client: bp.Client
  authorizationCode: string
}) => {
  const oauth2Client = _getPlainOAuth2Client()

  const { tokens } = await oauth2Client.getToken({
    code: authorizationCode,
  })

  if (!tokens.refresh_token) {
    throw new sdk.RuntimeError('Unable to obtain refresh token. Please try the OAuth flow again.')
  }

  await client.setState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'oAuthConfig',
    payload: { refreshToken: tokens.refresh_token },
  })
}

export const getAuthenticatedOAuth2Client = async ({
  ctx,
  client,
}: {
  ctx: bp.Context
  client: bp.Client
}): Promise<GoogleOAuth2Client> => {
  if (ctx.configurationType === 'serviceAccountKey') {
    return new google.auth.JWT({
      email: ctx.configuration.clientEmail,
      key: ctx.configuration.privateKey.split(String.raw`\n`).join('\n'),
      scopes: OAUTH_SCOPES,
    })
  }

  const oauth2Client = _getPlainOAuth2Client()

  const { state } = await client.getState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'oAuthConfig',
  })

  oauth2Client.setCredentials({ refresh_token: state.payload.refreshToken })
  return oauth2Client
}

const _getPlainOAuth2Client = (): GoogleOAuth2Client =>
  new google.auth.OAuth2(bp.secrets.CLIENT_ID, bp.secrets.CLIENT_SECRET, GLOBAL_OAUTH_ENDPOINT)
