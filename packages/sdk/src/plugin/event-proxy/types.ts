import type * as client from '@botpress/client'
import type { AsyncCollection } from '../../utils/api-paging-utils'
import type * as utils from '../../utils/type-utils'
import type { BasePlugin } from '../common'

export type EventSchedule = NonNullable<client.ClientInputs['createEvent']['schedule']>
export type EventSender<TPayload> = {
  emit: (event: TPayload) => Promise<client.Event>
  schedule: (event: TPayload, schedule: EventSchedule) => Promise<client.Event>
  withConversationId: (conversationId: string) => EventSender<TPayload>
  withUserId: (userId: string) => EventSender<TPayload>
  withMessageId: (messageId: string) => EventSender<TPayload>
  list: (
    props?: Omit<client.ClientInputs['listEvents'], 'type' | 'nextToken' | 'conversationId' | 'messageId' | 'userId'>
  ) => AsyncCollection<client.Event>
  getById: (props: { id: string }) => Promise<client.Event>
}

export type EventProxy<TPlugin extends BasePlugin> = utils.Normalize<{
  [TEventName in keyof TPlugin['events']]: EventSender<TPlugin['events'][TEventName]>
}>
