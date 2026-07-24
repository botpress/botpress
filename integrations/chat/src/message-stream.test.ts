import { beforeEach, describe, expect, test, vi } from 'vitest'
import { InMemoryChatIdStore } from './id-store'
import { emitMessageStream, MessageStreamActionArgs } from './message-stream'
import { SignalEmitter } from './signal-emitter'

type MessageStreamInput = MessageStreamActionArgs['input']

const makeActionArgs = (input: MessageStreamInput, botUserId = 'bp-user-1'): MessageStreamActionArgs =>
  ({
    input,
    ctx: {
      botUserId,
    },
  }) as unknown as MessageStreamActionArgs

const makeSignalEmitter = (): SignalEmitter => ({
  emit: vi.fn().mockResolvedValue(undefined),
  emitOrThrow: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
})

const mapId = async (store: InMemoryChatIdStore, chatId: string, botpressId: string): Promise<void> => {
  await store.byFid.set(chatId, botpressId)
}

describe('emitMessageStream', () => {
  let convIdStore: InMemoryChatIdStore
  let userIdStore: InMemoryChatIdStore
  let signalEmitter: SignalEmitter

  beforeEach(() => {
    convIdStore = new InMemoryChatIdStore()
    userIdStore = new InMemoryChatIdStore()
    signalEmitter = makeSignalEmitter()
  })

  test('maps the Botpress conversation ID to the Chat API conversation ID', async () => {
    await mapId(convIdStore, 'chat-conversation-1', 'bp-conversation-1')

    await emitMessageStream(
      makeActionArgs({
        conversationId: 'bp-conversation-1',
        signal: {
          type: 'abort',
          streamId: 'stream-1',
        },
      }),
      { convIdStore, userIdStore, signalEmitter }
    )

    expect(signalEmitter.emitOrThrow).toHaveBeenCalledWith('bp-conversation-1', {
      type: 'message_stream_abort',
      data: {
        streamId: 'stream-1',
        conversationId: 'chat-conversation-1',
      },
    })
  })

  test('maps the bot user ID to the final message author ID', async () => {
    await mapId(userIdStore, 'chat-bot-user-1', 'bp-bot-user-1')

    await emitMessageStream(
      makeActionArgs(
        {
          conversationId: 'bp-conversation-1',
          signal: {
            type: 'delta',
            streamId: 'stream-1',
            createdAt: '2026-07-23T14:15:16.123Z',
            sequence: 1,
            delta: 'Hello',
          },
        },
        'bp-bot-user-1'
      ),
      { convIdStore, userIdStore, signalEmitter }
    )

    expect(signalEmitter.emitOrThrow).toHaveBeenCalledWith(
      'bp-conversation-1',
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'chat-bot-user-1',
        }),
      })
    )
  })

  test('preserves the complete delta payload', async () => {
    await mapId(convIdStore, 'chat-conversation-1', 'bp-conversation-1')
    await mapId(userIdStore, 'chat-bot-user-1', 'bp-bot-user-1')

    await emitMessageStream(
      makeActionArgs(
        {
          conversationId: 'bp-conversation-1',
          signal: {
            type: 'delta',
            streamId: 'stream-1',
            createdAt: '2026-07-23T14:15:16.123Z',
            clientMessageId: 'client-message-1',
            sequence: 3,
            delta: ' world',
          },
        },
        'bp-bot-user-1'
      ),
      { convIdStore, userIdStore, signalEmitter }
    )

    expect(signalEmitter.emitOrThrow).toHaveBeenCalledWith('bp-conversation-1', {
      type: 'message_stream_delta',
      data: {
        streamId: 'stream-1',
        conversationId: 'chat-conversation-1',
        userId: 'chat-bot-user-1',
        createdAt: '2026-07-23T14:15:16.123Z',
        clientMessageId: 'client-message-1',
        sequence: 3,
        delta: ' world',
      },
    })
  })

  test('reports signal delivery failures to the bot caller', async () => {
    const deliveryError = new Error('Pushpin rejected the signal')
    vi.mocked(signalEmitter.emitOrThrow).mockRejectedValueOnce(deliveryError)

    const result = emitMessageStream(
      makeActionArgs({
        conversationId: 'bp-conversation-1',
        signal: {
          type: 'abort',
          streamId: 'stream-1',
        },
      }),
      { convIdStore, userIdStore, signalEmitter }
    )

    await expect(result).rejects.toThrow(deliveryError)
  })
})
