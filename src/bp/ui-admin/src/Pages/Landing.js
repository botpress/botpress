import React, { Component } from 'react'

import { Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'

class Landing extends Component {
  constructor(props) {
    super(props)
    this.state = {
      modal: false,
      backdrop: true
    }

    this.toggle = this.toggle.bind(this)
    this.changeBackdrop = this.changeBackdrop.bind(this)
  }

  toggle() {
    this.setState({
      modal: !this.state.modal
    })
  }

  changeBackdrop(e) {
    let value = e.target.value
    if (value !== 'static') {
      value = JSON.parse(value)
    }
    this.setState({ backdrop: value })
  }

  // TODO link field an btns of the form
  renderCompleteProfileModal() {
    return (
      <Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
        <ModalHeader toggle={this.toggle}>Complete your profile</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="email">
              <strong>email</strong>
            </Label>
            <Input type="text" id="email" />
          </FormGroup>
          <FormGroup>
            <Label for="email">
              <strong>Email</strong>
            </Label>
            <Input type="email" id="email" />
          </FormGroup>
          <FormGroup>
            <Label for="password">
              <strong>Password</strong>
            </Label>
            <Input type="password" id="password" />
          </FormGroup>
          <FormGroup>
            <Label for="password">
              <strong>Confirm password</strong>
            </Label>
            <Input type="password" id="confirmPassword" />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={this.toggle}>
            Cancel
          </Button>
          <Button color="primary" onClick={this.toggle} disabled>
            Save
          </Button>{' '}
        </ModalFooter>
      </Modal>
    )
  }

  render() {
    return (
      <div className="landing">
        <h2>Welcome to Botpress!</h2>
        <p>Let's start by completing your profile</p>
        <Button color="primary" onClick={this.toggle}>
          Complete your profile
        </Button>
        {this.renderCompleteProfileModal()}
      </div>
    )
  }
}

export default Landing
