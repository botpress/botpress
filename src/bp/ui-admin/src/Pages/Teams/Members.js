import React, { Component, Fragment } from 'react'
import { find } from 'lodash'

import { MdPersonAdd } from 'react-icons/lib/md'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import moment from 'moment'
import { checkRule } from '@botpress/util-roles'
import _ from 'lodash'

import {
  ListGroup,
  ListGroupItemHeading,
  ListGroupItem,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Col,
  Row
} from 'reactstrap'

import Select from 'react-select'
import UserList from '../Components/UserList'
import { fetchTeamData } from '../../modules/teams'
import { fetchPermissions } from '../../modules/user'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'

import api from '../../api'

class Members extends Component {
  state = {
    isAddUsersModalOpen: false,
    changeRoleMember: null,
    newUserRole: ''
  }

  toggleAddUsers = () => {
    this.setState({ isAddUsersModalOpen: !this.state.isAddUsersModalOpen })
  }

  renderLoading() {
    return <LoadingSection />
  }

  fetchTeamData = () => {
    this.props.fetchTeamData(this.props.teamId, { members: true, roles: true })
  }

  componentDidMount() {
    this.fetchTeamData()
    this.props.fetchPermissions(this.props.teamId)
  }

  componentDidUpdate(prevProps) {
    if ((!this.props.members && !this.props.loading) || prevProps.teamId !== this.props.teamId) {
      this.fetchTeamData()
    }
    if (prevProps.teamId !== this.props.teamId) {
      this.props.fetchPermissions(this.props.teamId)
    }
  }

  removeMember = async username => {
    if (window.confirm("Are you sure you want to remove this member form the team? This can't be undone.")) {
      await api.getSecured().delete(`/api/teams/${this.props.teamId}/members/${username}`)
      await this.props.fetchTeamData(this.props.teamId)
    }
  }

  onCopy = () => {
    this.setState({ copied: true })
    window.setTimeout(() => {
      this.setState({ copied: false })
    }, 750)
  }

  addMember = async user => {
    await api.getSecured().post(`/api/teams/${this.props.teamId}/members/${user.username}`, { role: 'default' })
    await this.props.fetchTeamData(this.props.teamId)
  }

  renderAddUserModal() {
    const groupMembers = _.map(this.props.members, 'id')
    const actions = [
      {
        label: 'Add',
        type: 'primary',
        needRefresh: true,
        onClick: user => this.addMember(user)
      }
    ]

    return (
      <Modal isOpen={this.state.isAddUsersModalOpen} toggle={this.toggleAddUsers}>
        <ModalHeader toggle={this.toggleAddUsers}>Add users to this team</ModalHeader>
        <ModalBody>
          <UserList actions={actions} detailed="false" ignoreUsers={groupMembers} refresh={this.refreshUsers} />
        </ModalBody>
      </Modal>
    )
  }

  currentUserHasPermission = (resource, operation) => {
    if (!this.props.currentUserPermissions) {
      return false
    }
    return checkRule(this.props.currentUserPermissions, operation, resource)
  }

  renderMemberMenu(member) {
    const actions = []

    if (this.currentUserHasPermission('admin.team.members', 'write')) {
      if (member.role === 'owner') {
        actions.push(
          <Button
            key="remove"
            color="link"
            className="text-muted disabled"
            title="You cannot remove the team owner"
            onClick={() => alert('You cannot remove the team owner.')}
          >
            Remove
          </Button>
        )
      } else {
        actions.push(
          <Button key="remove" color="link" onClick={() => this.removeMember(member.username)}>
            Remove
          </Button>
        )
      }
    }

    if (!actions.length) {
      return null
    }

    return <Fragment>{actions}</Fragment>
  }

