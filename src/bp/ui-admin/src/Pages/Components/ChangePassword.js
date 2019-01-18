import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Button, Modal, Input, Label, ModalHeader, ModalBody, ModalFooter, FormGroup, Alert } from 'reactstrap'
import api from '../../api'

class ChangePassword extends Component {
  state = { isModalOpen: false, password: '', newPassword: '', confirmPassword: '', error: undefined }

  toggleModal = () => {
    this.setState({ isModalOpen: !this.state.isModalOpen })
  }

  onInputKeyPress = e => {
    if (e.key === 'Enter') {
      this.changePassword()
    }
  }

  onInputChange = event => {
    this.setState({
      [event.target.name]: event.target.value
    })
  }

  async changePassword() {
    if (this.state.newPassword !== this.state.confirmPassword) {
      this.setState({ error: `Passwords don't match` })
      return
    }

    await api
      .getSecured()
      .post('/auth/login', {
        email: this.props.profile.email,
        password: this.state.password,
        newPassword: this.state.newPassword
      })
      .then(() => this.toggleModal())
      .catch(err => this.setState({ error: err.message }))
  }

  renderModal() {
    return (
      <Modal isOpen={this.state.isModalOpen} toggle={this.toggleModal}>
        <ModalHeader toggle={this.toggleModal}>Change your password</ModalHeader>
        <ModalBody>
          {this.state.error && <Alert color="danger">{this.state.error}</Alert>}
          <FormGroup>
            <Label for="firstName">Current Password</Label>
            <Input
              name="password"
              type="password"
              onChange={this.onInputChange}
              onKeyPress={this.onInputKeyPress}
              value={this.state.firstName}
            />
          </FormGroup>
          <FormGroup>
            <Label for="lastName">New Password</Label>
            <Input
              value={this.state.newPassword}
              type="password"
              name="newPassword"
              onChange={this.onInputChange}
              onKeyPress={this.onInputKeyPress}
            />
          </FormGroup>
          <FormGroup>
            <Label for="lastName">Confirm Password</Label>
            <Input
              value={this.state.confirmPassword}
              type="password"
              name="confirmPassword"
              onChange={this.onInputChange}
              onKeyPress={this.onInputKeyPress}
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={() => this.changePassword()}>
            Change
          </Button>
        </ModalFooter>
      </Modal>
    )
  }

  render() {
    return (
      <div className="profile__change-pwd">
        <Button color="primary" size="sm" onClick={this.toggleModal}>
          Change Password
        </Button>
        {this.renderModal()}
      </div>
    )
  }
}

const mapStateToProps = state => ({ profile: state.user.profile })
export default connect(mapStateToProps)(ChangePassword)
