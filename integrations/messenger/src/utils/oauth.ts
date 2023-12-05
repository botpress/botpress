import type { IntegrationContext, Request, Response } from '@botpress/sdk'
import axios from 'axios'
import z from 'zod'
import * as bp from '.botpress'

export class MessengerOauthClient {
  private clientId: string
  private clientSecret: string

  constructor() {
    this.clientId = bp.secrets.APP_ID
    this.clientSecret = bp.secrets.APP_SECRET
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

  if (typeof code !== 'string') {
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

  await client.configureIntegration({
    identifier: ctx.configuration.pageId, // This should match the identifier obtained by the extract.vrl script
  })

  return { status: 200 }
}

export async function getAccessToken(client: bp.Client, ctx: IntegrationContext) {
  if (ctx.configuration.accessToken) {
    // Use access token from configuration if available
    return ctx.configuration.accessToken
  }

  // Otherwise use the access token obtained from the OAuth flow and stored in the state
  const { state } = await client.getState({ type: 'integration', name: 'oauth', id: ctx.integrationId })

  return state.payload.accessToken
}
