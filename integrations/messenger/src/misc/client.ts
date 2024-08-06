import { IntegrationContext, z } from '@botpress/sdk'
import axios from 'axios'
import { getGlobalWebhookUrl } from '../index'
import * as bp from '.botpress'

export class MetaClient {
  private clientId: string
  private clientSecret: string
  private version: string = 'v19.0'

  constructor(private logger: bp.Logger) {
    this.clientId = bp.secrets.CLIENT_ID
    this.clientSecret = bp.secrets.CLIENT_SECRET
  }

  async getAccessToken(code: string) {
    const query = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: getGlobalWebhookUrl(),
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

  async getFacebookPagesFromToken(inputToken: string): Promise<{ id: string; name: string }[]> {
    const query = new URLSearchParams({
      input_token: inputToken,
      access_token: bp.secrets.ACCESS_TOKEN,
    })

    console.log({inputToken})

    const { data: dataDebugToken } = await axios.get(
      `https://graph.facebook.com/${this.version}/debug_token?${query.toString()}`
    )

    const ids = dataDebugToken.data.granular_scopes.find(
      (item: { scope: string; target_ids: string[] }) => item.scope === 'pages_messaging'
    ).target_ids

    const { data: dataBusinesses } = await axios.get(
      `https://graph.facebook.com/${this.version}/?ids=${ids.join()}&fields=id,name`,
      {
        headers: {
          Authorization: `Bearer ${inputToken}`,
        },
      }
    )

    return Object.keys(dataBusinesses).map((key) => dataBusinesses[key])
  }
}

export const getPageId = async (client: bp.Client, ctx: IntegrationContext) => {
  if (ctx.configuration.useManualConfiguration) {
    return ctx.configuration.pageId
  }

  const {
    state: { payload },
  } = await client.getState({ type: 'integration', name: 'oauth', id: ctx.integrationId })
  return payload.pageId
}

export async function getCredentials(client: bp.Client, ctx: IntegrationContext): Promise<{accessToken: string; clientSecret: string; clientId: string}> {
  if (ctx.configuration.useManualConfiguration) {
    // Use access token from configuration if manual configuration is enabled
    return ctx.configuration
  }

  // Otherwise use the access token obtained from the OAuth flow and stored in the state
  const { state } = await client.getState({ type: 'integration', name: 'oauth', id: ctx.integrationId })

  if(!state.payload.accessToken) {
    throw new Error('There is no access token, please reauthorize')
  }

  return { accessToken: state.payload.accessToken, clientSecret: bp.secrets.CLIENT_SECRET, clientId: bp.secrets.CLIENT_ID }
}
