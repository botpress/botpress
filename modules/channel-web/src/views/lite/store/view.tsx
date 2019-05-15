import { action, computed, observable, runInAction } from 'mobx'

import constants from '../core/constants'

import { RootStore } from '.'

class ViewStore {
  private rootStore: RootStore

  /** If false, probably embedded on a website or on the studio */
  @observable
  public isFullscreen = true

  @observable
  public unreadCount = 0

  /** When true, the conversation list is displayed */
  @observable
  public displayConvos = false

  @observable
  public activeView: string

  @observable
  private transitions: any

  @observable
  private _isLoading = true

  @observable
  private _showBotInfo = false

  @observable
  private _focused = 'input'

  constructor(rootStore: RootStore, fullscreen: boolean) {
    this.rootStore = rootStore
    this.isFullscreen = fullscreen
    this.activeView = this.isFullscreen ? 'side' : 'widget'
  }

  @computed
  get showConversationsButton() {
    return this.rootStore.config && this.rootStore.config.showConversationsButton
  }

  @computed
  get showBotInfoButton() {
    return !this.displayConvos && this.rootStore.botInfo && this.rootStore.botInfo.showBotInfoPage
  }

  @computed
  get showDownloadButton() {
    return !this.displayConvos && !this.displayBotInfo && this.rootStore.config.enableTranscriptDownload
  }

  @computed
  get showResetButton() {
    return !this.displayConvos && !this.displayBotInfo && this.rootStore.config && this.rootStore.config.enableReset
  }

  @computed
  get showCloseButton() {
    return !this.isFullscreen
  }

  @computed
  get showWidgetButton() {
    return this.rootStore.config && !this.rootStore.config.hideWidget
  }

  @computed
  get hasUnreadMessages(): boolean {
    return this.unreadCount > 0
  }

  /** Tells when the webchat is ready */
  @computed
  get isReady() {
    return !this._isLoading && this.activeView
  }

  /** When true, the bot info page is displayed */
  @computed
  get displayBotInfo(): boolean {
    return this._showBotInfo && (this.rootStore.botInfo && this.rootStore.botInfo.showBotInfoPage)
  }

  /** Returns the active transition for the side panel, like fade in or out */
  @computed
  get sideTransition() {
    return !this.isFullscreen && this.transitions && this.transitions.sideTransition
  }

  @computed
  get widgetTransition() {
    return this.transitions && this.transitions.widgetTransition
  }

  @computed
  get displayWidgetView() {
    return this.activeView !== 'side' && !this.isFullscreen
  }

  /** Sets the current focus to that element */
  @action.bound
  setFocus(element: string) {
    this._focused = element
  }

  @action.bound
  focusPrevious() {
    const current = this._getFocusOrder(this._focused)
    if (current) {
      this._focused = current.prev
    }
  }

  @action.bound
  focusNext() {
    const current = this._getFocusOrder(this._focused)
    if (current) {
      this._focused = current.next
    }
  }

  @action.bound
  incrementUnread() {
    this.unreadCount++
  }

  @action.bound
  resetUnread() {
    this.unreadCount = 0
  }

  @action.bound
  toggleBotInfo() {
    this._showBotInfo = !this._showBotInfo
  }

  @action.bound
  showBotInfo() {
    this._showBotInfo = true
  }

  @action.bound
  toggleConversations() {
    this.displayConvos = !this.displayConvos
  }

  @action.bound
  hideConversations() {
    this.displayConvos = false
  }

  @action.bound
  setLoadingCompleted() {
    this._isLoading = false
  }

  @action.bound
  showChat() {
    this._updateTransitions({ widgetTransition: 'fadeOut' })

    setTimeout(() => {
      this._updateTransitions({ sideTransition: 'fadeIn' })
    }, constants.ANIM_DURATION + 10)

    this._endAnimation('side')
  }

  @action.bound
  hideChat() {
    if (this.isFullscreen) {
      return
    }
    this._updateTransitions({ sideTransition: 'fadeOut' })

    if (!this.activeView || this.activeView === 'side') {
      setTimeout(() => {
        this._updateTransitions({ widgetTransition: 'fadeIn' })
      }, constants.ANIM_DURATION + 10)
    }

    this._endAnimation('widget')
  }

  @action.bound
  private _endAnimation(finalView) {
    setTimeout(() => {
      runInAction(() => {
        this.activeView = finalView
      })
    }, constants.ANIM_DURATION)

    setTimeout(() => {
      this._updateTransitions({
        widgetTransition: undefined,
        sideTransition: this.transitions.sideTransition === 'fadeIn' && 'fadeIn'
      })
    }, constants.ANIM_DURATION * 2.1)
  }

  @action.bound
  private _updateTransitions(trans) {
    this.transitions = trans
  }

  private _getFocusOrder(current) {
    if (current === 'header') {
      return { prev: 'input', next: 'convo' }
    } else if (current === 'input' && !this.displayConvos && !this._showBotInfo) {
      return { prev: 'convo', next: 'header' }
    } else if (current === 'convo') {
      return { prev: 'header', next: 'input' }
    }
  }

  isFocused = view => {
    if (this._focused === view) {
      if (view !== 'input' || (view === 'input' && !this.displayConvos && !this._showBotInfo)) {
        return true
      }
    }

    return false
  }
}

export default ViewStore
