import { Button, Intent } from '@blueprintjs/core'
import _ from 'lodash'
import React from 'react'
import { MdPolymer } from 'react-icons/md'

import ScenarioDetails from './ScenarioDetails'
import SplashScreen from './SplashScreen'
import style from './style.scss'
import { AppToaster } from './toaster'

const WEBCHAT_WIDTH = 240
const DEV_TOOLS_WIDTH = 240

export const updater = { callback: undefined }

export class ScenarioBuilder extends React.Component<Props, State> {
  private firstEvent
  private lastEvent

  state = {
    visible: false,
    scenario: undefined,
    errorMessage: undefined,
    selectedEventIds: []
  }

  componentDidMount() {
    updater.callback = this.handleEventClicked

    this.props.store.view.setLayoutWidth(WEBCHAT_WIDTH)
    this.props.store.view.setContainerWidth(WEBCHAT_WIDTH)
    this.props.store.view.addHeaderButton({
      id: 'toggleBuilder',
      label: 'Show Scenario Builder',
      icon: <MdPolymer size={18} />,
      onClick: this.toggleBuilder
    })
  }

  componentWillUnmount() {
    this.props.store.view.removeHeaderButton('toggleBuilder')
    this.resetWebchat()
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.visible && this.state.visible) {
      this.clearSelection()
      this.props.store.setMessageWrapper({ module: 'testing', component: 'Wrapper' })
    } else if (prevState.visible && !this.state.visible) {
      this.resetWebchat()
    }

    if (prevState.selectedEventIds !== this.state.selectedEventIds) {
      this.props.store.view.setHighlightedMessages(this.state.selectedEventIds)
    }
  }

  resetWebchat() {
    this.clearSelection()
    this.props.store.setMessageWrapper(undefined)
    this.props.store.view.setLayoutWidth(WEBCHAT_WIDTH)
    this.props.store.view.setContainerWidth(WEBCHAT_WIDTH)
  }

  toggleBuilder = () => {
    this.props.store.view.setContainerWidth(this.state.visible ? WEBCHAT_WIDTH : WEBCHAT_WIDTH + DEV_TOOLS_WIDTH)
    this.setState({ visible: !this.state.visible })
  }

  handleEventClicked = eventId => {
    if (this.firstEvent && this.lastEvent) {
      return this.clearSelection()
    }

    if (!this.firstEvent) {
      this.firstEvent = eventId
      return this.setState({ selectedEventIds: [eventId] })
    }

    if (!this.lastEvent) {
      this.lastEvent = eventId
    }

    this.setState({ selectedEventIds: this._getEventIdsInRange(this.firstEvent, eventId) })
  }

  private _getEventIdsInRange(firstEvent: string, lastEvent: string): string[] {
    const messages: any[] = this.props.store.currentConversation.messages

    const firstIndex = _.findIndex(messages, x => x.incomingEventId === firstEvent)
    const lastIndex = _.findIndex(messages, x => x.incomingEventId === lastEvent)

    return _.uniq(messages.slice(firstIndex, lastIndex + 1).map(x => x.incomingEventId))
  }

  buildScenario = async () => {
    const axios = this.props.store.bp.axios
    const eventIds = this.state.selectedEventIds

    try {
      const { data: scenario } = await axios.post('/mod/testing/buildScenario', { eventIds })
      this.setState({ scenario })
    } catch (err) {
      const error = _.get(err, 'response.data', err.message)
      AppToaster.show({ message: `Error while saving scenario: ${error}`, intent: Intent.DANGER, timeout: 3000 })
    }
  }

  saveScenario = async (scenarioName: string, recordedScenario: any) => {
    try {
      await this.props.store.bp.axios.post('/mod/testing/saveScenario', {
        name: scenarioName,
        steps: recordedScenario
      })

      this.clearSelection()
      this.setState({ scenario: undefined })

      AppToaster.show({ message: 'Scenario created successfully!', intent: Intent.SUCCESS, timeout: 3000 })
    } catch (err) {
      AppToaster.show({ message: `Error while saving scenario: ${err.message}`, intent: Intent.DANGER, timeout: 3000 })
    }
  }

  discardScenario = () => this.setState({ scenario: undefined })

  clearSelection = () => {
    this.firstEvent = undefined
    this.lastEvent = undefined
    this.setState({ selectedEventIds: [] })
  }

  renderEvents() {
    return this.state.scenario ? (
      <ScenarioDetails onSave={this.saveScenario} onDiscard={this.discardScenario} scenario={this.state.scenario} />
    ) : (
      <div style={{ padding: 5, height: '100%' }}>
        Select one or multiple interactions in the webchat. When you are satisfied, press the button below to name it
        and save your changes. <br />
        <br /> * When using this feature, the initial set is cleared, so make sure you start a new conversation before.
        <br />
        <br />
        <p>
          Interactions selected: <b>{this.state.selectedEventIds.length}</b>
        </p>
        <Button onClick={this.buildScenario}>Build Scenario</Button>{' '}
        <Button onClick={this.clearSelection}>Clear Selection</Button>
      </div>
    )
  }

  render() {
    if (!this.state.visible) {
      return null
    }

    return (
      <div className={style.container}>
        <div className={style.header}>
          <h4>Scenario Builder</h4>
          <div />
        </div>

        {this.state.selectedEventIds.length ? (
          <div className={style.content}>{this.renderEvents()}</div>
        ) : (
          <SplashScreen />
        )}
      </div>
    )
  }
}

interface Props {
  store: any
  bp: any
}

interface State {
  visible: boolean
  scenario: any
  selectedEventIds: string[]
}
