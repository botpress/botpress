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

  handleDetailsUpdated = details => this.setState({ ...details, isDirty: true })

  updateLicense = () => {
    this.setState({ isLoading: true })
    const { license } = this.props

    api
      .getLicensing()
      .put(`/me/keys/${license.subscription}`, {
        seats: this.state.seats,
        support: license.support, //TODO change this when the customize form enables changing support
        label: this.state.label
      })
      .then(() => {
        this.props.refreshLicenses()
        this.toggle()
      })
      .catch(err => {
        this.setState({ isLoading: false, error: true })
      })
  }

  render() {
    console.log(this.state)
    const { isOpen, license } = this.props
    return (
      <Modal isOpen={isOpen} toggle={this.toggle}>
        <ModalHeader toggle={this.toggle}>Update your license</ModalHeader>
        <ModalBody>
          {!this.state.error && license && (
            <Fragment>
              <CustomizeLicenseForm onUpdate={this.handleDetailsUpdated} license={license} />
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
                  <Button
                    color="primary"
                    onClick={this.updateLicense}
                    disabled={!this.state.isDirty || this.state.isLoading}
                  >
                    Confirm
                  </Button>
                </Col>
              </Row>
            </Fragment>
          )}
        </ModalBody>
      </Modal>
    )
  }
}
