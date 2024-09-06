import * as bp from '.botpress'
import { IntegrationContext, Request, RuntimeError } from '@botpress/sdk'
import { Client } from './client'
import queryString from 'query-string'
import axios from 'axios'

export const NO_ACCESS_TOKEN_ERROR =
  'No access token found. Please authenticate with Todoist first or manually set an access token.'

export async function handleOAuth(req: Request, client: bp.Client, ctx: IntegrationContext) {
  const { code } = queryString.parse(req.query)
  if (typeof code !== 'string') {
    throw new RuntimeError('Invalid OAuth code received from Todoist')
  }

  const response = await axios.post('https://todoist.com/oauth/access_token', {
    client_id: bp.secrets.CLIENT_ID,
    client_secret: bp.secrets.CLIENT_SECRET,
    code,
  })

  const { access_token } = response.data
  if (!access_token || typeof access_token !== 'string') {
    throw new RuntimeError('Invalid access token received from Todoist')
  }

  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: {
      accessToken: access_token,
    },
  })

  const userId = await new Client(access_token).getUserId()
  client.configureIntegration({
    identifier: userId,
  })

  await client.updateUser({ 
    id: ctx.botUserId,
    tags: {
      id: userId,
    },
  })

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: {
      botUserId: userId,
    },
  })
}

/**
 * @returns Manually set API token if defined, else OAuth token. Undefined if not found or empty.
 */
export async function getAccessToken(client: bp.Client, ctx: IntegrationContext): Promise<string | undefined> {
  if (ctx.configuration.apiToken) {
    return ctx.configuration.apiToken
  }
  return getOAuthAccessToken(client, ctx)
}

/**
 * @returns OAuth access token or undefined if not found or empty
 */
async function getOAuthAccessToken(client: bp.Client, ctx: IntegrationContext): Promise<string | undefined> {
  const { state } = await client.getState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
  })

  return state.payload.accessToken || undefined
}
