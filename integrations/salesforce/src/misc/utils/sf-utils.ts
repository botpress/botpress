import axios from 'axios'
import { OAuth2, Connection } from 'jsforce'
import { getBotpressWebhookUrl, getSfCredentials } from './bp-utils'
import * as bp from '.botpress'

export const getOAuth2 = (ctx: bp.Context): OAuth2 => {
  return new OAuth2({
    clientId: bp.secrets.CONSUMER_KEY,
    clientSecret: bp.secrets.CONSUMER_SECRET,
    redirectUri: `${getBotpressWebhookUrl()}/oauth`,
    loginUrl: getEnvironmentUrl(ctx),
  })
}

export const getConnection = async (client: bp.Client, ctx: bp.Context, logger: bp.Logger): Promise<Connection> => {
  let sfCredentials: bp.states.credentials.Credentials['payload']

  try {
    sfCredentials = await getSfCredentials(client, ctx.integrationId)
  } catch (e) {
    const errorMsg = `Error fetching Salesforce credentials: ${JSON.stringify(e)}`
    logger.forBot().info(errorMsg)
    throw new Error(errorMsg)
  }

  const { accessToken, instanceUrl, refreshToken, isSandbox } = sfCredentials

  const connection = new Connection({
    oauth2: getOAuth2(ctx),
    instanceUrl,
    accessToken,
    refreshToken,
  })

  //When access token is refreshed, update it in the state
  connection.on('refresh', (newAccessToken: string) => {
    client
      .setState({
        type: 'integration',
        name: 'credentials',
        id: ctx.integrationId,
        payload: {
          isSandbox,
          accessToken: newAccessToken,
          instanceUrl,
          refreshToken,
        },
      })
      .catch((thrown: unknown) => {
        const msg = thrown instanceof Error ? thrown.message : String(thrown)
        console.error('Error updating Salesforce credentials:', msg)
      })
  })

  return connection
}

export const refreshSfToken = async (client: bp.Client, ctx: bp.Context): Promise<void> => {
  const url = `${getEnvironmentUrl(ctx)}/services/oauth2/token`
  const sfCredentials = await getSfCredentials(client, ctx.integrationId)

  if (!sfCredentials.refreshToken) {
    throw new Error('No refresh token available. Please re-authenticate with Salesforce.')
  }

  const params = new URLSearchParams()
  params.append('grant_type', 'refresh_token')
  params.append('client_id', bp.secrets.CONSUMER_KEY)
  params.append('client_secret', bp.secrets.CONSUMER_SECRET)
  params.append('refresh_token', sfCredentials.refreshToken)

  try {
    const response = await axios.post(url, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    await client.setState({
      type: 'integration',
      name: 'credentials',
      id: ctx.integrationId,
      payload: {
        isSandbox: sfCredentials.isSandbox,
        accessToken: response.data.access_token,
        instanceUrl: sfCredentials.instanceUrl,
        refreshToken: sfCredentials.refreshToken,
      },
    })
  } catch (error) {
    console.error('Error refreshing token:', error)
    throw new Error(`Error refreshing Salesforce token: ${JSON.stringify(error)}`)
  }
}

export const getRequestPayload = <T extends { customFields?: string }>(input: T): T & Record<string, any> => {
  const customFields: Record<string, any> = input.customFields ? JSON.parse(input.customFields) : {}

  const payload = {
    ...input,
    ...customFields,
  }
  delete payload.customFields

  return payload
}

export const getEnvironmentUrl = (ctx: bp.Context): string => {
  return ctx.configurationType === 'sfsandbox' ? 'https://test.salesforce.com' : 'https://login.salesforce.com'
}
