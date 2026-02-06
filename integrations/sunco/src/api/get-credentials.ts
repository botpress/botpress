import * as sdk from '@botpress/sdk'
import { BASE_HEADERS } from './const'
import * as bp from '.botpress'

const { z } = sdk
const TOKEN_URL = 'https://oauth-bridge.zendesk.com/sc/oauth/token'
const TOKEN_INFO_URL = 'https://oauth-bridge.zendesk.com/sc/v2/tokenInfo'

type ClientCredentials = { clientId: string; clientSecret: string }

const getTokenSchema = z.object({ access_token: z.string() }).passthrough()

const getTokenInfoSchema = z
  .object({ app: z.object({ id: z.string(), subdomain: z.string().optional() }) })
  .passthrough()

export const getCredentials = async ({
  authorizationCode,
  logger,
}: {
  authorizationCode: string
  logger: bp.Logger
}): Promise<{ token: string; appId: string; subdomain?: string }> => {
  const token = await _getToken({ authorizationCode, clientCredentials: _getBotpressClientCredentials(), logger })
  const tokenInfo = await getTokenInfo({ token, logger })
  return { token, appId: tokenInfo.app.id, subdomain: tokenInfo.app.subdomain }
}

const _getToken = async ({
  authorizationCode,
  clientCredentials,
  logger,
}: {
  authorizationCode: string
  clientCredentials: ClientCredentials
  logger: bp.Logger
}): Promise<string> => {
  logger.forBot().debug('Exchanging authorization code for Sunco token')

  const params = {
    grant_type: 'authorization_code',
    code: authorizationCode,
    client_id: clientCredentials.clientId,
    client_secret: clientCredentials.clientSecret,
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify(params),
  })

  const payload = await response.json()

  if (!response.ok) {
    logger.forBot().error('Failed to exchange authorization code for SunCo token', { status: response.status, payload })
    throw new sdk.RuntimeError('failed to get token')
  }

  const token = getTokenSchema.parse(payload)
  logger.forBot().debug('Successfully obtained SunCo token')

  return token.access_token
}

export const getTokenInfo = async ({ token, logger }: { token: string; logger: bp.Logger }) => {
  logger.forBot().debug('Fetching SunCo token info')

  const response = await fetch(TOKEN_INFO_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...BASE_HEADERS,
    },
  })

  const payload = await response.json()
  if (!response.ok) {
    logger.forBot().error('Failed to fetch token info', { status: response.status, payload })
    throw new sdk.RuntimeError('failed to get token')
  }

  const tokenInfo = getTokenInfoSchema.parse(payload)
  logger.forBot().debug('Successfully obtained SunCo token info')
  return tokenInfo
}

const _getBotpressClientCredentials = (): ClientCredentials => {
  return { clientId: bp.secrets.CLIENT_ID, clientSecret: bp.secrets.CLIENT_SECRET }
}
