import { z } from '@botpress/sdk'
import axios from 'axios'
import { getGlobalWebhookUrl } from '../index'
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

  async getWhatsappBusinessesFromToken(inputToken: string): Promise<{ id: string; name: string }[]> {
    const query = new URLSearchParams({
      input_token: inputToken,
      access_token: bp.secrets.ACCESS_TOKEN,
    })

    const { data: dataDebugToken } = await axios.get(
      `https://graph.facebook.com/${this.version}/debug_token?${query.toString()}`
    )

    const businessIds = dataDebugToken.data.granular_scopes.find(
      (item: { scope: string; target_ids: string[] }) => item.scope === 'whatsapp_business_messaging'
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
  ): Promise<{ id: string; verifiedName: string; displayPhoneNumber: string }[]> {
    const query = new URLSearchParams({
      access_token: accessToken,
    })

    const { data } = await axios.get(
      `https://graph.facebook.com/${this.version}/${businessId}/phone_numbers?${query.toString()}`
    )

    return data.data.map((item: { id: string; verified_name: string; display_phone_number: string }) => ({
      id: item.id,
      verifiedName: item.verified_name,
      displayPhoneNumber: item.display_phone_number,
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
      // 403 -> Number already registered
      if (e.response?.status !== 403) {
        this.logger
          .forBot()
          .error(
            `(OAuth registration) Error registering the provided phone number ID: ${e.message} -> ${JSON.stringify(
              e.response?.data
            )}`
          )
      }
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
      throw new Error('Issue subscribing to Webhooks for WABA, please try again.')
    }
  }
}

export const getAccessToken = async (client: bp.Client, ctx: bp.Context): Promise<string> => {
  if (ctx.configuration.useManualConfiguration) {
    return ctx.configuration.accessToken as string
  }

  const {
    state: {
      payload: { accessToken },
    },
  } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })

  return accessToken as string
}

export const getSecret = (ctx: bp.Context): string | undefined => {
  let value: string | undefined
  if (ctx.configuration.useManualConfiguration) {
    value = ctx.configuration.clientSecret
  } else {
    value = bp.secrets.CLIENT_SECRET
  }

  return value?.length ? value : undefined
}

export const getPhoneNumberId = async (client: bp.Client, ctx: bp.Context) => {
  if (ctx.configuration.useManualConfiguration) {
    return ctx.configuration.phoneNumberId
  }

  const {
    state: { payload },
  } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
  return payload.phoneNumberId
}
