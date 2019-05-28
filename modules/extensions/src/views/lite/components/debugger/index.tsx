import { Tab, Tabs } from '@blueprintjs/core'
import '@blueprintjs/core/lib/css/blueprint.css'
import nanoid from 'nanoid'
import React from 'react'
import { MdBugReport } from 'react-icons/md'

import Settings from './settings'
import style from './style.scss'
import { Decision } from './views/Decision'
import { Entities } from './views/Entities'
import { Inspector } from './views/Inspector'
import { Intents } from './views/Intents'
import { Slots } from './views/Slots'
import { Suggestions } from './views/Suggestions'
import EventNotFound from './EventNotFound'
import Header from './Header'
import SplashScreen from './SplashScreen'

export const updater = { callback: undefined }

const WEBCHAT_WIDTH = 400
const DEV_TOOLS_WIDTH = 450

export class Debugger extends React.Component<DevToolProps, DevToolState> {
  state = {
    event: undefined,
    showEventNotFound: false,
    visible: false,
    selectedTabId: 'basic',
    showSettings: false
  }

  componentDidMount() {
    updater.callback = this.loadEvent

    this.props.store.view.setLayoutWidth(WEBCHAT_WIDTH)
    this.props.store.view.setContainerWidth(WEBCHAT_WIDTH)
    this.props.store.view.addHeaderButton({
      id: 'toggleDev',
      label: 'Show Debugger',
      icon: <MdBugReport />,
      onClick: this.toggleDebugger
    })

    window.addEventListener('keydown', this.hotkeyListener)
  }

  componentWillUnmount() {
    this.props.store.view.removeHeaderButton('toggleDev')
    window.removeEventListener('keydown', this.hotkeyListener)
    this.resetWebchat()
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.visible && this.state.visible) {
      this.props.store.setMessageWrapper({ module: 'extensions', component: 'Wrapper' })
    } else if (prevState.visible && !this.state.visible) {
      this.resetWebchat()
    }
  }

  resetWebchat() {
    this.props.store.view.setHighlightedMessages([])
    this.props.store.setMessageWrapper(undefined)
    this.props.store.view.setLayoutWidth(WEBCHAT_WIDTH)
    this.props.store.view.setContainerWidth(WEBCHAT_WIDTH)
  }

  hotkeyListener = e => {
    if (e.ctrlKey && e.key === 'F12') {
      this.toggleDebugger()
    }
  }

  loadEvent = async eventId => {
    try {
      const { data } = await this.props.store.bp.axios.get('/mod/extensions/events/' + eventId)
      this.setState({ event: data, showEventNotFound: false })
    } catch (err) {
      this.setState({ event: undefined, showEventNotFound: true })
    }

    this.props.store.view.setHighlightedMessages(eventId)
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

  renderSummary() {
    return (
      <div>
        <Decision decision={this.state.event.decision} />
        <Intents nlu={this.state.event.nlu} />
        <Entities nlu={this.state.event.nlu} />
        <Suggestions suggestions={this.state.event.suggestions} />
        <Slots nlu={this.state.event.nlu} />
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
        <Header newSession={this.handleNewSession} toggleSettings={this.toggleSettings} />
        {!this.state.event && (this.state.showEventNotFound ? <EventNotFound /> : <SplashScreen />)}
        {this.state.event && (
          <div className={style.content}>
            <Tabs id="tabs" onChange={this.handleTabChange} selectedTabId={this.state.selectedTabId}>
              <Tab id="basic" title="Summary" panel={this.renderSummary()} />
              <Tab id="advanced" title="View payload" panel={<Inspector data={this.state.event} />} />
            </Tabs>
          </div>
        )}
      </div>
    )
  }
}

interface DevToolProps {
  store: any
}

interface DevToolState {
  event: any
  selectedTabId: string
  visible: boolean
  showSettings: boolean
  showEventNotFound: boolean
}
