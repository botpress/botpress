import React, { Component } from 'react'
import _ from 'lodash'
import { Button, Modal, ModalHeader, ModalBody, FormGroup, FormFeedback, Label, Input } from 'reactstrap'
import { MdGroupAdd } from 'react-icons/lib/md'

import api from '../../../api'

const defaultState = {
  botId: '',
  error: null,
  file: null,
  fileValue: null
}

class ImportBotModal extends Component {
  state = { ...defaultState }

  isFormValid = () => {
    return this.formEl && this.formEl.checkValidity() && this.state.fileValue != null
  }

  ImportBot = async e => {
    e.preventDefault()

    const { botId } = this.state

    try {
      await api.getSecured().post(`/admin/bots/${botId}/import`, this.state.fileValue, {
        headers: { 'Content-Type': 'application/tar+gzip', 'Content-Length': this.state.fileValue.length }
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

  handleBotIdChanged = e => this.setState({ botId: this.sanitizeBotId(e.target.value) })

  handleFileChanged = e => {
    const { value, files } = e.target
    const fr = new FileReader()
    fr.readAsBinaryString(files[0])
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
          <form onSubmit={this.ImportBot} ref={form => (this.formEl = form)}>
            <FormGroup>
              <Label for="id">
                <strong>Your bot ID *</strong>
                <br />
                <small>
                  This ID cannot be changed, so choose wisely. It will be displayed in the URL and your visitors can see
                  it. Special characters are not allowed. Minimum length: 3
                </small>
              </Label>
              <Input
                tabIndex="2"
                required
                type="text"
                minLength={3}
                value={this.state.botId}
                onChange={this.handleBotIdChanged}
              />
              <FormFeedback>The bot id should have at least 4 characters.</FormFeedback>
            </FormGroup>
            <FormGroup>
              <Label for="file">
                <strong>Bot file *</strong>
              </Label>
              <Input tabIndex="1" type="file" id="file" value={this.state.file} onChange={this.handleFileChanged} />
              <FormFeedback>Zip file with the bot content.</FormFeedback>
            </FormGroup>
            <Button tabIndex="4" className="float-right" type="submit" color="primary" disabled={!this.isFormValid()}>
              <MdGroupAdd /> Import bot
            </Button>
          </form>
          {!!this.state.error && <p className="text-danger">{this.state.error}</p>}
        </ModalBody>
      </Modal>
    )
  }
}

export default ImportBotModal
