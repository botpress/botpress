import React from 'react'
import classnames from 'classnames'

import addMilliseconds from 'date-fns/add_milliseconds'
import isBefore from 'date-fns/is_before'
import queryString from 'query-string'
import ms from 'ms'
import ChatIcon from './icons/Chat'
import CloseIcon from './icons/CloseChat'
import Container from './components/Container'
import { downloadFile } from './utils'

const _values = obj => Object.keys(obj).map(x => obj[x])

if (!window.location.origin) {
  window.location.origin =
    window.location.protocol +
    '//' +
    window.location.hostname +
    (window.location.port ? ':' + window.location.port : '')
}

const ANIM_DURATION = 300

const MIN_TIME_BETWEEN_SOUNDS = 10000 // 10 seconds

const HISTORY_STARTING_POINT = -1
const HISTORY_MAX_MESSAGES = 10
const HISTORY_UP = 'ArrowUp'

const defaultOptions = {
  enableReset: true,
  stylesheet: '/assets/modules/channel-web/default.css',
  extraStylesheet: '',
  showConversationsButton: true,
  showUserName: false,
  showUserAvatar: false,
  enableTranscriptDownload: false,
  enableArrowNavigation: false
}

export default class Web extends React.Component {
  constructor(props) {
    super(props)

    if (window.botpressWebChat && window.botpressWebChat.sendUsageStats) {
      ReactGA.initialize('UA-90044826-2')
      ReactGA.event({ category: 'WebChat', action: 'render', nonInteraction: true })
    }

    const { options } = queryString.parse(location.search)
    const { config } = JSON.parse(decodeURIComponent(options || '{}'))

    if (config.overrides) {
      for (const override of _values(config.overrides)) {
        this.props.bp.loadModuleView(override.module, true)
      }
    }

    this.state = {
      view: null,
      botInfo: null,
      textToSend: '',
      loading: true,
      played: false,
      opened: false,
      config: Object.assign({}, defaultOptions, config),
      conversations: [],
      currentConversation: null,
      currentConversationId: null,
      unreadCount: 0,
      isButtonHidden: config.hideWidget,
      isTransitioning: false,
      messageHistory: [],
      historyPosition: HISTORY_STARTING_POINT
    }

    this.updateAxiosConfig()
  }

  componentWillMount() {
    this.setupSocket()
  }

