import { Intent, FormGroup, TextArea, Button } from '@blueprintjs/core'
import { lang, Dialog, toast } from 'botpress/shared'
import React, { Component } from 'react'

import api from '~/app/api'

interface Props {
  refresh: () => void
}

export default class EditLicense extends Component<Props> {
  state = { isModalOpen: false, licenseKey: undefined, error: undefined }

  toggleModal = () => {
    this.setState({ isModalOpen: !this.state.isModalOpen, licenseKey: undefined, error: undefined })
  }

  onInputKeyPress = async e => {
    if (e.key === 'Enter') {
      await this.changeKey()
    }
  }

  onInputChange = event => {
    this.setState({
      [event.target.name]: event.target.value.trim()
    })
  }

  async changeKey() {
    try {
      await api.getSecured().post(
        'admin/management/licensing/update',
        {
          licenseKey: this.state.licenseKey
        },
        {
          timeout: 10 * 1000 // 10s
        }
      )

      this.props.refresh && this.props.refresh()
      this.toggleModal()
    } catch (err) {
      toast.failure(err.message)
    }
  }

  renderModal() {
    return (
      <Dialog.Wrapper
        title={lang.tr('admin.license.enterYourLicense')}
        isOpen={this.state.isModalOpen}
        onClose={this.toggleModal}
      >
        <Dialog.Body>
          <FormGroup label={lang.tr('admin.license.newLicenseKey')}>
            <TextArea
              name="licenseKey"
              fill
              style={{ height: 180 }}
              onChange={this.onInputChange}
              onKeyPress={this.onInputKeyPress}
              value={this.state.licenseKey}
              autoFocus
            />
          </FormGroup>
        </Dialog.Body>
        <Dialog.Footer>
          <Button
            text={lang.tr('admin.license.validateChange')}
            intent={Intent.PRIMARY}
            onClick={() => this.changeKey()}
          />
        </Dialog.Footer>
      </Dialog.Wrapper>
    )
  }

  render() {
    return (
      <div>
        <Button
          text={lang.tr('admin.license.enterLicenseKey')}
          intent={Intent.PRIMARY}
          onClick={this.toggleModal}
        ></Button>
        {this.renderModal()}
      </div>
    )
  }
}
