import { describe, expect, test, vi } from 'vitest'
import { emitBotMessageSignals } from './bot-message-signals'
import { SignalEmitter } from './signal-emitter'

type ChatMessage = Parameters<typeof emitBotMessageSignals>[0]['message']

const makeSignalEmitter = (): SignalEmitter => ({
  emit: vi.fn().mockResolvedValue(undefined),
  emitOrThrow: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
})

const message: ChatMessage = {
  id: 'message-1',
  conversationId: 'conversation-1',
  userId: 'user-1',
  createdAt: '2026-07-23T14:15:17.123Z',
  payload: {
    type: 'text',
    text: 'Hello world',
  },
  metadata: {
    custom: 'value',
  },
}

describe('emitBotMessageSignals', () => {
  test('keeps the existing message_created signal unchanged', async () => {
    const signalEmitter = makeSignalEmitter()

    await emitBotMessageSignals({
      channel: 'bp-conversation-1',
      message,
      signalEmitter,
    })

    expect(signalEmitter.emit).toHaveBeenCalledOnce()
    expect(signalEmitter.emit).toHaveBeenCalledWith('bp-conversation-1', {
      type: 'message_created',
      data: {
        ...message,
        isBot: true,
      },
    })
  })

  test('completes a correlated stream and still emits message_created', async () => {
    const signalEmitter = makeSignalEmitter()
    const streamedMessage = {
      ...message,
      metadata: {
        ...message.metadata,
        streamId: 'stream-1',
      },
    }

    await emitBotMessageSignals({
      channel: 'bp-conversation-1',
      message: streamedMessage,
      signalEmitter,
    })

    expect(signalEmitter.emit).toHaveBeenNthCalledWith(1, 'bp-conversation-1', {
      type: 'message_stream_complete',
      data: {
        streamId: 'stream-1',
        message: streamedMessage,
      },
    })
    expect(signalEmitter.emit).toHaveBeenNthCalledWith(2, 'bp-conversation-1', {
      type: 'message_created',
      data: {
        ...streamedMessage,
        isBot: true,
      },
    })
  })
})
