import { IntegrationContext, Request, z } from '@botpress/sdk'
import axios from 'axios'
import * as bp from '.botpress'

export class MetaOauthClient {
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
      redirect_uri: `${process.env.BP_WEBHOOK_URL}/oauth`,
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

  async getWhatsappBusinessIdFromToken(input_token: string) {
    const query = new URLSearchParams({
      input_token,
      access_token: bp.secrets.ACCESS_TOKEN,
    })

    const { data } = await axios.get(`https://graph.facebook.com/${this.version}/debug_token?${query.toString()}`)

    return data.data.granular_scopes[0].target_ids[0]
  }

  async getWhatsappNumberIdFromBussiness(businessId: string, access_token: string) {
    const query = new URLSearchParams({
      access_token,
    })

    const { data } = await axios.get(
      `https://graph.facebook.com/${this.version}/${businessId}/phone_numbers?${query.toString()}`
    )

    return data.data[0].id
  }

  async registerNumber(numberId: string, access_token: string) {
    const query = new URLSearchParams({
      access_token,
      messaging_product: 'whatsapp',
      pin: bp.secrets.NUMBER_PIN,
    })

    try {
      const { data } = await axios.post(
        `https://graph.facebook.com/${this.version}/${numberId}/register?${query.toString()}`
      )

      if (!data.success) {
        throw new Error('No Success')
      }
    } catch (e: any) {
      this.logger
        .forBot()
        .error(`(OAuth registration) Error registering the provided number Id: ${e.message} -> ${e.response?.data}`)
    }
  }

  async subscribeToWebhooks(wabaId: string, access_token: string) {
    try {
      const { data } = await axios.post(
        `https://graph.facebook.com/${this.version}/${wabaId}/subscribed_apps`,
        {},
        {
          headers: {
            Authorization: 'Bearer ' + access_token,
          },
        }
      )

      if (!data.success) {
        throw new Error('No Success')
      }
    } catch (e: any) {
      this.logger
        .forBot()
        .error(
          `(OAuth registration) Error subscribing to webhooks for WABA ${wabaId}: ${e.message} -> ${e.response?.data}`
        )
    }
  }
}

export const handleOauth = async (req: Request, client: bp.Client, ctx: IntegrationContext, logger: bp.Logger) => {
  const oauthClient = new MetaOauthClient(logger)

  const query = new URLSearchParams(req.query)
  const code = query.get('code')

  if (!code) {
    throw new Error('Handler received an empty code')
  }

  const accessToken = await oauthClient.getAccessToken(code)

  const wabaId = await oauthClient.getWhatsappBusinessIdFromToken(accessToken)

  await client.configureIntegration({
    identifier: wabaId,
  })

  const phoneNumberId = await oauthClient.getWhatsappNumberIdFromBussiness(wabaId, accessToken)

  // For now these will be async since we have a 5 sec timeout on the webhook
  void oauthClient.registerNumber(phoneNumberId, accessToken)
  void oauthClient.subscribeToWebhooks(wabaId, accessToken)

  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: {
      accessToken,
      phoneNumberId,
    },
  })
}

export const getAccessToken = async (client: bp.Client, ctx: IntegrationContext) => {
  if (ctx.configuration.useManualConfiguration) {
    return ctx.configuration.accessToken
  }

  const {
    state: {
      payload: { accessToken },
    },
  } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })

  return accessToken
}

export const getPhoneNumberId = async (client: bp.Client, ctx: IntegrationContext) => {
  if (ctx.configuration.useManualConfiguration) {
    return ctx.configuration.phoneNumberId
  }

  const {
    state: { payload },
  } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
  return payload.phoneNumberId
}
