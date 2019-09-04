import { Button, Classes, Dialog, FormGroup } from '@blueprintjs/core'
import { CreatedUser, WorkspaceUser } from 'common/typings'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'
import AsyncSelect from 'react-select/lib/AsyncCreatable'
import { AppState } from 'src/reducers'

import api from '../../../api'
import { fetchRoles } from '../../../reducers/roles'

type Props = {
  isOpen?: boolean
  toggleOpen?: () => void
  onUserAdded?: () => void
  onUserCreated?: (newUser: CreatedUser) => void
} & ReturnType<typeof mapStateToProps> & { fetchRoles }

type SelectOption<T> = { label: string; value: T; __isNew__?: boolean }

interface State {
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
  private formEl: any

  readonly state: State = {
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
    if (!prevProps.roles.length && this.props.roles.length) {
      this.loadRoles()
    }
  }

  private loadRoles() {
    if (!this.props.roles.length) {
      return this.props.fetchRoles()
    }

    const roles = this.props.roles.map(x => ({ value: x.id, label: x.name }))
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

  render() {
    return (
      <Dialog
        isOpen={this.props.isOpen}
        icon="add"
        onClose={this.props.toggleOpen}
        transitionDuration={0}
        title={'Add Collaborator'}
      >
        <form ref={form => (this.formEl = form)}>
          <div className={Classes.DIALOG_BODY}>
            <FormGroup
              label="Email"
              labelFor="select-email"
              helperText="Invite an existing user, or type his e-mail address and press Enter"
            >
              <AsyncSelect
                id="select-email"
                cacheOptions
                defaultOptions
                value={this.state.selectedOption}
                loadOptions={this.findUsers}
                onChange={this.handleUserChanged}
                autoFocus={true}
              />
            </FormGroup>

            {this.state.displayStrategy && (
              <FormGroup label="Authentication Strategy" labelFor="select-strategy">
                <Select
                  id="select-strategy"
                  options={this.state.strategies}
                  onChange={this.handleStrategyChanged}
                  value={this.state.selectedStrategy}
                />
              </FormGroup>
            )}
            <FormGroup label="Role" labelFor="select-role">
              <Select
                id="select-role"
                options={this.state.roles}
                onChange={selectedRole => this.setState({ selectedRole })}
                value={this.state.selectedRole}
              />
            </FormGroup>
          </div>
          <div className={Classes.DIALOG_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button
                id="btn-submit"
                className="float-right"
                type="submit"
                onClick={this.createUser}
                text="Create account"
                disabled={!this.isFormValid()}
              />
            </div>
          </div>
        </form>
      </Dialog>
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
