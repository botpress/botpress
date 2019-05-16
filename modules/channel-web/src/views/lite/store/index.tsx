import isBefore from 'date-fns/is_before'
import { action, computed, observable, runInAction, when } from 'mobx'
import ms from 'ms'

import WebchatApi from '../core/api'
import constants from '../core/constants'
import { getUserLocale } from '../translations'
import { BotInfo, Config, ConversationSummary, CurrentConversation, Message, StudioConnector } from '../typings'

import { downloadFile } from './../utils'
import ComposerStore from './composer'
import ViewStore from './view'

/** Includes the partial definitions of all classes */
export type StoreDef = Partial<RootStore> & Partial<ViewStore> & Partial<ComposerStore> & Partial<Config>

class RootStore {
  public bp: StudioConnector
  public composer: ComposerStore
  public view: ViewStore

  private _typingInterval
  private api: WebchatApi

  @observable
  public conversations: ConversationSummary[] = []

  @observable
  public currentConversation: CurrentConversation

  @observable
  public botInfo: BotInfo

  @observable
  public config: Config

  constructor({ fullscreen }) {
    this.composer = new ComposerStore(this)
    this.view = new ViewStore(this, fullscreen)
  }

  @computed
  get isConversationStarted(): boolean {
    return this.currentConversation && !!this.currentConversation.messages.length
  }

  @computed
  get botName(): string {
    return (this.botInfo && this.botInfo.name) || (this.config && this.config.botName) || 'Bot'
  }

  @computed
  get hasBotInfoDescription(): boolean {
    return this.config.botConvoDescription && !!this.config.botConvoDescription.length
  }

  @computed
  get botAvatarUrl(): string {
    return (
      (this.botInfo && this.botInfo.details && this.botInfo.details.avatarUrl) || (this.config && this.config.avatarUrl)
    )
  }

  @computed
  get currentMessages(): Message[] {
    return this.currentConversation && this.currentConversation.messages
  }

  @computed
  get currentConvoTyping() {
    return this.currentConversation && this.currentConversation.typingUntil
  }

  @computed
  get currentConversationId(): number | undefined {
    return this.currentConversation && this.currentConversation.id
  }

  /** Inserts the incoming message in the conversation array */
  @action.bound
  async addEventToConversation(event: Message) {
    if (!this._validateConvoId(+event.conversationId)) {
      return
    }

    this.currentConversation.messages.push({ ...event, conversationId: +event.conversationId })
    this.currentConversation.typingUntil = event.userId ? this.currentConversation.typingUntil : undefined
  }

  @action.bound
  async updateTyping(event: Message) {
    if (!this._validateConvoId(+event.conversationId)) {
      return
    }

    this.currentConversation.typingUntil = new Date(Date.now() + event.timeInMs)
    when(() => this.currentConversation && this.currentConversation.typingUntil !== undefined, this._startExpiredTimer)
  }

  /** Loads the initial state, for the first time or when the user ID is changed. */
  @action.bound
  async initializeChat() {
    try {
      await this.fetchBotInfo()
      await this.fetchConversations()
      await this.fetchConversation()
    } catch (err) {
      console.log('Error while fetching data, creating new convo...', err)
      await this.createConversation()
    }

    await this.sendUserVisit()
  }

  @action.bound
  async fetchBotInfo() {
    const botInfo = await this.api.fetchBotInfo()
    runInAction('-> setBotInfo', () => {
      this.botInfo = botInfo
    })
  }

  /** Fetches the list of conversation, and update the corresponding config values */
  @action.bound
  async fetchConversations() {
    const { conversations, recentConversationLifetime, startNewConvoOnTimeout } = await this.api.fetchConversations()

    runInAction('-> setConversations', () => {
      if (!conversations.length) {
        this.view.showBotInfo()
      }

      this.config.recentConversationLifetime = recentConversationLifetime
      this.config.startNewConvoOnTimeout = startNewConvoOnTimeout
      this.conversations = conversations
    })
  }

  /** Fetch the specified conversation ID, or try to fetch a valid one from the list */
  @action.bound
  async fetchConversation(convoId?: number) {
    const conversation = await this.api.fetchConversation(convoId || this._getCurrentConvoId())
    runInAction('-> setConversation', () => {
      this.currentConversation = conversation
      this.view.hideConversations()
    })
  }

