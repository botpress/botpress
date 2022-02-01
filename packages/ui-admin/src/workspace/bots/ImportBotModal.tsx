import { Button, Checkbox, Classes, Dialog, FileInput, FormGroup, InputGroup, Intent, Callout } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import _ from 'lodash'
import ms from 'ms'
import React, { Component } from 'react'

import api from '~/app/api'
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
  isIdTaken: boolean
  isExistingBot: boolean
  isProcessing: boolean
  overwrite: boolean
  progress: number
}

const defaultState: State = {
  botId: '',
  error: null,
  filePath: null,
  fileContent: null,
  isIdTaken: false,
  isExistingBot: false,
  isProcessing: false,
  overwrite: false,
  progress: 0
}

class ImportBotModal extends Component<Props, State> {
  private _form: HTMLFormElement | null = null

  state: State = { ...defaultState }

  importBot = async e => {
    e.preventDefault()
    if (this.isButtonDisabled) {
      return
    }

    this.setState({ isProcessing: true, progress: 0 })

    try {
      await api
        .getSecured({ timeout: ms('20m') })
        .post(
          `/admin/workspace/bots/${this.state.botId}/import?overwrite=${this.state.overwrite}`,
          this.state.fileContent,
          {
            headers: { 'Content-Type': 'application/tar+gzip' },
            onUploadProgress: evt => {
              this.setState({ progress: Math.round((evt.loaded / evt.total) * 100) })
            }
          }
        )

      toast.success('admin.workspace.bots.import.successful', this.state.botId)

      this.props.onCreateBotSuccess()
      this.toggleDialog()
    } catch (error) {
      this.setState({ error: error.message, isProcessing: false })
    } finally {
      this.setState({ progress: 0 })
    }
  }

  checkIdAvailability = _.debounce(async () => {
    if (!this.state.botId) {
      return this.setState({ isIdTaken: false })
    }

    try {
      const { data: isIdTaken } = await api.getSecured().get(`/admin/workspace/bots/${this.state.botId}/exists`)
      this.setState({ isIdTaken, isExistingBot: this.state.isExistingBot || isIdTaken })
    } catch (error) {
      this.setState({ error: error.message })
    }
  }, 500)

  handleBotIdChanged = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({ botId: sanitizeBotId(e.currentTarget.value), overwrite: false }, this.checkIdAvailability)

  handleFileChanged = (files: FileList | null) => {
    if (!files) {
      return
    }

    const fr = new FileReader()
    fr.readAsArrayBuffer(files[0])
    fr.onload = loadedEvent => {
      this.setState({ fileContent: _.get(loadedEvent, 'target.result') })
    }

    this.setState({ filePath: files[0].name, isExistingBot: false })

    if (!this.state.botId.length) {
      this.generateBotId(files[0].name)
    }
  }

  generateBotId = (filename: string) => {
    const noExt = filename.substr(0, filename.indexOf('.'))
    const matches = noExt.match(/bot_(.*)_[0-9]+/)
    this.setState(
      { botId: sanitizeBotId((matches && matches[1]) || noExt), overwrite: false },
      this.checkIdAvailability
    )
  }

  toggleDialog = () => {
    this.setState({ ...defaultState })
    this.props.toggle()
  }

  get isButtonDisabled() {
    const { isProcessing, botId, fileContent, isIdTaken, overwrite } = this.state
    return (
      isProcessing || !botId || !fileContent || (isIdTaken && !overwrite) || !this._form || !this._form.checkValidity()
    )
  }

  render() {
    const { isProcessing, progress } = this.state

    let buttonText = lang.tr('admin.workspace.bots.import.import')
    if (isProcessing) {
      if (progress !== 0) {
        buttonText = lang.tr('admin.versioning.uploadProgress', { progress })
      } else {
        buttonText = lang.tr('admin.versioning.processing')
      }
    }
    return (
      <Dialog
        title={lang.tr('admin.workspace.bots.import.fromArchive')}
        icon="import"
        isOpen={this.props.isOpen}
        onClose={this.toggleDialog}
        transitionDuration={0}
        canOutsideClickClose={false}
      >
        <form
          ref={form => (this._form = form)}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            this.handleFileChanged(e.dataTransfer.files)
          }}
        >
          <div className={Classes.DIALOG_BODY}>
            <FormGroup
              label={
                <span>
                  {this.state.isIdTaken && (
                    <div>
                      <Callout intent={Intent.DANGER}>{lang.tr('admin.workspace.bots.import.alreadyInUse')}</Callout>
                    </div>
                  )}
                  {this.state.isExistingBot && (
                    <Callout intent={Intent.WARNING}>{lang.tr('admin.workspace.bots.import.alreadyExists')}</Callout>
                  )}
                  {lang.tr('admin.workspace.bots.create.id')}{' '}
                </span>
              }
              labelFor="input-botId"
              labelInfo="*"
              helperText={lang.tr('admin.workspace.bots.create.idHelper')}
            >
              <InputGroup
                id="input-botId"
                tabIndex={1}
                placeholder={lang.tr('admin.workspace.bots.create.idPlaceholder')}
                intent={Intent.PRIMARY}
                minLength={3}
                maxLength={50}
                value={this.state.botId}
                onChange={this.handleBotIdChanged}
                autoFocus={true}
              />
            </FormGroup>
            <FormGroup label={lang.tr('admin.workspace.bots.import.archive')} labelInfo="*" labelFor="archive">
              <FileInput
                tabIndex={2}
                text={this.state.filePath || lang.tr('chooseFile')}
                onChange={event => this.handleFileChanged((event.target as HTMLInputElement).files)}
                inputProps={{ accept: '.zip,.tgz' }}
              />
            </FormGroup>
            {this.state.isIdTaken && (
              <Checkbox
                label={lang.tr('admin.workspace.bots.import.overwrite')}
                checked={this.state.overwrite}
                onChange={e => this.setState({ overwrite: e.currentTarget.checked })}
              ></Checkbox>
            )}
          </div>
          <div className={Classes.DIALOG_FOOTER}>
            {!!this.state.error && <Callout intent={Intent.DANGER}>{this.state.error}</Callout>}
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button
                id="btn-import-bot"
                tabIndex={3}
                type="submit"
                text={buttonText}
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
