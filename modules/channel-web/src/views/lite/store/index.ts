import isBefore from 'date-fns/is_before'
import isValid from 'date-fns/is_valid'
import merge from 'lodash/merge'
import { action, computed, observable, runInAction } from 'mobx'
import ms from 'ms'
import { InjectedIntl } from 'react-intl'

import WebchatApi from '../core/api'
import constants from '../core/constants'
import { getUserLocale, initializeLocale } from '../translations'
import {
  BotInfo,
  Config,
  CurrentConversation,
  EventFeedback,
  Message,
  MessageWrapper,
  QueuedMessage,
  RecentConversation,
  StudioConnector,
  uuid
} from '../typings'
import { downloadFile, isRTLLocale, trackMessage } from '../utils'

import ComposerStore from './composer'
import ViewStore from './view'

/** Includes the partial definitions of all classes */
export type StoreDef = Partial<RootStore> & Partial<ViewStore> & Partial<ComposerStore> & Partial<Config>

initializeLocale()
const chosenLocale = getUserLocale()

class RootStore {
  public bp: StudioConnector
  public composer: ComposerStore
  public view: ViewStore

  private _typingInterval: ReturnType<typeof setInterval> | undefined
  private api: WebchatApi

  @observable
  public conversations: RecentConversation[] = []

  @observable
  public currentConversation: CurrentConversation

  @observable
  public botInfo: BotInfo

  @observable
  public config: Config

  @observable
  public preferredLanguage: string

  @observable
  public isInitialized: boolean

  @observable
  public messageFeedbacks: EventFeedback[]

  public intl: InjectedIntl

  public isBotTyping = observable.box(false)

  /** When a wrapper is defined, every messages are wrapped by the specified component */
  @observable
  public messageWrapper: MessageWrapper | undefined

  @observable
  public botUILanguage: string = chosenLocale

  public delayedMessages: QueuedMessage[] = []

  constructor({ fullscreen }) {
    this.composer = new ComposerStore(this)
    this.view = new ViewStore(this, fullscreen)
  }

  @action.bound
  setIntlProvider(provider: InjectedIntl) {
    this.intl = provider
  }

  @computed
  get isConversationStarted(): boolean {
    return !!this.currentConversation?.messages.length
  }

  @computed
  get botName(): string {
    return this.config?.botName || this.botInfo?.name || 'Bot'
  }

  @computed
  get alwaysScrollDownOnMessages(): boolean {
    return this.botInfo.alwaysScrollDownOnMessages || false
  }

  @computed
  get isEmulator(): boolean {
    return this.config?.isEmulator || false
  }

  @computed
  get hasBotInfoDescription(): boolean {
    return !!this.config.botConvoDescription?.length
  }

  @computed
  get botAvatarUrl(): string {
    return (
      this.botInfo?.details?.avatarUrl ||
      this.config?.avatarUrl ||
      (this.config.isEmulator && `${window.ROOT_PATH}/assets/modules/channel-web/images/emulator-default.svg`)
    )
  }

  @computed
  get rtl(): boolean {
    return isRTLLocale(this.preferredLanguage)
  }

  @computed
  get escapeHTML(): boolean {
    return this.botInfo?.security?.escapeHTML
  }

  @computed
  get currentMessages(): Message[] {
    return this.currentConversation?.messages
  }

  @computed
  get currentConversationId(): uuid | undefined {
    return this.currentConversation?.id
  }

  @action.bound
  postMessage(name: string, payload?: any) {
    const chatId = this.config.chatId
    window.parent.postMessage({ name, chatId, payload }, '*')
  }

  @action.bound
  updateMessages(messages: Message[]) {
    this.currentConversation.messages = messages
  }

  @action.bound
  clearMessages() {
    this.currentConversation.messages = []
  }

  @action.bound
  async deleteConversation(): Promise<void> {
    if (this.currentConversation !== undefined && this.currentConversation.messages.length > 0) {
      await this.api.deleteMessages(this.currentConversationId)

      this.clearMessages()
    }
  }