  /** Sends the specified message, or fetch the message in the composer */
  @action.bound
  async sendMessage(message?: string) {
    if (message) {
      await this.sendData({ type: 'text', text: message })
      return
    }

    const userMessage = this.composer.message
    if (!userMessage || !userMessage.length) {
      return
    }
    await this.sendData({ type: 'text', text: userMessage })

    this.composer.addMessageToHistory(userMessage)
    this.composer.updateMessage('')
  }

  /** Sends an event to start conversation & hide the bot info page */
  @action.bound
  async startConversation() {
    await this.sendData({ type: 'request_start_conversation' })
    await this.view.toggleBotInfo()
  }

  /** Creates a new conversation and switches to it */
  @action.bound
  async createConversation() {
    const newId = await this.api.createConversation()
    await this.fetchConversations()
    await this.fetchConversation(newId)
  }

  @action.bound
  resetConversation() {
    this.currentConversation = undefined
  }

  @action.bound
  async resetSession() {
    return this.api.resetSession(this.currentConversationId)
  }

  @action.bound
  async sendUserVisit() {
    await this.sendData({
      type: 'visit',
      text: 'User visit',
      timezone: new Date().getTimezoneOffset() / 60,
      language: getUserLocale()
    })
  }

  @action.bound
  async downloadConversation() {
    try {
      const { txt, name } = await this.api.downloadConversation(this.currentConversationId)
      const blobFile = new Blob([txt])

      downloadFile(name, blobFile)
    } catch (err) {
      console.log('Error trying to download conversation')
    }
  }

  /** Sends an event or a message, depending on how the backend manages those types */
  @action.bound
  async sendData(data: any) {
    if (!constants.MESSAGE_TYPES.includes(data.type)) {
      return await this.api.sendEvent(data)
    }

    await this.api.sendMessage(data, this.currentConversationId)
  }

  @action.bound
  async uploadFile(title: string, payload: string, file: File) {
    const data = new FormData()
    data.append('file', file)

    await this.api.uploadFile(file, this.currentConversationId)
  }

  @action.bound
  updateConfig(config: Config, bp?: StudioConnector) {
    this.config = config

    if (!this.api) {
      this.bp = bp
      this.api = new WebchatApi('', bp.axios)
    }

    this.config.layoutWidth && this.view.setLayoutWidth(this.config.layoutWidth)
    this.config.containerWidth && this.view.setContainerWidth(this.config.containerWidth)

    this.api.updateAxiosConfig({ botId: config.botId, externalAuthToken: config.externalAuthToken })
  }

  /** When this method is used, the user ID is changed in the configuration, then the socket is updated */
  @action.bound
  setUserId(userId: string): void {
    this.config.userId = userId
    this.api.updateUserId(userId)
  }

  /**
   * If an incoming event is for a different conversation ID, we'll fetch the corresponding conversation
   * In that case, we discard the incoming change
   *
   */
  @action.bound
  private async _validateConvoId(incomingConvoId: number): Promise<boolean> {
    if (this.currentConversationId !== incomingConvoId) {
      await this.fetchConversations()
      await this.fetchConversation(incomingConvoId)
      return false
    }
    return true
  }

  /** Starts a timer to remove the typing animation when it's completed */
  @action.bound
  private _startExpiredTimer() {
    if (this._typingInterval) {
      return
    }

    this._typingInterval = setInterval(() => {
      const typeUntil = this.currentConversation && this.currentConversation.typingUntil
      if (!typeUntil || isBefore(new Date(typeUntil), new Date())) {
        this._expireTyping()
      }
    }, 50)
  }

  @action.bound
  private _expireTyping() {
    this.currentConversation.typingUntil = undefined

    clearInterval(this._typingInterval)
    this._typingInterval = undefined
  }

  /** Returns the current conversation ID, or the last one if it didn't expired. Otherwise, returns nothing. */
  private _getCurrentConvoId(): number | undefined {
    if (this.currentConversationId) {
      return this.currentConversationId
    }

    if (!this.conversations.length) {
      return
    }

    const lifeTimeMargin = Date.now() - ms(this.config.recentConversationLifetime)
    const isConversationExpired = new Date(this.conversations[0].last_heard_on).getTime() < lifeTimeMargin
    if (isConversationExpired && this.config.startNewConvoOnTimeout) {
      return
    }

    return this.conversations[0].id
  }
}

export { RootStore }
