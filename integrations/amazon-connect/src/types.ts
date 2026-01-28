/**
 * Amazon Connect participant roles
 */
export type ParticipantRole = 'AGENT' | 'CUSTOMER' | 'SYSTEM'

/**
 * Amazon Connect message/event types
 */
export type ContentType =
  | 'text/plain'
  | 'text/markdown'
  | 'application/json'
  | 'application/vnd.amazonaws.connect.message.interactive'
  | 'application/vnd.amazonaws.connect.event.typing'
  | 'application/vnd.amazonaws.connect.event.participant.joined'
  | 'application/vnd.amazonaws.connect.event.participant.left'
  | 'application/vnd.amazonaws.connect.event.transfer.succeeded'
  | 'application/vnd.amazonaws.connect.event.transfer.failed'

/**
 * Amazon Connect event type enum
 */
export enum EventType {
  MESSAGE = 'MESSAGE',
  EVENT = 'EVENT',
  ATTACHMENT = 'ATTACHMENT',
}

/**
 * Base structure for Amazon Connect events received via webhook
 */
export interface AmazonConnectEvent {
  Type: EventType
  ContactId: string
  InitialContactId: string
  ParticipantId: string
  ParticipantRole: ParticipantRole
  DisplayName?: string
  AbsoluteTime: string
}

/**
 * Amazon Connect message event
 */
export interface MessageEvent extends AmazonConnectEvent {
  Type: EventType.MESSAGE
  MessageId: string
  ContentType: ContentType
  Content: string
}

/**
 * Amazon Connect participant event
 */
export interface ParticipantEvent extends AmazonConnectEvent {
  Type: EventType.EVENT
  ContentType: ContentType
  Content?: string
}

/**
 * Amazon Connect attachment event
 */
export interface AttachmentEvent extends AmazonConnectEvent {
  Type: EventType.ATTACHMENT
  AttachmentId: string
  AttachmentName: string
  ContentType: string
  Status: 'APPROVED' | 'REJECTED' | 'IN_PROGRESS'
}

/**
 * Union type for all Amazon Connect events
 */
export type ConnectEvent = MessageEvent | ParticipantEvent | AttachmentEvent

/**
 * SNS notification wrapper for Amazon Connect events
 */
export interface SNSNotification {
  Type: 'Notification'
  MessageId: string
  TopicArn: string
  Subject?: string
  Message: string // JSON stringified ConnectEvent
  Timestamp: string
  SignatureVersion: string
  Signature: string
  SigningCertURL: string
  UnsubscribeURL: string
}

/**
 * Amazon Connect interactive message template
 */
export interface InteractiveMessage {
  templateType: 'ListPicker' | 'TimePicker' | 'Panel'
  version: string
  data: {
    content: InteractiveContent
  }
}

export interface InteractiveContent {
  title?: string
  subtitle?: string
  imageType?: 'URL'
  imageData?: string
  elements?: InteractiveElement[]
}

export interface InteractiveElement {
  title: string
  subtitle?: string
  imageType?: 'URL'
  imageData?: string
}

/**
 * Connection token with metadata
 */
export interface ConnectionTokenData {
  token: string
  expiry: string
  participantId: string
  contactId: string
}

/**
 * Contact state
 */
export interface ContactState {
  contactId: string
  initialContactId?: string
  participantId: string
  connectionToken: string
  tokenExpiry: string
  channel: 'channel' | 'hitl'
  conversationId: string
}
