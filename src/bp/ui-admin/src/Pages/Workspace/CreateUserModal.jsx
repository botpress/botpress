import React, { Component } from 'react'
import { Button, Modal, FormGroup, Input, Label, ModalHeader, ModalBody } from 'reactstrap'
import { MdGroupAdd } from 'react-icons/lib/md'

import { connect } from 'react-redux'
import { fetchRoles } from '../../reducers/roles'
import api from '../../api'

class CreateUserModal extends Component {
  state = {
    email: '',
    role: null
  }

  componentDidMount() {
    this.props.fetchRoles()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isOpen && this.props.isOpen) {
      this.emailInput.focus()
    }

    if (!prevProps.roles.length && this.props.roles.length) {
      this.setState({ role: this.props.roles[0].id })
    }
  }

  onEmailChanged = e => {
    this.setState({ email: e.target.value })
  }

  onRoleChange = e => {
    this.setState({ role: e.target.value })
  }

  createUser = async e => {
    e.preventDefault()
    if (!this.isFormValid()) {
      return
    }

    const { data } = await api.getSecured().post('/admin/users', { email: this.state.email, role: this.state.role })
    this.props.onUserCreated && this.props.onUserCreated(data.payload)
  }

  isFormValid = () => {
    return this.formEl && this.formEl.checkValidity()
  }

  render() {
    return (
      <Modal isOpen={this.props.isOpen} toggle={this.props.toggleOpen}>
        <ModalHeader toggle={this.props.toggleOpen}>Add Collaborator</ModalHeader>
        <ModalBody>
          <form
            onSubmit={this.createUser}
            ref={form => {
              this.formEl = form
            }}
          >
            <FormGroup>
              <Label for="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                innerRef={input => {
                  this.emailInput = input
                }}
                onChange={this.onEmailChanged}
                required
                value={this.state.email}
              />
            </FormGroup>
            <FormGroup>
              <Label for="role">Role</Label>
              <Input required type="select" value={this.state.role} onChange={this.onRoleChange}>
                {this.props.roles.map(role => (
                  <option value={role.id} key={role.id}>
                    {role.name}
                  </option>
                ))}
              </Input>
            </FormGroup>
            <Button className="float-right" type="submit" color="primary" disabled={!this.isFormValid()}>
              <MdGroupAdd /> Add
            </Button>
          </form>
        </ModalBody>
      </Modal>
    )
  }
}

const mapStateToProps = state => ({
  roles: state.roles.roles
})

const mapDispatchToProps = {
  fetchRoles
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateUserModal)
