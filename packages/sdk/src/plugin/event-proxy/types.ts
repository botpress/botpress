import { ClientInputs } from '@botpress/client'
import * as utils from '../../utils/type-utils'
import { BasePlugin } from '../common'

export type EventSchedule = NonNullable<ClientInputs['createEvent']['schedule']>
export type EventSender<TPayload> = {
  send: (event: TPayload) => Promise<void>
  schedule: (event: TPayload, schedule: EventSchedule) => Promise<void>
  withConversationId: (conversationId: string) => EventSender<TPayload>
  withUserId: (userId: string) => EventSender<TPayload>
  withMessageId: (messageId: string) => EventSender<TPayload>
}

export type EventProxy<TPlugin extends BasePlugin> = utils.Normalize<{
  [TEventName in keyof TPlugin['events']]: EventSender<TPlugin['events'][TEventName]>
}>
