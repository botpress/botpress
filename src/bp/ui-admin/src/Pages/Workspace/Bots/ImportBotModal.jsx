import React, { Component } from 'react'
import _ from 'lodash'
import { Button, Modal, ModalHeader, ModalBody, FormGroup, FormFeedback, Label, Input } from 'reactstrap'
import { MdUnarchive } from 'react-icons/md'

import api from '../../../api'

const defaultState = {
  botId: '',
  error: null,
  file: null,
  fileValue: null,
  idTaken: false
}

class ImportBotModal extends Component {
  state = { ...defaultState }

  focus = () => {
    this.IdInput && this.IdInput.focus()
  }

  isFormValid = () => {
    return this.formEl && this.formEl.checkValidity() && this.state.fileValue !== null && !this.state.idTaken
  }

  importBot = async e => {
    e.preventDefault()
    const { botId } = this.state

    const timeoutConfig = { timeout: 30000 }
    try {
      await api.getSecured(timeoutConfig).post(`/admin/bots/${botId}/import`, this.state.fileValue, {
        headers: { 'Content-Type': 'application/tar+gzip' }
      })
      this.setState({ ...defaultState })
      this.props.onCreateBotSuccess && this.props.onCreateBotSuccess()
      this.props.toggle()
    } catch (error) {
      this.setState({ error: error.message })
    }
  }

  sanitizeBotId = text => {
    return text
      .toLowerCase()
      .replace(/\s/g, '-')
      .replace(/[^a-z0-9_-]/g, '')
  }

  checkIdAvailability = _.debounce(async botId => {
    if (!botId) {
      this.setState({ idTaken: false })
      return
    }
    try {
      const { data: idTaken } = await api.getSecured().get(`/admin/bots/${botId}/exists`)
      this.setState({ idTaken })
    } catch (error) {
      this.setState({ error: error.message })
    }
  }, 500)

  handleBotIdChanged = e => {
    const botId = this.sanitizeBotId(e.target.value)

    this.checkIdAvailability(botId)
    this.setState({ botId })
  }

  handleFileChanged = e => {
    const { value, files } = e.target
    const fr = new FileReader()
    fr.readAsArrayBuffer(files[0])
    fr.onload = loadedEvent => {
      this.setState({ fileValue: loadedEvent.target.result })
    }
    this.setState({ file: value })
  }

  toggle = () => {
    this.setState({ ...defaultState })
    this.props.toggle()
  }

  render() {
    return (
      <Modal isOpen={this.props.isOpen} toggle={this.toggle} fade={false} onOpened={this.focus}>
        <ModalHeader toggle={this.props.toggle}>Import a new bot</ModalHeader>
        <ModalBody>
          <form onSubmit={this.importBot} ref={form => (this.formEl = form)}>
            <FormGroup>
              <Label for="id">
                <strong>Bot ID</strong> {this.state.idTaken && <span className="text-danger">Already Taken</span>}
              </Label>
              <Input
                innerRef={el => (this.IdInput = el)}
                tabIndex="-1"
                required
                type="text"
                minLength={3}
                value={this.state.botId}
                onChange={this.handleBotIdChanged}
              />
              <small>
                This ID cannot be changed, so choose wisely. It will be displayed in the URL and your visitors can see
                it. Special characters are not allowed. Minimum length: 4
              </small>
              <FormFeedback>The bot id should have at least 4 characters.</FormFeedback>
            </FormGroup>
            <FormGroup>
              <Label for="file">
                <strong>Bot file</strong>
              </Label>
              <Input tabIndex="1" type="file" id="file" value={this.state.file} onChange={this.handleFileChanged} />
              <FormFeedback>Zip file with the bot content.</FormFeedback>
            </FormGroup>
            <Button tabIndex="4" className="float-right" type="submit" color="primary" disabled={!this.isFormValid()}>
              <MdUnarchive /> Import bot
            </Button>
          </form>
          {!!this.state.error && <p className="text-danger">{this.state.error}</p>}
        </ModalBody>
      </Modal>
    )
  }
}

export default ImportBotModal
