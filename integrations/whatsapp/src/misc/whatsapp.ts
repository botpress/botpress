import { IntegrationContext, z } from '@botpress/sdk'
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
      redirect_uri: `${process.env.BP_WEBHOOK_URL}/integration/global/meta/whatsapp`,
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

  async getWhatsappBusinessesFromToken(inputToken: string): Promise<{ id: string; name: string }[]> {
    const query = new URLSearchParams({
      input_token: inputToken,
      access_token: bp.secrets.ACCESS_TOKEN,
    })

    const { data: dataDebugToken } = await axios.get(
      `https://graph.facebook.com/${this.version}/debug_token?${query.toString()}`
    )

    const businessIds = dataDebugToken.data.granular_scopes.find(
      (item: { scope: string; target_ids: string[] }) => item.scope == 'whatsapp_business_messaging'
    ).target_ids

    const { data: dataBusinesses } = await axios.get(
      `https://graph.facebook.com/${this.version}/?ids=${businessIds.join()}&fields=id,name`,
      {
        headers: {
          Authorization: `Bearer ${inputToken}`,
        },
      }
    )

    return Object.keys(dataBusinesses).map((key) => dataBusinesses[key])
  }

  async getWhatsappNumbersFromBusiness(
    businessId: string,
    accessToken: string
  ): Promise<{ id: string; verifiedName: string }[]> {
    const query = new URLSearchParams({
      access_token: accessToken,
    })

    const { data } = await axios.get(
      `https://graph.facebook.com/${this.version}/${businessId}/phone_numbers?${query.toString()}`
    )

    return data.data.map((item: { id: string; verified_name: string }) => ({
      id: item.id,
      verifiedName: item.verified_name,
    }))
  }

  async registerNumber(numberId: string, accessToken: string) {
    const query = new URLSearchParams({
      access_token: accessToken,
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

  async subscribeToWebhooks(wabaId: string, accessToken: string) {
    try {
      const { data } = await axios.post(
        `https://graph.facebook.com/${this.version}/${wabaId}/subscribed_apps`,
        {},
        {
          headers: {
            Authorization: 'Bearer ' + accessToken,
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

export const getSecret = (ctx: IntegrationContext) => {
  if (ctx.configuration.useManualConfiguration) {
    return ctx.configuration.clientSecret
  }

  return bp.secrets.CLIENT_SECRET
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

export const getOAuthConfigId = () => {
  if (process.env.BP_WEBHOOK_URL?.includes('dev')) {
    return '1535672497288913'
  }

  return '1620101672166859'
}
