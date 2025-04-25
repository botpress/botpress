import { it, describe, expect } from 'vitest'
import { MessageTextExtractor, type MessageFormatter } from './message-formatter'
import type {
  TextMessage,
  ImageMessage,
  FileMessage,
  LocationMessage,
  DropdownMessage,
  ChoiceMessage,
  CardMessage,
  MarkdownMessage,
  BlocMessage,
  CarouselMessage,
  Message,
} from './message-types'

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
  userResolver: {
    getUser: async ({ id }: { id: string }) => ({
      user: id === MOCK_USER.id ? MOCK_USER : MOCK_BOT_USER,
    }),
  },
  botUserId: MOCK_BOT_USER.id,
})

describe.concurrent('MessageTextExtractor', () => {
  describe.concurrent('source discrimination', () => {
    it('should correctly identify user messages', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'user', userId: MOCK_USER.id },
        type: 'text',
        payload: { text: 'Hello' },
      } satisfies TextMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_USER,
        isBot: false,
        text: ['Hello'],
      })
    })

    it('should correctly identify bot messages', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'bot' },
        type: 'text',
        payload: { text: 'I am a bot' },
      } satisfies TextMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_BOT_USER,
        isBot: true,
        text: ['I am a bot'],
      })
    })
  })

  describe.concurrent('when given a text message', () => {
    it('should normalize line endings', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'user', userId: MOCK_USER.id },
        type: 'text',
        payload: { text: 'Hello\r\nWorld  ' },
      } satisfies TextMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_USER,
        isBot: false,
        text: ['Hello', 'World'],
      })
    })

    it('should extract text from multiple messages', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const messages: Message[] = [
        {
          source: { type: 'user', userId: MOCK_USER.id },
          type: 'text',
          payload: { text: 'Hello' },
        },
        {
          source: { type: 'bot' },
          type: 'text',
          payload: { text: 'Hi there!' },
        },
      ]

      // Act
      const extractedMessages = messageExtractor.extractTextFromMessages(messages)

      // Assert
      await expect(extractedMessages).resolves.toStrictEqual([
        {
          user: MOCK_USER,
          isBot: false,
          text: ['Hello'],
        },
        {
          user: MOCK_BOT_USER,
          isBot: true,
          text: ['Hi there!'],
        },
      ])
    })

    it('should handle empty text content', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'user', userId: MOCK_USER.id },
        type: 'text',
        payload: { text: '' },
      } satisfies TextMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_USER,
        isBot: false,
        text: [''],
      })
    })
  })

  describe.concurrent('when given markdown messages', () => {
    it('should format markdown content correctly', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'bot' },
        type: 'markdown',
        payload: { markdown: '# Title\n\nSome **bold** text' },
      } satisfies MarkdownMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_BOT_USER,
        isBot: true,
        text: ['# Title', '', 'Some **bold** text'],
      })
    })
  })

  describe.concurrent('when given media messages', () => {
    it.each([
      {
        type: 'image',
        payload: { imageUrl: 'https://example.com/image.jpg' },
        expected: ['[ Image: https://example.com/image.jpg ]'],
      },
      {
        type: 'audio',
        payload: { audioUrl: 'https://example.com/audio.mp3' },
        expected: ['[ Audio: https://example.com/audio.mp3 ]'],
      },
      {
        type: 'video',
        payload: { videoUrl: 'https://example.com/video.mp4' },
        expected: ['[ Video: https://example.com/video.mp4 ]'],
      },
    ])('should format $type messages correctly', async ({ type, payload, expected }) => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'user', userId: MOCK_USER.id },
        type,
        payload,
      } as Message

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_USER,
        isBot: false,
        text: expected,
      })
    })
  })

  describe.concurrent('when given file messages', () => {
    it('should format file with title correctly', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'bot' },
        type: 'file',
        payload: {
          fileUrl: 'https://example.com/document.pdf',
          title: 'Important Document',
        },
      } satisfies FileMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_BOT_USER,
        isBot: true,
        text: ['[ File - Important Document: https://example.com/document.pdf ]'],
      })
    })

    it('should format file without title correctly', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'bot' },
        type: 'file',
        payload: {
          fileUrl: 'https://example.com/document.pdf',
        },
      } satisfies FileMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_BOT_USER,
        isBot: true,
        text: ['[ File - untitled: https://example.com/document.pdf ]'],
      })
    })
  })

  describe.concurrent('when given location messages', () => {
    it('should format location with all fields', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'user', userId: MOCK_USER.id },
        type: 'location',
        payload: {
          latitude: 40.7128,
          longitude: 74.006,
          title: 'New York City',
          address: '123 Broadway, NY',
        },
      } satisfies LocationMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_USER,
        isBot: false,
        text: ['[ Location ]', 'New York City', '123 Broadway, NY', '40.7128° N, 74.006° W'],
      })
    })

    it('should format location without optional fields', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'user', userId: MOCK_USER.id },
        type: 'location',
        payload: {
          latitude: 40.7128,
          longitude: 74.006,
        },
      } satisfies LocationMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_USER,
        isBot: false,
        text: ['[ Location ]', '40.7128° N, 74.006° W'],
      })
    })
  })

  describe.concurrent('when given interactive messages', () => {
    it('should format dropdown options', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'bot' },
        type: 'dropdown',
        payload: {
          text: 'Choose an option',
          options: [
            { label: 'Option 1', value: 'opt1' },
            { label: 'Option 2', value: 'opt2' },
          ],
        },
      } satisfies DropdownMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_BOT_USER,
        isBot: true,
        text: ['[ Dropdown options ]', '"Option 1" (opt1)', '"Option 2" (opt2)'],
      })
    })

    it('should format choice options', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'bot' },
        type: 'choice',
        payload: {
          text: 'Select one',
          options: [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ],
        },
      } satisfies ChoiceMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_BOT_USER,
        isBot: true,
        text: ['[ Choice options ]', '"Yes" (yes)', '"No" (no)'],
      })
    })

    it('should format card with all fields', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'bot' },
        type: 'card',
        payload: {
          title: 'Product Card',
          subtitle: 'Amazing product',
          imageUrl: 'https://example.com/product.jpg',
          actions: [
            { action: 'url', label: 'Buy Now', value: 'https://shop.com' },
            { action: 'postback', label: 'More Info', value: 'info_request' },
          ],
        },
      } satisfies CardMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_BOT_USER,
        isBot: true,
        text: [
          '[ Card: "Product Card" ]',
          'Subtitle: Amazing product',
          'Image: https://example.com/product.jpg',
          'url: "Buy Now" => https://shop.com',
          'postback: "More Info" => info_request',
        ],
      })
    })

    it('should format card without optional fields', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'bot' },
        type: 'card',
        payload: {
          title: 'Simple Card',
          actions: [],
        },
      } satisfies CardMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_BOT_USER,
        isBot: true,
        text: ['[ Card: "Simple Card" ]'],
      })
    })
  })

  describe.concurrent('when given unhandled message types', () => {
    it('should ignore bloc message', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'bot' },
        type: 'bloc',
        payload: {
          items: [{ type: 'text', payload: { text: 'Hello World' } }],
        },
      } satisfies BlocMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_BOT_USER,
        isBot: true,
        text: ['[ Bloc ]'],
      })
    })

    it('should ignore carousel message', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const messageExtractor = new MessageTextExtractor({ userResolver, botUserId })
      const message = {
        source: { type: 'bot' },
        type: 'carousel',
        payload: {
          items: [
            {
              title: 'Item 1',
              actions: [],
            },
          ],
        },
      } satisfies CarouselMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_BOT_USER,
        isBot: true,
        text: ['[ Carousel ]'],
      })
    })
  })

  describe.concurrent('with custom formatters', () => {
    it('should use provided custom formatters', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const customFormatters = {
        text: {
          formatMessage: (message: TextMessage) => [`CUSTOM: ${message.payload.text}`],
        } satisfies MessageFormatter<'text'>,
      }

      const messageExtractor = new MessageTextExtractor({
        userResolver,
        botUserId,
        customFormatters,
      })

      const message = {
        source: { type: 'user', userId: MOCK_USER.id },
        type: 'text',
        payload: { text: 'Hello' },
      } satisfies TextMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_USER,
        isBot: false,
        text: ['CUSTOM: Hello'],
      })
    })

    it('should use default formatters for types without custom formatters', async () => {
      // Arrange
      const { userResolver, botUserId } = getMocks()
      const customFormatters = {
        text: {
          formatMessage: (message: TextMessage) => [`CUSTOM: ${message.payload.text}`],
        } satisfies MessageFormatter<'text'>,
      }

      const messageExtractor = new MessageTextExtractor({
        userResolver,
        botUserId,
        customFormatters,
      })

      const message = {
        source: { type: 'bot' },
        type: 'image',
        payload: { imageUrl: 'https://example.com/image.jpg' },
      } satisfies ImageMessage

      // Act
      const extractedMessage = messageExtractor.extractTextFromMessage(message)

      // Assert
      await expect(extractedMessage).resolves.toStrictEqual({
        user: MOCK_BOT_USER,
        isBot: true,
        text: ['[ Image: https://example.com/image.jpg ]'],
      })
    })
  })
})
