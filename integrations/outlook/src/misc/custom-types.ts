import type { AckFunction, IntegrationContext } from '@botpress/sdk'
import type {
  Conversation,
  Message,
  Client as BotpressClient,
} from '@botpress/client'
import type {
  ItemBody,
  ResourceData as BaseResourceData,
} from '@microsoft/microsoft-graph-types'
import type {
  createEventInputSchema,
  createEventOutputSchema,
  createEventPropsSchema,
} from './custom-schemas'
import type * as z from 'zod'

export type SendMessageProps = {
  client: BotpressClient
  ctx: IntegrationContext
  conversation: Conversation
  message: Message
  ack: AckFunction
  body: ItemBody
}

export type OutputEvent = z.infer<typeof createEventOutputSchema>
export type InputEvent = z.infer<typeof createEventInputSchema>

interface CtxCreateEventProps {
  ctx: IntegrationContext
}

export type CreateEventProps = CtxCreateEventProps &
  z.infer<typeof createEventPropsSchema>

export interface SendEmailProps {
  ctx: IntegrationContext
  subject: string
  type?: 'Text' | 'HTML'
  body: string
  toRecipients: string[] | string
  ccRecipients?: string[] | string
  bccRecipients?: string[] | string
}

export interface ResourceData extends BaseResourceData {
  '@odata.id': string
}
