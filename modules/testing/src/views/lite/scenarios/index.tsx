import { Button, Intent } from '@blueprintjs/core'
import React from 'react'
import { MdPolymer } from 'react-icons/md'

import style from './style.scss'
import { AppToaster } from './toaster'
import ScenarioDetails from './ScenarioDetails'
import SplashScreen from './SplashScreen'

const WEBCHAT_WIDTH = 400
const DEV_TOOLS_WIDTH = 450

export const updater = { callback: undefined }

export class ScenarioBuilder extends React.Component<Props, State> {
  private selectedEventIds = {}

  state = {
    visible: false,
    scenario: undefined,
    errorMessage: undefined,
    interactionsCount: 0
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
      this.selectedEventIds = {}
      this.props.store.setMessageWrapper({ module: 'testing', component: 'Wrapper' })
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

  toggleBuilder = () => {
    this.props.store.view.setContainerWidth(this.state.visible ? WEBCHAT_WIDTH : WEBCHAT_WIDTH + DEV_TOOLS_WIDTH)
    this.setState({ visible: !this.state.visible })
  }

  handleEventClicked = eventId => {
    if (!this.selectedEventIds[eventId]) {
      this.selectedEventIds[eventId] = true
    } else {
      delete this.selectedEventIds[eventId]
    }

    this.setState({ interactionsCount: Object.keys(this.selectedEventIds).length })
    this.props.store.view.setHighlightedMessages(Object.keys(this.selectedEventIds))
  }

  get hasEvents() {
    return this.selectedEventIds && !!Object.keys(this.selectedEventIds).length
  }

  buildScenario = async () => {
    const axios = this.props.store.bp.axios
    const eventIds = Object.keys(this.selectedEventIds)

    try {
      const { data: scenario } = await axios.post('/mod/testing/buildScenario', { eventIds })
      this.setState({ scenario })
    } catch (err) {
      AppToaster.show({ message: `Error while saving scenario: ${err.message}`, intent: Intent.DANGER, timeout: 3000 })
    }
  }

  saveScenario = async (scenarioName: string, recordedScenario: any) => {
    try {
      await this.props.store.bp.axios.post('/mod/testing/saveScenario', {
        name: scenarioName,
        steps: recordedScenario
      })

      this.selectedEventIds = {}
      this.props.store.view.setHighlightedMessages([])
      this.setState({ scenario: undefined })

      AppToaster.show({ message: 'Scenario created successfully!', intent: Intent.SUCCESS, timeout: 3000 })
    } catch (err) {
      AppToaster.show({ message: `Error while saving scenario: ${err.message}`, intent: Intent.DANGER, timeout: 3000 })
    }
  }

  discardScenario = () => this.setState({ scenario: undefined })

  renderEvents() {
    return this.state.scenario ? (
      <ScenarioDetails onSave={this.saveScenario} onDiscard={this.discardScenario} scenario={this.state.scenario} />
    ) : (
      <div style={{ padding: 5, height: '100%' }}>
        Select one or multiple interactions in the webchat. When you are satisfied, press the button below to name it
        and save your changes.
        <br />
        <br />
        <p>
          Interactions selected: <b>{this.state.interactionsCount}</b>
        </p>
        <Button onClick={this.buildScenario}>Build Scenario</Button>
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

        {this.hasEvents ? <div className={style.content}>{this.renderEvents()}</div> : <SplashScreen />}
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
  interactionsCount: number
}
