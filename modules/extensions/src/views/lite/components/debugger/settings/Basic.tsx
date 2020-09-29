import { Button, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import React from 'react'

import Checkbox from '../../../../../../../../src/bp/ui-shared-lite/Checkbox'
import lang from '../../../../lang'
import { AppToaster } from '../toaster'
import { loadSettings, persistSettings } from '../utils'

export default class Basic extends React.Component<BasicSettingProps, BasicSettingState> {
  state = {
    userId: '',
    externalAuthToken: '',
    autoOpenDebugger: false,
    updateToLastMessage: false
  }

  componentDidMount() {
    const { userId, externalAuthToken } = this.props.store.config
    const { autoOpenDebugger, updateToLastMessage } = loadSettings()

    this.setState({ userId, externalAuthToken: externalAuthToken || '', autoOpenDebugger, updateToLastMessage })
  }

  saveSettings = () => {
    this.props.store.mergeConfig({
      userId: this.state.userId,
      externalAuthToken: this.state.externalAuthToken
    })

    persistSettings({
      autoOpenDebugger: this.state.autoOpenDebugger,
      updateToLastMessage: this.state.updateToLastMessage
    })
    AppToaster.show({
      message: lang.tr('module.extensions.settings.confUpdated'),
      intent: Intent.SUCCESS,
      timeout: 3000
    })
  }

  handleUserIdChanged = event => this.setState({ userId: event.target.value })
  handleAuthChanged = event => this.setState({ externalAuthToken: event.target.value })
  handleAutoOpenChanged = event => this.setState({ autoOpenDebugger: event.target.checked })
  handleAutoUpdateToLastMessage = event => this.setState({ updateToLastMessage: event.target.checked })

  render() {
    return (
      <div>
        <Checkbox
          label={lang.tr('module.extensions.settings.alwaysShowDebugger')}
          checked={this.state.autoOpenDebugger}
          onChange={this.handleAutoOpenChanged}
        />

        <Checkbox
          label={lang.tr('module.extensions.settings.updateDebuggerOnNew')}
          checked={this.state.updateToLastMessage}
          onChange={this.handleAutoUpdateToLastMessage}
        />

        <FormGroup
          label={lang.tr('module.extensions.settings.userId')}
          helperText={lang.tr('module.extensions.settings.userIdHelper')}
        >
          <InputGroup
            value={this.state.userId}
            onChange={this.handleUserIdChanged}
            placeholder={lang.tr('module.extensions.settings.userIdPlaceholder')}
          />
        </FormGroup>

        <FormGroup
          label={lang.tr('module.extensions.settings.authToken')}
          helperText={lang.tr('module.extensions.settings.authTokenHelper')}
        >
          <InputGroup
            value={this.state.externalAuthToken}
            onChange={this.handleAuthChanged}
            placeholder={lang.tr('module.extensions.settings.authTokenPlaceholder')}
          />
        </FormGroup>

        <Button onClick={this.saveSettings} intent={Intent.PRIMARY}>
          {lang.tr('module.extensions.settings.save')}
        </Button>
      </div>
    )
  }
}

interface BasicSettingProps {
  store: any
}

interface BasicSettingState {
  userId: string
  externalAuthToken: string
  autoOpenDebugger: boolean
  updateToLastMessage: boolean
}