  changeMemberRole = () => {
    const member = this.state.changeRoleMember
    const role = this.state.newUserRole

    api
      .getSecured()
      .patch(`/api/teams/${this.props.teamId}/members/${member.username}`, { role })
      .then(() => {
        this.setState({ changeRoleMember: null, newUserRole: '' })
      })
      .then(this.fetchTeamData)
  }

  openChangeMemberRole = member => () => {
    if (member.role !== 'owner') {
      this.setState({ changeRoleMember: member, newUserRole: member.role })
    }
  }

  toggleChangeMemberRole = () => {
    this.setState(({ changeRoleMember }) => ({ changeRoleMember: !changeRoleMember }))
  }

  renderMemberRole(member) {
    const role = find(this.props.roles, { name: member.role })
    const title = [role && role.description, member.role !== 'owner' && 'Click to change.'].filter(Boolean).join('. ')
    return (
      <abbr data-title={title} onClick={this.openChangeMemberRole(member)}>
        {member.role || <em>(no role)</em>}
      </abbr>
    )
  }

  onNewUserRoleChange = ({ value }) => {
    this.setState({ newUserRole: value })
  }

  renderChangeUserRoleModal() {
    if (!this.props.roles) {
      return null
    }
    const member = this.state.changeRoleMember
    const options = [
      {
        label: <em>(no role)</em>,
        value: ''
      }
    ]
      .concat(
        this.props.roles.map(({ name }) => ({
          label: name,
          value: name
        }))
      )
      .filter(({ value }) => value !== 'owner' && value !== (member && member.role))

    return (
      <Modal isOpen={!!member} toggle={this.toggleChangeMemberRole}>
        <ModalHeader toggle={this.toggleChangeMemberRole}>Change role for user {member && member.username}</ModalHeader>
        <ModalBody>
          <Select options={options} value={this.state.newUserRole} onChange={this.onNewUserRoleChange} />
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={this.changeMemberRole}>
            Save
          </Button>
        </ModalFooter>
      </Modal>
    )
  }

  renderMembers() {
    const { members } = this.props

    return (
      <div className="members">
        <Row>
          <Col xs={12} md={8}>
            <ListGroup>
              {members.map(member => {
                const joinedAgo = moment(member.joinedAt).fromNow()
                return (
                  <ListGroupItem key={`user-${member.id}`}>
                    <ListGroupItemHeading>
                      <img className="list-group-item__avatar" alt="" width="32" height="32" src={member.picture} />
                      <span className="title">{member.username}</span>
                    </ListGroupItemHeading>
                    <div className="list-group-item__actions">{this.renderMemberMenu(member)}</div>
                    <small>
                      <b>Role:</b> {this.renderMemberRole(member)} | <b>Username:</b> {member.username} | Joined{' '}
                      {joinedAgo}
                    </small>
                  </ListGroupItem>
                )
              })}
            </ListGroup>
            {this.renderChangeUserRoleModal()}
            {this.renderAddUserModal()}
          </Col>
        </Row>
      </div>
    )
  }

  renderSideMenu() {
    if (!this.currentUserHasPermission('admin.team.members', 'write')) {
      return null
    }

    return (
      <Button className="float-right" color="primary" size="sm" onClick={this.toggleAddUsers}>
        <MdPersonAdd /> Add Users
      </Button>
    )
  }

  render() {
    if (this.props.loading || !this.props.members) {
      return this.renderLoading()
    }

    return (
      <SectionLayout
        title={`${this.props.team.name}'s members`}
        activePage="members"
        currentTeam={this.props.team}
        mainContent={this.renderMembers()}
        sideMenu={this.renderSideMenu()}
      />
    )
  }
}

const mapStateToProps = state => ({
  members: state.teams.members,
  roles: state.teams.roles,
  teamId: state.teams.teamId,
  team: state.teams.team,
  loading: state.teams.loadingTeam,
  currentUser: state.user.profile,
  currentUserPermissions: state.user.permissions[state.teams.teamId]
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      fetchTeamData,
      fetchPermissions
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Members)
