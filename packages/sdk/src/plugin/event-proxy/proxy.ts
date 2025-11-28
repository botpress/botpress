import type * as client from '@botpress/client'
import { BotSpecificClient } from '../../bot'
import * as consts from '../../consts'
import { type AsyncCollection, createAsyncCollection } from '../../utils/api-paging-utils'
import { BasePlugin, PluginRuntimeProps } from '../common'
import { EventProxy, EventSchedule, EventSender } from './types'

type _EventSenderProps = {
  client: BotSpecificClient<any> | client.Client
  eventName: string
  conversationId?: string
  userId?: string
  messageId?: string
}

class _EventSender implements EventSender<object> {
  public constructor(private _props: _EventSenderProps) {}

  public async emit(eventPayload: object): Promise<client.Event> {
    const { conversationId, userId, messageId } = this._props
    const { event } = await this._props.client.createEvent({
      type: this._props.eventName,
      payload: eventPayload,
      conversationId,
      userId,
      messageId,
    })
    return event
  }

  public async schedule(eventPayload: object, schedule: EventSchedule): Promise<client.Event> {
    const { conversationId, userId, messageId } = this._props
    const { event } = await this._props.client.createEvent({
      type: this._props.eventName,
      payload: eventPayload,
      conversationId,
      userId,
      messageId,
      schedule,
    })
    return event
  }

  public withConversationId(conversationId: string): this {
    return new _EventSender({
      ...this._props,
      conversationId,
    }) as this
  }

  public withUserId(userId: string): this {
    return new _EventSender({
      ...this._props,
      userId,
    }) as this
  }

  public withMessageId(messageId: string): this {
    return new _EventSender({
      ...this._props,
      messageId,
    }) as this
  }

  public async getById(props: { id: string }): Promise<client.Event> {
    const response = await this._props.client.getEvent({ id: props.id })
    return response.event
  }

  public list(
    props?: Omit<client.ClientInputs['listEvents'], 'type' | 'nextToken' | 'conversationId' | 'messageId' | 'userId'>
  ): AsyncCollection<client.Event> {
    return createAsyncCollection(({ nextToken }) =>
      this._props.client
        .listEvents({
          ...props,
          type: this._props.eventName,
          conversationId: this._props.conversationId,
          userId: this._props.userId,
          messageId: this._props.messageId,
          nextToken,
        })
        .then(({ meta, events }) => ({
          meta,
          items: events,
        }))
    )
  }
}

export const proxyEvents = <TPlugin extends BasePlugin>(
  client: BotSpecificClient<TPlugin> | client.Client,
  props: PluginRuntimeProps<TPlugin>
): EventProxy<TPlugin> =>
  new Proxy(
    {},
    {
      get: (_target, eventName: string) => {
        const actualName =
          props.alias !== undefined ? `${props.alias}${consts.PLUGIN_PREFIX_SEPARATOR}${eventName}` : eventName
        return new _EventSender({
          client,
          eventName: actualName,
        })
      },
    }
  ) as EventProxy<TPlugin>
