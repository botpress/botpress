import React, { Component } from 'react'
import { Button, Modal, Input, Label, ModalHeader, ModalBody, ModalFooter, FormGroup, Alert } from 'reactstrap'
import api from '../../api'
import { lang } from 'botpress/shared'

export default class EditLicense extends Component {
  state = { isModalOpen: false, licenseKey: undefined, error: undefined }

  toggleModal = () => {
    this.setState({ isModalOpen: !this.state.isModalOpen, licenseKey: undefined, error: undefined })
  }

  onInputKeyPress = e => {
    if (e.key === 'Enter') {
      this.changeKey()
    }
  }

  onInputChange = event => {
    this.setState({
      [event.target.name]: event.target.value.trim()
    })
  }

  async changeKey() {
    await api
      .getSecured()
      .post(
        'admin/license/update',
        {
          licenseKey: this.state.licenseKey
        },
        {
          timeout: 10 * 1000 // 10s
        }
      )
      .then(() => {
        this.props.refresh && this.props.refresh()
        this.toggleModal()
      })
      .catch(err => this.setState({ error: err.message }))
  }

  renderModal() {
    return (
      <Modal isOpen={this.state.isModalOpen} toggle={this.toggleModal}>
        <ModalHeader toggle={this.toggleModal}>{lang.tr('admin.license.enterYourLicense')}</ModalHeader>
        <ModalBody>
          {this.state.error && <Alert color="danger">{this.state.error}</Alert>}
          <FormGroup>
            <Label for="firstName">{lang.tr('admin.license.newLicenseKey')}</Label>
            <Input
              name="licenseKey"
              type="textarea"
              style={{ height: 180 }}
              onChange={this.onInputChange}
              onKeyPress={this.onInputKeyPress}
              value={this.state.licenseKey}
              autoFocus
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={() => this.changeKey()}>
            {lang.tr('admin.license.validateChange')}
          </Button>
        </ModalFooter>
      </Modal>
    )
  }

  render() {
    return (
      <div>
        <Button size="sm" color="primary" outline onClick={this.toggleModal}>
          {lang.tr('admin.license.enterLicenseKey')}
        </Button>
        {this.renderModal()}
      </div>
    )
  }
}
