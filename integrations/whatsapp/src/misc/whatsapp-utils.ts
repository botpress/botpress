import { RuntimeError } from '@botpress/sdk'
import axios from 'axios'
import WhatsAppAPI from 'whatsapp-api-js'
import { getAccessToken } from '../auth'
import * as bp from '.botpress'

const WHATSAPP_API_VERSION = 'v22.0'
const WHATSAPP_API_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`

export async function getMediaUrl(whatsappMediaId: string, client: bp.Client, ctx: bp.Context): Promise<string> {
  const accessToken = await getAccessToken(client, ctx)
  const whatsapp = new WhatsAppAPI({ token: accessToken, secure: false })
  const media = await whatsapp.retrieveMedia(whatsappMediaId)
  if (!('url' in media)) {
    throw new RuntimeError(`Failed to retrieve media URL for media ID "${whatsappMediaId}": ${media.error.message}`)
  }
  return media.url
}

export async function sendTypingIndicator(
  phoneNumberId: string,
  messageId: string,
  client: bp.Client,
  ctx: bp.Context
) {
  await axios.post(
    `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      status: 'read',
      recipient_type: 'individual',
      message_id: messageId,
      typing_indicator: {
        type: 'text',
      },
    },
    {
      headers: {
        Authorization: `Bearer ${await getAccessToken(client, ctx)}`,
      },
    }
  )
}
