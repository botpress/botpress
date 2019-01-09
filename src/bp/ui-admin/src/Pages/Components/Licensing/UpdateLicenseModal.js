import React, { Fragment } from 'react'
import { Modal, ModalHeader, ModalBody, Row, Col, Button } from 'reactstrap'

import CustomizeLicenseForm from './CustomizeLicenseForm'
import api from '../../../api'

const DEFAULT_STATE = {
  loading: false,
  error: false,
  seats: 0,
  newTotal: 0
}

export default class UpdateLicenseModal extends React.Component {
  state = { ...DEFAULT_STATE }

  toggle = () => {
    this.setState({ ...DEFAULT_STATE })
    this.props.toggle()
  }

  handleSeatsChanged = seats => this.setState({ seats })
  handleTotalChanged = newTotal => this.setState({ newTotal })

  updateLicense = () => {
    this.setState({ loading: true })
    const { license } = this.props

    api
      .getLicensing()
      .put(`/me/keys/${license.subscription}`, {
        seats: this.state.seats,
        support: license.support //TODO change this when the customize form enables changing support
      })
      .then(() => {
        this.props.refreshLicenses()
        this.toggle()
      })
      .catch(err => {
        this.setState({ loading: false, error: true })
      })
  }

  render() {
    const { isOpen, license } = this.props
    return (
      <Modal isOpen={isOpen} toggle={this.toggle}>
        <ModalHeader toggle={this.toggle}>Update your license</ModalHeader>
        <ModalBody>
          {!this.state.error && license && (
            <Fragment>
              <CustomizeLicenseForm
                onSeatsChanged={this.handleSeatsChanged}
                onTotalChanged={this.handleTotalChanged}
                license={license}
              />
              <span className="form__label">Totals</span>
              <span className="text-small">
                <strong>Current total:</strong> {license.cost}$
              </span>
              <Row className="align-items-center">
                <Col md="6">
                  <strong>
                    New total: <span className="text-brand">{this.state.newTotal}$</span>
                  </strong>
                </Col>
                <Col md="6" className="text-right">
                  <Button onClick={this.updateLicense} disabled={license.cost === this.state.newTotal}>
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
