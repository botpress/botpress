import React, { Fragment } from 'react'
import { Modal, ModalHeader, ModalBody, Row, Col, Button } from 'reactstrap'

import CustomizeLicenseForm from './CustomizeLicenseForm'
import api from '../../../api'

const DEFAULT_STATE = {
  isLoading: false,
  isDirty: false,
  error: false,
  seats: 0,
  total: 0,
  label: ''
}

export default class UpdateLicenseModal extends React.Component {
  state = { ...DEFAULT_STATE }

  toggle = () => {
    this.setState({ ...DEFAULT_STATE })
    this.props.toggle()
  }

  handleDetailsUpdated = details => this.setState({ order: details, isDirty: true })

  updateLicense = () => {
    this.setState({ isLoading: true })
    const { license } = this.props

    api
      .getLicensing()
      .put(`/me/keys/${license.stripeSubscriptionId}`, {
        support: this.state.order.isGoldSupport ? 'gold' : 'standard',
        nodes: Number(this.state.order.nodes),
        label: this.state.order.label || '',
        partTime: this.state.order.isPartTimeEnabled
      })
      .then(() => {
        this.props.refreshLicenses()
        this.toggle()
      })
      .catch(err => {
        this.setState({ isLoading: false, error: true, errorMessage: err.message })
      })
  }

  renderForm() {
    const { license } = this.props

    return (
      <Fragment>
        <div style={{ padding: '10px' }}>
          <CustomizeLicenseForm onUpdate={this.handleDetailsUpdated} license={license} />
        </div>
        <span className="form__label">Totals</span>
        <span className="text-small">
          <strong>Current total:</strong> {license.cost}$
        </span>
        <Row className="align-items-center">
          <Col md="6">
            <strong>
              New total: <span className="text-brand">{this.state.total}$</span>
            </strong>
          </Col>
          <Col md="6" className="text-right">
            <Button color="primary" onClick={this.updateLicense} disabled={!this.state.isDirty || this.state.isLoading}>
              Confirm
            </Button>
          </Col>
        </Row>
      </Fragment>
    )
  }
  renderError() {
    return <Fragment>An error occurred: {this.state.errorMessage}</Fragment>
  }

  render() {
    const { isOpen } = this.props
    return (
      <Modal isOpen={isOpen} toggle={this.toggle} size="lg">
        <ModalHeader toggle={this.toggle}>Update your license</ModalHeader>
        <ModalBody>
          {!this.state.error && this.props.license && this.renderForm()}
          {this.state.error && this.renderError()}
        </ModalBody>
      </Modal>
    )
  }
}
