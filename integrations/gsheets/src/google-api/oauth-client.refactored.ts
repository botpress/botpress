import { GoogleOAuthClient, GenericBpClient } from '@botpress/common/src/google-oauth'
import * as bp from '.botpress'

const OAUTH_SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

const asGenericClient = (client: bp.Client): GenericBpClient => client as unknown as GenericBpClient

export const createGoogleOAuthClient = (ctx: bp.Context) => {
  const serviceAccount =
    ctx.configurationType === 'serviceAccountKey'
      ? {
          clientEmail: ctx.configuration.clientEmail,
          privateKey: ctx.configuration.privateKey,
        }
      : undefined

  return new GoogleOAuthClient({
    scopes: OAUTH_SCOPES,
    stateName: 'oAuthConfig',
    endpointStrategy: { type: 'default' },
    credentials: {
      clientId: bp.secrets.CLIENT_ID,
      clientSecret: bp.secrets.CLIENT_SECRET,
    },
    serviceAccount,
  })
}

export const exchangeAuthCodeAndSaveRefreshToken = async ({
  ctx,
  client,
  authorizationCode,
}: {
  ctx: bp.Context
  client: bp.Client
  authorizationCode: string
}) => {
  const googleOAuth = createGoogleOAuthClient(ctx)
  await googleOAuth.exchangeAuthorizationCode({ ctx, client: asGenericClient(client), authorizationCode })
}

export const getAuthenticatedOAuth2Client = async ({ ctx, client }: { ctx: bp.Context; client: bp.Client }) => {
  const googleOAuth = createGoogleOAuthClient(ctx)
  return googleOAuth.getAuthenticatedClient({ ctx, client: asGenericClient(client) })
}
