import { ChatIdStore } from './id-store'
import { SignalEmitter } from './signal-emitter'
import { setSpanAttributes, SPAN_ATTRS } from './tracing'
import { ActionArgs } from './types'

export type MessageStreamActionArgs = ActionArgs<'publishMessageStream'>

type MessageStreamDependencies = {
  convIdStore: ChatIdStore
  userIdStore: ChatIdStore
  signalEmitter: SignalEmitter
}

export const emitMessageStream = async (
  args: MessageStreamActionArgs,
  dependencies: MessageStreamDependencies
): Promise<void> => {
  const {
    input: { conversationId: channel, signal },
    ctx: { botUserId },
  } = args
  const { convIdStore, userIdStore, signalEmitter } = dependencies

  const conversationId = await convIdStore.byId.get(channel)
  setSpanAttributes({ [SPAN_ATTRS.CONVERSATION_ID]: conversationId })

  if (signal.type === 'abort') {
    await signalEmitter.emitOrThrow(channel, {
      type: 'message_stream_abort',
      data: {
        streamId: signal.streamId,
        conversationId,
      },
    })
    return
  }

  const userId = await userIdStore.byId.get(botUserId)
  setSpanAttributes({ [SPAN_ATTRS.USER_ID]: userId })

  await signalEmitter.emitOrThrow(channel, {
    type: 'message_stream_delta',
    data: {
      streamId: signal.streamId,
      conversationId,
      userId,
      createdAt: signal.createdAt,
      clientMessageId: signal.clientMessageId,
      sequence: signal.sequence,
      delta: signal.delta,
    },
  })
}
