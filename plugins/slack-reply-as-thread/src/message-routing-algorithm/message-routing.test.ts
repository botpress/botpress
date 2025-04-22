import { describe, it, expect } from 'vitest'
import { getMessageRouting } from './message-routing'

const getMockMessage = ({ mentionsBot }: { mentionsBot?: boolean }): { tags: {} | { mentionsBot: 'true' } } => ({
  tags: mentionsBot
    ? {
        mentionsBot: 'true',
      }
    : {},
})

const getMockConversation = ({
  type,
}: {
  type: 'channel' | 'user-thread' | 'bot-thread' | 'dm'
}): { channel: 'channel' | 'thread' | 'dm'; tags: {} | { isBotReplyThread: 'true' } } => ({
  channel: type === 'channel' ? 'channel' : type === 'dm' ? 'dm' : 'thread',
  tags:
    type === 'bot-thread'
      ? {
          isBotReplyThread: 'true',
        }
      : {},
})

const getMockConfiguration = (config: { enableThreading?: boolean; ignoreMessagesWithoutMention?: boolean }) => config

describe.concurrent('incoming message', () => {
  describe.concurrent('in bot-created thread', () => {
    it("should't fork to thread nor swallow message", () => {
      // Arrange
      const message = getMockMessage({})
      const conversation = getMockConversation({ type: 'bot-thread' })
      const configuration = getMockConfiguration({})

      // Act
      const result = getMessageRouting({ message, conversation, configuration })

      // Assert
      expect(result).toMatchObject({
        shouldPreventBotFromReplying: false,
        shouldForkToReplyThread: false,
      })
    })
  })

  describe.concurrent('in user-created thread', () => {
    describe.concurrent('with bot mention', () => {
      it("should't fork to thread nor swallow message", () => {
        // Arrange
        const message = getMockMessage({ mentionsBot: true })
        const conversation = getMockConversation({ type: 'user-thread' })
        const configuration = getMockConfiguration({})

        // Act
        const result = getMessageRouting({ message, conversation, configuration })

        // Assert
        expect(result).toMatchObject({
          shouldPreventBotFromReplying: false,
          shouldForkToReplyThread: false,
        })
      })
    })

    describe.concurrent('without bot mention', () => {
      describe.concurrent('when mentions are required', () => {
        it("should't fork to thread and should swallow message", () => {
          // Arrange
          const message = getMockMessage({ mentionsBot: false })
          const conversation = getMockConversation({ type: 'user-thread' })
          const configuration = getMockConfiguration({ ignoreMessagesWithoutMention: true })

          // Act
          const result = getMessageRouting({ message, conversation, configuration })

          // Assert
          expect(result).toMatchObject({
            shouldPreventBotFromReplying: true,
            shouldForkToReplyThread: false,
          })
        })
      })

      describe.concurrent('when mentions are not required', () => {
        it("should't fork to thread nor swallow message", () => {
          // Arrange
          const message = getMockMessage({ mentionsBot: false })
          const conversation = getMockConversation({ type: 'user-thread' })
          const configuration = getMockConfiguration({ ignoreMessagesWithoutMention: false })

          // Act
          const result = getMessageRouting({ message, conversation, configuration })

          // Assert
          expect(result).toMatchObject({
            shouldPreventBotFromReplying: false,
            shouldForkToReplyThread: false,
          })
        })
      })
    })
  })

  describe.concurrent('in channel', () => {
    describe.concurrent('with bot mention', () => {
      describe.concurrent('when threading is enabled', () => {
        it('should fork to thread and swallow message', () => {
          // Arrange
          const message = getMockMessage({ mentionsBot: true })
          const conversation = getMockConversation({ type: 'channel' })
          const configuration = getMockConfiguration({ enableThreading: true, ignoreMessagesWithoutMention: true })

          // Act
          const result = getMessageRouting({ message, conversation, configuration })

          // Assert
          expect(result).toMatchObject({
            shouldPreventBotFromReplying: true,
            shouldForkToReplyThread: true,
          })
        })
      })

      describe.concurrent('when threading is disabled', () => {
        it("should't fork to thread nor swallow message", () => {
          // Arrange
          const message = getMockMessage({ mentionsBot: true })
          const conversation = getMockConversation({ type: 'channel' })
          const configuration = getMockConfiguration({ enableThreading: false, ignoreMessagesWithoutMention: true })

          // Act
          const result = getMessageRouting({ message, conversation, configuration })

          // Assert
          expect(result).toMatchObject({
            shouldPreventBotFromReplying: false,
            shouldForkToReplyThread: false,
          })
        })
      })
    })

    describe.concurrent('without bot mention', () => {
      describe.concurrent('when mentions are required', () => {
        it("shouldn't fork to thread and should swallow message", () => {
          // Arrange
          const message = getMockMessage({ mentionsBot: false })
          const conversation = getMockConversation({ type: 'channel' })
          const configuration = getMockConfiguration({ enableThreading: true, ignoreMessagesWithoutMention: true })

          // Act
          const result = getMessageRouting({ message, conversation, configuration })

          // Assert
          expect(result).toMatchObject({
            shouldPreventBotFromReplying: true,
            shouldForkToReplyThread: false,
          })
        })
      })

      describe.concurrent('when mentions are not required', () => {
        describe.concurrent('when threading is enabled', () => {
          it('should fork to thread and swallow message', () => {
            // Arrange
            const message = getMockMessage({ mentionsBot: false })
            const conversation = getMockConversation({ type: 'channel' })
            const configuration = getMockConfiguration({ enableThreading: true, ignoreMessagesWithoutMention: false })

            // Act
            const result = getMessageRouting({ message, conversation, configuration })

            // Assert
            expect(result).toMatchObject({
              shouldPreventBotFromReplying: true,
              shouldForkToReplyThread: true,
            })
          })
        })

        describe.concurrent('when threading is disabled', () => {
          it("should't fork to thread nor swallow message", () => {
            // Arrange
            const message = getMockMessage({ mentionsBot: false })
            const conversation = getMockConversation({ type: 'channel' })
            const configuration = getMockConfiguration({ enableThreading: false })

            // Act
            const result = getMessageRouting({ message, conversation, configuration })

            // Assert
            expect(result).toMatchObject({
              shouldPreventBotFromReplying: false,
              shouldForkToReplyThread: false,
            })
          })
        })
      })
    })
  })

  describe.concurrent('in DM', () => {
    it("should't fork to thread and should swallow message", () => {
      // Arrange
      const message = getMockMessage({})
      const conversation = getMockConversation({ type: 'dm' })
      const configuration = getMockConfiguration({})

      // Act
      const result = getMessageRouting({ message, conversation, configuration })

      // Assert
      expect(result).toMatchObject({
        shouldPreventBotFromReplying: true,
        shouldForkToReplyThread: false,
      })
    })
  })
})
