import { WhatsAppReactionMessage } from 'src/misc/types'
import * as bp from '.botpress'

type Message = Awaited<ReturnType<bp.Client['listMessages']>>['messages'][number]
type ReactionEventTypes = 'reactionAdded' | 'reactionRemoved'
type CommonReactionHandlerProps = {
  message: Message
  reactionEventType: ReactionEventTypes
  userId: string
  newReactionTagValue: string | undefined
  eventReaction: string
} & bp.HandlerProps

export const reactionHandler = async (reactionMessage: WhatsAppReactionMessage, props: bp.HandlerProps) => {
  const { client, logger } = props
  logger.forBot().debug('Received reaction message')
  const { message_id: messageId, emoji: currentReaction } = reactionMessage.reaction
  const message = await _getMessageFromWhatsappMessageId(messageId, client)
  if (!message) {
    logger.forBot().warn('No associated message found for reaction, ignoring reaction')
    return
  }

  const previousReaction = message.tags.reaction
  const reactionHasChanged = currentReaction !== previousReaction
  if (previousReaction && reactionHasChanged) {
    await _handleReaction({
      message,
      reactionEventType: 'reactionRemoved',
      userId: reactionMessage.from,
      newReactionTagValue: undefined,
      eventReaction: previousReaction,
      ...props,
    })
  }

  if (currentReaction && reactionHasChanged) {
    await _handleReaction({
      message,
      reactionEventType: 'reactionAdded',
      userId: reactionMessage.from,
      newReactionTagValue: currentReaction,
      eventReaction: currentReaction,
      ...props,
    })
  }
}

const _handleReaction = async ({
  message,
  reactionEventType,
  userId,
  newReactionTagValue,
  eventReaction,
  client,
  logger,
}: CommonReactionHandlerProps) => {
  logger.forBot().debug(`Sending reaction event of type ${reactionEventType}: ${eventReaction}`)
  await client.updateMessage({
    id: message.id,
    tags: {
      reaction: newReactionTagValue ?? '', // Empty string removes the tag
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      userId,
    },
  })

  await client.createEvent({
    type: reactionEventType,
    payload: {
      messageId: message.id,
      reaction: eventReaction,
      conversationId: message.conversationId,
      userId: user.id,
    },
    messageId: message.id,
    conversationId: message.conversationId,
    userId: user.id,
  })
}

const _getMessageFromWhatsappMessageId = async (messageId: string, client: bp.Client): Promise<Message | undefined> => {
  const { messages } = await client.listMessages({
    tags: {
      id: messageId,
    },
  })
  return messages[0]
}
