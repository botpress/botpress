import { GoogleOAuthClient, GenericBpClient } from '@botpress/common/src/google-oauth'
import { google } from 'googleapis'
import { GoogleDriveClient } from './types'
import * as bp from '.botpress'

const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
]

const asGenericClient = (client: bp.Client): GenericBpClient => client as unknown as GenericBpClient

export const createGoogleOAuthClient = () => {
  return new GoogleOAuthClient({
    scopes: OAUTH_SCOPES,
    stateName: 'configuration',
    endpointStrategy: { type: 'wizard', stepName: 'oauth-callback' },
    credentials: {
      clientId: bp.secrets.CLIENT_ID,
      clientSecret: bp.secrets.CLIENT_SECRET,
    },
  })
}

export const getAuthenticatedGoogleClient = async ({
  client,
  ctx,
}: {
  client: bp.Client
  ctx: bp.Context
}): Promise<GoogleDriveClient> => {
  const googleOAuth = createGoogleOAuthClient()
  const oauth2Client = await googleOAuth.getAuthenticatedClient({ ctx, client: asGenericClient(client) })

  return google.drive({ version: 'v3', auth: oauth2Client })
}

export const getAccessToken = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }) => {
  const googleOAuth = createGoogleOAuthClient()
  return googleOAuth.getAccessToken({ ctx, client: asGenericClient(client) })
}

export const updateRefreshTokenFromAuthorizationCode = async ({
  authorizationCode,
  client,
  ctx,
}: {
  authorizationCode: string
  client: bp.Client
  ctx: bp.Context
}): Promise<string> => {
  const googleOAuth = createGoogleOAuthClient()
  return googleOAuth.exchangeAuthorizationCode({ ctx, client: asGenericClient(client), authorizationCode })
}
