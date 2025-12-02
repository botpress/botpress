export type SuncoWebhookPayload = {
  events: SuncoEvent[]
}

export type SuncoEvent = ConversationMessageEvent | SwitchboardReleaseControlEvent

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
      content: {
        type: string
        text?: string
        mediaUrl?: string
        mediaType?: string
        mediaSize?: number
        altText?: string
        attachmentId?: string
      }
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
  if (typeof data !== 'object' || data === null) {
    return false
  }
  if (!('events' in data)) {
    return false
  }
  return Array.isArray(data?.events)
}
