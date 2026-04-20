import { CommentAddedWebhook } from '../schemas/card-comment-webhook-schemas'
import * as bp from '.botpress'

type Conversation = Awaited<ReturnType<bp.Client['getOrCreateConversation']>>['conversation']
type User = Awaited<ReturnType<bp.Client['getOrCreateUser']>>['user']

export const processInboundCommentChannelMessage = async (
  client: bp.HandlerProps['client'],
  webhookEvent: CommentAddedWebhook
): Promise<void> => {
  const conversation = await _getOrCreateConversation(client, webhookEvent.data)
  const user = await _getOrCreateUser(client, webhookEvent.memberCreator)

  const comment = _extractCommentData(webhookEvent)
  if (_checkIfMessageWasSentByOurselvesAndShouldBeIgnored(conversation, comment)) {
    return
  }

  await _createMessage(client, conversation, user, comment)
}

const _extractCommentData = (event: CommentAddedWebhook) =>
  ({
    id: event.id,
    text: event.data.text,
  }) as const
type CardComment = ReturnType<typeof _extractCommentData>

const _getOrCreateConversation = async (client: bp.HandlerProps['client'], eventData: CommentAddedWebhook['data']) => {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'cardComments',
    tags: {
      listId: eventData.list.id,
      listName: eventData.list.name,
      cardId: eventData.card.id,
      cardName: eventData.card.name,
    },
  })

  return conversation
}

const _getOrCreateUser = async (
  client: bp.HandlerProps['client'],
  memberCreator: CommentAddedWebhook['memberCreator']
) => {
  const { user } = await client.getOrCreateUser({
    tags: {
      userId: memberCreator.id,
    },
    name: memberCreator.fullName,
    pictureUrl: `${memberCreator.avatarUrl}/50.png`,
  })

  return user
}

const _checkIfMessageWasSentByOurselvesAndShouldBeIgnored = (conversation: Conversation, comment: CardComment) =>
  conversation.tags.lastCommentId === comment.id

const _createMessage = async (
  client: bp.HandlerProps['client'],
  conversation: Conversation,
  user: User,
  comment: CardComment
) => {
  await client.createMessage({
    conversationId: conversation.id,
    userId: user.id,
    type: 'text',
    payload: { text: comment.text },
    tags: { commentId: comment.id },
  })
}
