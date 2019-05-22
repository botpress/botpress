import { Button, ButtonGroup, Tab, Tabs } from '@blueprintjs/core'
import '@blueprintjs/core/lib/css/blueprint.css'

import nanoid from 'nanoid'
import React from 'react'
import { GoTerminal } from 'react-icons/go'

import Settings from './settings'
import style from './style.scss'
import { Decision } from './views/Decision'
import { Entities } from './views/Entities'
import { Inspector } from './views/Inspector'
import { Intents } from './views/Intents'
import { Slots } from './views/Slots'
import { Suggestions } from './views/Suggestions'

export const updater = { isLoaded: false, callback: undefined }

export class DevTools extends React.Component<DevToolProps, DevToolState> {
  state = {
    event: undefined,
    visible: true,
    selectedTabId: 'basic',
    showSettings: false
  }

  componentDidMount() {
    updater.callback = data => {
      this.setState({ event: data })
    }

    this.props.store.view.setLayoutWidth(360)
    this.props.store.view.setContainerWidth(900)
    this.props.store.setMessageWrapper({ module: 'extensions', component: 'Wrapper' })

    this.props.store.view.addHeaderButton({
      id: 'toggleDev',
      label: 'Show Developer Tools',
      icon: <GoTerminal />,
      onClick: this.handleToggleDev
    })
  }

  componentWillUnmount() {
    this.props.store.view.removeHeaderButton('toggleDev')
  }

  handleNewSession = () => {
    const userId = 'emulator_' + nanoid(7)
    this.props.store.setUserId(userId)
  }

  handleToggleDev = btnId => {
    this.props.store.view.updateHeaderButton('toggleDev', {
      label: 'Hide Developer Tools',
      icon: <GoTerminal color="green" />
    })

    this.props.store.view.setContainerWidth(this.state.visible ? 360 : 900)
    this.setState({ visible: !this.state.visible })
  }

  toggleSettings = e => this.setState({ showSettings: !this.state.showSettings })
  handleTabChange = selectedTabId => this.setState({ selectedTabId })

  renderToolbar() {
    return (
      <ButtonGroup minimal={false}>
        <Button icon="refresh" onClick={this.handleNewSession} small={true} title="New Session" />
        <Button icon={<GoTerminal />} onClick={this.toggleSettings} small={true} title="Settings" />
      </ButtonGroup>
    )
  }

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
    if (!this.state.event || !this.state.visible) {
      return null
    }

    return (
      <div className={style['bpw-emulator']}>
        <div style={{ float: 'right' }}>
          <Settings store={this.props.store} isOpen={this.state.showSettings} toggle={this.toggleSettings} />
          {this.renderToolbar()}
        </div>

        <Tabs id="tabs" onChange={this.handleTabChange} selectedTabId={this.state.selectedTabId}>
          <Tab id="basic" title="Summary" panel={this.renderSummary()} />
          <Tab id="advanced" title="View payload" panel={<Inspector data={this.state.event} />} />
        </Tabs>
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
}
