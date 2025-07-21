import { Location, SendMessageProps } from './types'

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
