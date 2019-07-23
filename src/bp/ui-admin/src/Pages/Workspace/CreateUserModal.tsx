import { CreatedUser, WorkspaceUser } from 'common/typings'
import React, { Component } from 'react'
import { MdGroupAdd } from 'react-icons/md'
import { connect } from 'react-redux'
import Select from 'react-select'
import AsyncSelect from 'react-select/lib/AsyncCreatable'
import { Button, FormGroup, Label, Modal, ModalBody, ModalHeader } from 'reactstrap'
import { AppState } from 'src/reducers'

import api from '../../api'
import { fetchRoles } from '../../reducers/roles'

type Props = {
  isOpen?: boolean
  toggleOpen?: () => void
  onUserAdded?: () => void
  onUserCreated?: (newUser: CreatedUser) => void
} & ReturnType<typeof mapStateToProps> & { fetchRoles }

type SelectOption<T> = { label: string; value: T; __isNew__?: boolean }

interface State {
  email: string
  users: WorkspaceUser[]
  roles: SelectOption<string>[]
  strategies: SelectOption<string>[]

  selectedUser?: SelectOption<WorkspaceUser>
  selectedOption?: SelectOption<string>
  selectedStrategy?: SelectOption<string>
  selectedRole?: SelectOption<string>

  displayStrategy: boolean
}

class CreateUserModal extends Component<Props, State> {
  private emailInput!: HTMLInputElement
  private formEl: any

  readonly state: State = {
    email: '',
    roles: [],
    users: [],
    strategies: [],
    displayStrategy: false
  }

  componentDidMount() {
    // tslint:disable-next-line: no-floating-promises
    this.loadStrategies()
    // tslint:disable-next-line: no-floating-promises
    this.loadUsers()
    this.loadRoles()
  }

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.isOpen && this.props.isOpen) {
      this.emailInput.focus()
    }

    if (!prevProps.roles.length && this.props.roles.length) {
      this.loadRoles()
    }
  }

  private loadRoles() {
    if (!this.props.roles.length) {
      return this.props.fetchRoles()
    }

    const roles = this.props.roles.map(x => ({ value: x.id, label: x.id }))
    this.setState({ roles, selectedRole: roles[0] })
  }

  async loadStrategies() {
    const { data } = await api.getAnonymous().get('/auth/config')
    this.setState({ strategies: data.payload.strategies.map(x => ({ label: x.strategyId, value: x.strategyId })) })
  }

  async loadUsers() {
    const { data } = await api.getSecured().get('/admin/users/listAvailableUsers')
    this.setState({ users: data.payload })
  }

  createUser = async e => {
    e.preventDefault()

    const { selectedUser, selectedStrategy, selectedRole } = this.state
    if (!selectedUser || !selectedStrategy || !selectedRole || !this.isFormValid()) {
      return
    }

    if (selectedUser!['__isNew__']) {
      const { data } = await api.getSecured().post('/admin/users', {
        email: selectedUser.value,
        strategy: selectedStrategy.value,
        role: selectedRole.value
      })

      this.props.onUserCreated && this.props.onUserCreated(data.payload)
    } else {
      const { email, strategy } = selectedUser.value
      await api.getSecured().post('/admin/users/workspace/add', { email, strategy, role: selectedRole.value })
      this.props.onUserAdded && this.props.onUserAdded()
    }
  }

  isFormValid = () => this.formEl && this.formEl.checkValidity()

  findUsers = async (inputValue: string) => {
    if (!inputValue.length || !this.state.users) {
      return
    }

    const searchString = inputValue.toLowerCase()
    return this.state.users
      .filter(x => x.email.toLowerCase().includes(searchString))
      .map((user: any) => {
        return { label: `${user.email} (${user.strategy})`, value: user }
      })
  }

  handleUserChanged = selectedUser => {
    if (!this.state.strategies) {
      return
    }
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
        ref={(input: any) => {
          this.emailInput = input
        }}
        value={this.state.selectedOption}
        loadOptions={this.findUsers}
        onChange={this.handleUserChanged}
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
                <Select
                  options={this.state.strategies}
                  onChange={this.handleStrategyChanged}
                  value={this.state.selectedStrategy}
                />
              </FormGroup>
            )}
            <FormGroup>
              <Label for="role">Role</Label>
              <Select
                options={this.props.roles.map(x => ({ value: x.id, label: x.id }))}
                onChange={selectedRole => this.setState({ selectedRole })}
                value={this.state.selectedRole}
              />
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

const mapStateToProps = (state: AppState) => ({
  roles: state.roles.roles
})

const mapDispatchToProps = {
  fetchRoles
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateUserModal)
