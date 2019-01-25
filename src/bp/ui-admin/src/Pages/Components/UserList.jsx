import React, { Component } from 'react'
import { Collapse, Badge, DropdownItem, UncontrolledButtonDropdown, DropdownToggle, DropdownMenu } from 'reactstrap'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { fetchUsers } from '../../reducers/user'
import { fetchRoles } from '../../reducers/roles'
import moment from 'moment'
import LoadingSection from '../Components/LoadingSection'
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from 'react-icons/lib/md'
import GravatarImage from './GravatarImage'

class UserList extends Component {
  state = {
    needRefresh: false
  }

  componentDidMount() {
    this.props.fetchUsers()
    this.props.fetchRoles()
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

  renderActionButton(user) {
    return (
      <UncontrolledButtonDropdown>
        <DropdownToggle caret outline color="secondary" size="sm">
          More
        </DropdownToggle>
        <DropdownMenu>
          {this.props.actions.map((action, idx) => {
            return (
              <DropdownItem
                color={action.type ? action.type : 'link'}
                size="sm"
                key={idx}
                onClick={() => {
                  action.onClick(user)
                  if (action.needRefresh) {
                    this.setState({ needRefresh: true })
                  }
                }}
              >
                {action.label}
              </DropdownItem>
            )
          })}
        </DropdownMenu>
      </UncontrolledButtonDropdown>
    )
  }

  renderUsersForRole(users, roleId) {
    return (
      <Collapse isOpen={this.state[roleId]}>
        <div className="bp_table">
          {users.map(user => {
            return (
              <div className="bp_table-row bp_users-list" key={'user-' + user.email}>
                {user.email !== this.props.profile.email && this.renderActionButton(user)}
                <GravatarImage email={user.email} size="md" className="pullLeft" />
                <div className="pullLeft details">
                  <div className="nameZone">
                    {user.firstname}
                    &nbsp;
                    {user.lastname}
                  </div>

                  <p>
                    <span className="field">
                      <b>Email: </b>
                      {user.email}
                    </span>
                    <span className="field">
                      <b>Last Login: </b>
                      {user.last_logon ? moment(user.last_logon).fromNow() : 'never'}
                    </span>
                    <span className="field">
                      <b>Joined: </b>
                      {moment(user.created_on).fromNow()}
                    </span>
                  </p>
                </div>
                <div style={{ clear: 'both' }} />
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
        <div onClick={() => this.toggle(role.id)} className="bp_users-role_header">
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
  users: state.user.items,
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
