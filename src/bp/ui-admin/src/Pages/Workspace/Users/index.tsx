import { Button, Icon } from '@blueprintjs/core'
import { AuthStrategyConfig, WorkspaceUser } from 'common/typings'
import Joi from 'joi-browser'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { toastFailure, toastSuccess } from '~/utils/toaster'

import api from '../../../api'
import { fetchRoles } from '../../../reducers/roles'
import { fetchUsers } from '../../../reducers/user'
import UserList from '../../Components/UserList'
import SectionLayout from '../../Layouts/Section'

import ChangeUserRoleModal from './ChangeUserRoleModal'
import CreateUserModal from './CreateUserModal'
import ShowInfoModal from './ShowInfoModal'

const UserEmailValidationSchema = Joi.string()
  .email()
  .trim()

interface Props {
  fetchRoles: any
  fetchUsers: any
  roles: any
}

interface State {
  isCreateUserModalOpen: boolean
  isRenderEmailModalOpen: boolean
  isUpdateRoleModalOpen: boolean
  user: WorkspaceUser | null
  authStrategies: AuthStrategyConfig[]
  infoTitle: string
  infoMessage: string
  email: string
  createUserError: any
  canCreateUser: any
}

class List extends Component<Props, State> {
  state: State = {
    isCreateUserModalOpen: false,
    isRenderEmailModalOpen: false,
    isUpdateRoleModalOpen: false,
    email: '',
    authStrategies: [],
    user: null,
    createUserError: null,
    canCreateUser: null,
    infoTitle: '',
    infoMessage: ''
  }

  componentDidMount() {
    // tslint:disable-next-line: no-floating-promises
    this.loadAuthStrategy()
    this.props.fetchRoles()
  }

  loadAuthStrategy = async () => {
    const { data } = await api.getAnonymous().get('/auth/config')
    this.setState({ authStrategies: data.payload.strategies })
  }

  toggleCreateUserModalOpen = () => {
    this.setState({ isCreateUserModalOpen: !this.state.isCreateUserModalOpen, email: '' })
  }

  toggleRenderEmailModal = () => {
    this.setState({ isRenderEmailModalOpen: !this.state.isRenderEmailModalOpen })
  }

  toggleUpdateUserModal = (user?: any) => {
    this.setState({ isUpdateRoleModalOpen: !this.state.isUpdateRoleModalOpen, user })
  }

  onNewUserEmailChange = event => {
    const { error } = Joi.validate(event.target.value, UserEmailValidationSchema)

    this.setState({
      email: event.target.value,
      canCreateUser: !error,
      createUserError: error
    })
  }

  onUserCreated = createdUser => {
    const message = `Your botpress account is ready!

Sign-in here: ${window.location.origin}/admin/login
Email: ${createdUser.email}
Password: ${createdUser.tempPassword}`

    this.setState({
      isCreateUserModalOpen: false,
      isRenderEmailModalOpen: true,
      infoTitle: 'Account created',
      infoMessage: message
    })

    // TODO replace this fetch by adding an action & add the created user in the store
    this.props.fetchUsers()
  }

  handleUserAdded = () => {
    this.setState({ isCreateUserModalOpen: false })
    this.props.fetchUsers()
  }

  handleUserUpdated = () => {
    this.setState({ isUpdateRoleModalOpen: false })
    this.props.fetchUsers()
  }

  async resetPassword(user: WorkspaceUser) {
    const strategy = this.state.authStrategies.find(x => x.strategyId === user.strategy)
    if (!strategy || strategy.strategyType !== 'basic') {
      toastFailure(`Only users using basic authentication can have their password reset using this tool.`)
      return
    }

    if (window.confirm(`Are you sure you want to reset ${user.email}'s password?`)) {
      const {
        data: { payload }
      } = await api.getSecured().get(`/admin/users/reset/${user.strategy}/${user.email}`)

      const message = `Your password has been reset.

Email: ${user.email}
Password: ${payload.tempPassword}`

      this.setState({
        isRenderEmailModalOpen: true,
        infoTitle: 'Password reset',
        infoMessage: message
      })
    }
  }

  async removeUser(user) {
    if (!window.confirm(`Are you sure you want to remove ${user.email} from this workspace?`)) {
      return
    }

    try {
      await api.getSecured().delete(`/admin/users/workspace/remove/${user.strategy}/${user.email}`)
      toastSuccess(`User ${user.email} was removed from workspace successfully`)
      this.props.fetchUsers()
    } catch (err) {
      toastFailure(`Could not remove user from workspace: ${err.message}`)
    }
  }

  async deleteUser(user) {
    if (!window.confirm(`Are you sure you want to delete ${user.email}'s account?`)) {
      return
    }

    try {
      await api.getSecured().delete(`/admin/users/${user.strategy}/${user.email}`)
      toastSuccess(`User ${user.email} was deleted successfully`)
      this.props.fetchUsers()
    } catch (err) {
      toastFailure(`Could not delete user: ${err.message}`)
    }
  }

  renderAllUsers() {
    const resetPassword = {
      id: 'btn-resetPassword',
      icon: <Icon icon="key" />,
      label: 'Reset Password',
      onClick: user => this.resetPassword(user)
    }

    const deleteUser = {
      id: 'btn-deleteUser',
      icon: <Icon icon="delete" />,
      label: 'Delete',
      onClick: user => this.deleteUser(user)
    }

    const removeUser = {
      id: 'btn-removeUser',
      icon: <Icon icon="remove" />,
      label: 'Remove from workspace',
      onClick: user => this.removeUser(user)
    }

    const changeRole = {
      id: 'btn-changeRole',
      icon: <Icon icon="people" />,
      label: 'Change Role',
      onClick: user => this.toggleUpdateUserModal(user)
    }

    return (
      <div>
        <UserList actions={[resetPassword, changeRole, deleteUser, removeUser]} detailed={true} />
      </div>
    )
  }

  renderSideMenu() {
    return (
      <div>
        <Button
          id="btn-create"
          style={{ width: 160 }}
          text="Add collaborator"
          icon="add"
          onClick={this.toggleCreateUserModalOpen}
        />

        <CreateUserModal
          isOpen={this.state.isCreateUserModalOpen}
          toggleOpen={this.toggleCreateUserModalOpen}
          onUserCreated={this.onUserCreated}
          onUserAdded={this.handleUserAdded}
        />

        <ShowInfoModal
          isOpen={this.state.isRenderEmailModalOpen}
          toggle={this.toggleRenderEmailModal}
          message={this.state.infoMessage}
          title={this.state.infoTitle}
        />

        <ChangeUserRoleModal
          isOpen={this.state.isUpdateRoleModalOpen}
          toggle={this.toggleUpdateUserModal}
          roles={this.props.roles}
          user={this.state.user}
          onUserUpdated={this.handleUserUpdated}
        />
      </div>
    )
  }

  render() {
    return (
      <SectionLayout
        title="Collaborators"
        helpText="Create, delete users or update their role."
        activePage="users"
        mainContent={this.renderAllUsers()}
        sideMenu={this.renderSideMenu()}
      />
    )
  }
}

const mapStateToProps = state => ({
  loading: state.user.loadingUsers,
  roles: state.roles.roles
})

const mapDispatchToProps = { fetchUsers, fetchRoles }

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(List)
