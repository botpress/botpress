import React from 'react'

import { Button, FormGroup, H5, TextArea } from '@blueprintjs/core'

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
    } catch (err) {
      console.log('INVALID JSON', this.state.config)
    }
  }

  sendRawPayload = () => {
    try {
      const parsed = JSON.parse(this.state.rawPayload)
      this.props.store.sendData(parsed)
    } catch (err) {
      console.log('INVALID PAYLOAD', this.state.rawPayload)
    }
  }

  handleConfigChanged = event => this.setState({ config: event.target.value })
  handleRawPayloadChanged = event => this.setState({ rawPayload: event.target.value })

  render() {
    return (
      <div>
        <H5>Edit Configuration</H5>
        <FormGroup helperText={'Test temporary configuration changes. Refresh the page to reset.'} inline={true}>
          <TextArea
            name="config"
            value={this.state.config}
            onChange={this.handleConfigChanged}
            style={{ width: 495 }}
            rows={10}
            placeholder="Change Webchat Settings (must be valid json)"
          />
        </FormGroup>

        <Button onClick={this.saveConfig}>Save</Button>

        <hr style={{ margin: 10 }} />

        <H5>Send Raw Payloads</H5>
        <FormGroup helperText={'Send raw payload, to test events, for example.'} inline={true}>
          <TextArea
            name="rawPayload"
            value={this.state.rawPayload}
            onChange={this.handleRawPayloadChanged}
            style={{ width: 495 }}
            rows={3}
            placeholder="Valid JSON Payload"
          />
        </FormGroup>
        <Button onClick={this.sendRawPayload}>Send Payload</Button>
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
