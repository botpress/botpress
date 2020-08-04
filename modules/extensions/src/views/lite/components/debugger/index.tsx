import { Icon, Tab, Tabs } from '@blueprintjs/core'
import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'
import nanoid from 'nanoid'
import React from 'react'
import 'ui-shared/dist/theme.css'

import Settings from './settings'
import style from './style.scss'
import { loadSettings } from './utils'
import { Processing } from './views/Processing'
import Summary from './views/Summary'
import EventNotFound from './EventNotFound'
import FetchingEvent from './FetchingEvent'
import Header from './Header'
import SplashScreen from './SplashScreen'
import Unauthorized from './Unauthorized'

export const updater = { callback: undefined }

const WEBCHAT_WIDTH = 240
const DEV_TOOLS_WIDTH = 240
const RETRY_PERIOD = 500 // Delay (ms) between each call to the backend to fetch a desired event
const RETRY_SECURITY_FACTOR = 3
const DEBOUNCE_DELAY = 100

interface Props {
  store: any
}

interface State {
  event: any
  selectedTabId: string
  visible: boolean
  showSettings: boolean
  showEventNotFound: boolean
  fetching: boolean
  unauthorized: boolean
  tab: string
}
const DEBUGGER_TAB_KEY = 'debuggerTab'

export class Debugger extends React.Component<Props, State> {
  state = {
    event: undefined,
    showEventNotFound: false,
    visible: false,
    selectedTabId: 'basic',
    showSettings: false,
    fetching: false,
    unauthorized: false,
    tab: window['BP_STORAGE'].get(DEBUGGER_TAB_KEY) || 'content'
  }
  allowedRetryCount = 0
  currentRetryCount = 0
  loadEventDebounced = _.debounce(m => this.loadEvent(m), DEBOUNCE_DELAY)
  lastMessage = undefined

  async componentDidMount() {
    updater.callback = this.loadEvent

    this.props.store.view.setLayoutWidth(WEBCHAT_WIDTH)
    this.props.store.view.setContainerWidth(WEBCHAT_WIDTH)

    this.props.store.view.addCustomAction({
      id: 'actionDebug',
      label: 'Inspect in Debugger',
      onClick: this.handleSelect
    })

    window.addEventListener('keydown', this.hotkeyListener)

    try {
      const { data } = await this.props.store.bp.axios.get('/mod/extensions/events/update-frequency')
      const { collectionInterval } = data
      const maxDelai = ms(collectionInterval as string) * RETRY_SECURITY_FACTOR
      this.allowedRetryCount = Math.ceil(maxDelai / RETRY_PERIOD)

      // Only open debugger & open on new messages if user is authorized
      const settings = loadSettings()
      if (settings.autoOpenDebugger) {
        this.toggleDebugger()
      }

      if (settings.updateToLastMessage) {
        this.props.store.bp.events.on('guest.webchat.message', this.handleNewMessage)
      }
    } catch (err) {
      const errorCode = _.get(err, 'response.status')
      if (errorCode === 403) {
        this.setState({ unauthorized: true })
      }
    }
  }

  componentWillUnmount() {
    this.props.store.bp.events.off('guest.webchat.message', this.handleNewMessage)
    this.props.store.view.removeHeaderButton('toggleDev')
    this.props.store.view.removeCustomAction('actionDebug')
    window.removeEventListener('keydown', this.hotkeyListener)
    this.resetWebchat()
  }

  componentDidUpdate(_prevProps, prevState) {
    if (!prevState.visible && this.state.visible) {
      this.props.store.setMessageWrapper({ module: 'extensions', component: 'Wrapper' })
    } else if (prevState.visible && !this.state.visible) {
      this.resetWebchat()
    }
  }

  handleNewMessage = async (m: Partial<sdk.IO.IncomingEvent>) => {
    if (m.payload.type !== 'session_reset') {
      // @ts-ignore
      await this.updateLastMessage(m.incomingEventId)
    }
  }

  updateLastMessage = async newMessage => {
    if (this.state.visible && newMessage && newMessage !== this.lastMessage) {
      this.lastMessage = newMessage
      // tslint:disable-next-line: no-floating-promises
      this.loadEventDebounced(newMessage)
    }
  }

  handleSelect = async (_actionId: string, props: any) => {
    if (!this.state.visible) {
      this.toggleDebugger()
    }
    await this.loadEvent(props.incomingEventId)
  }

  resetWebchat() {
    this.props.store.view.setHighlightedMessages([])
    this.props.store.setMessageWrapper(undefined)
    this.props.store.view.setLayoutWidth(WEBCHAT_WIDTH)
    this.props.store.view.setContainerWidth(WEBCHAT_WIDTH)
  }

  hotkeyListener = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault()
      this.toggleDebugger()
    }
  }

  loadEvent = async (eventId: string) => {
    if (this.state.unauthorized) {
      return
    }

    this.setState({ fetching: true })

    try {
      const { data: event } = await this.props.store.bp.axios.get('/mod/extensions/events/' + eventId)

      this.setState({ event, showEventNotFound: !event, fetching: false })

      this.props.store.view.setHighlightedMessages(eventId)
      this.currentRetryCount = 0
    } catch (err) {
      if (this.currentRetryCount < this.allowedRetryCount) {
        this.currentRetryCount++

        await Promise.delay(RETRY_PERIOD)
        await this.loadEvent(eventId)
      } else {
        this.currentRetryCount = 0
        this.setState({ fetching: false })
      }
    }
  }

  handleNewSession = () => {
    const userId = nanoid(20)
    this.props.store.setUserId(userId)
  }

  toggleDebugger = () => {
    this.props.store.view.setContainerWidth(this.state.visible ? WEBCHAT_WIDTH : WEBCHAT_WIDTH + DEV_TOOLS_WIDTH)
    this.setState({ visible: !this.state.visible })
  }

  toggleSettings = e => this.setState({ showSettings: !this.state.showSettings })
  handleTabChange = selectedTabId => this.setState({ selectedTabId })

  // check rendering

  renderWhenNoEvent() {
    if (this.state.unauthorized) {
      return <Unauthorized />
    }
    if (this.state.fetching) {
      return <FetchingEvent />
    }
    if (this.state.showEventNotFound) {
      return <EventNotFound />
    }
    return <SplashScreen />
  }

  renderEvent() {
    const lang = this.props.store?.botUILanguage || 'en'
    const { tab, event } = this.state

    return (
      <div className={style.content}>
        {tab === 'content' && <Summary event={event} />}
        {tab === 'processing' && <Processing processing={event?.processing} lang={lang} />}
      </div>
    )
  }

  updateTab(tab) {
    window['BP_STORAGE'].set(DEBUGGER_TAB_KEY, tab)
    this.setState({ tab })
  }

  render() {
    if (!this.state.visible) {
      return null
    }
    const { tab, event, showSettings } = this.state

    return (
      <div className={style.container2}>
        <Settings store={this.props.store} isOpen={showSettings} toggle={this.toggleSettings} />
        <Header
          updateCurrentTab={this.updateTab.bind(this)}
          selectedTab={tab}
          newSession={this.handleNewSession}
          toggleSettings={this.toggleSettings}
          hasProcessing={!!event?.processing}
        />
        {!event && this.renderWhenNoEvent()}
        {event && this.renderEvent()}
      </div>
    )
  }
}
