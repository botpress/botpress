import { CommentCardEvent } from 'definitions/schemas'
import * as bp from '.botpress'

type TrelloMessageData = {
  cardId: string
  cardName: string
  listId: string
  listName: string
  messageId: string
  messageText: string
  messageAuthorId: string
  messageAuthorName: string
  messageAuthorAvatar: string
}

export namespace CardCommentHandler {
  export const handleEvent = async (
    client: bp.HandlerProps['client'],
    cardCommentEvent: CommentCardEvent
  ): Promise<void> => {
    const messageData = _extractMessageDataFromEvent(cardCommentEvent)
    const conversation = await _getOrCreateConversation(client, messageData)
    const user = await _getOrCreateUser(client, messageData)

    if (_checkIfMessageWasSentByOurselvesAndShouldBeIgnored(conversation, messageData)) {
      return
    }

    await _createMessage(client, user, conversation, messageData)
  }

  const _extractMessageDataFromEvent = (cardCommentEvent: CommentCardEvent): TrelloMessageData =>
    ({
      cardId: cardCommentEvent.action.data.card.id,
      cardName: cardCommentEvent.action.data.card.name,
      listId: cardCommentEvent.action.data.list?.id ?? '',
      listName: cardCommentEvent.action.data.list?.name ?? '',
      messageId: cardCommentEvent.action.id,
      messageText: cardCommentEvent.action.data.text,
      messageAuthorId: cardCommentEvent.action.memberCreator.id,
      messageAuthorName: cardCommentEvent.action.memberCreator.fullName,
      messageAuthorAvatar: cardCommentEvent.action.memberCreator.avatarUrl + '/50.png',
    }) as const satisfies TrelloMessageData

  const _getOrCreateConversation = async (client: bp.HandlerProps['client'], messageData: TrelloMessageData) => {
    const { conversation } = await client.getOrCreateConversation({
      channel: 'cardComments',
      tags: {
        cardId: messageData.cardId,
        cardName: messageData.cardName,
        listId: messageData.listId,
        listName: messageData.listName,
      },
    })

    return conversation
  }

  const _getOrCreateUser = async (client: bp.HandlerProps['client'], messageData: TrelloMessageData) => {
    const { user } = await client.getOrCreateUser({
      tags: {
        userId: messageData.messageAuthorId,
      },
      name: messageData.messageAuthorName,
      pictureUrl: messageData.messageAuthorAvatar,
    })

    return user
  }

  const _checkIfMessageWasSentByOurselvesAndShouldBeIgnored = (
    conversation: Awaited<ReturnType<bp.Client['getOrCreateConversation']>>['conversation'],
    messageData: TrelloMessageData
  ) => conversation.tags.lastCommentId === messageData.messageId

  const _createMessage = async (
    client: bp.HandlerProps['client'],
    user: Awaited<ReturnType<bp.Client['getOrCreateUser']>>['user'],
    conversation: Awaited<ReturnType<bp.Client['getOrCreateConversation']>>['conversation'],
    messageData: TrelloMessageData
  ) => {
    await client.createMessage({
      tags: {
        commentId: messageData.messageId,
      },
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: messageData.messageText },
    })
  }
}
