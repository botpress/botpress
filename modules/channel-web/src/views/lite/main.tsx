import classnames from 'classnames'
import { observe } from 'mobx'
import { inject, observer } from 'mobx-react'
import queryString from 'query-string'
import React from 'react'
import { injectIntl } from 'react-intl'

import Container from './components/Container'
import constants from './core/constants'
import BpSocket from './core/socket'
import ChatIcon from './icons/Chat'
import { RootStore, StoreDef } from './store'
import { checkLocationOrigin, initializeAnalytics } from './utils'

const _values = obj => Object.keys(obj).map(x => obj[x])

class Web extends React.Component<MainProps> {
  private socket: BpSocket
  private parentClass: string

  state = {
    played: false
  }

  constructor(props) {
    super(props)

    checkLocationOrigin()
    initializeAnalytics()
  }

  componentDidMount() {
    this.props.store.setIntlProvider(this.props.intl)
    window.store = this.props.store

    window.addEventListener('message', this.handleIframeApi)
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.props.hideChat()
        window.parent.document.getElementById('mainLayout').focus()
      }
    })

    // tslint:disable-next-line: no-floating-promises
    this.initialize()
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleIframeApi)
  }

  async initialize() {
    const config = this.extractConfig()

    this.socket = new BpSocket(this.props.bp, config)
    this.socket.onMessage = this.handleNewMessage
    this.socket.onTyping = this.props.updateTyping
    this.socket.onUserIdChanged = this.props.setUserId
    this.socket.setup()

    config.overrides && this.loadOverrides(config.overrides)
    config.userId && this.socket.changeUserId(config.userId)

    await this.socket.waitForUserId()
    await this.props.initializeChat()

    this.setupObserver()

    this.props.setLoadingCompleted()
  }

  extractConfig() {
    const { options } = queryString.parse(location.search)
    const { config } = JSON.parse(decodeURIComponent(options || '{}'))

    const userConfig = Object.assign({}, constants.DEFAULT_CONFIG, config)
    this.props.updateConfig(userConfig, this.props.bp)

    return userConfig
  }

  loadOverrides(overrides) {
    try {
      for (const override of _values(overrides)) {
        override.map(({ module }) => this.props.bp.loadModuleView(module, true))
      }
    } catch (err) {
      console.error('Error while loading overrides', err.message)
    }
  }

  setupObserver() {
    observe(this.props.config, 'userId', async data => {
      if (!data.oldValue || data.oldValue === data.newValue) {
        return
      }

      await this.socket.changeUserId(data.newValue)
      await this.props.initializeChat()
    })

    observe(this.props.config, 'overrides', data => {
      if (data.newValue && window.parent) {
        this.loadOverrides(data.newValue)
      }
    })

    observe(this.props.dimensions, 'container', data => {
      if (data.newValue && window.parent) {
        window.parent.postMessage({ type: 'setWidth', value: data.newValue }, '*')
      }
    })
  }

  handleIframeApi = async ({ data: { action, payload } }) => {
    if (action === 'configure') {
      this.props.updateConfig(Object.assign({}, constants.DEFAULT_CONFIG, payload))
    } else if (action === 'mergeConfig') {
      this.props.mergeConfig(payload)
    } else if (action === 'event') {
      const { type, text } = payload

      if (type === 'show') {
        this.props.showChat()
      } else if (type === 'hide') {
        this.props.hideChat()
      } else if (type === 'toggle') {
        this.props.displayWidgetView ? this.props.showChat() : this.props.hideChat()
      } else if (type === 'message') {
        await this.props.sendMessage(text)
      } else if (type === 'toggleBotInfo') {
        this.props.toggleBotInfo()
      } else {
        await this.props.sendData({ type, payload })
      }
    }
  }

  handleNewMessage = async event => {
    if ((event.payload && event.payload.type === 'visit') || event.message_type === 'visit') {
      // don't do anything, it's the system message
      return
    }

    await this.props.addEventToConversation(event)

    // there's no focus on the actual conversation
    if ((document.hasFocus && !document.hasFocus()) || this.props.activeView !== 'side') {
      await this.playSound()
      this.props.incrementUnread()
    }

    this.handleResetUnreadCount()
  }

  async playSound() {
    if (this.state.played) {
      return
    }

    const audio = new Audio('/assets/modules/channel-web/notification.mp3')
    await audio.play()

    this.setState({ played: true })

    setTimeout(() => {
      this.setState({ played: false })
    }, constants.MIN_TIME_BETWEEN_SOUNDS)
  }

  handleResetUnreadCount = () => {
    if (document.hasFocus && document.hasFocus() && this.props.activeView === 'side') {
      this.props.resetUnread()
    }
  }

  renderWidget() {
    if (!this.props.showWidgetButton) {
      return null
    }

    return (
      <button
        className={classnames('bpw-widget-btn', 'bpw-floating-button', {
          ['bpw-anim-' + this.props.widgetTransition]: true
        })}
        onClick={this.props.showChat.bind(this)}
      >
        <ChatIcon />
        {this.props.hasUnreadMessages && <span className={'bpw-floating-button-unread'}>{this.props.unreadCount}</span>}
      </button>
    )
  }

  render() {
    if (!this.props.isWebchatReady) {
      return null
    }

    const parentClass = classnames(`bp-widget-web bp-widget-${this.props.activeView}`, {
      'bp-widget-hidden': !this.props.showWidgetButton && this.props.displayWidgetView
    })

    if (this.parentClass !== parentClass) {
      window.parent && window.parent.postMessage({ type: 'setClass', value: parentClass }, '*')
      this.parentClass = parentClass
    }

    const { stylesheet, extraStylesheet } = this.props.config

    return (
      <div onFocus={this.handleResetUnreadCount}>
        {stylesheet && stylesheet.length && <link rel="stylesheet" type="text/css" href={stylesheet} />}
        {extraStylesheet && extraStylesheet.length && <link rel="stylesheet" type="text/css" href={extraStylesheet} />}
        {this.props.displayWidgetView ? this.renderWidget() : <Container />}
      </div>
    )
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  store,
  config: store.config,
  sendData: store.sendData,
  initializeChat: store.initializeChat,
  updateConfig: store.updateConfig,
  mergeConfig: store.mergeConfig,
  addEventToConversation: store.addEventToConversation,
  setUserId: store.setUserId,
  updateTyping: store.updateTyping,
  sendMessage: store.sendMessage,

  isWebchatReady: store.view.isWebchatReady,
  showWidgetButton: store.view.showWidgetButton,
  hasUnreadMessages: store.view.hasUnreadMessages,
  unreadCount: store.view.unreadCount,
  resetUnread: store.view.resetUnread,
  incrementUnread: store.view.incrementUnread,
  activeView: store.view.activeView,
  showChat: store.view.showChat,
  hideChat: store.view.hideChat,
  toggleBotInfo: store.view.toggleBotInfo,
  dimensions: store.view.dimensions,
  widgetTransition: store.view.widgetTransition,
  displayWidgetView: store.view.displayWidgetView,
  setLoadingCompleted: store.view.setLoadingCompleted
}))(injectIntl(observer(Web)))

type MainProps = { store: RootStore } & Pick<
  StoreDef,
  | 'bp'
  | 'config'
  | 'initializeChat'
  | 'sendMessage'
  | 'setUserId'
  | 'sendData'
  | 'intl'
  | 'updateTyping'
  | 'hideChat'
  | 'showChat'
  | 'toggleBotInfo'
  | 'widgetTransition'
  | 'activeView'
  | 'unreadCount'
  | 'hasUnreadMessages'
  | 'showWidgetButton'
  | 'addEventToConversation'
  | 'updateConfig'
  | 'mergeConfig'
  | 'isWebchatReady'
  | 'incrementUnread'
  | 'displayWidgetView'
  | 'resetUnread'
  | 'setLoadingCompleted'
  | 'dimensions'
>
