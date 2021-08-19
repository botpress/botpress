import { Button, Checkbox, Classes, Dialog, FileInput, FormGroup, InputGroup, Intent, Callout } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import { makeWorkspaceScopedBotID, sanitizeName } from 'common/utils'
import _ from 'lodash'
import ms from 'ms'
import React, { Component } from 'react'

import api from '~/app/api'
interface Props {
  onCreateBotSuccess: () => void
  toggle: () => void
  isOpen: boolean
  currentWorkspace: string
}

interface State {
  botId: string
  botName: string
  error: any
  filePath: string | null
  fileContent: Buffer | null
  isIdTaken: boolean
  isProcessing: boolean
  overwrite: boolean
  progress: number
}

const defaultState: State = {
  botId: '',
  botName: '',
  error: null,
  filePath: null,
  fileContent: null,
  isIdTaken: false,
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
      this.setState({ isIdTaken })
    } catch (error) {
      this.setState({ error: error.message })
    }
  }, 500)

  handleNameChanged = e => {
    const botName = e.target.value.trim()
    const botId = makeWorkspaceScopedBotID(this.props.currentWorkspace, botName)
    this.setState({ botName, botId })
  }

  handleFileChanged = (files: FileList | null) => {
    if (!files) {
      return
    }

    const fr = new FileReader()
    fr.readAsArrayBuffer(files[0])
    fr.onload = loadedEvent => {
      this.setState({ fileContent: _.get(loadedEvent, 'target.result') })
    }

    this.setState({ filePath: files[0].name })

    if (!this.state.botId.length || !this.state.botName.length) {
      this.generateBotId(files[0].name)
    }
  }

  generateBotId = (filename: string) => {
    const noExt = filename.substr(0, filename.indexOf('.'))
    const matches = noExt.match(/bot_(.*)_[0-9]+/)
    const botName = sanitizeName((matches && matches[1]) || noExt)
    const botId = makeWorkspaceScopedBotID(this.props.currentWorkspace, botName)

    this.setState({ botId, botName, overwrite: false }, this.checkIdAvailability)
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
              label={lang.tr('admin.workspace.bots.create.name')}
              labelFor="bot-name"
              labelInfo="*"
              helperText={lang.tr('admin.workspace.bots.create.nameHelper')}
            >
              <InputGroup
                id="input-bot-name"
                tabIndex={1}
                placeholder={lang.tr('admin.workspace.bots.create.namePlaceholder')}
                minLength={3}
                required
                value={this.state.botName}
                onChange={this.handleNameChanged}
                autoFocus
              />
            </FormGroup>
            <FormGroup
              label={
                <span>
                  {this.state.isIdTaken && (
                    <Callout intent={Intent.DANGER}>{lang.tr('admin.workspace.bots.import.alreadyInUse')}</Callout>
                  )}
                  {lang.tr('admin.workspace.bots.create.id')}{' '}
                </span>
              }
              labelFor="input-botId"
              helperText={lang.tr('admin.workspace.bots.create.idHelper')}
            >
              <InputGroup
                id="input-botId"
                tabIndex={1}
                placeholder={lang.tr('admin.workspace.bots.create.idPlaceholder')}
                intent={Intent.PRIMARY}
                minLength={3}
                value={this.state.botId}
                autoFocus={true}
                disabled
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
                id="btn-upload"
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
