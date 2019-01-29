import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import _ from 'lodash'
import { Button, Modal, Input, Label, ModalHeader, ModalBody, ModalFooter, FormGroup, Alert } from 'reactstrap'
import api from '../../api'
import { fetchProfile } from '../../reducers/user'

class ProfileUpdate extends Component {
  state = { isInit: false, forceClose: false, firstName: '', lastName: '', isDirty: false }

  componentDidMount() {
    if (this.props.profile) {
      this.displayName()
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.profile && this.props.profile) {
      this.displayName()
    }
  }

  displayName = () => {
    const { firstname = '', lastname = '' } = this.props.profile
    this.setState({ firstName: firstname, lastName: lastname })
  }

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
      [event.target.name]: event.target.value,
      isDirty: true
    })
  }

  async updateProfile() {
    await api.getSecured().post('/auth/me/profile', {
      firstname: this.state.firstName,
      lastname: this.state.lastName
    })

    this.props.fetchProfile()
    this.setState({ forceClose: true, successMsg: `Profile updated with success`, isDirty: false })

    window.setTimeout(() => {
      this.setState({ successMsg: undefined })
    }, 2000)
  }

  renderFields() {
    return (
      <div>
        <FormGroup>
          <Label for="firstName">First Name</Label>
          <Input
            name="firstName"
            onChange={this.onInputChanged}
            onKeyPress={this.onInputKeyPress}
            value={this.state.firstName}
          />
        </FormGroup>
        <FormGroup>
          <Label for="lastName">Last Name</Label>
          <Input
            name="lastName"
            onChange={this.onInputChanged}
            onKeyPress={this.onInputKeyPress}
            value={this.state.lastName}
          />
        </FormGroup>
      </div>
    )
  }

  renderForm() {
    return (
      <div>
        {this.state.successMsg ? <Alert type="success">{this.state.successMsg}</Alert> : ''}
        {this.renderFields()}
        {this.renderSave()}
      </div>
    )
  }

  renderModal() {
    return (
      <Modal isOpen={this.isModalOpen()} toggle={this.closeModal}>
        <ModalHeader toggle={this.closeModal}>Please complete your profile</ModalHeader>
        <ModalBody>{this.renderFields()}</ModalBody>
        <ModalFooter>{this.renderSave()}</ModalFooter>
      </Modal>
    )
  }

  renderSave() {
    return (
      this.state.isDirty && (
        <Button color="primary" onClick={() => this.updateProfile()}>
          Save
        </Button>
      )
    )
  }

  render = () => (this.props.renderAsModal ? this.renderModal() : this.renderForm())
}

const mapStateToProps = state => ({ profile: state.user.profile })
const mapDispatchToProps = dispatch => bindActionCreators({ fetchProfile }, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProfileUpdate)
