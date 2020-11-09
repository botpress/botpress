import { Checkbox, Tab, Tabs } from '@blueprintjs/core'
import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import cx from 'classnames'
import _ from 'lodash'
import ms from 'ms'
import nanoid from 'nanoid'
import React from 'react'
import 'ui-shared/dist/theme.css'

import lang from '../../../lang'

import Settings from './settings'
import style from './style.scss'
import { Inspector } from './views/Inspector'
import { NDU } from './views/NDU'
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
  event: sdk.IO.IncomingEvent
  selectedTabId: string
  visible: boolean
  showSettings: boolean
  showEventNotFound: boolean
  fetching: boolean
  maximized: boolean
  unauthorized: boolean
  eventsCache: sdk.IO.IncomingEvent[]
  updateDiagram: boolean
}

export class Debugger extends React.Component<Props, State> {
  private showEventOnDiagram: (event: sdk.IO.IncomingEvent) => void

  state = {
    event: undefined,
    showEventNotFound: false,
    visible: false,
    selectedTabId: 'basic',
    showSettings: false,
    fetching: false,
    maximized: false,
    unauthorized: false,
    eventsCache: [],
    updateDiagram: true
  }
  allowedRetryCount = 0
  currentRetryCount = 0
  loadEventDebounced = _.debounce(m => this.loadEvent(m), DEBOUNCE_DELAY)
  lastMessage = undefined

  async componentDidMount() {
    // @ts-ignore
    const parentShowEvent = window.parent.showEventOnDiagram
    this.showEventOnDiagram = parentShowEvent ? parentShowEvent() : () => {}

    lang.init()

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

      this.toggleDebugger()
      this.props.store.bp.events.on('guest.webchat.message', this.handleNewMessage)
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

    window.parent.document.documentElement.style.setProperty('--debugger-width', '240px')
    document.documentElement.style.setProperty('--debugger-width', '240px')
  }

  componentDidUpdate(_prevProps, prevState) {
    if (!prevState.visible && this.state.visible) {
      this.props.store.setMessageWrapper({ module: 'extensions', component: 'Wrapper' })
    } else if (prevState.visible && !this.state.visible) {
      this.resetWebchat()
    }
  }

  handleNewMessage = async (m: Partial<sdk.IO.IncomingEvent>) => {
    if (!['session_reset', 'visit'].includes(m.payload.type)) {
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

    let keepRetrying = false
    this.setState({ fetching: true })

    try {
      const event = await this.getEvent(eventId)

      this.setState({ event, showEventNotFound: !event })
      this.props.store.view.setHighlightedMessages(eventId)

      if (this.state.updateDiagram) {
        try {
          this.showEventOnDiagram(event)
        } catch (err) {
          console.error("Couldn't load event on workflow", err)
        }
      }

      if (event.processing && !event.processing.completed) {
        keepRetrying = true
      }
    } catch (err) {
      keepRetrying = true
    }

    if (keepRetrying) {
      if (this.currentRetryCount < this.allowedRetryCount) {
        this.currentRetryCount++

        await Promise.delay(RETRY_PERIOD)
        await this.loadEvent(eventId)
      } else {
        this.currentRetryCount = 0
        this.setState({ fetching: false })
      }
    } else {
      this.setState({ fetching: false })
      this.currentRetryCount = 0
    }
  }

  getEvent = async (eventId: string): Promise<sdk.IO.IncomingEvent> => {
    const eventsCache = this.state.eventsCache

    const existing = eventsCache.find(x => x.id === eventId)
    if (existing) {
      return existing
    }

    const { data: event } = await this.props.store.bp.axios.get(`/mod/extensions/events/${eventId}`)
    if (!event.processing?.completed) {
      return event
    }

    this.setState({ eventsCache: [event, ...eventsCache].slice(0, 10) })

    return event
  }

  handleNewSession = () => {
    const userId = nanoid(20)
    this.props.store.setUserId(userId)
  }

  toggleDebugger = () => {
    this.props.store.view.setContainerWidth(this.state.visible ? WEBCHAT_WIDTH : WEBCHAT_WIDTH + DEV_TOOLS_WIDTH)
    this.setState({ visible: !this.state.visible })
  }

  toggleMaximized = () => {
    this.props.store.view.setContainerWidth(
      !this.state.maximized ? WEBCHAT_WIDTH + DEV_TOOLS_WIDTH * 2 : WEBCHAT_WIDTH + DEV_TOOLS_WIDTH
    )
    const newWidth = !this.state.maximized ? '480px' : '240px'

    window.parent.document.documentElement.style.setProperty('--debugger-width', newWidth)
    document.documentElement.style.setProperty('--debugger-width', newWidth)
    this.setState({ maximized: !this.state.maximized })
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

  renderProcessingTab() {
    const processing = _.get(this.state, 'event.processing') as _.Dictionary<sdk.IO.ProcessingEntry> | null
    if (!processing) {
      return
    }

    const hasError = Object.values(processing).some(item => item.errors?.length > 0)

    return (
      <Tab
        id="processing"
        className={cx({ [style.tabError]: hasError })}
        title="Processing"
        panel={<Processing processing={processing} />}
      />
    )
  }

  renderEvent() {
    const ndu = _.get(this.state, 'event.ndu')

    return (
      <div className={style.content}>
        <Tabs id="tabs" onChange={this.handleTabChange} selectedTabId={this.state.selectedTabId}>
          <Tab
            id="basic"
            title="Summary"
            panel={
              <div>
                <Summary event={this.state.event} />
                <Checkbox
                  checked={this.state.updateDiagram}
                  label="Show debugging on workflow"
                  onChange={e => {
                    const newState = e.currentTarget.checked

                    this.showEventOnDiagram(newState && this.state.event ? this.state.event : undefined)
                    this.setState({ updateDiagram: newState })
                  }}
                />
              </div>
            }
          />
          {ndu && <Tab id="ndu" title="NDU" panel={<NDU ndu={ndu} />} />}
          {this.renderProcessingTab()}
          <Tab id="advanced" title="Raw JSON" panel={<Inspector data={this.state.event} />} />
        </Tabs>
      </div>
    )
  }

  render() {
    if (!this.state.visible) {
      return null
    }

    return (
      <div className={style.container2}>
        <Settings store={this.props.store} isOpen={this.state.showSettings} toggle={this.toggleSettings} />
        <Header
          newSession={this.handleNewSession}
          toggleSettings={this.toggleSettings}
          maximized={this.state.maximized}
          setMaximized={this.toggleMaximized}
        />
        {!this.state.event && this.renderWhenNoEvent()}
        {this.state.event && this.renderEvent()}
      </div>
    )
  }
}
