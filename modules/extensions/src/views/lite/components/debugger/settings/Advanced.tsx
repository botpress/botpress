import { Button, FormGroup, Intent, TextArea } from '@blueprintjs/core'
import React from 'react'

import lang from '../../../../lang'
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
      AppToaster.show({
        message: lang.tr('module.extensions.settings.confUpdated'),
        intent: Intent.SUCCESS,
        timeout: 3000
      })
    } catch (err) {
      AppToaster.show({
        message: lang.tr('module.extensions.settings.confUpdatedError'),
        timeout: 3000,
        intent: Intent.DANGER
      })
    }
  }

  sendRawPayload = () => {
    try {
      const parsed = JSON.parse(this.state.rawPayload)
      this.props.store.sendData(parsed)
      AppToaster.show({
        message: lang.tr('module.extensions.settings.payloadSent'),
        intent: Intent.SUCCESS,
        timeout: 3000
      })
    } catch (err) {
      AppToaster.show({
        message: lang.tr('module.extensions.settings.payloadSentError'),
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
          label={lang.tr('module.extensions.settings.editConf')}
          helperText={lang.tr('module.extensions.settings.editConfHelper')}
        >
          <TextArea
            name="config"
            value={this.state.config}
            onChange={this.handleConfigChanged}
            style={{ width: 495 }}
            rows={15}
            placeholder={lang.tr('module.extensions.settings.editConfPlaceholder')}
          />
        </FormGroup>

        <Button onClick={this.saveConfig} intent={Intent.PRIMARY}>
          {lang.tr('module.extensions.settings.saveConf')}
        </Button>

        <hr style={{ margin: '20px 0' }} />

        <FormGroup
          label={lang.tr('module.extensions.settings.sendRawPayloads')}
          helperText={lang.tr('module.extensions.settings.sendRawPayloadsHelper')}
        >
          <TextArea
            name="rawPayload"
            value={this.state.rawPayload}
            onChange={this.handleRawPayloadChanged}
            style={{ width: 495 }}
            rows={3}
            placeholder={lang.tr('module.extensions.settings.sendRawPayloadsPlaceholder')}
          />
        </FormGroup>

        <Button onClick={this.sendRawPayload} intent={Intent.PRIMARY}>
          {lang.tr('module.extensions.settings.saveRawPayloads')}
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
