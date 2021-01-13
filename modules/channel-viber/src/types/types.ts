export interface ViberUser {
  id: string
  name: string
  avatar: string
  country: string
  language: string
  apiVersion: number
}

interface SubscribedEvent {
  event: 'subscribed'
  timestamp: number
  user: ViberUser
  messageToken: number
}

interface UnsubscribedEvent {
  event: 'unsubscribed'
  timestamp: number
  userId: string
  messageToken: number
}

interface ConversationStartedEvent {
  event: 'conversation_started'
  timestamp: number
  messageToken: number
  type: 'open'
  context: string
  user: ViberUser
  subscribed: false
}

interface DeliveredEvent {
  event: 'delivered'
  timestamp: number
  messageToken: number
  userId: string
}

interface SeenEvent {
  event: 'seen'
  timestamp: number
  messageToken: number
  userId: string
}

interface FailedEvent {
  event: 'failed'
  timestamp: number
  messageToken: number
  userId: string
  desc: string
}

interface ViberMessage {
  type:
    | 'text'
    | 'picture'
    | 'video'
    | 'file'
    | 'sticker'
    | 'contact'
    | 'url'
    | 'location'
  text?: string
  media?: string
  location?: {
    lat: string;
    lot: string;
  }
  contact?: {
    name: string;
    phoneNumber: string;
  }
  trackingData?: string
  fileName?: string
  fileSize?: number
  duration?: number
  stickerId?: number
}

interface MessageEvent {
  event: 'message'
  timestamp: number
  messageToken: number
  sender: ViberUser
  message: ViberMessage
}

export type ViberRawEvent =
  | SubscribedEvent
  | UnsubscribedEvent
  | ConversationStartedEvent
  | DeliveredEvent
  | SeenEvent
  | FailedEvent
  | MessageEvent
