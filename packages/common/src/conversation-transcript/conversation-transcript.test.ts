import { it, describe, expect } from 'vitest'
import { buildConversationTranscript, type TranscriptFormatter } from './conversation-transcript'
import type { Message, TextMessage } from './message-types'
import type { MessageFormatter } from './message-formatter'

const MOCK_USER = {
  id: 'user-id',
  name: 'John Doe',
  tags: {},
  createdAt: '',
  updatedAt: '',
}

const MOCK_BOT_USER = {
  id: 'bot-id',
  name: 'Botpress',
  tags: {},
  createdAt: '',
  updatedAt: '',
}

const getMocks = () => ({
  client: {
    getUser: async ({ id }: { id: string }) => ({
      user: id === MOCK_USER.id ? MOCK_USER : MOCK_BOT_USER,
    }),
  },
  ctx: {
    botUserId: MOCK_BOT_USER.id,
  },
})

describe.concurrent('buildConversationTranscript', () => {
  describe.concurrent('with default message formatters', () => {
    it('should format a conversation with text messages', async () => {
      // Arrange
      const { client, ctx } = getMocks()
      const messages: Message[] = [
        {
          source: { type: 'user', userId: MOCK_USER.id },
          type: 'text',
          payload: { text: 'Hello bot' },
        },
        {
          source: { type: 'bot' },
          type: 'text',
          payload: { text: 'Hello human' },
        },
      ]

      // Act
      const transcript = buildConversationTranscript({ messages, ctx, client })

      // Assert
      await expect(transcript).resolves.toBe('👤 John Doe:\nHello bot\n\n---\n\n🤖 Botpress:\nHello human')
    })

    it('should format a conversation with multiple message types', async () => {
      // Arrange
      const { client, ctx } = getMocks()
      const messages: Message[] = [
        {
          source: { type: 'user', userId: MOCK_USER.id },
          type: 'text',
          payload: { text: 'Check this out' },
        },
        {
          source: { type: 'user', userId: MOCK_USER.id },
          type: 'image',
          payload: { imageUrl: 'https://example.com/image.jpg' },
        },
        {
          source: { type: 'bot' },
          type: 'card',
          payload: {
            title: 'Cool Card',
            subtitle: 'A nice subtitle',
            imageUrl: 'https://example.com/card.jpg',
            actions: [{ action: 'url', label: 'Visit', value: 'https://example.com' }],
          },
        },
      ]

      // Act
      const transcript = buildConversationTranscript({ messages, ctx, client })

      // Assert
      await expect(transcript).resolves.toBe(
        '👤 John Doe:\nCheck this out\n\n---\n\n👤 John Doe:\n[ Image: https://example.com/image.jpg ]\n\n---\n\n🤖 Botpress:\n[ Card: "Cool Card" ]\nSubtitle: A nice subtitle\nImage: https://example.com/card.jpg\nurl: "Visit" => https://example.com'
      )
    })
  })

  describe.concurrent('with custom message formatters', () => {
    it('should use custom formatters when provided', async () => {
      // Arrange
      const { client, ctx } = getMocks()
      const messages: Message[] = [
        {
          source: { type: 'user', userId: MOCK_USER.id },
          type: 'text',
          payload: { text: 'Hello' },
        },
        {
          source: { type: 'bot' },
          type: 'card',
          payload: {
            title: 'Card Title',
            actions: [],
          },
        },
      ]

      const customMessageFormatters = {
        text: {
          formatMessage: (message: TextMessage) => [`CUSTOM TEXT: ${message.payload.text}`],
        } satisfies MessageFormatter<'text'>,
      }

      // Act
      const transcript = buildConversationTranscript({
        messages,
        ctx,
        client,
        customMessageFormatters,
      })

      // Assert
      await expect(transcript).resolves.toBe(
        '👤 John Doe:\nCUSTOM TEXT: Hello\n\n---\n\n🤖 Botpress:\n[ Card: "Card Title" ]'
      )
    })
  })

  describe.concurrent('with custom transcript formatter', () => {
    it('should use custom transcript formatter when provided', async () => {
      // Arrange
      const { client, ctx } = getMocks()
      const messages: Message[] = [
        {
          source: { type: 'user', userId: MOCK_USER.id },
          type: 'text',
          payload: { text: 'Hello' },
        },
        {
          source: { type: 'bot' },
          type: 'text',
          payload: { text: 'Hi there' },
        },
      ]

      const customTranscriptFormatter: TranscriptFormatter = (extractedMessages) =>
        extractedMessages
          .map((message) => {
            const role = message.isBot ? 'BOT' : 'USER'
            return `[${role}] ${message.user.name}: ${message.text.join(' ')}`
          })
          .join('\n')

      // Act
      const transcript = buildConversationTranscript({
        messages,
        ctx,
        client,
        customTranscriptFormatter,
      })

      // Assert
      await expect(transcript).resolves.toBe('[USER] John Doe: Hello\n[BOT] Botpress: Hi there')
    })
  })
})
