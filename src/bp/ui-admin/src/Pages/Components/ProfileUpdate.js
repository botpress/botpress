import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import _ from 'lodash'
import { Button, Modal, Input, Label, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import api from '../../api'

class ProfileUpdate extends Component {
  state = { forceClose: false, firstName: '', lastName: '' }

  closeModal = () => {
    this.setState({ forceClose: true })
  }

  isModalOpen = () => {
    return !this.state.forceClose && !_.get(this.props, 'profile.fullName')
  }

  onInputKeyPress = e => {
    if (e.key === 'Enter') {
      this.updateProfile()
    }
  }

  onInputChanged = event => {
    this.setState({
      [event.target.name]: event.target.value
    })
  }

  async updateProfile() {
    await api.getSecured().post('api/auth/me/profile', {
      firstname: this.state.firstName,
      lastname: this.state.lastName
    })

    this.setState({ forceClose: true })
  }

  render() {
    return (
      <Modal isOpen={this.isModalOpen()} toggle={this.closeModal}>
        <ModalHeader toggle={this.closeModal}>Please complete your profile</ModalHeader>
        <ModalBody>
          <Label for="firstName">First Name</Label>
          <Input
            name="firstName"
            onChange={this.onInputChanged}
            onKeyPress={this.onInputKeyPress}
            value={this.state.firstName}
          />
          <Label for="lastName">Last Name</Label>
          <Input
            name="lastName"
            onChange={this.onInputChanged}
            onKeyPress={this.onInputKeyPress}
            value={this.state.lastName}
          />
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={() => this.updateProfile()}>
            Save
          </Button>
        </ModalFooter>
      </Modal>
    )
  }
}

const mapStateToProps = state => ({
  profile: state.user.profile
})

const mapDispatchToProps = dispatch => bindActionCreators({}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProfileUpdate)
