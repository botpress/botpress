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
    private readonly client: bp.HandlerProps['client'],
    private readonly cardCommentEvent: CommentCardEvent
  ) {}

  public async consumeComment() {
    const messageData = this.extractMessageDataFromEvent()
    const conversation = await this.getOrCreateConversation(messageData)
    const user = await this.getOrCreateUser(messageData)

    if (this.checkIfMessageWasSentByOurselvesAndShouldBeIgnored(conversation, messageData)) {
      return
    }

    await this.createMessage(user, conversation, messageData)
  }

  private extractMessageDataFromEvent() {
    return {
      cardId: this.cardCommentEvent.action.data.card.id,
      cardName: this.cardCommentEvent.action.data.card.name,
      listId: this.cardCommentEvent.action.data.list?.id ?? '',
      listName: this.cardCommentEvent.action.data.list?.name ?? '',
      messageId: this.cardCommentEvent.action.id,
      messageText: this.cardCommentEvent.action.data.text,
      messageAuthorId: this.cardCommentEvent.action.memberCreator.id,
      messageAuthorName: this.cardCommentEvent.action.memberCreator.fullName,
      messageAuthorAvatar: this.cardCommentEvent.action.memberCreator.avatarUrl + '/50.png',
    } as const satisfies TrelloMessageData
  }

  private async getOrCreateConversation(messageData: TrelloMessageData) {
    const { conversation } = await this.client.getOrCreateConversation({
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

  private async getOrCreateUser(messageData: TrelloMessageData) {
    const { user } = await this.client.getOrCreateUser({
      tags: {
        userId: messageData.messageAuthorId,
      },
      name: messageData.messageAuthorName,
      pictureUrl: messageData.messageAuthorAvatar,
    })

    return user
  }

  private checkIfMessageWasSentByOurselvesAndShouldBeIgnored(
    conversation: Awaited<ReturnType<bp.Client['getOrCreateConversation']>>['conversation'],
    messageData: TrelloMessageData
  ) {
    return conversation.tags.lastCommentId === messageData.messageId
  }

  private async createMessage(
    user: Awaited<ReturnType<bp.Client['getOrCreateUser']>>['user'],
    conversation: Awaited<ReturnType<bp.Client['getOrCreateConversation']>>['conversation'],
    messageData: TrelloMessageData
  ) {
    await this.client.createMessage({
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
