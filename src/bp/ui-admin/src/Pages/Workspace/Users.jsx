import React, { Component } from 'react'
import { connect } from 'react-redux'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { Button, Modal, Input, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import { MdGroupAdd } from 'react-icons/lib/md'
import Joi from 'joi-browser'
import UserList from '../Components/UserList'
import SectionLayout from '../Layouts/Section'
import api from '../../api'
import { fetchUsers } from '../../reducers/user'
import { fetchRoles } from '../../reducers/roles'
import CreateUserModal from './CreateUserModal'

const UserEmailValidationSchema = Joi.string()
  .email()
  .trim()

class List extends Component {
  state = {
    isCreateUserModalOpen: false,
    isRenderEmailModalOpen: false,
    isUpdateRoleModalOpen: false,
    email: '',
    isRoleChanged: false,
    user: null,
    createUserError: null
  }

  componentDidMount() {
    this.loadAuthStrategy()
    this.props.fetchRoles()
  }

  loadAuthStrategy = async () => {
    const { data } = await api.getAnonymous().get('/auth/config')
    this.setState({ authStrategy: data.payload.strategy })
  }

  toggleCreateUserModalOpen = () => {
    this.setState({ isCreateUserModalOpen: !this.state.isCreateUserModalOpen, email: '', error: null })
  }

  toggleRenderEmailModal = () => {
    this.setState({ isRenderEmailModalOpen: !this.state.isRenderEmailModalOpen })
  }

  toggleUpdateUserModal = user => {
    const toggle = !this.state.isUpdateRoleModalOpen
    if (user) {
      this.setState({ isUpdateRoleModalOpen: toggle, user })
    } else {
      this.setState({ isUpdateRoleModalOpen: toggle })
    }
  }

  onInputKeyPress = e => e.key === 'Enter' && this.createUser()

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
      Email: ${this.state.email}
      Password: ${createdUser.tempPassword}`

    this.setState({
      isCreateUserModalOpen: false,
      isRenderEmailModalOpen: true,
      emailSubject: 'Account creation successful',
      emailMessage: message
    })

    // TODO replace this fetch by adding an action & add the created user in the store
    this.props.fetchUsers()
  }

  async resetPassword(user) {
    if (window.confirm(`Are you sure you want to reset ${user.email}'s password?`)) {
      const {
        data: { payload }
      } = await api.getSecured().get(`/admin/users/reset/${user.email}`)

      const message = `Your password has been reset.
     
Email: ${user.email}
Password: ${payload.tempPassword}`

      this.setState({
        isRenderEmailModalOpen: true,
        emailSubject: 'Password reset',
        emailMessage: message,
        createUserError: null
      })
    }
  }

  async deleteUser(user) {
    if (window.confirm(`Are you sure you want to delete ${user.email}'s account?`)) {
      await api.getSecured().delete(`/admin/users/${user.email}`)
    }
  }

  updateUser = async () => {
    const user = this.state.user
    await api.getSecured().put(`/admin/users/${user.email}`, user)
    this.setState({ isRoleChanged: false, isUpdateRoleModalOpen: false, user: null }, this.props.fetchUsers)
  }

  onRoleChange = event => {
    const role = event.target.value
    this.setState({ user: { ...this.state.user, role }, isRoleChanged: true })
  }

  onCopy = () => {
    this.setState({ copied: true })
    window.setTimeout(() => {
      this.setState({ copied: false })
    }, 750)
  }

  renderUpdateUserModal() {
    return (
      <Modal isOpen={this.state.isUpdateRoleModalOpen} toggle={this.toggleUpdateUserModal}>
        <ModalHeader toggle={this.toggleUpdateUserModal}>Change Role</ModalHeader>
        <ModalBody>
          <Input type="select" defaultValue={this.state.user && this.state.user.role} onChange={this.onRoleChange}>
            {this.props.roles.map(role => {
              return (
                <option value={role.id} key={'role-' + role.id}>
                  {role.name}
                </option>
              )
            })}
          </Input>
        </ModalBody>
        <ModalFooter>
          <Button disabled={!this.state.isRoleChanged} onClick={this.updateUser}>
            Save
          </Button>
        </ModalFooter>
      </Modal>
    )
  }

  renderEmailModal() {
    return (
      <Modal isOpen={this.state.isRenderEmailModalOpen} toggle={this.toggleRenderEmailModal}>
        <ModalHeader toggle={this.toggleRenderEmailModal}>{this.state.emailSubject}</ModalHeader>
        <ModalBody>
          <Input type="textarea" readOnly={true} style={{ height: 160 }} value={this.state.emailMessage} />
        </ModalBody>
        <ModalFooter>
          <CopyToClipboard text={this.state.emailMessage} onCopy={this.onCopy}>
            <Button>{this.state.copied ? 'Copied!' : 'Copy to clipboard'}</Button>
          </CopyToClipboard>
        </ModalFooter>
      </Modal>
    )
  }

  renderAllUsers() {
    const resetPassword = {
      label: 'Reset Password',
      type: 'link',
      onClick: user => this.resetPassword(user)
    }

    const deleteUser = {
      label: 'Delete',
      type: 'link',
      needRefresh: true,
      onClick: user => this.deleteUser(user)
    }

    const changeRole = {
      label: 'Change Role',
      type: 'link',
      needRefresh: true,
      onClick: user => this.toggleUpdateUserModal(user)
    }

    const actions =
      this.state.authStrategy === 'basic' ? [resetPassword, changeRole, deleteUser] : [changeRole, deleteUser]

    return (
      <div>
        <UserList actions={actions} detailed="true" />
      </div>
    )
  }

  renderSideMenu() {
    return (
      <div>
        <Button className="float-right" color="primary" size="sm" onClick={this.toggleCreateUserModalOpen}>
          <MdGroupAdd /> Add Collaborator
        </Button>
        <CreateUserModal
          isOpen={this.state.isCreateUserModalOpen}
          toggleOpen={this.toggleCreateUserModalOpen}
          onUserCreated={this.onUserCreated}
        />
        {this.renderEmailModal()}
        {this.renderUpdateUserModal()}
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
