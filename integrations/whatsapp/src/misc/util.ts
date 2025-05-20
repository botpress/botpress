import { AtLeastOne } from 'whatsapp-api-js/lib/utils'
import * as bp from '.botpress'

type Message = Awaited<ReturnType<bp.Client['listMessages']>>['messages'][number]

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

export function getSubpath(path: string) {
  let subpath = '/' + path.split('/').slice(2).join('/')
  if (subpath.slice(-1) === '/') {
    subpath = subpath.slice(0, -1)
  }
  return subpath ? subpath : undefined
}
export const hasAtleastOne = <T>(obj: T[]): obj is AtLeastOne<T> => {
  return obj.length > 0
}

export const getMessageFromWhatsappMessageId = async (
  messageId: string,
  client: bp.Client
): Promise<Message | undefined> => {
  const { messages } = await client.listMessages({
    tags: {
      id: messageId,
    },
  })
  return messages[0]
}
