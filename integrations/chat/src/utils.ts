import * as types from './api/types'
import { MessageCreatedSignal } from './signal-emitter'
import { MessageArgs } from './types'

type MessageCreatedPayload = MessageCreatedSignal['data']['payload']
type GetMessageCreatedPayloadByType<T extends MessageCreatedPayload['type']> = Extract<
  MessageCreatedPayload,
  { type: T }
>

type BlocMessageArgsPayload = Extract<MessageArgs, { type: 'bloc' }>['payload']
export const messageToSignal = (args: MessageArgs | types.Message): MessageCreatedPayload => {
  const { type } = args
  const { metadata: _, ...payload } = args.payload

  if (type !== 'bloc') {
    return {
      type,
      ...payload,
    } as Exclude<MessageCreatedPayload, { type: 'bloc' }>
  } else {
    const items = (payload as BlocMessageArgsPayload).items.map(
      (item) =>
        ({
          type: item.type,
          ...item.payload,
        }) as GetMessageCreatedPayloadByType<'bloc'>['items'][number]
    )

    return {
      type,
      ...payload,
      items,
    } satisfies GetMessageCreatedPayloadByType<'bloc'>
  }
}