  @action.bound
  async loadEventInDebugger(messageId: uuid, isManual?: boolean): Promise<void> {
    if (!this.config.isEmulator || !messageId) {
      return
    }

    const messages = await this.api.listByIncomingEvent(messageId)
    this.view.setHighlightedMessages(messages)
    window.parent.postMessage({ action: 'load-event', payload: { messageId, isManual } }, '*')
  }

  @action.bound
  async addEventToConversation(event: Message): Promise<void> {
    if (this.isInitialized && this.currentConversationId !== event.conversationId) {
      await this.fetchConversations()
      await this.fetchConversation(event.conversationId)
      return
    }

    // Autoplay bot voice messages
    if (event.payload?.type === 'voice' && !event.authorId) {
      event.payload.autoPlay = true
    }

    const message: Message = { ...event, conversationId: event.conversationId }
    if (this.isBotTyping.get() && !event.authorId) {
      this.delayedMessages.push({ message, showAt: this.currentConversation.typingUntil })
    } else {
      this.currentConversation.messages.push(message)
    }
  }

  @action.bound
  async updateTyping(event: Message): Promise<void> {
    if (this.isInitialized && this.currentConversationId !== event.conversationId) {
      await this.fetchConversations()
      await this.fetchConversation(event.conversationId)
      return
    }

    let start = new Date()
    if (isBefore(start, this.currentConversation.typingUntil)) {
      start = this.currentConversation.typingUntil
    }
    this.currentConversation.typingUntil = new Date(+start + event.timeInMs)
    this._startTypingTimer()
  }

  /** Loads the initial state, for the first time or when the user ID is changed. */
  @action.bound
  async initializeChat(): Promise<void> {
    try {
      await this.fetchConversations()
      await this.fetchConversation(this.config.conversationId)
      runInAction('-> setInitialized', () => {
        this.isInitialized = true
        this.postMessage('webchatReady')
      })
    } catch (err) {
      console.error('Error while fetching data, creating new convo...', err)
      await this.createConversation()
    }

    await this.fetchPreferences()
    await this.sendUserVisit()
  }

  @action.bound
  async fetchBotInfo(): Promise<void> {
    const botInfo = await this.api.fetchBotInfo()
    runInAction('-> setBotInfo', () => {
      this.botInfo = botInfo
    })
    this.mergeConfig({
      extraStylesheet: botInfo.extraStylesheet,
      disableNotificationSound: botInfo.disableNotificationSound
    })
  }

  @action.bound
  async fetchPreferences(): Promise<void> {
    const preferences = await this.api.fetchPreferences()
    if (!preferences.language) {
      return
    }
    runInAction('-> setPreferredLanguage', () => {
      this.updateBotUILanguage(preferences.language)
    })
  }

