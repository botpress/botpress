import React from 'react'
import {
  Modal,
  Button,
  Alert
} from 'react-bootstrap'

import axios from 'axios'

import actions from '~/actions'

import style from './style.scss'

export default class LicenseComponent extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      licenses: {}
    }

    this.close = this.close.bind(this)
  }

  componentDidMount () {
    this.getLicenses()
  }

  getLicenses() {
    axios.get('/api/manager/licenses')
    .then((result) => {
      this.setState({
        licenses: result.data,
      })
    })
  }

  close() {
    actions.toggleLicenseModal()
  }

  renderAlertMessage() {
    return (
      <Alert bsStyle="warning">
        <strong>Holy guacamole!</strong> Best check yo self, you're not looking too good.
      </Alert>
    )
  }

  renderLicenseToggle() {
    
  }

  renderLicenseTextArea() {
    return null
  }

  renderAcceptCheckBox() {
    return null
  }

  renderSaveButton() {
    return null
  }

  renderCancelButton() {
    return <Button onClick={this.close}>Close</Button>
  }

  render() {
    return (
      <Modal show={this.props.opened} onHide={this.close}>
        <Modal.Header closeButton>
          <Modal.Title>License</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.renderAlertMessage()}
          {this.renderLicenseToggle()}
          {this.renderLicenseTextArea()}
          {this.renderAcceptCheckBox()}
        </Modal.Body>
        <Modal.Footer>
          {this.renderSaveButton()}
          {this.renderCancelButton()}
        </Modal.Footer>
      </Modal>
    )
  }
}
