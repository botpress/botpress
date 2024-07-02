import WhatsAppAPI from 'whatsapp-api-js'
import { ServerErrorResponse, ServerMediaRetrieveResponse } from 'whatsapp-api-js/types'
import { getAccessToken } from './misc/whatsapp'
import { IntegrationCtx, Client } from './types'

export class UnreachableCaseError extends Error {
  constructor(val: never) {
    super(`Unreachable case: ${val}`)
  }
}

export function chunkArray<T>(array: T[], chunkSize: number) {
  const chunks: T[][] = []
  if (chunkSize <= 0) {
    return chunks
  }

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }

  return chunks
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function truncate(input: string, maxLength: number) {
  let truncated = input.substring(0, maxLength)
  if (truncated.length < input.length) {
    truncated = truncated.substring(0, maxLength - 1) + '…'
  }
  return truncated
}

export async function getWhatsAppMediaUrl(
  whatsappMediaId: string,
  client: Client,
  ctx: IntegrationCtx
): Promise<string> {
  const accessToken = await getAccessToken(client, ctx)
  const whatsapp = new WhatsAppAPI({ token: accessToken, secure: false })
  const media = await whatsapp.retrieveMedia(whatsappMediaId)
  return (media as Exclude<ServerMediaRetrieveResponse, ServerErrorResponse>).url
}
