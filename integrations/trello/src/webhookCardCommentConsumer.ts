import { CommentCardEvent } from 'definitions/schemas'
import * as bp from '../.botpress'

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

export class WebhookCardCommentConsumer {
  public constructor(
    private readonly _client: bp.HandlerProps['client'],
    private readonly _cardCommentEvent: CommentCardEvent
  ) {}

  public async consumeComment() {
    const messageData = this._extractMessageDataFromEvent()
    const conversation = await this._getOrCreateConversation(messageData)
    const user = await this._getOrCreateUser(messageData)

    if (this._checkIfMessageWasSentByOurselvesAndShouldBeIgnored(conversation, messageData)) {
      return
    }

    await this._createMessage(user, conversation, messageData)
  }

  private _extractMessageDataFromEvent() {
    return {
      cardId: this._cardCommentEvent.action.data.card.id,
      cardName: this._cardCommentEvent.action.data.card.name,
      listId: this._cardCommentEvent.action.data.list?.id ?? '',
      listName: this._cardCommentEvent.action.data.list?.name ?? '',
      messageId: this._cardCommentEvent.action.id,
      messageText: this._cardCommentEvent.action.data.text,
      messageAuthorId: this._cardCommentEvent.action.memberCreator.id,
      messageAuthorName: this._cardCommentEvent.action.memberCreator.fullName,
      messageAuthorAvatar: this._cardCommentEvent.action.memberCreator.avatarUrl + '/50.png',
    } as const satisfies TrelloMessageData
  }

  private async _getOrCreateConversation(messageData: TrelloMessageData) {
    const { conversation } = await this._client.getOrCreateConversation({
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

  private async _getOrCreateUser(messageData: TrelloMessageData) {
    const { user } = await this._client.getOrCreateUser({
      tags: {
        userId: messageData.messageAuthorId,
      },
      name: messageData.messageAuthorName,
      pictureUrl: messageData.messageAuthorAvatar,
    })

    return user
  }

  private _checkIfMessageWasSentByOurselvesAndShouldBeIgnored(
    conversation: Awaited<ReturnType<bp.Client['getOrCreateConversation']>>['conversation'],
    messageData: TrelloMessageData
  ) {
    return conversation.tags.lastCommentId === messageData.messageId
  }

  private async _createMessage(
    user: Awaited<ReturnType<bp.Client['getOrCreateUser']>>['user'],
    conversation: Awaited<ReturnType<bp.Client['getOrCreateConversation']>>['conversation'],
    messageData: TrelloMessageData
  ) {
    await this._client.createMessage({
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
