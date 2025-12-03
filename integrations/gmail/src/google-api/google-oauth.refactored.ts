import * as sdk from '@botpress/sdk'
import {
  GoogleOAuthClient,
  GoogleOAuthClientCredentials,
  OAuthEndpointStrategy,
  GenericBpClient,
} from '@botpress/common/src/google-oauth'
import * as bp from '.botpress'

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
]

const asGenericClient = (client: bp.Client): GenericBpClient => client as unknown as GenericBpClient

const getOAuthConfig = (
  ctx: bp.Context
): { credentials: GoogleOAuthClientCredentials; endpointStrategy: OAuthEndpointStrategy } => {
  if (ctx.configurationType === 'customApp') {
    return {
      credentials: {
        clientId: ctx.configuration.oauthClientId,
        clientSecret: ctx.configuration.oauthClientSecret,
      },
      endpointStrategy: { type: 'custom', endpoint: 'https://botpress.com' },
    }
  }

  return {
    credentials: {
      clientId: bp.secrets.CLIENT_ID,
      clientSecret: bp.secrets.CLIENT_SECRET,
    },
    endpointStrategy: { type: 'default' },
  }
}

export const createGoogleOAuthClient = (ctx: bp.Context) => {
  const { credentials, endpointStrategy } = getOAuthConfig(ctx)

  return new GoogleOAuthClient({
    scopes: GMAIL_SCOPES,
    stateName: 'configuration',
    endpointStrategy,
    credentials,
  })
}

export const getAuthenticatedOAuth2Client = async ({ ctx, client }: { ctx: bp.Context; client: bp.Client }) => {
  const googleOAuth = createGoogleOAuthClient(ctx)
  return googleOAuth.getAuthenticatedClient({ ctx, client: asGenericClient(client) })
}

export const getRefreshToken = async ({ ctx, client }: { ctx: bp.Context; client: bp.Client }) => {
  const googleOAuth = createGoogleOAuthClient(ctx)
  return googleOAuth.getRefreshToken({ ctx, client: asGenericClient(client) })
}

export const saveRefreshToken = async ({
  ctx,
  client,
  refreshToken,
}: {
  ctx: bp.Context
  client: bp.Client
  refreshToken: string
}) => {
  const googleOAuth = createGoogleOAuthClient(ctx)
  await googleOAuth.saveRefreshToken({ ctx, client: asGenericClient(client), refreshToken })
}

export const exchangeAuthorizationCodeForRefreshToken = async ({
  ctx,
  client,
  authorizationCode,
}: {
  ctx: bp.Context
  client: bp.Client
  authorizationCode: string
}) => {
  const googleOAuth = createGoogleOAuthClient(ctx)

  try {
    return await googleOAuth.exchangeAuthorizationCode({ ctx, client: asGenericClient(client), authorizationCode })
  } catch (error) {
    if (ctx.configurationType === 'customApp') {
      throw new sdk.RuntimeError(
        'Unable to exchange authorization code for refresh token: this may be due to an expired authorization code. ' +
          'Please try the OAuth flow again and update the integration settings with the new authorization code.'
      )
    }
    throw error
  }
}
