import { Button, Classes, Dialog, FileInput, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import _ from 'lodash'
import React, { Component } from 'react'

import api from '../../../api'

import { sanitizeBotId } from './CreateBotModal'

interface Props {
  onCreateBotSuccess: () => void
  toggle: () => void
  isOpen: boolean
}

interface State {
  botId: string
  error: any
  filePath: string | null
  fileContent: Buffer | null
  isProcessing: boolean
  isIdTaken: boolean
}

const defaultState = {
  botId: '',
  error: null,
  filePath: null,
  fileContent: null,
  isIdTaken: false,
  isProcessing: false
}

class ImportBotModal extends Component<Props, State> {
  private _form: HTMLFormElement | null = null

  state: State = { ...defaultState }

  importBot = async e => {
    e.preventDefault()
    if (this.isButtonDisabled) {
      return
    }
    this.setState({ isProcessing: true })

    try {
      // @ts-ignore
      await api.getSecured({ timeout: 30000 }).post(`/admin/bots/${this.state.botId}/import`, this.state.fileContent, {
        headers: { 'Content-Type': 'application/tar+gzip' }
      })

      this.props.onCreateBotSuccess()
      this.toggleDialog()
    } catch (error) {
      this.setState({ error: error.message, isProcessing: false })
    }
  }

  checkIdAvailability = _.debounce(async () => {
    if (!this.state.botId) {
      return this.setState({ isIdTaken: false })
    }

    try {
      const { data: isIdTaken } = await api.getSecured().get(`/admin/bots/${this.state.botId}/exists`)
      this.setState({ isIdTaken })
    } catch (error) {
      this.setState({ error: error.message })
    }
  }, 500)

  handleBotIdChanged = e => this.setState({ botId: sanitizeBotId(e.target.value) }, this.checkIdAvailability)

  handleFileChanged = e => {
    const fr = new FileReader()
    fr.readAsArrayBuffer(e.target.files[0])
    fr.onload = loadedEvent => {
      this.setState({ fileContent: _.get(loadedEvent, 'target.result') })
    }
    this.setState({ filePath: e.target.value })
  }

  toggleDialog = () => {
    this.setState({ ...defaultState })
    this.props.toggle()
  }

  get isButtonDisabled() {
    const { isProcessing, botId, fileContent, isIdTaken } = this.state
    return isProcessing || !botId || !fileContent || isIdTaken || !this._form || !this._form.checkValidity()
  }

  render() {
    return (
      <Dialog
        isOpen={this.props.isOpen}
        icon="import"
        onClose={this.toggleDialog}
        transitionDuration={0}
        title="Import bot from archive"
      >
        <form ref={form => (this._form = form)}>
          <div className={Classes.DIALOG_BODY}>
            <FormGroup
              label={<span>Bot ID {this.state.isIdTaken && <span className="text-danger">Already in use</span>}</span>}
              labelFor="input-botId"
              labelInfo="*"
              helperText="This ID cannot be changed, so choose wisely. It will be displayed in the URL and your visitors can see it.
              Special characters are not allowed. Minimum length: 4"
            >
              <InputGroup
                id="input-botId"
                tabIndex={1}
                placeholder="The ID of your bot"
                intent={Intent.PRIMARY}
                minLength={3}
                value={this.state.botId}
                onChange={this.handleBotIdChanged}
                autoFocus={true}
              />
            </FormGroup>

            <FormGroup
              label="Bot Archive"
              labelInfo="*"
              labelFor="archive"
              helperText="File must be a valid .zip or .tgz archive"
            >
              <FileInput
                tabIndex={2}
                text={this.state.filePath || 'Choose file...'}
                onChange={this.handleFileChanged}
              />
            </FormGroup>
          </div>
          <div className={Classes.DIALOG_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button
                id="btn-upload"
                tabIndex={3}
                type="submit"
                text={this.state.isProcessing ? 'Please wait...' : 'Import Bot'}
                onClick={this.importBot}
                disabled={this.isButtonDisabled}
                intent={Intent.PRIMARY}
              />
            </div>
          </div>
        </form>
      </Dialog>
    )
  }
}

export default ImportBotModal
