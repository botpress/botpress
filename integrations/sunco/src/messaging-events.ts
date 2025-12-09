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
