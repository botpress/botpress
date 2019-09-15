import merge from 'lodash/merge'
import { action, computed, observable, runInAction } from 'mobx'

import constants from '../core/constants'
import { ChatDimensions, CustomAction, CustomButton } from '../typings'

import { RootStore } from '.'

class ViewStore {
  private rootStore: RootStore

  /** If false, probably embedded on a website or on the studio */
  @observable
  public isFullscreen = true

  @observable
  public unreadCount = 0

  @observable
  public dimensions: ChatDimensions

  @observable
  public isConversationsDisplayed = false

  @observable
  public activeView: string

  @observable
  private transitions: any

  @observable
  private _isLoading = true

  @observable
  private _showBotInfo = false

  @observable
  public isPoweredByDisplayed = true

  @observable
  public focusedArea = observable.box('input')

  /** These buttons are displayed in the header, and can point to actions on your custom components */
  @observable
  public customButtons: CustomButton[] = []

  @observable
  public customActions: CustomAction[] = []

  @observable
  public disableAnimations = false

  @observable
  public highlightedMessages = []

  constructor(rootStore: RootStore, fullscreen: boolean) {
    this.rootStore = rootStore
    this.isFullscreen = fullscreen
    this.activeView = fullscreen ? 'side' : 'widget'

    this.dimensions = {
      container: fullscreen ? '100%' : constants.DEFAULT_CONTAINER_WIDTH,
      layout: fullscreen ? '100%' : constants.DEFAULT_LAYOUT_WIDTH
    }
  }

  @computed
  get showConversationsButton() {
    return this.rootStore.config && this.rootStore.config.showConversationsButton
  }

  @computed
  get showBotInfoButton() {
    return !this.isConversationsDisplayed && this.rootStore.botInfo && this.rootStore.botInfo.showBotInfoPage
  }

  @computed
  get showDownloadButton() {
    return !this.isConversationsDisplayed && !this.isBotInfoDisplayed && this.rootStore.config.enableTranscriptDownload
  }

  @computed
  get showResetButton() {
    return (
      !this.isConversationsDisplayed &&
      !this.isBotInfoDisplayed &&
      this.rootStore.config &&
      this.rootStore.config.enableReset
    )
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

  @computed
  get isWebchatReady() {
    return !this._isLoading && this.activeView
  }

  @computed
  get isBotInfoDisplayed(): boolean {
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
    this.focusedArea.set(element)
  }

  @action.bound
  focusPrevious() {
    const current = this._getFocusOrder(this.focusedArea.get())
    if (current) {
      this.setFocus(current.prev)
    }
  }

  @action.bound
  focusNext() {
    const current = this._getFocusOrder(this.focusedArea.get())
    if (current) {
      this.setFocus(current.next)
    }
  }

  @action.bound
  postMessage(name: string) {
    window.parent.postMessage({ name: name }, '*')
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
    this.isConversationsDisplayed = !this.isConversationsDisplayed
  }

  @action.bound
  hideConversations() {
    this.isConversationsDisplayed = false
  }

  @action.bound
  setLoadingCompleted() {
    this._isLoading = false
    this.postMessage('webchatLoaded')
  }

  @action.bound
  showPoweredBy() {
    this.isPoweredByDisplayed = true
  }

  @action.bound
  hidePoweredBy() {
    this.isPoweredByDisplayed = false
  }

  @action.bound
  setLayoutWidth(width: string | number) {
    if (width) {
      this.dimensions.layout = typeof width === 'number' ? width + 'px' : width
    }
  }

  @action.bound
  setContainerWidth(width: string | number) {
    if (width) {
      this.dimensions.container = width = typeof width === 'number' ? width + 'px' : width
    }
  }

  @action.bound
  addCustomAction(newAction: CustomAction) {
    if (this.customActions.find(act => act.id === newAction.id)) {
      console.log(`Can't add another action with the same ID.`)
      return
    }

    this.customActions.push(newAction)
  }

  @action.bound
  removeCustomAction(actionId: string) {
    this.customActions = this.customActions.filter(btn => btn.id !== actionId)
  }

  @action.bound
  addHeaderButton(newButton: CustomButton) {
    if (this.customButtons.find(btn => btn.id === newButton.id)) {
      console.log(`Can't add another button with the same ID.`)
      return
    }

    this.customButtons.push(newButton)
  }

  @action.bound
  setHighlightedMessages(ids: string[]) {
    this.highlightedMessages = ids
  }

  /** Updates one or multiple properties of a specific button */
  @action.bound
  updateHeaderButton(buttonId: string, newProps: Partial<CustomButton>) {
    const button = this.customButtons.find(btn => btn.id === buttonId)
    button && merge(button, newProps)
  }

  @action.bound
  removeHeaderButton(buttonId: string) {
    this.customButtons = this.customButtons.filter(btn => btn.id !== buttonId)
  }

  @action.bound
  showChat() {
    if (this.disableAnimations) {
      this.activeView = 'side'
      return this._updateTransitions({ widgetTransition: undefined, sideTransition: 'none' })
    }

    this._updateTransitions({ widgetTransition: 'fadeOut' })

    setTimeout(() => {
      this._updateTransitions({ sideTransition: 'fadeIn' })
    }, constants.ANIM_DURATION + 10)

    this._endAnimation('side')

    this.postMessage('webchatOpened')
  }

  @action.bound
  hideChat() {
    if (this.isFullscreen) {
      return
    }

    if (this.disableAnimations) {
      this.activeView = 'widget'
      return this._updateTransitions({ widgetTransition: undefined, sideTransition: undefined })
    }

    this._updateTransitions({ sideTransition: 'fadeOut' })

    if (!this.activeView || this.activeView === 'side') {
      setTimeout(() => {
        this._updateTransitions({ widgetTransition: 'fadeIn' })
      }, constants.ANIM_DURATION + 10)
    }

    this._endAnimation('widget')

    this.postMessage('webchatClosed')
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
    } else if (current === 'input' && !this.isConversationsDisplayed && !this.isBotInfoDisplayed) {
      return { prev: 'convo', next: 'header' }
    } else if (current === 'convo') {
      return { prev: 'header', next: 'input' }
    }
  }
}

export default ViewStore
