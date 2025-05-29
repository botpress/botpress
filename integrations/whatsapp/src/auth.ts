import { RuntimeError, z } from '@botpress/sdk'
import axios from 'axios'
import { WhatsAppAPI } from 'whatsapp-api-js'
import { WHATSAPP } from './misc/constants'
import { chunkArray } from './misc/util'
import * as bp from '.botpress'

const MAX_BUSINESSES_PER_REQUEST = 50

const getWabaIdsFromTokenResponseSchema = z
  .object({
    data: z.object({
      granular_scopes: z.array(
        z.object({
          scope: z.string(),
          target_ids: z.array(z.string()),
        })
      ),
    }),
  })
  .passthrough()

export class MetaOauthClient {
  private _clientId: string
  private _clientSecret: string
  private _version: string = 'v19.0'

  public constructor(private _logger: bp.Logger) {
    this._clientId = bp.secrets.CLIENT_ID
    this._clientSecret = bp.secrets.CLIENT_SECRET
  }

  public async exchangeAuthorizationCodeForAccessToken(code: string, redirectUri?: string): Promise<string> {
    const query = new URLSearchParams({
      client_id: this._clientId,
      client_secret: this._clientSecret,
      code,
    })

    if (redirectUri) {
      query.append('redirect_uri', redirectUri)
    }

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
    const data = getWabaIdsFromTokenResponseSchema.safeParse(dataDebugToken).data?.data
    if (!data) {
      throw new RuntimeError('Invalid response from API when fetching WhatsApp Business Accounts IDs')
    }

    const businessIds = data.granular_scopes.find((item) => item.scope === 'whatsapp_business_messaging')?.target_ids
    if (!businessIds || businessIds.length === 0) {
      throw new RuntimeError('No WhatsApp Business Account found')
    }

    const dataBusinesses: { id: string; name: string }[] = []
    for (const businessIdsChunk of chunkArray(businessIds, MAX_BUSINESSES_PER_REQUEST)) {
      const { data: dataBusinessesChunk } = await axios.get(
        `https://graph.facebook.com/${this._version}/?ids=${businessIdsChunk.join()}&fields=id,name`,
        {
          headers: {
            Authorization: `Bearer ${inputToken}`,
          },
        }
      )
      Object.keys(dataBusinessesChunk).forEach((key) => dataBusinesses.push(dataBusinessesChunk[key]))
    }

    return dataBusinesses
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
  let accessToken: string | undefined
  if (ctx.configurationType === 'manual') {
    accessToken = ctx.configuration.accessToken
  } else if (ctx.configurationType === 'sandbox') {
    accessToken = bp.secrets.SANDBOX_ACCESS_TOKEN
  } else {
    const { state } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
    accessToken = state.payload.accessToken
  }

  if (!accessToken) {
    throw new RuntimeError('Access token not found in saved credentials')
  }

  return accessToken
}

export const getAuthenticatedWhatsappClient = async (client: bp.Client, ctx: bp.Context): Promise<WhatsAppAPI> => {
  const token = await getAccessToken(client, ctx)
  return new WhatsAppAPI({ token, secure: false, v: WHATSAPP.API_VERSION })
}

export function getVerifyToken(ctx: bp.Context): string {
  // Should normally be verified in the fallbackHandler script with OAuth and Sandbox
  let verifyToken: string
  if (ctx.configurationType === 'manual') {
    verifyToken = ctx.configuration.verifyToken
  } else if (ctx.configurationType === 'sandbox') {
    verifyToken = bp.secrets.SANDBOX_VERIFY_TOKEN
  } else {
    verifyToken = bp.secrets.VERIFY_TOKEN
  }

  return verifyToken
}

export const getClientSecret = (ctx: bp.Context): string | undefined => {
  let value: string | undefined
  if (ctx.configurationType === 'manual') {
    value = ctx.configuration.clientSecret
  } else if (ctx.configurationType === 'sandbox') {
    value = bp.secrets.SANDBOX_CLIENT_SECRET
  } else {
    value = bp.secrets.CLIENT_SECRET
  }

  return value?.length ? value : undefined
}

export const getDefaultBotPhoneNumberId = async (client: bp.Client, ctx: bp.Context) => {
  let defaultBotPhoneNumberId: string | undefined
  if (ctx.configurationType === 'manual') {
    defaultBotPhoneNumberId = ctx.configuration.defaultBotPhoneNumberId
  } else if (ctx.configurationType === 'sandbox') {
    defaultBotPhoneNumberId = bp.secrets.SANDBOX_PHONE_NUMBER_ID
  } else {
    const { state } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
    defaultBotPhoneNumberId = state.payload.defaultBotPhoneNumberId
  }

  if (!defaultBotPhoneNumberId) {
    throw new RuntimeError('Default bot phone number ID not found in saved credentials')
  }
  return defaultBotPhoneNumberId
}