  componentDidMount() {
    if (this.state.config.userId) {
      this.props.bp.events.updateVisitorId(this.state.config.userId)
    }

    this.setUserId()
      .then(this.fetchData)
      .then(() => {
        this.handleSwitchView('widget')
        this.setState({ loading: false })
      })

    window.addEventListener('message', this.handleIframeApi)

    this.props.bp.axios.interceptors.request.use(
      config => {
        if (/\/api\/ext\/channel-web\//i.test(config.url)) {
          const prefix = config.url.indexOf('?') > 0 ? '&' : '?'
          config.url += prefix + '__ts=' + new Date().getTime()
        }
        return config
      },
      error => {
        return Promise.reject(error)
      }
    )
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleIframeApi)
    this.isUnmounted = true
  }

  updateAxiosConfig() {
    const { botId, externalAuthToken } = this.state.config

    this.axiosConfig = botId
      ? { baseURL: `${window.location.origin}/api/v1/bots/${botId}` }
      : { baseURL: `${window.BOT_API_PATH}` }

    if (externalAuthToken) {
      this.axiosConfig = {
        ...this.axiosConfig,
        headers: {
          ExternalAuth: `Bearer ${externalAuthToken}`
        }
      }
    }
  }

  fetchBotInfo = () => {
    return this.props.bp.axios
      .get('/mod/channel-web/botInfo', this.axiosConfig)
      .then(({ data }) => this.setState({ botInfo: data }))
  }

  changeUserId = newId => {
    this.props.bp.events.updateVisitorId(newId)
    this.setState({ currentConversationId: null })
    this.setUserId().then(this.fetchData)
  }

  handleIframeApi = ({ data: { action, payload } }) => {
    if (action === 'configure') {
      if (payload.userId) {
        this.changeUserId(payload.userId)
      }
      this.setState({ config: Object.assign({}, defaultOptions, payload) }, this.updateAxiosConfig)
    } else if (action === 'event') {
      const { type, text } = payload
      if (type === 'show') {
        this.handleSwitchView('side')
      } else if (type === 'hide') {
        this.handleSwitchView('widget')
      } else if (type === 'message') {
        this.setState({ textToSend: text })
        this.handleSendMessage()
      } else {
        return this.handleSendData({ type, payload })
      }
    }
  }

  setUserId() {
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (window.__BP_VISITOR_ID) {
          clearInterval(interval)
          this.userId = window.__BP_VISITOR_ID
          window.parent.postMessage({ userId: this.userId }, '*')
          resolve()
        }
      }, 250)

      setTimeout(() => {
        clearInterval(interval)
        reject()
      }, 300000)
    })
  }

  handleSwitchView(view) {
    if (this.state.isTransitioning) {
      return
    }
    this.setState({ isTransitioning: true })

    if (view === 'side' && this.state.view !== 'side') {
      this.setState({
        opened: true,
        unreadCount: 0,
        convoTransition: 'fadeOut',
        widgetTransition: 'fadeOut'
      })

      setTimeout(() => {
        this.setState({
          sideTransition: 'fadeIn',
          view: view,
          isTransitioning: false
        })
      }, ANIM_DURATION + 10)
    }

    if (view === 'widget') {
      this.setState({
        convoTransition: 'fadeOut',
        sideTransition: 'fadeOut'
      })

      if (!this.state.view || this.state.view === 'side') {
        setTimeout(() => {
          this.setState({
            widgetTransition: 'fadeIn',
            view: view,
            isTransitioning: false
          })
        }, ANIM_DURATION)
      }
    }

    setTimeout(() => {
      this.setState({
        view: view,
        isTransitioning: false
      })
    }, ANIM_DURATION)

    setTimeout(() => {
      this.setState({
        widgetTransition: null,
        convoTransition: null,
        sideTransition: this.state.sideTransition === 'fadeIn' ? 'fadeIn' : null,
        isTransitioning: false
      })
    }, ANIM_DURATION * 2.1)
  }

  handleButtonClicked = () => {
    if (this.state.view === 'convo') {
      this.handleSwitchView('widget')
    } else {
      this.handleSwitchView('side')
    }
  }

  setupSocket() {
    // Connect the Botpress's Web Socket to the server
    if (this.props.bp && this.props.bp.events) {
      this.props.bp.events.setup()
    }

    this.props.bp.events.on('guest.webchat.message', this.handleNewMessage)
    this.props.bp.events.on('guest.webchat.typing', this.handleBotTyping)
    //firehose events to parent page
    this.props.bp.events.onAny(this.postToParent)
  }

  postToParent = (t, payload) => {
    // we could filter on event type if necessary
    window.parent && window.parent.postMessage(payload, '*')
  }

  checkForExpiredExternalToken = error => {
    //@deprecated 11.9 (replace with proper error management)
    const data = _.get(error, 'response.data', {})
    if (data && typeof data === 'string' && data.includes('BP_CONV_NOT_FOUND')) {
      console.log('Conversation not found, starting a new one...')
      this.createConversation()
    }

    if (data.errorCode === 'BP_0401') {
      this.setState({ config: { ...this.state.config, externalAuthToken: undefined } }, this.updateAxiosConfig)
      console.log(`External token expired or invalid. Removed from future requests`)
    }
  }

  fetchData = async () => {
    try {
      await this.fetchBotInfo()
        .then(this.fetchConversations)
        .then(this.fetchCurrentConversation)
    } catch (err) {
      console.log('Error while fetching data, creating new convo...', err)
      await this.createConversation()
    }

    const locale = navigator.language || navigator.userLanguage
    this.handleSendData({
      type: 'visit',
      text: 'User visit',
      timezone: new Date().getTimezoneOffset() / 60,
      language: locale && locale.substring(0, locale.indexOf('-'))
    }).catch(this.checkForExpiredExternalToken)
  }

  fetchConversations = () => {
    const axios = this.props.bp.axios
    const userId = this.userId
    const url = `/mod/channel-web/conversations/${userId}`

    return axios
      .get(url, this.axiosConfig)
      .then(({ data }) => new Promise(resolve => !this.isUnmounted && this.setState(data, resolve)))
  }

  fetchCurrentConversation = convoId => {
    const axios = this.props.bp.axios
    const userId = this.userId
    const { conversations, currentConversationId } = this.state

    let conversationIdToFetch = convoId || currentConversationId
    if (conversations.length > 0 && !conversationIdToFetch) {
      const lifeTimeMargin = Date.now() - ms(this.state.recentConversationLifetime)
      if (new Date(conversations[0].last_heard_on).getTime() < lifeTimeMargin && this.state.startNewConvoOnTimeout) {
        return
      }
      conversationIdToFetch = conversations[0].id
      this.setState({ currentConversationId: conversationIdToFetch })
    }

    const url = `/mod/channel-web/conversations/${userId}/${conversationIdToFetch}`

    return axios.get(url, this.axiosConfig).then(({ data }) => {
      // Possible race condition if the current conversation changed while fetching
      if (this.state.currentConversationId !== conversationIdToFetch) {
        // In which case we simply restart fetching
        return this.fetchCurrentConversation()
      }

      this.setState({ currentConversation: data })
    })
  }

  handleNewMessage = event => {
    if ((event.payload && event.payload.type === 'visit') || event.message_type === 'visit') {
      // don't do anything, it's the system message
      return
    }
    this.safeUpdateCurrentConvo(event.conversationId, true, convo => {
      return Object.assign({}, convo, {
        messages: [...convo.messages, event],
        typingUntil: event.userId ? convo.typingUntil : null
      })
    })
  }

  handleBotTyping = event => {
    this.safeUpdateCurrentConvo(event.conversationId, false, convo => {
      return Object.assign({}, convo, {
        typingUntil: addMilliseconds(new Date(), event.timeInMs)
      })
    })

    setTimeout(this.expireTyping, event.timeInMs + 50)
  }

  expireTyping = () => {
    const currentTypingUntil = this.state.currentConversation && this.state.currentConversation.typingUntil

    const timerExpired = currentTypingUntil && isBefore(new Date(currentTypingUntil), new Date())
    if (timerExpired) {
      this.safeUpdateCurrentConvo(this.state.currentConversationId, false, convo => {
        return Object.assign({}, convo, { typingUntil: null })
      })
    }
  }

  safeUpdateCurrentConvo(convoId, addToUnread, updater) {
    // there's no conversation to update or our convo changed
    if (!this.state.currentConversation || this.state.currentConversationId != convoId) {
      this.fetchConversations().then(this.fetchCurrentConversation)
      return
    }

    // there's no focus on the actual conversation
    if ((document.hasFocus && !document.hasFocus()) || this.state.view !== 'side') {
      this.playSound()

      if (addToUnread) {
        this.increaseUnreadCount()
      }
    }

    this.handleResetUnreadCount()

    const newConvo = updater && updater(this.state.currentConversation)

    if (newConvo) {
      this.setState({ currentConversation: newConvo })
    }
  }

  playSound() {
    if (!this.state.played && this.state.view !== 'convo') {
      // TODO: Remove this condition (view !== 'convo') and fix transition sounds
      const audio = new Audio('/assets/modules/channel-web/notification.mp3')
      audio.play()

      this.setState({
        played: true
      })

      setTimeout(() => {
        this.setState({
          played: false
        })
      }, MIN_TIME_BETWEEN_SOUNDS)
    }
  }

  increaseUnreadCount() {
    this.setState({
      unreadCount: this.state.unreadCount + 1
    })
  }

  handleResetUnreadCount = () => {
    if (document.hasFocus && document.hasFocus() && this.state.view === 'side') {
      this.setState({
        unreadCount: 0
      })
    }
  }

  handleSendMessage = () => {
    if (!this.state.textToSend || !this.state.textToSend.length) {
      return
    }

    this.setState({
      messageHistory: _.take([this.state.textToSend, ...this.state.messageHistory], HISTORY_MAX_MESSAGES),
      historyPosition: HISTORY_STARTING_POINT
    })

    return this.handleSendData({ type: 'text', text: this.state.textToSend }).then(() => {
      this.handleSwitchView('side')
      this.setState({ textToSend: '' })
    })
  }

  handleRecallHistory = direction => {
    const position = direction === HISTORY_UP ? this.state.historyPosition + 1 : this.state.historyPosition - 1
    const text = _.nth(this.state.messageHistory, position)
    text && this.setState({ textToSend: text, historyPosition: position })
  }

  handleTextChanged = event => {
    this.setState({
      textToSend: event.target.value
    })
  }

  handleFileUpload = (title, payload, file) => {
    const userId = window.__BP_VISITOR_ID
    const url = `/mod/channel-web/messages/${userId}/files`
    const config = { params: { conversationId: this.state.currentConversationId }, ...this.axiosConfig }

    const data = new FormData()
    data.append('file', file)

    return this.props.bp.axios.post(url, data, config).then()
  }

  handleSendData = data => {
    const userId = window.__BP_VISITOR_ID
    const msgTypes = ['text', 'quick_reply', 'form', 'login_prompt', 'visit', 'postback']

    if (!msgTypes.includes(data.type)) {
      const url = `/mod/channel-web/events/${userId}`
      return this.props.bp.axios.post(url, data, this.axiosConfig)
    }

    const url = `/mod/channel-web/messages/${userId}`
    const config = { params: { conversationId: this.state.currentConversationId }, ...this.axiosConfig }

    return this.props.bp.axios
      .post(url, data, config)
      .then()
      .catch(this.checkForExpiredExternalToken)
  }

  handleSwitchConvo = convoId => {
    this.setState({
      currentConversation: null,
      currentConversationId: convoId
    })

    this.fetchCurrentConversation(convoId)
  }

  handleClosePanel = () => {
    this.handleSwitchView('widget')
  }

  handleSessionReset = () => {
    const userId = window.__BP_VISITOR_ID
    const url = `/mod/channel-web/conversations/${userId}/${this.state.currentConversationId}/reset`
    return this.props.bp.axios.post(url, {}, this.axiosConfig).then()
  }

  renderWidget() {
    if (this.state.isButtonHidden) {
      return null
    }
    return (
      <button
        className={classnames('bpw-widget-btn', 'bpw-floating-button', {
          ['bpw-anim-' + this.state.widgetTransition]: true
        })}
        onClick={this.handleButtonClicked}
      >
        {this.state.view === 'convo' ? <CloseIcon /> : <ChatIcon />}
        {this.state.unreadCount > 0 && <span className={'bpw-floating-button-unread'}>{this.state.unreadCount}</span>}
      </button>
    )
  }

  createConversation = async () => {
    const userId = window.__BP_VISITOR_ID
    const url = `/mod/channel-web/conversations/${userId}/new`
    const { data } = await this.props.bp.axios.post(url, {}, this.axiosConfig)

    this.fetchConversations().then(() => {
      this.handleSwitchConvo(data.convoId)
    })
  }

  downloadConversation = async () => {
    const userId = window.__BP_VISITOR_ID
    const url = `/mod/channel-web/conversations/${userId}/${this.state.currentConversationId}/download/txt`
    const file = (await this.props.bp.axios.get(url, this.axiosConfig)).data
    const blobFile = new Blob([file.txt])

    downloadFile(file.name, blobFile)
  }

  renderSide() {
    return (
      <Container
        bp={this.props.bp}
        config={this.state.config}
        text={this.state.textToSend}
        fullscreen={this.props.fullscreen}
        transition={!this.props.fullscreen ? this.state.sideTransition : null}
        unreadCount={this.state.unreadCount}
        currentConversation={this.state.currentConversation}
        conversations={this.state.conversations}
        onClose={!this.props.fullscreen ? this.handleClosePanel : null}
        onResetSession={this.handleSessionReset}
        onSwitchConvo={this.handleSwitchConvo}
        onTextSend={this.handleSendMessage}
        recallHistory={this.handleRecallHistory}
        onTextChanged={this.handleTextChanged}
        onFileUpload={this.handleFileUpload}
        onSendData={this.handleSendData}
        downloadConversation={this.downloadConversation}
        createConversation={this.createConversation}
        botInfo={this.state.botInfo}
        botName={this.state.botInfo.name || this.state.config.botName || 'Bot'}
      />
    )
  }

  render() {
    if (this.state.loading || !this.state.view) {
      return null
    }

    const parentClass = `bp-widget-web bp-widget-${this.state.view}`
    if (this.parentClass !== parentClass) {
      window.parent && window.parent.postMessage({ type: 'setClass', value: parentClass }, '*')
      this.parentClass = parentClass
    }

    const { stylesheet, extraStylesheet } = this.state.config

    const view = this.state.view !== 'side' && !this.props.fullscreen ? this.renderWidget() : this.renderSide()

    return (
      <div onFocus={this.handleResetUnreadCount}>
        {stylesheet && stylesheet.length && <link rel="stylesheet" type="text/css" href={stylesheet} />}
        {extraStylesheet && extraStylesheet.length && <link rel="stylesheet" type="text/css" href={extraStylesheet} />}
        {view}
      </div>
    )
  }
}
