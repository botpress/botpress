import { Button, FormGroup, Intent, TextArea } from '@blueprintjs/core'
import React from 'react'

import { AppToaster } from '../toaster'

export default class AdvancedSettings extends React.Component<AdvancedSettingsProps, AdvancedSettingsState> {
  state = {
    config: '',
    rawPayload: ''
  }

  componentDidMount() {
    this.setState({ config: JSON.stringify(this.props.store.config, undefined, 2) })
  }

  saveConfig = () => {
    try {
      const parsed = JSON.parse(this.state.config)
      this.props.store.updateConfig(parsed)
      AppToaster.show({ message: 'Configuration updated successfully!', intent: Intent.SUCCESS, timeout: 3000 })
    } catch (err) {
      AppToaster.show({
        message: 'There was an error parsing your configuration. Please validate the syntax',
        timeout: 3000,
        intent: Intent.DANGER
      })
    }
  }

  sendRawPayload = () => {
    try {
      const parsed = JSON.parse(this.state.rawPayload)
      this.props.store.sendData(parsed)
      AppToaster.show({ message: 'Payload sent successfully!', intent: Intent.SUCCESS, timeout: 3000 })
    } catch (err) {
      AppToaster.show({
        message: 'There was an error parsing your payload. Please validate the syntax',
        timeout: 3000,
        intent: Intent.DANGER
      })
    }
  }

  handleConfigChanged = event => this.setState({ config: event.target.value })
  handleRawPayloadChanged = event => this.setState({ rawPayload: event.target.value })

  render() {
    return (
      <div>
        <FormGroup
          label="Edit Configuration"
          helperText={'Test temporary configuration changes. Refresh the page to reset.'}
        >
          <TextArea
            name="config"
            value={this.state.config}
            onChange={this.handleConfigChanged}
            style={{ width: 495 }}
            rows={15}
            placeholder="Change Webchat Settings (must be valid json)"
          />
        </FormGroup>

        <Button onClick={this.saveConfig} intent={Intent.PRIMARY}>
          Save Configuration
        </Button>

        <hr style={{ margin: '20px 0' }} />

        <FormGroup
          label="Send Raw Payloads"
          helperText={'Send any valid JSON message, to test custom events, for example'}
        >
          <TextArea
            name="rawPayload"
            value={this.state.rawPayload}
            onChange={this.handleRawPayloadChanged}
            style={{ width: 495 }}
            rows={3}
            placeholder="Valid JSON Payload"
          />
        </FormGroup>

        <Button onClick={this.sendRawPayload} intent={Intent.PRIMARY}>
          Send Payload
        </Button>
      </div>
    )
  }
}

interface AdvancedSettingsProps {
  store: any
}

interface AdvancedSettingsState {
  config: string
  rawPayload: string
}
