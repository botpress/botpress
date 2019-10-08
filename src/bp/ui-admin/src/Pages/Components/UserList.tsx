import { Button, Callout, Menu, MenuItem, Popover, PopoverInteractionKind, Position } from '@blueprintjs/core'
import { WorkspaceUser } from 'common/typings'
import _ from 'lodash'
import moment from 'moment'
import React, { Component } from 'react'
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md'
import { connect } from 'react-redux'
import { Badge, Collapse } from 'reactstrap'
import { bindActionCreators } from 'redux'

import { fetchRoles } from '../../reducers/roles'
import { fetchUsers } from '../../reducers/user'

import LoadingSection from './LoadingSection'

export interface UserAction {
  id?: string
  icon?: JSX.Element
  label: string
  /** If refreshing users is required after the operation */
  needRefresh?: boolean
  onClick: (user: WorkspaceUser) => void
}

interface Props {
  fetchUsers: any
  fetchRoles: any
  actions: UserAction[]
  profile: any
  users: any
  loading: boolean
  roles: any
  detailed?: boolean
}

class UserList extends Component<Props> {
  state = {
    needRefresh: false
  }

  componentDidMount() {
    this.props.fetchUsers()
    !this.props.roles && this.props.fetchRoles()
  }

  componentDidUpdate() {
    if (this.state.needRefresh) {
      this.props.fetchUsers()
      this.setState({ needRefresh: false })
    }
  }

  toggle(roleId) {
    this.setState({ [roleId]: !this.state[roleId] })
  }

  renderActionButton(user: WorkspaceUser) {
    return (
      <Popover minimal position={Position.BOTTOM} interactionKind={PopoverInteractionKind.HOVER}>
        <Button id="btn-menu" rightIcon="caret-down" text="More" />
        <Menu>
          {this.props.actions.map(action => {
            return (
              <MenuItem
                key={action.label}
                id={action.id}
                text={action.label}
                icon={action.icon}
                onClick={() => {
                  action.onClick(user)
                  if (action.needRefresh) {
                    this.setState({ needRefresh: true })
                  }
                }}
              />
            )
          })}
        </Menu>
      </Popover>
    )
  }

  renderUsersForRole(users, roleId) {
    const currentUserEmail = this.props.profile && this.props.profile.email
    const showPicture = _.some(users, u => u.attributes.picture_url)

    return (
      <Collapse isOpen={this.state[roleId]}>
        <div className="bp_table">
          {users.map(user => {
            return (
              <div className="bp_table-row bp_users-list" key={'user-' + user.email}>
                <div style={{ display: 'flex' }}>
                  {showPicture && (
                    <div className="bp_users-picture">
                      <img src={user.attributes.picture_url} />
                    </div>
                  )}
                  <div className="pullLeft details">
                    <div className="nameZone">
                      {_.get(user, 'attributes.firstname', '')}
                      &nbsp;
                      {_.get(user, 'attributes.lastname', '')}
                    </div>

                    <p>
                      <span className="field">
                        <b>Email: </b>
                        {user.email} ({user.strategy})
                      </span>
                      <span className="field">
                        <b>Last Login: </b>
                        {user.attributes.last_logon ? moment(user.attributes.last_logon).fromNow() : 'never'}
                      </span>
                      <span className="field">
                        <b>Joined: </b>
                        {moment(user.attributes.created_at || user.attributes.createdOn).fromNow()}
                      </span>
                    </p>
                  </div>
                </div>
                <div>{user.email !== currentUserEmail && this.renderActionButton(user)}</div>
              </div>
            )
          })}
        </div>
      </Collapse>
    )
  }

  renderRole(users, role) {
    return (
      <div key={'role-' + role.id}>
        <div onClick={() => this.toggle(role.id)} id={`div-role-${role.id}`} className="bp_users-role_header">
          <div className="role float-left">
            <Badge pill color="light">
              {users.length}
            </Badge>
            <span className="title">{role.name}</span>
          </div>
          {this.state[role.id] ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
        </div>
        {this.renderUsersForRole(users, role.id)}
      </div>
    )
  }

  renderPage() {
    if (!this.props.users.length) {
      return <Callout title="This workspace has no collaborators, yet" style={{ textAlign: 'center' }} />
    }

    return (
      <div className="bp_users-container">
        {this.props.roles.map(role => {
          const users = this.props.users.filter(user => user.role === role.id)
          return users.length ? this.renderRole(users, role) : null
        })}
      </div>
    )
  }

  render() {
    const renderLoading = () => <LoadingSection />
    return !this.props.users || this.props.loading ? renderLoading() : this.renderPage()
  }
}

const mapStateToProps = state => ({
  profile: state.user.profile,
  roles: state.roles.roles,
  users: state.user.users,
  loading: state.user.loadingUsers
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      fetchUsers,
      fetchRoles
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserList)
