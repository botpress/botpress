import { RuntimeError } from '@botpress/sdk'
import { getAuthenticatedWhatsappClient } from '../auth'
import * as bp from '.botpress'

export async function getMediaInfos(whatsappMediaId: string, client: bp.Client, ctx: bp.Context) {
  const whatsapp = await getAuthenticatedWhatsappClient(client, ctx)
  const media = await whatsapp.retrieveMedia(whatsappMediaId)
  if ('error' in media) {
    throw new RuntimeError(
      `Failed to retrieve media URL for media ID "${whatsappMediaId}": ${media.error?.message ?? 'unknown error'}`
    )
  } else if (!('messaging_product' in media)) {
    throw new RuntimeError('Failed to retrieve media URL: invalid response from WhatsApp API')
  }

  const { url, mime_type: mimeType, file_size: fileSizeStr } = media
  const fileSize = Number(fileSizeStr)
  if (isNaN(fileSize)) {
    throw new RuntimeError(`Failed to parse file size from media response: ${fileSizeStr}`)
  }

  return {
    url,
    mimeType,
    fileSize,
  }
}

export const getMediaUrl = async (whatsappMediaId: string, client: bp.Client, ctx: bp.Context) => {
  const { url } = await getMediaInfos(whatsappMediaId, client, ctx)
  return url
}
