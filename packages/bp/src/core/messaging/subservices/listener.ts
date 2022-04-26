import { ConversationStartedEvent, MessageFeedbackEvent, MessageNewEvent, uuid } from '@botpress/messaging-client'
import { WellKnownFlags } from 'core/dialog'
import { EventEngine, Event, EventRepository } from 'core/events'
import { MessagingCollector } from './collector'
import { MessagingInteractor } from './interactor'
import { MessagingLifetime } from './lifetime'

export class MessagingListener {
  private newUsers: number = 0
  private newMessages: number = 0

  constructor(
    private eventEngine: EventEngine,
    private eventRepo: EventRepository,
    private interactor: MessagingInteractor,
    private lifetime: MessagingLifetime,
    private collector: MessagingCollector
  ) {}

  async setup() {
    this.interactor.client.on('user', this.handleUserNewEvent.bind(this))
    this.interactor.client.on('started', this.handleConversationStartedEvent.bind(this))
    this.interactor.client.on('message', this.handleMessageNewEvent.bind(this))
    this.interactor.client.on('feedback', this.handleMessageFeedback.bind(this))
  }

  getNewMessagesCount({ resetCount }: { resetCount: boolean }) {
    const count = this.newMessages
    if (resetCount) {
      this.newMessages = 0
    }
    return count
  }

  getNewUsersCount({ resetCount }: { resetCount: boolean }) {
    const count = this.newUsers
    if (resetCount) {
      this.newUsers = 0
    }
    return count
  }

  private handleUserNewEvent() {
    this.newUsers++
  }

  private async handleConversationStartedEvent(clientId: uuid, data: ConversationStartedEvent) {
    if (this.interactor.shouldSkipChannel(data.channel)) {
      return
    }

    const event = Event({
      direction: 'incoming',
      type: 'proactive-trigger',
      payload: {},
      channel: data.channel,
      threadId: data.conversationId,
      target: data.userId,
      botId: this.lifetime.getBotId(clientId)
    })
    event.setFlag(WellKnownFlags.SKIP_DIALOG_ENGINE, true)

    return this.eventEngine.sendEvent(event)
  }

  private async handleMessageNewEvent(clientId: uuid, data: MessageNewEvent) {
    if (this.interactor.shouldSkipChannel(data.channel) || !data.message.authorId) {
      return
    }

    const event = Event({
      direction: 'incoming',
      type: data.message.payload.type,
      payload: data.message.payload,
      channel: data.channel,
      threadId: data.conversationId,
      target: data.userId,
      messageId: data.message.id,
      botId: this.lifetime.getBotId(clientId)
    })

    if (data.collect) {
      this.collector.set(event.id, data.message.id)
    }

    this.newMessages++

    return this.eventEngine.sendEvent(event)
  }

  private async handleMessageFeedback(clientId: uuid, data: MessageFeedbackEvent) {
    const botId = this.lifetime.getBotId(clientId)
    const [event] = await this.eventRepo.findEvents({ botId, messageId: data.messageId })

    if (event?.incomingEventId) {
      await this.eventRepo.saveUserFeedback(event.incomingEventId, data.userId, data.feedback, 'qna')
    }
  }
}
