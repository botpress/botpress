import React, { Fragment } from 'react'
import { Modal, ModalHeader, ModalBody, Row, Col, Button, Input, Label } from 'reactstrap'

import CustomizeLicenseForm from './CustomizeLicenseForm'
import api from '../../../api'

const DEFAULT_STATE = {
  isLoading: false,
  isDirty: false,
  error: false,
  termsRead: false,
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

  toggleReadTerms = () => {
    this.setState({ termsRead: !this.state.termsRead })
  }

  handleDetailsUpdated = details => this.setState({ order: details, isDirty: true })

  updateLicense = async () => {
    this.setState({ isLoading: true })
    const { license } = this.props
    const { quantities, limits, label, isPartTimeEnabled } = this.state.order

    const licensing = await api.getLicensing()
    licensing
      .put(`/me/keys/${license.stripeSubscriptionId}`, {
        support: quantities.isGoldSupport ? 'gold' : 'standard',
        nodes: Number(limits.nodes),
        label: label || '',
        partTime: isPartTimeEnabled
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
        {license.canceled && <small>* Note: Updating a canceled license will re-enable the automatic renewal</small>}
        <div style={{ padding: '10px' }}>
          <CustomizeLicenseForm onUpdate={this.handleDetailsUpdated} license={license} />
        </div>
        <span className="text-small">
          <strong>Current total:</strong> {license.cost || 0}$
        </span>
        <Row className="align-items-center">
          <Col md="4">
            <strong>
              New total: <span className="text-brand">{(this.state.order && this.state.order.totalPrice) || 0}$</span>
            </strong>
          </Col>
          <Col md="4">
            <Input type="checkbox" name="terms" onChange={this.toggleReadTerms} />
            <Label check>
              I accept the <a href="https://botpress.io/company/terms/">Terms of Service</a> and the{' '}
              <a href="https://botpress.io/company/terms/">Privacy Policy</a>
            </Label>
          </Col>
          <Col md="4" className="text-right">
            <Button
              color="primary"
              onClick={this.updateLicense}
              disabled={!this.state.isDirty || this.state.isLoading || !this.state.termsRead}
            >
              Confirm
            </Button>
          </Col>
        </Row>
      </Fragment>
    )
  }

  render() {
    return (
      <Modal isOpen={this.props.isOpen} toggle={this.toggle} size="lg">
        <ModalHeader toggle={this.toggle}>Update your license</ModalHeader>
        <ModalBody>
          {!this.state.error && this.props.license && this.renderForm()}
          {this.state.error && <Fragment>An error occurred: {this.state.errorMessage}</Fragment>}
        </ModalBody>
      </Modal>
    )
  }
}
