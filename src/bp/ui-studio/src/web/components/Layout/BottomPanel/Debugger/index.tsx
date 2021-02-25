import { Button, ButtonGroup, Divider, Icon, Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import { lang, ToolTip } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import ms from 'ms'
import nanoid from 'nanoid'
import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import 'ui-shared/dist/theme.css'
import { setDebuggerEvent } from '~/actions'

import btStyle from '../style.scss'

import Settings from './components/Settings'
import EventNotFound from './status/EventNotFound'
import FetchingEvent from './status/FetchingEvent'
import SplashScreen from './status/SplashScreen'
import Unauthorized from './status/Unauthorized'
import style from './style.scss'
import { Inspector } from './views/Inspector'
import { NDU } from './views/NDU'
import { Processing } from './views/Processing'
import Summary from './views/Summary'

const DELAY_BETWEEN_CALLS = 500
const RETRY_SECURITY_FACTOR = 3
const DEBOUNCE_DELAY = 100

interface Props {
  eventId: string
  autoFocus: boolean
  setAutoFocus: (newValue: boolean) => void
  commonButtons: any
  setDebuggerEvent: any
  hidden: boolean
}

interface State {
  event: sdk.IO.IncomingEvent
  selectedTabId: string
  showEventNotFound: boolean
  fetching: boolean
  unauthorized: boolean
  eventsCache: sdk.IO.IncomingEvent[]
  updateDiagram: boolean
}

export class Debugger extends React.Component<Props, State> {
  state = {
    event: undefined,
    showEventNotFound: false,
    selectedTabId: 'basic',
    fetching: false,
    unauthorized: false,
    eventsCache: [],
    updateDiagram: true
  }

  allowedRetryCount = 0
  currentRetryCount = 0
  loadEventDebounced = _.debounce(m => this.loadEvent(m), DEBOUNCE_DELAY)
  lastMessage = undefined

  async componentDidMount() {
    if (this.props.eventId) {
      await this.loadEvent(this.props.eventId)
    }

    try {
      const { data } = await axios.get(`${window.BOT_API_PATH}/mod/extensions/events/update-frequency`)
      const { collectionInterval } = data
      const maxDelai = ms(collectionInterval as string) * RETRY_SECURITY_FACTOR
      this.allowedRetryCount = Math.ceil(maxDelai / DELAY_BETWEEN_CALLS)
    } catch (err) {
      const errorCode = _.get(err, 'response.status')
      if (errorCode === 403) {
        this.setState({ unauthorized: true })
      }
    }
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.eventId !== this.props.eventId) {
      await this.loadEvent(this.props.eventId)
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

      if (this.state.updateDiagram) {
        try {
          this.props.setDebuggerEvent(event)
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

        await Promise.delay(DELAY_BETWEEN_CALLS)
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

    const { data: event } = await axios.get(`${window.BOT_API_PATH}/mod/extensions/events/${eventId}`)
    if (!event.processing?.completed) {
      return event
    }

    this.setState({ eventsCache: [event, ...eventsCache].slice(0, 10) })

    return event
  }

  postToIframe = (action, payload) => {
    const win = document.querySelector('#bp-widget')?.['contentWindow']
    if (win) {
      win.postMessage({ action, payload }, '*')
    }
  }

  handleNewSession = () => {
    const userId = nanoid(20)
    this.postToIframe('change-user-id', userId)
  }

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
        className={cx(btStyle.tab, { [style.tabError]: hasError })}
        title={lang.tr('processing')}
        panel={<Processing processing={processing} />}
      />
    )
  }

  render() {
    const hasEvent = !!this.state.event
    const ndu = _.get(this.state, 'event.ndu')

    return (
      <Tabs
        id="tabs"
        className={cx(btStyle.tabs, { [btStyle.hidden]: this.props.hidden })}
        onChange={this.handleTabChange}
        selectedTabId={this.state.selectedTabId}
      >
        <Tab
          id="basic"
          title={lang.tr('summary')}
          className={btStyle.tab}
          panel={
            <Fragment>{this.state.event ? <Summary event={this.state.event} /> : this.renderWhenNoEvent()}</Fragment>
          }
        />
        {ndu && <Tab id="ndu" title="NDU" className={btStyle.tab} panel={<NDU ndu={ndu} />} />}
        {hasEvent && this.renderProcessingTab()}
        {hasEvent && (
          <Tab
            id="advanced"
            title="Raw JSON"
            className={cx(btStyle.tab)}
            panel={<Inspector data={this.state.event} />}
          />
        )}
        <Tab id="settings" title={<Icon icon="cog" />} className={btStyle.tab} panel={<Settings />} />
        <Tabs.Expander />
        <ButtonGroup minimal={true}>
          <ToolTip content={lang.tr('bottomPanel.debugger.newSession')}>
            <Button id="btn-new-session" icon="refresh" small onClick={this.handleNewSession} />
          </ToolTip>
          <Divider />
          <ToolTip content={lang.tr('bottomPanel.debugger.autoFocus')}>
            <Button
              id="btn-auto-focus"
              icon="automatic-updates"
              intent={this.props.autoFocus ? 'primary' : 'none'}
              small
              onClick={() => this.props.setAutoFocus(!this.props.autoFocus)}
            />
          </ToolTip>
          <ToolTip content={lang.tr('bottomPanel.debugger.displayDebugging')}>
            <Button
              id="btn-debug"
              icon="send-to-graph"
              intent={this.state.updateDiagram ? 'primary' : 'none'}
              small
              onClick={() => {
                const newState = !this.state.updateDiagram
                this.props.setDebuggerEvent(newState && this.state.event ? this.state.event : undefined)
                this.setState({ updateDiagram: newState })
              }}
            />
          </ToolTip>
          {this.props.commonButtons}
        </ButtonGroup>
      </Tabs>
    )
  }
}

const mapDispatchToProps = { setDebuggerEvent }

export default connect(undefined, mapDispatchToProps)(Debugger)
