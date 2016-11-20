import React from 'react'
import {
  Modal,
  Button,
  Alert
} from 'react-bootstrap'

import axios from 'axios'
import _ from 'lodash'

import actions from '~/actions'

import style from './style.scss'

export default class LicenseComponent extends React.Component {

  constructor(props) {
    super(props)

    this.state = { loading: true, accepted: false }
    this.renderRadioButton = this.renderRadioButton.bind(this)

    this.handleClose = this.handleClose.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleRadioChange = this.handleRadioChange.bind(this)
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this)
  }

  componentDidMount () {
    this.getLicenses()
  }

  getLicenses() {
    axios.get('/api/manager/license')
    .then((result) => {
      this.setState({
        licenses: result.data,
        selectedOption: _.findKey(result.data, ['licensedUnder', true]),
        loading: false
      })
    })
  }

  handleClose() {
    actions.toggleLicenseModal()
  }

  handleSave() {
    axios.post('/api/manager/license', { license: this.state.selectedOption })
    .then(() => {
      this.handleClose()
    })
    .catch((err) => {
      console.log(err)
    })
  }

  handleRadioChange(event) {
    this.setState({
      selectedOption: event.target.value,
      accepted: false
    })
  }

  handleCheckboxChange() {
    this.setState({
      accepted: !this.state.accepted
    })
  }

  renderAlertMessage() {
    let type = 'warning'
    let text = "You must read and accept terms and conditions before changing your license."

    if (this.state.selectedOption === _.findKey(this.state.licenses, ['licensedUnder', true])) {
      type = 'info'
      text = "Please, take some time to look at our FAQ page to know why you should change of license."
    }

    return <Alert className={style.alert} bsStyle={type}>{text}</Alert>

  }

  renderRadioButton(license, key) {
    return (
      <span key={key}>
        <label>
          <input type="radio" value={key}
            checked={this.state.selectedOption === key}
            onChange={this.handleRadioChange} />
          {license.name}
        </label>
      </span>
    )
  }

  renderLicenseToggles() {
    return (
      <div className={style.radioButton}>
        <label>License: </label>
        {_.values(_.mapValues(this.state.licenses, this.renderRadioButton))}
      </div>
    )
  }

  renderLicenseTextArea() {
    const selectedLicense = this.state.licenses[this.state.selectedOption]
    return (
      <div>
        <textarea readOnly={true} className={style.textArea} value={selectedLicense.text}/>
      </div>
    )
  }

  renderAcceptCheckBox() {
    const selectedLicense = this.state.licenses[this.state.selectedOption]
    return (
      <div className={style.acceptCheckBox}>
        <input type="checkbox"
          checked={this.state.accepted}
          onChange={this.handleCheckboxChange}/>
        Check here to indicate that you have read and agree to the terms of the {selectedLicense.name} License Agreement.
      </div>
    )
  }

  renderSaveButton() {
    return <Button onClick={this.handleSave} disabled={!this.state.accepted}>Save</Button>
  }

  renderCancelButton() {
    return <Button onClick={this.handleClose}>Cancel</Button>
  }

  render() {
    if(this.state.loading) {
      return null
    }
    return (
      <Modal show={this.props.opened} onHide={this.handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Select the license of your chatbot</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.renderAlertMessage()}
          {this.renderLicenseToggles()}
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
