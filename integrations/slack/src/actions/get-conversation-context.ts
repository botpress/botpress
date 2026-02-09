import { RuntimeError } from '@botpress/client'
import { Message, messagePayloadSchemas, messagePayloadTypesSchema } from 'definitions/schemas/messages'
import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'
import type * as bp from '.botpress'

export const getConversationContextByConversationId = wrapActionAndInjectSlackClient(
  { actionName: 'getConversationContextByConversationId', errorMessage: 'Failed to get Conversation context' },
  async ({ client, logger }, { conversationId }) => {
    const { conversation } = await client.getConversation({ id: conversationId })

    logger.forBot().debug('Conversation', { conversation })

    const { id: channelId } = conversation.tags
    const thread: string | undefined = 'thread' in conversation.tags ? conversation.tags.thread : undefined
    if (!channelId) {
      throw new RuntimeError(`Channel ID is missing for conversation ${conversationId}`)
    }

    const messages = await getAllMessagesFromConversation({ conversationId, client, logger })
    return {
      conversationId,
      channelId,
      thread,
      messages: messages.map((message) => ({ userId: message.userId, type: message.type, payload: message.payload })),
    }
  }
)

export const getConversationContextByTags = wrapActionAndInjectSlackClient(
  { actionName: 'getConversationContextByTags', errorMessage: 'Failed to get Conversation context' },
  async ({ client, logger }, { channel, channelId, thread }) => {
    const tags = channel === 'thread' ? { id: channelId, thread } : { id: channelId }
    const { conversation } = await client.getOrCreateConversation({ channel, tags })

    const messages = await getAllMessagesFromConversation({ conversationId: conversation.id, client, logger })
    return {
      conversationId: conversation.id,
      channelId,
      thread,
      messages: messages.map((message) => ({ userId: message.userId, type: message.type, payload: message.payload })),
    }
  }
)

async function getAllMessagesFromConversation({
  conversationId,
  client,
  logger,
}: {
  conversationId: string
  client: bp.Client
  logger: bp.Logger
}): Promise<Message[]> {
  const allMessages: Message[] = []
  let nextToken: string | undefined

  do {
    const response = await client.listMessages({
      conversationId,
      nextToken,
    })

    response.messages.forEach((message) => {
      const parsedType = messagePayloadTypesSchema.safeParse(message.type)
      if (!parsedType.success) {
        logger.forBot().error('Skipping due to invalid message type', { message, error: parsedType.error })
        return
      }
      const parsedPayload = messagePayloadSchemas[parsedType.data].safeParse(message.payload)
      if (!parsedPayload.success) {
        logger.forBot().error('Skipping due to invalid message payload', { message, error: parsedPayload.error })
        return
      }
      const formattedMessage: Message = {
        type: parsedType.data,
        userId: message.userId,
        payload: parsedPayload.data,
      }
      allMessages.push(formattedMessage)
    })

    nextToken = response.meta.nextToken
  } while (nextToken)

  return allMessages
}
