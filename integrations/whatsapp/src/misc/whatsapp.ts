import { z } from '@botpress/sdk'
import axios from 'axios'
import { getGlobalWebhookUrl } from '../index'
import * as bp from '.botpress'

export class MetaOauthClient {
  private _clientId: string
  private _clientSecret: string
  private _version: string = 'v19.0'

  public constructor(private _logger: bp.Logger) {
    this._clientId = bp.secrets.CLIENT_ID
    this._clientSecret = bp.secrets.CLIENT_SECRET
  }

  public async getAccessToken(code: string, redirectUri?: string): Promise<string> {
    const query = new URLSearchParams({
      client_id: this._clientId,
      client_secret: this._clientSecret,
      redirect_uri: redirectUri ?? getGlobalWebhookUrl(),
      code,
    })

    const res = await axios.get(`https://graph.facebook.com/${this._version}/oauth/access_token?${query.toString()}`)
    const data = z
      .object({
        access_token: z.string(),
      })
      .parse(res.data)

    return data.access_token
  }

  public async getWhatsappBusinessesFromToken(inputToken: string): Promise<{ id: string; name: string }[]> {
    const query = new URLSearchParams({
      input_token: inputToken,
      access_token: bp.secrets.ACCESS_TOKEN,
    })

    const { data: dataDebugToken } = await axios.get(
      `https://graph.facebook.com/${this._version}/debug_token?${query.toString()}`
    )

    const businessIds = dataDebugToken.data.granular_scopes.find(
      (item: { scope: string; target_ids: string[] }) => item.scope === 'whatsapp_business_messaging'
    ).target_ids

    const { data: dataBusinesses } = await axios.get(
      `https://graph.facebook.com/${this._version}/?ids=${businessIds.join()}&fields=id,name`,
      {
        headers: {
          Authorization: `Bearer ${inputToken}`,
        },
      }
    )

    return Object.keys(dataBusinesses).map((key) => dataBusinesses[key])
  }

  public async getWhatsappNumbersFromBusiness(
    businessId: string,
    accessToken: string
  ): Promise<{ id: string; verifiedName: string; displayPhoneNumber: string }[]> {
    const query = new URLSearchParams({
      access_token: accessToken,
    })

    const { data } = await axios.get(
      `https://graph.facebook.com/${this._version}/${businessId}/phone_numbers?${query.toString()}`
    )

    return data.data.map((item: { id: string; verified_name: string; display_phone_number: string }) => ({
      id: item.id,
      verifiedName: item.verified_name,
      displayPhoneNumber: item.display_phone_number,
    }))
  }

  public async registerNumber(numberId: string, accessToken: string) {
    const query = new URLSearchParams({
      access_token: accessToken,
      messaging_product: 'whatsapp',
      pin: bp.secrets.NUMBER_PIN,
    })

    try {
      const { data } = await axios.post(
        `https://graph.facebook.com/${this._version}/${numberId}/register?${query.toString()}`
      )

      if (!data.success) {
        throw new Error('No Success')
      }
    } catch (e: any) {
      // 403 -> Number already registered
      if (e.response?.status !== 403) {
        this._logger
          .forBot()
          .error(
            `(OAuth registration) Error registering the provided phone number ID: ${e.message} -> ${JSON.stringify(
              e.response?.data
            )}`
          )
      }
    }
  }

  public async subscribeToWebhooks(wabaId: string, accessToken: string) {
    try {
      const { data } = await axios.post(
        `https://graph.facebook.com/${this._version}/${wabaId}/subscribed_apps`,
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
      this._logger
        .forBot()
        .error(
          `(OAuth registration) Error subscribing to webhooks for WABA ${wabaId}: ${e.message} -> ${e.response?.data}`
        )
      throw new Error('Issue subscribing to Webhooks for WABA, please try again.')
    }
  }
}

export const getAccessToken = async (client: bp.Client, ctx: bp.Context): Promise<string> => {
  if (ctx.configurationType === 'manualApp') {
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
  if (ctx.configurationType === 'manualApp') {
    value = ctx.configuration.clientSecret
  } else {
    value = bp.secrets.CLIENT_SECRET
  }

  return value?.length ? value : undefined
}

export const getPhoneNumberId = async (client: bp.Client, ctx: bp.Context) => {
  if (ctx.configurationType === 'manualApp') {
    return ctx.configuration.phoneNumberId
  }

  const {
    state: { payload },
  } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
  return payload.phoneNumberId
}
