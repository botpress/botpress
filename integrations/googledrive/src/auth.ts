import * as sdk from '@botpress/sdk'
import { google } from 'googleapis'
import { GoogleOAuth2Client, GoogleDriveClient } from './types'
import * as bp from '.botpress'

const GLOBAL_OAUTH_ENDPOINT = `${process.env.BP_WEBHOOK_URL}/oauth` as const

export const getAuthenticatedGoogleClient = async ({
  client,
  ctx,
}: {
  client: bp.Client
  ctx: bp.Context
}): Promise<GoogleDriveClient> => {
  const token = await getRefreshTokenFromStates({ client, ctx })

  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({ refresh_token: token })

  return google.drive({ version: 'v3', auth: oauth2Client })
}

export const getOAuthClient = (): GoogleOAuth2Client => {
  return new google.auth.OAuth2(bp.secrets.CLIENT_ID, bp.secrets.CLIENT_SECRET, GLOBAL_OAUTH_ENDPOINT)
}

/**
 * @return The updated refresh token
 */
export const updateRefreshTokenFromAuthorizationCode = async ({
  authorizationCode,
  client,
  ctx,
}: {
  authorizationCode: string
  client: bp.Client
  ctx: bp.Context
}): Promise<string> => {
  const refreshToken = await exchangeAuthorizationCodeForRefreshToken(authorizationCode)
  await saveRefreshTokenIntoStates({ client, ctx, refreshToken })
  return refreshToken
}

const getRefreshTokenFromStates = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }) => {
  const { state } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  return state.payload.refreshToken
}

const saveRefreshTokenIntoStates = async ({
  client,
  ctx,
  refreshToken,
}: {
  client: bp.Client
  ctx: bp.Context
  refreshToken: string
}) => {
  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { refreshToken },
  })
}

const exchangeAuthorizationCodeForRefreshToken = async (authorizationCode: string) => {
  const oauth2Client = getOAuthClient()
  const { tokens } = await oauth2Client.getToken({
    code: authorizationCode,
  })

  if (!tokens.refresh_token) {
    throw new sdk.RuntimeError('Unable to obtain refresh token. Please try the OAuth flow again.')
  }

  return tokens.refresh_token
}
