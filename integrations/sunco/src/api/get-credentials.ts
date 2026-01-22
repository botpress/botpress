import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

const { z } = sdk

const TOKEN_URL = 'https://oauth-bridge.zendesk.com/sc/oauth/token'
const TOKEN_INFO_URL = 'https://oauth-bridge.zendesk.com/sc/v2/tokenInfo'

const MARKETPLACE_BOT_NAME = 'Botpress'
const MARKETPLACE_ORG_ID = '7259'

type ClientCredentials = {
  clientId: string
  clientSecret: string
}

const getTokenSchema = z
  .object({
    access_token: z.string(),
  })
  .passthrough()

const getTokenInfoSchema = z
  .object({
    app: z.object({
      id: z.string(),
      metadata: z.object({
        subdomain: z.string().optional(),
      }),
    }),
  })
  .passthrough()

// export async function formatError(response: Response, action: string): Promise<string> {
//   const headers = extractLinkedInHeaders(response)
//   const responseClone = response.clone()

//   let errorMessage: string
//   try {
//     const parseResult = linkedInErrorResponseSchema.safeParse(await responseClone.json())
//     if (parseResult.success) {
//       const errorData = parseResult.data
//       errorMessage = `${errorData.message ?? 'Unknown error'} (serviceErrorCode: ${errorData.serviceErrorCode ?? 'N/A'})`
//     } else {
//       errorMessage = await response.text()
//     }
//   } catch {
//     errorMessage = await response.text()
//   }

//   return `${action}: ${errorMessage} (x-li-uuid: ${headers['x-li-uuid']}, x-li-request-id: ${headers['x-li-request-id']})`
// }

export const getCredentials = async ({
  authorizationCode,
  logger,
}: {
  authorizationCode: string
  logger: bp.Logger
}): Promise<{
  token: string
  expiryTimestamp: number
  appId: string
  subdomain?: string
}> => {
  const token = await _getToken({ authorizationCode, clientCredentials: _getBotpressClientCredentials(), logger })

  const tokenInfo = await _getTokenInfo({ token, logger })

  // TODO decode token and store expiry
  // const now = new Date()
  // const accessTokenExpiresAt = new Date(now.getTime() + tokenData.expires_in * 1000)

  return { token, expiryTimestamp: 123456, appId: tokenInfo.app.id, subdomain: tokenInfo.app.metadata.subdomain }
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
    headers: {
      'Content-Type': 'application/json',
      'X-Zendesk-Marketplace-Name': MARKETPLACE_BOT_NAME,
      'X-Zendesk-Marketplace-Organization-Id': MARKETPLACE_ORG_ID,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    console.log('error: ', response.json())
    // const errorMsg = await formatError(response, 'Failed to exchange authorization code')
    logger.forBot().error('Failed to exchange authorization code for SunCo token', {
      status: response.status,
    })
    throw new sdk.RuntimeError('failed to get token')
    // throw new sdk.RuntimeError(errorMsg)
  }

  const token = getTokenSchema.parse(await response.json())
  logger.forBot().debug('Successfully obtained SunCo token')

  // TODO decode token and store expiry
  // const now = new Date()
  // const accessTokenExpiresAt = new Date(now.getTime() + tokenData.expires_in * 1000)

  return token.access_token
}

const _getTokenInfo = async ({ token, logger }: { token: string; logger: bp.Logger }) => {
  logger.forBot().debug('Fetching SunCo token info')

  const response = await fetch(TOKEN_INFO_URL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Zendesk-Marketplace-Name': MARKETPLACE_BOT_NAME,
      'X-Zendesk-Marketplace-Organization-Id': MARKETPLACE_ORG_ID,
    },
  })

  if (!response.ok) {
    console.log('error: ', response.json())

    // const errorMsg = await formatError(response, 'Failed to fetch token info')
    logger.forBot().error('Failed to fetch token info', {
      status: response.status,
    })
    throw new sdk.RuntimeError('failed to get token')
    // throw new sdk.RuntimeError(errorMsg)
  }

  const tokenInfo = getTokenInfoSchema.parse(await response.json())
  logger.forBot().debug('Successfully obtained SunCo token info')
  return tokenInfo
}

const _getBotpressClientCredentials = (): ClientCredentials => {
  return {
    clientId: bp.secrets.CLIENT_ID,
    clientSecret: bp.secrets.CLIENT_SECRET,
  }
}
