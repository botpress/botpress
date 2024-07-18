import { z } from '@botpress/sdk'
// eslint-disable-next-line no-duplicate-imports
import type { IntegrationContext, Request, Response } from '@botpress/sdk'
import axios from 'axios'
import * as bp from '.botpress'

export class MessengerOauthClient {
  private clientId: string
  private clientSecret: string

  constructor() {
    this.clientId = bp.secrets.CLIENT_ID
    this.clientSecret = bp.secrets.CLIENT_SECRET
  }

  async getAccessToken(code: string) {
    const query = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: `${process.env.BP_WEBHOOK_URL}/oauth`,
      code,
    })

    const res = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token?${query.toString()}`)

    const data = z
      .object({
        access_token: z.string(),
      })
      .parse(res.data)

    return data.access_token
  }
}

export async function handleOAuthRedirect(req: Request, client: bp.Client, ctx: IntegrationContext): Promise<Response> {
  const oauthClient = new MessengerOauthClient()

  const query = new URLSearchParams(req.query)
  const code = query.get('code')

  if (!code) {
    throw new Error('Handler received an empty code')
  }

  const accessToken = await oauthClient.getAccessToken(code)

  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: {
      accessToken,
    },
  })

  // TODO: Get identifier from token and set
  /*await client.configureIntegration({
    identifier: ctx.configuration.pageId, // This should match the identifier obtained by the extract.vrl script
  })*/

  return { status: 200 }
}

export async function getCredentials(client: bp.Client, ctx: IntegrationContext): Promise<{accessToken: string; clientSecret: string; clientId: string}> {
  if (ctx.configuration.useManualConfiguration) {
    // Use access token from configuration if manual configuration is enabled
    return ctx.configuration
  }

  // Otherwise use the access token obtained from the OAuth flow and stored in the state
  const { state } = await client.getState({ type: 'integration', name: 'oauth', id: ctx.integrationId })

  return { accessToken: state.payload.accessToken, clientSecret: bp.secrets.CLIENT_SECRET, clientId: bp.secrets.CLIENT_ID }
}
