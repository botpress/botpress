import { z } from '@botpress/sdk'

//https://developer.zendesk.com/api-reference/conversations/#tag/Webhooks/operation/EventWebhooks
export type SuncoWebhookPayload = {
  events: SuncoEvent[]
}

export type SuncoEvent = ConversationMessageEvent | SwitchboardReleaseControlEvent

// Not typing the rest since we don't use them
export type SuncoOtherMessageContent = {
  type: 'carousel' | 'form' | 'formResponse' | 'list' | 'location' | 'template'
}

export type SuncoTextMessageContent = {
  type: 'text'
  text?: string
  htmlText?: string
  blockChatInput?: boolean
  actions?: unknown[]
  payload?: string
}

export type SuncoImageMessageContent = {
  type: 'image'
  mediaUrl: string
  mediaType?: string
  mediaSize?: number
  altText?: string
  text?: string
  blockChatInput?: boolean
  htmlText?: string
  actions?: unknown[]
  attachmentId?: string
}

export type SuncoFileMessageContent = {
  type: 'file'
  mediaUrl: string
  mediaSize?: number
  mediaType?: string
  altText?: string
  text?: string
  blockChatInput?: boolean
  htmlText?: string
  attachmentId?: string
}

export type SuncoMessageContent =
  | SuncoTextMessageContent
  | SuncoImageMessageContent
  | SuncoFileMessageContent
  | SuncoOtherMessageContent

export type ConversationMessageEvent = {
  id: string
  createdAt: string
  type: 'conversation:message'
  payload: {
    conversation?: {
      id: string
      type?: string
      activeSwitchboardIntegration?: {
        id: string
        name: string
        integrationId: string
        integrationType: string
      }
      pendingSwitchboardIntegration?: {
        id: string
        name: string
        integrationId: string
        integrationType: string
      }
    }
    message: {
      id: string
      received: string
      author: {
        type: string
        displayName?: string
        avatarUrl?: string
      }
      content: SuncoMessageContent
      metadata?: Record<string, string>
      source?: {
        originalMessageTimestamp?: string
        type?: string
      }
    }
  }
}

export type SwitchboardReleaseControlEvent = {
  id: string
  createdAt: string
  type: 'switchboard:releaseControl'
  payload: {
    conversation?: {
      id: string
    }
    reason?: string
  }
}

export function isSuncoWebhookPayload(data: unknown): data is SuncoWebhookPayload {
  return z
    .object({
      events: z.array(z.unknown()),
    })
    .safeParse(data).success
}
