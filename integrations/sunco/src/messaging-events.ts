import { z } from '@botpress/sdk'

/**
 * Types for Sunshine Conversations webhook events
 * Based on the Sunshine Conversations API webhook structure
 * https://developer.zendesk.com/api-reference/conversations/#tag/Webhooks/operation/EventWebhooks
 */

export type UnhandledEventType =
  // Client Events
  | 'client:add'
  | 'client:remove'
  | 'client:update'
  // Conversation Events
  | 'conversation:join'
  | 'conversation:leave'
  | 'conversation:remove'
  | 'conversation:message:delivery:channel'
  | 'conversation:message:delivery:failure'
  | 'conversation:message:delivery:user'
  | 'conversation:postback'
  | 'conversation:read'
  | 'conversation:referral'
  | 'conversation:typing'
  // Switchboard Events
  | 'switchboard:acceptControl'
  | 'switchboard:acceptControl:failure'
  | 'switchboard:offerControl'
  | 'switchboard:offerControl:failure'
  | 'switchboard:passControl'
  | 'switchboard:passControl:failure'
  | 'switchboard:releaseControl'
  // User Events
  | 'user:merge'
  | 'user:update'
  | 'user:remove'

export type UnhandledEvent = {
  type: UnhandledEventType
}

export type ConversationCreateEvent = {
  type: 'conversation:create'
  payload: {
    conversation?: {
      id: string
      type?: string
      brandId?: string
      activeSwitchboardIntegration?: {
        id: string
        name: string
        integrationId: string
        integrationType: string
      }
    }
    user?: {
      id: string
      authenticated?: boolean
    }
    creationReason?: string
    source?: {
      type: string
      integrationId: string
    }
  }
}
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

export type SuncoUserProfile = {
  givenName?: string
  surname?: string
  email?: string
  avatarUrl?: string
  locale?: string
}

export type SuncoUser = {
  id: string
  externalId?: string
  signedUpAt?: string
  profile?: SuncoUserProfile
}

export type SuncoUserAuthor = {
  type: 'user'
  userId: string
  user?: SuncoUser
  displayName?: string
  avatarUrl?: string
}

export type SuncoBusinessAuthor = {
  type: 'business'
  displayName?: string
  avatarUrl?: string
}

export type SuncoMessageAuthor = SuncoUserAuthor | SuncoBusinessAuthor

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
      author: SuncoMessageAuthor
      content: SuncoMessageContent
      metadata?: Record<string, string>
      source?: {
        originalMessageTimestamp?: string
        type?: string
      }
    }
  }
}

export type SuncoWebhookPayload = {
  events: SuncoEvent[]
}

export type SuncoEvent = ConversationMessageEvent | ConversationCreateEvent | UnhandledEvent

export function isSuncoWebhookPayload(data: unknown): data is SuncoWebhookPayload {
  return z
    .object({
      events: z.array(z.unknown()),
    })
    .safeParse(data).success
}
