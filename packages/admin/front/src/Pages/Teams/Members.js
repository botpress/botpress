import React, { Component } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { find } from 'lodash'

import { MdPersonAdd } from 'react-icons/lib/md'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import moment from 'moment'
import { checkRule } from '@botpress/util-roles'

import {
  Alert,
  ListGroup,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  ListGroupItemHeading,
  ListGroupItem,
  Button,
  InputGroup,
  InputGroupAddon,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input
} from 'reactstrap'
import Select from 'react-select'

import { fetchTeamData } from '../../modules/teams'
import { fetchPermissions } from '../../modules/user'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'
import { getMenu } from './menu'

import api from '../../api'

class Members extends Component {
  state = {
    isInviteModalOpen: false,
    changeRoleMember: null,
    newUserRole: '',
    inviteCode: null,
    inviteCodeCopied: false
  }

  toggleInviteModal = () => {
    if (!this.state.isInviteModalOpen) {
      this.fetchInviteLink()
      this.setState({ isInviteModalOpen: true, inviteCodeCopied: false })
    } else {
      this.setState({ isInviteModalOpen: false })
    }
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

  async fetchInviteLink() {
    const { data } = await api.getSecured().get(`/api/teams/${this.props.teamId}/invite`)

    if (data && data.payload && data.payload.inviteCode) {
      this.setState({ inviteCode: data.payload.inviteCode })
    }
  }

  refreshInviteLink = async () => {
    const { data } = await api.getSecured().post(`/api/teams/${this.props.teamId}/invite`)

    if (data && data.payload && data.payload.inviteCode) {
      this.setState({ inviteCode: data.payload.inviteCode })
    }
  }

  removeMember = async username => {
    if (window.confirm("Are you sure you want to remove this member form the team? This can't be undone.")) {
      await api.getSecured().delete(`/api/teams/${this.props.teamId}/members/${username}`)
      await this.props.fetchTeamData(this.props.teamId)
    }
  }

  getColorForLabel(name) {
    if (/^dev/i.test(name)) {
      return 'primary'
    } else if (/^stag/i.test(name)) {
      return 'warning'
    } else if (/^prod/i.test(name)) {
      return 'danger'
    } else {
      return 'default'
    }
  }

  onCopy = () => {
    this.setState({ copied: true })
    window.setTimeout(() => {
      this.setState({ copied: false })
    }, 750)
  }

  renderInviteModal() {
    const inviteLink = this.state.inviteCode ? `${window.location.origin}/teams/join/${this.state.inviteCode}` : null

    return (
      <Modal isOpen={this.state.isInviteModalOpen} toggle={this.toggleInviteModal}>
        <ModalHeader toggle={this.toggleInviteModal}>Invite users to this team</ModalHeader>
        <ModalBody>
          <p>Securely share this link to people you want to invite to join this team.</p>

          {this.state.inviteCode && (
            <InputGroup>
              <Input id="inviteCode" disabled value={inviteLink} />
              <InputGroupAddon addonType="append">
                <CopyToClipboard text={inviteLink} onCopy={this.onCopy}>
                  <Button>{this.state.copied ? 'Copied!' : 'Copy to clipboard'}</Button>
                </CopyToClipboard>
              </InputGroupAddon>
            </InputGroup>
          )}

          <hr />

          <Alert color="warning">
            Anybody with this link will be able to join the team. You can also{' '}
            <a href="#revoke" onClick={this.refreshInviteLink}>
              revoke this link
            </a>.
          </Alert>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={this.toggleInviteModal}>
            Done
          </Button>
        </ModalFooter>
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
    const items = []

    if (this.currentUserHasPermission('admin.team.members', 'write')) {
      if (member.role === 'owner') {
        items.push(
          <DropdownItem
            key="remove"
            className="text-muted disabled"
            title="You cannot remove the team owner"
            onClick={() => alert('You cannot remove the team owner.')}
          >
            Remove
          </DropdownItem>
        )
      } else {
        items.push(
          <DropdownItem key="remove" className="text-danger" onClick={() => this.removeMember(member.username)}>
            Remove
          </DropdownItem>
        )
      }
    }

    if (!items.length) {
      return null
    }

    return (
      <UncontrolledDropdown className="float-right">
        <DropdownToggle caret size="sm" color="link">
          More
        </DropdownToggle>
        <DropdownMenu>{items}</DropdownMenu>
      </UncontrolledDropdown>
    )
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
      <abbr title={title} onClick={this.openChangeMemberRole(member)}>
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
        <ListGroup>
          {members.map(member => {
            const joinedAgo = moment(member.joinedAt).fromNow()
            return (
              <ListGroupItem key={`user-${member.id}`}>
                <ListGroupItemHeading className="header">
                  <img alt="" width="32" height="32" src={member.picture} />
                  <span className="title">{member.fullName}</span>
                  {this.renderMemberMenu(member)}
                </ListGroupItemHeading>
                <small>
                  <b>Role</b> {this.renderMemberRole(member)} | <b>Username</b> {member.username} | Joined {joinedAgo}
                </small>
              </ListGroupItem>
            )
          })}
        </ListGroup>
        {this.renderChangeUserRoleModal()}
        {this.renderInviteModal()}
      </div>
    )
  }

  renderSideMenu() {
    if (!this.currentUserHasPermission('cloud.team.members', 'write')) {
      return null
    }

    return (
      <Button color="primary" outline onClick={this.toggleInviteModal}>
        <MdPersonAdd /> Invite Users
      </Button>
    )
  }

  render() {
    if (this.props.loading || !this.props.members) {
      return this.renderLoading()
    }

    const sections = getMenu({
      teamId: this.props.team.id,
      currentPage: 'members',
      userHasPermission: this.currentUserHasPermission
    })

    return (
      <SectionLayout
        title={`${this.props.team.name}'s members`}
        sections={sections}
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
