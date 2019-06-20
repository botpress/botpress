import React, { Component } from 'react'
import { Button, Modal, FormGroup, Input, Label, ModalHeader, ModalBody } from 'reactstrap'
import { MdGroupAdd } from 'react-icons/md'

import { connect } from 'react-redux'
import { fetchRoles } from '../../reducers/roles'
import api from '../../api'
import AsyncSelect from 'react-select/lib/AsyncCreatable'
import Select from 'react-select'

class CreateUserModal extends Component {
  state = {
    email: '',
    role: null,
    displayStrategy: false,
    selectedUser: undefined,
    selectedStrategy: undefined
  }

  componentDidMount() {
    this.props.fetchRoles()
    this.loadStrategies()
    this.loadUsers()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isOpen && this.props.isOpen) {
      this.emailInput.focus()
    }

    if (!prevProps.roles.length && this.props.roles.length) {
      this.setState({ role: this.props.roles[0].id })
    }
  }

  async loadStrategies() {
    const { data } = await api.getAnonymous().get('/auth/config')

    this.setState({
      strategies: data.payload.strategies.map(x => {
        return { label: x.strategyId, value: x.strategyId }
      })
    })
  }

  async loadUsers() {
    const { data } = await api.getSecured().get('/admin/users/listAvailableUsers')
    this.setState({ users: data.payload })
  }

  onEmailChanged = e => {
    this.setState({ email: e.target.value })
  }

  onRoleChange = e => {
    this.setState({ role: e.target.value })
  }

  createUser = async e => {
    const { selectedUser, selectedStrategy } = this.state

    e.preventDefault()
    if (!this.isFormValid() || !selectedUser) {
      return
    }

    if (selectedUser['__isNew__']) {
      const { data } = await api.getSecured().post('/admin/users', {
        email: selectedUser.value,
        strategy: selectedStrategy.value,
        role: this.state.role
      })

      this.props.onUserCreated && this.props.onUserCreated(data.payload)
    } else {
      const { email, strategy } = selectedUser.value
      await api.getSecured().post('/admin/users/workspace/add', { email, strategy, role: this.state.role })
      this.props.onUserAdded && this.props.onUserAdded()
    }
  }

  isFormValid = () => {
    return this.formEl && this.formEl.checkValidity()
  }

  findUsers = async inputValue => {
    if (!inputValue.length || !this.state.users) {
      return
    }

    const searchString = inputValue.toLowerCase()
    return this.state.users.filter(x => x.email.toLowerCase().includes(searchString)).map(user => {
      return { label: `${user.email} (${user.strategy})`, value: user }
    })
  }

  handleUserChanged = selectedUser => {
    this.setState({
      selectedUser,
      displayStrategy: selectedUser && selectedUser['__isNew__'],
      selectedStrategy: this.state.strategies[0]
    })
  }

  handleStrategyChanged = selectedStrategy => this.setState({ selectedStrategy })

  renderCreatable() {
    return (
      <AsyncSelect
        cacheOptions
        defaultOptions
        ref={input => {
          this.emailInput = input
        }}
        value={this.state.selectedOption}
        loadOptions={this.findUsers}
        onChange={this.handleUserChanged}
      />
    )
  }

  renderStrategies() {
    return (
      <Select
        options={this.state.strategies}
        onChange={this.handleStrategyChanged}
        value={this.state.selectedStrategy}
      />
    )
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
              {this.renderCreatable()}
            </FormGroup>

            {this.state.displayStrategy && (
              <FormGroup>
                <Label for="strategy">Authentication Strategy</Label>
                {this.renderStrategies()}
              </FormGroup>
            )}
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
