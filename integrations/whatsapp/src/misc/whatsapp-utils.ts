import { RuntimeError } from '@botpress/sdk'
import { getAuthenticatedWhatsappClient } from '../auth'
import * as bp from '.botpress'

export async function getMediaUrl(whatsappMediaId: string, client: bp.Client, ctx: bp.Context): Promise<string> {
  const whatsapp = await getAuthenticatedWhatsappClient(client, ctx)
  const media = await whatsapp.retrieveMedia(whatsappMediaId)
  if (!('url' in media)) {
    throw new RuntimeError(`Failed to retrieve media URL for media ID "${whatsappMediaId}": ${media.error.message}`)
  }
  return media.url
}
