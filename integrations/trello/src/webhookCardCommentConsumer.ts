import * as bp from '../.botpress'
import { CommentCardEvent } from './schemas/webhookEvents/commentCardEventSchema'

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
  private messageData!: TrelloMessageData
  private conversation!: Awaited<ReturnType<bp.Client['getOrCreateConversation']>>['conversation']
  private user!: Awaited<ReturnType<bp.Client['getOrCreateUser']>>['user']

  public constructor(
    private readonly client: bp.HandlerProps['client'],
    private readonly cardCommentEvent: CommentCardEvent
  ) {}

  public async consumeComment() {
    this.extractMessageDataFromEvent()
    await Promise.all([this.getOrCreateConversation(), this.getOrCreateUser()])

    if (this.checkIfMessageWasSentByOurselvesAndShouldBeIgnored()) {
      return
    }

    await this.createMessage()
  }

  private extractMessageDataFromEvent() {
    this.messageData = {
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

  private async getOrCreateConversation() {
    const { conversation } = await this.client.getOrCreateConversation({
      channel: 'cardComments',
      tags: {
        cardId: this.messageData.cardId,
        cardName: this.messageData.cardName,
        listId: this.messageData.listId,
        listName: this.messageData.listName,
      },
    })

    this.conversation = conversation
  }

  private async getOrCreateUser() {
    const { user } = await this.client.getOrCreateUser({
      tags: {
        userId: this.messageData.messageAuthorId,
      },
      name: this.messageData.messageAuthorName,
      pictureUrl: this.messageData.messageAuthorAvatar,
    })

    this.user = user
  }

  private checkIfMessageWasSentByOurselvesAndShouldBeIgnored() {
    return this.conversation.tags.lastCommentId === this.messageData.messageId
  }

  private async createMessage() {
    await this.client.createMessage({
      tags: {
        commentId: this.messageData.messageId,
      },
      type: 'text',
      userId: this.user.id,
      conversationId: this.conversation.id,
      payload: { text: this.messageData.messageText },
    })
  }
}
