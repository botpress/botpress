import { MessageCreatedSignal, SignalEmitter } from './signal-emitter'

type ChatMessage = Omit<MessageCreatedSignal['data'], 'isBot'>

type EmitBotMessageSignalsInput = {
  channel: string
  message: ChatMessage
  signalEmitter: SignalEmitter
}

const getStreamId = (message: ChatMessage): string | undefined => {
  const streamId = message.metadata?.streamId
  return typeof streamId === 'string' ? streamId : undefined
}

export const emitBotMessageSignals = async ({
  channel,
  message,
  signalEmitter,
}: EmitBotMessageSignalsInput): Promise<void> => {
  const streamId = getStreamId(message)
  if (streamId) {
    await signalEmitter.emit(channel, {
      type: 'message_stream_complete',
      data: {
        streamId,
        message,
      },
    })
  }

  await signalEmitter.emit(channel, {
    type: 'message_created',
    data: {
      ...message,
      isBot: true,
    },
  })
}
