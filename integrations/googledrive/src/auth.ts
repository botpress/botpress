import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import * as sdk from '@botpress/sdk'
import { google } from 'googleapis'
import { GoogleOAuth2Client, GoogleDriveClient } from './types'
import * as bp from '.botpress'

export const getAuthenticatedGoogleClient = async ({
  client,
  ctx,
}: {
  client: bp.Client
  ctx: bp.Context
}): Promise<GoogleDriveClient> => {
  const oauth2Client = await _getAuthenticatedOAuthClient({ client, ctx })

  return google.drive({ version: 'v3', auth: oauth2Client })
}

export const getAccessToken = async (props: { client: bp.Client; ctx: bp.Context }) => {
  const oauth2Client = await _getAuthenticatedOAuthClient(props)
  const { token } = await oauth2Client.getAccessToken()

  if (!token) {
    throw new sdk.RuntimeError('Unable to obtain access token. Please try the OAuth flow again.')
  }
  return token
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
  await _saveRefreshTokenIntoStates({ client, ctx, refreshToken })
  return refreshToken
}

const _getAuthenticatedOAuthClient = async ({
  client,
  ctx,
}: {
  client: bp.Client
  ctx: bp.Context
}): Promise<GoogleOAuth2Client> => {
  const token = await _getRefreshTokenFromStates({ client, ctx })

  const oauth2Client = _getOAuthClient()
  oauth2Client.setCredentials({ refresh_token: token })

  return oauth2Client
}

const _getOAuthClient = (): GoogleOAuth2Client =>
  new google.auth.OAuth2(
    bp.secrets.CLIENT_ID,
    bp.secrets.CLIENT_SECRET,
    oauthWizard.getWizardStepUrl('oauth-callback').href
  )

const _getRefreshTokenFromStates = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }) => {
  const { state } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  return state.payload.refreshToken
}

const _saveRefreshTokenIntoStates = async ({
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
  const oauth2Client = _getOAuthClient()
  const { tokens } = await oauth2Client.getToken({
    code: authorizationCode,
  })

  if (!tokens.refresh_token) {
    throw new sdk.RuntimeError('Unable to obtain refresh token. Please try the OAuth flow again.')
  }

  return tokens.refresh_token
}