  /** Fetches the list of conversation, and update the corresponding config values */
  @action.bound
  async fetchConversations(): Promise<void> {
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
  async fetchConversation(convoId?: uuid): Promise<uuid> {
    const conversationId = convoId || this._getCurrentConvoId()
    if (!conversationId) {
      return this.createConversation()
    }

    const conversation: CurrentConversation = await this.api.fetchConversation(convoId || this._getCurrentConvoId())
    if (conversation?.messages.length) {
      conversation.messages = conversation.messages.sort(
        (a, b) => new Date(a.sentOn).getTime() - new Date(b.sentOn).getTime()
      )
      await this.extractFeedback(conversation.messages)
    }

    runInAction('-> setConversation', () => {
      this.currentConversation = conversation
      this.view.hideConversations()
    })
  }

  /** Sends the specified message, or fetch the message in the composer */
  @action.bound
  async sendMessage(message?: string): Promise<void> {
    if (message) {
      return this.sendData({ type: 'text', text: message })
    }

    const userMessage = this.composer.message
    if (!userMessage || !userMessage.length) {
      return
    }

    this.composer.updateMessage('')
    try {
      await this.sendData({ type: 'text', text: userMessage })
      trackMessage('sent')

      this.composer.addMessageToHistory(userMessage)
    } catch (e) {
      this.composer.updateMessage(userMessage)
      throw e
    }
  }

  /** Sends an event to start conversation & hide the bot info page */
  @action.bound
  async startConversation(): Promise<void> {
    await this.sendData({ type: 'request_start_conversation' })
    this.view.toggleBotInfo()
  }

  /** Creates a new conversation and switches to it */
  @action.bound
  async createConversation(): Promise<uuid> {
    const newId = await this.api.createConversation()
    await this.fetchConversations()
    await this.fetchConversation(newId)
    return newId
  }

  @action.bound
  async setReference(): Promise<void> {
    return this.api.setReference(this.config.reference, this.currentConversationId)
  }

  @action.bound
  resetConversation() {
    this.currentConversation = undefined
  }

  @action.bound
  async resetSession(): Promise<void> {
    this.composer.setLocked(false)

    return this.api.resetSession(this.currentConversationId)
  }

  @action.bound
  async sendUserVisit(): Promise<void> {
    await this.sendData({
      type: 'visit',
      text: 'User visit',
      timezone: -(new Date().getTimezoneOffset() / 60), // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset#description
      language: getUserLocale()
    })
  }

  @action.bound
  async extractFeedback(messages: Message[]): Promise<void> {
    const feedbackMessageIds = messages.filter(x => x.payload && x.payload.collectFeedback).map(x => x.id)

    if (!feedbackMessageIds.length) {
      return
    }

    const feedbackInfo = await this.api.getMessageIdsFeedbackInfo(feedbackMessageIds)
    runInAction('-> setFeedbackInfo', () => {
      this.messageFeedbacks = feedbackInfo
    })
  }

  @action.bound
  async sendFeedback(feedback: number, messageId: string): Promise<void> {
    await this.api.sendFeedback(feedback, messageId)
  }

  @action.bound
  async downloadConversation(): Promise<void> {
    try {
      const { txt, name } = await this.api.downloadConversation(this.currentConversationId)
      const blobFile = new Blob([txt])

      downloadFile(name, blobFile)
    } catch (err) {
      console.error('Error trying to download conversation')
    }
  }

  /** Sends an event or a message, depending on how the backend manages those types */
  @action.bound
  async sendData(data: any): Promise<void> {
    if (!this.isInitialized) {
      console.warn('[webchat] Cannot send data until the webchat is ready')
      return
    }

    if (!constants.MESSAGE_TYPES.includes(data.type)) {
      return this.api.sendEvent(data, this.currentConversationId)
    }

    await this.api.sendMessage(data, this.currentConversationId)
  }

  @action.bound
  async uploadFile(title: string, payload: string, file: File): Promise<void> {
    await this.api.uploadFile(file, payload, this.currentConversationId)
  }

  /** Sends a message of type voice */
  @action.bound
  async sendVoiceMessage(voice: Buffer, ext: string): Promise<void> {
    return this.api.sendVoiceMessage(voice, ext, this.currentConversationId)
  }

  /** Use this method to replace a value or add a new config */
  @action.bound
  mergeConfig(config: Partial<Config>) {
    this.config = merge(this.config, config)
    this._applyConfig()
  }

  /** This replaces all the configurations by this object */
  @action.bound
  updateConfig(config: Config, bp?: StudioConnector) {
    this.config = config

    if (!this.api) {
      this.bp = bp
      this.api = new WebchatApi(bp.axios)
    }

    this._applyConfig()
  }

  private _applyConfig() {
    this.config.layoutWidth && this.view.setLayoutWidth(this.config.layoutWidth)
    this.config.containerWidth && this.view.setContainerWidth(this.config.containerWidth)
    this.view.disableAnimations = this.config.disableAnimations
    this.config.showPoweredBy ? this.view.showPoweredBy() : this.view.hidePoweredBy()

    document.title = this.config.botName || window.APP_NAME

    if (window.APP_FAVICON) {
      const link = document.querySelector('link[rel="icon"]')
      link && link.setAttribute('href', window.APP_FAVICON)
    }

    if (window.APP_CUSTOM_CSS) {
      const sheet = document.createElement('link')
      sheet.rel = 'stylesheet'
      sheet.href = window.APP_CUSTOM_CSS
      sheet.type = 'text/css'
      document.head.appendChild(sheet)
    }

    this.api.updateAxiosConfig({ botId: this.config.botId, externalAuthToken: this.config.externalAuthToken })

    if (!this.isInitialized) {
      window.USE_SESSION_STORAGE = this.config.useSessionStorage
    } else if (window.USE_SESSION_STORAGE !== this.config.useSessionStorage) {
      console.warn('[WebChat] "useSessionStorage" value cannot be altered once the webchat is initialized')
    }

    const locale = this.config.locale ? getUserLocale(this.config.locale) : chosenLocale
    this.updateBotUILanguage(locale)
    document.documentElement.setAttribute('lang', locale)

    this.publishConfigChanged()
  }

  @action.bound
  async setCustomUserId(userId: string): Promise<void> {
    return this.api.setCustomUserId(userId)
  }

  @action.bound
  publishConfigChanged() {
    this.postMessage('configChanged', JSON.stringify(this.config, undefined, 2))
  }

  @action.bound
  setMessageWrapper(messageWrapper: MessageWrapper) {
    this.messageWrapper = messageWrapper
  }

  @action.bound
  async updatePreferredLanguage(lang: string): Promise<void> {
    this.updateBotUILanguage(lang)
    this.preferredLanguage = lang
    await this.api.updateUserPreferredLanguage(lang)
  }

  /** Starts a timer to remove the typing animation when it's completed */
  @action.bound
  private _startTypingTimer() {
    if (this._typingInterval) {
      return
    }
    this.isBotTyping.set(true)

    this._typingInterval = setInterval(() => {
      const typeUntil = new Date(this.currentConversation && this.currentConversation.typingUntil)
      if (!typeUntil || !isValid(typeUntil) || isBefore(typeUntil, new Date())) {
        this._expireTyping()
      } else {
        this.emptyDelayedMessagesQueue(false)
      }
    }, 50)
  }

  @action.bound
  private _expireTyping() {
    this.emptyDelayedMessagesQueue(true)
    this.isBotTyping.set(false)
    this.currentConversation.typingUntil = undefined

    clearInterval(this._typingInterval)
    this._typingInterval = undefined
  }

  @action.bound
  updateBotUILanguage(lang: string): void {
    lang = getUserLocale(lang) // Ensure language is supported
    runInAction('-> setBotUILanguage', () => {
      this.botUILanguage = lang
      this.preferredLanguage = lang
      window.BP_STORAGE?.set('bp/channel-web/user-lang', lang)
    })
  }

  @action.bound
  private emptyDelayedMessagesQueue(removeAll: boolean) {
    while (this.delayedMessages.length) {
      const message = this.delayedMessages[0]
      if (removeAll || isBefore(message.showAt, new Date())) {
        this.currentConversation.messages.push(message.message)
        this.delayedMessages.shift()
      } else {
        break
      }
    }
  }

  /** Returns the current conversation ID, or the last one if it didn't expired. Otherwise, returns nothing. */
  private _getCurrentConvoId(): uuid | undefined {
    if (this.currentConversationId) {
      return this.currentConversationId
    }

    if (!this.conversations.length) {
      return
    }

    const lifeTimeMargin = Date.now() - ms(this.config.recentConversationLifetime)
    const isConversationExpired =
      new Date(this.conversations[0].lastMessage?.sentOn || this.conversations[0].createdOn).getTime() < lifeTimeMargin
    if (isConversationExpired && this.config.startNewConvoOnTimeout) {
      return
    }

    return this.conversations[0].id
  }
}

export { RootStore }
