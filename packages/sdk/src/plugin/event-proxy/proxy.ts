import { Client } from '@botpress/client'
import { BotSpecificClient } from '../../bot'
import * as consts from '../../consts'
import { BasePlugin, PluginRuntimeProps } from '../common'
import { EventProxy, EventSchedule, EventSender } from './types'

type _EventSenderProps = {
  client: BotSpecificClient<any> | Client
  eventName: string
  conversationId?: string
  userId?: string
  messageId?: string
}

class _EventSender implements EventSender<object> {
  public constructor(private _props: _EventSenderProps) {}

  public async send(eventPayload: object): Promise<void> {
    const { conversationId, userId, messageId } = this._props
    await this._props.client.createEvent({
      type: this._props.eventName,
      payload: eventPayload,
      conversationId,
      userId,
      messageId,
    })
  }

  public async schedule(eventPayload: object, schedule: EventSchedule): Promise<void> {
    const { conversationId, userId, messageId } = this._props
    await this._props.client.createEvent({
      type: this._props.eventName,
      payload: eventPayload,
      conversationId,
      userId,
      messageId,
      schedule,
    })
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
}

export const proxyEvents = <TPlugin extends BasePlugin>(
  client: BotSpecificClient<TPlugin> | Client,
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
