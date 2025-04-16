import WhatsAppAPI from 'whatsapp-api-js'
import { ServerErrorResponse, ServerMediaRetrieveResponse } from 'whatsapp-api-js/types'
import { getAccessToken } from '../auth'
import * as bp from '.botpress'

export async function getWhatsAppMediaUrl(
  whatsappMediaId: string,
  client: bp.Client,
  ctx: bp.Context
): Promise<string> {
  const accessToken = await getAccessToken(client, ctx)
  const whatsapp = new WhatsAppAPI({ token: accessToken, secure: false })
  const media = await whatsapp.retrieveMedia(whatsappMediaId)
  return (media as Exclude<ServerMediaRetrieveResponse, ServerErrorResponse>).url
}
