import { z } from '@botpress/sdk'
// eslint-disable-next-line no-duplicate-imports
import type { IntegrationContext, Request, Response } from '@botpress/sdk'
import axios from 'axios'
import * as bp from '.botpress'

export class MessengerOauthClient {
  private clientId: string
  private clientSecret: string
  private accessToken: string
  private version: string = 'v19.0'

  constructor() {
    this.clientId = bp.secrets.CLIENT_ID
    this.clientSecret = bp.secrets.CLIENT_SECRET
    this.accessToken = bp.secrets.ACCESS_TOKEN
  }

  async getAccessToken(code: string) {
    const query = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: 'https://webhook.botpress.dev/87616b28-2c74-4572-bb16-211b349d54b2', //`${process.env.BP_WEBHOOK_URL}/oauth`,
      code,
    })

    const res = await axios.get(`https://graph.facebook.com/${this.version}/oauth/access_token?${query.toString()}`)

    const data = z
      .object({
        access_token: z.string(),
      })
      .parse(res.data)

    return data.access_token
  }

  async getPagesFromToken(inputToken: string): Promise<string[]> {
    const query = new URLSearchParams({
      input_token: inputToken,
      access_token: this.accessToken,
    })

    const { data } = await axios.get(`https://graph.facebook.com/${this.version}/debug_token?${query.toString()}`)

    const scope = data.data.granular_scopes.find((item: { scope: string; target_ids: string[] }) => item.scope === 'pages_messaging')

    /*if(scope?.target_ids?.length !== 1) {
      throw new Error('You need to select one, and only one page')
    }*/

    return scope.target_ids
  }
}

export async function handleOAuthRedirectAndGetPages(req: Request, client: bp.Client, ctx: IntegrationContext): Promise<string[]> {
  const oauthClient = new MessengerOauthClient()

  const query = new URLSearchParams(req.query)
  const code = query.get('code')

  console.log({ code})

  if (!code) {
    throw new Error('Handler received an empty code')
  }

  const accessToken = await oauthClient.getAccessToken(code)

  console.log(accessToken)

  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: {
      accessToken,
    },
  })

  await client.configureIntegration({
    identifier: 'temp-indentifier', // This should match the identifier obtained by the extract.vrl script
  })

  return await oauthClient.getPagesFromToken(accessToken)
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
