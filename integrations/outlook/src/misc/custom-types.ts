import type { Conversation, Message, Client as BotpressClient } from '@botpress/client'
import type { AckFunction, IntegrationContext } from '@botpress/sdk'
import type { ItemBody, ResourceData as BaseResourceData } from '@microsoft/microsoft-graph-types'

export type SendMessageProps = {
  client: BotpressClient
  ctx: IntegrationContext
  conversation: Conversation
  message: Message
  ack: AckFunction
  body: ItemBody
}

export type ResourceData = {
  '@odata.id': string
} & BaseResourceData
