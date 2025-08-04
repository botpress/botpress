import { MessengerClient, MessengerTypes } from 'messaging-api-messenger'
import { Location, SendMessageProps } from './types'
import * as bp from '.botpress'

export function getGoogleMapLinkFromLocation(payload: Location) {
  return `https://www.google.com/maps/search/?api=1&query=${payload.latitude},${payload.longitude}`
}

export function getRecipientId(conversation: SendMessageProps['conversation']): string {
  const recipientId = conversation.tags.id

  if (!recipientId) {
    throw Error(`No recipient id found for user ${conversation.id}`)
  }

  return recipientId
}

export function safeJsonParse(x: any) {
  try {
    return { data: JSON.parse(x), success: true }
  } catch {
    return { data: x, success: false }
  }
}

export type FileMetadata = { mimeType: string; fileSize?: number; fileName?: string }

export async function getMediaMetadata(url: string): Promise<FileMetadata> {
  const response = await fetch(url, { method: 'HEAD' })

  if (!response.ok) {
    throw new Error(`Failed to fetch metadata for URL: ${url}`)
  }

  const mimeType = response.headers.get('content-type') ?? 'application/octet-stream'
  const contentLength = response.headers.get('content-length')
  const contentDisposition = response.headers.get('content-disposition')

  const fileSize = contentLength ? Number(contentLength) : undefined
  if (fileSize !== undefined && isNaN(fileSize)) {
    throw new Error(`Failed to parse file size from response: ${contentLength}`)
  }

  // Try to extract filename from content-disposition
  let fileName: string | undefined
  if (contentDisposition) {
    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^"]+)"?/i)
    const rawFileName = match?.[1]
    if (rawFileName) {
      fileName = decodeURIComponent(rawFileName)
    }
  }

  return {
    mimeType,
    fileSize,
    fileName,
  }
}

export async function generateIdFromUrl(url: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(url))
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 24)
}

export function getErrorFromUnknown(thrown: unknown): Error {
  if (thrown instanceof Error) {
    return thrown
  }
  return new Error(String(thrown))
}

export const shouldGetUserProfile = (ctx: bp.Context) => {
  if (ctx.configurationType === 'sandbox') {
    return bp.secrets.SANDBOX_SHOULD_GET_USER_PROFILE === 'true'
  }
  if (ctx.configurationType === 'manual') {
    return ctx.configuration.shouldGetUserProfile ?? true
  }

  return bp.secrets.SHOULD_GET_USER_PROFILE === 'true'
}

export const tryGetUserProfile = async (
  messengerClient: MessengerClient,
  ctx: bp.Context,
  userId: string,
  fields?: MessengerTypes.UserProfileField[]
) => {
  if (!shouldGetUserProfile(ctx)) {
    return undefined
  }

  try {
    return await messengerClient.getUserProfile(userId, { fields })
  } catch {
    return undefined
  }
}
