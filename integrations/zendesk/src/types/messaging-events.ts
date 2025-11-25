/**
 * Types for Sunshine Conversations webhook events
 * Based on the Sunshine Conversations API webhook structure
 */
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

export type ConversationMessageEvent = {
  type: 'conversation:message'
  payload: {
    conversation: {
      id: string
    }
    message: {
      id: string
      author: {
        type: 'user' | 'business'
        userId: string
        displayName?: string
        avatarUrl?: string
      }
      content: {
        type: 'text' | 'file' | 'image' | 'location' | 'carousel' | 'list' | 'form' | 'template'
        text?: string
      }
    }
  }
}

export type SunshineConversationsEvent = ConversationCreateEvent | ConversationMessageEvent

export type SunshineConversationsWebhook = {
  events: SunshineConversationsEvent[]
}
